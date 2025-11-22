
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Project, Episode, ScriptConfig, Character, Scene } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Helpers ---

const retry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    // Retry on 500 (Internal) or 503 (Service Unavailable)
    const code = error.status || error.code;
    if (retries > 0 && (code === 500 || code === 503)) {
      console.warn(`Retrying operation... Attempts left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

// --- Schemas ---

const characterSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    age: { type: Type.STRING },
    description: { type: Type.STRING },
    imagePrompt: { type: Type.STRING, description: "Highly detailed visual prompt for generating a character portrait." },
    archetype: { type: Type.STRING, description: "The character's narrative role (e.g., The Hero, The Sage)." },
    personality: { type: Type.STRING, description: "Key personality traits." },
    colors: { type: Type.STRING, description: "Signature color palette description." },
    dob: { type: Type.STRING, description: "Approximate Date of Birth or Zodiac sign if applicable." },
  },
  required: ["name", "age", "description", "imagePrompt"],
};

const characterUpdateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    age: { type: Type.STRING },
    description: { type: Type.STRING },
    archetype: { type: Type.STRING },
    personality: { type: Type.STRING },
    colors: { type: Type.STRING },
    dob: { type: Type.STRING },
  },
};

const sceneSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    number: { type: Type.INTEGER },
    location: { type: Type.STRING },
    action: { type: Type.STRING },
    cameraAngle: { type: Type.STRING },
    startImagePrompt: { type: Type.STRING, description: "JSON STRING: Visual description of the START frame of the shot." },
    endImagePrompt: { type: Type.STRING, description: "JSON STRING: Visual description of the END frame of the shot." },
    veoPrompt: { type: Type.STRING, description: "JSON STRING: Video prompt describing the transition/motion between Start and End." },
    soundPrompt: { type: Type.STRING, description: "JSON STRING: SFX and Ambience." },
  },
  required: ["number", "location", "action", "cameraAngle", "startImagePrompt", "endImagePrompt", "veoPrompt", "soundPrompt"],
};

const projectBibleSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    projectName: { type: Type.STRING },
    premise: { type: Type.STRING, description: "A concise summary of the overall story/series." },
    characters: {
      type: Type.ARRAY,
      items: characterSchema,
    },
  },
  required: ["projectName", "premise", "characters"],
};

// Schema for the initial draft (Step 1)
const episodeDraftSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    drafts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING, description: "Detailed story plot for this episode." },
          voiceoverScript: { type: Type.STRING, description: "The full script with timestamps (e.g. '00:00 [Character]: Hello')." },
          soundAtmosphere: { type: Type.STRING }
        },
        required: ["title", "summary", "voiceoverScript"]
      }
    }
  },
  required: ["drafts"]
};

// Schema for generating scenes from draft (Step 2)
const scenesOnlySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    scenes: {
      type: Type.ARRAY,
      items: sceneSchema,
    },
  },
  required: ["scenes"],
};

// --- Functions ---

const handleError = (error: any) => {
    console.error("Gemini API Error:", error);
    // In a real app, you might toast this
};

/**
 * Step 1: Generate the "Bible" (Project info + Characters)
 * Note: This initial step usually uses a fast model.
 */
export const createProjectBible = async (idea: string, config: ScriptConfig, model: string = 'gemini-2.5-flash'): Promise<Partial<Project>> => {
  const ai = getAiClient();
  
  const prompt = `
    Act as a Showrunner. Create a Series Bible for a new video project based on: "${idea}".
    
    Configuration:
    - Mood: ${config.mood}
    - Style: ${config.style}
    - Language: ${config.language}
    
    Requirements:
    1. Create a Project Name and a compelling Premise.
    2. Define the Main Characters. Include their Role (Archetype), Personality, Signature Colors, and visual prompt.
    3. Do NOT write scenes yet. Just the setup.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: projectBibleSchema,
      },
    });

    if (!response.text) throw new Error("No data received from Gemini.");
    const data = JSON.parse(response.text);
    
    const characters = data.characters.map((c: any) => ({ ...c, id: crypto.randomUUID() }));

    return {
      name: data.projectName,
      premise: data.premise,
      characters,
    };
  } catch (error: any) {
    handleError(error);
    throw error;
  }
};

export const updateCharacterFromPrompt = async (visualPrompt: string): Promise<Partial<Character>> => {
  const ai = getAiClient();

  const prompt = `
    Analyze this character visual description/prompt and extract/infer the character details.
    Visual Prompt: "${visualPrompt}"

    Return the character profile based strictly on this description. 
    - Name: Extract if present, otherwise leave blank.
    - Age: Estimate if not specified.
    - Description: A summary based on the visual.
    - Archetype: Infer the role.
    - Personality: Infer traits.
    - Colors: Extract colors mentioned.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Info extraction is fine with Flash
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: characterUpdateSchema,
      },
    });

    if (!response.text) throw new Error("No data received.");
    return JSON.parse(response.text);
  } catch (error: any) {
    handleError(error);
    return {};
  }
};

/**
 * Rewrites character image prompts to match the new project style/mood.
 */
export const refreshProjectCharacters = async (project: Project): Promise<{id: string, imagePrompt: string}[]> => {
  const ai = getAiClient();

  const prompt = `
    The user has updated their Project Settings. You need to rewrite the 'imagePrompt' for ALL characters to strictly match the new Style and Mood.

    --- NEW SETTINGS ---
    Style: ${project.config.style}
    Mood: ${project.config.mood}

    --- CHARACTERS ---
    ${JSON.stringify(project.characters.map(c => ({ id: c.id, name: c.name, description: c.description })))}

    Requirements:
    1. Retain physical features (Age, Hair, etc.) from description.
    2. Change the artistic style keywords to match "${project.config.style}".
    3. Return a JSON Array of objects: { "id": "character_id", "imagePrompt": "New detailed prompt..." }
  `;
  
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      updatedCharacters: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            imagePrompt: { type: Type.STRING }
          }
        }
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: project.aiConfig?.textModel || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    if (!response.text) return [];
    const data = JSON.parse(response.text);
    return data.updatedCharacters || [];
  } catch (error: any) {
    handleError(error);
    return [];
  }
}

export const regeneratePremise = async (currentPremise: string, config: ScriptConfig, model: string = 'gemini-2.5-flash'): Promise<string> => {
  const ai = getAiClient();

  const prompt = `
    Rewrite and improve the following Project Premise (Plot Summary).
    Make it more engaging and strictly align it with the configured Mood and Style.
    
    Current Premise: "${currentPremise}"
    
    Target Mood: ${config.mood}
    Target Style: ${config.style}
    Language: ${config.language}
    
    Output ONLY the new premise text. No JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || currentPremise;
  } catch (error: any) {
    handleError(error);
    return currentPremise;
  }
};

/**
 * Step 2a: Generate Episode Drafts (Title, Story, Script) WITHOUT Scenes
 */
export const createEpisodeDrafts = async (
  project: Project,
  context: string,
  count: number,
  characterIds: string[] = [],
  duration: string = "60s"
): Promise<Partial<Episode>[]> => {
  const ai = getAiClient();

  const selectedNames = project.characters
    .filter(c => characterIds.includes(c.id))
    .map(c => c.name)
    .join(', ');

  const prompt = `
    Act as a Showrunner and Scriptwriter. 
    Create ${count} episode drafts for Project: "${project.name}".

    --- PROJECT CONTEXT ---
    PREMISE: ${project.premise}
    MOOD: ${project.config.mood}
    LANGUAGE: ${project.config.language}
    TARGET DURATION: ${duration} per episode.

    --- CASTING ---
    ${selectedNames ? `Focus these episodes on the following characters: ${selectedNames}.` : 'Use the main cast as appropriate.'}

    --- USER INSTRUCTION ---
    "${context}"

    Requirements for EACH episode:
    1. Title: Catchy title.
    2. Summary: Detailed story plot (Column 1).
    3. Voiceover Script: A complete dialogue/VO script with timestamps fitting the ${duration} duration. (Column 2). 
       Format example: 
       "00:00 [Music] Intro music starts.
        00:05 [Narrator] It was a dark night...
        00:15 [Hero] I see something!"
    
    Return exactly ${count} drafts.
  `;

  try {
    const response = await ai.models.generateContent({
      model: project.aiConfig?.textModel || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: episodeDraftSchema,
      },
    });

    if (!response.text) throw new Error("No drafts generated.");
    const data = JSON.parse(response.text);
    
    // Inject the characterIds into the draft so we can use them later for visual generation
    return data.drafts.map((d: any) => ({ ...d, characterIds }));
  } catch (error: any) {
    handleError(error);
    throw error;
  }
};

/**
 * Step 2b: Regenerate a single draft based on new context
 */
export const regenerateEpisodeDraft = async (
  project: Project,
  currentDraft: Partial<Episode>,
  instruction: string,
  characterIds?: string[]
): Promise<Partial<Episode>> => {
  const drafts = await createEpisodeDrafts(project, `
    Rewrite this specific episode based on new instruction: "${instruction}".
    Original Title: ${currentDraft.title}
    Original Summary: ${currentDraft.summary}
  `, 1, characterIds || currentDraft.characterIds); 
  return drafts[0];
}

/**
 * Step 3: Generate Detailed Scenes from Draft
 */
export const generateScenesFromDraft = async (
  project: Project, 
  episodeDraft: Episode,
  sceneCount: number,
  selectedCharacterIds?: string[],
  enforceConsistency: boolean = true
): Promise<Scene[]> => {
  const ai = getAiClient();

  const activeCharacters = selectedCharacterIds && selectedCharacterIds.length > 0
    ? project.characters.filter(c => selectedCharacterIds.includes(c.id))
    : project.characters;

  const characterContext = activeCharacters.map(c => `
    - Character Name: ${c.name}
    - Visual Description: ${enforceConsistency ? c.imagePrompt : c.description}
    - Signature Colors: ${c.colors || 'N/A'}
  `).join('\n');

  const prompt = `
    Act as a Professional Screenwriter and AI Visual Director.
    Convert this Episode Script into a detailed ${sceneCount}-scene breakdown.

    --- PROJECT CONTEXT ---
    Style: ${project.config.style}
    Mood: ${project.config.mood}
    AspectRatio: ${project.config.aspectRatio}
    Language: ${project.config.language}

    --- EPISODE DATA ---
    Title: ${episodeDraft.title}
    Story: ${episodeDraft.summary}
    Script Timeline: 
    "${episodeDraft.voiceoverScript}"

    --- CAST (VISUALS) ---
    ${characterContext}

    --- INSTRUCTIONS ---
    Break the script down into ${sceneCount} visual scenes.
    
    For each scene, generate valid JSON STRINGS for these fields:
    1. **startImagePrompt**: { description, project_context: { style, mood }, characters_in_scene: [{name, visual_prompt_snippet}], technical } - Describe the START frame of the shot.
    2. **endImagePrompt**: { description, project_context: { style, mood }, characters_in_scene: [{name, visual_prompt_snippet}], technical } - Describe the END frame of the shot (how it changes).
    3. **veoPrompt**: { prompt, motion, style, mood } - Describe the transition/motion between start and end.
    4. **soundPrompt**: { sfx, ambience, music_cue }
    
    IMPORTANT: For 'veoPrompt', generate a simple initial prompt. The user will use the "Regenerate Veo3" feature for the advanced professional JSON format later.

    Ensure the flow matches the provided Script Timeline perfectly.
  `;

  try {
    const response = await ai.models.generateContent({
      model: project.aiConfig?.textModel || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: scenesOnlySchema,
      },
    });

    if (!response.text) throw new Error("No scenes generated.");
    const data = JSON.parse(response.text);
    
    return data.scenes.map((s: any) => ({ ...s, id: crypto.randomUUID() }));

  } catch (error: any) {
    handleError(error);
    throw error;
  }
};

export const regenerateScenes = async (
  project: Project,
  currentScenes: Scene[], 
  instruction: string
): Promise<Scene[]> => {
  const ai = getAiClient();

  const characterContext = project.characters.map(c => `
    - ${c.name}: ${c.imagePrompt}
  `).join('\n');

  const prompt = `
    Act as a Script Editor. Rewrite these scenes based on a new instruction.
    
    --- PROJECT SETTINGS ---
    Style: ${project.config.style}
    Mood: ${project.config.mood}
    Language: ${project.config.language}
    
    --- CAST VISUALS ---
    ${characterContext}

    --- CURRENT SCENES ---
    ${JSON.stringify(currentScenes)}
    
    --- NEW INSTRUCTION ---
    "${instruction}"
    
    --- OUTPUT RULES ---
    1. Update 'action' based on instruction.
    2. ALL PROMPT FIELDS (startImagePrompt, endImagePrompt, veoPrompt, soundPrompt) MUST BE VALID JSON STRINGS containing project context.
    
    Return ONLY the new list of scenes in JSON.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      scenes: {
        type: Type.ARRAY,
        items: sceneSchema
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: project.aiConfig?.textModel || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    if (!response.text) throw new Error("No data received.");
    const data = JSON.parse(response.text);
    
    return data.scenes.map((s: any) => ({ ...s, id: crypto.randomUUID() }));

  } catch (error) {
    handleError(error);
    throw error;
  }
};

// Helper to parse JSON prompt if needed
const parsePrompt = (prompt: string) => {
  try {
    return JSON.parse(prompt);
  } catch (e) {
    return null;
  }
};

export const generateImage = async (prompt: string, aspectRatio: string = '16:9', model: string = 'imagen-4.0-generate-001'): Promise<string> => {
  const ai = getAiClient();
  
  let finalPrompt = prompt;
  const parsed = parsePrompt(prompt);

  // If prompt is a JSON string, we need to flatten it into a descriptive string for Imagen/GenAI
  if (parsed) {
    let builtPrompt = parsed.description || parsed.visual_description || "";
    
    if (parsed.characters_in_scene && Array.isArray(parsed.characters_in_scene)) {
        const charDetails = parsed.characters_in_scene.map((c: any) => `${c.name} (${c.visual_prompt_snippet || c.visual_desc})`).join(", ");
        builtPrompt += ` Characters: [${charDetails}].`;
    } else if (parsed.characters && Array.isArray(parsed.characters)) {
        const charDetails = parsed.characters.map((c: any) => `${c.name} (${c.visual_desc})`).join(", ");
        builtPrompt += ` Characters: [${charDetails}].`;
    }

    const ctx = parsed.project_context || parsed.project_settings || {};
    if (ctx.style) builtPrompt += ` Style: ${ctx.style}.`;
    if (ctx.mood) builtPrompt += ` Mood: ${ctx.mood}.`;
    
    if (parsed.technical) {
        const tech = Object.values(parsed.technical).join(", ");
        builtPrompt += ` Technical: ${tech}.`;
    }

    finalPrompt = builtPrompt;
  }

  return retry(async () => {
    try {
        // 1. Use Imagen
        if (model.includes('imagen')) {
            const response = await ai.models.generateImages({
                model: model,
                prompt: finalPrompt,
                config: {
                    numberOfImages: 1,
                    aspectRatio: aspectRatio as any,
                    outputMimeType: 'image/jpeg'
                }
            });
            const b64 = response.generatedImages?.[0]?.image?.imageBytes;
            if (!b64) throw new Error("No image data");
            return `data:image/jpeg;base64,${b64}`;
        } 
        // 2. Use Gemini Nano/Flash (Fallback logic for aspect ratios)
        else {
            // Gemini models only support specific ratios, fallback if needed
            // Supported: "1:1", "3:4", "4:3", "9:16", "16:9"
            // Not supported: "21:9"
            let safeRatio = aspectRatio;
            if (aspectRatio === '21:9') safeRatio = '16:9'; // fallback

            const imageConfig: any = {
                aspectRatio: safeRatio
            };
            
            // Only add imageSize for Pro model, as 'imageSize' param is not supported on flash/nano models and will error
            if (model === 'gemini-3-pro-image-preview') {
                imageConfig.imageSize = "1K";
            }

            const response = await ai.models.generateContent({
                model: model, // e.g., 'gemini-2.5-flash-image'
                contents: {
                    parts: [{ text: finalPrompt }]
                },
                config: {
                    imageConfig: imageConfig
                }
            });

            // Extract image from content parts
            if (response.candidates && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
            throw new Error("No image generated by Gemini model");
        }

    } catch (error: any) {
        handleError(error);
        throw error;
    }
  });
};

/**
 * Professional Veo 3 Prompt Generator (Strict JSON)
 * Now considers START and END contexts.
 */
export const generateVeoPrompt = async (
  sceneContext: Scene,
  project: Project,
  selectedCharacterIds?: string[],
  startImageUrl?: string,
  endImageUrl?: string
): Promise<string> => {
    const ai = getAiClient();

    const activeCharacters = selectedCharacterIds && selectedCharacterIds.length > 0
    ? project.characters.filter(c => selectedCharacterIds.includes(c.id))
    : project.characters;

    const charMap = activeCharacters.reduce((acc, c) => {
        acc[c.name] = c.imagePrompt;
        return acc;
    }, {} as Record<string, string>);

    const promptText = `
        Generate a highly detailed, professional JSON prompt for Google Veo 3 Video Generation.
        
        You are generating a prompt to animate a transition from a START FRAME to an END FRAME.
        
        Target Scene:
        - Location: ${sceneContext.location}
        - Action: ${sceneContext.action}
        - Camera: ${sceneContext.cameraAngle}
        - Project Style: ${project.config.style}
        - Project Mood: ${project.config.mood}
        - Aspect Ratio: ${project.config.aspectRatio}
        
        Visual Context:
        - Start Frame Description: ${sceneContext.startImagePrompt}
        - End Frame Description: ${sceneContext.endImagePrompt}
        
        Characters in Project (Use these descriptions EXACTLY in the JSON under 'subject.character'):
        ${JSON.stringify(charMap, null, 2)}

        OUTPUT FORMAT:
        Strictly output a JSON object matching the Veo 3 schema. Do not wrap in markdown blocks.

        Schema Template:
        {
            "scene": {
                "camera": { "type": "string", "angle": "string", "motion": "string", "focus": "string", "aspect_ratio": "${project.config.aspectRatio}" },
                "subject": {
                    "character": { 
                        // Map character names to their FULL visual descriptions here
                    },
                    "appearance": "string",
                    "expression": "string",
                    "accessories": "string"
                },
                "props": { "main_props": "string", "secondary_props": "string", "environment_props": "string" },
                "setting": { "location": "string", "time": "string", "background": "string", "atmosphere": "string" },
                "lighting": { "style": "string", "mood": "string", "shadows": "string" }
            },
            "audio": { "voice": "string", "action_sounds": "string", "environmental": "string", "music": "string", "ambience": "string" },
            "style": { "genre": "string", "mood": "string", "visual_style": "string", "pacing": "string", "aspect_ratio": "${project.config.aspectRatio}" },
            "no_subtitles": true,
            "no_captions": true,
            "no_text_overlay": true,
            "action": { "primary_action": "string", "secondary_actions": "string", "interaction": "string", "timing": "string", "pacing": "string" },
            "dialogue": { "speech": "string", "tone": "string", "lip_sync": "string", "no_subtitles": true, "no_captions": true, "no_text_overlay": true }
        }
    `;

    const parts: any[] = [{ text: promptText }];

    // Attach Multimodal Images if available
    if (startImageUrl) {
        const match = startImageUrl.match(/^data:(.+);base64,(.+)$/);
        if (match) {
            parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
            parts.push({ text: "This is the START FRAME visual reference." });
        }
    }
    if (endImageUrl) {
        const match = endImageUrl.match(/^data:(.+);base64,(.+)$/);
        if (match) {
            parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
            parts.push({ text: "This is the END FRAME visual reference." });
        }
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts },
            config: {
               responseMimeType: 'application/json'
            }
        });

        if (!response.text) throw new Error("No Veo prompt generated.");
        return response.text;

    } catch (error: any) {
        handleError(error);
        throw error;
    }
};


export interface Character {
  id: string;
  name: string;
  age: string;
  description: string;
  imagePrompt: string;
  imageUrl?: string; 
  // New fields
  dob?: string; // Date of Birth
  personality?: string;
  colors?: string; // Signature colors
  archetype?: string; // Role/Archetype
}

export interface Scene {
  id: string;
  number: number;
  location: string;
  action: string;
  cameraAngle: string;
  
  // Updated for Start/End Frame logic
  startImagePrompt: string;
  endImagePrompt: string;
  
  startImageUrl?: string;
  endImageUrl?: string;

  veoPrompt: string;
  soundPrompt: string;
  // Removed subtitle, voiceOver, single imagePrompt/Url
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | '21:9' | '4:3';

export interface ScriptConfig {
  aspectRatio: AspectRatio;
  hasDialogue: boolean;
  language: string;
  duration: string; // Changed to free text input
  mood: string;
  style: string;
}

export interface AiConfig {
  textModel: string; // e.g., 'gemini-2.5-flash', 'gemini-3-pro-preview'
  imageModel: string; // e.g., 'imagen-4.0-generate-001', 'gemini-2.5-flash-image'
}

export interface Episode {
  id: string;
  title: string;
  summary: string;
  voiceoverScript?: string; // New field for the full script timeline
  soundAtmosphere?: string; // New field for Overall Episode Sound
  characterIds?: string[]; // IDs of characters booked for this episode
  scenes: Scene[];
  createdAt: number;
}

export interface Project {
  id: string;
  name: string; // Project Name
  premise: string; // Overall story idea
  config: ScriptConfig;
  aiConfig: AiConfig; // New field for AI Model settings
  characters: Character[];
  episodes: Episode[];
  createdAt: number;
}

export interface GenerateProjectInput {
  idea: string;
  config: ScriptConfig;
}

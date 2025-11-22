
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Project, Episode, ScriptConfig, Scene, Character, AiConfig } from './types';
import * as GeminiService from './services/geminiService';

// --- Constants ---
const MOODS = [
  'Cinematic', 'Funny', 'Emotional', 'Dark', 'Corporate', 
  'Horror', 'Sci-Fi', 'Cyberpunk', 'Noir', 'Documentary', 
  'Music Video', 'Ghibli-esque', 'Wes Anderson', '80s Retro', 'Minimalist',
  'Epic', 'Thriller', 'Romance', 'Mystery', 'Fantasy', 
  'Dreamy', 'Gritty', 'Whimsical', 'Tense', 'Hopeful'
];

const STYLES = [
  'Photorealistic', 'Anime', '3D Render', 'Sketch', 
  'Unreal Engine 5', 'Claymation', 'Watercolor', 'Cyberpunk Neon', 
  '1980s VHS', 'Line Art', 'Pixel Art', 'Oil Painting',
  'Pixar 3D', 'Disney 2D', 'Studio Ghibli', 'Tim Burton',
  'GTA V Style', 'Vaporwave', 'Steampunk', 'Solarpunk', 
  'Noir Black & White', 'Comic Book', 'Low Poly', 'Banana'
];

const LANGUAGES = ['Vietnamese', 'English', 'Japanese', 'Korean', 'French', 'Spanish'];
const RATIOS = ['16:9', '9:16', '1:1', '21:9', '4:3'];

const TEXT_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Fast & Efficient)' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview (High Reasoning)' }
];

const IMAGE_MODELS = [
  { id: 'gemini-2.5-flash-image', name: 'Nano Banana (Gemini 2.5 Flash Image)' },
  { id: 'gemini-3-pro-image-preview', name: 'Nano Banana Pro (Gemini 3 Pro Image)' },
  { id: 'imagen-4.0-generate-001', name: 'Imagen 4 (High Quality)' }
];

// --- Helper Utils ---
const downloadJson = (data: any, filename: string) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// --- Icons (Updated for Light Theme colors handled via classes) ---
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);

const JsonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 18" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);

const ImportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const SparklesIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
     <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
   </svg>
)

const PaintBrushIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
  </svg>
)

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

const CogIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);


const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-gold-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// ... (Helper Components omitted for brevity, assume unchanged)
// CharacterEditModal, SettingsEditModal, AiSettingsModal, ChangeContextModal, ConfigSelect, PromptBox

// --- Helper Components ---

const CharacterEditModal: React.FC<{ 
  character: Character, 
  style: string,
  onSave: (char: Character) => void, 
  onCancel: () => void 
}> = ({ character, style, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Character>({...character});
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateImage = async () => {
    setIsRegenerating(true);
    try {
      let promptToUse = formData.imagePrompt;
      if (!promptToUse || promptToUse.trim() === "") {
         promptToUse = `Portrait of ${formData.name}, ${formData.age}, ${formData.description}. ${formData.archetype || ''}. ${formData.colors ? `Colors: ${formData.colors}` : ''}. Style: ${style}. High quality.`;
         setFormData(prev => ({ ...prev, imagePrompt: promptToUse }));
      }

      const url = await GeminiService.generateImage(promptToUse, '1:1');
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (e) {
      console.error(e);
      alert("Failed to generate image. Please check your API settings or try another model.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleUpdateInfo = async () => {
    if (!formData.imagePrompt || formData.imagePrompt.trim() === "") {
        alert("Please enter a Visual Prompt description first.");
        return;
    }
    setIsUpdatingInfo(true);
    try {
      const updates = await GeminiService.updateCharacterFromPrompt(formData.imagePrompt);
      const cleanedUpdates: Partial<Character> = {};
      (Object.keys(updates) as Array<keyof Character>).forEach(key => {
          if (updates[key]) {
              // @ts-ignore
              cleanedUpdates[key] = updates[key];
          }
      });
      setFormData(prev => ({ ...prev, ...cleanedUpdates }));
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 1000);
    } catch (e) {
      console.error(e);
      alert("Could not extract info from prompt");
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Styles for inputs in light mode
  const inputClass = `w-full bg-white border border-gray-300 rounded p-2 text-sm outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-gray-800 transition-all duration-300 ${justUpdated ? 'border-gold-500 bg-gold-50' : ''}`;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden">
        
        {/* Left: Image & Visuals */}
        <div className="w-full md:w-1/3 bg-gray-50 p-6 border-r border-gray-200 flex flex-col items-center justify-start gap-4 overflow-y-auto">
           <div className="relative w-full aspect-square bg-white rounded-lg overflow-hidden border border-gray-200 group shrink-0 shadow-sm">
              {formData.imageUrl ? (
                <img src={formData.imageUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>
              )}
              {isRegenerating && <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20"><Spinner /></div>}
              
              {/* Overlay Controls */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                 <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white text-gray-800 rounded-full font-bold text-xs flex items-center gap-2 hover:bg-gray-100 shadow-lg">
                   <UploadIcon /> Upload Manual
                 </button>
                 <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
              </div>
           </div>
           
           <div className="w-full">
             <div className="mb-1">
               <label className="text-[10px] text-gold-600 font-bold uppercase">Visual Prompt (AI Input)</label>
             </div>
             <textarea 
               value={formData.imagePrompt} 
               onChange={e => setFormData({...formData, imagePrompt: e.target.value})}
               className="w-full h-32 bg-white border border-gray-300 rounded p-2 text-xs text-gray-700 resize-none outline-none focus:border-gold-500"
               placeholder="Describe character appearance here..."
             />
             <div className="grid grid-cols-2 gap-2 mt-2">
               <button 
                 onClick={handleUpdateInfo}
                 disabled={isUpdatingInfo}
                 className="flex items-center justify-center gap-1 py-2 bg-white hover:bg-gray-50 text-gold-600 border border-gold-200 hover:border-gold-500 rounded text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
               >
                 {isUpdatingInfo ? <Spinner /> : <SparklesIcon />} Update Info
               </button>
               <button 
                 onClick={handleGenerateImage}
                 disabled={isRegenerating}
                 className="flex items-center justify-center gap-1 py-2 bg-gold-500 hover:bg-gold-400 text-white rounded text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
               >
                 {isRegenerating ? <Spinner /> : <PaintBrushIcon />} Gen Avatar
               </button>
             </div>
           </div>
        </div>

        {/* Right: Details Form */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
           <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">Edit Character Details</h3>
              <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
           </div>
           <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gold-600 font-bold uppercase">Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass}/>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gold-600 font-bold uppercase">Age</label>
                  <input type="text" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className={inputClass}/>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-bold uppercase">Role / Archetype</label>
                  <input type="text" value={formData.archetype || ''} onChange={e => setFormData({...formData, archetype: e.target.value})} className={inputClass}/>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-bold uppercase">DOB / Zodiac</label>
                  <input type="text" value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} className={inputClass}/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-bold uppercase">Personality</label>
                  <input type="text" value={formData.personality || ''} onChange={e => setFormData({...formData, personality: e.target.value})} className={inputClass}/>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-bold uppercase">Colors</label>
                  <input type="text" value={formData.colors || ''} onChange={e => setFormData({...formData, colors: e.target.value})} className={inputClass}/>
                </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs text-gold-600 font-bold uppercase">Description</label>
                 <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={`w-full h-32 resize-none ${inputClass}`}/>
              </div>
           </div>
           <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
             <button onClick={onCancel} className="px-4 py-2 rounded text-gray-500 hover:bg-gray-100 text-sm">Cancel</button>
             <button onClick={() => onSave(formData)} className="px-4 py-2 bg-gold-500 text-white font-bold rounded text-sm hover:bg-gold-400 shadow-sm">Save Character</button>
           </div>
        </div>
      </div>
    </div>
  );
};

const SettingsEditModal: React.FC<{ config: ScriptConfig, onSave: (cfg: ScriptConfig) => void, onCancel: () => void }> = ({ config, onSave, onCancel }) => {
  const [localConfig, setLocalConfig] = useState<ScriptConfig>({...config});

  return (
     <div className="fixed inset-0 z-50 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Edit Project Settings</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6 space-y-4">
           <ConfigSelect label="Mood" value={localConfig.mood} options={MOODS} onChange={v => setLocalConfig({...localConfig, mood: v})} />
           <ConfigSelect label="Style" value={localConfig.style} options={STYLES} onChange={v => setLocalConfig({...localConfig, style: v})} />
           <ConfigSelect label="Language" value={localConfig.language} options={LANGUAGES} onChange={v => setLocalConfig({...localConfig, language: v})} />
           <ConfigSelect label="Aspect Ratio" value={localConfig.aspectRatio} options={RATIOS} onChange={v => setLocalConfig({...localConfig, aspectRatio: v as any})} />
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded text-gray-500 hover:bg-gray-100 text-sm">Cancel</button>
          <button onClick={() => onSave(localConfig)} className="px-4 py-2 bg-gold-500 text-white font-bold rounded text-sm hover:bg-gold-400 shadow-sm">Update Settings</button>
        </div>
      </div>
     </div>
  )
}

const AiSettingsModal: React.FC<{ config: AiConfig, onSave: (cfg: AiConfig) => void, onCancel: () => void }> = ({ config, onSave, onCancel }) => {
    const [localConfig, setLocalConfig] = useState<AiConfig>({...config});
  
    return (
       <div className="fixed inset-0 z-50 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-xl w-full max-w-md shadow-2xl flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">AI Model Configuration</h3>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-1">
              <label className="text-xs text-gold-600 font-bold uppercase">Text / Logic Model</label>
              <p className="text-xs text-gray-500 mb-2">Used for Scripting, Reasoning, and Story Generation.</p>
              <select 
                value={localConfig.textModel} 
                onChange={(e) => setLocalConfig({...localConfig, textModel: e.target.value})} 
                className="w-full bg-white border border-gray-300 rounded p-2 text-sm outline-none focus:border-gold-500 text-gray-800"
              >
                {TEXT_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gold-600 font-bold uppercase">Image Generation Model</label>
              <p className="text-xs text-gray-500 mb-2">Used for Character Portraits and Scene Visuals.</p>
              <select 
                value={localConfig.imageModel} 
                onChange={(e) => setLocalConfig({...localConfig, imageModel: e.target.value})} 
                className="w-full bg-white border border-gray-300 rounded p-2 text-sm outline-none focus:border-gold-500 text-gray-800"
              >
                {IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
            <button onClick={onCancel} className="px-4 py-2 rounded text-gray-500 hover:bg-gray-100 text-sm">Cancel</button>
            <button onClick={() => onSave(localConfig)} className="px-4 py-2 bg-gold-500 text-white font-bold rounded text-sm hover:bg-gold-400 shadow-sm">Save Configuration</button>
          </div>
        </div>
       </div>
    )
}

const ChangeContextModal: React.FC<{ 
  title: string, 
  characters: Character[],
  initialCharIds?: string[],
  onSave: (instruction: string, charIds: string[]) => void, 
  onCancel: () => void 
}> = ({ title, characters, initialCharIds, onSave, onCancel }) => {
  const [instruction, setInstruction] = useState("");
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>(initialCharIds || []);
  
  const toggleChar = (id: string) => {
      setSelectedCharIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">
           <div className="space-y-2">
             <label className="text-xs font-bold text-gold-600 uppercase">1. Yêu cầu thay đổi ngữ cảnh</label>
             <p className="text-xs text-gray-500">VD: "Đổi bối cảnh sang trời mưa", "Làm cho hài hước hơn"...</p>
             <textarea 
               className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm focus:border-gold-500 outline-none resize-y min-h-[100px] text-gray-800"
               placeholder="Nhập yêu cầu thay đổi..."
               value={instruction}
               onChange={e => setInstruction(e.target.value)}
             />
           </div>
           
           <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <label className="text-xs font-bold text-gold-600 uppercase">2. Chọn Nhân vật</label>
                 <button 
                   onClick={() => {
                      if(selectedCharIds.length === characters.length) setSelectedCharIds([]);
                      else setSelectedCharIds(characters.map(c => c.id));
                   }}
                   className="text-[10px] text-gold-600 hover:underline"
                 >
                   Select All
                 </button>
               </div>
               <div className="grid grid-cols-5 gap-2">
                  {characters.map(char => {
                     const isSelected = selectedCharIds.includes(char.id);
                     return (
                       <div 
                         key={char.id} 
                         onClick={() => toggleChar(char.id)}
                         className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${isSelected ? 'border-gold-500 ring-1 ring-gold-500' : 'border-gray-200 opacity-60 hover:opacity-100'}`}
                         title={char.name}
                       >
                         {char.imageUrl ? (
                           <img src={char.imageUrl} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[8px] text-gray-500">{char.name}</div>
                         )}
                         {isSelected && (
                           <div className="absolute bottom-0 right-0 bg-gold-500 text-white p-0.5 rounded-tl"><CheckIcon className="w-2 h-2" /></div>
                         )}
                       </div>
                     )
                  })}
               </div>
           </div>

        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded text-gray-500 hover:bg-gray-100 text-sm">Hủy</button>
          <button 
            onClick={() => onSave(instruction, selectedCharIds)} 
            disabled={!instruction.trim()}
            className="px-4 py-2 bg-gold-500 text-white font-bold rounded text-sm hover:bg-gold-400 disabled:opacity-50 shadow-sm"
          >
            Tái tạo Ngữ cảnh
          </button>
        </div>
      </div>
    </div>
  );
}

const ConfigSelect = ({ label, value, options, onChange }: { label: string, value: string, options: string[], onChange: (v: string) => void }) => (
  <div className="space-y-1">
    <label className="text-xs text-gray-500 font-semibold">{label}</label>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      className="w-full bg-white border border-gray-300 rounded p-2 text-sm outline-none focus:border-gold-500 text-gray-800 shadow-sm"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const PromptBox = ({ label, content, onGenerate, placeholder }: { label: string, content?: string, onGenerate?: () => void, placeholder?: string }) => {
  
  const [isExpanded, setIsExpanded] = useState(false);
  let displayContent: React.ReactNode = content;
  let isJson = false;

  try {
    if (content && content.trim().startsWith('{') && content.trim().endsWith('}')) {
      const parsed = JSON.parse(content);
      isJson = true;
      displayContent = (
        <pre className="text-[10px] font-mono text-emerald-600 whitespace-pre-wrap break-all leading-normal bg-emerald-50 p-2 rounded border border-emerald-100">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    }
  } catch (e) {
    // Not valid JSON, render as text
  }

  return (
    <div className={`bg-white rounded-lg border transition-all ${isExpanded ? 'border-gold-400 shadow-sm' : 'border-gray-200'}`}>
      <div 
        className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
           <span className="transform transition-transform duration-200 text-gray-400" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
             <ChevronRightIcon className="w-3 h-3" />
           </span>
           <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
            {label}
            {isJson && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1 rounded">JSON</span>}
          </span>
        </div>
        
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {onGenerate && (
            <button onClick={onGenerate} className="text-[10px] text-gold-600 hover:underline font-medium">Regenerate</button>
          )}
          {content && (
            <>
              <button 
                onClick={() => navigator.clipboard.writeText(content || '')} 
                className="text-[10px] text-gray-400 hover:text-gray-800"
              >
                Copy
              </button>
              {label.includes("VIDEO") && (
                <a 
                  href="https://aitestkitchen.withgoogle.com/tools/video-fx" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[10px] text-gold-600 hover:underline flex items-center gap-1 font-medium"
                >
                  Open Flow ↗
                </a>
              )}
            </>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-3 pt-0 border-t border-gray-100 mt-1">
           <div className="mt-2 min-h-[4rem] max-h-[20rem] overflow-y-auto scrollbar-thin bg-gray-50/50 p-2 rounded text-gray-700">
            {isJson ? displayContent : (
               <p className="text-xs font-mono leading-relaxed whitespace-pre-wrap">
                 {content || <span className="text-gray-400 italic">{placeholder || "No content..."}</span>}
               </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main App ---

export default function App() {
  // ... (Global State same as before)
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showAiConfigModal, setShowAiConfigModal] = useState(false); 
  
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectIdea, setNewProjectIdea] = useState("");
  const [newProjectConfig, setNewProjectConfig] = useState<ScriptConfig>({
    aspectRatio: '16:9',
    hasDialogue: true,
    language: 'Vietnamese',
    duration: '60s',
    mood: 'Cinematic',
    style: 'Photorealistic',
  });
  const [newProjectAiConfig, setNewProjectAiConfig] = useState<AiConfig>({
    textModel: 'gemini-2.5-flash',
    imageModel: 'gemini-2.5-flash-image'
  });

  const projectsRef = useRef<Project[]>([]);
  const importFileRef = useRef<HTMLInputElement>(null);
  const sceneUploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('mb_master_video_v2_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrated = parsed.map((p: any) => ({
          ...p,
          aiConfig: p.aiConfig || { textModel: 'gemini-2.5-flash', imageModel: 'imagen-4.0-generate-001' }
        }));
        setProjects(migrated);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mb_master_video_v2_projects', JSON.stringify(projects));
    projectsRef.current = projects;
  }, [projects]);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeEpisode = activeProject?.episodes.find(e => e.id === activeEpisodeId);

  const handleBackupAll = () => {
    const date = new Date().toISOString().split('T')[0];
    downloadJson(projects, `mb_master_video_backup_all_${date}.json`);
  };

  const handleExportProject = (p: Project) => {
     const date = new Date().toISOString().split('T')[0];
     const safeName = p.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
     downloadJson(p, `${safeName}_project_${date}.json`);
  };

  // ... (handleCreateProject, handleAutoGenerateCharacterImages, handleImportProject, handleCreateEpisodeDrafts, handleUpdateProject)
  // (These functions are standard logic, kept brief to focus on UI changes)
  const handleCreateProject = async () => {
    if (!newProjectIdea) return;
    setIsLoading(true);
    setLoadingMessage("Đang phân tích ý tưởng & thiết kế nhân vật...");
    
    try {
      const bible = await GeminiService.createProjectBible(newProjectIdea, newProjectConfig, newProjectAiConfig.textModel);
      
      const newProject: Project = {
        id: crypto.randomUUID(),
        name: bible.name || "Untitled Project",
        premise: bible.premise || "",
        characters: bible.characters || [],
        config: newProjectConfig,
        aiConfig: newProjectAiConfig,
        episodes: [],
        createdAt: Date.now()
      };

      setProjects(prev => [newProject, ...prev]);
      setActiveProjectId(newProject.id);
      setShowNewProjectModal(false);
      setNewProjectIdea("");
      
      handleAutoGenerateCharacterImages(newProject.id, newProject.characters, newProjectConfig.style, newProject.aiConfig.imageModel);

    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleAutoGenerateCharacterImages = async (projectId: string, characters: Character[], style: string, model: string) => {
    for (const char of characters) {
      try {
        const prompt = `Portrait of ${char.name}, ${char.age}, ${char.description}. ${char.archetype || ''}. ${char.colors ? `Colors: ${char.colors}` : ''}. Style: ${style}. High quality.`;
        const url = await GeminiService.generateImage(prompt, '1:1', model);
        
        setProjects(prev => prev.map(p => {
          if (p.id !== projectId) return p;
          const updatedChars = p.characters.map(c => c.id === char.id ? { ...c, imageUrl: url } : c);
          return { ...p, characters: updatedChars };
        }));
      } catch (e: any) {
        console.error(`Failed image for ${char.name}`, e);
        if (e.message?.includes("403") || e.message?.includes("PERMISSION_DENIED") || e.status === 403) {
             alert(`Image Generation Permission Denied (403) for model ${model}. Stopping auto-generation.`);
             break; 
        }
      }
    }
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const importedData = JSON.parse(json);
        
        if (Array.isArray(importedData)) {
           const newProjects = importedData.filter((p: any) => p.id && p.name);
           const existingIds = new Set(projects.map(p => p.id));
           const toAdd = newProjects.filter((p: any) => !existingIds.has(p.id));
           
           if (toAdd.length === 0) {
             alert("No new projects found or all IDs conflict.");
           } else {
             setProjects(prev => [...toAdd, ...prev]);
             alert(`Imported ${toAdd.length} projects successfully.`);
           }
        } else if (importedData.id && importedData.name) {
            if (projects.some(p => p.id === importedData.id)) {
               importedData.id = crypto.randomUUID();
               importedData.name = importedData.name + " (Imported)";
            }
            if (!importedData.aiConfig) {
                importedData.aiConfig = { textModel: 'gemini-2.5-flash', imageModel: 'imagen-4.0-generate-001' };
            }
            setProjects(prev => [importedData, ...prev]);
            alert("Import project thành công!");
        } else {
           alert("File JSON không hợp lệ.");
        }
      } catch (err) {
        alert("Lỗi khi đọc file JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const handleCreateEpisodeDrafts = async (episodeIdea: string, count: number, charIds: string[], duration: string) => {
    if (!activeProject) return;
    setIsLoading(true);
    setLoadingMessage(`Đang tạo ${count} bản nháp tập phim (tập trung vào ${charIds.length} nhân vật)...`);

    try {
      const drafts = await GeminiService.createEpisodeDrafts(activeProject, episodeIdea, count, charIds, duration);
      
      const newEpisodes: Episode[] = drafts.map(d => ({
        id: crypto.randomUUID(),
        title: d.title || "New Episode",
        summary: d.summary || "",
        voiceoverScript: d.voiceoverScript || "",
        soundAtmosphere: d.soundAtmosphere,
        characterIds: d.characterIds,
        scenes: [], 
        createdAt: Date.now()
      }));

      setProjects(prev => prev.map(p => {
        if (p.id !== activeProject.id) return p;
        return { ...p, episodes: [...newEpisodes, ...p.episodes] }; 
      }));

    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  // --- Render Router ---

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 font-sans overflow-hidden selection:bg-gold-200 selection:text-gold-900">
      {/* Global Hidden Import Input */}
      <input type="file" ref={importFileRef} onChange={handleImportProject} accept=".json" className="hidden" />

      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Spinner />
          <p className="mt-4 text-gold-600 font-medium animate-pulse">{loadingMessage}</p>
        </div>
      )}
      
      {/* Global AI Settings Modal (For creation/defaults) */}
      {showAiConfigModal && (
        <AiSettingsModal 
           config={newProjectAiConfig} 
           onSave={(cfg) => { setNewProjectAiConfig(cfg); setShowAiConfigModal(false); }} 
           onCancel={() => setShowAiConfigModal(false)} 
        />
      )}

      {/* View Switcher */}
      {!activeProjectId ? (
        <DashboardView 
          projects={projects} 
          onOpenNew={() => setShowNewProjectModal(true)}
          onSelectProject={setActiveProjectId}
          onImportClick={() => importFileRef.current?.click()}
          onOpenSettings={() => setShowAiConfigModal(true)}
          onBackupAll={handleBackupAll}
        />
      ) : !activeEpisodeId ? (
        <ProjectDetailView 
          project={activeProject!} 
          onBack={() => setActiveProjectId(null)}
          onSelectEpisode={setActiveEpisodeId}
          onCreateDrafts={handleCreateEpisodeDrafts}
          onUpdateProject={handleUpdateProject}
          onExportProject={() => handleExportProject(activeProject!)}
        />
      ) : (
        <EpisodeEditorView 
          project={activeProject!}
          episode={activeEpisode!}
          onBack={() => setActiveEpisodeId(null)}
          onUpdateProject={handleUpdateProject}
        />
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-40 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Khởi tạo Dự án Mới</h2>
              <button onClick={() => setShowNewProjectModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-xs text-gold-600 font-bold uppercase">Ý tưởng cốt lõi (Project Idea)</label>
                <textarea 
                  className="w-full bg-white border border-gray-300 rounded-lg p-4 focus:border-gold-500 outline-none h-32 resize-none text-gray-800 shadow-sm"
                  placeholder="Mô tả nội dung series, phim ngắn hoặc kênh TikTok của bạn..."
                  value={newProjectIdea}
                  onChange={(e) => setNewProjectIdea(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <ConfigSelect label="Tỷ lệ khung hình" value={newProjectConfig.aspectRatio} options={RATIOS} onChange={v => setNewProjectConfig({...newProjectConfig, aspectRatio: v as any})} />
                 <ConfigSelect label="Ngôn ngữ" value={newProjectConfig.language} options={LANGUAGES} onChange={v => setNewProjectConfig({...newProjectConfig, language: v})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <ConfigSelect label="Mood chủ đạo" value={newProjectConfig.mood} options={MOODS} onChange={v => setNewProjectConfig({...newProjectConfig, mood: v})} />
                 <ConfigSelect label="Visual Style" value={newProjectConfig.style} options={STYLES} onChange={v => setNewProjectConfig({...newProjectConfig, style: v})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-semibold">Thời lượng dự kiến (Text)</label>
                  <input 
                    type="text" 
                    value={newProjectConfig.duration}
                    onChange={(e) => setNewProjectConfig({...newProjectConfig, duration: e.target.value})}
                    className="w-full bg-white border border-gray-300 rounded p-2 text-sm outline-none focus:border-gold-500 shadow-sm text-gray-800"
                    placeholder="e.g. 60s, 2 mins"
                  />
                </div>
                <div className="flex items-end pb-2">
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={newProjectConfig.hasDialogue} 
                       onChange={(e) => setNewProjectConfig({...newProjectConfig, hasDialogue: e.target.checked})} 
                       className="accent-gold-500 w-4 h-4" 
                     />
                     <span className="text-sm text-gray-700">Có lời thoại</span>
                   </label>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-2">
                  <div className="flex flex-col">
                      <span className="text-xs font-bold text-gold-600 uppercase">Cấu hình AI Model</span>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Logic: {TEXT_MODELS.find(m=>m.id===newProjectAiConfig.textModel)?.name?.split('(')[0] || 'Flash'}</span>
                        <span className="text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Image: {IMAGE_MODELS.find(m=>m.id===newProjectAiConfig.imageModel)?.name?.split('(')[0] || 'Nano Banana'}</span>
                      </div>
                  </div>
                  <button 
                      onClick={() => setShowAiConfigModal(true)}
                      className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded text-xs font-bold flex items-center gap-2 transition-colors border border-gray-300 shadow-sm"
                  >
                      <CogIcon /> Thay đổi
                  </button>
              </div>

            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowNewProjectModal(false)} className="px-4 py-2 rounded text-gray-500 hover:bg-gray-200 font-medium">Hủy</button>
              <button 
                onClick={handleCreateProject} 
                disabled={!newProjectIdea}
                className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded shadow-lg shadow-gold-500/30 transition-all disabled:opacity-50"
              >
                Bắt đầu Dự án
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ... (DashboardView & ProjectDetailView kept same as before)
// DashboardView
function DashboardView({ projects, onOpenNew, onSelectProject, onImportClick, onOpenSettings, onBackupAll }: { 
  projects: Project[], 
  onOpenNew: () => void, 
  onSelectProject: (id: string) => void,
  onImportClick: () => void,
  onOpenSettings: () => void,
  onBackupAll: () => void
}) {
  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <header className="h-16 border-b border-gray-200 flex items-center justify-between px-8 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-gold-500/20">M</div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">MB Master Video AI</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onOpenSettings}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gold-600 px-3 py-2 rounded-lg transition-colors shadow-sm"
            title="Global AI Settings"
          >
            <CogIcon />
          </button>
          <button
            onClick={onBackupAll}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm"
          >
            <DownloadIcon /> Backup All
          </button>
          <button
            onClick={onImportClick}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm"
          >
            <ImportIcon /> Import JSON
          </button>
          <button 
            onClick={onOpenNew}
            className="bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-gold-500/30"
          >
            + Dự án Mới
          </button>
        </div>
      </header>
      
      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Dự án của bạn</h2>
        
        {projects.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-2xl h-64 flex flex-col items-center justify-center text-gray-500 gap-4 bg-white">
            <p>Chưa có dự án nào</p>
            <button onClick={onOpenNew} className="text-gold-600 hover:underline font-bold">Tạo dự án đầu tiên ngay</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <div 
                key={project.id} 
                onClick={() => onSelectProject(project.id)}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gold-400 transition-all cursor-pointer group hover:shadow-xl hover:shadow-gray-200/50 flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gold-600 group-hover:bg-gold-500 group-hover:text-white transition-colors font-bold text-lg shadow-sm">
                    {project.name.charAt(0)}
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                    {project.config.aspectRatio}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1 group-hover:text-gold-600 transition-colors">{project.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-6 h-10 leading-relaxed">{project.premise}</p>
                <div className="mt-auto flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 pt-4">
                  <span className="font-medium text-gray-500">{project.episodes.length} tập phim</span>
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ProjectDetailView
function ProjectDetailView({ project, onBack, onSelectEpisode, onCreateDrafts, onUpdateProject, onExportProject }: { 
  project: Project, 
  onBack: () => void, 
  onSelectEpisode: (id: string) => void,
  onCreateDrafts: (idea: string, count: number, charIds: string[], duration: string) => void,
  onUpdateProject: (p: Project) => void,
  onExportProject: () => void
}) {
  const [episodeIdea, setEpisodeIdea] = useState("");
  const [episodeCount, setEpisodeCount] = useState(1);
  const [episodeDuration, setEpisodeDuration] = useState("60s");
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);

  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const [editingAiSettings, setEditingAiSettings] = useState(false);
  const [isRefreshingChars, setIsRefreshingChars] = useState(false);

  // Calculate Scenes based on Duration Input (e.g. 150s / 6 = 25 scenes)
  const estimatedScenes = useMemo(() => {
    const str = episodeDuration.toLowerCase().trim();
    let seconds = 60;
    // Extract numeric value
    const match = str.match(/(\d+(\.\d+)?)/);
    if (match) {
        const val = parseFloat(match[0]);
        // If "m" or "min" is present, treat as minutes
        if (str.includes('m') && !str.includes('ms')) {
            seconds = val * 60;
        } else {
            // Treat as seconds
            seconds = val;
        }
    }
    // Calculation logic: Roughly 1 scene per 6 seconds.
    // 150s -> 25 scenes. 60s -> 10 scenes.
    return Math.ceil(seconds / 6);
  }, [episodeDuration]);

  const handleSaveChar = (updatedChar: Character) => {
     const exists = project.characters.find(c => c.id === updatedChar.id);
     let newChars;
     if (exists) {
        newChars = project.characters.map(c => c.id === updatedChar.id ? updatedChar : c);
     } else {
        newChars = [...project.characters, updatedChar];
     }
     onUpdateProject({ ...project, characters: newChars });
     setEditingChar(null);
  }

  const handleAddCharacter = () => {
      setEditingChar({
          id: crypto.randomUUID(),
          name: "",
          age: "",
          description: "",
          imagePrompt: "",
          archetype: "",
      });
  }

  const handleExportCharacters = () => {
      const filename = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_characters.json`;
      downloadJson(project.characters, filename);
  }

  const handleSaveSettings = async (newConfig: ScriptConfig) => {
     const styleChanged = newConfig.style !== project.config.style;
     const moodChanged = newConfig.mood !== project.config.mood;
     
     const updatedProject = { ...project, config: newConfig };
     onUpdateProject(updatedProject);
     setEditingSettings(false);

     if (styleChanged || moodChanged) {
        if(confirm("Bạn có muốn tự động cập nhật lại Prompt hình ảnh của tất cả nhân vật theo style mới không?")) {
           setIsRefreshingChars(true);
           try {
              const updates = await GeminiService.refreshProjectCharacters(updatedProject);
              const refreshedChars = updatedProject.characters.map(c => {
                 const up = updates.find(u => u.id === c.id);
                 return up ? { ...c, imagePrompt: up.imagePrompt } : c;
              });
              onUpdateProject({ ...updatedProject, characters: refreshedChars });
           } catch (e) {
             console.error(e);
             alert("Lỗi khi refresh nhân vật.");
           } finally {
             setIsRefreshingChars(false);
           }
        }
     }
  }

  const toggleCharSelection = (id: string) => {
    setSelectedCharIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {editingChar && (
         <CharacterEditModal 
           character={editingChar} 
           style={project.config.style}
           onSave={handleSaveChar} 
           onCancel={() => setEditingChar(null)} 
         />
      )}

      {editingSettings && (
         <SettingsEditModal 
           config={project.config} 
           onSave={handleSaveSettings} 
           onCancel={() => setEditingSettings(false)} 
         />
      )}

      {editingAiSettings && (
         <AiSettingsModal
           config={project.aiConfig || { textModel: 'gemini-2.5-flash', imageModel: 'gemini-2.5-flash-image' }} // fallback
           onSave={(cfg) => { onUpdateProject({...project, aiConfig: cfg}); setEditingAiSettings(false); }}
           onCancel={() => setEditingAiSettings(false)}
         />
      )}

      <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm font-bold">
            ← Back
          </button>
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <h1 className="text-lg font-bold text-gray-900">{project.name}</h1>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setEditingAiSettings(true)}
             className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm"
           >
             <CogIcon /> AI Settings
           </button>
           <button 
             onClick={onExportProject}
             className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm"
           >
             <DownloadIcon /> Export JSON
           </button>
           <button 
             onClick={() => setEditingSettings(true)}
             className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm"
           >
             <PencilIcon /> Cài đặt
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <div className="w-full lg:w-2/3 p-8 overflow-y-auto border-r border-gray-200">
           
           <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm relative group">
              <div className="flex justify-between items-start mb-3">
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Project Bible / Outline</h3>
                 <button onClick={() => setEditingSettings(true)} className="opacity-0 group-hover:opacity-100 text-gold-600 hover:underline text-xs font-bold transition-opacity">Edit Settings</button>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">{project.name}</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{project.premise}</p>
              <div className="flex flex-wrap gap-2">
                 <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">Style: {project.config.style}</span>
                 <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">Mood: {project.config.mood}</span>
                 <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">{project.config.aspectRatio}</span>
                 <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">{project.config.language}</span>
              </div>
           </div>

           <h2 className="text-2xl font-bold mb-6 text-gray-900">Danh sách Tập phim</h2>

           <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-lg shadow-gray-200/50">
              <div className="mb-4 space-y-2">
                <label className="text-xs font-bold text-gold-600 uppercase">1. Bối cảnh / Ý tưởng chung cho các tập mới</label>
                <textarea 
                  className="w-full bg-white border border-gray-300 rounded-lg p-4 focus:border-gold-500 outline-none h-24 resize-none text-sm text-gray-800 shadow-inner"
                  placeholder="Mô tả nội dung cho đợt quay này..."
                  value={episodeIdea}
                  onChange={e => setEpisodeIdea(e.target.value)}
                />
              </div>

              <div className="mb-4">
                 <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">2. Chọn Diễn viên (Booking)</label>
                    <button 
                      onClick={() => {
                        if(selectedCharIds.length === project.characters.length) setSelectedCharIds([]);
                        else setSelectedCharIds(project.characters.map(c => c.id));
                      }}
                      className="text-[10px] text-gold-600 hover:underline font-semibold"
                    >
                      Select All
                    </button>
                 </div>
                 <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
                    {project.characters.map(char => {
                      const isSelected = selectedCharIds.includes(char.id);
                      return (
                        <div 
                          key={char.id} 
                          onClick={() => toggleCharSelection(char.id)}
                          className={`relative aspect-square bg-gray-50 rounded-md overflow-hidden cursor-pointer border transition-all shadow-sm ${isSelected ? 'border-gold-500 ring-2 ring-gold-500 ring-offset-1' : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300'}`}
                          title={char.name}
                        >
                           {char.imageUrl ? (
                             <img src={char.imageUrl} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">{char.name}</div>
                           )}
                           {isSelected && <div className="absolute top-0 right-0 p-0.5 bg-gold-500 text-white rounded-bl"><CheckIcon className="w-2 h-2" /></div>}
                           <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-sm text-[8px] text-gray-900 text-center py-0.5 truncate px-1 font-bold border-t border-gray-100">{char.name}</div>
                        </div>
                      )
                    })}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">3. Số lượng tập</label>
                    <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg border border-gray-200">
                       <input 
                         type="range" min="1" max="10" value={episodeCount} 
                         onChange={e => setEpisodeCount(parseInt(e.target.value))}
                         className="flex-1 accent-gold-500 cursor-pointer"
                       />
                       <span className="text-gray-900 font-bold w-8 text-center">{episodeCount}</span>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Thời lượng/Tập</label>
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 flex items-center">
                      <input 
                        type="text" 
                        value={episodeDuration} 
                        onChange={e => setEpisodeDuration(e.target.value)}
                        className="bg-transparent w-full text-sm outline-none text-gray-900 placeholder-gray-400 font-semibold"
                        placeholder="e.g. 60s"
                      />
                      <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">~{estimatedScenes} Scenes</span>
                    </div>
                 </div>
              </div>

              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded bg-gold-500 flex items-center justify-center"><CheckIcon className="w-3 h-3 text-white" /></div>
                   <span className="text-xs text-gray-600 font-medium">Đồng nhất nhân vật (Strict JSON)</span>
                 </div>
                 <button 
                    onClick={() => onCreateDrafts(episodeIdea, episodeCount, selectedCharIds, episodeDuration)}
                    disabled={!episodeIdea}
                    className="px-8 py-3 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-gold-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:transform hover:-translate-y-0.5"
                 >
                    Tạo Tập Phim
                 </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-3 italic">* Bước này sẽ tạo ra bản nháp cốt truyện và lời thoại cho {episodeCount} tập phim. Bạn có thể chỉnh sửa từng tập trước khi tạo phân cảnh chi tiết.</p>
           </div>

           <div className="space-y-4">
              {project.episodes.length === 0 ? (
                 <div className="text-center py-10 text-gray-400 text-sm bg-white border border-dashed border-gray-200 rounded-xl">Chưa có tập phim nào được tạo.</div>
              ) : (
                [...project.episodes].reverse().map((ep, idx) => (
                   <div 
                     key={ep.id} 
                     onClick={() => onSelectEpisode(ep.id)}
                     className="bg-white border border-gray-200 hover:border-gold-400 rounded-lg p-4 flex justify-between items-center cursor-pointer transition-all group shadow-sm hover:shadow-md"
                   >
                      <div className="flex items-center gap-4">
                         <span className="text-gray-400 font-mono text-sm font-bold">#{project.episodes.length - idx}</span>
                         <div>
                            <h3 className="font-bold text-gray-900 group-hover:text-gold-600 transition-colors">{ep.title}</h3>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{ep.summary}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="text-right">
                            <div className="text-xs text-gray-500 font-medium">{ep.scenes.length} scenes</div>
                            <div className="text-[10px] text-gray-400">{new Date(ep.createdAt).toLocaleTimeString()}</div>
                         </div>
                         <ChevronRightIcon className="text-gray-400 group-hover:text-gold-600" />
                      </div>
                   </div>
                ))
              )}
           </div>
        </div>

        {/* Right: Character Sidebar */}
        <div className="w-full lg:w-1/3 bg-white border-l border-gray-200 p-6 overflow-y-auto">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900">Dàn diễn viên ({project.characters.length})</h3>
              <div className="flex gap-2">
                  <button 
                    onClick={handleExportCharacters}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                    title="Export Characters JSON"
                  >
                    <DownloadIcon />
                  </button>
                  <button 
                    onClick={handleAddCharacter}
                    className="w-8 h-8 rounded-full bg-gold-500 hover:bg-gold-600 flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all"
                    title="Add New Character"
                  >
                    <PlusIcon />
                  </button>
              </div>
              {isRefreshingChars && <Spinner />}
           </div>
           <div className="space-y-4">
              {project.characters.map(char => (
                 <div key={char.id} className="bg-white rounded-lg p-3 flex gap-3 border border-gray-200 group hover:border-gold-300 hover:shadow-md transition-all relative">
                    <div 
                       className="w-16 h-16 bg-gray-100 rounded overflow-hidden shrink-0 cursor-pointer border border-gray-100"
                       onClick={() => setEditingChar(char)}
                    >
                       {char.imageUrl ? (
                         <img src={char.imageUrl} className="w-full h-full object-cover hover:scale-110 transition-transform" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400">No Img</div>
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between">
                          <h4 className="font-bold text-sm text-gray-900 truncate">{char.name}</h4>
                          <span className="text-[10px] text-gold-600 font-bold bg-gold-50 px-2 py-0.5 rounded-full">{char.age}</span>
                       </div>
                       <p className="text-[10px] text-gray-500 truncate mt-1 font-medium">{char.archetype}</p>
                       <p className="text-[10px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">{char.description}</p>
                    </div>
                    <button 
                      onClick={() => setEditingChar(char)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gold-600 transition-opacity"
                    >
                      <PencilIcon />
                    </button>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

function EpisodeEditorView({ project, episode, onBack, onUpdateProject }: { 
  project: Project, 
  episode: Episode, 
  onBack: () => void,
  onUpdateProject: (p: Project) => void
}) {
  const [scenes, setScenes] = useState<Scene[]>(episode.scenes || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState("");
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  
  const [draftStory, setDraftStory] = useState(episode.summary);
  const [draftScript, setDraftScript] = useState(episode.voiceoverScript || "");
  const [showChangeContextModal, setShowChangeContextModal] = useState(false);
  
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [targetSceneCount, setTargetSceneCount] = useState(12);

  const sceneUploadInputRef = useRef<HTMLInputElement>(null);
  const [uploadingSceneId, setUploadingSceneId] = useState<{id: string, type: 'start' | 'end'} | null>(null);

  useEffect(() => {
    setScenes(episode.scenes || []);
    setDraftStory(episode.summary);
    setDraftScript(episode.voiceoverScript || "");
  }, [episode]);

  useEffect(() => {
      // Smart Calculation of Scene Count
      const script = episode.voiceoverScript || "";
      let estimated = 12;
      
      if (script.trim().length > 50) {
          const wordCount = script.trim().split(/\s+/).length;
          // Estimate: ~130 words/min. Target 1 scene per 6s.
          // 130 words = 60s = 10 scenes => 13 words/scene.
          estimated = Math.ceil(wordCount / 13);
      } else {
          // Fallback to project duration config if script is empty
           const str = project.config.duration.toLowerCase().trim();
           let seconds = 60;
           const match = str.match(/(\d+(\.\d+)?)/);
           if (match) {
               const val = parseFloat(match[0]);
               if (str.includes('m') && !str.includes('ms')) seconds = val * 60;
               else seconds = val;
           }
           estimated = Math.ceil(seconds / 6);
      }
      setTargetSceneCount(Math.max(3, estimated));
  }, [episode.id]);


  const handleSaveEpisodeDraft = () => {
     const updatedEp = { ...episode, summary: draftStory, voiceoverScript: draftScript };
     const updatedProject = {
        ...project,
        episodes: project.episodes.map(e => e.id === episode.id ? updatedEp : e)
     };
     onUpdateProject(updatedProject);
  }

  const handleSaveChar = (updatedChar: Character) => {
     const exists = project.characters.find(c => c.id === updatedChar.id);
     let newChars;
     let newEpisode = { ...episode };

     if (exists) {
        newChars = project.characters.map(c => c.id === updatedChar.id ? updatedChar : c);
     } else {
        newChars = [...project.characters, updatedChar];
        const currentIds = episode.characterIds || [];
        if(!currentIds.includes(updatedChar.id)) {
            newEpisode = { ...episode, characterIds: [...currentIds, updatedChar.id] };
        }
     }
     
     const updatedProject = { 
         ...project, 
         characters: newChars,
         episodes: project.episodes.map(e => e.id === episode.id ? newEpisode : e)
     };
     
     onUpdateProject(updatedProject);
     setEditingChar(null);
  }

  const handleAddCharacter = () => {
      setEditingChar({
          id: crypto.randomUUID(),
          name: "",
          age: "",
          description: "",
          imagePrompt: "",
          archetype: "",
      });
  }

  const handleExportCharacters = () => {
      const filename = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_characters.json`;
      downloadJson(project.characters, filename);
  }

  const handleGenerateScenes = async () => {
     if(!draftStory || !draftScript) return;
     setIsGenerating(true);
     setGenProgress(`Analyzing script & Generating ${targetSceneCount} scenes breakdown...`);

     try {
        const newScenes = await GeminiService.generateScenesFromDraft(project, { ...episode, summary: draftStory, voiceoverScript: draftScript }, targetSceneCount, episode.characterIds);
        
        const updatedEp = { ...episode, scenes: newScenes, summary: draftStory, voiceoverScript: draftScript };
        const updatedProject = {
           ...project,
           episodes: project.episodes.map(e => e.id === episode.id ? updatedEp : e)
        };
        onUpdateProject(updatedProject);
        setScenes(newScenes);

        generateSceneImages(updatedProject, newScenes);

     } catch (e: any) {
        alert(e.message);
     } finally {
        setIsGenerating(false);
        setGenProgress("");
     }
  }

  const generateSceneImages = async (currentProject: Project, scenesToGen: Scene[]) => {
      for (const scene of scenesToGen) {
         try {
            // Gen Start Image
            const startUrl = await GeminiService.generateImage(scene.startImagePrompt, project.config.aspectRatio, project.aiConfig.imageModel);
            // Update State One by One (Start)
            onUpdateProject({
               ...currentProject,
               episodes: currentProject.episodes.map(e => {
                  if (e.id !== episode.id) return e;
                  return {
                     ...e,
                     scenes: e.scenes.map(s => s.id === scene.id ? { ...s, startImageUrl: startUrl } : s)
                  };
               })
            });

            // Gen End Image
            const endUrl = await GeminiService.generateImage(scene.endImagePrompt, project.config.aspectRatio, project.aiConfig.imageModel);
            // Update State One by One (End)
            onUpdateProject({
               ...currentProject,
               episodes: currentProject.episodes.map(e => {
                  if (e.id !== episode.id) return e;
                  return {
                     ...e,
                     scenes: e.scenes.map(s => s.id === scene.id ? { ...s, endImageUrl: endUrl } : s)
                  };
               })
            });

         } catch (e) {
            console.error(`Failed image for Scene ${scene.number}`, e);
         }
      }
  }

  const handleRegenerateImage = async (scene: Scene, type: 'start' | 'end') => {
     try {
        const prompt = type === 'start' ? scene.startImagePrompt : scene.endImagePrompt;
        const url = await GeminiService.generateImage(prompt, project.config.aspectRatio, project.aiConfig.imageModel);
        
        const updatedProject = {
           ...project,
           episodes: project.episodes.map(e => {
              if (e.id !== episode.id) return e;
              return {
                 ...e,
                 scenes: e.scenes.map(s => s.id === scene.id ? { ...s, [type === 'start' ? 'startImageUrl' : 'endImageUrl']: url } : s)
              };
           })
        };
        onUpdateProject(updatedProject);
     } catch (e) {
        alert("Failed to regenerate image.");
     }
  }

  const handleUploadSceneClick = (sceneId: string, type: 'start' | 'end') => {
      setUploadingSceneId({ id: sceneId, type });
      if(sceneUploadInputRef.current) {
          sceneUploadInputRef.current.value = ''; 
          sceneUploadInputRef.current.click();
      }
  }

  const handleSceneFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0] && uploadingSceneId) {
          const reader = new FileReader();
          reader.onload = () => {
              const url = reader.result as string;
              const updatedProject = {
                  ...project,
                  episodes: project.episodes.map(ep => {
                      if(ep.id !== episode.id) return ep;
                      return {
                          ...ep,
                          scenes: ep.scenes.map(s => s.id === uploadingSceneId.id ? {...s, [uploadingSceneId.type === 'start' ? 'startImageUrl' : 'endImageUrl']: url} : s)
                      }
                  })
              };
              onUpdateProject(updatedProject);
              setUploadingSceneId(null);
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  }

  const handleRegenerateVeoPrompt = async (scene: Scene) => {
      try {
          const prompt = await GeminiService.generateVeoPrompt(scene, project, episode.characterIds, scene.startImageUrl, scene.endImageUrl);
          
          const updatedProject = {
              ...project,
              episodes: project.episodes.map(e => {
                  if (e.id !== episode.id) return e;
                  return {
                      ...e,
                      scenes: e.scenes.map(s => s.id === scene.id ? { ...s, veoPrompt: prompt } : s)
                  };
              })
          };
          onUpdateProject(updatedProject);
      } catch (e) {
          console.error(e);
          alert("Failed to regenerate Veo prompt.");
      }
  }

  const handleChangeContext = async (instruction: string, newCharIds: string[]) => {
      setShowChangeContextModal(false);
      setIsGenerating(true);
      setGenProgress("Rewriting Episode Draft based on new context...");
      
      try {
         const newDraft = await GeminiService.regenerateEpisodeDraft(project, episode, instruction, newCharIds);
         
         const updatedEp = { ...episode, ...newDraft, scenes: [] };
         const updatedProject = {
            ...project,
            episodes: project.episodes.map(e => e.id === episode.id ? updatedEp : e)
         };
         onUpdateProject(updatedProject);
         setScenes([]);
         setDraftStory(newDraft.summary || "");
         setDraftScript(newDraft.voiceoverScript || "");

      } catch (e: any) {
         alert(e.message);
      } finally {
         setIsGenerating(false);
         setGenProgress("");
      }
  }
  
  const exportCSV = () => {
    const headers = [
      "Project Name", "Episode Title", "Full Story Summary", "Full Script Timeline",
      "Scene #", "Location", "Action", "Camera", 
      "Start Image Prompt (JSON)", "End Image Prompt (JSON)", "Video Prompt (JSON)", "Sound Prompt (JSON)"
    ];
    
    const rows = scenes.map(s => [
      project.name,
      episode.title,
      episode.summary.replace(/"/g, '""'), 
      (episode.voiceoverScript || "").replace(/"/g, '""'),
      s.number,
      `"${s.location}"`,
      `"${s.action}"`,
      `"${s.cameraAngle}"`,
      `"${s.startImagePrompt.replace(/"/g, '""')}"`,
      `"${s.endImagePrompt.replace(/"/g, '""')}"`,
      `"${s.veoPrompt.replace(/"/g, '""')}"`,
      `"${s.soundPrompt.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${project.name}_${episode.title}_script.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadImage = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Hidden Scene Image Upload Input */}
      <input type="file" ref={sceneUploadInputRef} onChange={handleSceneFileChange} accept="image/*" className="hidden" />
      
      {isGenerating && (
         <div className="absolute inset-0 z-50 bg-white/90 flex flex-col items-center justify-center backdrop-blur-sm">
            <Spinner />
            <p className="mt-4 text-gold-600 font-bold animate-pulse text-lg">{genProgress}</p>
         </div>
      )}
      
      {showChangeContextModal && (
        <ChangeContextModal 
           title="Thay đổi Ngữ cảnh Tập phim"
           characters={project.characters}
           initialCharIds={episode.characterIds}
           onSave={handleChangeContext}
           onCancel={() => setShowChangeContextModal(false)}
        />
      )}

      {editingChar && (
         <CharacterEditModal 
           character={editingChar} 
           style={project.config.style}
           onSave={handleSaveChar} 
           onCancel={() => setEditingChar(null)} 
         />
      )}

      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm font-bold">
            ← Back
          </button>
          <div>
             <h1 className="text-base font-bold text-gray-900">{episode.title}</h1>
             <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-medium">{scenes.length} Scenes</span>
                <span className="px-1 bg-gray-100 rounded border border-gray-200">&lt;/&gt;</span>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setShowChangeContextModal(true)}
             className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 shadow-sm"
           >
             <SparklesIcon /> Thay đổi ngữ cảnh
           </button>
           <button 
             onClick={exportCSV}
             className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 shadow-sm"
           >
             <UploadIcon /> Export CSV
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
          
          {/* Left: Story & Script Context (Persistent Column) */}
          <div className="w-1/3 md:w-1/4 border-r border-gray-200 bg-white p-4 overflow-y-auto">
              <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs font-bold text-gold-600 uppercase">Cốt Truyện (Summary)</h3>
                      <button onClick={handleSaveEpisodeDraft} className="text-[10px] text-gray-400 hover:text-gray-800 hover:underline">Save Text</button>
                  </div>
                  <textarea 
                    value={draftStory} 
                    onChange={e => setDraftStory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm text-gray-800 outline-none focus:border-gold-500 min-h-[150px] leading-relaxed resize-none shadow-inner"
                  />
              </div>
              <div>
                  <h3 className="text-xs font-bold text-gold-600 uppercase mb-2">Kịch bản Chi tiết (Timeline)</h3>
                  <textarea 
                    value={draftScript}
                    onChange={e => setDraftScript(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm text-gray-800 outline-none focus:border-gold-500 min-h-[400px] leading-relaxed font-mono whitespace-pre-wrap resize-none shadow-inner"
                    placeholder="00:00 [Music] ..."
                  />
              </div>
              
              {scenes.length === 0 && (
                 <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gold-600 uppercase">Cấu hình Phân cảnh</label>
                        <span className="text-[10px] text-gray-400">Auto-calc from script</span>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-semibold">Số lượng Scenes (Ước tính)</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                min="1" 
                                max="50"
                                value={targetSceneCount}
                                onChange={(e) => setTargetSceneCount(parseInt(e.target.value) || 1)}
                                className="w-full bg-white border border-gray-300 rounded p-2 text-sm font-bold text-gray-900 outline-none focus:border-gold-500"
                            />
                            <span className="text-xs text-gray-500 whitespace-nowrap">scenes</span>
                        </div>
                    </div>
                    
                    <button 
                      onClick={handleGenerateScenes}
                      className="w-full py-3 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-lg shadow-md transition-all hover:scale-[1.02] active:scale-95 text-sm"
                    >
                      Tạo {targetSceneCount} Phân cảnh
                    </button>
                 </div>
              )}
          </div>

          {/* Right: Scenes Grid */}
          <div className="flex-1 bg-gray-50 overflow-y-auto p-6 relative">
             {/* Character Strip at Top */}
             <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-3">
                   <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Nhân vật trong tập này</h4>
                   <div className="flex gap-2">
                      <button 
                        onClick={handleExportCharacters}
                        className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                        title="Export Characters JSON"
                      >
                        <DownloadIcon />
                      </button>
                      <button 
                        onClick={handleAddCharacter}
                        className="w-6 h-6 rounded bg-gold-500 hover:bg-gold-600 flex items-center justify-center text-white shadow-sm transition-all"
                        title="Add New Character"
                      >
                        <PlusIcon />
                      </button>
                   </div>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                   {project.characters.filter(c => episode.characterIds?.includes(c.id)).map(char => (
                      <div key={char.id} className="w-12 h-12 rounded-md overflow-hidden border border-gray-200 relative group shadow-sm flex-shrink-0 cursor-pointer" onClick={() => setEditingChar(char)} title={char.name}>
                         {char.imageUrl ? <img src={char.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[8px] text-gray-400">Img</div>}
                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[8px] text-white font-bold">{char.name}</span>
                         </div>
                         <div className="absolute top-0 right-0 p-0.5"><PencilIcon /></div>
                      </div>
                   ))}
                   {(!episode.characterIds || episode.characterIds.length === 0) && (
                      <div className="text-xs text-gray-400 italic py-3">Chưa có nhân vật nào được chọn. Thêm mới hoặc chọn từ danh sách dự án.</div>
                   )}
                </div>
             </div>

             {scenes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40 pointer-events-none text-gray-400">
                   <div className="text-6xl mb-4 grayscale">🎬</div>
                   <p className="text-xl font-bold text-gray-600">Chưa có phân cảnh nào</p>
                   <p>Hãy hoàn thiện kịch bản bên trái và nhấn nút tạo.</p>
                </div>
             ) : (
                <div className="flex gap-6">
                   {/* Scenes Column */}
                   <div className="flex-1 space-y-12 pb-20">
                      {scenes.map(scene => (
                          <div key={scene.id} className="border border-gray-200 bg-white rounded-xl overflow-hidden hover:border-gold-300 transition-all shadow-sm hover:shadow-lg">
                             {/* Scene Header */}
                             <div className="bg-white border-b border-gray-100 p-3 flex items-center gap-4">
                                <span className="text-2xl font-bold text-gray-300 w-8 text-center">{scene.number}</span>
                                <div className="flex-1">
                                   <div className="flex items-center gap-2">
                                      <h4 className="text-sm font-bold text-gold-600 uppercase">{scene.location}</h4>
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-medium">{scene.cameraAngle}</span>
                                   </div>
                                </div>
                                <button className="text-gray-400 hover:text-gold-600"><PencilIcon /></button>
                             </div>

                             <div className="flex flex-col md:flex-row">
                                {/* Visual Representation */}
                                <div className="w-full md:w-[400px] flex flex-col border-r border-gray-200 flex-shrink-0">
                                   
                                   {/* START IMAGE */}
                                   <div className="flex-1 border-b border-gray-200 p-2 relative group bg-gray-50">
                                      <span className="absolute top-2 left-2 z-10 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded font-bold">START FRAME</span>
                                      <div className="w-full h-full flex items-center justify-center relative bg-gray-100 rounded overflow-hidden">
                                         {scene.startImageUrl ? (
                                            <img src={scene.startImageUrl} className="w-full h-full object-contain" />
                                         ) : (
                                            <span className="text-[10px] text-gray-400">No Start Image</span>
                                         )}
                                         
                                         {/* Overlay Actions */}
                                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 backdrop-blur-[1px]">
                                            <button 
                                              onClick={() => handleRegenerateImage(scene, 'start')}
                                              className="px-3 py-1.5 bg-white text-gray-900 font-bold text-[10px] rounded-full hover:scale-105 transition-transform flex items-center gap-1 shadow-lg"
                                            >
                                               <PaintBrushIcon /> Gen AI
                                            </button>
                                            <button 
                                              onClick={() => handleUploadSceneClick(scene.id, 'start')}
                                              className="px-3 py-1.5 bg-gray-800 text-white font-bold text-[10px] rounded-full hover:bg-gray-700 border border-gray-600 flex items-center gap-1 shadow-lg"
                                            >
                                               <UploadIcon /> Upload
                                            </button>
                                            {scene.startImageUrl && (
                                              <button 
                                                onClick={() => downloadImage(scene.startImageUrl!, `scene_${scene.number}_start.jpg`)}
                                                className="px-3 py-1.5 bg-transparent text-white font-bold text-[10px] rounded-full hover:bg-white/20 border border-white flex items-center gap-1"
                                              >
                                                  <DownloadIcon /> Save
                                              </button>
                                            )}
                                         </div>
                                      </div>
                                   </div>

                                   {/* END IMAGE */}
                                   <div className="flex-1 p-2 relative group bg-gray-50">
                                      <span className="absolute top-2 left-2 z-10 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded font-bold">END FRAME</span>
                                      <div className="w-full h-full flex items-center justify-center relative bg-gray-100 rounded overflow-hidden">
                                         {scene.endImageUrl ? (
                                            <img src={scene.endImageUrl} className="w-full h-full object-contain" />
                                         ) : (
                                            <span className="text-[10px] text-gray-400">No End Image</span>
                                         )}

                                         {/* Overlay Actions */}
                                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 backdrop-blur-[1px]">
                                            <button 
                                              onClick={() => handleRegenerateImage(scene, 'end')}
                                              className="px-3 py-1.5 bg-white text-gray-900 font-bold text-[10px] rounded-full hover:scale-105 transition-transform flex items-center gap-1 shadow-lg"
                                            >
                                               <PaintBrushIcon /> Gen AI
                                            </button>
                                            <button 
                                              onClick={() => handleUploadSceneClick(scene.id, 'end')}
                                              className="px-3 py-1.5 bg-gray-800 text-white font-bold text-[10px] rounded-full hover:bg-gray-700 border border-gray-600 flex items-center gap-1 shadow-lg"
                                            >
                                               <UploadIcon /> Upload
                                            </button>
                                            {scene.endImageUrl && (
                                              <button 
                                                onClick={() => downloadImage(scene.endImageUrl!, `scene_${scene.number}_end.jpg`)}
                                                className="px-3 py-1.5 bg-transparent text-white font-bold text-[10px] rounded-full hover:bg-white/20 border border-white flex items-center gap-1"
                                              >
                                                  <DownloadIcon /> Save
                                              </button>
                                            )}
                                         </div>
                                      </div>
                                   </div>

                                </div>

                                {/* Prompts & Data */}
                                <div className="flex-1 p-4 space-y-3 min-w-0 bg-gray-50/50">
                                   <PromptBox label="Start Image Prompt" content={scene.startImagePrompt} />
                                   <PromptBox label="End Image Prompt" content={scene.endImagePrompt} />
                                   <PromptBox 
                                     label="Video Prompt" 
                                     content={scene.veoPrompt} 
                                     onGenerate={() => handleRegenerateVeoPrompt(scene)} 
                                     placeholder="Click Regenerate to create professional Veo 3 prompt from Start/End images..."
                                   />
                                   <PromptBox label="Sound Effect" content={scene.soundPrompt} />
                                </div>
                             </div>
                          </div>
                       ))}
                   </div>
                </div>
             )}
          </div>
      </div>
    </div>
  );
}

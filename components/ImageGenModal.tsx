import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface ImageGenModalProps {
  onClose: () => void;
}

export const ImageGenModal: React.FC<ImageGenModalProps> = ({ onClose }) => {
  const [hasKey, setHasKey] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    // @ts-ignore
    if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
      setHasKey(true);
    }
  };

  const handleConnect = async () => {
    try {
        // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        // Assume success as per race condition instructions
        setHasKey(true); 
      }
    } catch (e) {
      console.error(e);
      setError("Failed to connect key.");
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
            parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            imageSize: size
          }
        }
      });

      let foundImage = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64 = part.inlineData.data;
                setImageUrl(`data:image/png;base64,${base64}`);
                foundImage = true;
                break;
            }
        }
      }
      
      if (!foundImage) {
          setError("No image generated.");
      }

    } catch (err: any) {
      setError(err.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4 pointer-events-auto">
      <div className="bg-gray-900 border-2 border-cyan-500 p-6 rounded-lg w-full max-w-md shadow-[0_0_20px_rgba(6,182,212,0.5)] relative flex flex-col gap-4">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-white text-xl font-bold">&times;</button>
        
        <h2 className="text-xl text-cyan-400 font-bold uppercase tracking-wider text-center">Manifest Reality</h2>

        {!hasKey ? (
            <div className="text-center space-y-4">
                <p className="text-gray-300 text-sm">To manifest visions from the void, you must connect to the Celestial Source.</p>
                <div className="text-xs text-gray-500">
                    Paid API Key required. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-cyan-600 underline">Billing Info</a>
                </div>
                <button 
                    onClick={handleConnect}
                    className="w-full py-2 bg-cyan-700 text-white rounded hover:bg-cyan-600 font-bold"
                >
                    Connect Celestial Key
                </button>
            </div>
        ) : (
            <div className="space-y-4">
                <div>
                    <label className="block text-xs text-cyan-300 mb-1">Vision Description</label>
                    <textarea 
                        className="w-full bg-black/50 border border-gray-700 text-white p-2 text-sm focus:border-cyan-500 outline-none rounded resize-none"
                        rows={3}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A glowing crystal sword..."
                    />
                </div>
                
                <div>
                    <label className="block text-xs text-cyan-300 mb-1">Resolution</label>
                    <div className="flex gap-2">
                        {(['1K', '2K', '4K'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setSize(s)}
                                className={`flex-1 py-1 text-xs border rounded transition-colors ${size === s ? 'bg-cyan-900 border-cyan-400 text-white shadow-[0_0_5px_rgba(6,182,212,0.5)]' : 'bg-black border-gray-700 text-gray-400 hover:border-gray-500'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={loading || !prompt}
                    className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded shadow-[0_0_10px_rgba(6,182,212,0.4)] disabled:opacity-50 transition-transform active:scale-95"
                >
                    {loading ? 'Manifesting...' : 'Generate Vision'}
                </button>

                {error && <div className="text-red-400 text-xs text-center border border-red-900 bg-red-900/20 p-2 rounded">{error}</div>}

                {imageUrl && (
                    <div className="mt-2 border border-gray-700 p-1 bg-black rounded">
                        <img src={imageUrl} alt="Generated" className="w-full h-auto rounded-sm" />
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
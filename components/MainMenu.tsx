import React from 'react';
import { Difficulty } from '../types';

interface MainMenuProps {
    onSelectDifficulty: (d: Difficulty) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectDifficulty }) => {
    return (
        <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center space-y-8 animate-[fadeIn_0.5s]">
            {/* Title Block */}
            <div className="flex flex-col items-center space-y-2 mb-4">
                 <h1 className="text-5xl md:text-8xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 to-blue-900 tracking-widest uppercase filter drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                    SHADOW
                </h1>
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-cyan-800 tracking-[0.5em] uppercase border-b-2 border-cyan-900 pb-4">
                    BREAKER
                </h2>
            </div>
            
            <div className="flex flex-col gap-4 w-64 relative z-10">
                <p className="text-center text-gray-500 text-xs tracking-widest mb-2">INITIATE SEQUENCE</p>
                {Object.values(Difficulty).map((diff) => (
                    <button
                        key={diff}
                        onClick={() => onSelectDifficulty(diff)}
                        className={`
                            px-6 py-3 border border-gray-800 bg-black/50 font-bold tracking-wider transition-all duration-200 uppercase text-sm
                            hover:scale-105 hover:bg-gray-900 hover:border-cyan-500
                            ${diff === Difficulty.SCAVENGER ? 'text-green-500 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]' : ''}
                            ${diff === Difficulty.VETERAN ? 'text-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]' : ''}
                            ${diff === Difficulty.MASTER ? 'text-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]' : ''}
                            ${diff === Difficulty.APEX ? 'text-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]' : ''}
                        `}
                    >
                        {diff.replace('_', ' ')}
                    </button>
                ))}
            </div>

            <div className="absolute bottom-8 text-gray-800 text-[10px] text-center font-mono">
                <p>PT PRODUCTIONS © 2025</p>
                <p>Ver 0.9.2 // VERTICAL_SLICE</p>
            </div>
            
            {/* Background Texture */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,1)_100%)] z-0" />
        </div>
    );
};
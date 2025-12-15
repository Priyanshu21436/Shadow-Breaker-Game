import React, { useEffect, useState } from 'react';

export const IntroScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Timeline matching the Shadow Breaker visual style
        const t1 = setTimeout(() => setStep(1), 500);  // Ignite Portal
        const t2 = setTimeout(() => setStep(2), 1500); // Text Glitch In
        const t3 = setTimeout(() => setStep(3), 3000); // Stabilize & Flare
        const t4 = setTimeout(() => setStep(4), 5500); // Fade Out
        const t5 = setTimeout(() => onComplete(), 6500); // Finish

        return () => { 
            clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); 
            clearTimeout(t4); clearTimeout(t5); 
        };
    }, [onComplete]);

    return (
        <div className={`absolute inset-0 bg-black z-50 flex items-center justify-center overflow-hidden transition-opacity duration-1000 ${step === 4 ? 'opacity-0' : 'opacity-100'}`}>
            
            {/* Background Ambience */}
            <div className={`absolute inset-0 bg-radial-at-c from-blue-900/20 to-black transition-opacity duration-2000 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`} />

            {/* Main Visual Container */}
            <div className={`relative flex items-center justify-center transition-all duration-1000 ${step >= 1 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
                
                {/* The Portal Ring Structure */}
                <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] flex items-center justify-center">
                    {/* Outer Twisted Root/Rock Texture Simulation */}
                    <div className="absolute inset-0 rounded-full border-[12px] border-gray-900 shadow-[0_0_50px_rgba(0,0,0,1)] bg-black/80 z-10" 
                         style={{ 
                             boxShadow: 'inset 0 0 40px rgba(0,0,0,1), 0 0 20px rgba(59,130,246,0.3)',
                             borderColor: '#111'
                         }}>
                    </div>

                    {/* Spinning Energy Layers */}
                    <div className="absolute inset-4 rounded-full border-[1px] border-blue-500/30 animate-[spin_8s_linear_infinite] z-0"></div>
                    <div className="absolute inset-8 rounded-full border-t-[2px] border-l-[2px] border-cyan-400/50 animate-[spin_4s_linear_infinite_reverse] z-0"></div>
                    
                    {/* Inner Blue Void/Mist */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-900/40 via-black to-blue-900/40 animate-pulse z-0"></div>
                    {step >= 3 && (
                        <div className="absolute inset-[-20px] rounded-full bg-blue-500/20 blur-[40px] animate-pulse z-0 transition-all duration-1000"></div>
                    )}
                </div>

                {/* Title Text */}
                <div className="absolute z-20 flex flex-col items-center justify-center text-center">
                    {step >= 2 && (
                        <div className={`relative ${step === 2 ? 'animate-pulse' : ''}`}>
                            <h1 className={`
                                text-5xl md:text-7xl font-serif font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 to-blue-800
                                filter drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]
                                transition-all duration-200
                                ${step === 2 ? 'skew-x-12 scale-110 opacity-80 blur-[1px]' : 'skew-x-0 scale-100 opacity-100 blur-0'}
                            `}>
                                THE ASTRAL
                            </h1>
                            <h1 className={`
                                text-4xl md:text-6xl font-serif font-bold tracking-[0.2em] text-cyan-700
                                filter drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]
                                transition-all duration-200 mt-2
                                ${step === 2 ? '-skew-x-12 scale-90 opacity-60' : 'skew-x-0 scale-100 opacity-100'}
                            `}>
                                SOVEREIGN
                            </h1>
                            
                            {/* Glitch Artifacts */}
                            {step === 2 && (
                                <div className="absolute inset-0 text-red-500/30 animate-ping font-serif font-black tracking-widest pointer-events-none translate-x-1">
                                    RISE
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Credit */}
            <div className={`absolute bottom-8 text-cyan-900/50 text-[10px] tracking-[1em] uppercase transition-all duration-1000 ${step >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                System Initialization...
            </div>
        </div>
    );
};
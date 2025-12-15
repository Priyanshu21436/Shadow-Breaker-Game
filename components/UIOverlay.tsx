import React, { useState } from 'react';
import { GameStateUI, GamePhase } from '../types';
import { Joystick } from './Joystick';
import { ImageGenModal } from './ImageGenModal';

interface UIProps {
  gameState: GameStateUI;
  onJoystickStart: (x: number, y: number) => void;
  onJoystickMove: (x: number, y: number) => void;
  onJoystickEnd: () => void;
  onActionBtn: (btn: 'attack' | 'dash' | 'summon', active: boolean) => void;
}

export const UIOverlay: React.FC<UIProps> = ({ gameState, onJoystickStart, onJoystickMove, onJoystickEnd, onActionBtn }) => {
  const { stats, notifications, phase, wave, mission, playerClass } = gameState;
  const [showImageGen, setShowImageGen] = useState(false);

  if (phase !== GamePhase.PLAYING && phase !== GamePhase.GAMEOVER) return null;

  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (phase === GamePhase.GAMEOVER) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 animate-[fadeIn_1s]">
        <div className="text-center text-red-500">
          <h1 className="text-6xl font-bold mb-4 tracking-widest uppercase glitch-text" style={{textShadow: '0 0 20px red'}}>DESYNCHRONIZED</h1>
          <p className="text-gray-400 text-xl font-mono mb-2">You have fallen before the Monarchs.</p>
          <p className="text-gray-500 text-sm font-mono mb-8">RANK ACHIEVED: {stats.level}</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition font-bold tracking-wider">RESTART TIMELINE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
      {/* HUD Top Left */}
      <div className="flex flex-col gap-2 w-72 pointer-events-auto">
        {/* HP */}
        <div className="bg-gray-900/80 h-5 w-full border border-gray-700 relative overflow-hidden rounded-sm skew-x-[-10deg]">
          <div 
            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-100" 
            style={{ width: `${(stats.hp / stats.maxHp) * 100}%` }} 
          />
          <span className="absolute top-0 left-2 text-[10px] text-white font-bold tracking-wider leading-5">HP {Math.ceil(stats.hp)}</span>
        </div>
        
        {/* Mana (Shadow Energy) */}
        <div className="bg-gray-900/80 h-3 w-3/4 border border-gray-700 relative overflow-hidden rounded-sm skew-x-[-10deg]">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-100" 
            style={{ width: `${(stats.mana / stats.maxMana) * 100}%` }} 
          />
          <span className="absolute top-0 right-1 text-[8px] text-white leading-3">MP</span>
        </div>

        {/* XP */}
        <div className="bg-gray-900/80 h-2 w-full border border-gray-700 relative overflow-hidden rounded-sm skew-x-[-10deg] mt-1">
          <div 
            className="h-full bg-yellow-500 transition-all duration-500" 
            style={{ width: `${(stats.xp / stats.maxXp) * 100}%` }} 
          />
           <span className="absolute top-[-2px] right-1 text-[8px] text-yellow-200">LVL {stats.level}</span>
        </div>
        
        {/* Detailed Stats Panel (Small) */}
        <div className="mt-2 text-[10px] font-mono text-cyan-500 bg-black/50 p-2 rounded border-l-2 border-cyan-500">
            <div className="grid grid-cols-2 gap-x-4">
                <span>MIGHT: {stats.might}</span>
                <span>CELERITY: {stats.celerity}</span>
                <span>FORT: {stats.fortitude}</span>
                <span>ACUITY: {stats.acuity}</span>
                <span className="col-span-2">PRECISION: {stats.precision}</span>
            </div>
        </div>

        {/* Shadow Army Counter */}
        {playerClass === 'SHADOW_WEAVER' && (
             <div className="mt-1 flex items-center gap-2 text-cyan-300 text-xs font-bold animate-[fadeIn_1s]">
                <span className="text-lg">♟</span> SHADOWS: {stats.shadowCount} / {Math.floor(stats.maxShadows)}
             </div>
        )}
      </div>

      {/* Top Center - Mission & Wave */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
          {mission && (
             <div className="bg-black/60 border-x-4 border-blue-600 px-6 py-2 flex flex-col items-center backdrop-blur-sm">
                 <span className="text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-1">{mission.title}</span>
                 <span className="text-white text-sm font-mono text-center">{mission.description}</span>
                 <span className="text-gray-400 text-xs">{mission.current} / {mission.target}</span>
             </div>
          )}
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <button 
          onClick={() => setShowImageGen(true)}
          className="bg-black/60 border border-cyan-500 text-cyan-400 p-2 rounded-full hover:bg-cyan-900/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </button>
      </div>

      {/* Notifications */}
      <div className="absolute top-32 left-1/2 -translate-x-1/2 flex flex-col gap-1 items-center pointer-events-none w-full">
        {notifications.map((note, i) => (
          <div key={i} className="text-blue-300 text-xs md:text-sm font-mono tracking-widest bg-black/90 px-4 py-1 border border-blue-800 animate-[fadeIn_0.5s_ease-out]">
            {note}
          </div>
        ))}
      </div>

      {/* Controls Overlay */}
      {isMobile && (
        <div className="absolute bottom-8 left-8 pointer-events-auto">
          <Joystick onStart={onJoystickStart} onMove={onJoystickMove} onEnd={onJoystickEnd} />
        </div>
      )}

      {isMobile && (
        <div className="absolute bottom-8 right-8 flex gap-4 pointer-events-auto items-end">
           {playerClass === 'SHADOW_WEAVER' && (
               <button 
                 onTouchStart={(e) => { e.preventDefault(); onActionBtn('summon', true) }}
                 onTouchEnd={(e) => { e.preventDefault(); onActionBtn('summon', false) }}
                 className={`w-16 h-16 rounded-full border-2 ${stats.mana >= 10 ? 'border-cyan-400 bg-cyan-900/50 shadow-[0_0_20px_#22d3ee]' : 'border-gray-600 bg-gray-900/50'} text-cyan-100 flex flex-col items-center justify-center active:scale-95 transition-transform`}
               >
                 <span className="text-xl">♟</span>
                 <span className="text-[8px]">ARISE</span>
               </button>
           )}
           <button 
             onTouchStart={(e) => { e.preventDefault(); onActionBtn('dash', true) }}
             onTouchEnd={(e) => { e.preventDefault(); onActionBtn('dash', false) }}
             className="w-14 h-14 mb-2 rounded-full border-2 border-green-500 bg-green-900/50 text-green-100 flex items-center justify-center active:scale-95 transition-transform"
           >
             >>
           </button>
           <button 
             onTouchStart={(e) => { e.preventDefault(); onActionBtn('attack', true) }}
             onTouchEnd={(e) => { e.preventDefault(); onActionBtn('attack', false) }}
             className="w-20 h-20 rounded-full border-2 border-red-500 bg-red-900/50 text-red-100 flex items-center justify-center active:scale-95 transition-transform"
           >
             ⚔
           </button>
        </div>
      )}
      
      {!isMobile && (
         <div className="absolute bottom-4 right-4 text-white/30 text-xs font-mono bg-black/50 p-2 rounded">
            WASD: Move | CLICK: Attack | SPACE: Dash 
            {playerClass === 'SHADOW_WEAVER' && <span className="text-cyan-400"> | E: ARISE</span>}
         </div>
      )}

      {showImageGen && <ImageGenModal onClose={() => setShowImageGen(false)} />}
    </div>
  );
};
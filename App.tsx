import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameStateUI, GamePhase, Difficulty } from './types';
import { UIOverlay } from './components/UIOverlay';
import { IntroScreen } from './components/IntroScreen';
import { MainMenu } from './components/MainMenu';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameStateUI>({
    stats: {
      hp: 100, maxHp: 100, stamina: 100, maxStamina: 100, xp: 0, maxXp: 100, level: 1, mana: 0, maxMana: 100,
      might: 10, fortitude: 10, celerity: 10, acuity: 10, precision: 10, shadowCount: 0, maxShadows: 5
    },
    notifications: [],
    phase: GamePhase.LOADING,
    wave: 1,
    mission: null,
    playerClass: 'NONE'
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    // OPTIMIZATION: Aggressive DPR Clamping
    // High DPI rendering (Retina/OLED) is the #1 killer of canvas performance on mobile.
    // We clamp to 1.0 on mobile to ensure 60fps on 4GB RAM devices.
    const isMobile = window.innerWidth < 800;
    const maxDpr = isMobile ? 1.0 : 1.5; 
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    
    canvasRef.current.width = window.innerWidth * dpr;
    canvasRef.current.height = window.innerHeight * dpr;
    
    // Instantiate Engine
    const engine = new GameEngine(canvasRef.current, (newState) => {
      setGameState(newState);
    });
    
    engineRef.current = engine;
    engine.init(); // Starts loading assets

    const handleResize = () => {
      if (canvasRef.current && engineRef.current) {
         const rIsMobile = window.innerWidth < 800;
         const rMaxDpr = rIsMobile ? 1.0 : 1.5;
         const rDpr = Math.min(window.devicePixelRatio || 1, rMaxDpr);
         
         canvasRef.current.width = window.innerWidth * rDpr;
         canvasRef.current.height = window.innerHeight * rDpr;
         engineRef.current.renderer.resize(canvasRef.current.width, canvasRef.current.height);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stop(); // CRITICAL: Stop the engine loop on unmount to prevent double loops in Strict Mode
    };
  }, []);

  const handleJoystickStart = (x: number, y: number) => engineRef.current?.input.handleJoystickStart(x, y);
  const handleJoystickMove = (x: number, y: number) => engineRef.current?.input.handleJoystickMove(x, y);
  const handleJoystickEnd = () => engineRef.current?.input.handleJoystickEnd();
  const handleActionBtn = (btn: 'attack' | 'dash' | 'summon', active: boolean) => engineRef.current?.input.setButtonState(btn, active);

  const handleIntroComplete = () => {
      if (engineRef.current) engineRef.current.phase = GamePhase.MENU;
  };

  const handleSelectDifficulty = (diff: Difficulty) => {
      if (engineRef.current) engineRef.current.setDifficulty(diff);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans select-none scanlines">
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full touch-none"
        style={{ width: '100%', height: '100%' }}
      />
      
      {gameState.phase === GamePhase.LOADING && (
          <div className="absolute inset-0 flex items-center justify-center text-cyan-500 font-mono animate-pulse">
              INITIALIZING VOID...
          </div>
      )}

      {gameState.phase === GamePhase.INTRO && <IntroScreen onComplete={handleIntroComplete} />}
      {gameState.phase === GamePhase.MENU && <MainMenu onSelectDifficulty={handleSelectDifficulty} />}
      
      <UIOverlay 
        gameState={gameState} 
        onJoystickStart={handleJoystickStart}
        onJoystickMove={handleJoystickMove}
        onJoystickEnd={handleJoystickEnd}
        onActionBtn={handleActionBtn}
      />
    </div>
  );
};

export default App;
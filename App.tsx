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
      hp: 100, maxHp: 100, stamina: 100, maxStamina: 100, xp: 0, maxXp: 100, level: 1, starDust: 0, maxStarDust: 100
    },
    notifications: [],
    phase: GamePhase.LOADING
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    // PERFORMANCE: Cap DPR at 1.5 for Mobile, 2 for Desktop.
    // 3x or 4x pixel ratio destroys fillRate performance on mobile GPUs.
    const isMobile = window.innerWidth < 800;
    const maxDpr = isMobile ? 1.5 : 2;
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
         const rMaxDpr = window.innerWidth < 800 ? 1.5 : 2;
         const rDpr = Math.min(window.devicePixelRatio || 1, rMaxDpr);
         
         canvasRef.current.width = window.innerWidth * rDpr;
         canvasRef.current.height = window.innerHeight * rDpr;
         engineRef.current.renderer.resize(canvasRef.current.width, canvasRef.current.height);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
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
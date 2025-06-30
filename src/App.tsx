/**
 * 🎮 GTL IV Main Application Component
 * 
 * Main React component that integrates:
 * - Game engine and 3D rendering
 * - UI components and HUD
 * - Game state management
 * - User input handling
 * - Performance monitoring
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine/GameEngine';
import { GameConfig } from './game/types/GameConfig';
import { GameUI } from './components/GameUI';
import { LoadingScreen } from './components/LoadingScreen';
import { MainMenu } from './components/MainMenu';
import { GameState } from './game/types/GameState';
import { useGameStore } from './stores/gameStore';
import './styles/App.css';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const { gameState, setGameState, updateGameState } = useGameStore();
  
  /**
   * Initialize game engine with configuration
   */
  const initializeGameEngine = useCallback(async () => {
    try {
      setLoadingProgress(10);
      
      const config: GameConfig = {
        width: window.innerWidth,
        height: window.innerHeight,
        targetFPS: 60,
        enableShadows: true,
        enablePostProcessing: true,
        enablePhysics: true,
        enableAudio: true,
        enableNetworking: false, // Will be enabled for multiplayer later
        debugMode: process.env.NODE_ENV === 'development',
        quality: 'high'
      };
      
      setLoadingProgress(30);
      
      // Create game engine instance
      const engine = new GameEngine(config);
      gameEngineRef.current = engine;
      
      setLoadingProgress(50);
      
      // Initialize the engine
      await engine.start();
      
      setLoadingProgress(80);
      
      // Set up game state
      const initialGameState = engine.getGameState();
      setGameState(initialGameState);
      
      setLoadingProgress(100);
      setIsLoading(false);
      
      console.log('🎮 Game initialized successfully');
      
    } catch (err) {
      console.error('❌ Failed to initialize game:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsLoading(false);
    }
  }, [setGameState]);
  
  /**
   * Handle game start
   */
  const handleGameStart = useCallback(async () => {
    if (!gameEngineRef.current) {
      console.error('Game engine not initialized');
      return;
    }
    
    try {
      setIsGameStarted(true);
      
      // Spawn player vehicle
      const vehicleSystem = gameEngineRef.current.getSceneManager().getVehicleSystem();
      const playerVehicle = vehicleSystem.spawnPlayerVehicle('sports_car', { x: 0, y: 0, z: 0 });
      
      // Set up camera to follow player
      const sceneManager = gameEngineRef.current.getSceneManager();
      sceneManager.setPlayerVehicle(playerVehicle);
      
      console.log('🚀 Game started successfully');
      
    } catch (err) {
      console.error('Failed to start game:', err);
      setError(err instanceof Error ? err.message : 'Failed to start game');
    }
  }, []);
  
  /**
   * Handle game pause
   */
  const handleGamePause = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.stop();
    }
  }, []);
  
  /**
   * Handle game resume
   */
  const handleGameResume = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.start();
    }
  }, []);
  
  /**
   * Handle window resize
   */
  const handleResize = useCallback(() => {
    if (gameEngineRef.current) {
      // The game engine handles resize internally
      // This is just for UI updates
      updateGameState({ screenSize: { width: window.innerWidth, height: window.innerHeight } });
    }
  }, [updateGameState]);
  
  /**
   * Initialize game on component mount
   */
  useEffect(() => {
    initializeGameEngine();
    
    // Set up resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
        gameEngineRef.current = null;
      }
    };
  }, [initializeGameEngine, handleResize]);
  
  /**
   * Update game state from engine
   */
  useEffect(() => {
    if (!gameEngineRef.current || !isGameStarted) return;
    
    const updateInterval = setInterval(() => {
      if (gameEngineRef.current) {
        const currentState = gameEngineRef.current.getGameState();
        updateGameState(currentState);
      }
    }, 16); // ~60 FPS updates
    
    return () => clearInterval(updateInterval);
  }, [isGameStarted, updateGameState]);
  
  /**
   * Render loading screen
   */
  if (isLoading) {
    return (
      <LoadingScreen 
        progress={loadingProgress}
        error={error}
        onRetry={initializeGameEngine}
      />
    );
  }
  
  /**
   * Render main menu
   */
  if (!isGameStarted) {
    return (
      <MainMenu 
        onStartGame={handleGameStart}
        onSettings={() => console.log('Settings clicked')}
        onCredits={() => console.log('Credits clicked')}
      />
    );
  }
  
  /**
   * Render game interface
   */
  return (
    <div className="app">
      {/* Game Canvas Container */}
      <div 
        ref={canvasRef}
        className="game-canvas-container"
        style={{
          width: '100vw',
          height: '100vh',
          position: 'relative'
        }}
      >
        {/* The game engine will inject the canvas here */}
        {gameEngineRef.current && (
          <div 
            ref={(el) => {
              if (el && gameEngineRef.current) {
                el.appendChild(gameEngineRef.current.getRendererElement());
              }
            }}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
      
      {/* Game UI Overlay */}
      <GameUI 
        gameState={gameState}
        onPause={handleGamePause}
        onResume={handleGameResume}
        onMenu={() => setIsGameStarted(false)}
      />
      
      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <div>FPS: {gameEngineRef.current?.getFPS() || 0}</div>
          <div>Vehicles: {gameEngineRef.current?.getSceneManager().getVehicleSystem().getVehicleCount() || 0}</div>
          <div>Memory: {Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024 || 0)}MB</div>
        </div>
      )}
    </div>
  );
};

export default App; 
/**
 * ⏳ Loading Screen Component
 * 
 * Comprehensive loading interface for:
 * - Game initialization progress
 * - Asset loading with progress bars
 * - Loading animations and effects
 * - Error handling and retry functionality
 * - Loading tips and hints
 */

import React, { useState, useEffect, useRef } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
  onError: (error: string) => void;
}

interface LoadingTask {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'loading' | 'completed' | 'error';
  error?: string;
}

interface LoadingTip {
  id: string;
  text: string;
  category: 'gameplay' | 'controls' | 'tips' | 'fun';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onLoadingComplete,
  onError
}) => {
  const [loadingTasks, setLoadingTasks] = useState<LoadingTask[]>([]);
  const [currentTask, setCurrentTask] = useState<string>('');
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState<LoadingTip | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<'initializing' | 'loading' | 'finalizing'>('initializing');
  const [error, setError] = useState<string | null>(null);
  
  const tipInterval = useRef<number | null>(null);
  const progressInterval = useRef<number | null>(null);
  
  // Loading tips
  const loadingTips: LoadingTip[] = [
    { id: '1', text: 'Use WASD or arrow keys to control your vehicle', category: 'controls' },
    { id: '2', text: 'Press SPACE for handbrake to perform drifts', category: 'controls' },
    { id: '3', text: 'Press H to honk your horn at other drivers', category: 'controls' },
    { id: '4', text: 'Press L to toggle your vehicle lights', category: 'controls' },
    { id: '5', text: 'Press M to open the full map view', category: 'controls' },
    { id: '6', text: 'Press ESC to pause the game and access menus', category: 'controls' },
    { id: '7', text: 'Explore the detailed recreation of New York City', category: 'gameplay' },
    { id: '8', text: 'Try different vehicle types for unique driving experiences', category: 'gameplay' },
    { id: '9', text: 'Watch out for traffic and follow road rules', category: 'gameplay' },
    { id: '10', text: 'The game features realistic physics and vehicle handling', category: 'tips' },
    { id: '11', text: 'Use the mini-map in the top-right corner for navigation', category: 'tips' },
    { id: '12', text: 'Monitor your vehicle\'s health and fuel levels', category: 'tips' },
    { id: '13', text: 'Did you know? This game uses real NYC map data!', category: 'fun' },
    { id: '14', text: 'The city features over 1000 unique buildings and landmarks', category: 'fun' },
    { id: '15', text: 'Experience dynamic day/night cycles and weather', category: 'fun' }
  ];
  
  useEffect(() => {
    initializeLoading();
    startTipRotation();
    
    return () => {
      if (tipInterval.current) {
        clearInterval(tipInterval.current);
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);
  
  /**
   * Initialize loading process
   */
  const initializeLoading = async () => {
    try {
      // Define loading tasks
      const tasks: LoadingTask[] = [
        { id: 'engine', name: 'Initializing Game Engine', progress: 0, status: 'pending' },
        { id: 'physics', name: 'Loading Physics System', progress: 0, status: 'pending' },
        { id: 'audio', name: 'Initializing Audio Engine', progress: 0, status: 'pending' },
        { id: 'input', name: 'Setting Up Input System', progress: 0, status: 'pending' },
        { id: 'network', name: 'Initializing Network', progress: 0, status: 'pending' },
        { id: 'map', name: 'Loading NYC Map Data', progress: 0, status: 'pending' },
        { id: 'vehicles', name: 'Loading Vehicle Models', progress: 0, status: 'pending' },
        { id: 'textures', name: 'Loading Textures', progress: 0, status: 'pending' },
        { id: 'shaders', name: 'Compiling Shaders', progress: 0, status: 'pending' },
        { id: 'ui', name: 'Loading User Interface', progress: 0, status: 'pending' },
        { id: 'finalize', name: 'Finalizing Setup', progress: 0, status: 'pending' }
      ];
      
      setLoadingTasks(tasks);
      
      // Start loading process
      await startLoadingProcess(tasks);
      
    } catch (error) {
      console.error('Loading initialization failed:', error);
      setError('Failed to initialize loading process');
      onError('Loading initialization failed');
    }
  };
  
  /**
   * Start loading process
   */
  const startLoadingProcess = async (tasks: LoadingTask[]) => {
    setLoadingPhase('loading');
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      setCurrentTask(task.id);
      
      // Update task status to loading
      setLoadingTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'loading' } : t
      ));
      
      try {
        // Simulate loading with progress updates
        await simulateTaskLoading(task);
        
        // Mark task as completed
        setLoadingTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, status: 'completed', progress: 100 } : t
        ));
        
        // Update overall progress
        const progress = ((i + 1) / tasks.length) * 100;
        setOverallProgress(progress);
        
      } catch (error) {
        console.error(`Task ${task.name} failed:`, error);
        
        // Mark task as error
        setLoadingTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, status: 'error', error: error.message } : t
        ));
        
        setError(`Failed to load: ${task.name}`);
        onError(`Failed to load: ${task.name}`);
        return;
      }
    }
    
    // All tasks completed
    setLoadingPhase('finalizing');
    await finalizeLoading();
  };
  
  /**
   * Simulate task loading with progress
   */
  const simulateTaskLoading = async (task: LoadingTask): Promise<void> => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const maxProgress = 100;
      const increment = Math.random() * 5 + 2; // 2-7% per update
      const interval = Math.random() * 100 + 50; // 50-150ms intervals
      
      const updateProgress = () => {
        progress += increment;
        
        if (progress >= maxProgress) {
          progress = maxProgress;
          setLoadingTasks(prev => prev.map(t => 
            t.id === task.id ? { ...t, progress } : t
          ));
          resolve();
          return;
        }
        
        setLoadingTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, progress } : t
        ));
        
        setTimeout(updateProgress, interval);
      };
      
      updateProgress();
    });
  };
  
  /**
   * Finalize loading process
   */
  const finalizeLoading = async (): Promise<void> => {
    // Simulate finalization delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Complete loading
    onLoadingComplete();
  };
  
  /**
   * Start tip rotation
   */
  const startTipRotation = () => {
    // Show first tip immediately
    setCurrentTip(loadingTips[0]);
    
    // Rotate tips every 5 seconds
    tipInterval.current = window.setInterval(() => {
      const currentIndex = loadingTips.findIndex(tip => tip.id === currentTip?.id);
      const nextIndex = (currentIndex + 1) % loadingTips.length;
      setCurrentTip(loadingTips[nextIndex]);
    }, 5000);
  };
  
  /**
   * Retry loading
   */
  const retryLoading = () => {
    setError(null);
    setOverallProgress(0);
    setLoadingPhase('initializing');
    setLoadingTasks([]);
    initializeLoading();
  };
  
  /**
   * Get task status icon
   */
  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      case 'loading':
        return '⏳';
      default:
        return '⏸️';
    }
  };
  
  /**
   * Get loading phase text
   */
  const getLoadingPhaseText = () => {
    switch (loadingPhase) {
      case 'initializing':
        return 'Initializing...';
      case 'loading':
        return 'Loading Game Assets...';
      case 'finalizing':
        return 'Finalizing Setup...';
      default:
        return 'Loading...';
    }
  };
  
  return (
    <div className="loading-screen">
      <div className="loading-background">
        <div className="loading-overlay" />
        <div className="loading-particles">
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 3 + 2}s`
            }} />
          ))}
        </div>
      </div>
      
      <div className="loading-content">
        {/* Game Logo */}
        <div className="game-logo">
          <h1>GTL IV</h1>
          <p>Grand Theft Liberty IV</p>
        </div>
        
        {/* Loading Phase */}
        <div className="loading-phase">
          <h2>{getLoadingPhaseText()}</h2>
        </div>
        
        {/* Overall Progress */}
        <div className="overall-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="progress-text">
            {Math.round(overallProgress)}%
          </div>
        </div>
        
        {/* Loading Tasks */}
        <div className="loading-tasks">
          {loadingTasks.map(task => (
            <div key={task.id} className={`task-item ${task.status}`}>
              <div className="task-header">
                <span className="task-icon">{getTaskStatusIcon(task.status)}</span>
                <span className="task-name">{task.name}</span>
                <span className="task-progress">{task.progress}%</span>
              </div>
              <div className="task-progress-bar">
                <div 
                  className="task-progress-fill"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              {task.error && (
                <div className="task-error">{task.error}</div>
              )}
            </div>
          ))}
        </div>
        
        {/* Loading Tip */}
        {currentTip && (
          <div className="loading-tip">
            <div className="tip-icon">💡</div>
            <div className="tip-content">
              <div className="tip-category">{currentTip.category.toUpperCase()}</div>
              <div className="tip-text">{currentTip.text}</div>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="loading-error">
            <div className="error-icon">⚠️</div>
            <div className="error-message">{error}</div>
            <button className="retry-button" onClick={retryLoading}>
              Retry Loading
            </button>
          </div>
        )}
        
        {/* Loading Animation */}
        <div className="loading-animation">
          <div className="spinner">
            <div className="spinner-ring" />
            <div className="spinner-ring" />
            <div className="spinner-ring" />
          </div>
        </div>
        
        {/* Version Info */}
        <div className="version-info">
          <span>Version 1.0.0</span>
          <span>•</span>
          <span>Built with React & Three.js</span>
        </div>
      </div>
    </div>
  );
}; 
/**
 * 🎮 Game UI Component
 * 
 * Comprehensive in-game user interface:
 * - Heads-up display (HUD)
 * - Vehicle information panel
 * - Mini-map and navigation
 * - Menu systems
 * - Settings and controls
 * - Performance monitoring
 */

import React, { useState, useEffect, useRef } from 'react';
import { Vehicle } from '../vehicles/Vehicle';
import { VehicleSystem } from '../vehicles/VehicleSystem';
import { GameEngine } from '../engine/GameEngine';
import { InputManager } from '../engine/InputManager';

interface GameUIProps {
  gameEngine: GameEngine;
  vehicleSystem: VehicleSystem;
  inputManager: InputManager;
  playerVehicle: Vehicle | null;
  onMenuToggle: () => void;
  onSettingsOpen: () => void;
}

interface HUDData {
  speed: number;
  rpm: number;
  gear: number;
  fuel: number;
  health: number;
  position: { x: number; y: number; z: number };
  heading: number;
  time: string;
  weather: string;
}

interface MenuState {
  isOpen: boolean;
  currentTab: 'main' | 'settings' | 'controls' | 'map' | 'inventory';
}

export const GameUI: React.FC<GameUIProps> = ({
  gameEngine,
  vehicleSystem,
  inputManager,
  playerVehicle,
  onMenuToggle,
  onSettingsOpen
}) => {
  const [hudData, setHudData] = useState<HUDData>({
    speed: 0,
    rpm: 0,
    gear: 1,
    fuel: 100,
    health: 100,
    position: { x: 0, y: 0, z: 0 },
    heading: 0,
    time: '12:00',
    weather: 'Clear'
  });
  
  const [menuState, setMenuState] = useState<MenuState>({
    isOpen: false,
    currentTab: 'main'
  });
  
  const [showHUD, setShowHUD] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showPerformance, setShowPerformance] = useState(false);
  
  const hudUpdateInterval = useRef<number | null>(null);
  const performanceUpdateInterval = useRef<number | null>(null);
  
  useEffect(() => {
    // Set up HUD update interval
    hudUpdateInterval.current = window.setInterval(() => {
      updateHUD();
    }, 100); // 10 FPS for HUD updates
    
    // Set up performance monitoring
    if (showPerformance) {
      performanceUpdateInterval.current = window.setInterval(() => {
        updatePerformance();
      }, 1000); // 1 FPS for performance updates
    }
    
    // Set up input handlers
    inputManager.addEventListener('keydown', handleKeyDown);
    
    return () => {
      if (hudUpdateInterval.current) {
        clearInterval(hudUpdateInterval.current);
      }
      if (performanceUpdateInterval.current) {
        clearInterval(performanceUpdateInterval.current);
      }
    };
  }, [showPerformance]);
  
  /**
   * Update HUD data
   */
  const updateHUD = () => {
    if (!playerVehicle) return;
    
    const data = playerVehicle.getData();
    const position = playerVehicle.getPosition();
    const velocity = playerVehicle.getVelocity();
    const controls = playerVehicle.getControls();
    
    // Calculate speed in km/h
    const speed = Math.round(velocity.length() * 3.6);
    
    // Calculate RPM based on speed and gear
    const rpm = Math.min(8000, Math.max(800, speed * 100 + controls.throttle * 2000));
    
    // Calculate gear based on speed
    let gear = 1;
    if (speed > 20) gear = 2;
    if (speed > 40) gear = 3;
    if (speed > 60) gear = 4;
    if (speed > 80) gear = 5;
    if (speed > 100) gear = 6;
    
    // Calculate heading in degrees
    const heading = Math.atan2(velocity.x, velocity.z) * (180 / Math.PI);
    
    // Get current time
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    setHudData({
      speed,
      rpm,
      gear,
      fuel: data.fuel || 100,
      health: data.health || 100,
      position,
      heading,
      time,
      weather: 'Clear' // This would come from weather system
    });
  };
  
  /**
   * Update performance data
   */
  const updatePerformance = () => {
    const stats = gameEngine.getStats();
    // Performance data would be displayed in a separate component
  };
  
  /**
   * Handle key input
   */
  const handleKeyDown = (event: any) => {
    switch (event.data?.key) {
      case 'escape':
        toggleMenu();
        break;
      case 'tab':
        toggleMiniMap();
        break;
      case 'f1':
        togglePerformance();
        break;
      case 'h':
        toggleHUD();
        break;
    }
  };
  
  /**
   * Toggle menu
   */
  const toggleMenu = () => {
    setMenuState(prev => ({
      ...prev,
      isOpen: !prev.isOpen
    }));
    onMenuToggle();
  };
  
  /**
   * Toggle mini-map
   */
  const toggleMiniMap = () => {
    setShowMiniMap(prev => !prev);
  };
  
  /**
   * Toggle performance display
   */
  const togglePerformance = () => {
    setShowPerformance(prev => !prev);
  };
  
  /**
   * Toggle HUD
   */
  const toggleHUD = () => {
    setShowHUD(prev => !prev);
  };
  
  /**
   * Format speed display
   */
  const formatSpeed = (speed: number): string => {
    return `${speed} km/h`;
  };
  
  /**
   * Format RPM display
   */
  const formatRPM = (rpm: number): string => {
    return `${Math.round(rpm)} RPM`;
  };
  
  /**
   * Get gear display
   */
  const getGearDisplay = (gear: number): string => {
    return gear === 0 ? 'R' : gear === -1 ? 'N' : gear.toString();
  };
  
  /**
   * Get health color
   */
  const getHealthColor = (health: number): string => {
    if (health > 70) return '#00ff00';
    if (health > 30) return '#ffff00';
    return '#ff0000';
  };
  
  /**
   * Get fuel color
   */
  const getFuelColor = (fuel: number): string => {
    if (fuel > 30) return '#00ff00';
    if (fuel > 10) return '#ffff00';
    return '#ff0000';
  };
  
  return (
    <div className="game-ui">
      {/* HUD */}
      {showHUD && (
        <div className="hud">
          {/* Speedometer */}
          <div className="speedometer">
            <div className="speed-display">
              <span className="speed-value">{formatSpeed(hudData.speed)}</span>
              <span className="speed-unit">km/h</span>
            </div>
            <div className="rpm-display">
              <span className="rpm-value">{formatRPM(hudData.rpm)}</span>
            </div>
            <div className="gear-display">
              <span className="gear-value">{getGearDisplay(hudData.gear)}</span>
            </div>
          </div>
          
          {/* Vehicle Status */}
          <div className="vehicle-status">
            <div className="status-bar health-bar">
              <div 
                className="status-fill" 
                style={{ 
                  width: `${hudData.health}%`, 
                  backgroundColor: getHealthColor(hudData.health) 
                }}
              />
              <span className="status-label">Health</span>
            </div>
            <div className="status-bar fuel-bar">
              <div 
                className="status-fill" 
                style={{ 
                  width: `${hudData.fuel}%`, 
                  backgroundColor: getFuelColor(hudData.fuel) 
                }}
              />
              <span className="status-label">Fuel</span>
            </div>
          </div>
          
          {/* Position and Time */}
          <div className="info-panel">
            <div className="position-info">
              <span>X: {hudData.position.x.toFixed(1)}</span>
              <span>Y: {hudData.position.y.toFixed(1)}</span>
              <span>Z: {hudData.position.z.toFixed(1)}</span>
            </div>
            <div className="time-info">
              <span>{hudData.time}</span>
              <span>{hudData.weather}</span>
            </div>
            <div className="heading-info">
              <span>Heading: {hudData.heading.toFixed(0)}°</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Mini-map */}
      {showMiniMap && (
        <div className="mini-map">
          <div className="map-container">
            <div className="map-background">
              {/* Map would be rendered here */}
              <div className="map-grid">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="map-grid-line horizontal" />
                ))}
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="map-grid-line vertical" />
                ))}
              </div>
              <div 
                className="player-marker"
                style={{
                  left: `${50 + (hudData.position.x / 1000) * 100}%`,
                  top: `${50 + (hudData.position.z / 1000) * 100}%`,
                  transform: `rotate(${hudData.heading}deg)`
                }}
              />
            </div>
            <div className="map-controls">
              <button onClick={toggleMiniMap}>Close</button>
              <button onClick={() => setMenuState(prev => ({ ...prev, isOpen: true, currentTab: 'map' }))}>
                Full Map
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Performance Monitor */}
      {showPerformance && (
        <div className="performance-monitor">
          <div className="performance-header">
            <h3>Performance</h3>
            <button onClick={togglePerformance}>×</button>
          </div>
          <div className="performance-stats">
            <div className="stat">
              <span className="stat-label">FPS:</span>
              <span className="stat-value">{gameEngine.getStats().fps || 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Draw Calls:</span>
              <span className="stat-value">{gameEngine.getStats().drawCalls || 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Triangles:</span>
              <span className="stat-value">{gameEngine.getStats().triangles || 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Memory:</span>
              <span className="stat-value">{Math.round((gameEngine.getStats().memoryUsage || 0) / 1024 / 1024)}MB</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Menu */}
      {menuState.isOpen && (
        <div className="game-menu">
          <div className="menu-background" onClick={toggleMenu} />
          <div className="menu-content">
            <div className="menu-header">
              <h2>Game Menu</h2>
              <button onClick={toggleMenu}>×</button>
            </div>
            
            <div className="menu-tabs">
              <button 
                className={menuState.currentTab === 'main' ? 'active' : ''}
                onClick={() => setMenuState(prev => ({ ...prev, currentTab: 'main' }))}
              >
                Main
              </button>
              <button 
                className={menuState.currentTab === 'settings' ? 'active' : ''}
                onClick={() => setMenuState(prev => ({ ...prev, currentTab: 'settings' }))}
              >
                Settings
              </button>
              <button 
                className={menuState.currentTab === 'controls' ? 'active' : ''}
                onClick={() => setMenuState(prev => ({ ...prev, currentTab: 'controls' }))}
              >
                Controls
              </button>
              <button 
                className={menuState.currentTab === 'map' ? 'active' : ''}
                onClick={() => setMenuState(prev => ({ ...prev, currentTab: 'map' }))}
              >
                Map
              </button>
              <button 
                className={menuState.currentTab === 'inventory' ? 'active' : ''}
                onClick={() => setMenuState(prev => ({ ...prev, currentTab: 'inventory' }))}
              >
                Inventory
              </button>
            </div>
            
            <div className="menu-body">
              {menuState.currentTab === 'main' && (
                <div className="main-menu">
                  <button onClick={() => setMenuState(prev => ({ ...prev, isOpen: false }))}>
                    Resume Game
                  </button>
                  <button onClick={onSettingsOpen}>
                    Settings
                  </button>
                  <button onClick={() => window.location.reload()}>
                    Restart Game
                  </button>
                  <button onClick={() => window.close()}>
                    Exit Game
                  </button>
                </div>
              )}
              
              {menuState.currentTab === 'settings' && (
                <div className="settings-menu">
                  <div className="setting-group">
                    <h3>Graphics</h3>
                    <div className="setting">
                      <label>Quality:</label>
                      <select defaultValue="high">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="ultra">Ultra</option>
                      </select>
                    </div>
                    <div className="setting">
                      <label>Resolution:</label>
                      <select defaultValue="1920x1080">
                        <option value="1280x720">1280x720</option>
                        <option value="1920x1080">1920x1080</option>
                        <option value="2560x1440">2560x1440</option>
                        <option value="3840x2160">3840x2160</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="setting-group">
                    <h3>Audio</h3>
                    <div className="setting">
                      <label>Master Volume:</label>
                      <input type="range" min="0" max="100" defaultValue="80" />
                    </div>
                    <div className="setting">
                      <label>Music Volume:</label>
                      <input type="range" min="0" max="100" defaultValue="60" />
                    </div>
                    <div className="setting">
                      <label>SFX Volume:</label>
                      <input type="range" min="0" max="100" defaultValue="90" />
                    </div>
                  </div>
                </div>
              )}
              
              {menuState.currentTab === 'controls' && (
                <div className="controls-menu">
                  <div className="control-group">
                    <h3>Vehicle Controls</h3>
                    <div className="control">
                      <span>Accelerate:</span>
                      <span>W / ↑</span>
                    </div>
                    <div className="control">
                      <span>Brake:</span>
                      <span>S / ↓</span>
                    </div>
                    <div className="control">
                      <span>Steer Left:</span>
                      <span>A / ←</span>
                    </div>
                    <div className="control">
                      <span>Steer Right:</span>
                      <span>D / →</span>
                    </div>
                    <div className="control">
                      <span>Handbrake:</span>
                      <span>Space</span>
                    </div>
                    <div className="control">
                      <span>Horn:</span>
                      <span>H</span>
                    </div>
                  </div>
                  
                  <div className="control-group">
                    <h3>Game Controls</h3>
                    <div className="control">
                      <span>Pause:</span>
                      <span>Escape</span>
                    </div>
                    <div className="control">
                      <span>Menu:</span>
                      <span>Tab</span>
                    </div>
                    <div className="control">
                      <span>Map:</span>
                      <span>M</span>
                    </div>
                    <div className="control">
                      <span>Toggle HUD:</span>
                      <span>F1</span>
                    </div>
                  </div>
                </div>
              )}
              
              {menuState.currentTab === 'map' && (
                <div className="map-menu">
                  <div className="full-map">
                    <h3>New York City</h3>
                    <div className="map-container-large">
                      {/* Full map would be rendered here */}
                      <div className="map-placeholder">
                        <p>Full map view coming soon...</p>
                        <p>Interactive 3D map with navigation</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {menuState.currentTab === 'inventory' && (
                <div className="inventory-menu">
                  <h3>Vehicle Inventory</h3>
                  <div className="inventory-grid">
                    <div className="inventory-item">
                      <div className="item-icon">🚗</div>
                      <div className="item-name">Sports Car</div>
                      <div className="item-stats">
                        <span>Speed: 320 km/h</span>
                        <span>Acceleration: 3.2s</span>
                      </div>
                    </div>
                    <div className="inventory-item">
                      <div className="item-icon">🏍️</div>
                      <div className="item-name">Motorcycle</div>
                      <div className="item-stats">
                        <span>Speed: 280 km/h</span>
                        <span>Acceleration: 2.8s</span>
                      </div>
                    </div>
                    <div className="inventory-item">
                      <div className="item-icon">🚙</div>
                      <div className="item-name">SUV</div>
                      <div className="item-stats">
                        <span>Speed: 220 km/h</span>
                        <span>Acceleration: 6.5s</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Help */}
      <div className="quick-help">
        <div className="help-item">
          <span className="help-key">ESC</span>
          <span className="help-action">Menu</span>
        </div>
        <div className="help-item">
          <span className="help-key">TAB</span>
          <span className="help-action">Map</span>
        </div>
        <div className="help-item">
          <span className="help-key">F1</span>
          <span className="help-action">Performance</span>
        </div>
      </div>
    </div>
  );
}; 
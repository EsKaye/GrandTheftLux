/**
 * 🎮 Game Configuration Types
 * 
 * Defines all configuration parameters for:
 * - Engine settings
 * - Graphics quality
 * - Physics parameters
 * - Audio settings
 * - Network configuration
 * - Debug options
 */

export interface GameConfig {
  // Display settings
  width: number;
  height: number;
  targetFPS: number;
  vsync: boolean;
  
  // Graphics settings
  enableShadows: boolean;
  enablePostProcessing: boolean;
  enableAntiAliasing: boolean;
  enableBloom: boolean;
  enableSSAO: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  
  // Physics settings
  enablePhysics: boolean;
  physicsTimestep: number;
  gravity: number;
  maxPhysicsObjects: number;
  
  // Audio settings
  enableAudio: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  enable3DAudio: boolean;
  
  // Network settings
  enableNetworking: boolean;
  serverUrl: string;
  maxPlayers: number;
  enableVoiceChat: boolean;
  
  // Debug settings
  debugMode: boolean;
  showFPS: boolean;
  showDebugInfo: boolean;
  enableProfiling: boolean;
  
  // Game settings
  difficulty: 'easy' | 'normal' | 'hard';
  language: string;
  enableTutorial: boolean;
  autoSave: boolean;
}

export interface GraphicsConfig {
  renderer: 'webgl' | 'webgl2';
  antialiasing: boolean;
  shadowMapSize: number;
  shadowMapType: 'basic' | 'pcf' | 'pcfsoft';
  toneMapping: 'none' | 'linear' | 'aces' | 'cineon' | 'reinhard';
  exposure: number;
  gamma: number;
  outputEncoding: 'linear' | 'sRGB';
}

export interface PhysicsConfig {
  engine: 'custom' | 'cannon' | 'ammo';
  timestep: number;
  iterations: number;
  gravity: { x: number; y: number; z: number };
  broadphase: 'naive' | 'sweep' | 'grid';
  solver: 'sequential' | 'jacobi' | 'gs';
}

export interface AudioConfig {
  context: 'web' | 'native';
  sampleRate: number;
  channels: number;
  bufferSize: number;
  spatialAudio: boolean;
  maxSources: number;
  compression: boolean;
}

export interface NetworkConfig {
  protocol: 'websocket' | 'webrtc' | 'http';
  compression: boolean;
  encryption: boolean;
  heartbeat: number;
  timeout: number;
  reconnectAttempts: number;
  maxLatency: number;
}

export interface DebugConfig {
  enabled: boolean;
  level: 'error' | 'warn' | 'info' | 'debug';
  showFPS: boolean;
  showMemory: boolean;
  showPhysics: boolean;
  showNetwork: boolean;
  showAudio: boolean;
  logToFile: boolean;
  performanceMonitoring: boolean;
}

export interface PerformanceConfig {
  targetFPS: number;
  adaptiveQuality: boolean;
  lodDistance: number;
  maxDrawCalls: number;
  maxTriangles: number;
  textureQuality: 'low' | 'medium' | 'high';
  modelQuality: 'low' | 'medium' | 'high';
  shadowQuality: 'low' | 'medium' | 'high';
}

export interface InputConfig {
  mouseSensitivity: number;
  gamepadEnabled: boolean;
  keyboardLayout: 'qwerty' | 'azerty' | 'qwertz';
  invertY: boolean;
  enableVibration: boolean;
  deadzone: number;
}

export interface UIConfig {
  theme: 'light' | 'dark' | 'auto';
  scale: number;
  language: string;
  showHUD: boolean;
  showMinimap: boolean;
  showObjectives: boolean;
  showInventory: boolean;
  enableTooltips: boolean;
}

export interface SaveConfig {
  autoSave: boolean;
  autoSaveInterval: number;
  maxSaveSlots: number;
  cloudSave: boolean;
  backupEnabled: boolean;
  backupInterval: number;
}

export interface AccessibilityConfig {
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  subtitles: boolean;
  audioDescriptions: boolean;
  motionReduction: boolean;
}

// Default configurations
export const DEFAULT_GAME_CONFIG: GameConfig = {
  width: 1920,
  height: 1080,
  targetFPS: 60,
  vsync: true,
  enableShadows: true,
  enablePostProcessing: true,
  enableAntiAliasing: true,
  enableBloom: true,
  enableSSAO: true,
  quality: 'high',
  enablePhysics: true,
  physicsTimestep: 1 / 60,
  gravity: -9.81,
  maxPhysicsObjects: 1000,
  enableAudio: true,
  masterVolume: 1.0,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  enable3DAudio: true,
  enableNetworking: false,
  serverUrl: 'ws://localhost:3001',
  maxPlayers: 32,
  enableVoiceChat: false,
  debugMode: false,
  showFPS: false,
  showDebugInfo: false,
  enableProfiling: false,
  difficulty: 'normal',
  language: 'en',
  enableTutorial: true,
  autoSave: true
};

export const DEFAULT_GRAPHICS_CONFIG: GraphicsConfig = {
  renderer: 'webgl2',
  antialiasing: true,
  shadowMapSize: 2048,
  shadowMapType: 'pcfsoft',
  toneMapping: 'aces',
  exposure: 1.0,
  gamma: 2.2,
  outputEncoding: 'sRGB'
};

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  engine: 'custom',
  timestep: 1 / 60,
  iterations: 10,
  gravity: { x: 0, y: -9.81, z: 0 },
  broadphase: 'sweep',
  solver: 'sequential'
};

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  context: 'web',
  sampleRate: 44100,
  channels: 2,
  bufferSize: 4096,
  spatialAudio: true,
  maxSources: 32,
  compression: true
};

export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  protocol: 'websocket',
  compression: true,
  encryption: true,
  heartbeat: 30,
  timeout: 5000,
  reconnectAttempts: 3,
  maxLatency: 100
};

export const DEFAULT_DEBUG_CONFIG: DebugConfig = {
  enabled: false,
  level: 'info',
  showFPS: false,
  showMemory: false,
  showPhysics: false,
  showNetwork: false,
  showAudio: false,
  logToFile: false,
  performanceMonitoring: false
};

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  targetFPS: 60,
  adaptiveQuality: true,
  lodDistance: 1000,
  maxDrawCalls: 1000,
  maxTriangles: 100000,
  textureQuality: 'high',
  modelQuality: 'high',
  shadowQuality: 'high'
};

export const DEFAULT_INPUT_CONFIG: InputConfig = {
  mouseSensitivity: 1.0,
  gamepadEnabled: true,
  keyboardLayout: 'qwerty',
  invertY: false,
  enableVibration: true,
  deadzone: 0.1
};

export const DEFAULT_UI_CONFIG: UIConfig = {
  theme: 'dark',
  scale: 1.0,
  language: 'en',
  showHUD: true,
  showMinimap: true,
  showObjectives: true,
  showInventory: true,
  enableTooltips: true
};

export const DEFAULT_SAVE_CONFIG: SaveConfig = {
  autoSave: true,
  autoSaveInterval: 300, // 5 minutes
  maxSaveSlots: 10,
  cloudSave: false,
  backupEnabled: true,
  backupInterval: 3600 // 1 hour
};

export const DEFAULT_ACCESSIBILITY_CONFIG: AccessibilityConfig = {
  colorBlindMode: 'none',
  highContrast: false,
  largeText: false,
  screenReader: false,
  subtitles: true,
  audioDescriptions: false,
  motionReduction: false
}; 
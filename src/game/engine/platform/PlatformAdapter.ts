/**
 * Platform Adapter - Cross-Platform Compatibility Layer
 * 
 * Provides platform-specific implementations for:
 * - Desktop (Windows, macOS, Linux)
 * - Mobile (iOS, Android)
 * - Console (Nintendo DS, Switch, PlayStation, Xbox)
 * - VR/AR (Oculus, HTC Vive, HoloLens)
 * - Web (Progressive Web App)
 * 
 * Handles input, graphics, audio, and system-specific optimizations
 */

import { EngineConfig } from '../CrossPlatformEngine';

export interface PlatformInfo {
  platform: string;
  version: string;
  capabilities: PlatformCapabilities;
  performance: PerformanceMetrics;
  input: InputCapabilities;
  graphics: GraphicsCapabilities;
  audio: AudioCapabilities;
}

export interface PlatformCapabilities {
  touch: boolean;
  gamepad: boolean;
  vr: boolean;
  ar: boolean;
  webgl: boolean;
  webgl2: boolean;
  webAudio: boolean;
  serviceWorker: boolean;
  indexedDB: boolean;
  localStorage: boolean;
  fileSystem: boolean;
  network: boolean;
  bluetooth: boolean;
  nfc: boolean;
  camera: boolean;
  microphone: boolean;
  accelerometer: boolean;
  gyroscope: boolean;
  magnetometer: boolean;
  gps: boolean;
}

export interface PerformanceMetrics {
  cpuCores: number;
  memoryGB: number;
  gpuMemoryMB: number;
  maxTextureSize: number;
  maxAnisotropy: number;
  maxDrawBuffers: number;
  maxVertexUniformVectors: number;
  maxFragmentUniformVectors: number;
  maxVaryingVectors: number;
  maxVertexAttribs: number;
  maxVertexTextureUnits: number;
  maxTextureUnits: number;
  maxRenderbufferSize: number;
  maxViewportDims: [number, number];
}

export interface InputCapabilities {
  keyboard: boolean;
  mouse: boolean;
  touch: boolean;
  gamepad: boolean;
  vrControllers: boolean;
  motionControls: boolean;
  voiceInput: boolean;
  eyeTracking: boolean;
  hapticFeedback: boolean;
  maxTouchPoints: number;
  maxGamepads: number;
  maxVRControllers: number;
}

export interface GraphicsCapabilities {
  webgl: boolean;
  webgl2: boolean;
  webgpu: boolean;
  canvas2d: boolean;
  svg: boolean;
  css3d: boolean;
  webxr: boolean;
  webvr: boolean;
  maxTextureSize: number;
  maxAnisotropy: number;
  maxDrawBuffers: number;
  maxVertexUniformVectors: number;
  maxFragmentUniformVectors: number;
  maxVaryingVectors: number;
  maxVertexAttribs: number;
  maxVertexTextureUnits: number;
  maxTextureUnits: number;
  maxRenderbufferSize: number;
  maxViewportDims: [number, number];
  antialiasing: boolean;
  depthBuffer: boolean;
  stencilBuffer: boolean;
  alphaChannel: boolean;
  premultipliedAlpha: boolean;
  preserveDrawingBuffer: boolean;
  powerPreference: 'default' | 'low-power' | 'high-performance';
}

export interface AudioCapabilities {
  webAudio: boolean;
  audioContext: boolean;
  audioWorklet: boolean;
  mediaDevices: boolean;
  getUserMedia: boolean;
  audioInput: boolean;
  audioOutput: boolean;
  spatialAudio: boolean;
  maxChannels: number;
  sampleRate: number;
  latency: number;
}

export class PlatformAdapter {
  private config: EngineConfig;
  private platformInfo: PlatformInfo;
  private inputManager: any;
  private graphicsManager: any;
  private audioManager: any;
  private networkManager: any;
  private storageManager: any;

  constructor(config: EngineConfig) {
    this.config = config;
    this.platformInfo = this.detectPlatform();
  }

  async initialize(): Promise<void> {
    console.log('🔧 Initializing Platform Adapter...');
    console.log(`Platform: ${this.platformInfo.platform} ${this.platformInfo.version}`);

    // Initialize platform-specific managers
    await this.initializeInputManager();
    await this.initializeGraphicsManager();
    await this.initializeAudioManager();
    await this.initializeNetworkManager();
    await this.initializeStorageManager();

    // Apply platform-specific optimizations
    this.applyPlatformOptimizations();

    console.log('✅ Platform Adapter initialized successfully');
  }

  private detectPlatform(): PlatformInfo {
    const userAgent = navigator.userAgent;
    const platform = this.detectPlatformType(userAgent);
    const capabilities = this.detectCapabilities();
    const performance = this.detectPerformanceMetrics();
    const input = this.detectInputCapabilities();
    const graphics = this.detectGraphicsCapabilities();
    const audio = this.detectAudioCapabilities();

    return {
      platform,
      version: this.detectVersion(userAgent),
      capabilities,
      performance,
      input,
      graphics,
      audio
    };
  }

  private detectPlatformType(userAgent: string): string {
    if (/Windows/.test(userAgent)) {
      return 'Windows';
    } else if (/Mac OS X/.test(userAgent)) {
      return 'macOS';
    } else if (/Linux/.test(userAgent)) {
      return 'Linux';
    } else if (/Android/.test(userAgent)) {
      return 'Android';
    } else if (/iPhone|iPad|iPod/.test(userAgent)) {
      return 'iOS';
    } else if (/Nintendo/.test(userAgent)) {
      return 'Nintendo';
    } else if (/PlayStation/.test(userAgent)) {
      return 'PlayStation';
    } else if (/Xbox/.test(userAgent)) {
      return 'Xbox';
    } else if (/Oculus/.test(userAgent)) {
      return 'Oculus';
    } else if (/HTC/.test(userAgent)) {
      return 'HTC Vive';
    } else {
      return 'Web';
    }
  }

  private detectVersion(userAgent: string): string {
    // Extract version information from user agent
    const versionMatch = userAgent.match(/(?:Version|Chrome|Firefox|Safari)\/(\d+\.\d+)/);
    return versionMatch ? versionMatch[1] : 'Unknown';
  }

  private detectCapabilities(): PlatformCapabilities {
    return {
      touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      gamepad: 'getGamepads' in navigator,
      vr: 'getVRDisplays' in navigator || 'xr' in navigator,
      ar: 'xr' in navigator && 'isSessionSupported' in navigator.xr,
      webgl: !!this.getWebGLContext(),
      webgl2: !!this.getWebGL2Context(),
      webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
      serviceWorker: 'serviceWorker' in navigator,
      indexedDB: 'indexedDB' in window,
      localStorage: 'localStorage' in window,
      fileSystem: 'showOpenFilePicker' in window,
      network: 'navigator' in window,
      bluetooth: 'bluetooth' in navigator,
      nfc: 'NDEFReader' in window,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      accelerometer: 'Accelerometer' in window,
      gyroscope: 'Gyroscope' in window,
      magnetometer: 'Magnetometer' in window,
      gps: 'geolocation' in navigator
    };
  }

  private detectPerformanceMetrics(): PerformanceMetrics {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    return {
      cpuCores: navigator.hardwareConcurrency || 1,
      memoryGB: (performance as any).memory ? (performance as any).memory.jsHeapSizeLimit / (1024 * 1024 * 1024) : 1,
      gpuMemoryMB: gl ? this.getGPUMemoryInfo(gl) : 512,
      maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 2048,
      maxAnisotropy: gl ? this.getMaxAnisotropy(gl) : 1,
      maxDrawBuffers: gl ? gl.getParameter(gl.MAX_DRAW_BUFFERS) : 1,
      maxVertexUniformVectors: gl ? gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) : 128,
      maxFragmentUniformVectors: gl ? gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) : 16,
      maxVaryingVectors: gl ? gl.getParameter(gl.MAX_VARYING_VECTORS) : 8,
      maxVertexAttribs: gl ? gl.getParameter(gl.MAX_VERTEX_ATTRIBS) : 16,
      maxVertexTextureUnits: gl ? gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) : 0,
      maxTextureUnits: gl ? gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) : 8,
      maxRenderbufferSize: gl ? gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) : 2048,
      maxViewportDims: gl ? gl.getParameter(gl.MAX_VIEWPORT_DIMS) : [2048, 2048]
    };
  }

  private detectInputCapabilities(): InputCapabilities {
    return {
      keyboard: true,
      mouse: !('ontouchstart' in window),
      touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      gamepad: 'getGamepads' in navigator,
      vrControllers: 'getVRDisplays' in navigator || 'xr' in navigator,
      motionControls: 'DeviceMotionEvent' in window,
      voiceInput: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      eyeTracking: false, // Would need specific VR headset support
      hapticFeedback: 'vibrate' in navigator,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      maxGamepads: 4, // Standard limit
      maxVRControllers: 2 // Most VR systems have 2 controllers
    };
  }

  private detectGraphicsCapabilities(): GraphicsCapabilities {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const gl2 = canvas.getContext('webgl2');
    
    return {
      webgl: !!gl,
      webgl2: !!gl2,
      webgpu: 'gpu' in navigator,
      canvas2d: !!canvas.getContext('2d'),
      svg: 'createElementNS' in document,
      css3d: 'transform' in document.body.style,
      webxr: 'xr' in navigator,
      webvr: 'getVRDisplays' in navigator,
      maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 2048,
      maxAnisotropy: gl ? this.getMaxAnisotropy(gl) : 1,
      maxDrawBuffers: gl ? gl.getParameter(gl.MAX_DRAW_BUFFERS) : 1,
      maxVertexUniformVectors: gl ? gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) : 128,
      maxFragmentUniformVectors: gl ? gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) : 16,
      maxVaryingVectors: gl ? gl.getParameter(gl.MAX_VARYING_VECTORS) : 8,
      maxVertexAttribs: gl ? gl.getParameter(gl.MAX_VERTEX_ATTRIBS) : 16,
      maxVertexTextureUnits: gl ? gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) : 0,
      maxTextureUnits: gl ? gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) : 8,
      maxRenderbufferSize: gl ? gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) : 2048,
      maxViewportDims: gl ? gl.getParameter(gl.MAX_VIEWPORT_DIMS) : [2048, 2048],
      antialiasing: gl ? gl.getContextAttributes()?.antialias || false : false,
      depthBuffer: gl ? gl.getContextAttributes()?.depth || false : false,
      stencilBuffer: gl ? gl.getContextAttributes()?.stencil || false : false,
      alphaChannel: gl ? gl.getContextAttributes()?.alpha || false : false,
      premultipliedAlpha: gl ? gl.getContextAttributes()?.premultipliedAlpha || false : false,
      preserveDrawingBuffer: gl ? gl.getContextAttributes()?.preserveDrawingBuffer || false : false,
      powerPreference: 'default'
    };
  }

  private detectAudioCapabilities(): AudioCapabilities {
    const audioContext = window.AudioContext || (window as any).webkitAudioContext;
    
    return {
      webAudio: !!audioContext,
      audioContext: !!audioContext,
      audioWorklet: audioContext && 'audioWorklet' in audioContext,
      mediaDevices: 'mediaDevices' in navigator,
      getUserMedia: 'getUserMedia' in navigator.mediaDevices,
      audioInput: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      audioOutput: true,
      spatialAudio: audioContext && 'createPanner' in audioContext,
      maxChannels: audioContext ? audioContext.destination.maxChannelCount : 2,
      sampleRate: audioContext ? audioContext.sampleRate : 44100,
      latency: audioContext ? audioContext.baseLatency || 0.005 : 0.005
    };
  }

  private getWebGLContext(): WebGLRenderingContext | null {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  }

  private getWebGL2Context(): WebGL2RenderingContext | null {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl2');
  }

  private getGPUMemoryInfo(gl: WebGLRenderingContext): number {
    // Try to get GPU memory info (not always available)
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      // Parse renderer string to estimate memory (simplified)
      if (renderer.includes('NVIDIA')) return 2048;
      if (renderer.includes('AMD')) return 2048;
      if (renderer.includes('Intel')) return 1024;
    }
    return 512; // Default fallback
  }

  private getMaxAnisotropy(gl: WebGLRenderingContext): number {
    const ext = gl.getExtension('EXT_texture_filter_anisotropic');
    return ext ? gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1;
  }

  private async initializeInputManager(): Promise<void> {
    // Initialize platform-specific input handling
    this.inputManager = {
      keyboard: this.platformInfo.capabilities.keyboard,
      mouse: this.platformInfo.capabilities.mouse,
      touch: this.platformInfo.capabilities.touch,
      gamepad: this.platformInfo.capabilities.gamepad,
      vr: this.platformInfo.capabilities.vr
    };
  }

  private async initializeGraphicsManager(): Promise<void> {
    // Initialize platform-specific graphics handling
    this.graphicsManager = {
      webgl: this.platformInfo.capabilities.webgl,
      webgl2: this.platformInfo.capabilities.webgl2,
      canvas2d: true,
      svg: this.platformInfo.capabilities.svg
    };
  }

  private async initializeAudioManager(): Promise<void> {
    // Initialize platform-specific audio handling
    this.audioManager = {
      webAudio: this.platformInfo.capabilities.webAudio,
      spatialAudio: this.platformInfo.audio.spatialAudio,
      maxChannels: this.platformInfo.audio.maxChannels
    };
  }

  private async initializeNetworkManager(): Promise<void> {
    // Initialize platform-specific network handling
    this.networkManager = {
      online: navigator.onLine,
      connection: (navigator as any).connection || null
    };
  }

  private async initializeStorageManager(): Promise<void> {
    // Initialize platform-specific storage handling
    this.storageManager = {
      localStorage: this.platformInfo.capabilities.localStorage,
      indexedDB: this.platformInfo.capabilities.indexedDB,
      fileSystem: this.platformInfo.capabilities.fileSystem
    };
  }

  private applyPlatformOptimizations(): void {
    const platform = this.platformInfo.platform.toLowerCase();
    
    switch (platform) {
      case 'android':
      case 'ios':
        this.applyMobileOptimizations();
        break;
      case 'nintendo':
        this.applyNintendoOptimizations();
        break;
      case 'oculus':
      case 'htc vive':
        this.applyVROptimizations();
        break;
      case 'playstation':
      case 'xbox':
        this.applyConsoleOptimizations();
        break;
      default:
        this.applyDesktopOptimizations();
        break;
    }
  }

  private applyMobileOptimizations(): void {
    // Mobile-specific optimizations
    this.config.maxFPS = 60;
    this.config.enableVR = false;
    this.config.enableTouch = true;
    this.config.enableGamepad = false;
    this.config.vectorGraphics = true;
    this.config.adaptiveQuality = true;
  }

  private applyNintendoOptimizations(): void {
    // Nintendo DS/Switch optimizations
    this.config.maxFPS = 60;
    this.config.enableVR = false;
    this.config.enableTouch = true;
    this.config.enableGamepad = true;
    this.config.vectorGraphics = true;
    this.config.adaptiveQuality = true;
  }

  private applyVROptimizations(): void {
    // VR-specific optimizations
    this.config.maxFPS = 90;
    this.config.enableVR = true;
    this.config.enableTouch = false;
    this.config.enableGamepad = true;
    this.config.vectorGraphics = false; // VR needs 3D rendering
    this.config.adaptiveQuality = true;
  }

  private applyConsoleOptimizations(): void {
    // Console-specific optimizations
    this.config.maxFPS = 60;
    this.config.enableVR = false;
    this.config.enableTouch = false;
    this.config.enableGamepad = true;
    this.config.vectorGraphics = false;
    this.config.adaptiveQuality = false;
  }

  private applyDesktopOptimizations(): void {
    // Desktop-specific optimizations
    this.config.maxFPS = 60;
    this.config.enableVR = this.platformInfo.capabilities.vr;
    this.config.enableTouch = false;
    this.config.enableGamepad = true;
    this.config.vectorGraphics = true;
    this.config.adaptiveQuality = false;
  }

  // Public API methods
  getPlatformInfo(): PlatformInfo {
    return this.platformInfo;
  }

  isVRSupported(): boolean {
    return this.platformInfo.capabilities.vr;
  }

  isTouchSupported(): boolean {
    return this.platformInfo.capabilities.touch;
  }

  isGamepadSupported(): boolean {
    return this.platformInfo.capabilities.gamepad;
  }

  isWebGLSupported(): boolean {
    return this.platformInfo.capabilities.webgl;
  }

  isWebGL2Supported(): boolean {
    return this.platformInfo.capabilities.webgl2;
  }

  getOptimalGraphicsAPI(): 'webgl' | 'opengl' | 'directx' | 'metal' | 'vulkan' {
    const platform = this.platformInfo.platform.toLowerCase();
    
    if (platform.includes('windows')) {
      return 'directx';
    } else if (platform.includes('mac')) {
      return 'metal';
    } else if (platform.includes('linux')) {
      return 'vulkan';
    } else {
      return 'webgl';
    }
  }

  getOptimalResolution(): { width: number; height: number } {
    const platform = this.platformInfo.platform.toLowerCase();
    
    switch (platform) {
      case 'android':
      case 'ios':
        return { width: 1920, height: 1080 };
      case 'nintendo':
        return { width: 1280, height: 720 };
      case 'oculus':
      case 'htc vive':
        return { width: 2160, height: 1200 };
      case 'playstation':
      case 'xbox':
        return { width: 1920, height: 1080 };
      default:
        return { width: 1920, height: 1080 };
    }
  }

  getOptimalFPS(): number {
    const platform = this.platformInfo.platform.toLowerCase();
    
    switch (platform) {
      case 'oculus':
      case 'htc vive':
        return 90;
      case 'nintendo':
      case 'android':
      case 'ios':
      case 'playstation':
      case 'xbox':
        return 60;
      default:
        return 60;
    }
  }

  // Platform-specific utilities
  vibrate(pattern: number | number[]): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  requestFullscreen(): Promise<void> {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      return element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      return (element as any).webkitRequestFullscreen();
    } else if ((element as any).mozRequestFullScreen) {
      return (element as any).mozRequestFullScreen();
    } else if ((element as any).msRequestFullscreen) {
      return (element as any).msRequestFullscreen();
    }
    return Promise.resolve();
  }

  exitFullscreen(): Promise<void> {
    if (document.exitFullscreen) {
      return document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      return (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      return (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      return (document as any).msExitFullscreen();
    }
    return Promise.resolve();
  }

  isFullscreen(): boolean {
    return !!(document.fullscreenElement || 
             (document as any).webkitFullscreenElement || 
             (document as any).mozFullScreenElement || 
             (document as any).msFullscreenElement);
  }

  // Performance monitoring
  getPerformanceMetrics(): PerformanceMetrics {
    return this.platformInfo.performance;
  }

  getMemoryUsage(): { used: number; total: number; limit: number } {
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return { used: 0, total: 0, limit: 0 };
  }

  getBatteryInfo(): Promise<{ level: number; charging: boolean }> {
    if ('getBattery' in navigator) {
      return navigator.getBattery().then(battery => ({
        level: battery.level,
        charging: battery.charging
      }));
    }
    return Promise.resolve({ level: 1, charging: true });
  }

  // Network utilities
  getNetworkInfo(): { type: string; effectiveType: string; downlink: number } {
    const connection = (navigator as any).connection;
    if (connection) {
      return {
        type: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0
      };
    }
    return { type: 'unknown', effectiveType: 'unknown', downlink: 0 };
  }

  isOnline(): boolean {
    return navigator.onLine;
  }
} 
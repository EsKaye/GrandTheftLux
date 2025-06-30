/**
 * Performance Monitor - Cross-Platform Performance Tracking and Optimization
 * 
 * Provides performance monitoring for:
 * - Frame rate tracking and optimization
 * - Memory usage monitoring
 * - CPU and GPU performance metrics
 * - Platform-specific performance tuning
 * - Adaptive quality adjustment
 * - Performance profiling and debugging
 * 
 * Optimized for all platforms including Nintendo DS and VR
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage: number;
  drawCalls: number;
  triangles: number;
  vertices: number;
  textures: number;
  shaders: number;
  audioChannels: number;
  networkLatency: number;
  batteryLevel: number;
  temperature: number;
}

export interface PerformanceThresholds {
  targetFPS: number;
  minFPS: number;
  maxFrameTime: number;
  maxMemoryUsage: number;
  maxCPUUsage: number;
  maxGPUUsage: number;
  maxDrawCalls: number;
  maxTriangles: number;
}

export interface PerformanceProfile {
  name: string;
  thresholds: PerformanceThresholds;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  platform: string;
  timestamp: Date;
  metrics: PerformanceMetrics;
}

export class PerformanceMonitor {
  private isRunning: boolean = false;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private frameTimes: number[] = [];
  private maxFrameTimeHistory: number = 60; // Keep last 60 frames
  
  private metrics: PerformanceMetrics;
  private thresholds: PerformanceThresholds;
  private profiles: PerformanceProfile[] = [];
  
  private fpsUpdateInterval: number = 1000; // Update FPS every second
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;
  
  private memoryUpdateInterval: number = 5000; // Update memory every 5 seconds
  private lastMemoryUpdate: number = 0;
  
  private performanceUpdateInterval: number = 1000; // Update performance every second
  private lastPerformanceUpdate: number = 0;
  
  private observers: ((metrics: PerformanceMetrics) => void)[] = [];
  private warningCallbacks: ((warning: string) => void)[] = [];
  private errorCallbacks: ((error: string) => void)[] = [];

  constructor() {
    this.metrics = this.initializeMetrics();
    this.thresholds = this.initializeThresholds();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      fps: 0,
      frameTime: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      gpuUsage: 0,
      drawCalls: 0,
      triangles: 0,
      vertices: 0,
      textures: 0,
      shaders: 0,
      audioChannels: 0,
      networkLatency: 0,
      batteryLevel: 1,
      temperature: 0
    };
  }

  private initializeThresholds(): PerformanceThresholds {
    return {
      targetFPS: 60,
      minFPS: 30,
      maxFrameTime: 33.33, // 30 FPS equivalent
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxCPUUsage: 80, // 80%
      maxGPUUsage: 80, // 80%
      maxDrawCalls: 1000,
      maxTriangles: 100000
    };
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.frameTimes = [];
    
    console.log('📊 Performance Monitor started');
  }

  stop(): void {
    this.isRunning = false;
    console.log('🛑 Performance Monitor stopped');
  }

  beginFrame(): void {
    if (!this.isRunning) return;
    
    this.lastFrameTime = performance.now();
  }

  endFrame(): void {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    
    this.frameCount++;
    this.frameTimes.push(frameTime);
    
    // Keep only the last N frame times
    if (this.frameTimes.length > this.maxFrameTimeHistory) {
      this.frameTimes.shift();
    }
    
    // Update FPS
    if (currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      this.updateFPS();
      this.lastFpsUpdate = currentTime;
    }
    
    // Update memory usage
    if (currentTime - this.lastMemoryUpdate >= this.memoryUpdateInterval) {
      this.updateMemoryUsage();
      this.lastMemoryUpdate = currentTime;
    }
    
    // Update performance metrics
    if (currentTime - this.lastPerformanceUpdate >= this.performanceUpdateInterval) {
      this.updatePerformanceMetrics();
      this.lastPerformanceUpdate = currentTime;
    }
    
    // Update frame time
    this.metrics.frameTime = frameTime;
    
    // Check performance thresholds
    this.checkPerformanceThresholds();
    
    // Notify observers
    this.notifyObservers();
  }

  private updateFPS(): void {
    if (this.frameTimes.length === 0) return;
    
    const totalTime = this.frameTimes.reduce((sum, time) => sum + time, 0);
    const averageFrameTime = totalTime / this.frameTimes.length;
    this.currentFps = 1000 / averageFrameTime;
    this.metrics.fps = Math.round(this.currentFps);
  }

  private updateMemoryUsage(): void {
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
    } else {
      // Fallback estimation
      this.metrics.memoryUsage = 0;
    }
  }

  private updatePerformanceMetrics(): void {
    // Update CPU usage (simplified - would need more sophisticated measurement)
    this.metrics.cpuUsage = this.estimateCPUUsage();
    
    // Update GPU usage (simplified - would need WebGL extensions)
    this.metrics.gpuUsage = this.estimateGPUUsage();
    
    // Update battery level
    this.updateBatteryLevel();
    
    // Update temperature (platform-specific)
    this.updateTemperature();
  }

  private estimateCPUUsage(): number {
    // Simplified CPU usage estimation
    // In a real implementation, this would use more sophisticated methods
    const frameTime = this.metrics.frameTime;
    const targetFrameTime = 1000 / this.thresholds.targetFPS;
    return Math.min(100, (frameTime / targetFrameTime) * 100);
  }

  private estimateGPUUsage(): number {
    // Simplified GPU usage estimation
    // In a real implementation, this would use WebGL extensions or platform APIs
    const drawCalls = this.metrics.drawCalls;
    const maxDrawCalls = this.thresholds.maxDrawCalls;
    return Math.min(100, (drawCalls / maxDrawCalls) * 100);
  }

  private async updateBatteryLevel(): Promise<void> {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        this.metrics.batteryLevel = battery.level;
      } catch (error) {
        this.metrics.batteryLevel = 1; // Assume full battery if not available
      }
    } else {
      this.metrics.batteryLevel = 1;
    }
  }

  private updateTemperature(): void {
    // Temperature monitoring is platform-specific
    // For now, we'll use a simplified estimation based on performance
    const cpuUsage = this.metrics.cpuUsage;
    const gpuUsage = this.metrics.gpuUsage;
    const avgUsage = (cpuUsage + gpuUsage) / 2;
    
    // Simple temperature estimation (20°C base + usage-based increase)
    this.metrics.temperature = 20 + (avgUsage * 0.5);
  }

  private checkPerformanceThresholds(): void {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check FPS
    if (this.metrics.fps < this.thresholds.minFPS) {
      errors.push(`Low FPS: ${this.metrics.fps} (target: ${this.thresholds.minFPS})`);
    } else if (this.metrics.fps < this.thresholds.targetFPS * 0.8) {
      warnings.push(`FPS below target: ${this.metrics.fps} (target: ${this.thresholds.targetFPS})`);
    }

    // Check frame time
    if (this.metrics.frameTime > this.thresholds.maxFrameTime) {
      warnings.push(`High frame time: ${this.metrics.frameTime.toFixed(2)}ms`);
    }

    // Check memory usage
    if (this.metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      warnings.push(`High memory usage: ${(this.metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
    }

    // Check CPU usage
    if (this.metrics.cpuUsage > this.thresholds.maxCPUUsage) {
      warnings.push(`High CPU usage: ${this.metrics.cpuUsage.toFixed(1)}%`);
    }

    // Check GPU usage
    if (this.metrics.gpuUsage > this.thresholds.maxGPUUsage) {
      warnings.push(`High GPU usage: ${this.metrics.gpuUsage.toFixed(1)}%`);
    }

    // Check draw calls
    if (this.metrics.drawCalls > this.thresholds.maxDrawCalls) {
      warnings.push(`High draw calls: ${this.metrics.drawCalls}`);
    }

    // Check triangles
    if (this.metrics.triangles > this.thresholds.maxTriangles) {
      warnings.push(`High triangle count: ${this.metrics.triangles}`);
    }

    // Check battery level
    if (this.metrics.batteryLevel < 0.2) {
      warnings.push(`Low battery: ${(this.metrics.batteryLevel * 100).toFixed(0)}%`);
    }

    // Check temperature
    if (this.metrics.temperature > 80) {
      warnings.push(`High temperature: ${this.metrics.temperature.toFixed(1)}°C`);
    }

    // Notify callbacks
    warnings.forEach(warning => this.notifyWarning(warning));
    errors.forEach(error => this.notifyError(error));
  }

  // Public API methods
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getAverageFPS(): number {
    return this.currentFps;
  }

  getFrameTime(): number {
    return this.metrics.frameTime;
  }

  getMemoryUsage(): number {
    return this.metrics.memoryUsage;
  }

  getCPUUsage(): number {
    return this.metrics.cpuUsage;
  }

  getGPUUsage(): number {
    return this.metrics.gpuUsage;
  }

  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  // Rendering metrics
  setDrawCalls(count: number): void {
    this.metrics.drawCalls = count;
  }

  setTriangles(count: number): void {
    this.metrics.triangles = count;
  }

  setVertices(count: number): void {
    this.metrics.vertices = count;
  }

  setTextures(count: number): void {
    this.metrics.textures = count;
  }

  setShaders(count: number): void {
    this.metrics.shaders = count;
  }

  setAudioChannels(count: number): void {
    this.metrics.audioChannels = count;
  }

  setNetworkLatency(latency: number): void {
    this.metrics.networkLatency = latency;
  }

  // Performance profiling
  createProfile(name: string, quality: 'low' | 'medium' | 'high' | 'ultra', platform: string): void {
    const profile: PerformanceProfile = {
      name,
      thresholds: { ...this.thresholds },
      quality,
      platform,
      timestamp: new Date(),
      metrics: { ...this.metrics }
    };
    
    this.profiles.push(profile);
  }

  getProfiles(): PerformanceProfile[] {
    return [...this.profiles];
  }

  getProfile(name: string): PerformanceProfile | null {
    return this.profiles.find(profile => profile.name === name) || null;
  }

  clearProfiles(): void {
    this.profiles = [];
  }

  // Observer pattern
  addObserver(observer: (metrics: PerformanceMetrics) => void): void {
    this.observers.push(observer);
  }

  removeObserver(observer: (metrics: PerformanceMetrics) => void): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  addWarningCallback(callback: (warning: string) => void): void {
    this.warningCallbacks.push(callback);
  }

  removeWarningCallback(callback: (warning: string) => void): void {
    const index = this.warningCallbacks.indexOf(callback);
    if (index !== -1) {
      this.warningCallbacks.splice(index, 1);
    }
  }

  addErrorCallback(callback: (error: string) => void): void {
    this.errorCallbacks.push(callback);
  }

  removeErrorCallback(callback: (error: string) => void): void {
    const index = this.errorCallbacks.indexOf(callback);
    if (index !== -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  private notifyObservers(): void {
    const metrics = this.getMetrics();
    this.observers.forEach(observer => observer(metrics));
  }

  private notifyWarning(warning: string): void {
    this.warningCallbacks.forEach(callback => callback(warning));
  }

  private notifyError(error: string): void {
    this.errorCallbacks.forEach(callback => callback(error));
  }

  // Platform-specific optimizations
  optimizeForPlatform(platform: string): void {
    switch (platform.toLowerCase()) {
      case 'mobile':
        this.optimizeForMobile();
        break;
      case 'nintendo':
        this.optimizeForNintendo();
        break;
      case 'vr':
        this.optimizeForVR();
        break;
      case 'console':
        this.optimizeForConsole();
        break;
      default:
        this.optimizeForDesktop();
        break;
    }
  }

  private optimizeForMobile(): void {
    this.thresholds.targetFPS = 60;
    this.thresholds.minFPS = 30;
    this.thresholds.maxFrameTime = 33.33;
    this.thresholds.maxMemoryUsage = 50 * 1024 * 1024; // 50MB
    this.thresholds.maxCPUUsage = 70;
    this.thresholds.maxGPUUsage = 70;
    this.thresholds.maxDrawCalls = 500;
    this.thresholds.maxTriangles = 50000;
  }

  private optimizeForNintendo(): void {
    this.thresholds.targetFPS = 60;
    this.thresholds.minFPS = 30;
    this.thresholds.maxFrameTime = 33.33;
    this.thresholds.maxMemoryUsage = 25 * 1024 * 1024; // 25MB
    this.thresholds.maxCPUUsage = 80;
    this.thresholds.maxGPUUsage = 80;
    this.thresholds.maxDrawCalls = 300;
    this.thresholds.maxTriangles = 30000;
  }

  private optimizeForVR(): void {
    this.thresholds.targetFPS = 90;
    this.thresholds.minFPS = 72;
    this.thresholds.maxFrameTime = 13.89; // 72 FPS equivalent
    this.thresholds.maxMemoryUsage = 200 * 1024 * 1024; // 200MB
    this.thresholds.maxCPUUsage = 85;
    this.thresholds.maxGPUUsage = 85;
    this.thresholds.maxDrawCalls = 800;
    this.thresholds.maxTriangles = 80000;
  }

  private optimizeForConsole(): void {
    this.thresholds.targetFPS = 60;
    this.thresholds.minFPS = 30;
    this.thresholds.maxFrameTime = 33.33;
    this.thresholds.maxMemoryUsage = 500 * 1024 * 1024; // 500MB
    this.thresholds.maxCPUUsage = 90;
    this.thresholds.maxGPUUsage = 90;
    this.thresholds.maxDrawCalls = 1500;
    this.thresholds.maxTriangles = 150000;
  }

  private optimizeForDesktop(): void {
    this.thresholds.targetFPS = 60;
    this.thresholds.minFPS = 30;
    this.thresholds.maxFrameTime = 33.33;
    this.thresholds.maxMemoryUsage = 100 * 1024 * 1024; // 100MB
    this.thresholds.maxCPUUsage = 80;
    this.thresholds.maxGPUUsage = 80;
    this.thresholds.maxDrawCalls = 1000;
    this.thresholds.maxTriangles = 100000;
  }

  // Performance recommendations
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.fps < this.thresholds.targetFPS) {
      recommendations.push('Consider reducing graphics quality to improve FPS');
    }

    if (this.metrics.memoryUsage > this.thresholds.maxMemoryUsage * 0.8) {
      recommendations.push('Consider reducing texture quality or clearing cache');
    }

    if (this.metrics.drawCalls > this.thresholds.maxDrawCalls * 0.8) {
      recommendations.push('Consider batching draw calls or reducing object count');
    }

    if (this.metrics.triangles > this.thresholds.maxTriangles * 0.8) {
      recommendations.push('Consider using LOD (Level of Detail) or reducing mesh complexity');
    }

    if (this.metrics.batteryLevel < 0.3) {
      recommendations.push('Consider enabling power saving mode');
    }

    return recommendations;
  }

  // Debug information
  getDebugInfo(): any {
    return {
      isRunning: this.isRunning,
      frameCount: this.frameCount,
      frameTimeHistory: this.frameTimes.length,
      observers: this.observers.length,
      warningCallbacks: this.warningCallbacks.length,
      errorCallbacks: this.errorCallbacks.length,
      profiles: this.profiles.length,
      metrics: this.getMetrics(),
      thresholds: this.getThresholds(),
      recommendations: this.getPerformanceRecommendations()
    };
  }
} 
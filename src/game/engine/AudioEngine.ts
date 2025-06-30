/**
 * 🎵 Audio Engine
 * 
 * Comprehensive audio system for:
 * - Spatial 3D audio for vehicles and effects
 * - Dynamic music system
 * - Sound effect management
 * - Audio compression and streaming
 * - Performance optimization
 */

import * as THREE from 'three';

export interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  spatialAudio: boolean;
  maxSources: number;
  sampleRate: number;
  bufferSize: number;
  compression: boolean;
}

export interface AudioSource {
  id: string;
  type: 'music' | 'sfx' | 'ambient' | 'voice';
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  pannerNode?: PannerNode;
  position?: THREE.Vector3;
  velocity?: THREE.Vector3;
  loop: boolean;
  volume: number;
  isPlaying: boolean;
  startTime: number;
  userData?: any;
}

export interface AudioListener {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  orientation: THREE.Vector3;
  up: THREE.Vector3;
}

export class AudioEngine {
  private config: AudioConfig;
  private audioContext: AudioContext | null = null;
  private listener: AudioListener;
  
  // Audio sources
  private sources: Map<string, AudioSource> = new Map();
  private musicSources: Map<string, AudioSource> = new Map();
  private sfxSources: Map<string, AudioSource> = new Map();
  private ambientSources: Map<string, AudioSource> = new Map();
  
  // Audio buffers
  private buffers: Map<string, AudioBuffer> = new Map();
  private loadingPromises: Map<string, Promise<AudioBuffer>> = new Map();
  
  // Performance tracking
  private activeSources: number = 0;
  private memoryUsage: number = 0;
  
  // Music system
  private currentMusic: string | null = null;
  private musicQueue: string[] = [];
  private musicVolume: number = 0.7;
  private fadeTime: number = 2.0;
  
  constructor(config: AudioConfig) {
    this.config = config;
    this.listener = {
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      orientation: new THREE.Vector3(0, 0, -1),
      up: new THREE.Vector3(0, 1, 0)
    };
  }
  
  /**
   * Initialize the audio engine
   */
  public async initialize(): Promise<void> {
    console.log('🎵 Initializing Audio Engine...');
    
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate,
        latencyHint: 'interactive'
      });
      
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Set up master gain node
      this.setupMasterGain();
      
      // Load default audio assets
      await this.loadDefaultAudio();
      
      console.log('✅ Audio Engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Audio Engine:', error);
      throw error;
    }
  }
  
  /**
   * Set up master gain node
   */
  private setupMasterGain(): void {
    if (!this.audioContext) return;
    
    const masterGain = this.audioContext.createGain();
    masterGain.gain.value = this.config.masterVolume;
    masterGain.connect(this.audioContext.destination);
    
    // Store master gain for later use
    (this.audioContext as any).masterGain = masterGain;
  }
  
  /**
   * Load default audio assets
   */
  private async loadDefaultAudio(): Promise<void> {
    const defaultAudio = [
      { id: 'engine_idle', url: '/assets/audio/engine_idle.mp3', type: 'sfx' },
      { id: 'engine_rev', url: '/assets/audio/engine_rev.mp3', type: 'sfx' },
      { id: 'horn', url: '/assets/audio/horn.mp3', type: 'sfx' },
      { id: 'brake', url: '/assets/audio/brake.mp3', type: 'sfx' },
      { id: 'crash', url: '/assets/audio/crash.mp3', type: 'sfx' },
      { id: 'city_ambient', url: '/assets/audio/city_ambient.mp3', type: 'ambient' },
      { id: 'menu_music', url: '/assets/audio/menu_music.mp3', type: 'music' },
      { id: 'game_music', url: '/assets/audio/game_music.mp3', type: 'music' }
    ];
    
    const loadPromises = defaultAudio.map(audio => this.loadAudio(audio.id, audio.url));
    
    try {
      await Promise.all(loadPromises);
      console.log('📦 Default audio assets loaded');
    } catch (error) {
      console.warn('⚠️ Some audio assets failed to load:', error);
    }
  }
  
  /**
   * Load audio file
   */
  public async loadAudio(id: string, url: string): Promise<AudioBuffer> {
    // Check if already loading
    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!;
    }
    
    // Check if already loaded
    if (this.buffers.has(id)) {
      return this.buffers.get(id)!;
    }
    
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }
    
    const loadPromise = this.fetchAudioBuffer(url);
    this.loadingPromises.set(id, loadPromise);
    
    try {
      const buffer = await loadPromise;
      this.buffers.set(id, buffer);
      this.loadingPromises.delete(id);
      return buffer;
    } catch (error) {
      this.loadingPromises.delete(id);
      throw error;
    }
  }
  
  /**
   * Fetch audio buffer from URL
   */
  private async fetchAudioBuffer(url: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load audio: ${url}`, error);
      throw error;
    }
  }
  
  /**
   * Play audio source
   */
  public playAudio(
    id: string,
    options: {
      volume?: number;
      loop?: boolean;
      position?: THREE.Vector3;
      velocity?: THREE.Vector3;
      type?: 'music' | 'sfx' | 'ambient' | 'voice';
    } = {}
  ): AudioSource | null {
    if (!this.audioContext || this.audioContext.state !== 'running') {
      console.warn('Audio context not ready');
      return null;
    }
    
    const buffer = this.buffers.get(id);
    if (!buffer) {
      console.warn(`Audio buffer not found: ${id}`);
      return null;
    }
    
    // Check source limit
    if (this.activeSources >= this.config.maxSources) {
      this.stopOldestSource();
    }
    
    // Create audio source
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop || false;
    
    // Create gain node
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = (options.volume || 1.0) * this.getVolumeForType(options.type || 'sfx');
    
    // Create panner node for spatial audio
    let pannerNode: PannerNode | undefined;
    if (this.config.spatialAudio && options.position) {
      pannerNode = this.audioContext.createPanner();
      pannerNode.panningModel = 'HRTF';
      pannerNode.distanceModel = 'inverse';
      pannerNode.refDistance = 1;
      pannerNode.maxDistance = 100;
      pannerNode.rolloffFactor = 1;
      pannerNode.coneInnerAngle = 360;
      pannerNode.coneOuterAngle = 360;
      pannerNode.coneOuterGain = 0;
      
      pannerNode.setPosition(options.position.x, options.position.y, options.position.z);
      if (options.velocity) {
        pannerNode.setVelocity(options.velocity.x, options.velocity.y, options.velocity.z);
      }
    }
    
    // Connect nodes
    source.connect(gainNode);
    if (pannerNode) {
      gainNode.connect(pannerNode);
      pannerNode.connect((this.audioContext as any).masterGain);
    } else {
      gainNode.connect((this.audioContext as any).masterGain);
    }
    
    // Create audio source object
    const audioSource: AudioSource = {
      id: `${id}_${Date.now()}_${Math.random()}`,
      type: options.type || 'sfx',
      source,
      gainNode,
      pannerNode,
      position: options.position?.clone(),
      velocity: options.velocity?.clone(),
      loop: options.loop || false,
      volume: options.volume || 1.0,
      isPlaying: false,
      startTime: this.audioContext.currentTime,
      userData: { originalId: id }
    };
    
    // Start playback
    source.start();
    audioSource.isPlaying = true;
    this.activeSources++;
    
    // Store source
    this.sources.set(audioSource.id, audioSource);
    
    // Categorize source
    switch (audioSource.type) {
      case 'music':
        this.musicSources.set(audioSource.id, audioSource);
        break;
      case 'sfx':
        this.sfxSources.set(audioSource.id, audioSource);
        break;
      case 'ambient':
        this.ambientSources.set(audioSource.id, audioSource);
        break;
    }
    
    // Set up cleanup when source ends
    source.onended = () => {
      this.cleanupSource(audioSource.id);
    };
    
    return audioSource;
  }
  
  /**
   * Stop audio source
   */
  public stopAudio(sourceId: string): void {
    const source = this.sources.get(sourceId);
    if (source && source.isPlaying) {
      try {
        source.source.stop();
        source.isPlaying = false;
      } catch (error) {
        console.warn('Failed to stop audio source:', error);
      }
      this.cleanupSource(sourceId);
    }
  }
  
  /**
   * Stop all audio sources
   */
  public stopAllAudio(): void {
    this.sources.forEach(source => {
      if (source.isPlaying) {
        try {
          source.source.stop();
        } catch (error) {
          // Ignore errors when stopping sources
        }
      }
    });
    
    this.sources.clear();
    this.musicSources.clear();
    this.sfxSources.clear();
    this.ambientSources.clear();
    this.activeSources = 0;
  }
  
  /**
   * Play music with fade transition
   */
  public playMusic(musicId: string, fadeIn: boolean = true): void {
    if (this.currentMusic === musicId) return;
    
    // Stop current music with fade out
    if (this.currentMusic) {
      this.fadeOutMusic(this.fadeTime);
    }
    
    // Play new music
    const musicSource = this.playAudio(musicId, {
      type: 'music',
      volume: fadeIn ? 0 : this.musicVolume,
      loop: true
    });
    
    if (musicSource) {
      this.currentMusic = musicId;
      
      // Fade in if requested
      if (fadeIn) {
        this.fadeInMusic(musicSource.id, this.fadeTime);
      }
    }
  }
  
  /**
   * Fade in music
   */
  private fadeInMusic(sourceId: string, duration: number): void {
    const source = this.musicSources.get(sourceId);
    if (!source) return;
    
    const startTime = this.audioContext!.currentTime;
    const startVolume = 0;
    const endVolume = this.musicVolume;
    
    source.gainNode.gain.setValueAtTime(startVolume, startTime);
    source.gainNode.gain.linearRampToValueAtTime(endVolume, startTime + duration);
  }
  
  /**
   * Fade out current music
   */
  private fadeOutMusic(duration: number): void {
    this.musicSources.forEach(source => {
      const startTime = this.audioContext!.currentTime;
      const startVolume = source.gainNode.gain.value;
      
      source.gainNode.gain.setValueAtTime(startVolume, startTime);
      source.gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      
      // Stop source after fade
      setTimeout(() => {
        this.stopAudio(source.id);
      }, duration * 1000);
    });
  }
  
  /**
   * Play vehicle engine sound
   */
  public playEngineSound(
    vehicleId: string,
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    rpm: number,
    throttle: number
  ): void {
    // Stop existing engine sound for this vehicle
    this.stopVehicleAudio(vehicleId);
    
    // Play engine idle sound
    const engineSource = this.playAudio('engine_idle', {
      type: 'sfx',
      position,
      velocity,
      loop: true,
      volume: 0.3 * throttle
    });
    
    if (engineSource) {
      engineSource.userData = { ...engineSource.userData, vehicleId, isEngine: true };
    }
    
    // Play engine rev sound if throttle is high
    if (throttle > 0.5) {
      const revSource = this.playAudio('engine_rev', {
        type: 'sfx',
        position,
        velocity,
        loop: false,
        volume: 0.2 * throttle
      });
      
      if (revSource) {
        revSource.userData = { ...revSource.userData, vehicleId, isEngine: true };
      }
    }
  }
  
  /**
   * Stop vehicle audio
   */
  public stopVehicleAudio(vehicleId: string): void {
    this.sources.forEach(source => {
      if (source.userData?.vehicleId === vehicleId) {
        this.stopAudio(source.id);
      }
    });
  }
  
  /**
   * Update audio listener position
   */
  public updateListener(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    orientation: THREE.Vector3,
    up: THREE.Vector3
  ): void {
    this.listener.position.copy(position);
    this.listener.velocity.copy(velocity);
    this.listener.orientation.copy(orientation);
    this.listener.up.copy(up);
    
    // Update audio context listener
    if (this.audioContext && this.config.spatialAudio) {
      this.audioContext.listener.setPosition(position.x, position.y, position.z);
      this.audioContext.listener.setVelocity(velocity.x, velocity.y, velocity.z);
      this.audioContext.listener.setOrientation(
        orientation.x, orientation.y, orientation.z,
        up.x, up.y, up.z
      );
    }
  }
  
  /**
   * Update audio source position
   */
  public updateSourcePosition(sourceId: string, position: THREE.Vector3, velocity?: THREE.Vector3): void {
    const source = this.sources.get(sourceId);
    if (source && source.pannerNode && this.config.spatialAudio) {
      source.position = position.clone();
      source.pannerNode.setPosition(position.x, position.y, position.z);
      
      if (velocity) {
        source.velocity = velocity.clone();
        source.pannerNode.setVelocity(velocity.x, velocity.y, velocity.z);
      }
    }
  }
  
  /**
   * Set master volume
   */
  public setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    if ((this.audioContext as any).masterGain) {
      (this.audioContext as any).masterGain.gain.value = this.config.masterVolume;
    }
  }
  
  /**
   * Set music volume
   */
  public setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    this.musicVolume = this.config.musicVolume;
    
    // Update all music sources
    this.musicSources.forEach(source => {
      source.gainNode.gain.value = source.volume * this.musicVolume;
    });
  }
  
  /**
   * Set SFX volume
   */
  public setSFXVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
    
    // Update all SFX sources
    this.sfxSources.forEach(source => {
      source.gainNode.gain.value = source.volume * this.config.sfxVolume;
    });
  }
  
  /**
   * Get volume for audio type
   */
  private getVolumeForType(type: string): number {
    switch (type) {
      case 'music':
        return this.config.musicVolume;
      case 'sfx':
        return this.config.sfxVolume;
      case 'ambient':
        return this.config.sfxVolume * 0.5;
      case 'voice':
        return this.config.sfxVolume * 0.8;
      default:
        return 1.0;
    }
  }
  
  /**
   * Stop oldest source when limit reached
   */
  private stopOldestSource(): void {
    let oldestSource: AudioSource | null = null;
    let oldestTime = Infinity;
    
    this.sources.forEach(source => {
      if (source.startTime < oldestTime) {
        oldestTime = source.startTime;
        oldestSource = source;
      }
    });
    
    if (oldestSource) {
      this.stopAudio(oldestSource.id);
    }
  }
  
  /**
   * Clean up audio source
   */
  private cleanupSource(sourceId: string): void {
    const source = this.sources.get(sourceId);
    if (source) {
      this.sources.delete(sourceId);
      this.musicSources.delete(sourceId);
      this.sfxSources.delete(sourceId);
      this.ambientSources.delete(sourceId);
      this.activeSources--;
    }
  }
  
  /**
   * Get audio statistics
   */
  public getStats(): any {
    return {
      activeSources: this.activeSources,
      totalSources: this.sources.size,
      musicSources: this.musicSources.size,
      sfxSources: this.sfxSources.size,
      ambientSources: this.ambientSources.size,
      loadedBuffers: this.buffers.size,
      loadingBuffers: this.loadingPromises.size,
      memoryUsage: this.memoryUsage,
      contextState: this.audioContext?.state
    };
  }
  
  /**
   * Update audio engine
   */
  public update(deltaTime: number): void {
    // Update spatial audio positions
    if (this.config.spatialAudio) {
      this.sources.forEach(source => {
        if (source.position && source.pannerNode) {
          // Update based on listener position
          const relativePosition = source.position.clone().sub(this.listener.position);
          source.pannerNode.setPosition(
            relativePosition.x,
            relativePosition.y,
            relativePosition.z
          );
        }
      });
    }
    
    // Clean up finished sources
    this.sources.forEach(source => {
      if (!source.isPlaying && source.source.buffer) {
        const currentTime = this.audioContext?.currentTime || 0;
        const duration = source.source.buffer.duration;
        
        if (currentTime - source.startTime > duration) {
          this.cleanupSource(source.id);
        }
      }
    });
  }
  
  /**
   * Dispose of audio engine
   */
  public dispose(): void {
    this.stopAllAudio();
    
    // Dispose of audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    // Clear buffers
    this.buffers.clear();
    this.loadingPromises.clear();
  }
} 
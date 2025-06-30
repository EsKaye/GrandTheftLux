/**
 * Cross-Platform Game Engine - Unity-Inspired Architecture
 * 
 * This engine is designed to run efficiently on all platforms:
 * - Desktop (Windows, macOS, Linux)
 * - Mobile (iOS, Android)
 * - Console (Nintendo DS, Switch, PlayStation, Xbox)
 * - VR/AR (Oculus, HTC Vive, HoloLens)
 * - Web (Progressive Web App)
 * 
 * Key Features:
 * - Vector-based infinitely scalable graphics
 * - Modular component system
 * - Cross-platform input handling
 * - Adaptive performance scaling
 * - Universal asset pipeline
 */

import { GameConfig } from '../types/GameConfig';
import { Vector2D, Vector3D, Matrix4x4 } from './math/VectorMath';
import { Component, GameObject, Transform } from './core/GameObject';
import { VectorRenderer } from './rendering/VectorRenderer';
import { InputManager } from './InputManager';
import { PhysicsEngine } from './PhysicsEngine';
import { AudioEngine } from './AudioEngine';
import { SceneManager } from './SceneManager';
import { AssetManager } from './assets/AssetManager';
import { PlatformAdapter } from './platform/PlatformAdapter';
import { PerformanceMonitor } from './utils/PerformanceMonitor';

export interface EngineConfig {
  targetPlatform: 'desktop' | 'mobile' | 'console' | 'vr' | 'web';
  graphicsAPI: 'webgl' | 'opengl' | 'directx' | 'metal' | 'vulkan';
  resolution: Vector2D;
  maxFPS: number;
  enableVR: boolean;
  enableTouch: boolean;
  enableGamepad: boolean;
  vectorGraphics: boolean;
  adaptiveQuality: boolean;
}

export class CrossPlatformEngine {
  private static instance: CrossPlatformEngine;
  private config: EngineConfig;
  private platformAdapter: PlatformAdapter;
  private renderer: VectorRenderer;
  private inputManager: InputManager;
  private physicsEngine: PhysicsEngine;
  private audioEngine: AudioEngine;
  private sceneManager: SceneManager;
  private assetManager: AssetManager;
  private performanceMonitor: PerformanceMonitor;
  
  private gameObjects: Map<string, GameObject> = new Map();
  private components: Map<string, Component[]> = new Map();
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private deltaTime: number = 0;

  private constructor(config: EngineConfig) {
    this.config = config;
    this.initializeEngine();
  }

  public static getInstance(config?: EngineConfig): CrossPlatformEngine {
    if (!CrossPlatformEngine.instance && config) {
      CrossPlatformEngine.instance = new CrossPlatformEngine(config);
    }
    return CrossPlatformEngine.instance;
  }

  private async initializeEngine(): Promise<void> {
    console.log('🚀 Initializing Cross-Platform Game Engine...');
    
    // Initialize platform-specific adapter
    this.platformAdapter = new PlatformAdapter(this.config);
    await this.platformAdapter.initialize();

    // Initialize core systems
    this.renderer = new VectorRenderer({
      width: this.config.resolution.x,
      height: this.config.resolution.y,
      pixelRatio: window.devicePixelRatio || 1,
      antialiasing: true,
      vsync: true,
      maxFPS: this.config.maxFPS,
      quality: 'high',
      vectorGraphics: this.config.vectorGraphics,
      enableShadows: true,
      enableReflections: false,
      enablePostProcessing: true
    });
    
    this.inputManager = new InputManager(this.config);
    this.physicsEngine = new PhysicsEngine();
    this.audioEngine = new AudioEngine();
    this.sceneManager = new SceneManager();
    this.assetManager = new AssetManager();
    this.performanceMonitor = new PerformanceMonitor();

    // Setup cross-platform input handling
    this.setupInputHandling();

    // Initialize vector graphics system
    await this.renderer.initialize();

    console.log('✅ Cross-Platform Engine initialized successfully');
  }

  private setupInputHandling(): void {
    // Universal input mapping for all platforms
    this.inputManager.registerInputMap({
      // Movement controls (works on all platforms)
      moveForward: {
        keyboard: ['KeyW', 'ArrowUp'],
        gamepad: ['leftStickY', 'dpadUp'],
        touch: ['virtualJoystick'],
        vr: ['controllerThumbstick']
      },
      moveBackward: {
        keyboard: ['KeyS', 'ArrowDown'],
        gamepad: ['leftStickY', 'dpadDown'],
        touch: ['virtualJoystick'],
        vr: ['controllerThumbstick']
      },
      moveLeft: {
        keyboard: ['KeyA', 'ArrowLeft'],
        gamepad: ['leftStickX', 'dpadLeft'],
        touch: ['virtualJoystick'],
        vr: ['controllerThumbstick']
      },
      moveRight: {
        keyboard: ['KeyD', 'ArrowRight'],
        gamepad: ['leftStickX', 'dpadRight'],
        touch: ['virtualJoystick'],
        vr: ['controllerThumbstick']
      },
      // Action controls
      action: {
        keyboard: ['Space', 'Enter'],
        gamepad: ['buttonA', 'buttonX'],
        touch: ['tap'],
        vr: ['trigger']
      },
      // Camera controls
      lookUp: {
        keyboard: ['MouseY'],
        gamepad: ['rightStickY'],
        touch: ['touchPan'],
        vr: ['headsetRotation']
      },
      lookDown: {
        keyboard: ['MouseY'],
        gamepad: ['rightStickY'],
        touch: ['touchPan'],
        vr: ['headsetRotation']
      },
      lookLeft: {
        keyboard: ['MouseX'],
        gamepad: ['rightStickX'],
        touch: ['touchPan'],
        vr: ['headsetRotation']
      },
      lookRight: {
        keyboard: ['MouseX'],
        gamepad: ['rightStickX'],
        touch: ['touchPan'],
        vr: ['headsetRotation']
      }
    });
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;

    console.log('🎮 Starting Cross-Platform Game Engine...');
    this.isRunning = true;
    this.lastFrameTime = performance.now();

    // Start all subsystems
    await this.renderer.start();
    this.inputManager.start();
    this.physicsEngine.start();
    this.audioEngine.start();
    this.sceneManager.start();
    this.performanceMonitor.start();

    // Start the main game loop
    this.gameLoop();
  }

  public stop(): void {
    this.isRunning = false;
    
    // Stop all subsystems
    this.renderer.stop();
    this.inputManager.stop();
    this.physicsEngine.stop();
    this.audioEngine.stop();
    this.sceneManager.stop();
    this.performanceMonitor.stop();
    
    console.log('🛑 Cross-Platform Game Engine stopped');
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    // Cap delta time to prevent spiral of death
    this.deltaTime = Math.min(this.deltaTime, 1 / 30);

    // Update performance monitor
    this.performanceMonitor.beginFrame();

    // Update input
    this.inputManager.update(this.deltaTime);

    // Update physics
    this.physicsEngine.update(this.deltaTime);

    // Update game objects and components
    this.updateGameObjects(this.deltaTime);

    // Update audio
    this.audioEngine.update(this.deltaTime);

    // Render frame with vector graphics
    this.renderer.render(this.sceneManager.getActiveScene());

    // End frame and monitor performance
    this.performanceMonitor.endFrame();

    // Adaptive quality adjustment
    if (this.config.adaptiveQuality) {
      this.adjustQualitySettings();
    }

    // Schedule next frame
    requestAnimationFrame(() => this.gameLoop());
  }

  private updateGameObjects(deltaTime: number): void {
    // Update all game objects
    for (const [id, gameObject] of this.gameObjects) {
      if (gameObject.isActive) {
        gameObject.update(deltaTime);
      }
    }

    // Update all components
    for (const [type, components] of this.components) {
      for (const component of components) {
        if (component.gameObject.isActive && component.enabled) {
          component.update(deltaTime);
        }
      }
    }
  }

  private adjustQualitySettings(): void {
    const fps = this.performanceMonitor.getAverageFPS();
    const targetFPS = this.config.maxFPS;

    if (fps < targetFPS * 0.8) {
      // Reduce quality
      this.renderer.reduceQuality();
      this.physicsEngine.reduceSimulationSteps();
    } else if (fps > targetFPS * 0.95) {
      // Increase quality
      this.renderer.increaseQuality();
      this.physicsEngine.increaseSimulationSteps();
    }
  }

  // GameObject Management
  public createGameObject(name: string, position?: Vector3D): GameObject {
    const gameObject = new GameObject(name, position);
    this.gameObjects.set(gameObject.id, gameObject);
    return gameObject;
  }

  public destroyGameObject(gameObject: GameObject): void {
    this.gameObjects.delete(gameObject.id);
    gameObject.destroy();
  }

  public getGameObject(id: string): GameObject | undefined {
    return this.gameObjects.get(id);
  }

  // Component Management
  public addComponent<T extends Component>(gameObject: GameObject, componentType: new (gameObject: GameObject) => T): T {
    const component = new componentType(gameObject);
    gameObject.addComponent(component);
    
    const typeName = component.constructor.name;
    if (!this.components.has(typeName)) {
      this.components.set(typeName, []);
    }
    this.components.get(typeName)!.push(component);
    
    return component;
  }

  public getComponents<T extends Component>(componentType: new (gameObject: GameObject) => T): T[] {
    const typeName = componentType.name;
    return (this.components.get(typeName) || []) as T[];
  }

  // Platform-specific utilities
  public getPlatformInfo() {
    return this.platformAdapter.getPlatformInfo();
  }

  public isVRMode(): boolean {
    return this.config.enableVR && this.platformAdapter.isVRSupported();
  }

  public isTouchMode(): boolean {
    return this.config.enableTouch && this.platformAdapter.isTouchSupported();
  }

  // Getters
  public getDeltaTime(): number {
    return this.deltaTime;
  }

  public getConfig(): EngineConfig {
    return this.config;
  }

  public getRenderer(): VectorRenderer {
    return this.renderer;
  }

  public getInputManager(): InputManager {
    return this.inputManager;
  }

  public getPhysicsEngine(): PhysicsEngine {
    return this.physicsEngine;
  }

  public getAudioEngine(): AudioEngine {
    return this.audioEngine;
  }

  public getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  public getAssetManager(): AssetManager {
    return this.assetManager;
  }

  public getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }
} 
/**
 * 🎮 GTL IV Game Engine
 * 
 * Core game engine responsible for:
 * - Game loop management
 * - Rendering pipeline
 * - System coordination
 * - Performance optimization
 * - Resource management
 */

import * as THREE from 'three';
import { PhysicsEngine } from './PhysicsEngine';
import { AudioEngine } from './AudioEngine';
import { InputManager } from './InputManager';
import { SceneManager } from './SceneManager';
import { AssetManager } from './AssetManager';
import { GameState } from '../types/GameState';
import { GameConfig } from '../types/GameConfig';

export class GameEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  
  // Core systems
  private physicsEngine: PhysicsEngine;
  private audioEngine: AudioEngine;
  private inputManager: InputManager;
  private sceneManager: SceneManager;
  private assetManager: AssetManager;
  
  // Game state
  private gameState: GameState;
  private config: GameConfig;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  
  // Performance tracking
  private fpsCounter: number = 0;
  private fpsTimer: number = 0;
  private currentFPS: number = 0;
  
  constructor(config: GameConfig) {
    this.config = config;
    this.gameState = new GameState();
    this.clock = new THREE.Clock();
    
    // Initialize core systems
    this.initializeRenderer();
    this.initializeScene();
    this.initializeSystems();
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Initialize WebGL renderer with optimal settings
   */
  private initializeRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    
    this.renderer.setSize(this.config.width, this.config.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
  }
  
  /**
   * Initialize 3D scene with lighting and environment
   */
  private initializeScene(): void {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x87ceeb, 100, 1000);
    
    // Set up camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.config.width / this.config.height,
      0.1,
      10000
    );
    this.camera.position.set(0, 100, 200);
    this.camera.lookAt(0, 0, 0);
    
    // Add ambient lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    // Add directional lighting (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    this.scene.add(directionalLight);
  }
  
  /**
   * Initialize all game systems
   */
  private initializeSystems(): void {
    this.physicsEngine = new PhysicsEngine();
    this.audioEngine = new AudioEngine();
    this.inputManager = new InputManager();
    this.sceneManager = new SceneManager(this.scene, this.camera);
    this.assetManager = new AssetManager();
  }
  
  /**
   * Set up event listeners for window resize and other events
   */
  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('beforeunload', this.cleanup.bind(this));
  }
  
  /**
   * Handle window resize events
   */
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  /**
   * Start the game engine
   */
  public async start(): Promise<void> {
    if (this.isRunning) return;
    
    console.log('🚀 Starting GTL IV Game Engine...');
    
    // Initialize systems
    await this.assetManager.initialize();
    await this.sceneManager.initialize();
    await this.audioEngine.initialize();
    
    this.isRunning = true;
    this.clock.start();
    this.gameLoop();
    
    console.log('✅ Game Engine started successfully');
  }
  
  /**
   * Main game loop
   */
  private gameLoop(): void {
    if (!this.isRunning) return;
    
    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();
    
    // Update FPS counter
    this.updateFPS(deltaTime);
    
    // Update game systems
    this.update(deltaTime, elapsedTime);
    
    // Render the scene
    this.render();
    
    // Continue the loop
    requestAnimationFrame(this.gameLoop.bind(this));
  }
  
  /**
   * Update all game systems
   */
  private update(deltaTime: number, elapsedTime: number): void {
    // Update input
    this.inputManager.update(deltaTime);
    
    // Update physics
    this.physicsEngine.update(deltaTime);
    
    // Update scene
    this.sceneManager.update(deltaTime, elapsedTime);
    
    // Update audio
    this.audioEngine.update(deltaTime);
    
    // Update game state
    this.gameState.update(deltaTime);
  }
  
  /**
   * Render the current scene
   */
  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Update FPS counter
   */
  private updateFPS(deltaTime: number): void {
    this.fpsCounter++;
    this.fpsTimer += deltaTime;
    
    if (this.fpsTimer >= 1.0) {
      this.currentFPS = this.fpsCounter;
      this.fpsCounter = 0;
      this.fpsTimer = 0;
      
      // Log FPS in development
      if (__DEV__) {
        console.log(`🎮 FPS: ${this.currentFPS}`);
      }
    }
  }
  
  /**
   * Stop the game engine
   */
  public stop(): void {
    this.isRunning = false;
    this.clock.stop();
    console.log('🛑 Game Engine stopped');
  }
  
  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.stop();
    this.renderer.dispose();
    this.assetManager.dispose();
    this.audioEngine.dispose();
  }
  
  /**
   * Get the renderer DOM element
   */
  public getRendererElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }
  
  /**
   * Get current FPS
   */
  public getFPS(): number {
    return this.currentFPS;
  }
  
  /**
   * Get game state
   */
  public getGameState(): GameState {
    return this.gameState;
  }
  
  /**
   * Get scene manager
   */
  public getSceneManager(): SceneManager {
    return this.sceneManager;
  }
  
  /**
   * Get input manager
   */
  public getInputManager(): InputManager {
    return this.inputManager;
  }
  
  /**
   * Get asset manager
   */
  public getAssetManager(): AssetManager {
    return this.assetManager;
  }
} 
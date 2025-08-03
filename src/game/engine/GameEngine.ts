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
import { Vehicle } from '../vehicles/Vehicle';
import { VehicleSystem } from '../vehicles/VehicleSystem';
import { PhysicsEngine } from './PhysicsEngine';
import { SceneManager } from './SceneManager';
import { AudioEngine } from './AudioEngine';
import { InputManager } from './InputManager';
import { PlatformAdapter } from './platform/PlatformAdapter';
import { VectorRenderer } from './rendering/VectorRenderer';
import { AssetManager } from './assets/AssetManager';
import { NetworkManager } from './NetworkManager';
import { PerformanceMonitor } from './utils/PerformanceMonitor';
import { GameConfig } from '../types/GameConfig';
import { VehicleType } from '../types/VehicleTypes';
import { MapDataManager } from '../../data/nyc/MapDataManager';
import { GameState } from '../types/GameState';
import { CrossPlatformEngine } from './CrossPlatformEngine';

export class GameEngine {
  private config: GameConfig;
  private state: GameState;
  private lastFrameTime: number = 0;
  
  // Core systems
  private platformAdapter: PlatformAdapter;
  private performanceMonitor: PerformanceMonitor;
  private assetManager: AssetManager;
  private vectorRenderer: VectorRenderer;
  private physicsEngine: PhysicsEngine;
  private sceneManager: SceneManager;
  private audioEngine: AudioEngine;
  private inputManager: InputManager;
  private networkManager: NetworkManager;
  private vehicleSystem: VehicleSystem;
  private mapDataManager: MapDataManager;
  private crossPlatformEngine: CrossPlatformEngine;

  constructor(config: GameConfig) {
    this.config = config;
    this.state = {
      isRunning: false,
      isPaused: false,
      currentScene: 'main',
      playerVehicle: null,
      vehicles: new Map(),
      gameObjects: new Map(),
      time: {
        deltaTime: 0,
        elapsedTime: 0,
        frameCount: 0
      }
    };
    
    // Initialize core systems
    // Initialize foundational systems first
    this.platformAdapter = new PlatformAdapter();
    this.performanceMonitor = new PerformanceMonitor();
    this.assetManager = new AssetManager();
    this.vectorRenderer = new VectorRenderer();
    this.physicsEngine = new PhysicsEngine();
    this.audioEngine = new AudioEngine(); // audio engine must exist before scene manager
    this.sceneManager = new SceneManager(this.physicsEngine, this.audioEngine);
    this.inputManager = new InputManager();
    this.networkManager = new NetworkManager();
    this.vehicleSystem = new VehicleSystem();
    this.mapDataManager = new MapDataManager();
    
    // Initialize cross-platform engine
    this.crossPlatformEngine = new CrossPlatformEngine(this.platformAdapter);
    
    console.log('GameEngine initialized with config:', config);
  }

  async start(): Promise<void> {
    try {
      console.log('Starting GTL IV game engine...');
      
      // Initialize platform
      await this.platformAdapter.initialize();
      
      // Load assets
      await this.assetManager.loadAssets();
      
      // Initialize rendering
      await this.vectorRenderer.initialize();
      
      // Initialize physics
      this.physicsEngine.initialize();
      
      // Initialize audio
      await this.audioEngine.initialize();
      
      // Initialize input
      this.inputManager.initialize();
      
      // Initialize network
      await this.networkManager.initialize();
      
      // Load map data
      await this.mapDataManager.loadMapData();
      
      // Create player vehicle
      const playerVehicle = this.vehicleSystem.createVehicle(VehicleType.CAR);
      this.state.playerVehicle = playerVehicle;
      this.state.vehicles.set(playerVehicle.id, playerVehicle);
      
      // Add to scene
      this.sceneManager.addVehicle(playerVehicle);
      
      // Start game loop
      this.state.isRunning = true;
      this.gameLoop();
      
      console.log('Game engine started successfully');
    } catch (error) {
      console.error('Failed to start game engine:', error);
      throw error;
    }
  }

  private gameLoop(): void {
    if (!this.state.isRunning) return;
    
    const currentTime = performance.now();
    this.state.time.deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;
    this.state.time.elapsedTime += this.state.time.deltaTime;
    this.state.time.frameCount++;
    
    // Update performance monitor
    this.performanceMonitor.update(this.state.time.deltaTime);
    
    // Update input
    this.inputManager.update();
    
    // Update physics
    this.physicsEngine.update(this.state.time.deltaTime);
    
    // Update vehicles
    this.sceneManager.updateVehicles(this.state.time.deltaTime);
    
    // Update audio
    this.audioEngine.update(this.state.time.deltaTime);
    
    // Render frame
    this.vectorRenderer.render(this.sceneManager.getScene());
    
    // Request next frame
    requestAnimationFrame(() => this.gameLoop());
  }

  stop(): void {
    this.state.isRunning = false;
    console.log('Game Engine stopped');
  }
  
  pause(): void {
    this.state.isPaused = true;
    console.log('Game Engine paused');
  }
  
  resume(): void {
    this.state.isPaused = false;
    console.log('Game Engine resumed');
  }
  
  getGameState(): GameState {
    return this.state;
  }
  
  getPerformanceStats() {
    return this.performanceMonitor.getStats();
  }

  getStats() {
    return {
      fps: this.performanceMonitor.getStats().fps,
      drawCalls: this.vectorRenderer ? this.vectorRenderer.getFrameCount() : 0,
      triangles: 0, // Placeholder
      memoryUsage: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0
    };
  }
} 
/**
 * 🎬 Scene Manager
 * 
 * Manages 3D scene rendering and optimization:
 * - Scene graph management
 * - LOD (Level of Detail) system
 * - Frustum and occlusion culling
 * - Dynamic lighting and shadows
 * - Asset streaming and management
 * - Performance optimization
 */

import * as THREE from 'three';
import { Vehicle } from '../vehicles/Vehicle';
import { VehicleSystem } from '../vehicles/VehicleSystem';
import { MapDataManager } from '../../data/nyc/MapDataManager';
import { GameObject } from './core/GameObject';
import { Vector3D } from './math/VectorMath';
import { VectorCamera, VectorLight, RenderScene } from './rendering/VectorRenderer';

export interface SceneConfig {
  enableShadows: boolean;
  enableFog: boolean;
  enablePostProcessing: boolean;
  maxDrawCalls: number;
  maxTriangles: number;
  lodDistance: number;
  cullingEnabled: boolean;
  assetStreaming: boolean;
}

export interface LODLevel {
  distance: number;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  visible: boolean;
}

export interface SceneObject {
  id: string;
  type: 'building' | 'vehicle' | 'landmark' | 'terrain' | 'prop';
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  boundingBox: THREE.Box3;
  lodLevels: LODLevel[];
  currentLOD: number;
  isVisible: boolean;
  isLoaded: boolean;
  userData?: any;
}

export interface Scene {
  id: string;
  name: string;
  gameObjects: GameObject[];
  camera: VectorCamera;
  lights: VectorLight[];
  background: string;
  ambientLight: string;
  isLoaded: boolean;
  isActive: boolean;
  metadata: SceneMetadata;
}

export interface SceneMetadata {
  description?: string;
  tags: string[];
  version: string;
  author?: string;
  created: Date;
  modified: Date;
  platform: string[];
  quality: 'low' | 'medium' | 'high' | 'ultra';
  maxObjects: number;
  maxLights: number;
  maxDrawCalls: number;
  dependencies: string[];
}

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private config: SceneConfig;
  
  // Scene objects
  private objects: Map<string, SceneObject> = new Map();
  private vehicles: Map<string, SceneObject> = new Map();
  private buildings: Map<string, SceneObject> = new Map();
  private landmarks: Map<string, SceneObject> = new Map();
  
  // Systems
  private vehicleSystem: VehicleSystem | null = null;
  private mapDataManager: MapDataManager | null = null;
  
  // Optimization
  private frustum: THREE.Frustum;
  private cullingMatrix: THREE.Matrix4;
  private lodDistances: number[];
  private visibleObjects: Set<string> = new Set();
  
  // Performance tracking
  private drawCalls: number = 0;
  private triangles: number = 0;
  private frameTime: number = 0;
  
  // Lighting
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private pointLights: THREE.PointLight[] = [];
  
  // Environment
  private skybox: THREE.Mesh | null = null;
  private fog: THREE.Fog | null = null;
  
  private scenes: Map<string, Scene> = new Map();
  private activeScene: Scene | null = null;
  private loadingScenes: Set<string> = new Set();
  private isInitialized: boolean = false;
  
  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, config: SceneConfig) {
    this.scene = scene;
    this.camera = camera;
    this.config = config;
    
    this.frustum = new THREE.Frustum();
    this.cullingMatrix = new THREE.Matrix4();
    this.lodDistances = [50, 200, 500, 1000]; // LOD distances in meters
    
    this.initialize();
  }
  
  /**
   * Initialize the scene manager
   */
  public async initialize(): Promise<void> {
    console.log('🎬 Initializing Scene Manager...');
    
    try {
      // Set up lighting
      this.setupLighting();
      
      // Set up environment
      this.setupEnvironment();
      
      // Set up post-processing
      if (this.config.enablePostProcessing) {
        this.setupPostProcessing();
      }
      
      // Set up optimization systems
      this.setupOptimization();
      
      console.log('✅ Scene Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Scene Manager:', error);
      throw error;
    }
  }
  
  /**
   * Initialize basic scene setup
   */
  private initializeScene(): void {
    // Set up scene background
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
    
    // Set up fog
    if (this.config.enableFog) {
      this.fog = new THREE.Fog(0x87ceeb, 100, 1000);
      this.scene.fog = this.fog;
    }
    
    // Set up camera
    this.camera.position.set(0, 100, 200);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrix();
    this.camera.updateMatrixWorld();
  }
  
  /**
   * Set up scene lighting
   */
  private setupLighting(): void {
    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(this.ambientLight);
    
    // Directional light (sun)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(100, 100, 50);
    this.directionalLight.castShadow = this.config.enableShadows;
    
    if (this.config.enableShadows) {
      this.directionalLight.shadow.mapSize.width = 2048;
      this.directionalLight.shadow.mapSize.height = 2048;
      this.directionalLight.shadow.camera.near = 0.5;
      this.directionalLight.shadow.camera.far = 500;
      this.directionalLight.shadow.camera.left = -200;
      this.directionalLight.shadow.camera.right = 200;
      this.directionalLight.shadow.camera.top = 200;
      this.directionalLight.shadow.camera.bottom = -200;
    }
    
    this.scene.add(this.directionalLight);
    
    // Add some point lights for city atmosphere
    this.addCityLights();
  }
  
  /**
   * Add city lights for atmosphere
   */
  private addCityLights(): void {
    // Street lights
    for (let i = 0; i < 20; i++) {
      const light = new THREE.PointLight(0xffaa00, 0.5, 50);
      light.position.set(
        (Math.random() - 0.5) * 1000,
        10,
        (Math.random() - 0.5) * 1000
      );
      light.castShadow = this.config.enableShadows;
      this.pointLights.push(light);
      this.scene.add(light);
    }
    
    // Building lights
    for (let i = 0; i < 50; i++) {
      const light = new THREE.PointLight(0xffffff, 0.3, 30);
      light.position.set(
        (Math.random() - 0.5) * 800,
        Math.random() * 200 + 50,
        (Math.random() - 0.5) * 800
      );
      this.pointLights.push(light);
      this.scene.add(light);
    }
  }
  
  /**
   * Set up environment (skybox, terrain, etc.)
   */
  private setupEnvironment(): void {
    // Create skybox
    this.createSkybox();
    
    // Create ground plane
    this.createGround();
    
    // Create basic city grid
    this.createCityGrid();
  }
  
  /**
   * Create skybox
   */
  private createSkybox(): void {
    const skyboxGeometry = new THREE.SphereGeometry(1000, 32, 32);
    const skyboxMaterial = new THREE.MeshBasicMaterial({
      color: 0x87ceeb,
      side: THREE.BackSide
    });
    
    this.skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
    this.scene.add(this.skybox);
  }
  
  /**
   * Create ground plane
   */
  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 0x333333,
      side: THREE.DoubleSide
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = this.config.enableShadows;
    
    this.scene.add(ground);
  }
  
  /**
   * Create basic city grid
   */
  private createCityGrid(): void {
    // Create a grid of buildings
    for (let x = -20; x <= 20; x++) {
      for (let z = -20; z <= 20; z++) {
        if (Math.random() > 0.3) { // 70% chance of building
          this.createBuilding(x * 50, z * 50);
        }
      }
    }
  }
  
  /**
   * Create a building at specified position
   */
  private createBuilding(x: number, z: number): void {
    const height = Math.random() * 100 + 20;
    const width = Math.random() * 20 + 10;
    const depth = Math.random() * 20 + 10;
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({
      color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.1, 0.3, 0.5)
    });
    
    const building = new THREE.Mesh(geometry, material);
    building.position.set(x, height / 2, z);
    building.castShadow = this.config.enableShadows;
    building.receiveShadow = this.config.enableShadows;
    
    // Create LOD levels
    const lodLevels: LODLevel[] = [
      {
        distance: 50,
        geometry: geometry,
        material: material,
        visible: true
      },
      {
        distance: 200,
        geometry: new THREE.BoxGeometry(width, height, depth),
        material: new THREE.MeshLambertMaterial({ color: material.color }),
        visible: false
      },
      {
        distance: 500,
        geometry: new THREE.BoxGeometry(width, height, depth),
        material: new THREE.MeshBasicMaterial({ color: material.color }),
        visible: false
      }
    ];
    
    const sceneObject: SceneObject = {
      id: `building_${x}_${z}`,
      type: 'building',
      mesh: building,
      position: building.position.clone(),
      boundingBox: new THREE.Box3().setFromObject(building),
      lodLevels,
      currentLOD: 0,
      isVisible: true,
      isLoaded: true,
      userData: { height, width, depth }
    };
    
    this.buildings.set(sceneObject.id, sceneObject);
    this.objects.set(sceneObject.id, sceneObject);
    this.scene.add(building);
  }
  
  /**
   * Set up post-processing effects
   */
  private setupPostProcessing(): void {
    // This would set up effects like bloom, SSAO, etc.
    // For now, we'll keep it simple
  }
  
  /**
   * Set up optimization systems
   */
  private setupOptimization(): void {
    // Initialize culling matrix
    this.cullingMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
  }
  
  /**
   * Update scene manager
   */
  public update(deltaTime: number, elapsedTime: number): void {
    // Update camera frustum
    this.updateFrustum();
    
    // Update culling
    if (this.config.cullingEnabled) {
      this.updateCulling();
    }
    
    // Update LOD
    this.updateLOD();
    
    // Update lighting
    this.updateLighting(elapsedTime);
    
    // Update vehicle meshes
    this.updateVehicles();
    
    // Update performance stats
    this.updatePerformanceStats();
  }
  
  /**
   * Update camera frustum for culling
   */
  private updateFrustum(): void {
    this.cullingMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cullingMatrix);
  }
  
  /**
   * Update frustum culling
   */
  private updateCulling(): void {
    this.visibleObjects.clear();
    
    this.objects.forEach((object, id) => {
      if (this.frustum.intersectsBox(object.boundingBox)) {
        this.visibleObjects.add(id);
        object.isVisible = true;
        
        if (!object.mesh.visible) {
          object.mesh.visible = true;
        }
      } else {
        object.isVisible = false;
        if (object.mesh.visible) {
          object.mesh.visible = false;
        }
      }
    });
  }
  
  /**
   * Update Level of Detail
   */
  private updateLOD(): void {
    this.objects.forEach(object => {
      if (!object.isVisible) return;
      
      const distance = this.camera.position.distanceTo(object.position);
      let newLOD = 0;
      
      // Find appropriate LOD level
      for (let i = 0; i < this.lodDistances.length; i++) {
        if (distance > this.lodDistances[i]) {
          newLOD = i + 1;
        }
      }
      
      // Update LOD if changed
      if (newLOD !== object.currentLOD && newLOD < object.lodLevels.length) {
        this.updateObjectLOD(object, newLOD);
      }
    });
  }
  
  /**
   * Update object LOD level
   */
  private updateObjectLOD(object: SceneObject, newLOD: number): void {
    const oldLOD = object.lodLevels[object.currentLOD];
    const newLODLevel = object.lodLevels[newLOD];
    
    if (oldLOD && newLODLevel) {
      // Hide old LOD
      oldLOD.visible = false;
      
      // Show new LOD
      newLODLevel.visible = true;
      
      // Update mesh
      object.mesh.geometry = newLODLevel.geometry;
      object.mesh.material = newLODLevel.material;
      
      object.currentLOD = newLOD;
    }
  }
  
  /**
   * Update lighting (day/night cycle, etc.)
   */
  private updateLighting(elapsedTime: number): void {
    // Simple day/night cycle
    const time = elapsedTime * 0.1; // Slow down the cycle
    const sunAngle = Math.sin(time) * 0.5 + 0.5; // 0 to 1
    
    // Update sun position
    this.directionalLight.position.set(
      Math.cos(time * Math.PI * 2) * 200,
      Math.sin(time * Math.PI * 2) * 200 + 100,
      Math.sin(time * Math.PI * 2) * 200
    );
    
    // Update ambient light intensity
    this.ambientLight.intensity = 0.2 + sunAngle * 0.4;
    
    // Update directional light intensity
    this.directionalLight.intensity = sunAngle;
    
    // Update skybox color
    if (this.skybox) {
      const skyColor = new THREE.Color();
      skyColor.setHSL(0.6, 0.3, 0.3 + sunAngle * 0.4);
      (this.skybox.material as THREE.MeshBasicMaterial).color = skyColor;
    }
    
    // Update fog color
    if (this.fog) {
      const fogColor = new THREE.Color();
      fogColor.setHSL(0.6, 0.3, 0.3 + sunAngle * 0.4);
      this.fog.color = fogColor;
    }
  }
  
  /**
   * Update vehicle meshes
   */
  private updateVehicles(): void {
    if (!this.vehicleSystem) return;
    
    const vehicles = this.vehicleSystem.getAllVehicles();
    
    vehicles.forEach(vehicle => {
      const vehicleId = vehicle.getId();
      let sceneObject = this.vehicles.get(vehicleId);
      
      if (!sceneObject) {
        // Create new vehicle mesh
        sceneObject = this.createVehicleMesh(vehicle);
        this.vehicles.set(vehicleId, sceneObject);
        this.objects.set(vehicleId, sceneObject);
        this.scene.add(sceneObject.mesh);
      }
      
      // Update vehicle mesh position and rotation
      const position = vehicle.getPosition();
      const rotation = vehicle.getRotation();
      
      sceneObject.mesh.position.copy(position);
      sceneObject.mesh.rotation.copy(rotation);
      sceneObject.position.copy(position);
      sceneObject.boundingBox.setFromObject(sceneObject.mesh);
    });
  }
  
  /**
   * Create vehicle mesh
   */
  private createVehicleMesh(vehicle: Vehicle): SceneObject {
    const data = vehicle.getData();
    
    // Create simple vehicle geometry
    const geometry = new THREE.BoxGeometry(
      data.dimensions.width,
      data.dimensions.height,
      data.dimensions.length
    );
    
    // Create material based on vehicle type
    let color: THREE.Color;
    switch (data.type) {
      case 'sports_car':
        color = new THREE.Color(0xff0000); // Red
        break;
      case 'sedan':
        color = new THREE.Color(0x0000ff); // Blue
        break;
      case 'suv':
        color = new THREE.Color(0x00ff00); // Green
        break;
      case 'motorcycle':
        color = new THREE.Color(0xffff00); // Yellow
        break;
      default:
        color = new THREE.Color(0x888888); // Gray
    }
    
    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.castShadow = this.config.enableShadows;
    mesh.receiveShadow = this.config.enableShadows;
    
    // Create LOD levels
    const lodLevels: LODLevel[] = [
      {
        distance: 50,
        geometry: geometry,
        material: material,
        visible: true
      },
      {
        distance: 200,
        geometry: new THREE.BoxGeometry(
          data.dimensions.width * 0.8,
          data.dimensions.height * 0.8,
          data.dimensions.length * 0.8
        ),
        material: new THREE.MeshBasicMaterial({ color }),
        visible: false
      }
    ];
    
    return {
      id: vehicle.getId(),
      type: 'vehicle',
      mesh,
      position: vehicle.getPosition().clone(),
      boundingBox: new THREE.Box3().setFromObject(mesh),
      lodLevels,
      currentLOD: 0,
      isVisible: true,
      isLoaded: true,
      userData: { vehicle }
    };
  }
  
  /**
   * Update performance statistics
   */
  private updatePerformanceStats(): void {
    // Get renderer info (this would be passed from the main renderer)
    // For now, we'll estimate based on visible objects
    this.drawCalls = this.visibleObjects.size;
    this.triangles = this.visibleObjects.size * 1000; // Rough estimate
  }
  
  /**
   * Set vehicle system reference
   */
  public setVehicleSystem(vehicleSystem: VehicleSystem): void {
    this.vehicleSystem = vehicleSystem;
  }
  
  /**
   * Set map data manager reference
   */
  public setMapDataManager(mapDataManager: MapDataManager): void {
    this.mapDataManager = mapDataManager;
  }
  
  /**
   * Set player vehicle for camera following
   */
  public setPlayerVehicle(vehicle: Vehicle): void {
    // This would set up camera to follow the player vehicle
    console.log('🎥 Setting player vehicle for camera following');
  }
  
  /**
   * Get scene statistics
   */
  public getStats(): any {
    return {
      totalObjects: this.objects.size,
      visibleObjects: this.visibleObjects.size,
      vehicles: this.vehicles.size,
      buildings: this.buildings.size,
      landmarks: this.landmarks.size,
      drawCalls: this.drawCalls,
      triangles: this.triangles,
      frameTime: this.frameTime
    };
  }
  
  /**
   * Get vehicle system
   */
  public getVehicleSystem(): VehicleSystem | null {
    return this.vehicleSystem;
  }
  
  /**
   * Add object to scene
   */
  public addObject(object: SceneObject): void {
    this.objects.set(object.id, object);
    this.scene.add(object.mesh);
    
    // Categorize object
    switch (object.type) {
      case 'vehicle':
        this.vehicles.set(object.id, object);
        break;
      case 'building':
        this.buildings.set(object.id, object);
        break;
      case 'landmark':
        this.landmarks.set(object.id, object);
        break;
    }
  }
  
  /**
   * Remove object from scene
   */
  public removeObject(id: string): void {
    const object = this.objects.get(id);
    if (object) {
      this.scene.remove(object.mesh);
      this.objects.delete(id);
      this.vehicles.delete(id);
      this.buildings.delete(id);
      this.landmarks.delete(id);
      this.visibleObjects.delete(id);
    }
  }
  
  /**
   * Get object by ID
   */
  public getObject(id: string): SceneObject | undefined {
    return this.objects.get(id);
  }
  
  /**
   * Get all visible objects
   */
  public getVisibleObjects(): SceneObject[] {
    return Array.from(this.visibleObjects).map(id => this.objects.get(id)!);
  }
  
  /**
   * Dispose of scene manager
   */
  public dispose(): void {
    // Dispose of all objects
    this.objects.forEach(object => {
      object.mesh.geometry.dispose();
      if (Array.isArray(object.mesh.material)) {
        object.mesh.material.forEach(material => material.dispose());
      } else {
        object.mesh.material.dispose();
      }
    });
    
    this.objects.clear();
    this.vehicles.clear();
    this.buildings.clear();
    this.landmarks.clear();
    this.visibleObjects.clear();
  }

  // Scene Management
  public createScene(id: string, name: string): Scene {
    const scene: Scene = {
      id,
      name,
      gameObjects: [],
      camera: new VectorCamera(),
      lights: [],
      background: '#000000',
      ambientLight: '#404040',
      isLoaded: false,
      isActive: false,
      metadata: {
        tags: ['scene'],
        version: '1.0',
        created: new Date(),
        modified: new Date(),
        platform: ['all'],
        quality: 'medium',
        maxObjects: 1000,
        maxLights: 8,
        maxDrawCalls: 1000,
        dependencies: []
      }
    };

    this.scenes.set(id, scene);
    return scene;
  }

  public async loadScene(sceneId: string): Promise<Scene> {
    if (this.loadingScenes.has(sceneId)) {
      throw new Error(`Scene ${sceneId} is already loading`);
    }

    const scene = this.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found`);
    }

    if (scene.isLoaded) {
      return scene;
    }

    this.loadingScenes.add(sceneId);
    console.log(`🎬 Loading scene: ${scene.name}`);

    try {
      // Load scene data (would be implemented based on asset system)
      await this.loadSceneData(scene);
      
      // Initialize scene objects
      await this.initializeSceneObjects(scene);
      
      scene.isLoaded = true;
      scene.metadata.modified = new Date();
      
      console.log(`✅ Scene loaded: ${scene.name}`);
      return scene;
    } catch (error) {
      this.loadingScenes.delete(sceneId);
      throw new Error(`Failed to load scene ${sceneId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async unloadScene(sceneId: string): Promise<void> {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found`);
    }

    if (!scene.isLoaded) {
      return;
    }

    console.log(`🎬 Unloading scene: ${scene.name}`);

    // Unload scene objects
    await this.unloadSceneObjects(scene);
    
    scene.isLoaded = false;
    scene.isActive = false;
    
    console.log(`✅ Scene unloaded: ${scene.name}`);
  }

  public async setActiveScene(sceneId: string): Promise<void> {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found`);
    }

    if (!scene.isLoaded) {
      await this.loadScene(sceneId);
    }

    // Deactivate current scene
    if (this.activeScene) {
      this.activeScene.isActive = false;
    }

    // Activate new scene
    this.activeScene = scene;
    scene.isActive = true;
    
    console.log(`🎬 Active scene set to: ${scene.name}`);
  }

  public getActiveScene(): Scene | null {
    return this.activeScene;
  }

  public getScene(sceneId: string): Scene | null {
    return this.scenes.get(sceneId) || null;
  }

  public getAllScenes(): Scene[] {
    return Array.from(this.scenes.values());
  }

  public getLoadedScenes(): Scene[] {
    return Array.from(this.scenes.values()).filter(scene => scene.isLoaded);
  }

  // GameObject Management
  public addGameObject(sceneId: string, gameObject: GameObject): void {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found`);
    }

    scene.gameObjects.push(gameObject);
    scene.metadata.modified = new Date();
  }

  public removeGameObject(sceneId: string, gameObject: GameObject): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      return false;
    }

    const index = scene.gameObjects.indexOf(gameObject);
    if (index === -1) {
      return false;
    }

    scene.gameObjects.splice(index, 1);
    scene.metadata.modified = new Date();
    return true;
  }

  public getGameObjects(sceneId: string): GameObject[] {
    const scene = this.scenes.get(sceneId);
    return scene ? [...scene.gameObjects] : [];
  }

  public findGameObject(sceneId: string, name: string): GameObject | null {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      return null;
    }

    return scene.gameObjects.find(obj => obj.name === name) || null;
  }

  public findGameObjectsByTag(sceneId: string, tag: string): GameObject[] {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      return [];
    }

    return scene.gameObjects.filter(obj => obj.compareTag(tag));
  }

  // Camera Management
  public setSceneCamera(sceneId: string, camera: VectorCamera): void {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found`);
    }

    scene.camera = camera;
    scene.metadata.modified = new Date();
  }

  public getSceneCamera(sceneId: string): VectorCamera | null {
    const scene = this.scenes.get(sceneId);
    return scene ? scene.camera : null;
  }

  // Lighting Management
  public addLight(sceneId: string, light: VectorLight): void {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found`);
    }

    if (scene.lights.length >= scene.metadata.maxLights) {
      console.warn(`Scene ${sceneId} has reached maximum light count`);
      return;
    }

    scene.lights.push(light);
    scene.metadata.modified = new Date();
  }

  public removeLight(sceneId: string, light: VectorLight): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      return false;
    }

    const index = scene.lights.indexOf(light);
    if (index === -1) {
      return false;
    }

    scene.lights.splice(index, 1);
    scene.metadata.modified = new Date();
    return true;
  }

  public getLights(sceneId: string): VectorLight[] {
    const scene = this.scenes.get(sceneId);
    return scene ? [...scene.lights] : [];
  }

  // Scene Properties
  public setBackground(sceneId: string, background: string): void {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found`);
    }

    scene.background = background;
    scene.metadata.modified = new Date();
  }

  public setAmbientLight(sceneId: string, ambientLight: string): void {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found`);
    }

    scene.ambientLight = ambientLight;
    scene.metadata.modified = new Date();
  }

  // Scene Transitions
  public async transitionToScene(sceneId: string, transitionType: 'fade' | 'slide' | 'instant' = 'fade'): Promise<void> {
    console.log(`🎬 Transitioning to scene: ${sceneId} (${transitionType})`);

    switch (transitionType) {
      case 'fade':
        await this.fadeTransition(sceneId);
        break;
      case 'slide':
        await this.slideTransition(sceneId);
        break;
      case 'instant':
        await this.setActiveScene(sceneId);
        break;
    }
  }

  private async fadeTransition(sceneId: string): Promise<void> {
    // Implement fade transition
    await this.setActiveScene(sceneId);
  }

  private async slideTransition(sceneId: string): Promise<void> {
    // Implement slide transition
    await this.setActiveScene(sceneId);
  }

  // Scene Optimization
  public optimizeScene(sceneId: string): void {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      return;
    }

    console.log(`🎬 Optimizing scene: ${scene.name}`);

    // Optimize game objects
    this.optimizeGameObjects(scene);

    // Optimize lighting
    this.optimizeLighting(scene);

    // Update metadata
    scene.metadata.modified = new Date();
  }

  private optimizeGameObjects(scene: Scene): void {
    // Remove inactive objects
    scene.gameObjects = scene.gameObjects.filter(obj => obj.isActive);

    // Sort objects by layer for efficient rendering
    scene.gameObjects.sort((a, b) => a.layer - b.layer);

    // Limit object count if necessary
    if (scene.gameObjects.length > scene.metadata.maxObjects) {
      console.warn(`Scene ${scene.id} has too many objects, limiting to ${scene.metadata.maxObjects}`);
      scene.gameObjects = scene.gameObjects.slice(0, scene.metadata.maxObjects);
    }
  }

  private optimizeLighting(scene: Scene): void {
    // Limit light count
    if (scene.lights.length > scene.metadata.maxLights) {
      console.warn(`Scene ${scene.id} has too many lights, limiting to ${scene.metadata.maxLights}`);
      scene.lights = scene.lights.slice(0, scene.metadata.maxLights);
    }

    // Sort lights by importance (directional first, then point, then spot)
    scene.lights.sort((a, b) => {
      const typeOrder = { directional: 0, point: 1, spot: 2, ambient: 3 };
      return (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
    });
  }

  // Platform-specific optimizations
  public optimizeForPlatform(platform: string): void {
    console.log(`🎬 Optimizing scenes for platform: ${platform}`);

    for (const scene of this.scenes.values()) {
      switch (platform.toLowerCase()) {
        case 'mobile':
          this.optimizeForMobile(scene);
          break;
        case 'nintendo':
          this.optimizeForNintendo(scene);
          break;
        case 'vr':
          this.optimizeForVR(scene);
          break;
        case 'console':
          this.optimizeForConsole(scene);
          break;
        default:
          this.optimizeForDesktop(scene);
          break;
      }
    }
  }

  private optimizeForMobile(scene: Scene): void {
    scene.metadata.quality = 'medium';
    scene.metadata.maxObjects = 500;
    scene.metadata.maxLights = 4;
    scene.metadata.maxDrawCalls = 500;
  }

  private optimizeForNintendo(scene: Scene): void {
    scene.metadata.quality = 'medium';
    scene.metadata.maxObjects = 300;
    scene.metadata.maxLights = 3;
    scene.metadata.maxDrawCalls = 300;
  }

  private optimizeForVR(scene: Scene): void {
    scene.metadata.quality = 'high';
    scene.metadata.maxObjects = 800;
    scene.metadata.maxLights = 6;
    scene.metadata.maxDrawCalls = 800;
  }

  private optimizeForConsole(scene: Scene): void {
    scene.metadata.quality = 'high';
    scene.metadata.maxObjects = 1500;
    scene.metadata.maxLights = 8;
    scene.metadata.maxDrawCalls = 1500;
  }

  private optimizeForDesktop(scene: Scene): void {
    scene.metadata.quality = 'high';
    scene.metadata.maxObjects = 1000;
    scene.metadata.maxLights = 8;
    scene.metadata.maxDrawCalls = 1000;
  }

  // Private helper methods
  private async loadSceneData(scene: Scene): Promise<void> {
    // This would load scene data from files or network
    // For now, we'll just simulate loading
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async initializeSceneObjects(scene: Scene): Promise<void> {
    // Initialize all game objects in the scene
    for (const gameObject of scene.gameObjects) {
      if (gameObject.isActive) {
        gameObject.start();
      }
    }
  }

  private async unloadSceneObjects(scene: Scene): Promise<void> {
    // Destroy all game objects in the scene
    for (const gameObject of scene.gameObjects) {
      gameObject.destroy();
    }
    scene.gameObjects = [];
  }

  // Utility methods
  public getSceneCount(): number {
    return this.scenes.size;
  }

  public getLoadingSceneCount(): number {
    return this.loadingScenes.size;
  }

  public isSceneLoaded(sceneId: string): boolean {
    const scene = this.scenes.get(sceneId);
    return scene ? scene.isLoaded : false;
  }

  public isSceneActive(sceneId: string): boolean {
    const scene = this.scenes.get(sceneId);
    return scene ? scene.isActive : false;
  }

  public clearAllScenes(): void {
    for (const scene of this.scenes.values()) {
      if (scene.isLoaded) {
        this.unloadSceneObjects(scene);
      }
    }
    this.scenes.clear();
    this.activeScene = null;
    this.loadingScenes.clear();
  }

  // Debug information
  public getDebugInfo(): any {
    return {
      isInitialized: this.isInitialized,
      sceneCount: this.scenes.size,
      activeScene: this.activeScene?.name || null,
      loadingScenes: Array.from(this.loadingScenes),
      loadedScenes: this.getLoadedScenes().map(s => s.name),
      scenes: Array.from(this.scenes.values()).map(s => ({
        id: s.id,
        name: s.name,
        isLoaded: s.isLoaded,
        isActive: s.isActive,
        objectCount: s.gameObjects.length,
        lightCount: s.lights.length
      }))
    };
  }

  addVehicle(vehicle: Vehicle): void {
    this.vehicles.set(vehicle.id, vehicle);
    this.gameObjects.set(vehicle.id, vehicle);
    
    // Add to spatial index
    const position = vehicle.getPosition();
    this.spatialIndex.insert(vehicle.id, position.x, position.y, position.z);
    
    // Add to physics world
    if (this.physicsEngine) {
      this.physicsEngine.addVehicle(vehicle);
    }
    
    // Add to audio system
    if (this.audioEngine) {
      this.audioEngine.addVehicle(vehicle);
    }
    
    console.log(`Vehicle ${vehicle.id} added to scene`);
  }

  updateVehicles(deltaTime: number): void {
    for (const vehicle of this.vehicles.values()) {
      // Update vehicle physics
      vehicle.update(deltaTime);
      
      // Update spatial index
      const position = vehicle.getPosition();
      this.spatialIndex.update(vehicle.id, position.x, position.y, position.z);
      
      // Update physics
      if (this.physicsEngine) {
        this.physicsEngine.updateVehicle(vehicle, deltaTime);
      }
      
      // Update audio
      if (this.audioEngine) {
        this.audioEngine.updateVehicle(vehicle, deltaTime);
      }
    }
  }
} 
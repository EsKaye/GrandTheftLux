/**
 * 🚗 Vehicle System
 * 
 * Comprehensive vehicle management system featuring:
 * - Realistic physics and driving mechanics
 * - Multiple vehicle types and classes
 * - Damage and repair systems
 * - Customization and upgrades
 * - AI traffic and NPC vehicles
 * - Vehicle spawning and management
 */

import * as THREE from 'three';
import { Vehicle } from './Vehicle';
import { VehiclePhysics } from './VehiclePhysics';
import { VehicleController } from './VehicleController';
import { VehicleData, VehicleType, VehicleClass } from '../types/VehicleTypes';

export interface VehicleSystemConfig {
  maxVehicles: number;
  trafficDensity: number; // 0-1
  enableDamage: boolean;
  enableCustomization: boolean;
  physicsTimestep: number;
}

export class VehicleSystem {
  private config: VehicleSystemConfig;
  private vehicles: Map<string, Vehicle> = new Map();
  private physicsEngine: VehiclePhysics;
  private playerVehicle: Vehicle | null = null;
  private trafficVehicles: Vehicle[] = [];
  
  // Vehicle data and templates
  private vehicleTemplates: Map<VehicleType, VehicleData> = new Map();
  
  constructor(config: VehicleSystemConfig) {
    this.config = config;
    this.physicsEngine = new VehiclePhysics(config.physicsTimestep);
    this.initializeVehicleTemplates();
  }
  
  /**
   * Initialize the vehicle system
   */
  public async initialize(): Promise<void> {
    console.log('🚗 Initializing Vehicle System...');
    
    try {
      await this.physicsEngine.initialize();
      await this.loadVehicleTemplates();
      this.setupTrafficSystem();
      
      console.log('✅ Vehicle System initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Vehicle System:', error);
      throw error;
    }
  }
  
  /**
   * Initialize vehicle templates with realistic specifications
   */
  private initializeVehicleTemplates(): void {
    // Sports Cars
    this.vehicleTemplates.set('sports_car', {
      id: 'sports_car',
      name: 'Sports Car',
      type: VehicleType.SPORTS_CAR,
      class: VehicleClass.SPORTS,
      mass: 1500,
      maxSpeed: 200,
      acceleration: 8.0,
      handling: 0.9,
      braking: 0.95,
      dimensions: { length: 4.5, width: 1.8, height: 1.3 },
      engine: {
        power: 300,
        torque: 400,
        redline: 7000,
        fuelType: 'gasoline'
      },
      transmission: {
        type: 'manual',
        gears: 6,
        gearRatios: [3.5, 2.1, 1.4, 1.0, 0.8, 0.6]
      },
      suspension: {
        type: 'independent',
        stiffness: 0.8,
        damping: 0.7,
        rideHeight: 0.12
      },
      tires: {
        type: 'performance',
        grip: 0.95,
        wear: 0.1
      }
    });
    
    // Sedans
    this.vehicleTemplates.set('sedan', {
      id: 'sedan',
      name: 'Sedan',
      type: VehicleType.SEDAN,
      class: VehicleClass.STANDARD,
      mass: 1800,
      maxSpeed: 160,
      acceleration: 6.0,
      handling: 0.7,
      braking: 0.8,
      dimensions: { length: 4.8, width: 1.9, height: 1.5 },
      engine: {
        power: 200,
        torque: 300,
        redline: 6000,
        fuelType: 'gasoline'
      },
      transmission: {
        type: 'automatic',
        gears: 6,
        gearRatios: [3.2, 1.9, 1.3, 0.9, 0.7, 0.5]
      },
      suspension: {
        type: 'independent',
        stiffness: 0.6,
        damping: 0.5,
        rideHeight: 0.15
      },
      tires: {
        type: 'all_season',
        grip: 0.75,
        wear: 0.05
      }
    });
    
    // SUVs
    this.vehicleTemplates.set('suv', {
      id: 'suv',
      name: 'SUV',
      type: VehicleType.SUV,
      class: VehicleClass.UTILITY,
      mass: 2200,
      maxSpeed: 140,
      acceleration: 4.5,
      handling: 0.6,
      braking: 0.7,
      dimensions: { length: 5.0, width: 2.0, height: 1.8 },
      engine: {
        power: 250,
        torque: 350,
        redline: 5500,
        fuelType: 'gasoline'
      },
      transmission: {
        type: 'automatic',
        gears: 8,
        gearRatios: [4.0, 2.5, 1.6, 1.1, 0.8, 0.6, 0.4, 0.3]
      },
      suspension: {
        type: 'independent',
        stiffness: 0.5,
        damping: 0.4,
        rideHeight: 0.20
      },
      tires: {
        type: 'all_terrain',
        grip: 0.65,
        wear: 0.08
      }
    });
    
    // Motorcycles
    this.vehicleTemplates.set('motorcycle', {
      id: 'motorcycle',
      name: 'Motorcycle',
      type: VehicleType.MOTORCYCLE,
      class: VehicleClass.MOTORCYCLE,
      mass: 400,
      maxSpeed: 180,
      acceleration: 9.0,
      handling: 0.95,
      braking: 0.9,
      dimensions: { length: 2.2, width: 0.8, height: 1.4 },
      engine: {
        power: 150,
        torque: 120,
        redline: 12000,
        fuelType: 'gasoline'
      },
      transmission: {
        type: 'manual',
        gears: 6,
        gearRatios: [2.8, 1.8, 1.3, 1.0, 0.8, 0.7]
      },
      suspension: {
        type: 'telescopic',
        stiffness: 0.7,
        damping: 0.6,
        rideHeight: 0.14
      },
      tires: {
        type: 'sport',
        grip: 0.9,
        wear: 0.15
      }
    });
  }
  
  /**
   * Load vehicle templates from external data
   */
  private async loadVehicleTemplates(): Promise<void> {
    // In a real implementation, this would load from JSON files or API
    console.log('📦 Loaded vehicle templates:', this.vehicleTemplates.size);
  }
  
  /**
   * Create a new vehicle instance
   */
  public createVehicle(type: VehicleType, position: THREE.Vector3, rotation: number = 0): Vehicle {
    const template = this.vehicleTemplates.get(type);
    if (!template) {
      throw new Error(`Vehicle type ${type} not found`);
    }
    
    const vehicle = new Vehicle(template, position, rotation);
    const id = this.generateVehicleId();
    
    this.vehicles.set(id, vehicle);
    this.physicsEngine.addVehicle(vehicle);
    
    return vehicle;
  }
  
  /**
   * Spawn player vehicle
   */
  public spawnPlayerVehicle(type: VehicleType, position: THREE.Vector3): Vehicle {
    if (this.playerVehicle) {
      this.removeVehicle(this.playerVehicle);
    }
    
    this.playerVehicle = this.createVehicle(type, position);
    this.playerVehicle.setAsPlayerVehicle();
    
    return this.playerVehicle;
  }
  
  /**
   * Spawn traffic vehicle
   */
  public spawnTrafficVehicle(position: THREE.Vector3): Vehicle {
    const types = Array.from(this.vehicleTemplates.keys());
    const randomType = types[Math.floor(Math.random() * types.length)] as VehicleType;
    
    const vehicle = this.createVehicle(randomType, position);
    vehicle.setAsTrafficVehicle();
    
    this.trafficVehicles.push(vehicle);
    
    return vehicle;
  }
  
  /**
   * Update all vehicles
   */
  public update(deltaTime: number): void {
    // Update physics
    this.physicsEngine.update(deltaTime);
    
    // Update all vehicles
    this.vehicles.forEach(vehicle => {
      vehicle.update(deltaTime);
    });
    
    // Update traffic AI
    this.updateTrafficAI(deltaTime);
    
    // Clean up destroyed vehicles
    this.cleanupDestroyedVehicles();
  }
  
  /**
   * Update traffic AI behavior
   */
  private updateTrafficAI(deltaTime: number): void {
    this.trafficVehicles.forEach(vehicle => {
      if (vehicle.isActive()) {
        vehicle.updateAI(deltaTime);
      }
    });
  }
  
  /**
   * Setup traffic system
   */
  private setupTrafficSystem(): void {
    // Spawn initial traffic
    const trafficCount = Math.floor(this.config.maxVehicles * this.config.trafficDensity);
    
    for (let i = 0; i < trafficCount; i++) {
      const position = this.getRandomSpawnPosition();
      this.spawnTrafficVehicle(position);
    }
  }
  
  /**
   * Get random spawn position for vehicles
   */
  private getRandomSpawnPosition(): THREE.Vector3 {
    // In a real implementation, this would use road network data
    const x = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    return new THREE.Vector3(x, 0, z);
  }
  
  /**
   * Remove vehicle from system
   */
  public removeVehicle(vehicle: Vehicle): void {
    const id = this.getVehicleId(vehicle);
    if (id) {
      this.vehicles.delete(id);
      this.physicsEngine.removeVehicle(vehicle);
      
      // Remove from traffic list if applicable
      const trafficIndex = this.trafficVehicles.indexOf(vehicle);
      if (trafficIndex !== -1) {
        this.trafficVehicles.splice(trafficIndex, 1);
      }
      
      // Clear player vehicle reference if needed
      if (vehicle === this.playerVehicle) {
        this.playerVehicle = null;
      }
    }
  }
  
  /**
   * Get vehicle by ID
   */
  public getVehicle(id: string): Vehicle | undefined {
    return this.vehicles.get(id);
  }
  
  /**
   * Get player vehicle
   */
  public getPlayerVehicle(): Vehicle | null {
    return this.playerVehicle;
  }
  
  /**
   * Get all vehicles
   */
  public getAllVehicles(): Vehicle[] {
    return Array.from(this.vehicles.values());
  }
  
  /**
   * Get traffic vehicles
   */
  public getTrafficVehicles(): Vehicle[] {
    return this.trafficVehicles;
  }
  
  /**
   * Get vehicle count
   */
  public getVehicleCount(): number {
    return this.vehicles.size;
  }
  
  /**
   * Check if vehicle limit reached
   */
  public isVehicleLimitReached(): boolean {
    return this.vehicles.size >= this.config.maxVehicles;
  }
  
  /**
   * Clean up destroyed vehicles
   */
  private cleanupDestroyedVehicles(): void {
    const destroyedVehicles: Vehicle[] = [];
    
    this.vehicles.forEach(vehicle => {
      if (vehicle.isDestroyed()) {
        destroyedVehicles.push(vehicle);
      }
    });
    
    destroyedVehicles.forEach(vehicle => {
      this.removeVehicle(vehicle);
    });
  }
  
  /**
   * Generate unique vehicle ID
   */
  private generateVehicleId(): string {
    return `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get vehicle ID from vehicle instance
   */
  private getVehicleId(vehicle: Vehicle): string | null {
    for (const [id, v] of this.vehicles.entries()) {
      if (v === vehicle) {
        return id;
      }
    }
    return null;
  }
  
  /**
   * Get vehicle templates
   */
  public getVehicleTemplates(): Map<VehicleType, VehicleData> {
    return this.vehicleTemplates;
  }
  
  /**
   * Get physics engine
   */
  public getPhysicsEngine(): VehiclePhysics {
    return this.physicsEngine;
  }
  
  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.vehicles.forEach(vehicle => {
      vehicle.dispose();
    });
    
    this.vehicles.clear();
    this.trafficVehicles = [];
    this.playerVehicle = null;
    
    this.physicsEngine.dispose();
  }
} 
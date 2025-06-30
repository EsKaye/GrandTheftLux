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
import { Vector3D } from '../engine/math/VectorMath';
import { Quaternion } from '../engine/math/VectorMath';

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
    this.vehicles = new Map();
    this.vehicleTemplates = new Map();
    this.playerVehicle = null;
    this.trafficVehicles = [];
    this.physicsEngine = new VehiclePhysics({
      mass: 1500,
      enginePower: 200,
      maxSpeed: 200,
      acceleration: 10,
      braking: 15,
      handling: 0.8,
      wheelBase: 2.5,
      trackWidth: 1.8
    });
    this.initializeTemplates();
  }
  
  /**
   * Initialize the vehicle system
   */
  public async initialize(): Promise<void> {
    console.log('🚗 Initializing Vehicle System...');
    
    try {
      await this.physicsEngine.initialize();
      this.initializeTemplates();
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
  private initializeTemplates(): void {
    // Sports Cars
    this.vehicleTemplates.set(VehicleType.SPORTS_CAR, {
      id: 'sports_car',
      name: 'Sports Car',
      type: VehicleType.SPORTS_CAR,
      class: VehicleClass.SPORTS,
      mass: 1200,
      maxSpeed: 300,
      acceleration: 15,
      handling: 0.9,
      braking: 0.8,
      dimensions: { length: 4.5, width: 1.8, height: 1.3 },
      engine: { power: 350, torque: 400, redline: 8000, fuelType: 'gasoline' },
      transmission: { type: 'manual', gears: 6, gearRatios: [3.5, 2.5, 1.8, 1.4, 1.1, 0.9] },
      suspension: { type: 'independent', stiffness: 0.8, damping: 0.7, rideHeight: 0.12, travel: 0.15 },
      tires: { type: 'performance', grip: 0.9, wear: 0.3, size: { width: 245, aspect: 40, diameter: 18 } },
      price: 75000,
      rarity: 'rare'
    });

    // Sedans
    this.vehicleTemplates.set(VehicleType.SEDAN, {
      id: 'sedan',
      name: 'Sedan',
      type: VehicleType.SEDAN,
      class: VehicleClass.STANDARD,
      mass: 1500,
      maxSpeed: 200,
      acceleration: 10,
      handling: 0.7,
      braking: 0.6,
      dimensions: { length: 4.8, width: 1.9, height: 1.5 },
      engine: { power: 200, torque: 250, redline: 6500, fuelType: 'gasoline' },
      transmission: { type: 'automatic', gears: 6, gearRatios: [3.2, 2.1, 1.5, 1.1, 0.8, 0.6] },
      suspension: { type: 'independent', stiffness: 0.6, damping: 0.5, rideHeight: 0.15, travel: 0.12 },
      tires: { type: 'all_season', grip: 0.7, wear: 0.2, size: { width: 215, aspect: 55, diameter: 17 } },
      price: 35000,
      rarity: 'common'
    });

    // SUVs
    this.vehicleTemplates.set(VehicleType.SUV, {
      id: 'suv',
      name: 'SUV',
      type: VehicleType.SUV,
      class: VehicleClass.UTILITY,
      mass: 2000,
      maxSpeed: 180,
      acceleration: 8,
      handling: 0.6,
      braking: 0.5,
      dimensions: { length: 5.2, width: 2.0, height: 1.8 },
      engine: { power: 250, torque: 350, redline: 6000, fuelType: 'gasoline' },
      transmission: { type: 'automatic', gears: 8, gearRatios: [4.7, 3.1, 2.1, 1.5, 1.1, 0.8, 0.6, 0.5] },
      suspension: { type: 'independent', stiffness: 0.5, damping: 0.4, rideHeight: 0.22, travel: 0.18 },
      tires: { type: 'all_season', grip: 0.6, wear: 0.25, size: { width: 235, aspect: 65, diameter: 18 } },
      price: 45000,
      rarity: 'common'
    });

    // Motorcycles
    this.vehicleTemplates.set(VehicleType.MOTORCYCLE, {
      id: 'motorcycle',
      name: 'Motorcycle',
      type: VehicleType.MOTORCYCLE,
      class: VehicleClass.MOTORCYCLE,
      mass: 400,
      maxSpeed: 250,
      acceleration: 12,
      handling: 0.95,
      braking: 0.9,
      dimensions: { length: 2.2, width: 0.8, height: 1.4 },
      engine: { power: 150, torque: 120, redline: 12000, fuelType: 'gasoline' },
      transmission: { type: 'manual', gears: 6, gearRatios: [3.0, 2.0, 1.5, 1.2, 1.0, 0.9] },
      suspension: { type: 'telescopic', stiffness: 0.7, damping: 0.6, rideHeight: 0.08, travel: 0.10 },
      tires: { type: 'sport', grip: 0.85, wear: 0.4, size: { width: 180, aspect: 55, diameter: 17 } },
      price: 25000,
      rarity: 'uncommon'
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
  public createVehicle(template: string, position: Vector3D, rotation: Vector3D): Vehicle {
    const vehicleTemplate = this.vehicleTemplates.get(template as VehicleType);
    if (!vehicleTemplate) {
      throw new Error(`Vehicle template '${template}' not found`);
    }

    const vehicle = new Vehicle(template as VehicleType);
    vehicle.transform.position = position;
    vehicle.transform.rotation = Quaternion.fromEuler(rotation.x, rotation.y, rotation.z);

    this.vehicles.set(vehicle.id, vehicle);
    this.physicsEngine.addVehicle(vehicle);
    
    return vehicle;
  }
  
  /**
   * Spawn player vehicle
   */
  public spawnPlayerVehicle(type: VehicleType, position: Vector3D): Vehicle {
    if (this.playerVehicle) {
      this.removeVehicle(this.playerVehicle);
    }
    
    this.playerVehicle = this.createVehicle(type, position, Vector3D.zero());
    this.playerVehicle.state.isPlayerVehicle = true;
    
    return this.playerVehicle;
  }
  
  /**
   * Spawn traffic vehicle
   */
  public spawnTrafficVehicle(template: string, position: Vector3D): Vehicle {
    const vehicle = this.createVehicle(template, position, Vector3D.zero());
    
    this.trafficVehicles.push(vehicle);
    
    return vehicle;
  }
  
  /**
   * Update all vehicles
   */
  public update(deltaTime: number): void {
    // Update all vehicles
    for (const [id, vehicle] of this.vehicles) {
      if (vehicle.state.isActive) {
        vehicle.update(deltaTime);
      }
    }

    // Update physics
    this.physicsEngine.update(deltaTime);
    
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
      if (vehicle.state.isActive) {
        // Update AI logic here
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
      this.spawnTrafficVehicle('sports_car', position);
    }
  }
  
  /**
   * Get random spawn position for vehicles
   */
  private getRandomSpawnPosition(): Vector3D {
    // In a real implementation, this would use road network data
    const x = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    return new Vector3D(x, 0, z);
  }
  
  /**
   * Remove vehicle from system
   */
  public removeVehicle(vehicle: Vehicle): void {
    this.vehicles.delete(vehicle.id);
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
      if (vehicle.state.isDestroyed) {
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
    // Dispose all vehicles
    for (const [id, vehicle] of this.vehicles) {
      vehicle.destroy();
    }

    this.vehicles.clear();
    this.trafficVehicles = [];
    this.playerVehicle = null;

    // Dispose physics engine
    this.physicsEngine.dispose();
  }
} 
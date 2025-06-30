/**
 * Vehicle Class - Core vehicle entity for GTL IV
 * 
 * This class represents a vehicle in the game world, handling:
 * - Vehicle state and properties
 * - Physics integration
 * - Rendering components
 * - Input handling
 * 
 * @author GTL IV Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { GameObject } from '../engine/core/GameObject';
import { Vector3D } from '../engine/math/VectorMath';
import { VehicleType, VehicleState } from '../types/VehicleTypes';

/**
 * Vehicle class representing a drivable vehicle in the game world
 * 
 * Features:
 * - Physics-based movement and collision
 * - Realistic vehicle dynamics
 * - Multi-platform support
 * - Performance optimization
 */
export class Vehicle extends GameObject {
  // Vehicle properties
  public vehicleType: VehicleType;
  public state: VehicleState;
  public speed: number = 0;
  public maxSpeed: number = 200;
  public acceleration: number = 10;
  public braking: number = 15;
  public handling: number = 0.8;
  
  // Physics properties
  public mass: number = 1500;
  public enginePower: number = 200;
  public wheelBase: number = 2.5;
  public trackWidth: number = 1.8;
  
  // Visual properties
  public color: string = '#ff0000';
  public model: string = 'default_car';
  
  // Audio properties
  public engineSound: string = 'engine_default';
  public hornSound: string = 'horn_default';
  
  constructor(vehicleType: VehicleType = VehicleType.SEDAN) {
    super('Vehicle', new Vector3D(0, 0, 0));
    this.vehicleType = vehicleType;
    this.state = {
      id: this.id,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
      health: 100,
      fuel: 100,
      damage: { body: 0, engine: 0, transmission: 0, suspension: 0, tires: [0, 0, 0, 0], windows: [0, 0, 0, 0], lights: [false, false, false, false] },
      isPlayerVehicle: false,
      isActive: true,
      isDestroyed: false
    };
    
    this.initializeVehicle();
  }
  
  /**
   * Initialize vehicle with type-specific properties
   */
  private initializeVehicle(): void {
    switch (this.vehicleType) {
      case VehicleType.SPORTS_CAR:
        this.maxSpeed = 300;
        this.acceleration = 15;
        this.handling = 0.9;
        this.mass = 1200;
        this.enginePower = 350;
        this.color = '#ff0000';
        this.model = 'sports_car';
        break;
        
      case VehicleType.SEDAN:
        this.maxSpeed = 200;
        this.acceleration = 10;
        this.handling = 0.8;
        this.mass = 1500;
        this.enginePower = 200;
        this.color = '#0000ff';
        this.model = 'sedan';
        break;
        
      case VehicleType.SUV:
        this.maxSpeed = 180;
        this.acceleration = 8;
        this.handling = 0.7;
        this.mass = 2000;
        this.enginePower = 250;
        this.color = '#00ff00';
        this.model = 'suv';
        break;
        
      case VehicleType.MOTORCYCLE:
        this.maxSpeed = 250;
        this.acceleration = 12;
        this.handling = 0.95;
        this.mass = 400;
        this.enginePower = 150;
        this.color = '#ffff00';
        this.model = 'motorcycle';
        break;
        
      default:
        // Default sedan properties
        break;
    }
  }
  
  /**
   * Start the vehicle engine
   */
  public startEngine(): void {
    // Engine start logic
  }
  
  /**
   * Stop the vehicle engine
   */
  public stopEngine(): void {
    // Engine stop logic
  }
  
  /**
   * Apply acceleration to the vehicle
   * @param amount - Acceleration amount (0-1)
   */
  public accelerate(amount: number): void {
    const accelerationForce = this.enginePower * amount * this.acceleration;
    this.state.velocity.x += accelerationForce * 0.01;
  }
  
  /**
   * Apply braking to the vehicle
   * @param amount - Braking amount (0-1)
   */
  public brake(amount: number): void {
    const brakingForce = this.braking * amount;
    this.state.velocity.x *= (1 - brakingForce * 0.01);
  }
  
  /**
   * Steer the vehicle
   * @param amount - Steering amount (-1 to 1, negative is left, positive is right)
   */
  public steer(amount: number): void {
    const steeringAngle = amount * this.handling * 0.5;
    this.state.angularVelocity.y = steeringAngle;
  }
  
  /**
   * Update vehicle physics and state
   * @param deltaTime - Time since last update
   */
  public update(deltaTime: number): void {
    // Update position
    this.state.position.x += this.state.velocity.x * deltaTime;
    this.state.position.y += this.state.velocity.y * deltaTime;
    this.state.position.z += this.state.velocity.z * deltaTime;
    
    // Update rotation
    this.state.rotation.x += this.state.angularVelocity.x * deltaTime;
    this.state.rotation.y += this.state.angularVelocity.y * deltaTime;
    this.state.rotation.z += this.state.angularVelocity.z * deltaTime;
    
    // Calculate speed
    this.speed = Math.sqrt(
      this.state.velocity.x * this.state.velocity.x +
      this.state.velocity.y * this.state.velocity.y +
      this.state.velocity.z * this.state.velocity.z
    );
    
    // Apply drag
    this.state.velocity.x *= 0.98;
    this.state.velocity.y *= 0.98;
    this.state.velocity.z *= 0.98;
    
    this.state.angularVelocity.x *= 0.95;
    this.state.angularVelocity.y *= 0.95;
    this.state.angularVelocity.z *= 0.95;
    
    // Update fuel consumption
    this.state.fuel -= deltaTime * 0.1;
    this.state.fuel = Math.max(0, this.state.fuel);
  }
  
  /**
   * Get vehicle information for UI display
   */
  public getInfo(): any {
    return {
      type: this.vehicleType,
      speed: Math.round(this.speed),
      maxSpeed: this.maxSpeed,
      fuel: Math.round(this.state.fuel),
      damage: this.state.damage,
      health: this.state.health
    };
  }
  
  /**
   * Apply damage to the vehicle
   * @param amount - Damage amount
   */
  public takeDamage(amount: number): void {
    this.state.damage.body += amount;
    this.state.damage.body = Math.min(100, this.state.damage.body);
    
    const damageMultiplier = 1 - (this.state.damage.body / 100) * 0.5;
    this.maxSpeed *= damageMultiplier;
    this.acceleration *= damageMultiplier;
    this.handling *= damageMultiplier;
  }
  
  /**
   * Repair the vehicle
   * @param amount - Repair amount
   */
  public repair(amount: number): void {
    this.state.damage.body -= amount;
    this.state.damage.body = Math.max(0, this.state.damage.body);
    this.initializeVehicle();
  }
  
  /**
   * Refuel the vehicle
   * @param amount - Fuel amount to add
   */
  public refuel(amount: number): void {
    this.state.fuel += amount;
    this.state.fuel = Math.min(100, this.state.fuel);
  }

  getPosition(): Vector3D {
    return this.state.position;
  }

  getVelocity(): Vector3D {
    return this.state.velocity;
  }

  getRotation(): Vector3D {
    return this.state.rotation;
  }

  getControls(): VehicleControls {
    return this.state.controls;
  }

  getData(): VehicleState {
    return this.state;
  }

  getId(): string {
    return this.id;
  }

  setPosition(position: Vector3D): void {
    this.state.position = position;
  }

  setRotation(rotation: Vector3D): void {
    this.state.rotation = rotation;
  }

  setVelocity(velocity: Vector3D): void {
    this.state.velocity = velocity;
  }

  update(deltaTime: number): void {
    // Update vehicle physics and state
    this.physics.update(this, deltaTime);
    this.controller.update(deltaTime);
  }
} 
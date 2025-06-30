/**
 * ⚡ Physics Engine
 * 
 * Custom physics engine for realistic vehicle simulation:
 * - Vehicle physics with mass, inertia, and forces
 * - Collision detection and response
 * - Suspension and tire simulation
 * - Gravity and environmental forces
 * - Performance optimization with spatial partitioning
 */

import * as THREE from 'three';
import { Vehicle } from '../vehicles/Vehicle';
import { VehiclePhysics, VehicleControls } from '../types/VehicleTypes';

export interface PhysicsConfig {
  gravity: THREE.Vector3;
  timestep: number;
  iterations: number;
  broadphase: 'naive' | 'sweep' | 'grid';
  solver: 'sequential' | 'jacobi' | 'gs';
  enableSleeping: boolean;
  sleepThreshold: number;
  maxContacts: number;
}

export interface CollisionPair {
  bodyA: PhysicsBody;
  bodyB: PhysicsBody;
  contact: ContactPoint;
}

export interface ContactPoint {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  penetration: number;
  friction: number;
  restitution: number;
}

export interface PhysicsBody {
  id: string;
  type: 'vehicle' | 'static' | 'dynamic';
  mass: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Quaternion;
  angularVelocity: THREE.Vector3;
  inertia: THREE.Vector3;
  centerOfMass: THREE.Vector3;
  collisionShape: CollisionShape;
  isActive: boolean;
  isSleeping: boolean;
  userData?: any;
}

export interface CollisionShape {
  type: 'box' | 'cylinder' | 'sphere' | 'mesh';
  size: THREE.Vector3;
  offset: THREE.Vector3;
  material: PhysicsMaterial;
}

export interface PhysicsMaterial {
  friction: number;
  restitution: number;
  density: number;
}

export class PhysicsEngine {
  private config: PhysicsConfig;
  private bodies: Map<string, PhysicsBody> = new Map();
  private vehicles: Map<string, Vehicle> = new Map();
  private collisionPairs: CollisionPair[] = [];
  private broadphase: any; // Spatial partitioning system
  private solver: any; // Constraint solver
  
  // Physics world state
  private gravity: THREE.Vector3;
  private timestep: number;
  private accumulator: number = 0;
  
  // Performance tracking
  private frameTime: number = 0;
  private collisionChecks: number = 0;
  private solverIterations: number = 0;
  
  constructor(config: PhysicsConfig) {
    this.config = config;
    this.gravity = config.gravity.clone();
    this.timestep = config.timestep;
    
    this.initializeBroadphase();
    this.initializeSolver();
  }
  
  /**
   * Initialize the physics engine
   */
  public async initialize(): Promise<void> {
    console.log('⚡ Initializing Physics Engine...');
    
    try {
      // Set up default materials
      this.setupDefaultMaterials();
      
      // Initialize spatial partitioning
      this.initializeSpatialPartitioning();
      
      console.log('✅ Physics Engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Physics Engine:', error);
      throw error;
    }
  }
  
  /**
   * Add a vehicle to the physics simulation
   */
  public addVehicle(vehicle: Vehicle): void {
    const physicsBody = this.createVehiclePhysicsBody(vehicle);
    this.bodies.set(physicsBody.id, physicsBody);
    this.vehicles.set(physicsBody.id, vehicle);
    
    // Add collision shapes for vehicle components
    this.addVehicleCollisionShapes(vehicle, physicsBody);
  }
  
  /**
   * Remove a vehicle from the physics simulation
   */
  public removeVehicle(vehicle: Vehicle): void {
    const vehicleId = this.getVehicleId(vehicle);
    if (vehicleId) {
      this.bodies.delete(vehicleId);
      this.vehicles.delete(vehicleId);
    }
  }
  
  /**
   * Update physics simulation
   */
  public update(deltaTime: number): void {
    // Accumulate time for fixed timestep
    this.accumulator += deltaTime;
    
    // Run physics simulation with fixed timestep
    while (this.accumulator >= this.timestep) {
      this.step(this.timestep);
      this.accumulator -= this.timestep;
    }
    
    // Update vehicle physics
    this.updateVehiclePhysics(deltaTime);
  }
  
  /**
   * Single physics step
   */
  private step(deltaTime: number): void {
    // Clear collision pairs
    this.collisionPairs = [];
    
    // Update broadphase
    this.updateBroadphase();
    
    // Detect collisions
    this.detectCollisions();
    
    // Solve constraints
    this.solveConstraints(deltaTime);
    
    // Integrate velocities
    this.integrateVelocities(deltaTime);
    
    // Update positions
    this.updatePositions(deltaTime);
    
    // Handle sleeping
    this.handleSleeping();
  }
  
  /**
   * Create physics body for vehicle
   */
  private createVehiclePhysicsBody(vehicle: Vehicle): PhysicsBody {
    const data = vehicle.getData();
    const position = vehicle.getPosition();
    const rotation = vehicle.getRotation();
    
    return {
      id: vehicle.getId(),
      type: 'vehicle',
      mass: data.mass,
      position: position.clone(),
      velocity: new THREE.Vector3(),
      rotation: new THREE.Quaternion().setFromEuler(rotation),
      angularVelocity: new THREE.Vector3(),
      inertia: this.calculateInertia(data.mass, data.dimensions),
      centerOfMass: new THREE.Vector3(0, data.dimensions.height * 0.4, 0),
      collisionShape: {
        type: 'box',
        size: new THREE.Vector3(
          data.dimensions.width,
          data.dimensions.height,
          data.dimensions.length
        ),
        offset: new THREE.Vector3(),
        material: {
          friction: 0.8,
          restitution: 0.3,
          density: 1000
        }
      },
      isActive: true,
      isSleeping: false,
      userData: { vehicle }
    };
  }
  
  /**
   * Add collision shapes for vehicle components
   */
  private addVehicleCollisionShapes(vehicle: Vehicle, body: PhysicsBody): void {
    const data = vehicle.getData();
    
    // Main body collision
    const bodyShape: CollisionShape = {
      type: 'box',
      size: new THREE.Vector3(
        data.dimensions.width * 0.9,
        data.dimensions.height * 0.8,
        data.dimensions.length * 0.9
      ),
      offset: new THREE.Vector3(0, data.dimensions.height * 0.4, 0),
      material: {
        friction: 0.8,
        restitution: 0.3,
        density: 1000
      }
    };
    
    // Wheel collision shapes (simplified as cylinders)
    const wheelRadius = data.dimensions.height * 0.15;
    const wheelWidth = data.dimensions.width * 0.1;
    
    const wheelPositions = [
      new THREE.Vector3(-data.dimensions.width * 0.35, wheelRadius, -data.dimensions.length * 0.35), // Front left
      new THREE.Vector3(data.dimensions.width * 0.35, wheelRadius, -data.dimensions.length * 0.35),  // Front right
      new THREE.Vector3(-data.dimensions.width * 0.35, wheelRadius, data.dimensions.length * 0.35),  // Rear left
      new THREE.Vector3(data.dimensions.width * 0.35, wheelRadius, data.dimensions.length * 0.35)   // Rear right
    ];
    
    wheelPositions.forEach((position, index) => {
      const wheelBody: PhysicsBody = {
        id: `${body.id}_wheel_${index}`,
        type: 'dynamic',
        mass: data.mass * 0.05, // 5% of vehicle mass per wheel
        position: body.position.clone().add(position),
        velocity: new THREE.Vector3(),
        rotation: new THREE.Quaternion(),
        angularVelocity: new THREE.Vector3(),
        inertia: this.calculateWheelInertia(data.mass * 0.05, wheelRadius, wheelWidth),
        centerOfMass: new THREE.Vector3(),
        collisionShape: {
          type: 'cylinder',
          size: new THREE.Vector3(wheelRadius * 2, wheelWidth, wheelRadius * 2),
          offset: new THREE.Vector3(),
          material: {
            friction: 0.9,
            restitution: 0.1,
            density: 800
          }
        },
        isActive: true,
        isSleeping: false,
        userData: { vehicle, wheelIndex: index }
      };
      
      this.bodies.set(wheelBody.id, wheelBody);
    });
  }
  
  /**
   * Update vehicle-specific physics
   */
  private updateVehiclePhysics(deltaTime: number): void {
    this.vehicles.forEach((vehicle, vehicleId) => {
      const body = this.bodies.get(vehicleId);
      if (!body || !body.isActive) return;
      
      // Apply engine forces
      this.applyEngineForces(vehicle, body, deltaTime);
      
      // Apply suspension forces
      this.applySuspensionForces(vehicle, body, deltaTime);
      
      // Apply aerodynamic forces
      this.applyAerodynamicForces(vehicle, body, deltaTime);
      
      // Update vehicle state
      vehicle.setPosition(body.position);
      vehicle.setRotation(new THREE.Euler().setFromQuaternion(body.rotation));
      vehicle.setVelocity(body.velocity);
    });
  }
  
  /**
   * Apply engine forces to vehicle
   */
  private applyEngineForces(vehicle: Vehicle, body: PhysicsBody, deltaTime: number): void {
    const controls = vehicle.getControls();
    const data = vehicle.getData();
    
    // Calculate engine force based on throttle
    const maxForce = data.engine.power * 735.5; // Convert HP to watts, then to force
    const engineForce = maxForce * controls.throttle;
    
    // Apply force in vehicle's forward direction
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(body.rotation);
    const force = forward.multiplyScalar(engineForce);
    
    body.velocity.add(force.multiplyScalar(deltaTime / body.mass));
    
    // Apply speed limit
    const speed = body.velocity.length();
    const maxSpeed = data.maxSpeed / 3.6; // Convert km/h to m/s
    if (speed > maxSpeed) {
      body.velocity.normalize().multiplyScalar(maxSpeed);
    }
  }
  
  /**
   * Apply suspension forces
   */
  private applySuspensionForces(vehicle: Vehicle, body: PhysicsBody, deltaTime: number): void {
    const data = vehicle.getData();
    const suspension = data.suspension;
    
    // Simplified suspension simulation
    const groundHeight = 0; // In a real implementation, this would be raycast from vehicle
    const suspensionCompression = Math.max(0, body.position.y - groundHeight - suspension.rideHeight);
    
    // Spring force
    const springForce = suspensionCompression * suspension.stiffness * 10000;
    
    // Damping force
    const dampingForce = body.velocity.y * suspension.damping * 1000;
    
    // Apply suspension force
    const totalForce = springForce + dampingForce;
    body.velocity.y -= totalForce * deltaTime / body.mass;
  }
  
  /**
   * Apply aerodynamic forces
   */
  private applyAerodynamicForces(vehicle: Vehicle, body: PhysicsBody, deltaTime: number): void {
    const data = vehicle.getData();
    const speed = body.velocity.length();
    
    // Air resistance (drag)
    const dragCoefficient = 0.3; // Typical for cars
    const frontalArea = data.dimensions.width * data.dimensions.height;
    const airDensity = 1.225; // kg/m³
    
    const dragForce = 0.5 * dragCoefficient * frontalArea * airDensity * speed * speed;
    const dragDirection = body.velocity.clone().normalize().negate();
    
    body.velocity.add(dragDirection.multiplyScalar(dragForce * deltaTime / body.mass));
  }
  
  /**
   * Calculate inertia tensor for vehicle
   */
  private calculateInertia(mass: number, dimensions: any): THREE.Vector3 {
    const width = dimensions.width;
    const height = dimensions.height;
    const length = dimensions.length;
    
    // Simplified box inertia calculation
    const Ixx = (mass / 12) * (height * height + length * length);
    const Iyy = (mass / 12) * (width * width + length * length);
    const Izz = (mass / 12) * (width * width + height * height);
    
    return new THREE.Vector3(Ixx, Iyy, Izz);
  }
  
  /**
   * Calculate wheel inertia
   */
  private calculateWheelInertia(mass: number, radius: number, width: number): THREE.Vector3 {
    // Cylinder inertia
    const Ixx = (mass / 12) * (3 * radius * radius + width * width);
    const Iyy = (mass / 2) * radius * radius;
    const Izz = (mass / 12) * (3 * radius * radius + width * width);
    
    return new THREE.Vector3(Ixx, Iyy, Izz);
  }
  
  /**
   * Initialize broadphase collision detection
   */
  private initializeBroadphase(): void {
    // Simple grid-based broadphase for now
    this.broadphase = {
      grid: new Map(),
      cellSize: 10,
      update: () => {},
      query: () => []
    };
  }
  
  /**
   * Initialize constraint solver
   */
  private initializeSolver(): void {
    this.solver = {
      solve: () => {},
      iterations: this.config.iterations
    };
  }
  
  /**
   * Update broadphase
   */
  private updateBroadphase(): void {
    // Update spatial partitioning
    this.broadphase.grid.clear();
    
    this.bodies.forEach(body => {
      if (!body.isActive) return;
      
      const cellX = Math.floor(body.position.x / this.broadphase.cellSize);
      const cellZ = Math.floor(body.position.z / this.broadphase.cellSize);
      const cellKey = `${cellX},${cellZ}`;
      
      if (!this.broadphase.grid.has(cellKey)) {
        this.broadphase.grid.set(cellKey, []);
      }
      this.broadphase.grid.get(cellKey).push(body);
    });
  }
  
  /**
   * Detect collisions between bodies
   */
  private detectCollisions(): void {
    this.collisionPairs = [];
    
    // Check each grid cell for collisions
    this.broadphase.grid.forEach((bodies, cellKey) => {
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const bodyA = bodies[i];
          const bodyB = bodies[j];
          
          if (this.checkCollision(bodyA, bodyB)) {
            const contact = this.generateContact(bodyA, bodyB);
            if (contact) {
              this.collisionPairs.push({
                bodyA,
                bodyB,
                contact
              });
            }
          }
        }
      }
    });
  }
  
  /**
   * Check collision between two bodies
   */
  private checkCollision(bodyA: PhysicsBody, bodyB: PhysicsBody): boolean {
    // Simple AABB collision check
    const aabbA = this.getAABB(bodyA);
    const aabbB = this.getAABB(bodyB);
    
    return (
      aabbA.min.x <= aabbB.max.x && aabbA.max.x >= aabbB.min.x &&
      aabbA.min.y <= aabbB.max.y && aabbA.max.y >= aabbB.min.y &&
      aabbA.min.z <= aabbB.max.z && aabbA.max.z >= aabbB.min.z
    );
  }
  
  /**
   * Get AABB for body
   */
  private getAABB(body: PhysicsBody): { min: THREE.Vector3; max: THREE.Vector3 } {
    const size = body.collisionShape.size;
    const offset = body.collisionShape.offset;
    
    const min = body.position.clone().add(offset).sub(size.clone().multiplyScalar(0.5));
    const max = body.position.clone().add(offset).add(size.clone().multiplyScalar(0.5));
    
    return { min, max };
  }
  
  /**
   * Generate contact point between two bodies
   */
  private generateContact(bodyA: PhysicsBody, bodyB: PhysicsBody): ContactPoint | null {
    // Simplified contact generation
    const direction = bodyB.position.clone().sub(bodyA.position);
    const distance = direction.length();
    
    if (distance === 0) return null;
    
    const normal = direction.normalize();
    const penetration = (bodyA.collisionShape.size.length() + bodyB.collisionShape.size.length()) / 2 - distance;
    
    if (penetration <= 0) return null;
    
    return {
      point: bodyA.position.clone().add(normal.clone().multiplyScalar(bodyA.collisionShape.size.length() / 2)),
      normal,
      penetration,
      friction: Math.min(bodyA.collisionShape.material.friction, bodyB.collisionShape.material.friction),
      restitution: Math.min(bodyA.collisionShape.material.restitution, bodyB.collisionShape.material.restitution)
    };
  }
  
  /**
   * Solve constraints and contacts
   */
  private solveConstraints(deltaTime: number): void {
    // Solve contact constraints
    this.collisionPairs.forEach(pair => {
      this.solveContact(pair, deltaTime);
    });
  }
  
  /**
   * Solve contact constraint
   */
  private solveContact(pair: CollisionPair, deltaTime: number): void {
    const { bodyA, bodyB, contact } = pair;
    
    // Calculate relative velocity
    const relativeVelocity = bodyB.velocity.clone().sub(bodyA.velocity);
    const normalVelocity = relativeVelocity.dot(contact.normal);
    
    // Don't resolve if bodies are separating
    if (normalVelocity > 0) return;
    
    // Calculate impulse
    const restitution = contact.restitution;
    const j = -(1 + restitution) * normalVelocity;
    const impulse = contact.normal.clone().multiplyScalar(j);
    
    // Apply impulse
    if (bodyA.mass > 0) {
      bodyA.velocity.sub(impulse.clone().multiplyScalar(1 / bodyA.mass));
    }
    if (bodyB.mass > 0) {
      bodyB.velocity.add(impulse.clone().multiplyScalar(1 / bodyB.mass));
    }
    
    // Position correction
    const correction = contact.normal.clone().multiplyScalar(contact.penetration * 0.2);
    if (bodyA.mass > 0) {
      bodyA.position.sub(correction.clone().multiplyScalar(bodyB.mass / (bodyA.mass + bodyB.mass)));
    }
    if (bodyB.mass > 0) {
      bodyB.position.add(correction.clone().multiplyScalar(bodyA.mass / (bodyA.mass + bodyB.mass)));
    }
  }
  
  /**
   * Integrate velocities
   */
  private integrateVelocities(deltaTime: number): void {
    this.bodies.forEach(body => {
      if (!body.isActive || body.isSleeping) return;
      
      // Apply gravity
      body.velocity.add(this.gravity.clone().multiplyScalar(deltaTime));
      
      // Apply damping
      body.velocity.multiplyScalar(0.99);
      body.angularVelocity.multiplyScalar(0.99);
    });
  }
  
  /**
   * Update positions
   */
  private updatePositions(deltaTime: number): void {
    this.bodies.forEach(body => {
      if (!body.isActive || body.isSleeping) return;
      
      // Update position
      body.position.add(body.velocity.clone().multiplyScalar(deltaTime));
      
      // Update rotation
      const angularVelocityQuaternion = new THREE.Quaternion();
      angularVelocityQuaternion.setFromAxisAngle(
        body.angularVelocity.clone().normalize(),
        body.angularVelocity.length() * deltaTime
      );
      body.rotation.multiply(angularVelocityQuaternion);
    });
  }
  
  /**
   * Handle sleeping bodies
   */
  private handleSleeping(): void {
    if (!this.config.enableSleeping) return;
    
    this.bodies.forEach(body => {
      if (!body.isActive) return;
      
      const velocity = body.velocity.length();
      const angularVelocity = body.angularVelocity.length();
      
      if (velocity < this.config.sleepThreshold && angularVelocity < this.config.sleepThreshold) {
        body.isSleeping = true;
      } else {
        body.isSleeping = false;
      }
    });
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
   * Setup default physics materials
   */
  private setupDefaultMaterials(): void {
    // This would set up common materials like asphalt, concrete, etc.
  }
  
  /**
   * Initialize spatial partitioning
   */
  private initializeSpatialPartitioning(): void {
    // This would set up more sophisticated spatial partitioning
  }
  
  /**
   * Get physics statistics
   */
  public getStats(): any {
    return {
      bodies: this.bodies.size,
      vehicles: this.vehicles.size,
      collisionPairs: this.collisionPairs.length,
      frameTime: this.frameTime,
      collisionChecks: this.collisionChecks,
      solverIterations: this.solverIterations
    };
  }
  
  /**
   * Dispose of physics engine
   */
  public dispose(): void {
    this.bodies.clear();
    this.vehicles.clear();
    this.collisionPairs = [];
  }
} 
/**
 * VehicleController - Input handling for vehicles
 * Manages player input and vehicle control
 */

import { Vehicle } from './Vehicle';
import { VehiclePhysics } from './VehiclePhysics';

export interface VehicleControls {
  throttle: number;
  brake: number;
  steering: number;
  handbrake: boolean;
}

export class VehicleController {
  private vehicle: Vehicle;
  private physics: VehiclePhysics;
  private controls: VehicleControls;
  
  constructor(vehicle: Vehicle, physics: VehiclePhysics) {
    this.vehicle = vehicle;
    this.physics = physics;
    this.controls = {
      throttle: 0,
      brake: 0,
      steering: 0,
      handbrake: false
    };
  }
  
  public update(deltaTime: number): void {
    // Update vehicle based on controls
    this.vehicle.accelerate(this.controls.throttle);
    this.vehicle.brake(this.controls.brake);
    this.vehicle.steer(this.controls.steering);
  }
  
  public setControls(controls: Partial<VehicleControls>): void {
    this.controls = { ...this.controls, ...controls };
  }
  
  public getControls(): VehicleControls {
    return { ...this.controls };
  }
} 
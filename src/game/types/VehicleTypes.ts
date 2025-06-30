/**
 * 🚗 Vehicle Type Definitions
 * 
 * Comprehensive type definitions for:
 * - Vehicle types and classes
 * - Engine and transmission specifications
 * - Suspension and tire systems
 * - Vehicle physics parameters
 * - Damage and customization systems
 */

export enum VehicleType {
  SPORTS_CAR = 'sports_car',
  SEDAN = 'sedan',
  SUV = 'suv',
  MOTORCYCLE = 'motorcycle',
  TRUCK = 'truck',
  BUS = 'bus',
  EMERGENCY = 'emergency',
  MILITARY = 'military',
  AIRCRAFT = 'aircraft',
  BOAT = 'boat'
}

export enum VehicleClass {
  SPORTS = 'sports',
  STANDARD = 'standard',
  UTILITY = 'utility',
  MOTORCYCLE = 'motorcycle',
  COMMERCIAL = 'commercial',
  EMERGENCY = 'emergency',
  MILITARY = 'military',
  AVIATION = 'aviation',
  MARINE = 'marine'
}

export interface EngineData {
  power: number; // Horsepower
  torque: number; // lb-ft
  redline: number; // RPM
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  displacement?: number; // Liters
  cylinders?: number;
  turbocharged?: boolean;
  supercharged?: boolean;
  fuelEfficiency?: number; // MPG
}

export interface TransmissionData {
  type: 'manual' | 'automatic' | 'cvt' | 'semi_auto';
  gears: number;
  gearRatios: number[];
  finalDrive?: number;
  clutchType?: 'single' | 'dual' | 'triple';
  shiftSpeed?: number; // seconds
}

export interface SuspensionData {
  type: 'independent' | 'solid_axle' | 'telescopic' | 'air';
  stiffness: number; // 0-1
  damping: number; // 0-1
  rideHeight: number; // meters
  travel: number; // meters
  antiRollBar?: boolean;
  adaptive?: boolean;
}

export interface TireData {
  type: 'all_season' | 'summer' | 'winter' | 'performance' | 'off_road' | 'sport';
  grip: number; // 0-1
  wear: number; // 0-1, higher = faster wear
  size: { width: number; aspect: number; diameter: number };
  compound?: 'soft' | 'medium' | 'hard';
  pressure?: number; // PSI
}

export interface VehicleData {
  id: string;
  name: string;
  type: VehicleType;
  class: VehicleClass;
  mass: number; // kg
  maxSpeed: number; // km/h
  acceleration: number; // 0-60 mph time
  handling: number; // 0-1
  braking: number; // 0-1
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  engine: EngineData;
  transmission: TransmissionData;
  suspension: SuspensionData;
  tires: TireData;
  price: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  description?: string;
  manufacturer?: string;
  year?: number;
}

export interface VehicleState {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  angularVelocity: { x: number; y: number; z: number };
  health: number; // 0-100
  fuel: number; // 0-100
  damage: VehicleDamage;
  isPlayerVehicle: boolean;
  isActive: boolean;
  isDestroyed: boolean;
}

export interface VehicleDamage {
  body: number; // 0-100
  engine: number; // 0-100
  transmission: number; // 0-100
  suspension: number; // 0-100
  tires: number[]; // 0-100 for each tire
  windows: number[]; // 0-100 for each window
  lights: boolean[]; // true = broken
}

export interface VehicleControls {
  throttle: number; // 0-1
  brake: number; // 0-1
  steering: number; // -1 to 1
  clutch?: number; // 0-1 (manual transmission)
  gear?: number; // Current gear
  handbrake: boolean;
  horn: boolean;
  lights: boolean;
  indicators: 'left' | 'right' | 'off';
}

export interface VehiclePhysics {
  mass: number;
  inertia: { x: number; y: number; z: number };
  centerOfMass: { x: number; y: number; z: number };
  dragCoefficient: number;
  frontalArea: number;
  rollingResistance: number;
  maxSteeringAngle: number;
  wheelbase: number;
  trackWidth: number;
}

export interface VehicleAI {
  targetSpeed: number;
  targetLane: number;
  aggression: number; // 0-1
  skill: number; // 0-1
  awareness: number; // 0-1
  pathfinding: boolean;
  trafficRules: boolean;
  emergency: boolean;
}

export interface VehicleCustomization {
  color: string;
  paintJob?: string;
  wheels?: string;
  bodyKit?: string;
  engineUpgrade?: string;
  suspensionUpgrade?: string;
  exhaustUpgrade?: string;
  interiorUpgrade?: string;
  audioUpgrade?: string;
  performanceMods: string[];
  cosmeticMods: string[];
}

export interface VehiclePerformance {
  currentSpeed: number;
  currentRPM: number;
  currentGear: number;
  engineTemperature: number;
  oilPressure: number;
  fuelConsumption: number;
  efficiency: number; // 0-1
  traction: number; // 0-1
  stability: number; // 0-1
}

export interface VehicleAudio {
  engineSound: string;
  exhaustSound: string;
  hornSound: string;
  brakeSound: string;
  crashSound: string;
  volume: number;
  spatialAudio: boolean;
}

export interface VehicleEffects {
  exhaustParticles: boolean;
  tireSmoke: boolean;
  engineHeat: boolean;
  brakeGlow: boolean;
  headlightBeams: boolean;
  shadowCasting: boolean;
}

export interface VehicleCollision {
  enabled: boolean;
  shape: 'box' | 'cylinder' | 'mesh';
  size: { x: number; y: number; z: number };
  offset: { x: number; y: number; z: number };
  material: 'metal' | 'plastic' | 'glass' | 'rubber';
  friction: number;
  restitution: number;
}

export interface VehicleLights {
  headlights: {
    enabled: boolean;
    intensity: number;
    range: number;
    color: string;
    beamAngle: number;
  };
  taillights: {
    enabled: boolean;
    intensity: number;
    color: string;
  };
  brakeLights: {
    enabled: boolean;
    intensity: number;
    color: string;
  };
  indicators: {
    enabled: boolean;
    intensity: number;
    color: string;
    blinking: boolean;
  };
}

export interface VehicleCamera {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fov: number;
  near: number;
  far: number;
  followDistance: number;
  followHeight: number;
  lookAhead: number;
  smoothing: number;
}

export interface VehicleHUD {
  speedometer: boolean;
  tachometer: boolean;
  fuelGauge: boolean;
  temperatureGauge: boolean;
  gearIndicator: boolean;
  damageIndicator: boolean;
  minimap: boolean;
  navigation: boolean;
}

export interface VehicleSaveData {
  id: string;
  data: VehicleData;
  state: VehicleState;
  customization: VehicleCustomization;
  performance: VehiclePerformance;
  ownership: {
    owner: string;
    purchaseDate: number;
    purchasePrice: number;
    insurance: boolean;
    registration: boolean;
  };
  statistics: {
    totalDistance: number;
    totalTime: number;
    maxSpeed: number;
    crashes: number;
    fuelUsed: number;
    maintenanceCost: number;
  };
} 
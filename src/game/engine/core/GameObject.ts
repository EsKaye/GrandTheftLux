/**
 * GameObject and Component System - Unity-Inspired Architecture
 * 
 * Provides the foundation for:
 * - Entity-Component-System (ECS) architecture
 * - Cross-platform game object management
 * - Modular component system
 * - Transform hierarchy
 * - Lifecycle management
 * 
 * Designed for optimal performance across all platforms including Nintendo DS and VR
 */

import { Vector3D, Quaternion, Matrix4x4 } from '../math/VectorMath';

export interface Component {
  gameObject: GameObject;
  enabled: boolean;
  start(): void;
  update(deltaTime: number): void;
  destroy(): void;
}

export abstract class BaseComponent implements Component {
  public gameObject: GameObject;
  public enabled: boolean = true;

  constructor(gameObject: GameObject) {
    this.gameObject = gameObject;
  }

  abstract start(): void;
  abstract update(deltaTime: number): void;
  abstract destroy(): void;
}

export class Transform {
  private _position: Vector3D;
  private _rotation: Quaternion;
  private _scale: Vector3D;
  private _localMatrix: Matrix4x4;
  private _worldMatrix: Matrix4x4;
  private _parent: Transform | null = null;
  private _children: Transform[] = [];
  private _isDirty: boolean = true;

  constructor(position: Vector3D = Vector3D.zero(), rotation: Quaternion = Quaternion.identity(), scale: Vector3D = Vector3D.one()) {
    this._position = position;
    this._rotation = rotation;
    this._scale = scale;
    this._localMatrix = Matrix4x4.identity();
    this._worldMatrix = Matrix4x4.identity();
    this.updateMatrices();
  }

  // Position
  get position(): Vector3D {
    return this._position.clone();
  }

  set position(value: Vector3D) {
    this._position = value.clone();
    this._isDirty = true;
  }

  // Rotation
  get rotation(): Quaternion {
    return this._rotation.clone();
  }

  set rotation(value: Quaternion) {
    this._rotation = value.clone();
    this._isDirty = true;
  }

  // Scale
  get scale(): Vector3D {
    return this._scale.clone();
  }

  set scale(value: Vector3D) {
    this._scale = value.clone();
    this._isDirty = true;
  }

  // Local properties
  get localPosition(): Vector3D {
    return this._position.clone();
  }

  set localPosition(value: Vector3D) {
    this._position = value.clone();
    this._isDirty = true;
  }

  get localRotation(): Quaternion {
    return this._rotation.clone();
  }

  set localRotation(value: Quaternion) {
    this._rotation = value.clone();
    this._isDirty = true;
  }

  get localScale(): Vector3D {
    return this._scale.clone();
  }

  set localScale(value: Vector3D) {
    this._scale = value.clone();
    this._isDirty = true;
  }

  // World properties
  get worldPosition(): Vector3D {
    this.updateMatrices();
    return this._worldMatrix.multiplyVector(Vector3D.zero());
  }

  get worldRotation(): Quaternion {
    if (this._parent) {
      return this._parent.worldRotation.multiply(this._rotation);
    }
    return this._rotation.clone();
  }

  get worldScale(): Vector3D {
    if (this._parent) {
      const parentScale = this._parent.worldScale;
      return new Vector3D(
        this._scale.x * parentScale.x,
        this._scale.y * parentScale.y,
        this._scale.z * parentScale.z
      );
    }
    return this._scale.clone();
  }

  // Matrix access
  get localMatrix(): Matrix4x4 {
    this.updateMatrices();
    return this._localMatrix.clone();
  }

  get worldMatrix(): Matrix4x4 {
    this.updateMatrices();
    return this._worldMatrix.clone();
  }

  // Hierarchy
  get parent(): Transform | null {
    return this._parent;
  }

  set parent(value: Transform | null) {
    if (this._parent === value) return;

    // Remove from current parent
    if (this._parent) {
      const index = this._parent._children.indexOf(this);
      if (index !== -1) {
        this._parent._children.splice(index, 1);
      }
    }

    this._parent = value;

    // Add to new parent
    if (this._parent) {
      this._parent._children.push(this);
    }

    this._isDirty = true;
  }

  get children(): Transform[] {
    return [...this._children];
  }

  // Transformation methods
  translate(translation: Vector3D): void {
    this._position = this._position.add(translation);
    this._isDirty = true;
  }

  rotate(rotation: Quaternion): void {
    this._rotation = this._rotation.multiply(rotation);
    this._isDirty = true;
  }

  rotateAround(point: Vector3D, axis: Vector3D, angle: number): void {
    const rotation = Quaternion.fromAxisAngle(axis, angle);
    const direction = this._position.subtract(point);
    const rotatedDirection = rotation.rotateVector(direction);
    this._position = point.add(rotatedDirection);
    this._rotation = rotation.multiply(this._rotation);
    this._isDirty = true;
  }

  lookAt(target: Vector3D, up: Vector3D = Vector3D.up()): void {
    const direction = target.subtract(this._position).normalize();
    const right = up.cross(direction).normalize();
    const newUp = direction.cross(right).normalize();

    const rotationMatrix = new Matrix4x4();
    rotationMatrix.data[0] = right.x;
    rotationMatrix.data[1] = right.y;
    rotationMatrix.data[2] = right.z;
    rotationMatrix.data[4] = newUp.x;
    rotationMatrix.data[5] = newUp.y;
    rotationMatrix.data[6] = newUp.z;
    rotationMatrix.data[8] = direction.x;
    rotationMatrix.data[9] = direction.y;
    rotationMatrix.data[10] = direction.z;

    // Convert matrix to quaternion (simplified)
    this._rotation = Quaternion.identity(); // Placeholder - implement matrix to quaternion conversion
    this._isDirty = true;
  }

  // Utility methods
  private updateMatrices(): void {
    if (!this._isDirty) return;

    // Update local matrix
    const translationMatrix = Matrix4x4.translation(this._position.x, this._position.y, this._position.z);
    const rotationMatrix = this._rotation.toMatrix();
    const scaleMatrix = Matrix4x4.scale(this._scale.x, this._scale.y, this._scale.z);

    this._localMatrix = translationMatrix.multiply(rotationMatrix).multiply(scaleMatrix);

    // Update world matrix
    if (this._parent) {
      this._worldMatrix = this._parent.worldMatrix.multiply(this._localMatrix);
    } else {
      this._worldMatrix = this._localMatrix.clone();
    }

    // Mark children as dirty
    for (const child of this._children) {
      child._isDirty = true;
    }

    this._isDirty = false;
  }

  // Hierarchy utility methods
  findChild(name: string): Transform | null {
    for (const child of this._children) {
      if (child.gameObject?.name === name) {
        return child;
      }
      const result = child.findChild(name);
      if (result) return result;
    }
    return null;
  }

  getChild(index: number): Transform | null {
    return this._children[index] || null;
  }

  getChildCount(): number {
    return this._children.length;
  }

  // Platform-specific optimizations
  setDirty(): void {
    this._isDirty = true;
  }

  isDirty(): boolean {
    return this._isDirty;
  }
}

export class GameObject {
  public readonly id: string;
  public name: string;
  public transform: Transform;
  public isActive: boolean = true;
  public isStatic: boolean = false;
  public layer: number = 0;
  public tag: string = '';

  private components: Map<string, Component> = new Map();
  private componentTypes: Map<string, Component[]> = new Map();
  private isDestroyed: boolean = false;

  constructor(name: string, position: Vector3D = Vector3D.zero()) {
    this.id = this.generateId();
    this.name = name;
    this.transform = new Transform(position);
    this.transform.gameObject = this;
  }

  // Component management
  addComponent<T extends Component>(componentType: new (gameObject: GameObject) => T): T {
    const component = new componentType(this);
    const typeName = component.constructor.name;
    
    this.components.set(typeName, component);
    
    if (!this.componentTypes.has(typeName)) {
      this.componentTypes.set(typeName, []);
    }
    this.componentTypes.get(typeName)!.push(component);
    
    return component;
  }

  getComponent<T extends Component>(componentType: new (gameObject: GameObject) => T): T | null {
    const typeName = componentType.name;
    return (this.components.get(typeName) as T) || null;
  }

  getComponents<T extends Component>(componentType: new (gameObject: GameObject) => T): T[] {
    const typeName = componentType.name;
    return (this.componentTypes.get(typeName) || []) as T[];
  }

  hasComponent<T extends Component>(componentType: new (gameObject: GameObject) => T): boolean {
    return this.components.has(componentType.name);
  }

  removeComponent<T extends Component>(componentType: new (gameObject: GameObject) => T): boolean {
    const typeName = componentType.name;
    const component = this.components.get(typeName);
    
    if (component) {
      component.destroy();
      this.components.delete(typeName);
      
      const typeComponents = this.componentTypes.get(typeName);
      if (typeComponents) {
        const index = typeComponents.indexOf(component);
        if (index !== -1) {
          typeComponents.splice(index, 1);
        }
      }
      
      return true;
    }
    
    return false;
  }

  // Lifecycle methods
  start(): void {
    if (this.isDestroyed || !this.isActive) return;
    
    for (const component of this.components.values()) {
      if (component.enabled) {
        component.start();
      }
    }
  }

  update(deltaTime: number): void {
    if (this.isDestroyed || !this.isActive) return;
    
    for (const component of this.components.values()) {
      if (component.enabled) {
        component.update(deltaTime);
      }
    }
  }

  destroy(): void {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    
    // Destroy all components
    for (const component of this.components.values()) {
      component.destroy();
    }
    
    this.components.clear();
    this.componentTypes.clear();
    
    // Remove from parent
    if (this.transform.parent) {
      this.transform.parent = null;
    }
    
    // Destroy all children
    for (const child of this.transform.children) {
      if (child.gameObject) {
        child.gameObject.destroy();
      }
    }
  }

  // Hierarchy methods
  setParent(parent: GameObject | null): void {
    if (parent) {
      this.transform.parent = parent.transform;
    } else {
      this.transform.parent = null;
    }
  }

  getParent(): GameObject | null {
    return this.transform.parent?.gameObject || null;
  }

  getChildren(): GameObject[] {
    return this.transform.children.map(child => child.gameObject).filter(Boolean);
  }

  findChild(name: string): GameObject | null {
    const childTransform = this.transform.findChild(name);
    return childTransform?.gameObject || null;
  }

  // Utility methods
  private generateId(): string {
    return 'gameobject_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  clone(): GameObject {
    const clone = new GameObject(this.name + '_clone', this.transform.position);
    clone.transform.rotation = this.transform.rotation;
    clone.transform.scale = this.transform.scale;
    clone.isActive = this.isActive;
    clone.isStatic = this.isStatic;
    clone.layer = this.layer;
    clone.tag = this.tag;
    
    // Clone components (simplified - would need component-specific cloning logic)
    for (const [typeName, component] of this.components) {
      // This is a placeholder - actual cloning would depend on component implementation
      console.warn(`Component cloning not implemented for ${typeName}`);
    }
    
    return clone;
  }

  // Platform-specific methods
  setLayer(layer: number): void {
    this.layer = layer;
  }

  setTag(tag: string): void {
    this.tag = tag;
  }

  compareTag(tag: string): boolean {
    return this.tag === tag;
  }

  // Debug and inspection
  toString(): string {
    return `GameObject(${this.name}, id: ${this.id}, active: ${this.isActive})`;
  }

  getComponentCount(): number {
    return this.components.size;
  }

  getComponentNames(): string[] {
    return Array.from(this.components.keys());
  }
}

// Built-in components
export class MeshRenderer extends BaseComponent {
  private mesh: any; // Placeholder for mesh data
  private material: any; // Placeholder for material data
  private visible: boolean = true;

  start(): void {
    // Initialize mesh rendering
  }

  update(deltaTime: number): void {
    // Update mesh rendering if needed
  }

  destroy(): void {
    // Clean up mesh resources
  }

  setMesh(mesh: any): void {
    this.mesh = mesh;
  }

  setMaterial(material: any): void {
    this.material = material;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  isVisible(): boolean {
    return this.visible;
  }
}

export class Collider extends BaseComponent {
  private bounds: any; // Placeholder for collision bounds
  private isTrigger: boolean = false;

  start(): void {
    // Initialize collision detection
  }

  update(deltaTime: number): void {
    // Update collision bounds
  }

  destroy(): void {
    // Clean up collision resources
  }

  setTrigger(isTrigger: boolean): void {
    this.isTrigger = isTrigger;
  }

  isTriggerCollider(): boolean {
    return this.isTrigger;
  }
}

export class Rigidbody extends BaseComponent {
  private velocity: Vector3D = Vector3D.zero();
  private angularVelocity: Vector3D = Vector3D.zero();
  private mass: number = 1.0;
  private drag: number = 0.0;
  private angularDrag: number = 0.05;
  private useGravity: boolean = true;
  private isKinematic: boolean = false;

  start(): void {
    // Initialize physics body
  }

  update(deltaTime: number): void {
    if (this.isKinematic) return;

    // Apply gravity
    if (this.useGravity) {
      this.velocity = this.velocity.add(Vector3D.down().multiply(9.81 * deltaTime));
    }

    // Apply drag
    this.velocity = this.velocity.multiply(1 - this.drag * deltaTime);
    this.angularVelocity = this.angularVelocity.multiply(1 - this.angularDrag * deltaTime);

    // Update position and rotation
    this.gameObject.transform.translate(this.velocity.multiply(deltaTime));
    
    // Update rotation (simplified)
    const rotationAxis = this.angularVelocity.normalize();
    const rotationAngle = this.angularVelocity.magnitude() * deltaTime;
    if (rotationAngle > 0) {
      const rotation = Quaternion.fromAxisAngle(rotationAxis, rotationAngle);
      this.gameObject.transform.rotate(rotation);
    }
  }

  destroy(): void {
    // Clean up physics body
  }

  // Physics methods
  addForce(force: Vector3D): void {
    if (!this.isKinematic) {
      this.velocity = this.velocity.add(force.divide(this.mass));
    }
  }

  addTorque(torque: Vector3D): void {
    if (!this.isKinematic) {
      this.angularVelocity = this.angularVelocity.add(torque.divide(this.mass));
    }
  }

  setVelocity(velocity: Vector3D): void {
    this.velocity = velocity.clone();
  }

  setAngularVelocity(angularVelocity: Vector3D): void {
    this.angularVelocity = angularVelocity.clone();
  }

  // Getters and setters
  getVelocity(): Vector3D {
    return this.velocity.clone();
  }

  getAngularVelocity(): Vector3D {
    return this.angularVelocity.clone();
  }

  setMass(mass: number): void {
    this.mass = Math.max(0.001, mass);
  }

  getMass(): number {
    return this.mass;
  }

  setKinematic(isKinematic: boolean): void {
    this.isKinematic = isKinematic;
  }

  isKinematicBody(): boolean {
    return this.isKinematic;
  }
} 
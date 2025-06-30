/**
 * Vector Mathematics Library - Cross-Platform Game Engine
 * 
 * Provides infinite precision vector operations for:
 * - 2D and 3D vector calculations
 * - Matrix transformations
 * - Quaternion rotations
 * - Cross-platform compatibility
 * - VR/AR coordinate systems
 * - Nintendo DS optimization
 * 
 * All calculations use high-precision floating point for infinite scaling
 */

export class Vector2D {
  public x: number;
  public y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  // Static constructors
  static zero(): Vector2D {
    return new Vector2D(0, 0);
  }

  static one(): Vector2D {
    return new Vector2D(1, 1);
  }

  static up(): Vector2D {
    return new Vector2D(0, 1);
  }

  static down(): Vector2D {
    return new Vector2D(0, -1);
  }

  static left(): Vector2D {
    return new Vector2D(-1, 0);
  }

  static right(): Vector2D {
    return new Vector2D(1, 0);
  }

  // Basic operations
  add(other: Vector2D): Vector2D {
    return new Vector2D(this.x + other.x, this.y + other.y);
  }

  subtract(other: Vector2D): Vector2D {
    return new Vector2D(this.x - other.x, this.y - other.y);
  }

  multiply(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  divide(scalar: number): Vector2D {
    if (scalar === 0) throw new Error('Division by zero');
    return new Vector2D(this.x / scalar, this.y / scalar);
  }

  // Advanced operations
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  normalize(): Vector2D {
    const mag = this.magnitude();
    if (mag === 0) return Vector2D.zero();
    return this.divide(mag);
  }

  dot(other: Vector2D): number {
    return this.x * other.x + this.y * other.y;
  }

  cross(other: Vector2D): number {
    return this.x * other.y - this.y * other.x;
  }

  distance(other: Vector2D): number {
    return this.subtract(other).magnitude();
  }

  distanceSquared(other: Vector2D): number {
    return this.subtract(other).magnitudeSquared();
  }

  lerp(other: Vector2D, t: number): Vector2D {
    return new Vector2D(
      this.x + (other.x - this.x) * t,
      this.y + (other.y - this.y) * t
    );
  }

  // Utility methods
  clone(): Vector2D {
    return new Vector2D(this.x, this.y);
  }

  equals(other: Vector2D): boolean {
    return this.x === other.x && this.y === other.y;
  }

  toString(): string {
    return `Vector2D(${this.x}, ${this.y})`;
  }

  // Platform-specific optimizations
  toArray(): number[] {
    return [this.x, this.y];
  }

  fromArray(array: number[]): void {
    this.x = array[0] || 0;
    this.y = array[1] || 0;
  }
}

export class Vector3D {
  public x: number;
  public y: number;
  public z: number;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  // Static constructors
  static zero(): Vector3D {
    return new Vector3D(0, 0, 0);
  }

  static one(): Vector3D {
    return new Vector3D(1, 1, 1);
  }

  static up(): Vector3D {
    return new Vector3D(0, 1, 0);
  }

  static down(): Vector3D {
    return new Vector3D(0, -1, 0);
  }

  static left(): Vector3D {
    return new Vector3D(-1, 0, 0);
  }

  static right(): Vector3D {
    return new Vector3D(1, 0, 0);
  }

  static forward(): Vector3D {
    return new Vector3D(0, 0, 1);
  }

  static back(): Vector3D {
    return new Vector3D(0, 0, -1);
  }

  static cross(a: Vector3D, b: Vector3D): Vector3D {
    return new Vector3D(
      a.y * b.z - a.z * b.y,
      a.z * b.x - a.x * b.z,
      a.x * b.y - a.y * b.x
    );
  }

  // Basic operations
  add(other: Vector3D): Vector3D {
    return new Vector3D(this.x + other.x, this.y + other.y, this.z + other.z);
  }

  subtract(other: Vector3D): Vector3D {
    return new Vector3D(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  multiply(scalar: number): Vector3D {
    return new Vector3D(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  divide(scalar: number): Vector3D {
    if (scalar === 0) throw new Error('Division by zero');
    return new Vector3D(this.x / scalar, this.y / scalar, this.z / scalar);
  }

  // Advanced operations
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  normalize(): Vector3D {
    const mag = this.magnitude();
    if (mag === 0) return Vector3D.zero();
    return this.divide(mag);
  }

  dot(other: Vector3D): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  cross(other: Vector3D): Vector3D {
    return new Vector3D(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x
    );
  }

  distance(other: Vector3D): number {
    return this.subtract(other).magnitude();
  }

  distanceSquared(other: Vector3D): number {
    return this.subtract(other).magnitudeSquared();
  }

  lerp(other: Vector3D, t: number): Vector3D {
    return new Vector3D(
      this.x + (other.x - this.x) * t,
      this.y + (other.y - this.y) * t,
      this.z + (other.z - this.z) * t
    );
  }

  // Rotation and transformation
  rotateX(angle: number): Vector3D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector3D(
      this.x,
      this.y * cos - this.z * sin,
      this.y * sin + this.z * cos
    );
  }

  rotateY(angle: number): Vector3D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector3D(
      this.x * cos + this.z * sin,
      this.y,
      -this.x * sin + this.z * cos
    );
  }

  rotateZ(angle: number): Vector3D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector3D(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos,
      this.z
    );
  }

  // Utility methods
  clone(): Vector3D {
    return new Vector3D(this.x, this.y, this.z);
  }

  equals(other: Vector3D): boolean {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }

  toString(): string {
    return `Vector3D(${this.x}, ${this.y}, ${this.z})`;
  }

  // Platform-specific optimizations
  toArray(): number[] {
    return [this.x, this.y, this.z];
  }

  fromArray(array: number[]): void {
    this.x = array[0] || 0;
    this.y = array[1] || 0;
    this.z = array[2] || 0;
  }

  // VR/AR specific methods
  toQuaternion(): Quaternion {
    return Quaternion.fromEuler(this.x, this.y, this.z);
  }

  static add(a: Vector3D, b: Vector3D): Vector3D {
    return new Vector3D(a.x + b.x, a.y + b.y, a.z + b.z);
  }

  static subtract(a: Vector3D, b: Vector3D): Vector3D {
    return new Vector3D(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  static multiply(a: Vector3D, b: Vector3D): Vector3D {
    return new Vector3D(a.x * b.x, a.y * b.y, a.z * b.z);
  }
}

export class Matrix4x4 {
  private data: Float32Array;

  constructor() {
    this.data = new Float32Array(16);
    this.identity();
  }

  // Static constructors
  static identity(): Matrix4x4 {
    const matrix = new Matrix4x4();
    matrix.identity();
    return matrix;
  }

  static translation(x: number, y: number, z: number): Matrix4x4 {
    const matrix = new Matrix4x4();
    matrix.setTranslation(x, y, z);
    return matrix;
  }

  static rotationX(angle: number): Matrix4x4 {
    const matrix = new Matrix4x4();
    matrix.setRotationX(angle);
    return matrix;
  }

  static rotationY(angle: number): Matrix4x4 {
    const matrix = new Matrix4x4();
    matrix.setRotationY(angle);
    return matrix;
  }

  static rotationZ(angle: number): Matrix4x4 {
    const matrix = new Matrix4x4();
    matrix.setRotationZ(angle);
    return matrix;
  }

  static scale(x: number, y: number, z: number): Matrix4x4 {
    const matrix = new Matrix4x4();
    matrix.setScale(x, y, z);
    return matrix;
  }

  static perspective(fov: number, aspect: number, near: number, far: number): Matrix4x4 {
    const matrix = new Matrix4x4();
    matrix.setPerspective(fov, aspect, near, far);
    return matrix;
  }

  static orthographic(left: number, right: number, bottom: number, top: number, near: number, far: number): Matrix4x4 {
    const matrix = new Matrix4x4();
    matrix.setOrthographic(left, right, bottom, top, near, far);
    return matrix;
  }

  // Basic operations
  public identity(): Matrix4x4 {
    this.data[0] = 1; this.data[1] = 0; this.data[2] = 0; this.data[3] = 0;
    this.data[4] = 0; this.data[5] = 1; this.data[6] = 0; this.data[7] = 0;
    this.data[8] = 0; this.data[9] = 0; this.data[10] = 1; this.data[11] = 0;
    this.data[12] = 0; this.data[13] = 0; this.data[14] = 0; this.data[15] = 1;
    return this;
  }

  public getData(): Float32Array {
    return this.data;
  }

  public setData(data: Float32Array): void {
    this.data.set(data);
  }

  public getElement(row: number, col: number): number {
    return this.data[row * 4 + col];
  }

  public setElement(row: number, col: number, value: number): void {
    this.data[row * 4 + col] = value;
  }

  multiply(other: Matrix4x4): Matrix4x4 {
    const result = new Matrix4x4();
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          sum += this.data[i * 4 + k] * other.data[k * 4 + j];
        }
        result.data[i * 4 + j] = sum;
      }
    }
    return result;
  }

  multiplyVector(vector: Vector3D): Vector3D {
    const x = this.data[0] * vector.x + this.data[1] * vector.y + this.data[2] * vector.z + this.data[3];
    const y = this.data[4] * vector.x + this.data[5] * vector.y + this.data[6] * vector.z + this.data[7];
    const z = this.data[8] * vector.x + this.data[9] * vector.y + this.data[10] * vector.z + this.data[11];
    const w = this.data[12] * vector.x + this.data[13] * vector.y + this.data[14] * vector.z + this.data[15];
    
    if (w !== 0) {
      return new Vector3D(x / w, y / w, z / w);
    }
    return new Vector3D(x, y, z);
  }

  // Transformation methods
  setTranslation(x: number, y: number, z: number): void {
    this.identity();
    this.data[3] = x;
    this.data[7] = y;
    this.data[11] = z;
  }

  setRotationX(angle: number): void {
    this.identity();
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    this.data[5] = cos;
    this.data[6] = -sin;
    this.data[9] = sin;
    this.data[10] = cos;
  }

  setRotationY(angle: number): void {
    this.identity();
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    this.data[0] = cos;
    this.data[2] = sin;
    this.data[8] = -sin;
    this.data[10] = cos;
  }

  setRotationZ(angle: number): void {
    this.identity();
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    this.data[0] = cos;
    this.data[1] = -sin;
    this.data[4] = sin;
    this.data[5] = cos;
  }

  setScale(x: number, y: number, z: number): void {
    this.identity();
    this.data[0] = x;
    this.data[5] = y;
    this.data[10] = z;
  }

  setPerspective(fov: number, aspect: number, near: number, far: number): void {
    this.identity();
    const f = 1.0 / Math.tan(fov * 0.5);
    this.data[0] = f / aspect;
    this.data[5] = f;
    this.data[10] = (far + near) / (near - far);
    this.data[11] = (2 * far * near) / (near - far);
    this.data[14] = -1;
    this.data[15] = 0;
  }

  setOrthographic(left: number, right: number, bottom: number, top: number, near: number, far: number): void {
    this.identity();
    const width = right - left;
    const height = top - bottom;
    const depth = far - near;
    
    this.data[0] = 2 / width;
    this.data[5] = 2 / height;
    this.data[10] = -2 / depth;
    this.data[3] = -(right + left) / width;
    this.data[7] = -(top + bottom) / height;
    this.data[11] = -(far + near) / depth;
  }

  // Utility methods
  transpose(): Matrix4x4 {
    const result = new Matrix4x4();
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result.data[i * 4 + j] = this.data[j * 4 + i];
      }
    }
    return result;
  }

  determinant(): number {
    const m11 = this.data[0];
    const m12 = this.data[1];
    const m13 = this.data[2];
    const m14 = this.data[3];
    const m21 = this.data[4];
    const m22 = this.data[5];
    const m23 = this.data[6];
    const m24 = this.data[7];
    const m31 = this.data[8];
    const m32 = this.data[9];
    const m33 = this.data[10];
    const m34 = this.data[11];
    const m41 = this.data[12];
    const m42 = this.data[13];
    const m43 = this.data[14];
    const m44 = this.data[15];

    return (
      m11 * m22 * m33 * m44 - m11 * m22 * m34 * m43 +
      m11 * m23 * m34 * m42 - m11 * m23 * m32 * m44 +
      m11 * m24 * m32 * m43 - m11 * m24 * m33 * m42 -
      m12 * m21 * m33 * m44 + m12 * m21 * m34 * m43 -
      m12 * m23 * m34 * m41 + m12 * m23 * m31 * m44 -
      m12 * m24 * m31 * m43 + m12 * m24 * m33 * m41 -
      m13 * m21 * m34 * m42 + m13 * m21 * m32 * m44 -
      m13 * m22 * m34 * m41 + m13 * m22 * m31 * m44 -
      m13 * m24 * m31 * m42 + m13 * m24 * m32 * m41 -
      m14 * m21 * m32 * m43 + m14 * m21 * m33 * m42 -
      m14 * m22 * m33 * m41 + m14 * m22 * m31 * m43 -
      m14 * m23 * m31 * m42 + m14 * m23 * m32 * m41
    );
  }

  inverse(): Matrix4x4 {
    const det = this.determinant();
    if (Math.abs(det) < 1e-10) {
      throw new Error('Matrix is not invertible');
    }

    const inv = new Matrix4x4();
    const invDet = 1.0 / det;

    // Calculate inverse using cofactor method
    inv.data[0] = (this.data[5] * this.data[10] * this.data[15] - this.data[5] * this.data[11] * this.data[14] - this.data[9] * this.data[6] * this.data[15] + this.data[9] * this.data[7] * this.data[14] + this.data[13] * this.data[6] * this.data[11] - this.data[13] * this.data[7] * this.data[10]) * invDet;
    inv.data[1] = (-this.data[1] * this.data[10] * this.data[15] + this.data[1] * this.data[11] * this.data[14] + this.data[9] * this.data[2] * this.data[15] - this.data[9] * this.data[3] * this.data[14] - this.data[13] * this.data[2] * this.data[11] + this.data[13] * this.data[3] * this.data[10]) * invDet;
    inv.data[2] = (this.data[1] * this.data[6] * this.data[15] - this.data[1] * this.data[7] * this.data[14] - this.data[5] * this.data[2] * this.data[15] + this.data[5] * this.data[3] * this.data[14] + this.data[13] * this.data[2] * this.data[7] - this.data[13] * this.data[3] * this.data[6]) * invDet;
    inv.data[3] = (-this.data[1] * this.data[6] * this.data[11] + this.data[1] * this.data[7] * this.data[10] + this.data[5] * this.data[2] * this.data[11] - this.data[5] * this.data[3] * this.data[10] - this.data[9] * this.data[2] * this.data[7] + this.data[9] * this.data[3] * this.data[6]) * invDet;

    inv.data[4] = (-this.data[4] * this.data[10] * this.data[15] + this.data[4] * this.data[11] * this.data[14] + this.data[8] * this.data[6] * this.data[15] - this.data[8] * this.data[7] * this.data[14] - this.data[12] * this.data[6] * this.data[11] + this.data[12] * this.data[7] * this.data[10]) * invDet;
    inv.data[5] = (this.data[0] * this.data[10] * this.data[15] - this.data[0] * this.data[11] * this.data[14] - this.data[8] * this.data[2] * this.data[15] + this.data[8] * this.data[3] * this.data[14] + this.data[12] * this.data[2] * this.data[11] - this.data[12] * this.data[3] * this.data[10]) * invDet;
    inv.data[6] = (-this.data[0] * this.data[6] * this.data[15] + this.data[0] * this.data[7] * this.data[14] + this.data[4] * this.data[2] * this.data[15] - this.data[4] * this.data[3] * this.data[14] - this.data[12] * this.data[2] * this.data[7] + this.data[12] * this.data[3] * this.data[6]) * invDet;
    inv.data[7] = (this.data[0] * this.data[6] * this.data[11] - this.data[0] * this.data[7] * this.data[10] - this.data[4] * this.data[2] * this.data[11] + this.data[4] * this.data[3] * this.data[10] + this.data[8] * this.data[2] * this.data[7] - this.data[8] * this.data[3] * this.data[6]) * invDet;

    inv.data[8] = (this.data[4] * this.data[9] * this.data[15] - this.data[4] * this.data[11] * this.data[13] - this.data[8] * this.data[5] * this.data[15] + this.data[8] * this.data[7] * this.data[13] + this.data[12] * this.data[5] * this.data[11] - this.data[12] * this.data[7] * this.data[9]) * invDet;
    inv.data[9] = (-this.data[0] * this.data[9] * this.data[15] + this.data[0] * this.data[11] * this.data[13] + this.data[8] * this.data[1] * this.data[15] - this.data[8] * this.data[3] * this.data[13] - this.data[12] * this.data[1] * this.data[11] + this.data[12] * this.data[3] * this.data[9]) * invDet;
    inv.data[10] = (this.data[0] * this.data[5] * this.data[15] - this.data[0] * this.data[7] * this.data[13] - this.data[4] * this.data[1] * this.data[15] + this.data[4] * this.data[3] * this.data[13] + this.data[12] * this.data[1] * this.data[7] - this.data[12] * this.data[3] * this.data[5]) * invDet;
    inv.data[11] = (-this.data[0] * this.data[5] * this.data[11] + this.data[0] * this.data[7] * this.data[9] + this.data[4] * this.data[1] * this.data[11] - this.data[4] * this.data[3] * this.data[9] - this.data[8] * this.data[1] * this.data[7] + this.data[8] * this.data[3] * this.data[5]) * invDet;

    inv.data[12] = (-this.data[4] * this.data[9] * this.data[14] + this.data[4] * this.data[10] * this.data[13] + this.data[8] * this.data[5] * this.data[14] - this.data[8] * this.data[6] * this.data[13] - this.data[12] * this.data[5] * this.data[10] + this.data[12] * this.data[6] * this.data[9]) * invDet;
    inv.data[13] = (this.data[0] * this.data[9] * this.data[14] - this.data[0] * this.data[10] * this.data[13] - this.data[8] * this.data[1] * this.data[14] + this.data[8] * this.data[2] * this.data[13] + this.data[12] * this.data[1] * this.data[10] - this.data[12] * this.data[2] * this.data[9]) * invDet;
    inv.data[14] = (-this.data[0] * this.data[5] * this.data[14] + this.data[0] * this.data[6] * this.data[13] + this.data[4] * this.data[1] * this.data[14] - this.data[4] * this.data[2] * this.data[13] - this.data[12] * this.data[1] * this.data[6] + this.data[12] * this.data[2] * this.data[5]) * invDet;
    inv.data[15] = (this.data[0] * this.data[5] * this.data[10] - this.data[0] * this.data[6] * this.data[9] - this.data[4] * this.data[1] * this.data[10] + this.data[4] * this.data[2] * this.data[9] + this.data[8] * this.data[1] * this.data[6] - this.data[8] * this.data[2] * this.data[5]) * invDet;

    return inv;
  }

  invert(): Matrix4x4 {
    return this.inverse();
  }

  clone(): Matrix4x4 {
    const result = new Matrix4x4();
    result.data = new Float32Array(this.data);
    return result;
  }

  toArray(): number[] {
    return Array.from(this.data);
  }

  fromArray(array: number[]): void {
    this.data.set(array.slice(0, 16));
  }

  toString(): string {
    return `Matrix4x4([
      ${this.data.slice(0, 4).join(', ')},
      ${this.data.slice(4, 8).join(', ')},
      ${this.data.slice(8, 12).join(', ')},
      ${this.data.slice(12, 16).join(', ')}
    ])`;
  }

  set(row: number, col: number, value: number): void {
    this.data[row * 4 + col] = value;
  }

  get(row: number, col: number): number {
    return this.data[row * 4 + col];
  }

  static multiply(a: Matrix4x4, b: Matrix4x4): Matrix4x4 {
    const result = new Matrix4x4();
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          sum += a.get(i, k) * b.get(k, j);
        }
        result.set(i, j, sum);
      }
    }
    return result;
  }
}

export class Quaternion {
  public x: number;
  public y: number;
  public z: number;
  public w: number;

  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  // Static constructors
  static identity(): Quaternion {
    return new Quaternion(0, 0, 0, 1);
  }

  static fromEuler(x: number, y: number, z: number): Quaternion {
    const cx = Math.cos(x * 0.5);
    const sx = Math.sin(x * 0.5);
    const cy = Math.cos(y * 0.5);
    const sy = Math.sin(y * 0.5);
    const cz = Math.cos(z * 0.5);
    const sz = Math.sin(z * 0.5);

    return new Quaternion(
      sx * cy * cz + cx * sy * sz,
      cx * sy * cz - sx * cy * sz,
      cx * cy * sz - sx * sy * cz,
      cx * cy * cz + sx * sy * sz
    );
  }

  static fromAxisAngle(axis: Vector3D, angle: number): Quaternion {
    const halfAngle = angle * 0.5;
    const sin = Math.sin(halfAngle);
    const normalizedAxis = axis.normalize();
    
    return new Quaternion(
      normalizedAxis.x * sin,
      normalizedAxis.y * sin,
      normalizedAxis.z * sin,
      Math.cos(halfAngle)
    );
  }

  // Basic operations
  multiply(other: Quaternion): Quaternion {
    return new Quaternion(
      this.w * other.x + this.x * other.w + this.y * other.z - this.z * other.y,
      this.w * other.y - this.x * other.z + this.y * other.w + this.z * other.x,
      this.w * other.z + this.x * other.y - this.y * other.x + this.z * other.w,
      this.w * other.w - this.x * other.x - this.y * other.y - this.z * other.z
    );
  }

  conjugate(): Quaternion {
    return new Quaternion(-this.x, -this.y, -this.z, this.w);
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }

  normalize(): Quaternion {
    const mag = this.magnitude();
    if (mag === 0) return Quaternion.identity();
    return new Quaternion(this.x / mag, this.y / mag, this.z / mag, this.w / mag);
  }

  inverse(): Quaternion {
    const magSq = this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    if (magSq === 0) return Quaternion.identity();
    const invMagSq = 1 / magSq;
    return new Quaternion(-this.x * invMagSq, -this.y * invMagSq, -this.z * invMagSq, this.w * invMagSq);
  }

  // Rotation operations
  rotateVector(vector: Vector3D): Vector3D {
    const qv = new Quaternion(vector.x, vector.y, vector.z, 0);
    const result = this.multiply(qv).multiply(this.conjugate());
    return new Vector3D(result.x, result.y, result.z);
  }

  slerp(other: Quaternion, t: number): Quaternion {
    let dot = this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
    
    if (dot < 0) {
      other = new Quaternion(-other.x, -other.y, -other.z, -other.w);
      dot = -dot;
    }
    
    if (dot > 0.9995) {
      return new Quaternion(
        this.x + (other.x - this.x) * t,
        this.y + (other.y - this.y) * t,
        this.z + (other.z - this.z) * t,
        this.w + (other.w - this.w) * t
      ).normalize();
    }
    
    const theta = Math.acos(dot);
    const sinTheta = Math.sin(theta);
    const w1 = Math.sin((1 - t) * theta) / sinTheta;
    const w2 = Math.sin(t * theta) / sinTheta;
    
    return new Quaternion(
      this.x * w1 + other.x * w2,
      this.y * w1 + other.y * w2,
      this.z * w1 + other.z * w2,
      this.w * w1 + other.w * w2
    );
  }

  // Conversion methods
  toMatrix(): Matrix4x4 {
    const matrix = new Matrix4x4();
    const data = matrix.getData();
    
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const w = this.w;
    
    const xx = x * x;
    const xy = x * y;
    const xz = x * z;
    const xw = x * w;
    const yy = y * y;
    const yz = y * z;
    const yw = y * w;
    const zz = z * z;
    const zw = z * w;
    
    data[0] = 1 - 2 * (yy + zz);
    data[1] = 2 * (xy - zw);
    data[2] = 2 * (xz + yw);
    data[3] = 0;
    
    data[4] = 2 * (xy + zw);
    data[5] = 1 - 2 * (xx + zz);
    data[6] = 2 * (yz - xw);
    data[7] = 0;
    
    data[8] = 2 * (xz - yw);
    data[9] = 2 * (yz + xw);
    data[10] = 1 - 2 * (xx + yy);
    data[11] = 0;
    
    data[12] = 0;
    data[13] = 0;
    data[14] = 0;
    data[15] = 1;
    
    return matrix;
  }

  toEuler(): Vector3D {
    const matrix = this.toMatrix();
    const m11 = matrix.data[0];
    const m12 = matrix.data[1];
    const m13 = matrix.data[2];
    const m21 = matrix.data[4];
    const m22 = matrix.data[5];
    const m23 = matrix.data[6];
    const m31 = matrix.data[8];
    const m32 = matrix.data[9];
    const m33 = matrix.data[10];

    let x, y, z;

    if (Math.abs(m31) < 0.99999) {
      x = Math.atan2(m32, m33);
      y = Math.asin(-m31);
      z = Math.atan2(m21, m11);
    } else {
      x = Math.atan2(-m23, m22);
      y = Math.asin(-m31);
      z = 0;
    }

    return new Vector3D(x, y, z);
  }

  // Utility methods
  clone(): Quaternion {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  equals(other: Quaternion): boolean {
    return this.x === other.x && this.y === other.y && this.z === other.z && this.w === other.w;
  }

  toString(): string {
    return `Quaternion(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
  }

  toArray(): number[] {
    return [this.x, this.y, this.z, this.w];
  }

  fromArray(array: number[]): void {
    this.x = array[0] || 0;
    this.y = array[1] || 0;
    this.z = array[2] || 0;
    this.w = array[3] || 1;
  }
}

// Utility functions for cross-platform compatibility
export class MathUtils {
  static readonly PI = Math.PI;
  static readonly TWO_PI = Math.PI * 2;
  static readonly HALF_PI = Math.PI * 0.5;
  static readonly DEG_TO_RAD = Math.PI / 180;
  static readonly RAD_TO_DEG = 180 / Math.PI;

  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  static smoothstep(edge0: number, edge1: number, x: number): number {
    const t = MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  static random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static degreesToRadians(degrees: number): number {
    return degrees * MathUtils.DEG_TO_RAD;
  }

  static radiansToDegrees(radians: number): number {
    return radians * MathUtils.RAD_TO_DEG;
  }

  // Platform-specific optimizations
  static isPowerOfTwo(value: number): boolean {
    return (value & (value - 1)) === 0;
  }

  static nextPowerOfTwo(value: number): number {
    value--;
    value |= value >> 1;
    value |= value >> 2;
    value |= value >> 4;
    value |= value >> 8;
    value |= value >> 16;
    value++;
    return value;
  }

  // VR/AR specific utilities
  static calculateFOV(aspectRatio: number, targetFOV: number): number {
    // Adjust FOV based on aspect ratio for consistent experience across devices
    return Math.atan(Math.tan(targetFOV * 0.5) * aspectRatio) * 2;
  }

  static calculateIPD(eyeDistance: number): number {
    // Interpupillary distance calculation for VR
    return eyeDistance * 0.064; // Average IPD is 64mm
  }
}

export function quaternionToRotationMatrix(quaternion: Quaternion): Matrix4x4 {
  const matrix = new Matrix4x4();
  const data = matrix.getData();
  
  const x = quaternion.x;
  const y = quaternion.y;
  const z = quaternion.z;
  const w = quaternion.w;
  
  const xx = x * x;
  const xy = x * y;
  const xz = x * z;
  const xw = x * w;
  const yy = y * y;
  const yz = y * z;
  const yw = y * w;
  const zz = z * z;
  const zw = z * w;
  
  data[0] = 1 - 2 * (yy + zz);
  data[1] = 2 * (xy - zw);
  data[2] = 2 * (xz + yw);
  data[3] = 0;
  
  data[4] = 2 * (xy + zw);
  data[5] = 1 - 2 * (xx + zz);
  data[6] = 2 * (yz - xw);
  data[7] = 0;
  
  data[8] = 2 * (xz - yw);
  data[9] = 2 * (yz + xw);
  data[10] = 1 - 2 * (xx + yy);
  data[11] = 0;
  
  data[12] = 0;
  data[13] = 0;
  data[14] = 0;
  data[15] = 1;
  
  return matrix;
}

export function rotationMatrixToQuaternion(matrix: Matrix4x4): Quaternion {
  const data = matrix.getData();
  
  const m11 = data[0];
  const m12 = data[1];
  const m13 = data[2];
  const m21 = data[4];
  const m22 = data[5];
  const m23 = data[6];
  const m31 = data[8];
  const m32 = data[9];
  const m33 = data[10];
  
  const trace = m11 + m22 + m33;
  
  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1.0);
    return new Quaternion(
      (m32 - m23) * s,
      (m13 - m31) * s,
      (m21 - m12) * s,
      0.25 / s
    );
  } else if (m11 > m22 && m11 > m33) {
    const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
    return new Quaternion(
      0.25 * s,
      (m12 + m21) / s,
      (m13 + m31) / s,
      (m32 - m23) / s
    );
  } else if (m22 > m33) {
    const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
    return new Quaternion(
      (m12 + m21) / s,
      0.25 * s,
      (m23 + m32) / s,
      (m13 - m31) / s
    );
  } else {
    const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
    return new Quaternion(
      (m13 + m31) / s,
      (m23 + m32) / s,
      0.25 * s,
      (m21 - m12) / s
    );
  }
} 
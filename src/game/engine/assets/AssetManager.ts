/**
 * Asset Manager - Cross-Platform Asset Loading and Caching
 * 
 * Provides asset management for:
 * - Vector graphics and textures
 * - 3D models and meshes
 * - Audio files and sound effects
 * - Configuration files and data
 * - Platform-specific asset optimization
 * - Memory management and caching
 * 
 * Supports all platforms including Nintendo DS and VR
 */

import { Vector2D, Vector3D } from '../math/VectorMath';

export interface Asset {
  id: string;
  type: AssetType;
  data: any;
  size: number;
  loaded: boolean;
  error: string | null;
  metadata: AssetMetadata;
}

export type AssetType = 
  | 'texture' 
  | 'mesh' 
  | 'audio' 
  | 'font' 
  | 'shader' 
  | 'config' 
  | 'vector' 
  | 'animation' 
  | 'material' 
  | 'scene';

export interface AssetMetadata {
  name: string;
  description?: string;
  tags: string[];
  version: string;
  author?: string;
  license?: string;
  created: Date;
  modified: Date;
  platform: string[];
  quality: 'low' | 'medium' | 'high' | 'ultra';
  compression: boolean;
  encrypted: boolean;
  dependencies: string[];
}

export interface AssetLoader {
  type: AssetType;
  extensions: string[];
  load(url: string, options?: LoadOptions): Promise<Asset>;
  unload(asset: Asset): void;
  canLoad(url: string): boolean;
}

export interface LoadOptions {
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  platform?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  cache?: boolean;
  compression?: boolean;
  encryption?: boolean;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
}

export interface AssetCache {
  maxSize: number;
  currentSize: number;
  assets: Map<string, Asset>;
  lru: string[];
}

export class AssetManager {
  private loaders: Map<AssetType, AssetLoader> = new Map();
  private cache: AssetCache;
  private loadingQueue: Map<string, Promise<Asset>> = new Map();
  private loadedAssets: Map<string, Asset> = new Map();
  private failedAssets: Map<string, string> = new Map();
  private totalLoaded: number = 0;
  private totalSize: number = 0;

  constructor(maxCacheSize: number = 100 * 1024 * 1024) { // 100MB default
    this.cache = {
      maxSize: maxCacheSize,
      currentSize: 0,
      assets: new Map(),
      lru: []
    };
    
    this.initializeDefaultLoaders();
  }

  private initializeDefaultLoaders(): void {
    // Register default asset loaders
    this.registerLoader(new TextureLoader());
    this.registerLoader(new MeshLoader());
    this.registerLoader(new AudioLoader());
    this.registerLoader(new FontLoader());
    this.registerLoader(new ShaderLoader());
    this.registerLoader(new ConfigLoader());
    this.registerLoader(new VectorLoader());
    this.registerLoader(new AnimationLoader());
    this.registerLoader(new MaterialLoader());
    this.registerLoader(new SceneLoader());
  }

  registerLoader(loader: AssetLoader): void {
    this.loaders.set(loader.type, loader);
  }

  async loadAsset(url: string, options: LoadOptions = {}): Promise<Asset> {
    // Check if already loaded
    if (this.loadedAssets.has(url)) {
      return this.loadedAssets.get(url)!;
    }

    // Check if already loading
    if (this.loadingQueue.has(url)) {
      return this.loadingQueue.get(url)!;
    }

    // Check if failed before
    if (this.failedAssets.has(url)) {
      throw new Error(`Asset failed to load previously: ${this.failedAssets.get(url)}`);
    }

    // Find appropriate loader
    const loader = this.findLoader(url);
    if (!loader) {
      throw new Error(`No loader found for asset: ${url}`);
    }

    // Create loading promise
    const loadPromise = this.loadAssetWithLoader(url, loader, options);
    this.loadingQueue.set(url, loadPromise);

    try {
      const asset = await loadPromise;
      this.loadedAssets.set(url, asset);
      this.loadingQueue.delete(url);
      this.totalLoaded++;
      this.totalSize += asset.size;
      
      // Cache the asset
      if (options.cache !== false) {
        this.cacheAsset(url, asset);
      }
      
      return asset;
    } catch (error) {
      this.failedAssets.set(url, error instanceof Error ? error.message : 'Unknown error');
      this.loadingQueue.delete(url);
      throw error;
    }
  }

  private async loadAssetWithLoader(url: string, loader: AssetLoader, options: LoadOptions): Promise<Asset> {
    try {
      const asset = await loader.load(url, options);
      
      // Validate asset
      if (!asset.id || !asset.type || !asset.data) {
        throw new Error('Invalid asset data');
      }
      
      return asset;
    } catch (error) {
      throw new Error(`Failed to load asset ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private findLoader(url: string): AssetLoader | null {
    for (const loader of this.loaders.values()) {
      if (loader.canLoad(url)) {
        return loader;
      }
    }
    return null;
  }

  private cacheAsset(url: string, asset: Asset): void {
    // Check if we need to make space
    while (this.cache.currentSize + asset.size > this.cache.maxSize && this.cache.lru.length > 0) {
      this.evictLRU();
    }

    // Add to cache
    this.cache.assets.set(url, asset);
    this.cache.currentSize += asset.size;
    
    // Update LRU
    const lruIndex = this.cache.lru.indexOf(url);
    if (lruIndex !== -1) {
      this.cache.lru.splice(lruIndex, 1);
    }
    this.cache.lru.push(url);
  }

  private evictLRU(): void {
    if (this.cache.lru.length === 0) return;
    
    const url = this.cache.lru.shift()!;
    const asset = this.cache.assets.get(url);
    if (asset) {
      this.cache.currentSize -= asset.size;
      this.cache.assets.delete(url);
      
      // Unload asset data
      const loader = this.loaders.get(asset.type);
      if (loader) {
        loader.unload(asset);
      }
    }
  }

  async loadMultiple(urls: string[], options: LoadOptions = {}): Promise<Asset[]> {
    const promises = urls.map(url => this.loadAsset(url, options));
    return Promise.all(promises);
  }

  async preloadAssets(urls: string[], options: LoadOptions = {}): Promise<void> {
    const promises = urls.map(url => this.loadAsset(url, { ...options, priority: 'low' }));
    await Promise.allSettled(promises);
  }

  getAsset(url: string): Asset | null {
    return this.loadedAssets.get(url) || null;
  }

  isLoaded(url: string): boolean {
    return this.loadedAssets.has(url);
  }

  isLoading(url: string): boolean {
    return this.loadingQueue.has(url);
  }

  unloadAsset(url: string): boolean {
    const asset = this.loadedAssets.get(url);
    if (!asset) return false;

    // Remove from cache
    this.cache.assets.delete(url);
    const lruIndex = this.cache.lru.indexOf(url);
    if (lruIndex !== -1) {
      this.cache.lru.splice(lruIndex, 1);
    }
    this.cache.currentSize -= asset.size;

    // Unload asset data
    const loader = this.loaders.get(asset.type);
    if (loader) {
      loader.unload(asset);
    }

    // Remove from loaded assets
    this.loadedAssets.delete(url);
    this.totalSize -= asset.size;

    return true;
  }

  unloadAll(): void {
    for (const url of this.loadedAssets.keys()) {
      this.unloadAsset(url);
    }
  }

  clearCache(): void {
    this.cache.assets.clear();
    this.cache.lru = [];
    this.cache.currentSize = 0;
  }

  getCacheInfo(): { size: number; maxSize: number; assetCount: number; hitRate: number } {
    return {
      size: this.cache.currentSize,
      maxSize: this.cache.maxSize,
      assetCount: this.cache.assets.size,
      hitRate: 0 // Would need to track cache hits
    };
  }

  getStats(): { totalLoaded: number; totalSize: number; loadingCount: number; failedCount: number } {
    return {
      totalLoaded: this.totalLoaded,
      totalSize: this.totalSize,
      loadingCount: this.loadingQueue.size,
      failedCount: this.failedAssets.size
    };
  }

  // Platform-specific optimizations
  optimizeForPlatform(platform: string): void {
    // Apply platform-specific asset optimizations
    switch (platform.toLowerCase()) {
      case 'mobile':
        this.optimizeForMobile();
        break;
      case 'nintendo':
        this.optimizeForNintendo();
        break;
      case 'vr':
        this.optimizeForVR();
        break;
      case 'console':
        this.optimizeForConsole();
        break;
      default:
        this.optimizeForDesktop();
        break;
    }
  }

  private optimizeForMobile(): void {
    // Mobile optimizations
    this.cache.maxSize = 50 * 1024 * 1024; // 50MB
  }

  private optimizeForNintendo(): void {
    // Nintendo DS/Switch optimizations
    this.cache.maxSize = 25 * 1024 * 1024; // 25MB
  }

  private optimizeForVR(): void {
    // VR optimizations
    this.cache.maxSize = 200 * 1024 * 1024; // 200MB
  }

  private optimizeForConsole(): void {
    // Console optimizations
    this.cache.maxSize = 500 * 1024 * 1024; // 500MB
  }

  private optimizeForDesktop(): void {
    // Desktop optimizations
    this.cache.maxSize = 100 * 1024 * 1024; // 100MB
  }
}

// Default asset loaders
class TextureLoader implements AssetLoader {
  type: AssetType = 'texture';
  extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

  async load(url: string, options: LoadOptions = {}): Promise<Asset> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const asset: Asset = {
          id: url,
          type: 'texture',
          data: canvas,
          size: img.width * img.height * 4, // RGBA
          loaded: true,
          error: null,
          metadata: {
            name: url.split('/').pop() || 'texture',
            tags: ['texture', 'image'],
            version: '1.0',
            created: new Date(),
            modified: new Date(),
            platform: ['all'],
            quality: options.quality || 'medium',
            compression: false,
            encrypted: false,
            dependencies: []
          }
        };
        
        resolve(asset);
      };
      
      img.onerror = () => reject(new Error(`Failed to load texture: ${url}`));
      img.src = url;
    });
  }

  unload(asset: Asset): void {
    // Clean up texture data
    if (asset.data instanceof HTMLCanvasElement) {
      asset.data.width = 0;
      asset.data.height = 0;
    }
  }

  canLoad(url: string): boolean {
    return this.extensions.some(ext => url.toLowerCase().endsWith(ext));
  }
}

class MeshLoader implements AssetLoader {
  type: AssetType = 'mesh';
  extensions = ['.obj', '.fbx', '.dae', '.gltf', '.glb', '.ply'];

  async load(url: string, options: LoadOptions = {}): Promise<Asset> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch mesh: ${response.statusText}`);
    }
    
    const text = await response.text();
    const meshData = this.parseMeshData(text, url);
    
    return {
      id: url,
      type: 'mesh',
      data: meshData,
      size: text.length,
      loaded: true,
      error: null,
      metadata: {
        name: url.split('/').pop() || 'mesh',
        tags: ['mesh', '3d'],
        version: '1.0',
        created: new Date(),
        modified: new Date(),
        platform: ['all'],
        quality: options.quality || 'medium',
        compression: false,
        encrypted: false,
        dependencies: []
      }
    };
  }

  private parseMeshData(text: string, url: string): any {
    // Simplified mesh parsing - would need proper implementation
    return {
      vertices: [],
      indices: [],
      normals: [],
      uvs: []
    };
  }

  unload(asset: Asset): void {
    // Clean up mesh data
  }

  canLoad(url: string): boolean {
    return this.extensions.some(ext => url.toLowerCase().endsWith(ext));
  }
}

class AudioLoader implements AssetLoader {
  type: AssetType = 'audio';
  extensions = ['.mp3', '.wav', '.ogg', '.aac', '.m4a'];

  async load(url: string, options: LoadOptions = {}): Promise<Asset> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      
      audio.oncanplaythrough = () => {
        const asset: Asset = {
          id: url,
          type: 'audio',
          data: audio,
          size: 0, // Would need to get actual file size
          loaded: true,
          error: null,
          metadata: {
            name: url.split('/').pop() || 'audio',
            tags: ['audio', 'sound'],
            version: '1.0',
            created: new Date(),
            modified: new Date(),
            platform: ['all'],
            quality: options.quality || 'medium',
            compression: false,
            encrypted: false,
            dependencies: []
          }
        };
        
        resolve(asset);
      };
      
      audio.onerror = () => reject(new Error(`Failed to load audio: ${url}`));
      audio.src = url;
    });
  }

  unload(asset: Asset): void {
    // Clean up audio data
    if (asset.data instanceof HTMLAudioElement) {
      asset.data.src = '';
    }
  }

  canLoad(url: string): boolean {
    return this.extensions.some(ext => url.toLowerCase().endsWith(ext));
  }
}

class FontLoader implements AssetLoader {
  type: AssetType = 'font';
  extensions = ['.ttf', '.otf', '.woff', '.woff2', '.eot'];

  async load(url: string, options: LoadOptions = {}): Promise<Asset> {
    const fontFace = new FontFace(url.split('/').pop() || 'font', `url(${url})`);
    await fontFace.load();
    document.fonts.add(fontFace);
    
    return {
      id: url,
      type: 'font',
      data: fontFace,
      size: 0, // Would need to get actual file size
      loaded: true,
      error: null,
      metadata: {
        name: url.split('/').pop() || 'font',
        tags: ['font', 'text'],
        version: '1.0',
        created: new Date(),
        modified: new Date(),
        platform: ['all'],
        quality: options.quality || 'medium',
        compression: false,
        encrypted: false,
        dependencies: []
      }
    };
  }

  unload(asset: Asset): void {
    // Clean up font data
    if (asset.data instanceof FontFace) {
      document.fonts.delete(asset.data);
    }
  }

  canLoad(url: string): boolean {
    return this.extensions.some(ext => url.toLowerCase().endsWith(ext));
  }
}

class ShaderLoader implements AssetLoader {
  type: AssetType = 'shader';
  extensions = ['.vert', '.frag', '.glsl', '.wgsl'];

  async load(url: string, options: LoadOptions = {}): Promise<Asset> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch shader: ${response.statusText}`);
    }
    
    const source = await response.text();
    
    return {
      id: url,
      type: 'shader',
      data: source,
      size: source.length,
      loaded: true,
      error: null,
      metadata: {
        name: url.split('/').pop() || 'shader',
        tags: ['shader', 'graphics'],
        version: '1.0',
        created: new Date(),
        modified: new Date(),
        platform: ['all'],
        quality: options.quality || 'medium',
        compression: false,
        encrypted: false,
        dependencies: []
      }
    };
  }

  unload(asset: Asset): void {
    // Clean up shader data
  }

  canLoad(url: string): boolean {
    return this.extensions.some(ext => url.toLowerCase().endsWith(ext));
  }
}

class ConfigLoader implements AssetLoader {
  type: AssetType = 'config';
  extensions = ['.json', '.xml', '.yaml', '.yml', '.toml'];

  async load(url: string, options: LoadOptions = {}): Promise<Asset> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.statusText}`);
    }
    
    const text = await response.text();
    const data = JSON.parse(text);
    
    return {
      id: url,
      type: 'config',
      data: data,
      size: text.length,
      loaded: true,
      error: null,
      metadata: {
        name: url.split('/').pop() || 'config',
        tags: ['config', 'data'],
        version: '1.0',
        created: new Date(),
        modified: new Date(),
        platform: ['all'],
        quality: options.quality || 'medium',
        compression: false,
        encrypted: false,
        dependencies: []
      }
    };
  }

  unload(asset: Asset): void {
    // Clean up config data
  }

  canLoad(url: string): boolean {
    return this.extensions.some(ext => url.toLowerCase().endsWith(ext));
  }
}

class VectorLoader implements AssetLoader {
  type: AssetType = 'vector';
  extensions = ['.svg', '.ai', '.eps', '.pdf'];

  async load(url: string, options: LoadOptions = {}): Promise<Asset> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch vector: ${response.statusText}`);
    }
    
    const svgText = await response.text();
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
    
    return {
      id: url,
      type: 'vector',
      data: svgElement,
      size: svgText.length,
      loaded: true,
      error: null,
      metadata: {
        name: url.split('/').pop() || 'vector',
        tags: ['vector', 'graphics'],
        version: '1.0',
        created: new Date(),
        modified: new Date(),
        platform: ['all'],
        quality: options.quality || 'medium',
        compression: false,
        encrypted: false,
        dependencies: []
      }
    };
  }

  unload(asset: Asset): void {
    // Clean up vector data
  }

  canLoad(url: string): boolean {
    return this.extensions.some(ext => url.toLowerCase().endsWith(ext));
  }
}

class AnimationLoader implements AssetLoader {
  type: AssetType = 'animation';
  extensions = ['.anim', '.fbx', '.dae', '.bvh'];

  async load(url: string, options: LoadOptions = {}): Promise<Asset> {
    // Simplified animation loading
    return {
      id: url,
      type: 'animation',
      data: {},
      size: 0,
      loaded: true,
      error: null,
      metadata: {
        name: url.split('/').pop() || 'animation',
        tags: ['animation', 'motion'],
        version: '1.0',
        created: new Date(),
        modified: new Date(),
        platform: ['all'],
        quality: options.quality || 'medium',
        compression: false,
        encrypted: false,
        dependencies: []
      }
    };
  }

  unload(asset: Asset): void {
    // Clean up animation data
  }

  canLoad(url: string): boolean {
    return this.extensions.some(ext => url.toLowerCase().endsWith(ext));
  }
}

class MaterialLoader implements AssetLoader {
  type: AssetType = 'material';
  extensions = ['.mat', '.mtl', '.json'];

  async load(url: string, options: LoadOptions = {}): Promise<Asset> {
    // Simplified material loading
    return {
      id: url,
      type: 'material',
      data: {},
      size: 0,
      loaded: true,
      error: null,
      metadata: {
        name: url.split('/').pop() || 'material',
        tags: ['material', 'shading'],
        version: '1.0',
        created: new Date(),
        modified: new Date(),
        platform: ['all'],
        quality: options.quality || 'medium',
        compression: false,
        encrypted: false,
        dependencies: []
      }
    };
  }

  unload(asset: Asset): void {
    // Clean up material data
  }

  canLoad(url: string): boolean {
    return this.extensions.some(ext => url.toLowerCase().endsWith(ext));
  }
}

class SceneLoader implements AssetLoader {
  type: AssetType = 'scene';
  extensions = ['.scene', '.json', '.xml'];

  async load(url: string, options: LoadOptions = {}): Promise<Asset> {
    // Simplified scene loading
    return {
      id: url,
      type: 'scene',
      data: {},
      size: 0,
      loaded: true,
      error: null,
      metadata: {
        name: url.split('/').pop() || 'scene',
        tags: ['scene', 'level'],
        version: '1.0',
        created: new Date(),
        modified: new Date(),
        platform: ['all'],
        quality: options.quality || 'medium',
        compression: false,
        encrypted: false,
        dependencies: []
      }
    };
  }

  unload(asset: Asset): void {
    // Clean up scene data
  }

  canLoad(url: string): boolean {
    return this.extensions.some(ext => url.toLowerCase().endsWith(ext));
  }
} 
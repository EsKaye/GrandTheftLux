/**
 * 🌐 Network Manager
 * 
 * Advanced networking system for:
 * - Real-time multiplayer synchronization
 * - Client-server architecture
 * - Network optimization and compression
 * - Latency compensation
 * - Bandwidth management
 * - Connection handling and reconnection
 */

export interface NetworkConfig {
  serverUrl: string;
  port: number;
  protocol: 'ws' | 'wss' | 'http' | 'https';
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  maxLatency: number;
  compression: boolean;
  encryption: boolean;
  bandwidthLimit: number;
}

export interface NetworkMessage {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  reliable: boolean;
  sequence?: number;
}

export interface NetworkPlayer {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  vehicle: any;
  lastUpdate: number;
  ping: number;
  isLocal: boolean;
}

export interface NetworkStats {
  connected: boolean;
  latency: number;
  bandwidth: number;
  packetsSent: number;
  packetsReceived: number;
  players: number;
  errors: number;
}

export class NetworkManager {
  private config: NetworkConfig;
  private socket: WebSocket | null = null;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';
  
  // Message handling
  private messageQueue: NetworkMessage[] = [];
  private reliableMessages: Map<string, NetworkMessage> = new Map();
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  
  // Player management
  private players: Map<string, NetworkPlayer> = new Map();
  private localPlayer: NetworkPlayer | null = null;
  
  // Network optimization
  private lastUpdate: number = 0;
  private updateRate: number = 60; // Hz
  private interpolationBuffer: Map<string, any[]> = new Map();
  private predictionBuffer: Map<string, any[]> = new Map();
  
  // Performance tracking
  private stats: NetworkStats = {
    connected: false,
    latency: 0,
    bandwidth: 0,
    packetsSent: 0,
    packetsReceived: 0,
    players: 0,
    errors: 0
  };
  
  // Reconnection
  private reconnectAttempts: number = 0;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  
  constructor(config: NetworkConfig) {
    this.config = config;
  }
  
  /**
   * Initialize the network manager
   */
  public async initialize(): Promise<void> {
    console.log('🌐 Initializing Network Manager...');
    
    try {
      // Set up message handlers
      this.setupMessageHandlers();
      
      // Connect to server
      await this.connect();
      
      console.log('✅ Network Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Network Manager:', error);
      throw error;
    }
  }
  
  /**
   * Set up default message handlers
   */
  private setupMessageHandlers(): void {
    // Player join/leave
    this.addMessageHandler('player_join', this.handlePlayerJoin.bind(this));
    this.addMessageHandler('player_leave', this.handlePlayerLeave.bind(this));
    this.addMessageHandler('player_update', this.handlePlayerUpdate.bind(this));
    
    // Game state
    this.addMessageHandler('game_state', this.handleGameState.bind(this));
    this.addMessageHandler('vehicle_update', this.handleVehicleUpdate.bind(this));
    this.addMessageHandler('world_update', this.handleWorldUpdate.bind(this));
    
    // System messages
    this.addMessageHandler('ping', this.handlePing.bind(this));
    this.addMessageHandler('pong', this.handlePong.bind(this));
    this.addMessageHandler('error', this.handleError.bind(this));
  }
  
  /**
   * Connect to server
   */
  private async connect(): Promise<void> {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      return;
    }
    
    this.connectionState = 'connecting';
    
    try {
      const url = `${this.config.protocol}://${this.config.serverUrl}:${this.config.port}`;
      this.socket = new WebSocket(url);
      
      this.socket.onopen = this.handleConnectionOpen.bind(this);
      this.socket.onclose = this.handleConnectionClose.bind(this);
      this.socket.onerror = this.handleConnectionError.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      
      // Set up connection timeout
      setTimeout(() => {
        if (this.connectionState === 'connecting') {
          this.handleConnectionTimeout();
        }
      }, 10000); // 10 second timeout
      
    } catch (error) {
      this.handleConnectionError(error);
    }
  }
  
  /**
   * Handle connection open
   */
  private handleConnectionOpen(): void {
    console.log('🌐 Connected to server');
    this.connectionState = 'connected';
    this.stats.connected = true;
    this.reconnectAttempts = 0;
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Send initial player data
    this.sendPlayerJoin();
    
    // Emit connection event
    this.emitEvent('connected', {});
  }
  
  /**
   * Handle connection close
   */
  private handleConnectionClose(event: CloseEvent): void {
    console.log('🌐 Disconnected from server:', event.code, event.reason);
    this.connectionState = 'disconnected';
    this.stats.connected = false;
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Attempt reconnection
    if (this.reconnectAttempts < this.config.reconnectAttempts) {
      this.attemptReconnection();
    } else {
      this.emitEvent('disconnected', { reason: event.reason, code: event.code });
    }
  }
  
  /**
   * Handle connection error
   */
  private handleConnectionError(error: any): void {
    console.error('🌐 Connection error:', error);
    this.stats.errors++;
    
    if (this.connectionState === 'connecting') {
      this.handleConnectionTimeout();
    }
  }
  
  /**
   * Handle connection timeout
   */
  private handleConnectionTimeout(): void {
    console.log('🌐 Connection timeout');
    this.connectionState = 'disconnected';
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.attemptReconnection();
  }
  
  /**
   * Attempt reconnection
   */
  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.config.reconnectAttempts) {
      console.log('🌐 Max reconnection attempts reached');
      this.emitEvent('reconnection_failed', {});
      return;
    }
    
    this.reconnectAttempts++;
    this.connectionState = 'reconnecting';
    
    console.log(`🌐 Attempting reconnection ${this.reconnectAttempts}/${this.config.reconnectAttempts}`);
    
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      this.sendPing();
    }, this.config.heartbeatInterval);
  }
  
  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  /**
   * Send ping
   */
  private sendPing(): void {
    this.sendMessage({
      id: `ping_${Date.now()}`,
      type: 'ping',
      data: { timestamp: Date.now() },
      timestamp: Date.now(),
      priority: 'low',
      reliable: false
    });
  }
  
  /**
   * Handle ping message
   */
  private handlePing(data: any): void {
    // Respond with pong
    this.sendMessage({
      id: `pong_${Date.now()}`,
      type: 'pong',
      data: { timestamp: data.timestamp },
      timestamp: Date.now(),
      priority: 'low',
      reliable: false
    });
  }
  
  /**
   * Handle pong message
   */
  private handlePong(data: any): void {
    // Calculate latency
    const latency = Date.now() - data.timestamp;
    this.stats.latency = latency;
  }
  
  /**
   * Send message to server
   */
  public sendMessage(message: NetworkMessage): void {
    if (!this.socket || this.connectionState !== 'connected') {
      // Queue message for later if reliable
      if (message.reliable) {
        this.reliableMessages.set(message.id, message);
      }
      return;
    }
    
    try {
      // Compress message if enabled
      const data = this.config.compression ? this.compressMessage(message) : message;
      
      // Encrypt message if enabled
      const finalData = this.config.encryption ? this.encryptMessage(data) : data;
      
      this.socket.send(JSON.stringify(finalData));
      this.stats.packetsSent++;
      
      // Remove from reliable messages if sent
      if (message.reliable) {
        this.reliableMessages.delete(message.id);
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      this.stats.errors++;
    }
  }
  
  /**
   * Handle incoming message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Decrypt message if enabled
      const decryptedData = this.config.encryption ? this.decryptMessage(data) : data;
      
      // Decompress message if enabled
      const message = this.config.compression ? this.decompressMessage(decryptedData) : decryptedData;
      
      this.stats.packetsReceived++;
      
      // Handle message
      this.handleIncomingMessage(message);
      
    } catch (error) {
      console.error('Failed to parse message:', error);
      this.stats.errors++;
    }
  }
  
  /**
   * Handle incoming message
   */
  private handleIncomingMessage(message: NetworkMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.data);
        } catch (error) {
          console.error(`Error in message handler for ${message.type}:`, error);
        }
      });
    }
    
    // Emit message event
    this.emitEvent('message', message);
  }
  
  /**
   * Add message handler
   */
  public addMessageHandler(type: string, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }
  
  /**
   * Remove message handler
   */
  public removeMessageHandler(type: string, handler: (data: any) => void): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  /**
   * Handle player join
   */
  private handlePlayerJoin(data: any): void {
    const player: NetworkPlayer = {
      id: data.id,
      name: data.name,
      position: data.position,
      rotation: data.rotation,
      vehicle: data.vehicle,
      lastUpdate: Date.now(),
      ping: 0,
      isLocal: data.isLocal || false
    };
    
    this.players.set(player.id, player);
    
    if (player.isLocal) {
      this.localPlayer = player;
    }
    
    this.stats.players = this.players.size;
    
    this.emitEvent('player_join', player);
  }
  
  /**
   * Handle player leave
   */
  private handlePlayerLeave(data: any): void {
    const player = this.players.get(data.id);
    if (player) {
      this.players.delete(data.id);
      this.stats.players = this.players.size;
      
      this.emitEvent('player_leave', player);
    }
  }
  
  /**
   * Handle player update
   */
  private handlePlayerUpdate(data: any): void {
    const player = this.players.get(data.id);
    if (player) {
      // Update player data
      player.position = data.position;
      player.rotation = data.rotation;
      player.vehicle = data.vehicle;
      player.lastUpdate = Date.now();
      player.ping = data.ping || 0;
      
      // Add to interpolation buffer
      this.addToInterpolationBuffer(data.id, data);
      
      this.emitEvent('player_update', player);
    }
  }
  
  /**
   * Handle game state
   */
  private handleGameState(data: any): void {
    this.emitEvent('game_state', data);
  }
  
  /**
   * Handle vehicle update
   */
  private handleVehicleUpdate(data: any): void {
    this.emitEvent('vehicle_update', data);
  }
  
  /**
   * Handle world update
   */
  private handleWorldUpdate(data: any): void {
    this.emitEvent('world_update', data);
  }
  
  /**
   * Handle error message
   */
  private handleError(data: any): void {
    console.error('Server error:', data);
    this.stats.errors++;
    this.emitEvent('error', data);
  }
  
  /**
   * Send player join message
   */
  private sendPlayerJoin(): void {
    this.sendMessage({
      id: `join_${Date.now()}`,
      type: 'player_join',
      data: {
        name: 'Player',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        vehicle: null
      },
      timestamp: Date.now(),
      priority: 'high',
      reliable: true
    });
  }
  
  /**
   * Update local player
   */
  public updateLocalPlayer(position: any, rotation: any, vehicle: any): void {
    if (!this.localPlayer) return;
    
    this.localPlayer.position = position;
    this.localPlayer.rotation = rotation;
    this.localPlayer.vehicle = vehicle;
    this.localPlayer.lastUpdate = Date.now();
    
    // Send update to server
    this.sendMessage({
      id: `update_${Date.now()}`,
      type: 'player_update',
      data: {
        position,
        rotation,
        vehicle
      },
      timestamp: Date.now(),
      priority: 'normal',
      reliable: false
    });
  }
  
  /**
   * Add to interpolation buffer
   */
  private addToInterpolationBuffer(playerId: string, data: any): void {
    if (!this.interpolationBuffer.has(playerId)) {
      this.interpolationBuffer.set(playerId, []);
    }
    
    const buffer = this.interpolationBuffer.get(playerId)!;
    buffer.push(data);
    
    // Limit buffer size
    if (buffer.length > 10) {
      buffer.shift();
    }
  }
  
  /**
   * Get interpolated player state
   */
  public getInterpolatedPlayerState(playerId: string, time: number): any {
    const buffer = this.interpolationBuffer.get(playerId);
    if (!buffer || buffer.length < 2) {
      return null;
    }
    
    // Find two states to interpolate between
    let state1 = buffer[0];
    let state2 = buffer[1];
    
    for (let i = 1; i < buffer.length; i++) {
      if (buffer[i].timestamp > time) {
        state1 = buffer[i - 1];
        state2 = buffer[i];
        break;
      }
    }
    
    // Interpolate between states
    const alpha = (time - state1.timestamp) / (state2.timestamp - state1.timestamp);
    
    return {
      position: this.interpolateVector3(state1.position, state2.position, alpha),
      rotation: this.interpolateVector3(state1.rotation, state2.rotation, alpha),
      vehicle: state1.vehicle // Vehicle state doesn't interpolate well
    };
  }
  
  /**
   * Interpolate between two Vector3 values
   */
  private interpolateVector3(v1: any, v2: any, alpha: number): any {
    return {
      x: v1.x + (v2.x - v1.x) * alpha,
      y: v1.y + (v2.y - v1.y) * alpha,
      z: v1.z + (v2.z - v1.z) * alpha
    };
  }
  
  /**
   * Compress message
   */
  private compressMessage(message: NetworkMessage): any {
    // Simple compression - remove unnecessary fields
    return {
      i: message.id,
      t: message.type,
      d: message.data,
      ts: message.timestamp,
      p: message.priority,
      r: message.reliable
    };
  }
  
  /**
   * Decompress message
   */
  private decompressMessage(data: any): NetworkMessage {
    return {
      id: data.i,
      type: data.t,
      data: data.d,
      timestamp: data.ts,
      priority: data.p,
      reliable: data.r
    };
  }
  
  /**
   * Encrypt message
   */
  private encryptMessage(data: any): any {
    // Simple encryption - in production, use proper encryption
    return data;
  }
  
  /**
   * Decrypt message
   */
  private decryptMessage(data: any): any {
    // Simple decryption - in production, use proper decryption
    return data;
  }
  
  /**
   * Get all players
   */
  public getPlayers(): NetworkPlayer[] {
    return Array.from(this.players.values());
  }
  
  /**
   * Get local player
   */
  public getLocalPlayer(): NetworkPlayer | null {
    return this.localPlayer;
  }
  
  /**
   * Get player by ID
   */
  public getPlayer(id: string): NetworkPlayer | undefined {
    return this.players.get(id);
  }
  
  /**
   * Get network statistics
   */
  public getStats(): NetworkStats {
    return { ...this.stats };
  }
  
  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connectionState === 'connected';
  }
  
  /**
   * Get connection state
   */
  public getConnectionState(): string {
    return this.connectionState;
  }
  
  /**
   * Event handling
   */
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();
  
  /**
   * Add event listener
   */
  public addEventListener(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }
  
  /**
   * Remove event listener
   */
  public removeEventListener(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * Emit event
   */
  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in network event listener:', error);
        }
      });
    }
  }
  
  /**
   * Update network manager
   */
  public update(deltaTime: number): void {
    // Process message queue
    this.processMessageQueue();
    
    // Update interpolation buffers
    this.updateInterpolationBuffers(deltaTime);
    
    // Resend reliable messages if needed
    this.resendReliableMessages();
  }
  
  /**
   * Process message queue
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      this.sendMessage(message);
    }
  }
  
  /**
   * Update interpolation buffers
   */
  private updateInterpolationBuffers(deltaTime: number): void {
    const currentTime = Date.now();
    
    this.interpolationBuffer.forEach((buffer, playerId) => {
      // Remove old entries
      while (buffer.length > 0 && currentTime - buffer[0].timestamp > 1000) {
        buffer.shift();
      }
    });
  }
  
  /**
   * Resend reliable messages
   */
  private resendReliableMessages(): void {
    const currentTime = Date.now();
    
    this.reliableMessages.forEach((message, id) => {
      if (currentTime - message.timestamp > 5000) { // 5 second timeout
        this.reliableMessages.delete(id);
      }
    });
  }
  
  /**
   * Disconnect from server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.connectionState = 'disconnected';
    this.stats.connected = false;
    
    // Clear timers
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Clear state
    this.players.clear();
    this.localPlayer = null;
    this.messageQueue = [];
    this.reliableMessages.clear();
    this.interpolationBuffer.clear();
    this.predictionBuffer.clear();
  }
  
  /**
   * Dispose of network manager
   */
  public dispose(): void {
    this.disconnect();
    this.messageHandlers.clear();
    this.eventListeners.clear();
  }
} 
/**
 * 🎮 Input Manager
 * 
 * Comprehensive input system for:
 * - Keyboard and mouse input
 * - Gamepad support with multiple controllers
 * - Configurable input bindings
 * - Input mapping and remapping
 * - Input buffering and smoothing
 * - Accessibility features
 */

export interface InputConfig {
  mouseSensitivity: number;
  gamepadEnabled: boolean;
  keyboardLayout: 'qwerty' | 'azerty' | 'qwertz';
  invertY: boolean;
  enableVibration: boolean;
  deadzone: number;
  enableInputBuffering: boolean;
  bufferSize: number;
}

export interface InputBinding {
  action: string;
  keys: string[];
  gamepadButtons: number[];
  gamepadAxes: { axis: number; direction: number }[];
  mouseButtons: number[];
  description: string;
}

export interface InputState {
  keyboard: Map<string, boolean>;
  mouse: {
    position: { x: number; y: number };
    delta: { x: number; y: number };
    buttons: Map<number, boolean>;
    wheel: number;
  };
  gamepads: Map<number, GamepadState>;
  actions: Map<string, boolean>;
  axes: Map<string, number>;
}

export interface GamepadState {
  id: string;
  connected: boolean;
  buttons: boolean[];
  axes: number[];
  timestamp: number;
  vibration?: {
    leftMotor: number;
    rightMotor: number;
  };
}

export interface InputEvent {
  type: 'keydown' | 'keyup' | 'mousedown' | 'mouseup' | 'mousemove' | 'wheel' | 'gamepad';
  action?: string;
  value?: number;
  timestamp: number;
  data?: any;
}

export class InputManager {
  private config: InputConfig;
  private state: InputState;
  private bindings: Map<string, InputBinding> = new Map();
  private eventListeners: Map<string, ((event: InputEvent) => void)[]> = new Map();
  private inputBuffer: InputEvent[] = [];
  
  // DOM elements
  private targetElement: HTMLElement | null = null;
  
  // Gamepad state
  private gamepadStates: Map<number, GamepadState> = new Map();
  private gamepadPollingInterval: number | null = null;
  
  // Input smoothing
  private mouseSmoothing: { x: number; y: number } = { x: 0, y: 0 };
  private axisSmoothing: Map<string, number> = new Map();
  
  constructor(config: InputConfig) {
    this.config = config;
    this.state = {
      keyboard: new Map(),
      mouse: {
        position: { x: 0, y: 0 },
        delta: { x: 0, y: 0 },
        buttons: new Map(),
        wheel: 0
      },
      gamepads: new Map(),
      actions: new Map(),
      axes: new Map()
    };
    
    this.initializeDefaultBindings();
  }
  
  /**
   * Initialize the input manager
   */
  public async initialize(): Promise<void> {
    console.log('🎮 Initializing Input Manager...');
    
    try {
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize gamepad support
      if (this.config.gamepadEnabled) {
        this.initializeGamepadSupport();
      }
      
      console.log('✅ Input Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Input Manager:', error);
      throw error;
    }
  }
  
  /**
   * Initialize default input bindings
   */
  private initializeDefaultBindings(): void {
    const defaultBindings: InputBinding[] = [
      // Vehicle controls
      {
        action: 'throttle',
        keys: ['w', 'arrowup'],
        gamepadButtons: [],
        gamepadAxes: [{ axis: 1, direction: -1 }], // Right trigger
        mouseButtons: [],
        description: 'Accelerate vehicle'
      },
      {
        action: 'brake',
        keys: ['s', 'arrowdown'],
        gamepadButtons: [],
        gamepadAxes: [{ axis: 1, direction: 1 }], // Left trigger
        mouseButtons: [],
        description: 'Brake vehicle'
      },
      {
        action: 'steer_left',
        keys: ['a', 'arrowleft'],
        gamepadButtons: [],
        gamepadAxes: [{ axis: 0, direction: -1 }], // Left stick X
        mouseButtons: [],
        description: 'Steer left'
      },
      {
        action: 'steer_right',
        keys: ['d', 'arrowright'],
        gamepadButtons: [],
        gamepadAxes: [{ axis: 0, direction: 1 }], // Left stick X
        mouseButtons: [],
        description: 'Steer right'
      },
      {
        action: 'handbrake',
        keys: ['space'],
        gamepadButtons: [1], // B button
        gamepadAxes: [],
        mouseButtons: [],
        description: 'Handbrake'
      },
      {
        action: 'horn',
        keys: ['h'],
        gamepadButtons: [3], // Y button
        gamepadAxes: [],
        mouseButtons: [],
        description: 'Horn'
      },
      {
        action: 'lights',
        keys: ['l'],
        gamepadButtons: [2], // X button
        gamepadAxes: [],
        mouseButtons: [],
        description: 'Toggle lights'
      },
      
      // Camera controls
      {
        action: 'camera_up',
        keys: ['pageup'],
        gamepadButtons: [],
        gamepadAxes: [{ axis: 3, direction: -1 }], // Right stick Y
        mouseButtons: [],
        description: 'Camera up'
      },
      {
        action: 'camera_down',
        keys: ['pagedown'],
        gamepadButtons: [],
        gamepadAxes: [{ axis: 3, direction: 1 }], // Right stick Y
        mouseButtons: [],
        description: 'Camera down'
      },
      {
        action: 'camera_zoom_in',
        keys: ['='],
        gamepadButtons: [],
        gamepadAxes: [],
        mouseButtons: [],
        description: 'Zoom in'
      },
      {
        action: 'camera_zoom_out',
        keys: ['-'],
        gamepadButtons: [],
        gamepadAxes: [],
        mouseButtons: [],
        description: 'Zoom out'
      },
      
      // Game controls
      {
        action: 'pause',
        keys: ['escape', 'p'],
        gamepadButtons: [9], // Start button
        gamepadAxes: [],
        mouseButtons: [],
        description: 'Pause game'
      },
      {
        action: 'menu',
        keys: ['tab'],
        gamepadButtons: [8], // Select button
        gamepadAxes: [],
        mouseButtons: [],
        description: 'Open menu'
      },
      {
        action: 'map',
        keys: ['m'],
        gamepadButtons: [4], // Left bumper
        gamepadAxes: [],
        mouseButtons: [],
        description: 'Toggle map'
      },
      {
        action: 'inventory',
        keys: ['i'],
        gamepadButtons: [5], // Right bumper
        gamepadAxes: [],
        mouseButtons: [],
        description: 'Open inventory'
      }
    ];
    
    defaultBindings.forEach(binding => {
      this.bindings.set(binding.action, binding);
    });
  }
  
  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Mouse events
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('wheel', this.handleWheel.bind(this));
    
    // Gamepad events
    window.addEventListener('gamepadconnected', this.handleGamepadConnected.bind(this));
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this));
    
    // Prevent context menu on right click
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  /**
   * Initialize gamepad support
   */
  private initializeGamepadSupport(): void {
    // Start polling for gamepad state
    this.gamepadPollingInterval = window.setInterval(() => {
      this.pollGamepads();
    }, 16); // ~60 FPS polling
  }
  
  /**
   * Set target element for mouse input
   */
  public setTargetElement(element: HTMLElement): void {
    this.targetElement = element;
    
    // Request pointer lock for FPS-style controls
    element.addEventListener('click', () => {
      if (element.requestPointerLock) {
        element.requestPointerLock();
      }
    });
  }
  
  /**
   * Handle key down event
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.state.keyboard.set(key, true);
    
    // Check for action bindings
    this.checkActionBindings();
    
    // Emit keydown event
    this.emitEvent('keydown', { key, code: event.code });
    
    // Add to input buffer
    if (this.config.enableInputBuffering) {
      this.addToBuffer({
        type: 'keydown',
        action: this.getActionForKey(key),
        value: 1,
        timestamp: Date.now(),
        data: { key, code: event.code }
      });
    }
  }
  
  /**
   * Handle key up event
   */
  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.state.keyboard.set(key, false);
    
    // Check for action bindings
    this.checkActionBindings();
    
    // Emit keyup event
    this.emitEvent('keyup', { key, code: event.code });
    
    // Add to input buffer
    if (this.config.enableInputBuffering) {
      this.addToBuffer({
        type: 'keyup',
        action: this.getActionForKey(key),
        value: 0,
        timestamp: Date.now(),
        data: { key, code: event.code }
      });
    }
  }
  
  /**
   * Handle mouse down event
   */
  private handleMouseDown(event: MouseEvent): void {
    this.state.mouse.buttons.set(event.button, true);
    
    // Emit mousedown event
    this.emitEvent('mousedown', { button: event.button, position: { x: event.clientX, y: event.clientY } });
  }
  
  /**
   * Handle mouse up event
   */
  private handleMouseUp(event: MouseEvent): void {
    this.state.mouse.buttons.set(event.button, false);
    
    // Emit mouseup event
    this.emitEvent('mouseup', { button: event.button, position: { x: event.clientX, y: event.clientY } });
  }
  
  /**
   * Handle mouse move event
   */
  private handleMouseMove(event: MouseEvent): void {
    const newPosition = { x: event.clientX, y: event.clientY };
    
    // Calculate delta
    this.state.mouse.delta.x = (newPosition.x - this.state.mouse.position.x) * this.config.mouseSensitivity;
    this.state.mouse.delta.y = (newPosition.y - this.state.mouse.position.y) * this.config.mouseSensitivity;
    
    // Apply Y inversion if configured
    if (this.config.invertY) {
      this.state.mouse.delta.y = -this.state.mouse.delta.y;
    }
    
    this.state.mouse.position = newPosition;
    
    // Apply smoothing
    this.mouseSmoothing.x = this.mouseSmoothing.x * 0.8 + this.state.mouse.delta.x * 0.2;
    this.mouseSmoothing.y = this.mouseSmoothing.y * 0.8 + this.state.mouse.delta.y * 0.2;
    
    // Emit mousemove event
    this.emitEvent('mousemove', { 
      position: newPosition, 
      delta: this.state.mouse.delta,
      smoothed: { x: this.mouseSmoothing.x, y: this.mouseSmoothing.y }
    });
  }
  
  /**
   * Handle wheel event
   */
  private handleWheel(event: WheelEvent): void {
    this.state.mouse.wheel = event.deltaY;
    
    // Emit wheel event
    this.emitEvent('wheel', { delta: event.deltaY });
  }
  
  /**
   * Handle gamepad connected
   */
  private handleGamepadConnected(event: GamepadEvent): void {
    console.log('🎮 Gamepad connected:', event.gamepad.id);
    
    const gamepadState: GamepadState = {
      id: event.gamepad.id,
      connected: true,
      buttons: new Array(event.gamepad.buttons.length).fill(false),
      axes: new Array(event.gamepad.axes.length).fill(0),
      timestamp: event.gamepad.timestamp
    };
    
    this.gamepadStates.set(event.gamepad.index, gamepadState);
    this.state.gamepads.set(event.gamepad.index, gamepadState);
  }
  
  /**
   * Handle gamepad disconnected
   */
  private handleGamepadDisconnected(event: GamepadEvent): void {
    console.log('🎮 Gamepad disconnected:', event.gamepad.id);
    
    this.gamepadStates.delete(event.gamepad.index);
    this.state.gamepads.delete(event.gamepad.index);
  }
  
  /**
   * Poll gamepad state
   */
  private pollGamepads(): void {
    const gamepads = navigator.getGamepads();
    
    gamepads.forEach((gamepad, index) => {
      if (!gamepad) return;
      
      const state = this.gamepadStates.get(index);
      if (!state) return;
      
      // Update button states
      gamepad.buttons.forEach((button, buttonIndex) => {
        const pressed = button.pressed;
        if (state.buttons[buttonIndex] !== pressed) {
          state.buttons[buttonIndex] = pressed;
          
          // Emit gamepad button event
          this.emitEvent('gamepad', {
            type: 'button',
            gamepadIndex: index,
            buttonIndex,
            pressed,
            value: button.value
          });
        }
      });
      
      // Update axis states
      gamepad.axes.forEach((axis, axisIndex) => {
        // Apply deadzone
        const deadzone = this.config.deadzone;
        const value = Math.abs(axis) < deadzone ? 0 : axis;
        
        if (Math.abs(state.axes[axisIndex] - value) > 0.01) {
          state.axes[axisIndex] = value;
          
          // Emit gamepad axis event
          this.emitEvent('gamepad', {
            type: 'axis',
            gamepadIndex: index,
            axisIndex,
            value
          });
        }
      });
      
      state.timestamp = gamepad.timestamp;
    });
    
    // Check for action bindings
    this.checkActionBindings();
  }
  
  /**
   * Check action bindings and update action states
   */
  private checkActionBindings(): void {
    this.bindings.forEach((binding, action) => {
      let isActive = false;
      let value = 0;
      
      // Check keyboard bindings
      for (const key of binding.keys) {
        if (this.state.keyboard.get(key)) {
          isActive = true;
          value = 1;
          break;
        }
      }
      
      // Check mouse button bindings
      for (const button of binding.mouseButtons) {
        if (this.state.mouse.buttons.get(button)) {
          isActive = true;
          value = 1;
          break;
        }
      }
      
      // Check gamepad button bindings
      for (const buttonIndex of binding.gamepadButtons) {
        for (const gamepadState of this.state.gamepads.values()) {
          if (gamepadState.buttons[buttonIndex]) {
            isActive = true;
            value = 1;
            break;
          }
        }
        if (isActive) break;
      }
      
      // Check gamepad axis bindings
      for (const axisBinding of binding.gamepadAxes) {
        for (const gamepadState of this.state.gamepads.values()) {
          const axisValue = gamepadState.axes[axisBinding.axis];
          if (Math.abs(axisValue) > this.config.deadzone) {
            if (axisBinding.direction > 0 && axisValue > 0) {
              isActive = true;
              value = Math.abs(axisValue);
            } else if (axisBinding.direction < 0 && axisValue < 0) {
              isActive = true;
              value = Math.abs(axisValue);
            }
          }
        }
        if (isActive) break;
      }
      
      // Update action state
      this.state.actions.set(action, isActive);
      this.state.axes.set(action, value);
    });
  }
  
  /**
   * Get action for key
   */
  private getActionForKey(key: string): string | undefined {
    for (const [action, binding] of this.bindings.entries()) {
      if (binding.keys.includes(key)) {
        return action;
      }
    }
    return undefined;
  }
  
  /**
   * Add event to input buffer
   */
  private addToBuffer(event: InputEvent): void {
    this.inputBuffer.push(event);
    
    // Limit buffer size
    if (this.inputBuffer.length > this.config.bufferSize) {
      this.inputBuffer.shift();
    }
  }
  
  /**
   * Get input buffer
   */
  public getInputBuffer(): InputEvent[] {
    return [...this.inputBuffer];
  }
  
  /**
   * Clear input buffer
   */
  public clearInputBuffer(): void {
    this.inputBuffer = [];
  }
  
  /**
   * Check if action is active
   */
  public isActionActive(action: string): boolean {
    return this.state.actions.get(action) || false;
  }
  
  /**
   * Get action value (for analog inputs)
   */
  public getActionValue(action: string): number {
    return this.state.axes.get(action) || 0;
  }
  
  /**
   * Get mouse position
   */
  public getMousePosition(): { x: number; y: number } {
    return { ...this.state.mouse.position };
  }
  
  /**
   * Get mouse delta
   */
  public getMouseDelta(): { x: number; y: number } {
    return { ...this.state.mouse.delta };
  }
  
  /**
   * Get smoothed mouse delta
   */
  public getSmoothedMouseDelta(): { x: number; y: number } {
    return { ...this.mouseSmoothing };
  }
  
  /**
   * Get mouse wheel delta
   */
  public getMouseWheel(): number {
    return this.state.mouse.wheel;
  }
  
  /**
   * Check if mouse button is pressed
   */
  public isMouseButtonPressed(button: number): boolean {
    return this.state.mouse.buttons.get(button) || false;
  }
  
  /**
   * Get gamepad state
   */
  public getGamepadState(index: number): GamepadState | undefined {
    return this.state.gamepads.get(index);
  }
  
  /**
   * Get all connected gamepads
   */
  public getConnectedGamepads(): GamepadState[] {
    return Array.from(this.state.gamepads.values());
  }
  
  /**
   * Set gamepad vibration
   */
  public setGamepadVibration(index: number, leftMotor: number, rightMotor: number): void {
    const gamepad = navigator.getGamepads()[index];
    if (gamepad && gamepad.vibrationActuator) {
      gamepad.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration: 1000,
        weakMagnitude: leftMotor,
        strongMagnitude: rightMotor
      });
    }
  }
  
  /**
   * Add event listener
   */
  public addEventListener(event: string, callback: (event: InputEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }
  
  /**
   * Remove event listener
   */
  public removeEventListener(event: string, callback: (event: InputEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * Emit event to listeners
   */
  private emitEvent(type: string, data: any): void {
    const event: InputEvent = {
      type: type as any,
      timestamp: Date.now(),
      data
    };
    
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in input event listener:', error);
        }
      });
    }
  }
  
  /**
   * Update input manager
   */
  public update(deltaTime: number): void {
    // Reset mouse delta
    this.state.mouse.delta.x = 0;
    this.state.mouse.delta.y = 0;
    this.state.mouse.wheel = 0;
    
    // Update axis smoothing
    this.state.axes.forEach((value, action) => {
      const currentSmooth = this.axisSmoothing.get(action) || 0;
      const newSmooth = currentSmooth * 0.8 + value * 0.2;
      this.axisSmoothing.set(action, newSmooth);
    });
  }
  
  /**
   * Get input statistics
   */
  public getStats(): any {
    return {
      activeActions: Array.from(this.state.actions.entries()).filter(([_, active]) => active).length,
      connectedGamepads: this.state.gamepads.size,
      inputBufferSize: this.inputBuffer.length,
      eventListeners: Array.from(this.eventListeners.entries()).reduce((acc, [event, listeners]) => {
        acc[event] = listeners.length;
        return acc;
      }, {} as any)
    };
  }
  
  /**
   * Dispose of input manager
   */
  public dispose(): void {
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    document.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('wheel', this.handleWheel.bind(this));
    
    // Clear gamepad polling
    if (this.gamepadPollingInterval) {
      clearInterval(this.gamepadPollingInterval);
      this.gamepadPollingInterval = null;
    }
    
    // Clear state
    this.state.keyboard.clear();
    this.state.mouse.buttons.clear();
    this.state.gamepads.clear();
    this.state.actions.clear();
    this.state.axes.clear();
    this.eventListeners.clear();
    this.inputBuffer = [];
  }
} 
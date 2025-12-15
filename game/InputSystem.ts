import { InputState, Vector2 } from '../types';

export class InputSystem {
  public state: InputState = {
    keys: new Set(),
    moveVector: { x: 0, y: 0 },
    isAttacking: false,
    isDashing: false,
    isSummoning: false,
    mousePos: { x: 0, y: 0 }
  };

  private joystickOrigin: Vector2 | null = null;
  private joystickCurrent: Vector2 | null = null;
  private readonly joystickThreshold = 10;
  private readonly joystickMaxRadius = 50;

  constructor() {
    this.setupKeyboardListeners();
    this.setupMouseListeners();
    // Touch listeners are handled via React components or direct attach for joystick
  }

  private setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      this.state.keys.add(e.code);
      this.updateMoveVectorFromKeys();
      if (e.code === 'Space') this.state.isDashing = true;
      if (e.code === 'KeyE') this.state.isSummoning = true;
    });

    window.addEventListener('keyup', (e) => {
      this.state.keys.delete(e.code);
      this.updateMoveVectorFromKeys();
      if (e.code === 'Space') this.state.isDashing = false;
      if (e.code === 'KeyE') this.state.isSummoning = false;
    });
  }

  private setupMouseListeners() {
    window.addEventListener('mousemove', (e) => {
      this.state.mousePos = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mousedown', () => {
      this.state.isAttacking = true;
    });
    window.addEventListener('mouseup', () => {
      this.state.isAttacking = false;
    });
  }

  private updateMoveVectorFromKeys() {
    // If joystick is active, ignore keys for movement vector (or blend, but priority to joystick)
    if (this.joystickOrigin) return;

    let x = 0;
    let y = 0;
    if (this.state.keys.has('KeyW') || this.state.keys.has('ArrowUp')) y -= 1;
    if (this.state.keys.has('KeyS') || this.state.keys.has('ArrowDown')) y += 1;
    if (this.state.keys.has('KeyA') || this.state.keys.has('ArrowLeft')) x -= 1;
    if (this.state.keys.has('KeyD') || this.state.keys.has('ArrowRight')) x += 1;

    // Normalize
    const mag = Math.sqrt(x * x + y * y);
    if (mag > 0) {
      x /= mag;
      y /= mag;
    }
    this.state.moveVector = { x, y };
  }

  // Called by React Touch Components
  public handleJoystickStart(x: number, y: number) {
    this.joystickOrigin = { x, y };
    this.joystickCurrent = { x, y };
    this.updateJoystickVector();
  }

  public handleJoystickMove(x: number, y: number) {
    if (!this.joystickOrigin) return;
    this.joystickCurrent = { x, y };
    this.updateJoystickVector();
  }

  public handleJoystickEnd() {
    this.joystickOrigin = null;
    this.joystickCurrent = null;
    this.state.moveVector = { x: 0, y: 0 };
    // Re-check keys in case they are holding WASD
    this.updateMoveVectorFromKeys();
  }

  private updateJoystickVector() {
    if (!this.joystickOrigin || !this.joystickCurrent) return;
    
    let dx = this.joystickCurrent.x - this.joystickOrigin.x;
    let dy = this.joystickCurrent.y - this.joystickOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Clamp distance
    if (dist > this.joystickMaxRadius) {
      const ratio = this.joystickMaxRadius / dist;
      dx *= ratio;
      dy *= ratio;
    }

    // Normalize output vector (0 to 1 magnitude)
    const normalizedX = dx / this.joystickMaxRadius;
    const normalizedY = dy / this.joystickMaxRadius;
    
    // Deadzone
    if (dist < this.joystickThreshold) {
      this.state.moveVector = { x: 0, y: 0 };
    } else {
      this.state.moveVector = { x: normalizedX, y: normalizedY };
    }
  }

  public setButtonState(btn: 'attack' | 'dash' | 'summon', active: boolean) {
    if (btn === 'attack') this.state.isAttacking = active;
    if (btn === 'dash') this.state.isDashing = active;
    if (btn === 'summon') this.state.isSummoning = active;
  }
}
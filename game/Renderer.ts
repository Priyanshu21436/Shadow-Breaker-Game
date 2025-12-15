import { Entity, Player, Enemy, ShadowUnit, Particle, Projectile, Ghost, FloatingText } from './Entities';
import { AssetManager } from './AssetManager';
import { EntityType } from '../types';

export class Renderer {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  camera: { x: number, y: number } = { x: 0, y: 0 };
  assets: AssetManager;
  shakeStrength: number = 0;
  
  // Optimization: Cache the background and vignette to avoid expensive gradient generation every frame
  private bgPattern: CanvasPattern | null = null;
  private vignetteCanvas: HTMLCanvasElement | null = null;
  private stars: {x: number, y: number, z: number}[] = [];

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, assets: AssetManager) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.assets = assets;
    this.ctx.imageSmoothingEnabled = false; 
    
    // Fewer stars for performance
    for(let i=0; i<60; i++) {
        this.stars.push({
            x: Math.random() * 2000 - 1000,
            y: Math.random() * 2000 - 1000,
            z: Math.random() * 2 + 1 
        });
    }
    
    this.createVignette();
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.bgPattern = null; 
    this.ctx.imageSmoothingEnabled = false;
    this.createVignette();
  }

  createVignette() {
      // Optimization: Render vignette to an offscreen canvas once
      this.vignetteCanvas = document.createElement('canvas');
      this.vignetteCanvas.width = this.width;
      this.vignetteCanvas.height = this.height;
      const vCtx = this.vignetteCanvas.getContext('2d');
      if (vCtx) {
          const gradient = vCtx.createRadialGradient(this.width/2, this.height/2, this.height/2, this.width/2, this.height/2, this.height);
          gradient.addColorStop(0, 'rgba(0,0,0,0)');
          gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
          vCtx.fillStyle = gradient;
          vCtx.fillRect(0,0,this.width, this.height);
      }
  }

  updateCamera(target: Entity, dt: number) {
    const targetX = target.x - this.width / 2;
    const targetY = target.y - this.height / 2;
    this.camera.x += (targetX - this.camera.x) * 5 * dt;
    this.camera.y += (targetY - this.camera.y) * 5 * dt;
    
    if (this.shakeStrength > 0) {
        this.shakeStrength = Math.max(0, this.shakeStrength - dt * 30);
    }
  }

  addShake(amount: number) {
      this.shakeStrength = amount;
  }

  clear() {
    this.ctx.fillStyle = '#050505';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawBackground() {
      if (!this.bgPattern && this.assets.images['floor']) {
          this.bgPattern = this.ctx.createPattern(this.assets.images['floor'], 'repeat');
      }

      const shakeX = (Math.random() - 0.5) * this.shakeStrength;
      const shakeY = (Math.random() - 0.5) * this.shakeStrength;
      
      // Optimization: Math.floor coords to prevent sub-pixel rendering overhead
      const camX = Math.floor(this.camera.x);
      const camY = Math.floor(this.camera.y);

      this.ctx.save();
      this.ctx.fillStyle = '#445';
      
      // Draw stars (simplified)
      for(let i=0; i<this.stars.length; i++) {
          const star = this.stars[i];
          const px = (star.x - camX / star.z) % 2000;
          const py = (star.y - camY / star.z) % 2000;
          const sx = (px + 2000) % 2000; 
          const sy = (py + 2000) % 2000; 
          
          if (sx > 0 && sx < this.width && sy > 0 && sy < this.height) {
             this.ctx.fillRect(Math.floor(sx), Math.floor(sy), 2, 2);
          }
      }
      this.ctx.restore();

      if (this.bgPattern) {
          this.ctx.save();
          this.ctx.translate(-camX + shakeX, -camY + shakeY);
          this.ctx.fillStyle = this.bgPattern;
          // Only draw what's necessary + small buffer
          this.ctx.fillRect(camX, camY, this.width, this.height);
          this.ctx.restore();
      }
  }

  drawEntity(e: Entity) {
    let screenX = e.x - this.camera.x;
    let screenY = e.y - this.camera.y;

    if (this.shakeStrength > 0) {
        screenX += (Math.random() - 0.5) * this.shakeStrength;
        screenY += (Math.random() - 0.5) * this.shakeStrength;
    }
    
    // Culling
    if (screenX < -100 || screenX > this.width + 100 || screenY < -100 || screenY > this.height + 100) return;

    // Optimization: Integer snapping
    screenX = Math.floor(screenX);
    screenY = Math.floor(screenY);

    this.ctx.save();
    this.ctx.translate(screenX, screenY);

    if (e instanceof FloatingText) {
        this.ctx.globalAlpha = Math.max(0, e.life);
        this.ctx.fillStyle = e.color;
        this.ctx.font = 'bold 20px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(e.text, 0, 0);
    } else if (e instanceof Particle) {
       // Optimization: Avoid createRadialGradient for every particle
       // Use pre-rendered sprite or simple circle
       this.ctx.globalCompositeOperation = 'lighter'; 
       this.ctx.globalAlpha = e.life;
       
       if (this.assets.images['glow_particle']) {
           const s = Math.floor(e.radius * 4); 
           this.ctx.drawImage(this.assets.images['glow_particle'], -s/2, -s/2, s, s);
       } else {
           this.ctx.fillStyle = e.color;
           this.ctx.fillRect(-2, -2, 4, 4); // Square particles are faster than arc
       }
    } else if (e instanceof Projectile) {
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.fillStyle = e.color;
        this.ctx.beginPath();
        this.ctx.arc(0,0, e.radius, 0, Math.PI * 2);
        this.ctx.fill();

    } else if (e instanceof Ghost) {
        this.ctx.globalAlpha = e.life * 0.4;
        this.ctx.rotate(e.facing);
        if (this.assets.images['hero']) {
             this.ctx.drawImage(this.assets.images['hero'], -64, -64, 128, 128);
        }
    } else if (e.type === EntityType.SHADOW_UNIT) {
        // PERFORMANCE FIX: Removed shadowBlur. It kills mobile FPS.
        // Use 'lighter' composite for neon glow instead.
        this.ctx.globalCompositeOperation = 'lighter'; 
        this.ctx.globalAlpha = 0.8;
        
        const img = this.assets.images[e.spriteKey];
        if (img) {
            this.ctx.rotate(e.rotation);
            // Draw a tinted backing or just the image with screen blend
            this.ctx.drawImage(img, -64, -64, 128, 128);
            
            // Eyes
            this.ctx.fillStyle = '#00ffff';
            this.ctx.fillRect(10, -5, 5, 5);
            this.ctx.fillRect(10, 5, 5, 5);
        }

    } else {
        // Standard Sprite Drawing
        const img = this.assets.images[e.spriteKey];
        if (img) {
            this.ctx.rotate(e.rotation);
            this.ctx.drawImage(img, -64, -64, 128, 128);
        } else {
            this.ctx.fillStyle = e.color;
            this.ctx.beginPath();
            this.ctx.arc(0,0, e.radius, 0, Math.PI*2);
            this.ctx.fill();
        }
        
        // HP Bars (Simplified)
        if (e.type === EntityType.ENEMY) { 
            this.ctx.rotate(-e.rotation); 
            const en = e as Enemy;
            const hpPct = en.hp / en.maxHp;
            
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(-20, -50, 40, 6);
            
            this.ctx.fillStyle = hpPct > 0.5 ? '#00ff00' : '#ff0000';
            this.ctx.fillRect(-19, -49, 38 * hpPct, 4);
        }
    }

    this.ctx.restore();
  }

  drawAttackEffect(player: Player) {
    if (player.attackTimer > 0) {
      const screenX = Math.floor(player.x - this.camera.x);
      const screenY = Math.floor(player.y - this.camera.y);
      
      this.ctx.save();
      this.ctx.translate(screenX, screenY);
      this.ctx.rotate(player.facing);
      this.ctx.globalCompositeOperation = 'lighter'; 

      const maxReach = 100 + (player.comboIndex * 20);
      const alpha = player.attackTimer * 3; 
      
      // Optimization: Simple arc stroke instead of Gradient Fill
      this.ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
      this.ctx.lineWidth = 40;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, maxReach * 0.8, -Math.PI / 3, Math.PI / 3);
      this.ctx.stroke();
      
      this.ctx.restore();
    }
  }

  drawVignette() {
      // Optimization: Draw pre-rendered vignette
      if (this.vignetteCanvas) {
          this.ctx.drawImage(this.vignetteCanvas, 0, 0);
      }
  }
}
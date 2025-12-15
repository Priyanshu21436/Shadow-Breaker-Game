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
  
  private bgPattern: CanvasPattern | null = null;
  private stars: {x: number, y: number, z: number}[] = [];

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, assets: AssetManager) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.assets = assets;
    this.ctx.imageSmoothingEnabled = false; 
    
    for(let i=0; i<100; i++) {
        this.stars.push({
            x: Math.random() * 2000 - 1000,
            y: Math.random() * 2000 - 1000,
            z: Math.random() * 2 + 1 
        });
    }
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.bgPattern = null; 
    this.ctx.imageSmoothingEnabled = false;
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

      this.ctx.save();
      this.ctx.fillStyle = '#445';
      this.stars.forEach(star => {
          const px = (star.x - this.camera.x / star.z) % 2000;
          const py = (star.y - this.camera.y / star.z) % 2000;
          const sx = (px + 2000) % 2000; 
          const sy = (py + 2000) % 2000; 
          
          if (sx > 0 && sx < this.width && sy > 0 && sy < this.height) {
             this.ctx.fillRect(sx, sy, 2, 2);
          }
      });
      this.ctx.restore();

      if (this.bgPattern) {
          this.ctx.save();
          this.ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);
          this.ctx.fillStyle = this.bgPattern;
          this.ctx.fillRect(this.camera.x, this.camera.y, this.width, this.height);
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

    if (screenX < -150 || screenX > this.width + 150 || screenY < -150 || screenY > this.height + 150) return;

    this.ctx.save();
    this.ctx.translate(screenX, screenY);

    if (e instanceof FloatingText) {
        this.ctx.globalAlpha = Math.max(0, e.life);
        this.ctx.fillStyle = e.color;
        this.ctx.font = 'bold 20px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(e.text, 0, 0);
    } else if (e instanceof Particle) {
       this.ctx.globalCompositeOperation = 'lighter'; 
       this.ctx.globalAlpha = e.life;
       
       if (this.assets.images['glow_particle']) {
           const s = e.radius * 4; 
           this.ctx.drawImage(this.assets.images['glow_particle'], -s/2, -s/2, s, s);
       } else {
           this.ctx.fillStyle = e.color;
           this.ctx.beginPath();
           this.ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
           this.ctx.fill();
       }
    } else if (e instanceof Projectile) {
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.fillStyle = e.color;
        this.ctx.beginPath();
        this.ctx.arc(0,0, e.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = e.color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0,0);
        this.ctx.lineTo(-e.velocity.x * 0.05, -e.velocity.y * 0.05);
        this.ctx.stroke();

    } else if (e instanceof Ghost) {
        this.ctx.globalAlpha = e.life * 0.4;
        this.ctx.rotate(e.facing);
        if (this.assets.images['hero']) {
             this.ctx.drawImage(this.assets.images['hero'], -64, -64, 128, 128);
        }
    } else if (e.type === EntityType.SHADOW_UNIT) {
        // Shadow Unit Rendering
        this.ctx.globalAlpha = 0.8;
        this.ctx.globalCompositeOperation = 'lighter'; // Ghostly look
        // Tint blue/cyan
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00ffff';
        
        const img = this.assets.images[e.spriteKey];
        if (img) {
            this.ctx.rotate(e.rotation);
            this.ctx.drawImage(img, -64, -64, 128, 128);
            
            // Glowing Eyes overlay (Simple rects for now)
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
        
        // HP Bars
        if (e.type === EntityType.ENEMY) { 
            this.ctx.rotate(-e.rotation); 
            const en = e as Enemy;
            const hpPct = en.hp / en.maxHp;
            
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(-20, -50, 40, 6);
            
            this.ctx.fillStyle = hpPct > 0.5 ? '#00ff00' : '#ff0000';
            this.ctx.fillRect(-19, -49, 38 * hpPct, 4);
            
            // Name tag
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '10px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("VOID-BEAST", 0, -60);
        }
    }

    this.ctx.restore();
  }

  drawAttackEffect(player: Player) {
    if (player.attackTimer > 0) {
      const screenX = player.x - this.camera.x;
      const screenY = player.y - this.camera.y;
      
      this.ctx.save();
      this.ctx.translate(screenX, screenY);
      this.ctx.rotate(player.facing);
      this.ctx.globalCompositeOperation = 'lighter'; 

      const maxReach = 100 + (player.comboIndex * 20);
      const alpha = player.attackTimer * 3; 

      const gradient = this.ctx.createRadialGradient(0, 0, 20, 0, 0, maxReach);
      gradient.addColorStop(0, `rgba(0, 255, 255, 0)`);
      gradient.addColorStop(0.5, `rgba(0, 255, 255, ${alpha * 0.8})`);
      gradient.addColorStop(1, `rgba(0, 255, 255, 0)`);
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.arc(0, 0, maxReach, -Math.PI / 3, Math.PI / 3);
      this.ctx.closePath();
      this.ctx.fill();
      
      this.ctx.restore();
    }
  }

  drawVignette() {
      const gradient = this.ctx.createRadialGradient(this.width/2, this.height/2, this.height/2, this.width/2, this.height/2, this.height);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0,0,this.width, this.height);
  }
}
export class AssetManager {
    images: Record<string, HTMLImageElement> = {};
    sounds: Record<string, AudioBuffer> = {};
    patterns: Record<string, CanvasPattern> = {}; // New: Store patterns
    audioCtx: AudioContext | null = null;
    
    constructor() {
      // Defer AudioContext creation
    }
  
    private getAudioContext(): AudioContext | null {
        if (!this.audioCtx) {
            try {
                this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.warn("AudioContext creation failed:", e);
                return null;
            }
        }
        return this.audioCtx;
    }
  
    async loadAll(): Promise<void> {
      // 1. Generate High-Fidelity Sprites
      this.images['hero'] = this.createPlayerSprite();
      this.images['enemy_crawler'] = this.createCrawlerSprite();
      this.images['enemy_ranged'] = this.createRangedSprite();
      this.images['enemy_bat'] = this.createBatSprite();
      this.images['constellation'] = this.createConstellationSprite();
      
      // Optimization: Create 'Glow' particle sprite to avoid real-time shadowBlur
      this.images['glow_particle'] = this.createGlowParticle();

      // 2. Generate Patterns (Optimization: Render once, draw cheaply)
      const floorImg = this.createHexFloorTile();
      // We need to wait for the image to 'load' effectively or just use the canvas source
      this.images['floor'] = floorImg; 
  
      // 2. Generate/Load Audio
      const ctx = this.getAudioContext();
      if (ctx) {
          try {
            this.sounds['dash'] = await this.createSynthSound(ctx, 'noise', 0.2);
            this.sounds['attack'] = await this.createSynthSound(ctx, 'square', 0.1);
            this.sounds['hit'] = await this.createImpactSound(ctx); 
            this.sounds['bgm'] = await this.createDroneBGM(ctx);
            this.sounds['summon'] = await this.createSummonSound(ctx); // New Sound
          } catch (e) {
              console.warn("Audio generation failed:", e);
          }
      }
    }
  
    playSound(name: string, volume: number = 0.5) {
      const ctx = this.getAudioContext();
      if (!ctx || !this.sounds[name]) return;
      
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      const source = ctx.createBufferSource();
      source.buffer = this.sounds[name];
      if (name === 'hit') {
          source.playbackRate.value = 0.9 + Math.random() * 0.2;
      }
      const gain = ctx.createGain();
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
    }
  
    playBGM() {
        const ctx = this.getAudioContext();
        if (!ctx || !this.sounds['bgm']) return;

        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        const source = ctx.createBufferSource();
        source.buffer = this.sounds['bgm'];
        source.loop = true;
        const gain = ctx.createGain();
        gain.gain.value = 0.15;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
    }

    // --- SPRITE GENERATION ---

    private createGlowParticle(): HTMLImageElement {
        const c = document.createElement('canvas');
        c.width = 32; c.height = 32;
        const ctx = c.getContext('2d')!;
        
        // Pre-render a soft radial gradient
        const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        g.addColorStop(0, 'rgba(255, 255, 255, 1)');
        g.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
        g.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = g;
        ctx.fillRect(0,0,32,32);
        
        const img = new Image();
        img.src = c.toDataURL();
        return img;
    }

    private createPlayerSprite(): HTMLImageElement {
        const c = document.createElement('canvas');
        c.width = 128; c.height = 128;
        const ctx = c.getContext('2d')!;
        ctx.translate(64, 64);

        // Remove heavy shadowBlur here, handled by engine bloom
        
        // Body (Hooded Figure)
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // Shoulders
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.ellipse(0, 5, 25, 15, 0, 0, Math.PI*2);
        ctx.fill();

        // Scarf/Cape
        ctx.fillStyle = '#00cccc';
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.quadraticCurveTo(0, 20, 15, 0);
        ctx.lineTo(20, 25);
        ctx.lineTo(-20, 25);
        ctx.fill();

        // Weapon (Energy Blade)
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#e0ffff';
        ctx.beginPath();
        ctx.rect(15, -4, 40, 8); // Blade
        ctx.fill();
        ctx.fillStyle = '#fff'; // Core
        ctx.fillRect(15, -2, 38, 4);

        // Eyes
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.rect(5, -5, 8, 3);
        ctx.fill();

        const img = new Image();
        img.src = c.toDataURL();
        return img;
    }

    private createCrawlerSprite(): HTMLImageElement {
        const c = document.createElement('canvas');
        c.width = 128; c.height = 128;
        const ctx = c.getContext('2d')!;
        ctx.translate(64, 64);

        // Legs
        ctx.strokeStyle = '#4a0080';
        ctx.lineWidth = 4;
        for(let i=0; i<3; i++) {
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(35, -20 + i*20);
            ctx.lineTo(45, -10 + i*20);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(35, -20 + i*20); 
            ctx.stroke();
        }
        // Mirror legs
        ctx.save();
        ctx.scale(1, -1);
        for(let i=0; i<3; i++) {
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(35, -20 + i*20);
            ctx.lineTo(45, -10 + i*20);
            ctx.stroke();
        }
        ctx.restore();

        // Body Carapace
        ctx.fillStyle = '#1a0526';
        ctx.beginPath();
        ctx.ellipse(0, 0, 25, 18, 0, 0, Math.PI*2);
        ctx.fill();

        // Mandibles
        ctx.fillStyle = '#b026ff';
        ctx.beginPath();
        ctx.moveTo(20, -5);
        ctx.lineTo(40, -10);
        ctx.lineTo(20, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(20, 5);
        ctx.lineTo(40, 10);
        ctx.lineTo(20, -5);
        ctx.fill();

        // Glowing Back Pattern
        ctx.fillStyle = '#dcb3ff';
        ctx.beginPath();
        ctx.arc(-5, 0, 6, 0, Math.PI*2);
        ctx.fill();

        const img = new Image();
        img.src = c.toDataURL();
        return img;
    }

    private createRangedSprite(): HTMLImageElement {
        const c = document.createElement('canvas');
        c.width = 128; c.height = 128;
        const ctx = c.getContext('2d')!;
        ctx.translate(64, 64);

        // Floating Crystal Monolith
        ctx.fillStyle = '#004d40';
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(15, 0);
        ctx.lineTo(0, 30);
        ctx.lineTo(-15, 0);
        ctx.fill();

        // Inner Core
        ctx.fillStyle = '#00ffcc';
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, 15);
        ctx.lineTo(-8, 0);
        ctx.fill();

        // Orbiting Bits
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI*2);
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(40, 0, 4, 0, Math.PI*2);
        ctx.arc(-40, 0, 4, 0, Math.PI*2);
        ctx.fill();

        const img = new Image();
        img.src = c.toDataURL();
        return img;
    }

    private createBatSprite(): HTMLImageElement {
        const c = document.createElement('canvas');
        c.width = 128; c.height = 128;
        const ctx = c.getContext('2d')!;
        ctx.translate(64, 64);

        // Wings
        ctx.fillStyle = '#330a00';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(30, -40, 60, -20);
        ctx.quadraticCurveTo(40, 0, 30, 20);
        ctx.lineTo(0, 10);
        ctx.fill();
        
        ctx.save();
        ctx.scale(1, -1);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(30, -40, 60, -20);
        ctx.quadraticCurveTo(40, 0, 30, 20);
        ctx.lineTo(0, 10);
        ctx.fill();
        ctx.restore();

        // Body
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI*2);
        ctx.fill();

        const img = new Image();
        img.src = c.toDataURL();
        return img;
    }

    private createConstellationSprite(): HTMLImageElement {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        const ctx = c.getContext('2d')!;
        ctx.translate(32, 32);

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(15, 10);
        ctx.lineTo(-15, 10);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI*2);
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, -20, 3, 0, Math.PI*2);
        ctx.arc(15, 10, 3, 0, Math.PI*2);
        ctx.arc(-15, 10, 3, 0, Math.PI*2);
        ctx.fill();

        const img = new Image();
        img.src = c.toDataURL();
        return img;
    }
  
    private createHexFloorTile(): HTMLImageElement {
        // Optimization: Create a larger chunk to tile, reduces repeating pattern calls
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 104;
        const ctx = canvas.getContext('2d')!;
        
        ctx.fillStyle = '#080808';
        ctx.fillRect(0,0,120,104);
        
        ctx.strokeStyle = '#1a1a2e'; 
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(90, 0);
        ctx.lineTo(120, 52);
        ctx.lineTo(90, 104);
        ctx.lineTo(30, 104);
        ctx.lineTo(0, 52);
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = '#0b0b0f';
        ctx.fill();
        
        // Tech dot
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(60, 52, 4, 0, Math.PI*2);
        ctx.fill();
        
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }
  
    // ... Audio utils same as before ...
    private async createImpactSound(ctx: AudioContext): Promise<AudioBuffer> {
        const sr = ctx.sampleRate;
        const duration = 0.15;
        const buffer = ctx.createBuffer(1, sr * duration, sr);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / sr;
            const freq = 500 * Math.exp(-15 * t); 
            const sine = Math.sin(t * freq * Math.PI * 2);
            const noise = Math.random() * 2 - 1;
            const envelope = Math.pow(1 - t/duration, 3);
            data[i] = (sine * 0.4 + noise * 0.6) * envelope;
        }
        return buffer;
    }

    private async createSynthSound(ctx: AudioContext, type: OscillatorType | 'noise', duration: number, freq: number = 440): Promise<AudioBuffer> {
      const sr = ctx.sampleRate;
      const buffer = ctx.createBuffer(1, sr * duration, sr);
      const data = buffer.getChannelData(0);
      if (type === 'noise') {
          for (let i = 0; i < data.length; i++) {
              data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
          }
      } else {
          for (let i = 0; i < data.length; i++) {
              const t = i / sr;
              const v = type === 'square' ? (Math.sin(t * freq * Math.PI * 2) > 0 ? 1 : -1) : Math.sin(t * freq * Math.PI * 2);
              data[i] = v * (1 - t/duration);
          }
      }
      return buffer;
    }

    private async createDroneBGM(ctx: AudioContext): Promise<AudioBuffer> {
        const sr = ctx.sampleRate;
        const duration = 8.0;
        const buffer = ctx.createBuffer(2, sr * duration, sr);
        for (let c = 0; c < 2; c++) {
            const data = buffer.getChannelData(c);
            for (let i = 0; i < data.length; i++) {
                const t = i / sr;
                const v1 = Math.sin(t * 110 * Math.PI * 2);
                const v2 = Math.sin(t * 112 * Math.PI * 2);
                const v3 = Math.sin(t * 55 * Math.PI * 2) * 0.5;
                data[i] = (v1 + v2 + v3) * 0.1;
            }
        }
        return buffer;
    }

    private async createSummonSound(ctx: AudioContext): Promise<AudioBuffer> {
        const sr = ctx.sampleRate;
        const duration = 1.0;
        const buffer = ctx.createBuffer(1, sr * duration, sr);
        const data = buffer.getChannelData(0);
        for(let i=0; i < data.length; i++) {
            const t = i / sr;
            // Low frequency swell
            const freq = 100 + Math.sin(t * 10) * 50;
            const v = Math.sin(t * freq * Math.PI * 2);
            data[i] = v * (1 - t/duration) * 0.5;
        }
        return buffer;
    }
}
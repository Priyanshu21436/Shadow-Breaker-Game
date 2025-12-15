import { InputSystem } from './InputSystem';
import { Renderer } from './Renderer';
import { AssetManager } from './AssetManager';
import { Player, Enemy, RangedSpitter, FlyingBat, Particle, Projectile, Ghost, FloatingText, Entity, Corpse, ShadowUnit } from './Entities';
import { Stats, GameStateUI, EntityType, GamePhase, Difficulty, Mission } from '../types';

class ObjectPool<T extends { active: boolean, isDead: boolean }> {
    pool: T[] = [];
    factory: () => T;

    constructor(factory: () => T, initialSize: number) {
        this.factory = factory;
        for (let i = 0; i < initialSize; i++) {
            const obj = factory();
            obj.active = false;
            obj.isDead = true;
            this.pool.push(obj);
        }
    }

    get(): T {
        const obj = this.pool.find(o => !o.active);
        if (obj) {
            obj.active = true;
            obj.isDead = false;
            return obj;
        }
        const newObj = this.factory();
        this.pool.push(newObj);
        return newObj;
    }
}

class SpatialGrid {
    cellSize: number;
    cells: Map<string, Entity[]> = new Map();

    constructor(cellSize: number) {
        this.cellSize = cellSize;
    }

    clear() {
        this.cells.clear();
    }

    add(entity: Entity) {
        const key = this.getKey(entity.x, entity.y);
        if (!this.cells.has(key)) this.cells.set(key, []);
        this.cells.get(key)!.push(entity);
    }

    getNearby(entity: Entity): Entity[] {
        const keys = [
            this.getKey(entity.x, entity.y),
            this.getKey(entity.x + this.cellSize, entity.y),
            this.getKey(entity.x - this.cellSize, entity.y),
            this.getKey(entity.x, entity.y + this.cellSize),
            this.getKey(entity.x, entity.y - this.cellSize),
            this.getKey(entity.x + this.cellSize, entity.y + this.cellSize),
            this.getKey(entity.x - this.cellSize, entity.y - this.cellSize),
            this.getKey(entity.x + this.cellSize, entity.y - this.cellSize),
            this.getKey(entity.x - this.cellSize, entity.y + this.cellSize),
        ];
        
        const result: Entity[] = [];
        for (const key of keys) {
            const cell = this.cells.get(key);
            if (cell) result.push(...cell);
        }
        return result;
    }

    private getKey(x: number, y: number): string {
        const gx = Math.floor(x / this.cellSize);
        const gy = Math.floor(y / this.cellSize);
        return `${gx},${gy}`;
    }
}

export class GameEngine {
  input: InputSystem;
  renderer: Renderer;
  assets: AssetManager;
  player: Player;
  enemies: Enemy[] = [];
  corpses: Corpse[] = [];
  shadows: ShadowUnit[] = [];
  
  // Pools
  particlePool: ObjectPool<Particle>;
  projectilePool: ObjectPool<Projectile>;
  textPool: ObjectPool<FloatingText>;

  grid: SpatialGrid;
  ghosts: Ghost[] = [];
  lastTime: number = 0;
  phase: GamePhase = GamePhase.LOADING;
  difficulty: Difficulty = Difficulty.VETERAN;

  stats: Stats = {
    hp: 100, maxHp: 100,
    stamina: 100, maxStamina: 100,
    xp: 0, maxXp: 100,
    level: 1,
    mana: 50, maxMana: 50,
    // THE HERALD'S ATTRIBUTES
    might: 10,
    fortitude: 10,
    celerity: 10,
    acuity: 10,
    precision: 10,
    shadowCount: 0,
    maxShadows: 5
  };

  playerClass: 'NONE' | 'SHADOW_WEAVER' = 'NONE';
  
  // Progression
  wave: number = 1;
  waveTimer: number = 0;
  currentMission: Mission | null = null;
  missionStage: number = 0; // 0: Tutorial, 1: Survival, 2: Daily, 3: Class, 4: Endgame

  uiCallback: (state: GameStateUI) => void;
  notifications: string[] = [];
  spawnTimer: number = 0;
  ghostTimer: number = 0;
  
  constructor(canvas: HTMLCanvasElement, uiCallback: (state: GameStateUI) => void) {
    this.input = new InputSystem();
    this.assets = new AssetManager();
    const ctx = canvas.getContext('2d', { alpha: false })!; 
    this.renderer = new Renderer(ctx, canvas.width, canvas.height, this.assets);
    this.uiCallback = uiCallback;
    
    this.player = new Player(0, 0);
    
    // Initialize Pools
    this.particlePool = new ObjectPool(() => new Particle(0,0,'#fff'), 200);
    this.projectilePool = new ObjectPool(() => new Projectile(0,0,{x:0,y:0}), 100);
    this.textPool = new ObjectPool(() => new FloatingText(0,0,'','#fff'), 30);
    
    this.grid = new SpatialGrid(200); 
  }

  async init() {
      try {
        await this.assets.loadAll();
      } catch (e) {
        console.error("Asset loading failed, starting anyway:", e);
      }
      this.phase = GamePhase.INTRO;
      this.startLoop();
  }

  setDifficulty(diff: Difficulty) {
      this.difficulty = diff;
      this.phase = GamePhase.PLAYING;
      this.assets.playBGM();
      this.resetGame();
  }

  resetGame() {
      this.player = new Player(0, 0);
      this.enemies = [];
      this.shadows = [];
      this.corpses = [];
      
      // Clear Pools
      this.particlePool.pool.forEach(p => p.active = false);
      this.projectilePool.pool.forEach(p => p.active = false);
      this.textPool.pool.forEach(t => t.active = false);
      
      this.stats = {
          hp: 150, maxHp: 150, 
          stamina: 100, maxStamina: 100, 
          xp: 0, maxXp: 100, 
          level: 1, 
          mana: 50, maxMana: 50,
          might: 10, fortitude: 10, celerity: 10, acuity: 10, precision: 10,
          shadowCount: 0, maxShadows: 3
      };
      
      this.wave = 1;
      this.missionStage = 0;
      this.playerClass = 'NONE';
      this.setNextMission();
  }

  startLoop() {
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  addNotification(text: string) {
    this.notifications.push(text);
    if (this.notifications.length > 5) this.notifications.shift();
  }

  setNextMission() {
      // 1. The Low-Tier Sweep (Tutorial)
      if (this.missionStage === 0) {
          this.currentMission = {
              id: 0,
              title: "The Low-Tier Sweep",
              description: "Purge 5 Void-Crawlers to survive.",
              type: 'KILL',
              target: 5,
              current: 0,
              rewardXp: 100,
              completed: false
          };
      } 
      // 2. The Impossible Trial (Survival)
      else if (this.missionStage === 1) {
          this.currentMission = {
              id: 1,
              title: "Impossible Trial of Genesis",
              description: "SURVIVE FOR 45 SECONDS.",
              type: 'SURVIVE',
              target: 45,
              current: 0,
              rewardXp: 500,
              completed: false
          };
          this.addNotification("WARNING: STATUE GUARDIANS AWAKENED");
      }
      // 3. The Daily Edict (Grind)
      else if (this.missionStage === 2) {
          this.currentMission = {
              id: 2,
              title: "The Daily Edict",
              description: "Complete the list: 15 Kills.",
              type: 'KILL',
              target: 15,
              current: 0,
              rewardXp: 1000,
              completed: false
          };
      }
      // 4. Trial of the Forgotten (Class Change)
      else if (this.missionStage === 3) {
           this.currentMission = {
              id: 3,
              title: "Trial of the Forgotten",
              description: "Defeat the Crimson Captain.",
              type: 'BOSS',
              target: 1,
              current: 0,
              rewardXp: 5000,
              completed: false
          };
          this.addNotification("SYSTEM ALERT: HIDDEN QUEST DETECTED");
      }
      // 5+. The Monarch's War (Endgame Loop)
      else {
           const kills = 20 + (this.wave * 5);
           this.currentMission = {
              id: Math.random(),
              title: "The Monarch's War",
              description: `Defend against the Sovereigns. Purge ${kills}.`,
              type: 'KILL',
              target: kills,
              current: 0,
              rewardXp: 2000 * this.wave,
              completed: false
          };
      }
      
      this.addNotification(`NEW QUEST: ${this.currentMission.title}`);
  }

  checkMissionProgress(type: 'KILL' | 'COLLECT' | 'TIME' | 'BOSS', value: number) {
      if (!this.currentMission || this.currentMission.completed) return;
      
      if (this.currentMission.type === type) {
          this.currentMission.current += value;
          if (this.currentMission.current >= this.currentMission.target) {
              this.completeMission();
          }
      }
  }

  completeMission() {
      if(!this.currentMission) return;
      this.currentMission.completed = true;
      this.gainXp(this.currentMission.rewardXp);
      this.addNotification("QUEST COMPLETED.");
      this.assets.playSound('dash');

      // Special Rewards
      if (this.missionStage === 1) {
          this.addNotification("SYSTEM UNLOCKED: THE PRIME DIRECTIVE");
      }
      if (this.missionStage === 3) {
          this.playerClass = 'SHADOW_WEAVER';
          this.stats.maxShadows = 10 + (this.stats.acuity * 0.5);
          this.addNotification("CLASS CHANGE: SHADOW WEAVER ACQUIRED");
          this.addNotification("SKILL UNLOCKED: SOUL HARVEST (E)");
      }

      this.missionStage++;
      setTimeout(() => this.setNextMission(), 3000);
  }

  loop(timestamp: number) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); 
    this.lastTime = timestamp;

    if (this.phase === GamePhase.PLAYING) {
        this.update(dt);
    }
    this.draw();

    this.uiCallback({
      stats: { ...this.stats },
      notifications: this.notifications,
      phase: this.phase,
      wave: this.wave,
      mission: this.currentMission,
      playerClass: this.playerClass
    });

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt: number) {
    if (this.stats.hp <= 0) {
        this.phase = GamePhase.GAMEOVER;
        return;
    }

    // Grid Update
    this.grid.clear();
    this.enemies.forEach(e => this.grid.add(e));
    this.grid.add(this.player);

    // --- Mission Timer ---
    if (this.currentMission?.type === 'SURVIVE') {
        this.checkMissionProgress('TIME', dt);
    }

    // --- Spawning Logic ---
    let spawnRate = 2.0;
    // Survival Mission spawns insane amount
    if (this.missionStage === 1) spawnRate = 0.5; 
    
    // Wave Scaling
    spawnRate = Math.max(0.2, spawnRate - (this.wave * 0.05));

    this.spawnTimer += dt;
    if (this.spawnTimer > spawnRate) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // --- Regen ---
    if (this.stats.stamina < this.stats.maxStamina) this.stats.stamina += (10 + this.stats.fortitude) * dt;
    if (this.stats.mana < this.stats.maxMana) this.stats.mana += (2 + this.stats.acuity * 0.5) * dt;

    // --- Player ---
    // Optimization: Only check collision with nearby enemies
    const nearbyEnemies = this.grid.getNearby(this.player);
    
    const hitEnemies = this.player.updateState(
      dt, 
      this.input.state.moveVector, 
      this.input.state.isDashing && this.stats.stamina > 20,
      this.input.state.isAttacking,
      nearbyEnemies, // Optimization: Passed grid subset instead of all enemies
      this.stats
    );
    
    // Player Hits Enemy
    if (hitEnemies && hitEnemies.length > 0) {
      this.renderer.addShake(3);
      this.assets.playSound('hit');
      hitEnemies.forEach(e => {
        // DAMAGE FORMULA: Might * 2 + Level
        // CRIT FORMULA: Precision % chance
        const isCrit = Math.random() < (this.stats.precision * 0.02); // 2% per point
        let dmg = (this.stats.might * 2) + (this.stats.level * 2);
        if (isCrit) {
            dmg *= 1.5 + (this.stats.precision * 0.05);
            this.renderer.addShake(5);
        }
        
        const enemy = e as Enemy;
        enemy.takeDamage(dmg, this.player);
        this.spawnFloatingText(enemy.x, enemy.y, Math.floor(dmg).toString(), isCrit ? '#ff0000' : '#fff');
        this.spawnParticles(enemy.x, enemy.y, '#b026ff', 3);
        
        if (enemy.isDead) {
          this.onEnemyDeath(enemy);
        }
      });
    }

    // --- Shadow Weaver Mechanics (Arise) ---
    if (this.input.state.isSummoning && this.playerClass === 'SHADOW_WEAVER') {
        // Find nearby corpses
        const nearbyCorpses = this.corpses.filter(c => {
            const d = Math.sqrt((c.x - this.player.x)**2 + (c.y - this.player.y)**2);
            return d < 200;
        });

        if (nearbyCorpses.length > 0) {
            nearbyCorpses.forEach(c => {
                if (this.stats.shadowCount < this.stats.maxShadows && this.stats.mana >= 10) {
                    this.stats.mana -= 10;
                    this.stats.shadowCount++;
                    c.isDead = true;
                    // Arise Shadow
                    const s = new ShadowUnit(c.x, c.y, c.originalSprite, 10 + (this.stats.acuity * 2));
                    this.shadows.push(s);
                    this.spawnParticles(c.x, c.y, '#00ffff', 20);
                    this.spawnFloatingText(c.x, c.y, "ARISE", '#00ffff');
                    this.assets.playSound('summon', 0.8); // New Sound
                }
            });
        }
    }

    // --- Shadow Logic ---
    this.shadows.forEach(s => {
        s.updateAI(dt, this.enemies);
        // Shadow combat
        if (s.target && !s.target.isDead) {
            const d = Math.sqrt((s.target.x - s.x)**2 + (s.target.y - s.y)**2);
            if (d < 30) {
                // Shadow Hit
                (s.target as Enemy).takeDamage(s.damage * dt * 4, s); // dps approx
            }
        }
    });

    // --- Corpses ---
    this.corpses.forEach(c => c.update(dt));

    // --- Dash Effects ---
    if (this.player.isDashing) {
        this.ghostTimer += dt;
        if (this.ghostTimer > 0.04) {
            this.ghosts.push(new Ghost(this.player.x, this.player.y, this.player.radius, this.player.color, this.player.facing));
            this.ghostTimer = 0;
        }
         if (this.player.dashTimer > 0.18) { 
             this.assets.playSound('dash', 0.6);
             this.stats.stamina = Math.max(0, this.stats.stamina - 25);
         }
    }

    // --- Projectiles ---
    this.projectilePool.pool.filter(p => p.active).forEach(p => {
      p.update(dt);
      if(!p.active) return;
      
      const dx = p.x - this.player.x;
      const dy = p.y - this.player.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < p.radius + this.player.radius && !this.player.isDashing) {
         this.takePlayerDamage(p.damage);
         p.active = false;
         this.spawnParticles(p.x, p.y, p.color, 5);
      }
    });

    // --- Enemies ---
    this.enemies.forEach(e => {
      const proj = e.updateAI(dt, this.player, this.shadows);
      if (proj) {
         const p = this.projectilePool.get();
         p.reset(proj.x, proj.y, proj.velocity, proj.damage, proj.color);
      }

      const dist = Math.sqrt((e.x - this.player.x)**2 + (e.y - this.player.y)**2);
      if (dist < e.radius + this.player.radius && !this.player.isDashing) {
         this.takePlayerDamage(e.damage * dt);
      }
    });

    // Cleanup
    this.ghosts.forEach(g => g.update(dt));
    this.particlePool.pool.filter(p => p.active).forEach(p => p.update(dt));
    this.textPool.pool.filter(t => t.active).forEach(t => t.update(dt));

    this.enemies = this.enemies.filter(e => !e.isDead);
    this.shadows = this.shadows.filter(s => !s.isDead);
    this.corpses = this.corpses.filter(c => !c.isDead);
    this.ghosts = this.ghosts.filter(g => !g.isDead);
    this.stats.shadowCount = this.shadows.length;
  }

  onEnemyDeath(e: Enemy) {
      this.gainXp(e.scoreValue);
      this.spawnParticles(e.x, e.y, '#ffffff', 10);
      
      // Boss Kill?
      if (this.currentMission?.type === 'BOSS') { // Any kill counts as boss kill for now in boss mode as there is only 1 type of boss
         this.checkMissionProgress('BOSS', 1);
      } else {
         this.checkMissionProgress('KILL', 1);
      }

      // Leave Corpse if Shadow Weaver
      if (this.playerClass === 'SHADOW_WEAVER') {
          this.corpses.push(new Corpse(e.x, e.y, e.spriteKey));
      }
  }

  takePlayerDamage(amount: number) {
      // Fortitude reduction
      const reduced = amount * (100 / (100 + this.stats.fortitude * 2));
      this.stats.hp -= reduced;
      this.renderer.addShake(4);
  }

  draw() {
    this.renderer.updateCamera(this.player, 0.016); 
    this.renderer.clear();
    this.renderer.drawBackground();

    this.corpses.forEach(c => {
         // Draw simplified soul flame
         this.renderer.ctx.save();
         this.renderer.ctx.translate(c.x - this.renderer.camera.x, c.y - this.renderer.camera.y);
         this.renderer.ctx.globalAlpha = 0.5;
         this.renderer.ctx.fillStyle = '#00ffff';
         this.renderer.ctx.beginPath();
         // Animated Pulse
         const pulse = 10 + Math.sin(Date.now() * 0.01) * 2;
         this.renderer.ctx.arc(0, 0, pulse, 0, Math.PI*2);
         this.renderer.ctx.fill();
         this.renderer.ctx.restore();
    });

    this.ghosts.forEach(g => this.renderer.drawEntity(g));
    
    this.particlePool.pool.forEach(p => { if(p.active) this.renderer.drawEntity(p); });
    
    const entities = [...this.enemies, ...this.shadows, this.player];
    entities.sort((a,b) => a.y - b.y);
    entities.forEach(e => this.renderer.drawEntity(e));
    
    this.projectilePool.pool.forEach(p => { if(p.active) this.renderer.drawEntity(p); });
    this.textPool.pool.forEach(t => { if(t.active) this.renderer.drawEntity(t); });
    
    this.renderer.drawAttackEffect(this.player);
    this.renderer.drawVignette();
  }

  spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 700; 
    const ex = this.player.x + Math.cos(angle) * dist;
    const ey = this.player.y + Math.sin(angle) * dist;
    
    const rand = Math.random();
    let enemy: Enemy;

    if (rand < 0.2) {
      enemy = new RangedSpitter(ex, ey);
    } else if (rand < 0.4) {
      enemy = new FlyingBat(ex, ey);
    } else {
      enemy = new Enemy(ex, ey);
    }

    // Difficulty scaling
    enemy.maxHp *= (1 + this.wave * 0.1);
    enemy.hp = enemy.maxHp;
    enemy.damage *= (1 + this.wave * 0.1);

    this.enemies.push(enemy);
  }

  spawnParticles(x: number, y: number, color: string, count: number) {
    for(let i=0; i<count; i++) {
        const p = this.particlePool.get();
        p.reset(x, y, color);
    }
  }

  spawnFloatingText(x: number, y: number, text: string, color: string) {
      const t = this.textPool.get();
      t.reset(x, y, text, color);
  }

  gainXp(amount: number) {
    this.stats.xp += amount;
    if (this.stats.xp >= this.stats.maxXp) {
      this.stats.level++;
      this.stats.xp = 0;
      this.stats.maxXp *= 1.2;
      
      // Auto-Assign Stats for Vertical Slice (Simulating user choice)
      this.stats.might += 2;
      this.stats.fortitude += 1;
      this.stats.celerity += 1;
      this.stats.acuity += 1;
      this.stats.precision += 2;
      
      // Heal
      this.stats.hp = this.stats.maxHp;
      this.stats.mana = this.stats.maxMana;

      this.addNotification(`LEVEL UP: RANK ${this.stats.level}`);
      this.addNotification(`STATS INCREASED: MIGHT & PRECISION`);
      this.spawnParticles(this.player.x, this.player.y, '#ffffff', 50);
      this.assets.playSound('dash'); 
    }
  }
}
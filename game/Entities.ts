import { EntityType, Vector2 } from '../types';

export class Entity {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  type: EntityType;
  isDead: boolean = false;
  active: boolean = true;
  velocity: Vector2 = { x: 0, y: 0 };
  spriteKey: string = '';
  rotation: number = 0;
  scale: number = 1;

  constructor(x: number, y: number, radius: number, color: string, type: EntityType) {
    this.id = Math.random();
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.type = type;
  }

  update(dt: number) {
    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;
  }
}

export class FloatingText extends Entity {
    text: string = "";
    life: number = 1.0;
    
    constructor(x: number, y: number, text: string, color: string) {
        super(x, y, 0, color, EntityType.FLOATING_TEXT);
        this.text = text;
        this.velocity = { x: 0, y: -50 };
    }

    reset(x: number, y: number, text: string, color: string) {
        this.x = x; this.y = y;
        this.text = text;
        this.color = color;
        this.life = 0.8;
        this.isDead = false;
        this.active = true;
        this.velocity = { x: (Math.random() - 0.5) * 20, y: -60 };
    }

    update(dt: number) {
        super.update(dt);
        this.life -= dt;
        if (this.life <= 0) {
            this.isDead = true;
            this.active = false;
        }
    }
}

export class Corpse extends Entity {
    life: number = 5.0; // Souls linger for 5 seconds
    originalSprite: string;

    constructor(x: number, y: number, sprite: string) {
        super(x, y, 15, '#555', EntityType.CORPSE);
        this.originalSprite = sprite;
    }

    update(dt: number) {
        this.life -= dt;
        if (this.life <= 0) this.isDead = true;
    }
}

export class ShadowUnit extends Entity {
    target: Entity | null = null;
    damage: number = 5;
    speed: number = 280;
    lifeTime: number = 30.0; // Shadows expire eventually, need recast
    
    constructor(x: number, y: number, sprite: string, dmg: number) {
        super(x, y, 20, '#00ffff', EntityType.SHADOW_UNIT);
        this.spriteKey = sprite;
        this.damage = dmg;
        this.color = '#00ffff'; // Cyan glow
    }

    updateAI(dt: number, enemies: Entity[]) {
        this.lifeTime -= dt;
        if (this.lifeTime <= 0) {
            this.isDead = true;
            return;
        }

        // Find nearest enemy
        if (!this.target || this.target.isDead) {
            let minDist = 600;
            this.target = null;
            for(const e of enemies) {
                const d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                if (d < minDist) {
                    minDist = d;
                    this.target = e;
                }
            }
        }

        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist > 10) {
                this.velocity.x = (dx/dist) * this.speed;
                this.velocity.y = (dy/dist) * this.speed;
                this.rotation = Math.atan2(dy, dx);
            } else {
                this.velocity = {x:0, y:0};
            }
        } else {
            // Idle / Follow player logic usually handled by engine grouping, 
            // but for now they just drift if no enemies
            this.velocity.x *= 0.9;
            this.velocity.y *= 0.9;
        }

        super.update(dt);
    }
}

export class Ghost extends Entity {
  life: number = 0.2;
  facing: number = 0;

  constructor(x: number, y: number, radius: number, color: string, facing: number) {
    super(x, y, radius, color, EntityType.GHOST);
    this.facing = facing;
  }

  update(dt: number) {
    this.life -= dt;
    if (this.life <= 0) this.isDead = true;
  }
}

export class Projectile extends Entity {
  damage: number = 8;
  life: number = 3.0;

  constructor(x: number, y: number, velocity: Vector2) {
    super(x, y, 6, '#00ffff', EntityType.PROJECTILE);
    this.velocity = velocity;
  }

  reset(x: number, y: number, velocity: Vector2, damage: number, color: string) {
      this.x = x; this.y = y;
      this.velocity = velocity;
      this.damage = damage;
      this.color = color;
      this.life = 3.0;
      this.isDead = false;
      this.active = true;
  }

  update(dt: number) {
    super.update(dt);
    this.life -= dt;
    if (this.life <= 0) {
        this.isDead = true;
        this.active = false;
    }
  }
}

export class Particle extends Entity {
  life: number = 1.0; 
  decay: number = 1.0;

  constructor(x: number, y: number, color: string) {
    super(x, y, 2, color, EntityType.PARTICLE);
    this.reset(x, y, color, 1.0);
  }

  reset(x: number, y: number, color: string, duration: number = 1.0) {
      this.x = x; this.y = y;
      this.color = color;
      this.active = true;
      this.isDead = false;
      this.life = duration;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 150 + 50;
      this.velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
      this.radius = Math.random() * 3 + 1;
      this.decay = Math.random() * 2.0 + 1.0;
  }

  update(dt: number) {
    super.update(dt);
    this.life -= this.decay * dt;
    if (this.life <= 0) {
        this.isDead = true;
        this.active = false;
    }
  }
}

export class Player extends Entity {
  isDashing: boolean = false;
  dashTimer: number = 0;
  dashCooldown: number = 0;
  
  // Combat
  attackTimer: number = 0;
  comboIndex: number = 0; // 0, 1, 2
  comboWindow: number = 0;
  facing: number = 0; 

  constructor(x: number, y: number) {
    super(x, y, 20, '#0ff', EntityType.PLAYER);
    this.spriteKey = 'hero';
  }

  updateState(dt: number, moveInput: Vector2, wantDash: boolean, wantAttack: boolean, enemies: any[], stats: any) {
    // Cooldowns
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.attackTimer > 0) this.attackTimer -= dt;
    if (this.comboWindow > 0) this.comboWindow -= dt;
    else this.comboIndex = 0; 

    const speed = 250 + (stats.celerity * 5); // Celerity scales speed

    // Dash Logic
    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.velocity = { x: 0, y: 0 };
      }
    } else {
      // Normal Movement
      if (wantDash && this.dashCooldown <= 0 && (moveInput.x !== 0 || moveInput.y !== 0)) {
        this.startDash(moveInput, stats.celerity);
      } else {
        this.velocity = { x: moveInput.x * speed, y: moveInput.y * speed };
      }
    }

    // Update Position
    super.update(dt);

    // Update Facing
    if (moveInput.x !== 0 || moveInput.y !== 0) {
      this.facing = Math.atan2(moveInput.y, moveInput.x);
    }
    this.rotation = this.facing;

    // Attack Logic
    if (wantAttack && this.attackTimer <= 0 && !this.isDashing) {
      return this.performAttack(enemies, stats);
    }
    
    return null;
  }

  startDash(dir: Vector2, celerity: number) {
    this.isDashing = true;
    this.dashTimer = 0.2; 
    this.dashCooldown = Math.max(0.3, 0.8 - (celerity * 0.01)); // Celerity reduces dash CD
    this.velocity = { x: dir.x * 1000, y: dir.y * 1000 };
  }

  performAttack(enemies: Entity[], stats: any): Entity[] {
    const baseAttackTime = 0.35;
    // Celerity slightly increases atk speed too
    this.attackTimer = Math.max(0.1, baseAttackTime - (stats.celerity * 0.005)); 
    this.comboWindow = 0.8;
    this.comboIndex = (this.comboIndex + 1) % 3;

    // Hitbox logic
    const reach = 110 + (this.comboIndex * 25); 
    const hitEnemies: Entity[] = [];

    enemies.forEach(e => {
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < reach) {
        const angleToEnemy = Math.atan2(dy, dx);
        const angleDiff = Math.abs(angleToEnemy - this.facing);
        let diff = angleDiff;
        if (diff > Math.PI) diff = 2 * Math.PI - diff;

        if (diff < 1.3) { 
          hitEnemies.push(e);
        }
      }
    });

    return hitEnemies;
  }
}

export class Enemy extends Entity {
  hp: number = 30;
  maxHp: number = 30;
  speed: number = 100;
  damage: number = 10;
  pushback: Vector2 = { x: 0, y: 0 };
  scoreValue: number = 10;
  aggroRange: number = 800;

  constructor(x: number, y: number, radius: number = 24, color: string = '#b026ff') {
    super(x, y, radius, color, EntityType.ENEMY);
    this.spriteKey = 'enemy_crawler';
  }

  updateAI(dt: number, target: Entity, shadows: Entity[]): Projectile | null {
    this.x += this.pushback.x * dt;
    this.y += this.pushback.y * dt;
    this.pushback.x *= 0.9;
    this.pushback.y *= 0.9;

    // Target either player or nearest shadow
    let actualTarget = target;
    let minDist = Math.sqrt((target.x - this.x)**2 + (target.y - this.y)**2);

    for (const s of shadows) {
        const d = Math.sqrt((s.x - this.x)**2 + (s.y - this.y)**2);
        if (d < minDist && d < 300) {
            actualTarget = s;
            minDist = d;
        }
    }

    const dx = actualTarget.x - this.x;
    const dy = actualTarget.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.rotation = Math.atan2(dy, dx);

    if (dist < this.aggroRange) {
        if (dist > this.radius + actualTarget.radius) {
            this.velocity.x = (dx / dist) * this.speed;
            this.velocity.y = (dy / dist) * this.speed;
        } else {
            this.velocity = { x: 0, y: 0 };
        }
    } else {
        this.velocity = {x: 0, y: 0};
    }

    super.update(dt);
    return null;
  }

  takeDamage(amount: number, from: Entity) {
    this.hp -= amount;
    if (this.hp <= 0) this.isDead = true;

    const dx = this.x - from.x;
    const dy = this.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.pushback = { x: (dx / dist) * 350, y: (dy / dist) * 350 };
  }
}

export class RangedSpitter extends Enemy {
  shootCooldown: number = 0;
  retreatDistance: number = 300;

  constructor(x: number, y: number) {
    super(x, y, 20, '#00ffcc');
    this.hp = 20;
    this.maxHp = 20;
    this.speed = 120;
    this.damage = 5; 
    this.spriteKey = 'enemy_ranged';
  }

  updateAI(dt: number, target: Entity, shadows: Entity[]): Projectile | null {
    this.x += this.pushback.x * dt;
    this.y += this.pushback.y * dt;
    this.pushback.x *= 0.9;
    this.pushback.y *= 0.9;

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.rotation = Math.atan2(dy, dx);
    
    // Maintain distance
    if (dist < this.retreatDistance) {
      this.velocity.x = -(dx / dist) * this.speed;
      this.velocity.y = -(dy / dist) * this.speed;
    } else if (dist > this.retreatDistance + 50) {
      this.velocity.x = (dx / dist) * this.speed;
      this.velocity.y = (dy / dist) * this.speed;
    } else {
      this.velocity = { x: (dy / dist) * 50, y: -(dx / dist) * 50 }; // Orbit
    }

    super.update(dt);

    this.shootCooldown -= dt;
    if (this.shootCooldown <= 0 && dist < 700) {
      this.shootCooldown = 2.0 + Math.random();
      const projSpeed = 450;
      const p = new Projectile(0,0, {x:0, y:0});
      p.reset(this.x, this.y, {
        x: (dx / dist) * projSpeed,
        y: (dy / dist) * projSpeed
      }, this.damage, '#00ffcc');
      return p;
    }

    return null;
  }
}

export class FlyingBat extends Enemy {
  angle: number = 0;

  constructor(x: number, y: number) {
    super(x, y, 18, '#ff4400');
    this.hp = 15;
    this.maxHp = 15;
    this.speed = 220; 
    this.damage = 8;
    this.spriteKey = 'enemy_bat';
    this.angle = Math.random() * Math.PI * 2;
  }

  updateAI(dt: number, target: Entity, shadows: Entity[]): Projectile | null {
     this.angle += dt * 3;
     
     const dx = target.x - this.x;
     const dy = target.y - this.y;
     const dist = Math.sqrt(dx*dx + dy*dy);
     
     const baseDirX = dx / (dist || 1);
     const baseDirY = dy / (dist || 1);
     
     const perpX = -baseDirY;
     const perpY = baseDirX;
     
     const weave = Math.sin(this.angle) * 120;
     
     this.velocity.x = baseDirX * this.speed + perpX * weave;
     this.velocity.y = baseDirY * this.speed + perpY * weave;
     
     this.rotation = Math.atan2(this.velocity.y, this.velocity.x);

     this.x += this.pushback.x * dt;
     this.y += this.pushback.y * dt;
     this.pushback.x *= 0.9;
     this.pushback.y *= 0.9;

     super.update(dt);
     return null;
  }
}
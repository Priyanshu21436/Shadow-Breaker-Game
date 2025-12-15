export interface Vector2 {
  x: number;
  y: number;
}

export enum EntityType {
  PLAYER,
  ENEMY,
  SHADOW_UNIT,
  PARTICLE,
  PROJECTILE,
  GHOST,
  FLOATING_TEXT,
  CORPSE // New type for extractable souls
}

export enum GamePhase {
  LOADING,
  INTRO,
  MENU,
  PLAYING,
  GAMEOVER
}

export enum Difficulty {
  SCAVENGER = 'SCAVENGER',   // E-Rank
  VETERAN = 'VETERAN',       // C-Rank
  MASTER = 'MASTER',         // A-Rank
  APEX = 'APEX'              // S-Rank
}

export interface Stats {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  xp: number;
  maxXp: number;
  level: number;
  mana: number;           // Replaces StarDust
  maxMana: number;
  
  // The Herald's Attributes
  might: number;      // STR - Dmg
  fortitude: number;  // VIT - HP
  celerity: number;   // AGI - Speed/Dash
  acuity: number;     // INT - Mana/Shadow Capacity
  precision: number;  // PER - Crit
  
  shadowCount: number;
  maxShadows: number;
}

export interface Mission {
  id: number;
  title: string;
  description: string;
  type: 'KILL' | 'COLLECT' | 'SURVIVE' | 'BOSS';
  target: number;
  current: number;
  rewardXp: number;
  completed: boolean;
}

// Data passed from Engine to React UI
export interface GameStateUI {
  stats: Stats;
  notifications: string[];
  phase: GamePhase;
  wave: number;
  mission: Mission | null;
  playerClass: 'NONE' | 'SHADOW_WEAVER';
}

export type InputState = {
  keys: Set<string>;
  moveVector: Vector2;
  isAttacking: boolean;
  isDashing: boolean;
  isSummoning: boolean; // 'E' Key - Arise
  mousePos: Vector2;
};
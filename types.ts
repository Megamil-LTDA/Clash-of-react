export enum UnitType {
  KNIGHT = 'KNIGHT',
  ARCHER = 'ARCHER',
  GIANT = 'GIANT',
  SKELETON = 'SKELETON',
  FIREBALL = 'FIREBALL',
  ZAP = 'ZAP'
}

export interface UnitStats {
  type: UnitType;
  name: string;
  cost: number;
  hp: number; // Para magias, isso é ignorado
  maxHp: number;
  damage: number;
  speed: number; 
  range: number; // Para magias, é o raio de explosão
  attackSpeed: number;
  description: string;
  icon: string;
  isSpell?: boolean; // Flag para identificar magia
}

export enum Lane {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export interface Entity {
  id: string;
  type: UnitType;
  owner: 'player' | 'enemy';
  lane: Lane;
  y: number; // 0 to 100 (percentage of field)
  hp: number;
  maxHp: number;
  lastAttackTick: number;
  state: 'moving' | 'attacking' | 'dying';
  targetId?: string;
}

export interface GameState {
  isPlaying: boolean;
  gameOver: boolean;
  winner: 'player' | 'enemy' | null;
  tick: number;
  playerElixir: number;
  enemyElixir: number;
  playerScore: number;
  enemyScore: number;
  playerTowerHp: number;
  enemyTowerHp: number;
  entities: Entity[];
  effects: VisualEffect[]; // Nova lista de efeitos temporários
}

export interface VisualEffect {
  id: string;
  type: 'explosion' | 'zap';
  x: number; // %
  y: number; // %
  createdAt: number;
}

export interface Commentary {
  text: string;
  mood: 'neutral' | 'excited' | 'tense' | 'victory';
}
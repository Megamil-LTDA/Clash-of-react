import { UnitType, UnitStats } from './types';

export const GAME_FPS = 30;
export const TICK_RATE = 1000 / GAME_FPS;
export const MAX_ELIXIR = 10;
export const ELIXIR_REGEN_RATE = 0.05; // Elixir per tick
export const TOWER_MAX_HP = 2000;
export const FIELD_HEIGHT = 100; // Percentage

export const UNIT_STATS: Record<UnitType, UnitStats> = {
  [UnitType.KNIGHT]: {
    type: UnitType.KNIGHT,
    name: 'Cavaleiro',
    cost: 3,
    hp: 700,
    maxHp: 700,
    damage: 85,
    speed: 0.35, 
    range: 6, 
    attackSpeed: 30, 
    description: 'Corpo a corpo, resistente.',
    icon: '⚔️'
  },
  [UnitType.ARCHER]: {
    type: UnitType.ARCHER,
    name: 'Arqueira',
    cost: 3,
    hp: 250,
    maxHp: 250,
    damage: 65,
    speed: 0.4,
    range: 25,
    attackSpeed: 20,
    description: 'Ataca à distância.',
    icon: '🏹'
  },
  [UnitType.GIANT]: {
    type: UnitType.GIANT,
    name: 'Gigante',
    cost: 5,
    hp: 2500,
    maxHp: 2500,
    damage: 150,
    speed: 0.15,
    range: 6,
    attackSpeed: 45,
    description: 'Foca em construções.',
    icon: '🦍'
  },
  [UnitType.SKELETON]: {
    type: UnitType.SKELETON,
    name: 'Esqueletos',
    cost: 1,
    hp: 80,
    maxHp: 80,
    damage: 40,
    speed: 0.5,
    range: 4,
    attackSpeed: 15,
    description: 'Fracos, mas em grupo.',
    icon: '💀'
  },
  [UnitType.FIREBALL]: {
    type: UnitType.FIREBALL,
    name: 'Bola de Fogo',
    cost: 4,
    hp: 0,
    maxHp: 0,
    damage: 350,
    speed: 0,
    range: 15, // Raio de explosão (em %)
    attackSpeed: 0,
    description: 'Alto dano em área.',
    icon: '🔥',
    isSpell: true
  },
  [UnitType.ZAP]: {
    type: UnitType.ZAP,
    name: 'Zap',
    cost: 2,
    hp: 0,
    maxHp: 0,
    damage: 120,
    speed: 0,
    range: 10, // Raio menor
    attackSpeed: 0,
    description: 'Dano leve instantâneo.',
    icon: '⚡',
    isSpell: true
  }
};
export type CharacterId = 'spiderMan' | 'captainAmerica';
export type AbilityId = 'basic' | 'web' | 'pull' | 'sense' | 'shieldThrow' | 'block' | 'ricochet';
export type AIState = 'IDLE' | 'APPROACH' | 'ATTACK' | 'DEFEND' | 'SPECIAL' | 'RETREAT';
export type GamePhase = 'MENU' | 'BATTLE' | 'PAUSED' | 'VICTORY' | 'DEFEAT';

export interface Stats {
  hp: number;
  strength: number;
  speed: number;
  defense: number;
  combat: number;
  mobility: number;
  energy: number;
}
export interface AbilityConfig {
  id: AbilityId;
  name: string;
  damage: number;
  cooldown: number;
  range: number;
  kind: 'melee' | 'projectile' | 'movement' | 'buff' | 'defense';
  slowDuration?: number;
  duration?: number;
}
export interface CharacterConfig {
  id: CharacterId;
  name: string;
  shortName: string;
  stats: Stats;
  color: number;
  accent: number;
  abilities: Record<string, AbilityConfig>;
}
export interface BattleStats {
  damageDealt: number;
  damageTaken: number;
  attacksUsed: number;
  startedAt: number;
  elapsedSeconds: number;
}

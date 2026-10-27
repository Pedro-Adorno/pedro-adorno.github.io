import type { CharacterConfig } from './characterTypes';

export const SPIDER_MAN: CharacterConfig = {
  id: 'spiderMan', name: 'Spider-Man', shortName: 'SPIDER-MAN', color: 0xd9344b, accent: 0x1766a8,
  stats: { hp: 1000, strength: 72, speed: 95, defense: 62, combat: 88, mobility: 98, energy: 100 },
  abilities: {
    basic: { id: 'basic', name: 'Socos e chutes', damage: 70, cooldown: 0.5, range: 100, kind: 'melee' },
    web: { id: 'web', name: 'Teia', damage: 50, cooldown: 5, range: 370, kind: 'projectile', slowDuration: 1.5 },
    pull: { id: 'pull', name: 'Teia puxadora', damage: 40, cooldown: 7, range: 470, kind: 'movement' },
    sense: { id: 'sense', name: 'Aranha Sense', damage: 0, cooldown: 12, range: 0, kind: 'buff', duration: 3 },
  },
};

export const CAPTAIN_AMERICA: CharacterConfig = {
  id: 'captainAmerica', name: 'Captain America', shortName: 'CAPTAIN AMERICA', color: 0x1762a7, accent: 0xe8edf6,
  stats: { hp: 1200, strength: 82, speed: 70, defense: 90, combat: 92, mobility: 65, energy: 100 },
  abilities: {
    basic: { id: 'basic', name: 'Soco com escudo', damage: 85, cooldown: 0.8, range: 112, kind: 'melee' },
    shieldThrow: { id: 'shieldThrow', name: 'Arremesso do escudo', damage: 100, cooldown: 5, range: 520, kind: 'projectile' },
    block: { id: 'block', name: 'Bloqueio', damage: 0, cooldown: 8, range: 0, kind: 'defense', duration: 2 },
    ricochet: { id: 'ricochet', name: 'Escudo ricochete', damage: 160, cooldown: 12, range: 600, kind: 'projectile' },
  },
};

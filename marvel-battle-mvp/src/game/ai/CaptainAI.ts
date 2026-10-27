import type { AIState } from '../../characters/characterTypes';
import { CAPTAIN_AMERICA } from '../../characters/characters';
import { AI_THINK_INTERVAL } from '../config/gameConfig';
import type { Fighter } from '../entities/Fighter';

export interface AIAction { state: AIState; move: -1 | 0 | 1; action: 'basic' | 'shieldThrow' | 'block' | 'ricochet' | null; }

export class CaptainAI {
  state: AIState = 'IDLE';
  private thinkIn = 0;
  private lastAction = 0;

  update(deltaMs: number, cpu: Fighter, player: Fighter, playerIsAttacking: boolean): AIAction {
    this.thinkIn -= deltaMs;
    const distance = Math.abs(player.root.x - cpu.root.x);
    if (this.thinkIn > 0) return { state: this.state, move: this.movement(cpu, player, distance), action: null };
    this.thinkIn = AI_THINK_INTERVAL * 1000;
    const now = cpu.root.scene.time.now;
    const ready = (cooldown: number) => now - this.lastAction > cooldown * 1000;
    let action: AIAction['action'] = null;
    let move: -1 | 0 | 1 = 0;
    if (cpu.hp < cpu.config.stats.hp * 0.38 && playerIsAttacking && ready(2.1) && !cpu.isBlocking) {
      this.state = 'DEFEND'; action = 'block'; this.lastAction = now;
    } else if (distance < 260 && ready(4) && Math.random() < 0.24) {
      this.state = 'SPECIAL'; action = 'ricochet'; this.lastAction = now;
    } else if (distance < 390 && ready(2.8) && Math.random() < 0.42) {
      this.state = 'ATTACK'; action = 'shieldThrow'; this.lastAction = now;
    } else if (distance <= CAPTAIN_AMERICA.abilities.basic.range && ready(CAPTAIN_AMERICA.abilities.basic.cooldown)) {
      this.state = 'ATTACK'; action = 'basic'; this.lastAction = now;
    } else if (distance > 130) {
      this.state = distance > 280 ? 'APPROACH' : 'IDLE'; move = this.movement(cpu, player, distance);
    } else if (playerIsAttacking && Math.random() < 0.22 && ready(2.5)) {
      this.state = 'DEFEND'; action = 'block'; this.lastAction = now;
    } else {
      this.state = 'RETREAT'; move = Math.random() < 0.3 ? (player.root.x < cpu.root.x ? 1 : -1) : 0;
    }
    return { state: this.state, move, action };
  }

  private movement(cpu: Fighter, player: Fighter, distance: number): -1 | 0 | 1 {
    if (distance < 95) return 0;
    return player.root.x < cpu.root.x ? -1 : 1;
  }
}

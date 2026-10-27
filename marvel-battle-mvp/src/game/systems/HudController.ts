import type { BattleStats } from '../../characters/characterTypes';
import type { Fighter } from '../entities/Fighter';

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Elemento de interface ausente: #${id}`);
  return element as T;
};

export class HudController {
  private spiderBar = byId<HTMLDivElement>('spider-health');
  private capBar = byId<HTMLDivElement>('cap-health');
  private spiderHp = byId<HTMLSpanElement>('spider-hp');
  private capHp = byId<HTMLSpanElement>('cap-hp');
  private cooldowns = {
    attack: [byId<HTMLSpanElement>('cd-attack'), byId<HTMLElement>('bar-attack')],
    web: [byId<HTMLSpanElement>('cd-web'), byId<HTMLElement>('bar-web')],
    pull: [byId<HTMLSpanElement>('cd-pull'), byId<HTMLElement>('bar-pull')],
    sense: [byId<HTMLSpanElement>('cd-sense'), byId<HTMLElement>('bar-sense')],
  } as const;
  private previous = '';

  update(spider: Fighter, cap: Fighter, cooldowns: Record<'attack' | 'web' | 'pull' | 'sense', number>, maxCooldowns: Record<'attack' | 'web' | 'pull' | 'sense', number>): void {
    const signature = `${spider.hp}|${cap.hp}|${Object.values(cooldowns).map(v => Math.ceil(v * 10)).join('|')}`;
    if (signature === this.previous) return;
    this.previous = signature;
    this.spiderBar.style.width = `${Math.max(0, spider.hp / spider.config.stats.hp * 100)}%`;
    this.capBar.style.width = `${Math.max(0, cap.hp / cap.config.stats.hp * 100)}%`;
    this.spiderHp.textContent = `${Math.ceil(spider.hp)} / ${spider.config.stats.hp} HP`;
    this.capHp.textContent = `${Math.ceil(cap.hp)} / ${cap.config.stats.hp} HP`;
    (Object.keys(this.cooldowns) as Array<keyof typeof this.cooldowns>).forEach(key => {
      const remaining = Math.max(0, cooldowns[key]);
      const [label, bar] = this.cooldowns[key];
      label.textContent = remaining <= 0 ? 'PRONTO' : `${remaining.toFixed(1)}S`;
      bar.style.width = `${Math.min(100, remaining / maxCooldowns[key] * 100)}%`;
      bar.closest('.ability-item')?.classList.toggle('on-cooldown', remaining > 0);
    });
  }
}

export function showResult(winner: 'spider' | 'cap', stats: BattleStats): void {
  byId('result-kicker').textContent = winner === 'spider' ? 'VICTORY' : 'DEFEAT';
  byId('result-kicker').style.color = winner === 'spider' ? '#55e6a5' : '#ff4b57';
  byId('result-name').textContent = winner === 'spider' ? 'SPIDER-MAN' : 'CAPTAIN AMERICA';
  byId('stat-dealt').textContent = Math.round(stats.damageDealt).toLocaleString('pt-BR');
  byId('stat-taken').textContent = Math.round(stats.damageTaken).toLocaleString('pt-BR');
  byId('stat-attacks').textContent = String(stats.attacksUsed);
  const total = Math.floor(stats.elapsedSeconds);
  byId('stat-time').textContent = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  byId('result-overlay').classList.remove('hidden');
}

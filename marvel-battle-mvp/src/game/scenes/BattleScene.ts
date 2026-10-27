import Phaser from 'phaser';
import { CAPTAIN_AMERICA, SPIDER_MAN } from '../../characters/characters';
import type { AbilityId, BattleStats, GamePhase } from '../../characters/characterTypes';
import { ARENA_PADDING, BASE_DAMAGE_SCALE, CPU_START_X, FLOOR_Y, GAME_HEIGHT, GAME_WIDTH, PLAYER_START_X } from '../config/gameConfig';
import { CaptainAI } from '../ai/CaptainAI';
import { Effects } from '../effects/Effects';
import { Fighter } from '../entities/Fighter';
import { HudController, showResult } from '../systems/HudController';

export class BattleScene extends Phaser.Scene {
  private spider!: Fighter;
  private cap!: Fighter;
  private effects!: Effects;
  private ai = new CaptainAI();
  private hud!: HudController;
  private phase: GamePhase = 'MENU';
  private cursors!: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; up: Phaser.Input.Keyboard.Key; j: Phaser.Input.Keyboard.Key; k: Phaser.Input.Keyboard.Key; l: Phaser.Input.Keyboard.Key; u: Phaser.Input.Keyboard.Key };
  private cooldowns = { attack: 0, web: 0, pull: 0, sense: 0 };
  private readonly maxCooldowns = { attack: SPIDER_MAN.abilities.basic.cooldown, web: SPIDER_MAN.abilities.web.cooldown, pull: SPIDER_MAN.abilities.pull.cooldown, sense: SPIDER_MAN.abilities.sense.cooldown };
  private stats: BattleStats = { damageDealt: 0, damageTaken: 0, attacksUsed: 0, startedAt: 0, elapsedSeconds: 0 };
  private elapsed = 0;
  private aiActionTimer = 0;
  private hudTimer = 0;
  private cpuCooldowns = { basic: 0, shieldThrow: 0, block: 0, ricochet: 0 };
  private keyListener?: (event: KeyboardEvent) => void;

  constructor() { super('BattleScene'); }

  create(): void {
    this.drawArena();
    this.effects = new Effects(this);
    this.hud = new HudController();
    this.spider = new Fighter(this, SPIDER_MAN, PLAYER_START_X, FLOOR_Y);
    this.cap = new Fighter(this, CAPTAIN_AMERICA, CPU_START_X, FLOOR_Y);
    this.cursors = {
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      j: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      k: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.K),
      l: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.L),
      u: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.U),
    };
    this.input.keyboard!.addCapture(['A', 'D', 'W', 'J', 'K', 'L', 'U']);
    this.keyListener = (event: KeyboardEvent) => { if (['a','d','w','j','k','l','u'].includes(event.key.toLowerCase())) event.preventDefault(); };
    window.addEventListener('keydown', this.keyListener);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { if (this.keyListener) window.removeEventListener('keydown', this.keyListener); });
    this.phase = 'MENU';
    this.hud.update(this.spider, this.cap, this.cooldowns, this.maxCooldowns);
  }

  startBattle(): void {
    this.spider.hp = SPIDER_MAN.stats.hp; this.cap.hp = CAPTAIN_AMERICA.stats.hp;
    this.spider.alive = true; this.cap.alive = true;
    this.spider.root.setPosition(PLAYER_START_X, FLOOR_Y); this.cap.root.setPosition(CPU_START_X, FLOOR_Y);
    this.spider.xVelocity = 0; this.cap.xVelocity = 0; this.spider.yVelocity = 0; this.cap.yVelocity = 0;
    this.spider.onGround = true; this.cap.onGround = true;
    this.spider.slowUntil = this.cap.slowUntil = this.spider.buffUntil = this.cap.buffUntil = 0;
    this.spider.blockUntil = this.cap.blockUntil = this.spider.stunnedUntil = this.cap.stunnedUntil = 0;
    this.cooldowns = { attack: 0, web: 0, pull: 0, sense: 0 }; this.cpuCooldowns = { basic: 0, shieldThrow: 0, block: 0, ricochet: 0 };
    this.stats = { damageDealt: 0, damageTaken: 0, attacksUsed: 0, startedAt: this.time.now, elapsedSeconds: 0 };
    this.elapsed = 0; this.aiActionTimer = 0; this.hudTimer = 0; this.ai = new CaptainAI();
    this.spider.root.setVisible(true); this.cap.root.setVisible(true);
    this.phase = 'BATTLE';
    this.hud.update(this.spider, this.cap, this.cooldowns, this.maxCooldowns);
  }

  update(_time: number, deltaMs: number): void {
    if (this.phase !== 'BATTLE') return;
    const dt = Math.min(deltaMs / 1000, 0.04);
    this.elapsed += dt; this.stats.elapsedSeconds = this.elapsed;
    for (const key of Object.keys(this.cooldowns) as Array<keyof typeof this.cooldowns>) this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
    for (const key of Object.keys(this.cpuCooldowns) as Array<keyof typeof this.cpuCooldowns>) this.cpuCooldowns[key] = Math.max(0, this.cpuCooldowns[key] - dt);
    this.spider.face(this.cap.root.x); this.cap.face(this.spider.root.x);
    this.updatePlayer(dt);
    this.updateAI(deltaMs, dt);
    this.spider.update(deltaMs); this.cap.update(deltaMs);
    this.keepInArena(this.spider); this.keepInArena(this.cap);
    this.hudTimer += deltaMs;
    if (this.hudTimer >= 90) { this.hud.update(this.spider, this.cap, this.cooldowns, this.maxCooldowns); this.hudTimer = 0; }
    if (!this.spider.alive || !this.cap.alive) this.finishBattle(this.spider.alive ? 'spider' : 'cap');
  }

  private updatePlayer(dt: number): void {
    let direction = 0;
    if (this.cursors.left.isDown) direction -= 1;
    if (this.cursors.right.isDown) direction += 1;
    if (this.time.now >= this.spider.stunnedUntil) this.spider.move(direction, dt);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.spider.jump();
    if (Phaser.Input.Keyboard.JustDown(this.cursors.j)) this.playerBasic();
    if (Phaser.Input.Keyboard.JustDown(this.cursors.k)) this.useWeb();
    if (Phaser.Input.Keyboard.JustDown(this.cursors.l)) this.usePull();
    if (Phaser.Input.Keyboard.JustDown(this.cursors.u)) this.useSense();
  }

  private playerBasic(): void {
    if (this.cooldowns.attack > 0 || this.time.now < this.spider.stunnedUntil) return;
    const ability = SPIDER_MAN.abilities.basic;
    this.cooldowns.attack = ability.cooldown * (100 / SPIDER_MAN.stats.speed);
    this.spider.playAttack('basic'); this.stats.attacksUsed++;
    this.time.delayedCall(90, () => {
      if (this.phase !== 'BATTLE' || !this.cap.alive || !this.spider.alive) return;
      if (Math.abs(this.cap.root.x - this.spider.root.x) <= ability.range && this.isFacingTarget(this.spider, this.cap)) this.dealDamage(this.spider, this.cap, ability.damage, 0xff6470);
      else this.effects.impact(this.spider.root.x + this.spider.facing * 30, this.spider.root.y - 45, 0x91a2bd, 3);
    });
  }

  private useWeb(): void {
    if (this.cooldowns.web > 0 || !this.cap.alive) return;
    const ability = SPIDER_MAN.abilities.web; this.cooldowns.web = ability.cooldown; this.spider.playAttack('web'); this.stats.attacksUsed++;
    const fromX = this.spider.root.x + this.spider.facing * 22; const fromY = this.spider.root.y - 52;
    const targetX = this.cap.root.x; const targetY = this.cap.root.y - 45;
    this.effects.line(fromX, fromY, targetX, targetY, 0x7ce9ff, 260);
    this.effects.projectile(fromX, fromY, targetX, targetY, 0x7ce9ff, () => {
      if (this.phase !== 'BATTLE' || !this.cap.alive) return;
      if (Math.abs(this.cap.root.x - this.spider.root.x) <= ability.range) { this.dealDamage(this.spider, this.cap, ability.damage, 0x7ce9ff); this.cap.slowUntil = this.time.now + (ability.slowDuration ?? 1.5) * 1000; }
    });
  }

  private usePull(): void {
    if (this.cooldowns.pull > 0 || !this.cap.alive) return;
    const ability = SPIDER_MAN.abilities.pull; this.cooldowns.pull = ability.cooldown; this.spider.playAttack('pull'); this.stats.attacksUsed++;
    const direction = this.cap.root.x > this.spider.root.x ? 1 : -1;
    const fromX = this.spider.root.x + direction * 18; const fromY = this.spider.root.y - 50;
    this.effects.line(fromX, fromY, this.cap.root.x, this.cap.root.y - 45, 0x9a8aff, 240);
    this.spider.root.x = Phaser.Math.Clamp(this.spider.root.x + direction * Math.max(0, Math.abs(this.cap.root.x - this.spider.root.x) - 86), ARENA_PADDING, GAME_WIDTH - ARENA_PADDING);
    this.spider.face(this.cap.root.x);
    this.time.delayedCall(130, () => { if (this.phase === 'BATTLE' && this.cap.alive && Math.abs(this.cap.root.x - this.spider.root.x) < 130) this.dealDamage(this.spider, this.cap, ability.damage, 0xb7a5ff); });
  }

  private useSense(): void {
    if (this.cooldowns.sense > 0) return;
    const ability = SPIDER_MAN.abilities.sense; this.cooldowns.sense = ability.cooldown; this.spider.buffUntil = this.time.now + (ability.duration ?? 3) * 1000; this.spider.playAttack('sense', 250); this.stats.attacksUsed++;
    this.effects.impact(this.spider.root.x, this.spider.root.y - 45, 0x73e8ff, 15);
  }

  private updateAI(deltaMs: number, dt: number): void {
    this.aiActionTimer -= deltaMs;
    if (this.aiActionTimer > 0) { if (this.cap.xVelocity !== 0) this.cap.move(this.cap.xVelocity > 0 ? 1 : -1, dt); return; }
    const playerAttacking = this.spider.attackType !== null;
    const decision = this.ai.update(deltaMs, this.cap, this.spider, playerAttacking);
    this.cap.move(decision.move, dt);
    this.aiActionTimer = 80;
    if (!decision.action) return;
    if (decision.action === 'basic') this.cpuBasic();
    if (decision.action === 'shieldThrow') this.cpuProjectile('shieldThrow');
    if (decision.action === 'ricochet') this.cpuProjectile('ricochet');
    if (decision.action === 'block') { this.cap.blockUntil = this.time.now + (CAPTAIN_AMERICA.abilities.block.duration ?? 2) * 1000; this.cap.playAttack('block', 300); this.effects.impact(this.cap.root.x, this.cap.root.y - 45, 0x6edcff, 7); }
  }

  private cpuBasic(): void {
    if (this.cpuCooldowns.basic > 0 || !this.spider.alive) return;
    const ability = CAPTAIN_AMERICA.abilities.basic; this.cpuCooldowns.basic = ability.cooldown * (100 / CAPTAIN_AMERICA.stats.speed);
    this.cap.playAttack('basic');
    this.time.delayedCall(130, () => {
      if (this.phase !== 'BATTLE' || !this.spider.alive) return;
      if (Math.abs(this.spider.root.x - this.cap.root.x) <= ability.range && this.isFacingTarget(this.cap, this.spider)) this.dealDamage(this.cap, this.spider, ability.damage, 0x6bdcff);
      else this.effects.impact(this.cap.root.x + this.cap.facing * 25, this.cap.root.y - 45, 0x91a2bd, 3);
    });
  }

  private cpuProjectile(id: 'shieldThrow' | 'ricochet'): void {
    const ability = CAPTAIN_AMERICA.abilities[id];
    if (this.cpuCooldowns[id] > 0 || !this.spider.alive) return;
    this.cpuCooldowns[id] = ability.cooldown; this.cap.playAttack(id); this.stats.attacksUsed++;
    const startX = this.cap.root.x - this.cap.facing * 25; const startY = this.cap.root.y - 48;
    const targetX = this.spider.root.x; const targetY = this.spider.root.y - 45;
    this.effects.projectile(startX, startY, targetX, targetY, 0x65d9ff, () => {
      if (this.phase !== 'BATTLE') return;
      if (this.spider.alive) this.dealDamage(this.cap, this.spider, ability.damage, 0x6bdcff);
      if (id === 'shieldThrow' && this.cap.alive) this.effects.projectile(targetX, targetY, this.cap.root.x - this.cap.facing * 25, this.cap.root.y - 48, 0x65d9ff, () => this.effects.impact(this.cap.root.x, this.cap.root.y - 48, 0x65d9ff, 4), true);
    }, true);
  }

  private dealDamage(attacker: Fighter, defender: Fighter, baseDamage: number, color: number): void {
    if (!attacker.alive || !defender.alive) return;
    if (defender.config.id === 'spiderMan') {
      const dodgeChance = 0.15 + (defender.isBuffed ? 0.25 : 0);
      if (Math.random() < dodgeChance) { this.effects.damageNumber(defender.root.x, defender.root.y - 86, 0, '#7ce9ff'); this.effects.impact(defender.root.x, defender.root.y - 45, 0x7ce9ff, 5); defender.root.x = Phaser.Math.Clamp(defender.root.x - attacker.facing * 24, ARENA_PADDING, GAME_WIDTH - ARENA_PADDING); return; }
    }
    const stats = attacker.config.stats;
    const strengthFactor = 0.7 + stats.strength / 240;
    const combatFactor = 0.75 + stats.combat / 400;
    const buffFactor = attacker.isBuffed ? 1.2 : 1;
    const scaledDamage = baseDamage * BASE_DAMAGE_SCALE * strengthFactor * combatFactor * buffFactor;
    const actual = defender.takeDamage(scaledDamage);
    if (actual <= 0) return;
    if (attacker === this.spider) this.stats.damageDealt += actual; else if (defender === this.spider) this.stats.damageTaken += actual;
    this.effects.damageNumber(defender.root.x, defender.root.y - 92, actual, `#${color.toString(16).padStart(6, '0')}`);
    this.effects.impact(defender.root.x, defender.root.y - 48, color, 8);
    if (defender.config.id === 'spiderMan' && defender.isBuffed) defender.stunnedUntil = this.time.now;
  }

  private isFacingTarget(attacker: Fighter, target: Fighter): boolean { return Math.sign(target.root.x - attacker.root.x) === attacker.facing; }
  private keepInArena(fighter: Fighter): void { fighter.root.x = Phaser.Math.Clamp(fighter.root.x, ARENA_PADDING, GAME_WIDTH - ARENA_PADDING); }

  private finishBattle(winner: 'spider' | 'cap'): void {
    if (this.phase !== 'BATTLE') return;
    this.phase = winner === 'spider' ? 'VICTORY' : 'DEFEAT';
    const loser = winner === 'spider' ? this.cap : this.spider;
    this.tweens.add({ targets: loser.root, alpha: 0.35, y: loser.root.y + 12, duration: 600, ease: 'Quad.easeOut' });
    this.cameras.main.flash(220, 225, 240, 255, false);
    showResult(winner, this.stats);
  }

  private drawArena(): void {
    const g = this.add.graphics().setDepth(-10);
    g.fillGradientStyle(0x111e38, 0x111e38, 0x080e1c, 0x080e1c, 1); g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    // Distant skyline.
    for (let i = 0; i < 18; i++) {
      const x = i * 57 - 8; const h = 75 + ((i * 47) % 125); const w = 35 + (i % 3) * 9;
      g.fillStyle(i % 2 ? 0x172641 : 0x1b2944, 0.9); g.fillRect(x, FLOOR_Y - h - 7, w, h + 7);
      g.fillStyle(0x57b7ef, 0.15);
      for (let wy = FLOOR_Y - h + 12; wy < FLOOR_Y - 15; wy += 17) for (let wx = x + 7; wx < x + w - 4; wx += 12) if ((Math.floor(wx + wy + i) % 3) !== 0) g.fillRect(wx, wy, 4, 6);
    }
    // Moon and atmospheric light.
    g.fillStyle(0x9ddfff, 0.06); g.fillCircle(775, 92, 76); g.fillStyle(0xc5eaff, 0.8); g.fillCircle(775, 92, 27); g.fillStyle(0x182641, 0.7); g.fillCircle(787, 83, 24);
    g.fillStyle(0x14213a, 0.9); g.fillRect(0, FLOOR_Y + 12, GAME_WIDTH, GAME_HEIGHT - FLOOR_Y);
    g.fillStyle(0x0a1223, 1); g.fillRect(0, FLOOR_Y + 19, GAME_WIDTH, GAME_HEIGHT - FLOOR_Y);
    g.lineStyle(2, 0x4bb7ef, 0.65); g.lineBetween(0, FLOOR_Y + 12, GAME_WIDTH, FLOOR_Y + 12);
    g.lineStyle(1, 0x304664, 0.45);
    for (let x = -200; x < GAME_WIDTH + 200; x += 80) g.lineBetween(GAME_WIDTH / 2, FLOOR_Y + 12, x, GAME_HEIGHT);
    for (let y = FLOOR_Y + 35; y < GAME_HEIGHT; y += 20) g.lineBetween(0, y, GAME_WIDTH, y);
    // Edge beacons and atmospheric specks.
    g.fillStyle(0xff4b57, 0.9); g.fillCircle(26, FLOOR_Y + 7, 3); g.fillStyle(0x53d8ff, 0.9); g.fillCircle(GAME_WIDTH - 26, FLOOR_Y + 7, 3);
    for (let i = 0; i < 42; i++) { const x = (i * 137) % GAME_WIDTH; const y = (i * 61) % (FLOOR_Y - 20); g.fillStyle(i % 3 === 0 ? 0xff6672 : 0x8bdfff, 0.28 + (i % 4) * 0.1); g.fillCircle(x, y, i % 5 === 0 ? 2 : 1); }
    // Arena rails.
    g.lineStyle(1, 0x36516e, 0.55); g.lineBetween(ARENA_PADDING, 80, ARENA_PADDING, FLOOR_Y + 12); g.lineBetween(GAME_WIDTH - ARENA_PADDING, 80, GAME_WIDTH - ARENA_PADDING, FLOOR_Y + 12);
  }
}

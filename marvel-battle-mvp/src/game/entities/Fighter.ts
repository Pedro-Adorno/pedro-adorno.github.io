import Phaser from 'phaser';
import type { AbilityId, CharacterConfig } from '../../characters/characterTypes';
import { FLOOR_Y, GRAVITY, JUMP_VELOCITY } from '../config/gameConfig';

export class Fighter {
  readonly root: Phaser.GameObjects.Container;
  readonly body: Phaser.GameObjects.Graphics;
  readonly aura: Phaser.GameObjects.Graphics;
  readonly config: CharacterConfig;
  hp: number;
  xVelocity = 0;
  yVelocity = 0;
  facing = 1;
  onGround = true;
  slowUntil = 0;
  buffUntil = 0;
  blockUntil = 0;
  stunnedUntil = 0;
  flashUntil = 0;
  attackUntil = 0;
  attackType: AbilityId | null = null;
  alive = true;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, config: CharacterConfig, x: number, y: number) {
    this.scene = scene;
    this.config = config;
    this.hp = config.stats.hp;
    this.aura = scene.add.graphics();
    this.body = scene.add.graphics();
    this.root = scene.add.container(x, y, [this.aura, this.body]);
    this.root.setDepth(5);
    this.draw();
  }

  get isBlocking(): boolean { return this.blockUntil > this.scene.time.now; }
  get isBuffed(): boolean { return this.buffUntil > this.scene.time.now; }
  get effectiveSpeed(): number {
    const buff = this.isBuffed ? 1.25 : 1;
    const slow = this.slowUntil > this.scene.time.now ? 0.55 : 1;
    const mobilityFactor = 0.85 + this.config.stats.mobility / 650;
    return this.config.stats.speed * mobilityFactor * 2.45 * buff * slow;
  }

  face(targetX: number): void { this.facing = targetX >= this.root.x ? 1 : -1; }
  jump(): void { if (this.onGround && this.alive) { this.yVelocity = JUMP_VELOCITY; this.onGround = false; } }
  move(direction: number, deltaSeconds: number): void {
    if (!this.alive) return;
    this.xVelocity = direction * this.effectiveSpeed;
    this.root.x += this.xVelocity * deltaSeconds;
  }

  update(deltaMs: number): void {
    if (!this.alive) return;
    const dt = Math.min(deltaMs / 1000, 0.04);
    if (!this.onGround) {
      this.yVelocity += GRAVITY * dt;
      this.root.y += this.yVelocity * dt;
      if (this.root.y >= FLOOR_Y) { this.root.y = FLOOR_Y; this.yVelocity = 0; this.onGround = true; }
    }
    if (this.attackUntil <= this.scene.time.now) this.attackType = null;
    this.draw();
  }

  takeDamage(amount: number): number {
    if (!this.alive) return 0;
    const defense = this.config.stats.defense;
    const reduction = this.isBlocking ? 0.6 : Math.min(0.42, defense * 0.0032);
    const damage = Math.max(1, Math.round(amount * (1 - reduction)));
    this.hp = Math.max(0, this.hp - damage);
    this.flashUntil = this.scene.time.now + 180;
    if (this.hp <= 0) { this.alive = false; this.xVelocity = 0; this.yVelocity = 0; }
    return damage;
  }

  playAttack(id: AbilityId, duration = 220): void { this.attackType = id; this.attackUntil = this.scene.time.now + duration; }
  destroy(): void { this.root.destroy(true); }

  private draw(): void {
    const g = this.body;
    const aura = this.aura;
    g.clear(); aura.clear();
    const now = this.scene.time.now;
    if (this.isBuffed) { aura.fillStyle(0x55d9ff, 0.14); aura.fillCircle(0, -42, 51); aura.lineStyle(2, 0x70e7ff, 0.65); aura.strokeCircle(0, -42, 48 + Math.sin(now / 90) * 2); }
    if (now < this.flashUntil && Math.floor(now / 45) % 2 === 0) g.fillStyle(0xffffff, 1); else g.fillStyle(this.config.color, 1);
    const dir = this.facing;
    // Silhouette and torso.
    g.fillRoundedRect(-20, -65, 40, 38, 8);
    g.fillStyle(this.config.id === 'spiderMan' ? 0x185da0 : 0x163c75, 1);
    g.fillRoundedRect(-18, -31, 36, 27, 5);
    // Legs, with a small attack pose.
    const attacking = this.attackType !== null;
    g.fillStyle(this.config.id === 'spiderMan' ? 0x185da0 : 0x172e5c, 1);
    g.fillRoundedRect(-17, -9, 13, 23, 4);
    g.fillRoundedRect(4, -9, 13, attacking ? 17 : 23, 4);
    // Arms.
    g.fillStyle(this.config.color, 1);
    g.fillRoundedRect(dir * 13 - 3, -58, attacking ? 28 : 13, 11, 4);
    g.fillRoundedRect(-dir * 15 - 3, -57, 13, 10, 4);
    // Head and mask.
    g.fillStyle(this.config.color, 1); g.fillCircle(0, -76, 17);
    if (this.config.id === 'spiderMan') {
      g.fillStyle(0xeaf7ff, 1); g.fillEllipse(-7, -78, 9, 5); g.fillEllipse(7, -78, 9, 5);
      g.lineStyle(1, 0x711d37, 0.85); g.lineBetween(-13, -88, 13, -65); g.lineBetween(13, -88, -13, -65);
      g.lineStyle(1, 0x711d37, 0.7); g.lineBetween(-15, -78, 15, -78); g.lineBetween(-11, -89, 11, -64);
      g.fillStyle(0xe83c50, 1); g.fillCircle(0, -44, 4); g.lineStyle(1, 0xffffff, 0.8); g.lineBetween(-5, -44, 5, -44); g.lineBetween(0, -49, 0, -39);
    } else {
      g.fillStyle(0xf4f7ff, 1); g.fillEllipse(-7, -77, 8, 4); g.fillEllipse(7, -77, 8, 4);
      g.fillStyle(0xe4e9f3, 1); g.fillRect(-17, -57, 34, 5); g.fillStyle(0xd73a4b, 1); g.fillRect(-17, -51, 34, 4);
      // Round shield, held to the side.
      g.fillStyle(0xc72f42, 1); g.fillCircle(-dir * 29, -45, 18); g.fillStyle(0xe8edf5, 1); g.fillCircle(-dir * 29, -45, 13); g.fillStyle(0x226eb1, 1); g.fillCircle(-dir * 29, -45, 8); this.drawStar(g, -dir * 29, -45, 4, 0xffffff);
    }
    // Foot shadows and small floor glow.
    g.fillStyle(0x030711, 0.4); g.fillEllipse(0, 1, 54, 9);
    if (this.isBlocking) { g.lineStyle(4, 0x63cfff, 0.8); g.strokeCircle(-dir * 24, -47, 24); }
  }

  private drawStar(g: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, color: number): void {
    const points: Phaser.Geom.Point[] = [];
    for (let i = 0; i < 10; i++) { const r = i % 2 === 0 ? radius : radius * 0.45; const a = -Math.PI / 2 + i * Math.PI / 5; points.push(new Phaser.Geom.Point(x + Math.cos(a) * r, y + Math.sin(a) * r)); }
    g.fillStyle(color, 1); g.fillPoints(points, true);
  }
}

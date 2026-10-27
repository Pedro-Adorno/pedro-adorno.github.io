import Phaser from 'phaser';
import { MAX_PARTICLES } from '../config/gameConfig';

export class Effects {
  private scene: Phaser.Scene;
  private activeParticles = 0;
  constructor(scene: Phaser.Scene) { this.scene = scene; }

  impact(x: number, y: number, color = 0xffd166, amount = 8): void {
    this.scene.cameras.main.shake(65, 0.0025);
    for (let i = 0; i < amount && this.activeParticles < MAX_PARTICLES; i++) {
      const p = this.scene.add.circle(x, y, Phaser.Math.Between(2, 4), color, 0.95).setDepth(20);
      this.activeParticles++;
      this.scene.tweens.add({ targets: p, x: x + Phaser.Math.Between(-42, 42), y: y + Phaser.Math.Between(-45, 25), alpha: 0, scale: 0.1, duration: Phaser.Math.Between(180, 350), onComplete: () => { p.destroy(); this.activeParticles--; } });
    }
  }

  damageNumber(x: number, y: number, damage: number, color = '#ffffff'): void {
    const label = this.scene.add.text(x, y, `-${damage}`, { fontFamily: 'Barlow Condensed, sans-serif', fontSize: '25px', fontStyle: 'bold', color, stroke: '#07101f', strokeThickness: 4 }).setOrigin(0.5).setDepth(30);
    this.scene.tweens.add({ targets: label, y: y - 48, alpha: 0, duration: 760, ease: 'Cubic.easeOut', onComplete: () => label.destroy() });
  }

  line(fromX: number, fromY: number, toX: number, toY: number, color: number, duration = 180): void {
    const g = this.scene.add.graphics().setDepth(18);
    g.lineStyle(3, color, 0.9); g.lineBetween(fromX, fromY, toX, toY);
    this.scene.tweens.add({ targets: g, alpha: 0, duration, onComplete: () => g.destroy() });
  }

  projectile(fromX: number, fromY: number, toX: number, toY: number, color: number, onHit: () => void, shield = false): void {
    const node = this.scene.add.container(fromX, fromY).setDepth(25);
    const g = this.scene.add.graphics();
    if (shield) {
      g.fillStyle(0xc92f43, 1); g.fillCircle(0, 0, 15); g.fillStyle(0xf0f3fa, 1); g.fillCircle(0, 0, 10); g.fillStyle(0x286bb0, 1); g.fillCircle(0, 0, 6);
      g.fillStyle(0xffffff, 1); g.fillPoints(Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5; const r = i % 2 === 0 ? 5 : 2.3; return new Phaser.Geom.Point(Math.cos(a) * r, Math.sin(a) * r); }), true);
    } else {
      g.lineStyle(4, color, 1); g.strokeCircle(0, 0, 5); g.lineStyle(2, 0xffffff, 0.9); g.lineBetween(-4, 0, 4, 0);
    }
    node.add(g);
    const duration = Math.max(150, Phaser.Math.Distance.Between(fromX, fromY, toX, toY) * (shield ? 1.1 : 1.5));
    this.scene.tweens.add({ targets: node, x: toX, y: toY, angle: shield ? 540 : 0, duration, ease: 'Sine.easeInOut', onComplete: () => { node.destroy(); onHit(); } });
  }
}

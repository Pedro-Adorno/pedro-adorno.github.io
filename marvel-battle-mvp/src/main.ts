import Phaser from 'phaser';
import { BattleScene } from './game/scenes/BattleScene';
import './style.css';

const scene = new BattleScene();
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-root',
  width: 960,
  height: 450,
  backgroundColor: '#080d1a',
  antialias: true,
  render: { pixelArt: false, roundPixels: false, powerPreference: 'high-performance' },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 960, height: 450 },
  fps: { target: 60, forceSetTimeOut: false },
  scene: [scene],
});

const menu = document.getElementById('menu-overlay');
const result = document.getElementById('result-overlay');
const play = document.getElementById('play-button');
const again = document.getElementById('again-button');
const controls = document.getElementById('controls-panel');
const hud = document.getElementById('battle-hud');

function start(): void {
  menu?.classList.add('hidden');
  result?.classList.add('hidden');
  controls?.classList.remove('hidden');
  hud?.classList.remove('hidden');
  scene.startBattle();
}
play?.addEventListener('click', start);
again?.addEventListener('click', start);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !menu?.classList.contains('hidden')) return;
});

window.addEventListener('beforeunload', () => game.destroy(true));

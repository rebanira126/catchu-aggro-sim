// 全デッキのひとり回しの要約（ターンごとの成功率／成功時の平均点、1T目に2以上残した割合）
// 使い方：node match/tools/solo-all.mjs [回数=1000] [ターン数=6] > before.json  （JSONで出す。比べるときは diff-solo.mjs）
import { loadDbNode } from '../engine/load-node.js';
import { EFFECTS } from '../cards/index.js';
import { BUILTIN_DECKS } from '../decks/index.js';
import { playSolo } from '../engine/index.js';
import { Game } from '../engine/game.js';

const [nArg, tArg] = process.argv.slice(2);
const N = +nArg || 1000, T = +tArg || 6;
const db = loadDbNode();
let left1 = null;
const orig = Game.prototype.normalPhase;
Game.prototype.normalPhase = function (P) {
  orig.call(this, P);
  if (P === this.p[0] && this.turn === 1) left1 = P.energy.active;
};
const out = {};
for (const deck of BUILTIN_DECKS) {
  const acc = Array.from({ length: T }, () => ({ ok: 0, sum: 0 }));
  let l1 = 0;
  for (let i = 1; i <= N; i++) {
    const g = playSolo({ db, effects: EFFECTS, deck, seed: i * 7919, turns: T, soloMaxP: 0.7 });
    if (left1 >= 2) l1++;
    g.p[0].turnLog.forEach((r, k) => { if (r.ok) { acc[k].ok++; acc[k].sum += r.score; } });
  }
  out[deck.id] = { name: `${deck.type}｜${deck.name}`, left1: l1 / N, turns: acc.map(a => ({ ok: a.ok / N, avg: a.ok ? a.sum / a.ok : 0 })) };
}
console.log(JSON.stringify(out));

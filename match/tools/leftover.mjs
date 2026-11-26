// ひとり回しで、メインフェイズの終わりにアクティブなエネルギーが何枚残っているかを数える
// 「残しているのに、まだ出せるメンバーが手札にあった」場面を、改善の手がかりとして拾う
// 使い方：node match/tools/leftover.mjs [回数=300] [ターン数=4] [残りの下限=2] [デッキID（省略で全部）]
import { loadDbNode } from '../engine/load-node.js';
import { EFFECTS } from '../cards/index.js';
import { BUILTIN_DECKS } from '../decks/index.js';
import { playSolo } from '../engine/index.js';
import { Game } from '../engine/game.js';

const [nArg, tArg, mArg, only] = process.argv.slice(2);
const N = +nArg || 300, T = +tArg || 4, MIN = +mArg || 2;
const db = loadDbNode();

// メインフェイズの直後の様子を記録する
let rec = null;
const orig = Game.prototype.normalPhase;
Game.prototype.normalPhase = function (P) {
  orig.call(this, P);
  if (!rec || P !== this.p[0] || this.turn > T) return;
  const left = P.energy.active;
  // 手札から、空いている枠に出せる／上のコストにバトンタッチできるメンバー
  const plays = [];
  P.hand.forEach(c => {
    if (c.def.kind !== 'M') return;
    for (let a = 0; a < 3; a++) {
      if (!this.canTarget(P, a)) continue;
      const s = P.stage[a];
      if (s && c.def.cost <= s.card.def.cost) continue;
      const cost = this.playCost(P, c, a, !!s);
      if (cost <= left) { plays.push(`${c.def.name}[${c.def.id}](${c.def.cost})${s ? "←" + s.card.def.name + "[" + s.card.def.id + "](" + s.card.def.cost + ")" : "空き"}`); break; }
    }
  });
  rec.push({ t: this.turn, left, E: P.energy.n, stage: P.stage.map(x => (x ? x.card.def.cost : 0)).join('-'), hand: P.hand.filter(c => c.def.kind === 'M').length, plays });
};

const decks = only ? BUILTIN_DECKS.filter(d => d.id === only) : BUILTIN_DECKS;
for (const deck of decks) {
  const byT = Array.from({ length: T + 1 }, () => ({ n: 0, cnt: 0, can: 0, sum: 0, ex: {} }));
  for (let i = 1; i <= N; i++) {
    rec = [];
    playSolo({ db, effects: EFFECTS, deck, seed: i * 7919, turns: T });
    for (const r of rec) {
      const B = byT[r.t]; B.n++;
      if (r.left < MIN) continue;
      B.cnt++; B.sum += r.left;
      if (r.plays.length) { B.can++; const k = r.plays[0]; B.ex[k] = (B.ex[k] || 0) + 1; }
    }
  }
  rec = null;
  console.log(`\n■ ${deck.type}｜${deck.name}（${deck.id}・${N}回）`);
  for (let t = 1; t <= T; t++) {
    const B = byT[t];
    const top = Object.entries(B.ex).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, v]) => `${k}×${v}`).join(' ');
    console.log(`${t}T ${MIN}以上残し ${(B.cnt / N * 100).toFixed(0).padStart(3)}%（平均${B.cnt ? (B.sum / B.cnt).toFixed(1) : '-'}）｜うち出せるメンバーあり ${(B.can / N * 100).toFixed(0).padStart(3)}% ${top}`);
  }
}

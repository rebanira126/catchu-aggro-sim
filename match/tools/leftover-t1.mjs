// 1T目にエネルギーを2以上残した場面の中身を見る（マリガン前後の手札、出したカード、残った手札）
// 使い方：node match/tools/leftover-t1.mjs [デッキID] [回数=300] [表示する件数=5]
import { loadDbNode } from '../engine/load-node.js';
import { EFFECTS } from '../cards/index.js';
import { BUILTIN_DECKS } from '../decks/index.js';
import { playSolo } from '../engine/index.js';
import { Game } from '../engine/game.js';

const [id, nArg, sArg] = process.argv.slice(2);
const N = +nArg || 300, SHOW = sArg == null ? 5 : +sArg;
const db = loadDbNode();
const deck = BUILTIN_DECKS.find(d => d.id === id);
if (!deck) throw new Error(`デッキがありません: ${id}`);

let hit = null, mull = null;
const origSetup = Game.prototype.setup;
Game.prototype.setup = function () {
  const pol = this.p[0].policy, m = pol.mulligan;
  pol.mulligan = v => { const back = m(v) || []; mull = { before: v.hand.map(c => c.def), back: back.map(i => v.hand[i].def) }; return back; };
  return origSetup.call(this);
};
const orig = Game.prototype.normalPhase;
Game.prototype.normalPhase = function (P) {
  orig.call(this, P);
  if (P === this.p[0] && this.turn === 1) hit = { left: P.energy.active, hand: P.hand.map(c => c.def), stage: P.stage.map(x => x && x.card.def) };
};

const lab = d => `${d.name}[${d.id}]${d.kind === 'L' ? '(ライブ)' : `(${d.cost})`}`;
const pattern = {};
let shown = 0, cnt = 0, mullLow = 0, mullNone = 0;
const mullBack = {};
for (let i = 1; i <= N; i++) {
  hit = null;
  const seed = i * 7919;
  playSolo({ db, effects: EFFECTS, deck, seed, turns: 1 });
  if (!hit || hit.left < 2) continue;
  cnt++;
  // 残った手札のメンバーのコストの形で分類
  const costs = hit.hand.filter(d => d.kind === 'M').map(d => d.cost).sort((a, b) => a - b);
  const key = `残${hit.left} 盤面${hit.stage.map(d => (d ? d.cost : 0)).join('-')} 手札メンバー[${costs.join(',')}] ライブ${hit.hand.filter(d => d.kind === 'L').length}`;
  pattern[key] = (pattern[key] || 0) + 1;
  // マリガンで戻したカードに、1Tに出せたメンバー（コスト4以下）があったか
  const backLow = mull.back.filter(d => d.kind === 'M' && d.cost <= 4);
  if (backLow.length) { mullLow++; for (const d of backLow) mullBack[lab(d)] = (mullBack[lab(d)] || 0) + 1; }
  if (!mull.back.length) mullNone++;
  if (shown < SHOW) {
    shown++;
    const g = playSolo({ db, effects: EFFECTS, deck, seed, turns: 1, trace: true });
    console.log(`\n--- seed ${seed}（残り${hit.left}）`);
    for (const l of g.logs) if (l.p === 0 && l.turn <= 1 && ['mull', 'hand', 'play', 'eff', 'efh', 'efr', 'turn'].includes(l.kind)) {
      console.log(`${l.turn || 0}T [${l.kind}] ${l.msg}`);
      for (const it of l.items || []) console.log(`      ・${it}`);
    }
    console.log('  残った手札:', hit.hand.map(lab).join(' / '));
  }
}
console.log(`\n■ ${deck.name}：1T目に2以上残し ${cnt}/${N}（${(cnt / N * 100).toFixed(1)}%）`);
console.log(`  マリガンで4コスト以下のメンバーを戻していた：${mullLow}回 ${Object.entries(mullBack).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + '×' + v).join(' ')}`);
console.log(`  マリガンで1枚も戻さなかった：${mullNone}回`);
if (process.env.PATTERN) for (const [k, v] of Object.entries(pattern).sort((a, b) => b[1] - a[1])) console.log(`  ${v}回 ${k}`);

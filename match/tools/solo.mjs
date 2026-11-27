// デッキのひとり回し：ターンごとのライブ成功率と成功時の平均点、点数の分布
// ライブは「成功の見込みが50%以上の中で一番点数の高い組み合わせ」を置く（環境変数 SOLO_MAXP で変えられる。off なら対戦と同じ選び方）
// 使い方：node match/tools/solo.mjs [デッキID] [回数=1000] [ターン数=6] [trace=seed番号]
// 入れ替え案：環境変数 SOLO_VARIANT に vs.mjs と同じモジュール（export default deck => deck）を渡せる
import { loadDbNode } from '../engine/load-node.js';
import { EFFECTS } from '../cards/index.js';
import { BUILTIN_DECKS } from '../decks/index.js';
import { playSolo } from '../engine/index.js';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const [id = 'niji-hibure-kento', nArg, tArg, traceSeed] = process.argv.slice(2);
const N = +nArg || 1000, T = +tArg || 6;
let deck = BUILTIN_DECKS.find(d => d.id === id);
if (!deck) throw new Error(`デッキがありません: ${id}`);
if (process.env.SOLO_VARIANT) deck = (await import(pathToFileURL(path.resolve(process.env.SOLO_VARIANT)).href)).default({ ...deck, list: deck.list.map(x => x.slice()) });
const db = loadDbNode();
const soloMaxP = process.env.SOLO_MAXP === 'off' ? null : process.env.SOLO_MAXP ? +process.env.SOLO_MAXP : 0.5;
if (traceSeed) {
  const g = playSolo({ db, effects: EFFECTS, deck, seed: +traceSeed, turns: T, trace: true, soloMaxP });
  for (const l of g.logs) if (l.p === 0) {
    console.log(`${l.turn}T ${'  '.repeat(l.depth || 0)}[${l.kind}] ${l.msg}`);
    for (const it of l.items || []) console.log(`${l.turn}T ${'  '.repeat((l.depth || 0) + 1)}・${it}`);
  }
  process.exit(0);
}
const acc = Array.from({ length: T }, () => ({ ok: 0, sum: 0, dist: {} }));
const boards = Array.from({ length: T }, () => ({}));
for (let i = 1; i <= N; i++) {
  const g = playSolo({ db, effects: EFFECTS, deck, seed: i * 7919, turns: T, soloMaxP });
  const P = g.p[0];
  P.turnLog.forEach((r, k) => { if (r.ok) { acc[k].ok++; acc[k].sum += r.score; acc[k].dist[r.score] = (acc[k].dist[r.score] || 0) + 1; } });
  (P.stageLog || []).forEach((s, k) => { if (k < T) boards[k][s.s] = (boards[k][s.s] || 0) + 1; });
}
console.log(`${deck.name}（${N}回）`);
for (let t = 0; t < T; t++) {
  const a = acc[t];
  const dist = Object.entries(a.dist).sort((x, y) => +x[0] - +y[0]).map(([s, n]) => `${s}点${Math.round(n / N * 100)}%`).join(' ');
  const top = Object.entries(boards[t]).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([s, n]) => `${s}(${Math.round(n / N * 100)}%)`).join(' ');
  console.log(`${t + 1}T 成功${Math.round(a.ok / N * 100)}% 平均${(a.ok ? a.sum / a.ok : 0).toFixed(1)}点 | ${dist} | 盤面 ${top}`);
}

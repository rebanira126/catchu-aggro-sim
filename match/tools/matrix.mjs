// 組み込みデッキの総当たり（複数のコアで回す）
//   node tools/matrix.mjs [1組の試合数=400] [結果のJSONを書くファイル]
//   使うコアの数：既定はコア数−1。環境変数 SIM_THREADS で指定できる
import fs from 'node:fs';
import { BUILTIN_DECKS } from '../decks/index.js';
import { createNodePool } from '../engine/pool-node.js';
import { plainDeck } from '../engine/jobs.js';

const [n0, out] = process.argv.slice(2);
const n = +n0 || 400;
const decks = BUILTIN_DECKS.map(plainDeck);
const pool = createNodePool();
const t0 = Date.now();
const jobs = [];
for (let i = 0; i < decks.length; i++) for (let j = i + 1; j < decks.length; j++) jobs.push({ i, j, p: pool.run({ kind: 'match', a: decks[i], b: decks[j], n }) });
const W = decks.map(() => decks.map(() => null));
let done = 0;
for (const x of jobs) {
  const r = await x.p;
  W[x.i][x.j] = r.win / r.n; W[x.j][x.i] = r.loss / r.n;
  process.stderr.write(`\r${++done}/${jobs.length}`);
}
await pool.close();
process.stderr.write('\n');
const avg = W.map((row, i) => row.filter((v, j) => j !== i).reduce((a, b) => a + b, 0) / (decks.length - 1));
const order = decks.map((d, i) => i).sort((x, y) => avg[y] - avg[x]);
console.log('| デッキ | 平均 |');
console.log('|---|---|');
for (const i of order) console.log(`| ${decks[i].name} | ${(avg[i] * 100).toFixed(1)}% |`);
console.log(`\n（${decks.length}デッキ・${jobs.length}組・1組${n}試合・${pool.size}コア・${((Date.now() - t0) / 1000).toFixed(0)}秒）`);
if (out) fs.writeFileSync(out, JSON.stringify({ n, decks: decks.map(d => ({ id: d.id, name: d.name })), win: W, avg }, null, 1));

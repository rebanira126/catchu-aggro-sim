// 1つのデッキを、ほかの組み込みデッキ全部と戦わせる（複数のコアで回す）
//   node tools/vs.mjs <デッキID> [1組の試合数=400] [入れ替え案のモジュール]
//   入れ替え案のモジュール：export default (deck) => deck（デッキを書き換えて返す関数）
//   使うコアの数：既定はコア数−1。環境変数 SIM_THREADS で指定できる
import { BUILTIN_DECKS } from '../decks/index.js';
import { createNodePool } from '../engine/pool-node.js';
import { plainDeck } from '../engine/jobs.js';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const [id, n0, vp] = process.argv.slice(2);
const n = +n0 || 400;
let a = BUILTIN_DECKS.find(d => d.id === id);
if (!a) { console.error('デッキが見つかりません：' + id); process.exit(1); }
a = plainDeck(a);
if (vp) a = (await import(pathToFileURL(path.resolve(vp)).href)).default(structuredClone(a));
const pool = createNodePool();
const t0 = Date.now();
const opps = BUILTIN_DECKS.filter(d => d.id !== id);
const res = await Promise.all(opps.map(o => pool.run({ kind: 'match', a, b: plainDeck(o), n })));
await pool.close();
let tot = 0;
const row = res.map((r, i) => { const w = r.win / r.n; tot += w; return `${opps[i].id}:${(w * 100).toFixed(0)}`; });
console.log(row.join(' '), '| 平均', (tot / opps.length * 100).toFixed(1));
console.log(`（${pool.size}コア・${((Date.now() - t0) / 1000).toFixed(0)}秒）`);

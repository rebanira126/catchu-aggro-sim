// 旧CatChu!シミュレーター（リポジトリ直下の index.html）と、新しいエンジンのひとり回しを比べる
// 使い方：node match/tools/compare-old.mjs [デッキID=catchu-basic] [回数=2000]
// 出すもの：ターンごとのライブ成功率と成功時の平均点、1→4→7（成功した順に1点以上→4点以上→7点以上）の割合
import fs from 'node:fs';
import vm from 'node:vm';
import { loadDbNode } from '../engine/load-node.js';
import { EFFECTS } from '../cards/index.js';
import { BUILTIN_DECKS } from '../decks/index.js';
import { playSolo } from '../engine/index.js';

const id = process.argv[2] || 'catchu-basic';
const N = +process.argv[3] || 2000;
const T = 5;
const deck = BUILTIN_DECKS.find(d => d.id === id);
if (!deck) throw new Error(`デッキがありません: ${id}`);

// 旧シミュレーターのコードを index.html から取り出して動かす
const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const sim = html.match(/<script id="simsrc" type="text\/plain">([\s\S]*?)<\/script>/)[1];
const dbLine = html.match(/\nconst DB=\[[^\n]*\];/)[0];
const ctx = { console, Math, Set, Map, JSON, Array, Object, String, Number };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(dbLine + '\n' + sim + '\n;globalThis.__x={DB,makeCard,Game,DEFAULT_PARAMS,mulberry32};', ctx);
const X = ctx.__x;

const blank = () => ({ turns: Array.from({ length: T }, () => ({ ok: 0, sum: 0 })), pace: 0 });
const pace = ss => ss.length >= 3 && ss[0] >= 1 && ss[1] >= 4 && ss[2] >= 7;

// 旧
const old = blank();
{
  const byNo = new Map(X.DB.map(r => [r[0], r]));
  const cards = [];
  for (const [no, n] of deck.list) for (let k = 0; k < n; k++) cards.push(X.makeCard(byNo.get(no)));
  const rnd = X.mulberry32(12345);
  for (let i = 0; i < N; i++) {
    const g = new X.Game(cards, rnd, Object.assign({}, X.DEFAULT_PARAMS));
    g.run(T);
    let prev = 0;
    const ss = [];
    for (const [t, tot] of g.succLog) { const s = tot - prev; prev = tot; old.turns[t - 1].ok++; old.turns[t - 1].sum += s; ss.push(s); }
    if (pace(ss)) old.pace++;
  }
}

// 新
const now = blank();
{
  const db = loadDbNode();
  for (let i = 1; i <= N; i++) {
    const g = playSolo({ db, effects: EFFECTS, deck, seed: i * 7919, turns: T });
    const ss = [];
    g.p[0].turnLog.forEach((r, k) => { if (r.ok) { now.turns[k].ok++; now.turns[k].sum += r.score; ss.push(r.score); } });
    if (pace(ss)) now.pace++;
  }
}

const pct = x => `${Math.round(x / N * 100)}%`.padStart(4);
const avg = t => (t.ok ? t.sum / t.ok : 0).toFixed(1);
console.log(`${deck.name}（${N}回）`);
console.log('ターン  旧：成功率/平均点   新：成功率/平均点');
for (let t = 0; t < T; t++) console.log(`${t + 1}T      ${pct(old.turns[t].ok)} / ${avg(old.turns[t])}        ${pct(now.turns[t].ok)} / ${avg(now.turns[t])}`);
console.log(`1→4→7  ${pct(old.pace)}               ${pct(now.pace)}`);

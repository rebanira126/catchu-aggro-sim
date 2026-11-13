// 動作確認：node match/test/smoke.mjs
import fs from 'node:fs';
import { EFFECTS } from '../cards/index.js';
import { BUILTIN_DECKS } from '../decks/index.js';
import { playOne, makeMatchRunner, makeSoloRunner } from '../engine/index.js';
import { meet } from '../engine/hearts.js';

const db = JSON.parse(fs.readFileSync(new URL('../data/cards.json', import.meta.url)));
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('NG:', m); } };

// ハート判定
ok(meet({ c: [0, 0, 3, 0, 0, 0, 0], all: 0, gen: 0 }, [2, 0, 1, 0, 0, 0, 0]), '赤3で赤1+無色2');
ok(!meet({ c: [0, 0, 3, 0, 0, 0, 0], all: 0, gen: 0 }, [0, 0, 0, 1, 0, 0, 0]), '赤3で黄1は無理');
ok(meet({ c: [0, 0, 0, 0, 0, 0, 0], all: 1, gen: 0 }, [0, 0, 0, 1, 0, 0, 0]), 'ALLで黄1');
ok(!meet({ c: [0, 0, 0, 0, 0, 0, 0], all: 0, gen: 3 }, [0, 1, 0, 0, 0, 0, 0]), '無色3で桃1は無理');

// デッキの形
for (const d of BUILTIN_DECKS) {
  let m = 0, l = 0;
  for (const [id, n] of d.list) { const c = db[id]; ok(c, `${d.id}: ${id} が無い`); if (!c) continue; if (c.kind === 'L') l += n; else m += n; ok(n <= 4, `${d.id}: ${id} が5枚以上`); }
  ok(m === 48 && l === 12, `${d.id}: メンバー${m}・ライブ${l}`);
}

// 1試合とログ
const [A, B] = [BUILTIN_DECKS.find(d => d.id === 'catchu-basic'), BUILTIN_DECKS.find(d => d.id === 'muse-bokuhika')];
const g = playOne({ db, effects: EFFECTS, a: A, b: B, seed: 3, trace: true });
ok(g.result && g.turn > 0, '1試合が終わる');
console.log(g.logs.slice(0, 30).map(x => `${x.turn}T ${x.p == null ? '' : g.p[x.p].name} [${x.kind}] ${x.msg}`).join('\n'));
console.log('結果', g.result);

// ひとり回し
for (const d of BUILTIN_DECKS) {
  const r = makeSoloRunner({ db, effects: EFFECTS, deck: d, turns: 6 });
  const t0 = Date.now(); const acc = r.step(200);
  console.log(d.id.padEnd(14), acc.turns.map(T => `${(T.ok / acc.n * 100).toFixed(0)}%/${T.ok ? (T.scoreSum / T.ok).toFixed(1) : '-'}`).join('  '), `${Date.now() - t0}ms`);
}

// 対戦
const run = makeMatchRunner({ db, effects: EFFECTS, a: A, b: B });
const t0 = Date.now(); const acc = run.step(400);
console.log('CatChu基本形 vs 僕光', acc, `${Date.now() - t0}ms`);

console.log(fail ? `NG ${fail}件` : 'すべてOK');
process.exit(fail ? 1 : 0);

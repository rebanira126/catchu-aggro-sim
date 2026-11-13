// 新弾レポート：node match/tools/report.mjs [--update]
// ・data/known-ids.json（前回まで取り込んだカード番号）に無いカードを「新カード」として出す
// ・効果の組み込み状況（効果なし／番号で対応／文章で対応／未実装）を数える
// ・--update で今のカード番号を known-ids.json に書き戻す
import fs from 'node:fs';
import { loadDbNode } from '../engine/load-node.js';
import { effectStatus } from '../cards/index.js';

const KNOWN = new URL('../data/known-ids.json', import.meta.url);
const db = loadDbNode();
const known = fs.existsSync(KNOWN) ? new Set(JSON.parse(fs.readFileSync(KNOWN, 'utf8')).ids) : new Set();
const LABEL = { none: '効果なし', id: '対応済み（番号）', text: '対応済み（文章）', todo: '未実装' };

const all = Object.values(db);
const count = st => all.filter(d => effectStatus(d) === st).length;
console.log(`カード ${all.length}種類：` + Object.keys(LABEL).map(k => `${LABEL[k]} ${count(k)}`).join('／'));

const fresh = all.filter(d => !known.has(d.id));
if (!known.size) console.log('known-ids.json がまだありません（--update で作ります）');
else if (!fresh.length) console.log('新カードはありません');
else {
  console.log(`新カード ${fresh.length}種類：`);
  for (const d of fresh) console.log(`- ${d.id} ${d.name}（${d.kind === 'L' ? 'ライブ' : 'メンバー'}）：${LABEL[effectStatus(d)]}`);
}

// 未実装の効果を、同じ文章ごとにまとめて多い順に（文章で登録すると一度に片付く）
const todo = {};
for (const d of all) if (effectStatus(d) === 'todo') (todo[d.text] ||= []).push(d.id);
const top = Object.entries(todo).sort((a, b) => b[1].length - a[1].length).slice(0, 10);
console.log('\n未実装で多い効果（上位10）：');
for (const [t, ids] of top) console.log(`- ${ids.length}枚：${t.replace(/\n/g, ' ').slice(0, 70)}…`);

if (process.argv.includes('--update')) {
  const ids = all.map(d => d.id).sort();
  fs.writeFileSync(KNOWN, JSON.stringify({ updated: new Date().toISOString().slice(0, 10), ids }, null, 0) + '\n');
  console.log(`\nknown-ids.json を更新しました（${ids.length}種類）`);
}

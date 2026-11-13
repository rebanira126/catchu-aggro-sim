// rabuka_cards.json（公式カードリストを全件取得したもの）から、
// シミュレーター用の軽いカードデータ match/data/cards.json を作る。
// 使い方: node match/tools/build-cards.mjs <rabuka_cards.json のパス>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const src = process.argv[2];
if (!src) {
  console.error('使い方: node match/tools/build-cards.mjs <rabuka_cards.json>');
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync(src, 'utf8'));

// ハートの色の並び（必要ハートの h 配列と同じ順）: 0=無色 1=桃 2=赤 3=黄 4=緑 5=青 6=紫
const COLOR = { 桃: 1, 赤: 2, 黄: 3, 緑: 4, 青: 5, 紫: 6 };

// カード番号からレアリティを外した「基本番号」。PL!N-bp3-L-030-L → PL!N-bp3-030
export function canonicalId(no) {
  const p = no.split('-');
  while (p.length && !/^\d{3}$/.test(p[p.length - 1])) p.pop();
  let id = p.join('-');
  id = id.replace(/-(?!PR-)(?:[A-Z]+\d?|SEC|SECL|RM)-(\d{3})$/, '-$1');
  return id;
}

// ブレードハート表記（"赤1" "ALL1" "無2" "-" など）を {c: 色番号|'all'|'gen', n: 個数} に
function parseBladeHeart(s) {
  if (!s || s === '-') return null;
  if (s.startsWith('ALL') || s.includes('全ブレード')) return { c: 'all', n: parseInt(s.replace(/\D/g, '') || '1', 10) };
  const m = s.match(/^(桃|赤|黄|緑|青|紫|無|橙)(\d+)$/);
  if (!m) return null;
  if (m[1] === '無') return { c: 'gen', n: +m[2] };
  if (m[1] === '橙') return { c: 'all', n: +m[2] }; // 表記ゆれ。色が特定できないためALL扱い
  return { c: COLOR[m[1]], n: +m[2] };
}

const out = {};
for (const c of raw) {
  if (c.kind === 'エネルギー') continue;
  const id = canonicalId(c.no);
  if (out[id]) continue; // パラレル違いは最初の1枚だけ
  const groups = (c.group || '').split('/').filter(Boolean);
  const names = c.name.split('&').map(s => s.trim());
  const base = { id, name: c.name, names, groups, unit: c.unit || null, text: c.text && c.text !== '-' ? c.text : '' };
  if (c.kind === 'メンバー') {
    out[id] = {
      ...base, kind: 'M',
      cost: parseInt(c.cost, 10) || 0,
      hearts: c.h.slice(1).map(x => parseInt(x, 10) || 0), // [桃,赤,黄,緑,青,紫]
      blades: parseInt(c.attack, 10) || 0,
      bh: parseBladeHeart(c.blade_heart),
    };
  } else if (c.kind === 'ライブ') {
    out[id] = {
      ...base, kind: 'L',
      score: parseInt(c.blade_heart, 10) || 0,
      need: c.h.map(x => parseInt(x, 10) || 0), // [無色,桃,赤,黄,緑,青,紫]
      bh: parseBladeHeart(c.attack),
      icon: c.cost === 'ドロー' ? 'draw' : c.cost === 'スコア' ? 'score' : null,
    };
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
const dest = path.join(here, '..', 'data', 'cards.json');
fs.writeFileSync(dest, JSON.stringify(out));
console.log(`${Object.keys(out).length}種類のカードを書き出しました → ${dest}`);

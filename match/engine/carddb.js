// rabuka_cards.json（公式カードリストを全件取得したもの）を、シミュレーターで使う形に変える。
// ブラウザでもnodeでも同じ処理を使う。新弾が出たら rabuka_cards.json を置き換えるだけでよい。
import { canonicalId } from './recipe.js';

// ハートの色の並び（必要ハートの h 配列と同じ順）: 0=無色 1=桃 2=赤 3=黄 4=緑 5=青 6=紫
const COLOR = { 桃: 1, 赤: 2, 黄: 3, 緑: 4, 青: 5, 紫: 6 };

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

const num = x => parseInt(x, 10) || 0;

// 効果の文章を比べるときの形（前後の空白と改行のゆれをそろえる）
export function normText(t) {
  return String(t || '').replace(/\r/g, '').split('\n').map(s => s.trim()).filter(Boolean).join('\n');
}

export function buildDb(raw) {
  const db = {};
  for (const c of raw) {
    if (c.kind === 'エネルギー') continue;
    const id = canonicalId(c.no);
    if (db[id]) continue; // パラレル違いは最初の1枚だけ
    const base = {
      id, name: c.name,
      names: c.name.split('&').map(s => s.trim()),
      groups: (c.group || '').split('/').filter(Boolean),
      unit: c.unit || null,
      exp: c.exp || '',
      text: c.text && c.text !== '-' ? normText(c.text) : '',
    };
    if (c.kind === 'メンバー') {
      db[id] = { ...base, kind: 'M', cost: num(c.cost), hearts: c.h.slice(1).map(num), blades: num(c.attack), bh: parseBladeHeart(c.blade_heart) };
    } else if (c.kind === 'ライブ') {
      db[id] = {
        ...base, kind: 'L', score: num(c.blade_heart), need: c.h.map(num), bh: parseBladeHeart(c.attack),
        icon: c.cost === 'ドロー' ? 'draw' : c.cost === 'スコア' ? 'score' : null,
      };
    }
  }
  return db;
}

// カード効果の登録表。
// ・BY_ID：カード番号で登録（そのカードだけの効果）
// ・BY_TEXT：効果の文章で登録（同じ文章のカードは全部これで動く）
// どちらにも無いカードは、コスト・ハート・ブレードなどの数値だけで動く。
import liella from './liella.js';
import common from './common.js';

export const BY_ID = Object.assign({}, liella);
export const BY_TEXT = Object.assign({}, common);

export function resolveEffect(def) {
  return BY_ID[def.id] || (def.text && BY_TEXT[def.text]) || null;
}

// 効果の組み込み状況：none=効果なし、id=番号で対応、text=文章で対応、todo=未実装
export function effectStatus(def) {
  if (!def.text || /^[(（][^]*[)）]$/.test(def.text)) return 'none'; // 注意書きだけのカードは効果なし
  if (BY_ID[def.id]) return 'id';
  if (BY_TEXT[def.text]) return 'text';
  return 'todo';
}

// 以前の書き方との互換
export const EFFECTS = resolveEffect;

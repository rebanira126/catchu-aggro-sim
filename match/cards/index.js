// カード効果の登録表。グループごとのファイルをまとめる。
// ここに載っていないカードは、コスト・ハート・ブレードなどの数値だけで動く。
import liella from './liella.js';

export const EFFECTS = Object.assign({}, liella);

// 効果が組み込まれているか（デッキとカードの画面で使う）
export function effectStatus(def) {
  if (!def.text) return 'none'; // 効果なし
  return EFFECTS[def.id] ? 'done' : 'todo';
}

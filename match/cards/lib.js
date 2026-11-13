// カード効果を書くときの共通の道具
export const inGroup = (def, g) => def.groups.includes(g);
export const inUnit = (def, u) => def.unit === u;

// ステージにいる、条件に合うメンバーの「名前の種類」の数
export function distinctNames(me, pred) {
  const names = new Set();
  for (const s of me.stage) if (s && pred(s.card.def)) for (const n of s.card.def.names) names.add(n);
  return names.size;
}

// エネルギーを n 枚までアクティブにする
export function activateEnergy(me, n) {
  me.energy.active = Math.min(me.energy.n, me.energy.active + n);
}

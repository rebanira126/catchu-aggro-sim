// ハートの集計と、必要ハートを満たせるかの判定（総合ルール 2.11.3 / 8.3.14〜8.3.15）
// 色番号: 1=桃 2=赤 3=黄 4=緑 5=青 6=紫。0 は「無色」（必要ハート側の色指定なし）。

export const COLOR_NAMES = ['無色', '桃', '赤', '黄', '緑', '青', '紫'];

// ハートの山。c[1..6] は色つきハート、all は好きな色にできるハート、gen は色のないハート
export function emptyPool() {
  return { c: [0, 0, 0, 0, 0, 0, 0], all: 0, gen: 0 };
}

export function clonePool(p) {
  return { c: p.c.slice(), all: p.all, gen: p.gen };
}

export function poolTotal(p) {
  let s = p.all + p.gen;
  for (let i = 1; i <= 6; i++) s += p.c[i];
  return s;
}

// メンバーのハート [桃,赤,黄,緑,青,紫] を足す
export function addHearts(pool, hearts, times = 1) {
  for (let i = 0; i < 6; i++) pool.c[i + 1] += hearts[i] * times;
}

// ブレードハート {c, n} を足す
export function addBladeHeart(pool, bh) {
  if (!bh) return;
  if (bh.c === 'all') pool.all += bh.n;
  else if (bh.c === 'gen') pool.gen += bh.n;
  else pool.c[bh.c] += bh.n;
}

// 必要ハート need=[無色,桃,赤,黄,緑,青,紫] を満たせるなら、使った後の山を返す。満たせなければ null
export function meet(pool, need) {
  const p = clonePool(pool);
  for (let i = 1; i <= 6; i++) {
    const want = need[i] || 0;
    if (!want) continue;
    const use = Math.min(p.c[i], want);
    p.c[i] -= use;
    const lack = want - use;
    if (lack > p.all) return null;
    p.all -= lack;
  }
  let rest = need[0] || 0;
  if (rest > poolTotal(p)) return null;
  // 無色の要求は、色のないハート → 余っている色ハート（多い色から）→ ALL の順で使う
  const g = Math.min(p.gen, rest); p.gen -= g; rest -= g;
  while (rest > 0) {
    let best = 0;
    for (let i = 1; i <= 6; i++) if (p.c[i] > (best ? p.c[best] : 0)) best = i;
    if (!best) break;
    const take = Math.min(p.c[best], rest);
    p.c[best] -= take; rest -= take;
  }
  if (rest > 0) { p.all -= rest; rest = 0; }
  return p;
}

// 複数のライブを順に満たせるか。並び順を変えてどれか1つでも通ればOK（最大3枚なので全通り試す）
export function meetAll(pool, needs) {
  const idx = needs.map((_, i) => i);
  for (const order of permutations(idx)) {
    let p = pool;
    let ok = true;
    for (const i of order) {
      p = meet(p, needs[i]);
      if (!p) { ok = false; break; }
    }
    if (ok) return { ok: true, order, rest: p };
  }
  return { ok: false };
}

function permutations(a) {
  if (a.length <= 1) return [a];
  const out = [];
  for (let i = 0; i < a.length; i++) {
    const rest = a.slice(0, i).concat(a.slice(i + 1));
    for (const r of permutations(rest)) out.push([a[i], ...r]);
  }
  return out;
}

export function needTotal(need) {
  return need.reduce((s, x) => s + (x || 0), 0);
}

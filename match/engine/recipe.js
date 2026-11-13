// レシピの文字列とカード番号の扱い
// カード番号からレアリティを外す。PL!SP-bp1-005-P → PL!SP-bp1-005、PL!N-bp3-L-030-L → PL!N-bp3-030
export function canonicalId(no) {
  const p = String(no).trim().split('-');
  while (p.length && !/^\d{3}$/.test(p[p.length - 1])) p.pop();
  return p.join('-').replace(/-(?!PR-)(?:[A-Z]+\d?|SEC|SECL|RM)-(\d{3})$/, '-$1');
}

// 「カード番号 枚数」を1行ずつ。# 以降はメモ。PL!SP- などの頭は省略しない
export function parseRecipe(text, db) {
  const map = new Map();
  const errors = [];
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const m = line.match(/^(\S+)\s*[x×*]?\s*(\d+)?\s*$/i);
    if (!m) { errors.push(`読めない行：${raw}`); continue; }
    const id = canonicalId(m[1]);
    const n = parseInt(m[2] || '1', 10);
    if (!db[id]) { errors.push(`カードが見つからない：${m[1]}`); continue; }
    map.set(id, (map.get(id) || 0) + n);
  }
  return { list: [...map.entries()], errors };
}

export function recipeText(list, db) {
  return list.map(([id, n]) => `${id} ${n}  # ${db[id] ? db[id].name : '?'}`).join('\n');
}

// デッキの決まり（60枚＝メンバー48・ライブ12、同じ番号は4枚まで、ポイント9まで）
export function checkDeck(list, db, points = {}, limit = 9) {
  let m = 0, l = 0, pt = 0;
  const issues = [];
  for (const [id, n] of list) {
    const c = db[id];
    if (!c) continue;
    if (c.kind === 'L') l += n; else m += n;
    if (n > 4) issues.push(`${c.name}（${id}）が${n}枚`);
    pt += (points[id] || 0) * n;
  }
  if (m !== 48) issues.push(`メンバーが${m}枚（48枚必要）`);
  if (l !== 12) issues.push(`ライブが${l}枚（12枚必要）`);
  if (pt > limit) issues.push(`ポイントが${pt}（${limit}まで）`);
  return { members: m, lives: l, points: pt, ok: issues.length === 0, issues };
}

// 標準のプレイ方針（どのデッキでも使える簡単な判断）
// デッキファイルの strategy で、マリガン・メインフェイズ・ライブの出し方を上書きできる。
import { emptyPool, addHearts, addBladeHeart, meetAll, needTotal, poolTotal } from './hearts.js';

// メンバー1人の「強さ」の目安：ハートの数＋ブレードの数（ブレードはエールの枚数）
// デッキごとの「優先したいメンバー」（strategy.prefer）：{ unit, ids, w }。手札の評価・マリガン・入れ替えで少し高く見る
export function preferBonus(me, def) {
  const pf = me && me.prefer;
  if (!pf || def.kind !== 'M') return 0;
  let b = 0;
  if (pf.unit && def.unit === pf.unit) b += pf.w ?? 1;
  if (pf.ids && pf.ids.includes(def.id)) b += pf.idW ?? pf.w ?? 1;
  return b;
}

export function memberValue(def) {
  return def.hearts.reduce((a, b) => a + b, 0) + def.blades;
}

function stageValue(stage) {
  return stage.reduce((s, x) => s + (x ? memberValue(x.def) : 0), 0);
}

// ---------------- マリガン ----------------
export function defaultMulligan(v, opt = {}) {
  const keepCost = opt.keepCost ?? 4;
  const maxLives = opt.maxLives ?? 1;
  const maxNeed = opt.maxNeed ?? 99; // 必要ハートがこれより多いライブは戻す
  const hand = v.hand;
  const back = [];
  hand.forEach((c, i) => { if (c.def.kind === 'L' && needTotal(c.def.need) > maxNeed) back.push(i); });
  // 必要ハートの少ないライブから maxLives 枚だけ残す
  const lives = hand.map((c, i) => ({ c, i })).filter(x => x.c.def.kind === 'L' && needTotal(x.c.def.need) <= maxNeed)
    .sort((a, b) => needTotal(a.c.def.need) - needTotal(b.c.def.need));
  lives.forEach((x, k) => { if (k >= maxLives) back.push(x.i); });
  hand.forEach((c, i) => { if (c.def.kind === 'M' && c.def.cost > keepCost) back.push(i); });
  // コスト2以下のメンバーは maxLow 枚まで残す（多いと序盤にライブを引けないため）
  if (opt.maxLow != null) {
    hand.map((c, i) => ({ c, i })).filter(x => x.c.def.kind === 'M' && x.c.def.cost <= 2)
      .sort((a, b) => memberValue(b.c.def) + preferBonus(v.me, b.c.def) - memberValue(a.c.def) - preferBonus(v.me, a.c.def))
      .forEach((x, k) => { if (k >= opt.maxLow) back.push(x.i); });
  }
  return back;
}

// ---------------- メインフェイズ ----------------
// 手札のメンバーを最大3回まで出す組み合わせを全部試し、ステージの合計の強さが一番高くなるものを選ぶ。
// 同じ強さならエネルギーが多く残る方。
export function defaultMain(api, opt = {}) {
  const { g, me } = api;
  useAbilities(api);
  // 1枚出すごとに組み直す（登場時の効果で手札が変わるため）。出す予定の残りのカードは捨てないよう me.reserved に入れておく
  for (let k = 0; k < 4; k++) {
    const plan = bestPlays(g, me, opt);
    if (!plan.length) break;
    const step = firstStep(g, me, plan);
    const idx = me.hand.findIndex(c => c.uid === step.uid);
    if (idx < 0) break;
    me.reserved = new Set(plan.filter(x => x !== step).map(x => x.uid));
    const ok = api.play(idx, step.area, true, step.area2 ?? null);
    me.reserved = null;
    if (!ok) break;
    // 出したあとに使えるようになる起動能力（入れ替え先が控え室にある、など）
    useAbilities(api);
  }
}

// 先に出すカード：登場時に手札を見る・引く効果のあるメンバーを先に（結果を見て組み直せるように）
function firstStep(g, me, plan) {
  const rank = st => {
    const c = me.hand.find(x => x.uid === st.uid);
    const ef = c && g.effect(c);
    return ef && ef.onEnter ? 0 : 1;
  };
  return plan.slice().sort((a, b) => rank(a) - rank(b))[0];
}

// 起動能力：効果側の ai(ctx) が true を返したら使う（使うと盤面が変わるので1つずつ確認）
export function useAbilities(api) {
  const { g, me } = api;
  for (let guard = 0; guard < 8; guard++) {
    let used = false;
    for (let area = 0; area < 3 && !used; area++) {
      const s = me.stage[area];
      if (!s) continue;
      g.abilities(s).forEach(({ ab }, k) => {
        if (used || !ab.ai) return;
        const ctx = { g, me, opp: g.opp(me), card: s.card, slot: s, area };
        if (ab.ai(ctx) && api.activate(area, k)) used = true;
      });
    }
    if (!used) break;
  }
}

export function bestPlays(g, me, opt = {}) {
  const value = opt.value || memberValue;
  const energy = me.energy.active;
  const stage0 = me.stage.map(s => (s ? { def: s.card.def, locked: s.enteredTurn === g.turn, slot: s } : null));
  const handM = me.hand.filter(c => c.def.kind === 'M');
  const cands = [{ stage: stage0, left: energy, plan: [] }];
  const seen = new Map();
  const dfs = (stage, left, used, plan) => {
    if (plan.length >= 3) return;
    for (let a = 0; a < 3; a++) {
      const s = stage[a];
      if (s && s.locked) continue;
      if (s && s.slot && !g.canTarget(me, a)) continue;
      const tried = new Set();
      for (const c of handM) {
        if (used.has(c.uid) || tried.has(c.def.id)) continue;
        tried.add(c.def.id);
        // 2人とバトンタッチできるカード：もう1つのエリアも空ける
        const ce = g.effect(c);
        if (ce && ce.doubleBaton && s) {
          for (let a2 = 0; a2 < 3; a2++) {
            const s2 = stage[a2];
            if (a2 === a || !s2 || s2.locked || (s2.slot && !g.canTarget(me, a2))) continue;
            const cost2 = Math.max(0, g.costOf(me, c) - s.def.cost - s2.def.cost);
            if (cost2 > left) continue;
            const ns2 = stage.slice(); ns2[a] = { def: c.def, locked: true, card: c }; ns2[a2] = null;
            const key2 = ns2.map(x => (x ? x.def.id : '-')).join('|') + '#' + (left - cost2);
            if (seen.has(key2)) continue;
            const np2 = plan.concat([{ uid: c.uid, area: a, area2: a2 }]);
            const cand2 = { stage: ns2, left: left - cost2, plan: np2 };
            seen.set(key2, cand2); cands.push(cand2);
            used.add(c.uid); dfs(ns2, left - cost2, used, np2); used.delete(c.uid);
          }
        }
        let cost = g.costOf(me, c);
        if (s && cost > 0) cost = Math.max(0, cost - s.def.cost);
        if (cost > left) continue;
        const ns = stage.slice(); ns[a] = { def: c.def, locked: true, card: c };
        const key = ns.map(x => (x ? x.def.id : '-')).join('|') + '#' + (left - cost);
        const np = plan.concat([{ uid: c.uid, area: a }]);
        // 同じ盤面・同じ残りエネルギーになる手順は、使うカードが少ない方だけ残す
        const prev = seen.get(key);
        if (prev && prev.plan.length <= np.length) continue;
        if (prev) { prev.plan = np; prev.stage = ns; }
        else { const cand = { stage: ns, left: left - cost, plan: np }; seen.set(key, cand); cands.push(cand); }
        used.add(c.uid);
        dfs(ns, left - cost, used, np);
        used.delete(c.uid);
      }
    }
  };
  dfs(stage0, energy, new Set(), []);
  for (const c of cands) {
    c.v = stageValue2(c.stage, value);
    c.u = 0;
    // ユニットの名前の種類を揃えると強くなるデッキ用（例：CatChu!のディストーション）
    if (opt.unitBonus) {
      const names = new Set();
      for (const x of c.stage) if (x && x.def.unit === opt.unitBonus.unit) x.def.names.forEach(n => names.add(n));
      c.u = opt.unitBonus.w * names.size;
    }
  }
  // 盤面の強さだけで選ぶ（ライブを見ない）
  const byValue = (a, b) => (b.v + b.u) - (a.v + a.u) || b.left - a.left;
  cands.sort(byValue);
  const lives = me.hand.filter(c => c.def.kind === 'L');
  // 登場時効果の価値（効果側の aiBonus：サーチで足りないカードを探しに行く、など）
  const bonusOf = c => c.plan.reduce((sum, st) => {
    const card = me.hand.find(x => x.uid === st.uid);
    const ef = card && g.effect(card);
    return sum + (ef && ef.aiBonus ? ef.aiBonus({ g, me, card, area: st.area }) || 0 : 0);
  }, 0);
  const useLive = opt.liveAware !== false && lives.length > 0;
  const top = cands.slice(0, opt.topK ?? 30);
  const w = opt.liveWeight ?? 3;
  let best = null;
  for (const c of top) {
    const ev = useLive ? withStage(me, c.stage, g, () => bestLiveSet(g, me, lives, opt.samples ?? 16, opt.minP ?? 0, opt).ev) : 0;
    // 同じくらいの盤面なら、手札を使わない方（カードを温存）を選ぶ
    const tgt = turnTarget(me, g.turn);
    const planBonus = tgt && tgt.board ? (opt.planWeight ?? 4) * boardMatch(c.stage, tgt.board) : 0;
    c.score = ev * w + c.v * (useLive ? 0.2 : 1) + c.u + planBonus + c.left * 0.01 + bonusOf(c) - (opt.playPen ?? 0) * c.plan.length;
    // 下にカードが置かれているメンバーを入れ替えると、下のカードは控え室に行く
    c.score -= (opt.underPen ?? 1.5) * underLost(me, c);
    // 次のターンに手札の大型をバトンタッチで出せる盤面か（opt.setupWeight）
    if (opt.setupWeight) c.score += opt.setupWeight * setupValue(g, me, c, opt);
    c.ev = ev;
    if (!best || c.score > best.score) best = c;
  }
  if (opt.debug) opt.debug(top);
  return best.plan;
}

// 候補の盤面で、入れ替えられて失う「下に置かれたメンバー」の枚数
function underLost(me, c) {
  let n = 0;
  me.stage.forEach((sl, a) => {
    if (!sl || !sl.under.length) return;
    const now = c.stage[a];
    if (!now || now.slot !== sl) n += sl.under.filter(u => u.def.kind === 'M').length;
  });
  return n;
}

// 次のターンに、手札の一番強い大型メンバー（コスト opt.bigCost 以上）をバトンタッチで出せるなら 1
function setupValue(g, me, c, opt) {
  const used = new Set(c.plan.map(st => st.uid));
  const bigs = me.hand.filter(x => x.def.kind === 'M' && x.def.cost >= (opt.bigCost ?? 9) && !used.has(x.uid));
  if (!bigs.length) return 0;
  const nextE = me.energy.n + 1 - (me.energy.locked || 0);
  const costs = c.stage.map(x => (x ? x.def.cost : 0));
  let best = 0;
  for (const b of bigs) {
    const bc = g.costOf(me, b);
    if (costs.some(sc => bc - sc <= nextE)) best = Math.max(best, memberValue(b.def));
  }
  return best ? 1 + best / 10 : 0;
}

// 仮の盤面に入れ替えて fn を実行する（見積もり用）
function withStage(me, stage, g, fn) {
  const real = me.stage;
  me.stage = stage.map(x => (x ? (x.slot || { card: x.card, active: true, under: [], enteredTurn: g.turn, mods: [] }) : null));
  try { return fn(); } finally { me.stage = real; }
}

// ライブの組み合わせから「成功率 × 点数」が一番高いものを選ぶ
function bestLiveSet(g, me, lives, samples, minP, opt = {}) {
  const n = Math.min(lives.length, 8);
  // 点数の進行（pace）があるときは、目標点に届く組み合わせを高く見る
  const tg = opt.pace ? opt.pace[Math.min(me.turnLog.filter(t => t.ok).length, opt.pace.length - 1)] : null;
  const est = estimateContext(g, me);
  let best = { ev: 0, p: 0, pick: [] };
  for (let mask = 1; mask < (1 << n); mask++) {
    const pick = lives.slice(0, n).filter((_, k) => mask & (1 << k));
    if (pick.length > 3) continue;
    if (!comboAllowed(g, pick.map(c => c.def.id), opt)) continue;
    const st = {};
    const p = successRate(g, me, pick, est, samples, st);
    if (p < minP) continue;
    const sc = pick.reduce((s, c) => s + previewScore(g, me, c), 0) + (st.adj || 0);
    let ev = p * (tg != null && sc >= tg ? sc + (opt.paceBonus ?? 4) : sc);
    if (planLives(g, me, pick.map(c => c.def.id))) ev *= opt.planLiveBonus ?? 1.6;
    if (ev > best.ev + 1e-9 || (Math.abs(ev - best.ev) < 1e-9 && pick.length < best.pick.length)) best = { ev, p, pick };
  }
  return best;
}

function stageValue2(stage, value) {
  return stage.reduce((s, x) => s + (x ? value(x.def) : 0), 0);
}

// ---------------- ライブの出し方 ----------------
// 手札のライブの組み合わせ（最大3枚）ごとに、残りデッキから何回かエールを試して成功率を見積もり、
// 「成功率 × 点数」が一番高い組み合わせを出す。成功率が低すぎるときは出さない。
export function defaultSetLives(v, opt = {}) {
  const { g, me } = v;
  const samples = opt.samples ?? 40;
  const minP = opt.minP ?? 0.45;
  const lives = me.hand.map((c, i) => ({ c, i })).filter(x => x.c.def.kind === 'L');
  // これまでに成功したライブの数（ひとり回しでも数えられるよう、ターンの記録から数える）
  const succ = me.turnLog.filter(t => t.ok).length;
  const combos = [];
  const n = Math.min(lives.length, 8);
  for (let mask = 1; mask < (1 << n); mask++) {
    const pick = lives.slice(0, n).filter((_, k) => mask & (1 << k));
    if (pick.length > 3) continue;
    if (!comboAllowed(g, pick.map(x => x.c.def.id), opt)) continue;
    combos.push(pick);
  }
  const est = combos.length ? estimateContext(g, me) : null;
  let best = null;
  for (const pick of combos) {
    const st = {};
    const p = successRate(g, me, pick.map(x => x.c), est, samples, st);
    const score = pick.reduce((s, x) => s + previewScore(g, me, x.c), 0) + (st.adj || 0);
    if (opt.pace) {
      // 点数の進行（例：1→4→7）に合わせる：目標に届く中で一番小さい点数、届かなければ一番大きい点数
      const tg = opt.pace[Math.min(succ, opt.pace.length - 1)];
      const th = g.turn <= 1 && opt.th1 != null ? opt.th1 : (succ === opt.pace.length - 1 && score >= tg && opt.thLast != null ? opt.thLast : minP);
      if (p < th || p <= 0) continue;
      const key = score >= tg ? 1000 - score : score;
      if (!best || key > best.key || (key === best.key && p > best.p + 1e-9)) best = { key, p, score, pick };
      continue;
    }
    let ev = p * score;
    if (p < minP) continue;
    // そのターンに置きたい組み合わせなら高く見る
    if (planLives(g, me, pick.map(x => x.c.def.id))) ev *= opt.planLiveBonus ?? 1.6;
    if (!best || ev > best.ev + 1e-9 || (Math.abs(ev - best.ev) < 1e-9 && pick.length < best.pick.length)) best = { ev, p, score, pick };
  }
  const out = best ? best.pick.map(x => x.i) : [];
  // 空いた枠に不要なメンバーを伏せて、同じ枚数を引き直す（ライブでないカードは控え室へ行く）
  if (opt.fill && out.length < 3) {
    const keep = protectedCards(g, me, opt);
    const cand = me.hand.map((c, i) => ({ c, i }))
      .filter(x => x.c.def.kind === 'M' && !keep.has(x.c.uid) && x.c.def.cost <= (opt.fillMaxCost ?? 99))
      .sort((a, b) => handVal(a.c, me) - handVal(b.c, me));
    for (const x of cand) { if (out.length >= 3) break; out.push(x.i); }
  }
  return out;
}

// 手札の並べ替え用のおおまかな価値
function handVal(c, me) {
  const d = c.def;
  if (d.kind === 'M' && me) return 2 + (d.cost >= 9 ? 0.2 : 0) + d.hearts.reduce((a, b) => a + b, 0) * 0.2 + d.blades * 0.1 + preferBonus(me, d) * 0.5;
  if (d.kind === 'L') return 3 + d.score * 0.3;
  return 2 + (d.cost >= 9 ? 0.2 : 0) + d.hearts.reduce((a, b) => a + b, 0) * 0.2 + d.blades * 0.1;
}

// 入れ替えに使わずに残すカード：次に出す中コストの一番いい1枚と、序盤は大型の一番いい1枚
export function protectedCards(g, me, opt = {}) {
  const keep = new Set();
  const mid = opt.midCost ?? 5;
  const ms = me.hand.filter(c => c.def.kind === 'M');
  if (g.turn <= (opt.protTurns ?? (me.prefer && me.prefer.protTurns) ?? 3)) {
    const m5 = ms.filter(c => c.def.cost >= 3 && c.def.cost <= mid).sort((a, b) => handVal(b, me) - handVal(a, me));
    if (m5[0]) keep.add(m5[0].uid);
  }
  // ターンごとの目標の盤面に必要なメンバー（次の2ターン分）を残す
  for (const t of [g.turn + 1, g.turn + 2]) {
    const tgt = turnTarget(me, t);
    if (!tgt || !tgt.board) continue;
    const want = tgt.board[0].map(x => (typeof x === 'number' ? { cost: x } : x));
    const onStage = me.stage.filter(Boolean).map(x => x.card.def);
    for (const it of want) {
      const match = d => (it.id ? d.id === it.id : d.cost === it.cost);
      if (onStage.some(match)) continue;
      const c = ms.filter(x => match(x.def) && !keep.has(x.uid)).sort((a, b) => memberValue(b.def) - memberValue(a.def))[0];
      if (c) keep.add(c.uid);
    }
  }
  // ステージの空き枠を次のターンに埋めるための低コストのメンバー
  const empty = me.stage.filter(x => !x).length;
  if (empty && opt.protFill !== false) {
    const low = ms.filter(c => c.def.cost <= 2 && !keep.has(c.uid)).sort((a, b) => memberValue(b.def) - memberValue(a.def));
    low.slice(0, empty).forEach(c => keep.add(c.uid));
  }
  // 決めの大きいライブ（strategy.prefer.bigLive 点以上）は2ターン目から1枚残す
  const bl = me.prefer && me.prefer.bigLive;
  if (bl && g.turn >= 2) {
    const L = me.hand.filter(c => c.def.kind === 'L' && c.def.score >= bl).sort((a, b) => b.def.score - a.def.score);
    if (L[0]) keep.add(L[0].uid);
  }
  if (g.turn <= 2) {
    const big = ms.filter(c => c.def.cost >= 9).sort((a, b) => memberValue(b.def) - memberValue(a.def) || b.def.blades - a.def.blades);
    if (big[0]) keep.add(big[0].uid);
  }
  return keep;
}

// ---------------- ターンごとの目標（strategy.turnPlan） ----------------
// turnPlan: { 4: { board: [[13, 13, 2]], lives: [['ライブ番号', 'ライブ番号']] }, ... }
//  board：目標の盤面（候補を複数書ける）。要素はコストの数か {cost, id, area}（area 0=左 1=センター 2=右）
//  lives：そのターンに置きたいライブの組み合わせ（候補を複数書ける）
// ひとり回しでも対戦でも、自分のターン数（g.turn）で引く
export function turnTarget(me, turn) {
  const tp = me && me.turnPlan;
  if (!tp) return null;
  return tp[turn] || null;
}

// 盤面がどれだけ目標に近いか（0〜1）。候補のうち一番近いもので測る
export function boardMatch(stage, board) {
  if (!board || !board.length) return 0;
  let best = 0;
  for (const want of board) {
    const items = want.map(x => (typeof x === 'number' ? { cost: x } : x));
    const used = new Set();
    let hit = 0;
    // 位置の指定があるものから先に合わせる
    const order = items.slice().sort((a, b) => (b.area != null) - (a.area != null));
    for (const it of order) {
      const ok = (x, a) => x && (it.id ? x.def.id === it.id : x.def.cost === it.cost) && (it.area == null || it.area === a);
      const a = stage.findIndex((x, i) => !used.has(i) && ok(x, i));
      if (a >= 0) { used.add(a); hit++; }
    }
    best = Math.max(best, hit / items.length);
  }
  return best;
}

// 決まった組み合わせでしか置かないライブ（opt.onlyCombos）
// 例：{ 'MIRACLE WAVEの番号': [{ turn: 4, with: ['Guilty Nightの番号'] }, { turn: 5, with: ['恋アクの番号'] }] }
// そのライブを含む組み合わせは、指定のターンに、指定のライブと「ちょうどその組み合わせ」のときだけ置く
function planLives(g, me, ids) {
  const t = turnTarget(me, g.turn);
  if (!t || !t.lives) return false;
  const key = ids.slice().sort().join('|');
  return t.lives.some(l => l.slice().sort().join('|') === key);
}

function comboAllowed(g, ids, opt) {
  const rules = opt.onlyCombos;
  if (!rules) return true;
  for (const id of ids) {
    const list = rules[id];
    if (!list) continue;
    const others = ids.filter((x, i) => i !== ids.indexOf(id)).sort().join('|');
    if (!list.some(r => r.turn === g.turn && r.with.slice().sort().join('|') === others)) return false;
  }
  return true;
}

function previewScore(g, me, card) {
  const ef = g.effect(card);
  const live = { card, need: g.liveNeed(me, card), bonus: 0 };
  if (ef && ef.preview) ef.preview({ g, me, opp: g.opp(me), card, live });
  return card.def.score + live.bonus;
}

export function estimateContext(g, me) {
  const pool = emptyPool();
  let blades = 0;
  me.stage.forEach((s, area) => {
    if (!s) return;
    const { h, all } = g.heartsOf(me, s, area);
    addHearts(pool, h); pool.all += all;
    if (s.active) blades += g.bladesOf(me, s, area);
  });
  // デッキの中身は分かるが順番は分からないので、残りデッキ（＋控え室）からランダムに引いて試す
  const unknown = me.deck.length >= blades ? me.deck : me.deck.concat(me.waiting);
  return { pool, blades, unknown };
}

// 成功率を見積もる。stats を渡すと、成功したときの点数の増減（効果の successAdjust）の平均を stats.adj に入れる
export function successRate(g, me, cards, est, samples, stats = null) {
  let extra = 0; // 効果で増えるエールの枚数（live.cheer）
  const adjusters = [];
  const needs = cards.map(card => {
    const ef = g.effect(card);
    const live = { card, need: g.liveNeed(me, card), bonus: 0, cheer: 0 };
    if (ef && ef.preview) ef.preview({ g, me, opp: g.opp(me), card, live });
    if (ef && ef.successAdjust) adjusters.push({ ef, card });
    extra += live.cheer;
    return live.need;
  });
  const arr = est.unknown;
  const blades = est.blades + extra;
  if (stats) stats.adj = 0;
  const judge = (pool, cheer) => {
    const res = meetAll(pool, needs);
    if (res.ok && stats && adjusters.length) {
      const excess = poolTotal(res.rest);
      for (const { ef, card } of adjusters) stats.adj += ef.successAdjust({ g, me, card, excess, cheer }) || 0;
    }
    return res.ok;
  };
  if (!arr.length || blades === 0) {
    const ok = judge(est.pool, []) ? 1 : 0;
    return ok;
  }
  let ok = 0;
  const idx = arr.map((_, i) => i);
  for (let s = 0; s < samples; s++) {
    const pool = { c: est.pool.c.slice(), all: est.pool.all, gen: est.pool.gen };
    // 部分シャッフルで blades 枚を選ぶ
    const n = Math.min(blades, arr.length);
    const cheer = [];
    for (let k = 0; k < n; k++) {
      const j = k + Math.floor(g.rng() * (idx.length - k));
      [idx[k], idx[j]] = [idx[j], idx[k]];
      addBladeHeart(pool, arr[idx[k]].def.bh);
      cheer.push(arr[idx[k]]);
    }
    if (judge(pool, cheer)) ok++;
  }
  if (stats && ok) stats.adj /= ok;
  return ok / samples;
}

// 標準方針をまとめたもの。deck.strategy で一部を差し替えられる
export function makePolicy(strategy = {}) {
  return {
    mulligan: v => ((v.me.prefer = strategy.prefer || null), (v.me.turnPlan = strategy.turnPlan || null), strategy.mulligan ? strategy.mulligan(v, defaultMulligan) : defaultMulligan(v, strategy.mulliganOpt)),
    // ライブの点数の進行（pace）は、盤面づくりでも同じ目標を使う
    main: api => (strategy.main ? strategy.main(api, defaultMain) : defaultMain(api, { pace: strategy.liveOpt && strategy.liveOpt.pace, onlyCombos: strategy.liveOpt && strategy.liveOpt.onlyCombos, ...strategy.mainOpt })),
    setLives: v => (strategy.setLives ? strategy.setLives(v, defaultSetLives) : defaultSetLives(v, strategy.liveOpt)),
    chooseSuccess: (v, zone) => (strategy.chooseSuccess ? strategy.chooseSuccess(v, zone) : 0),
  };
}

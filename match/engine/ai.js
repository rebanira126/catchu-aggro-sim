// 標準のプレイ方針（どのデッキでも使える簡単な判断）
// デッキファイルの strategy で、マリガン・メインフェイズ・ライブの出し方を上書きできる。
import { emptyPool, addHearts, addBladeHeart, meetAll, needTotal } from './hearts.js';

// メンバー1人の「強さ」の目安：ハートの数＋ブレードの数（ブレードはエールの枚数）
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
  const hand = v.hand;
  const back = [];
  // 必要ハートの少ないライブから maxLives 枚だけ残す
  const lives = hand.map((c, i) => ({ c, i })).filter(x => x.c.def.kind === 'L')
    .sort((a, b) => needTotal(a.c.def.need) - needTotal(b.c.def.need));
  lives.forEach((x, k) => { if (k >= maxLives) back.push(x.i); });
  hand.forEach((c, i) => { if (c.def.kind === 'M' && c.def.cost > keepCost) back.push(i); });
  return back;
}

// ---------------- メインフェイズ ----------------
// 手札のメンバーを最大3回まで出す組み合わせを全部試し、ステージの合計の強さが一番高くなるものを選ぶ。
// 同じ強さならエネルギーが多く残る方。
export function defaultMain(api, opt = {}) {
  const { g, me } = api;
  const plan = bestPlays(g, me, opt);
  for (const step of plan) {
    const idx = me.hand.findIndex(c => c.uid === step.uid);
    if (idx < 0) break;
    if (!api.play(idx, step.area, true)) break;
  }
}

export function bestPlays(g, me, opt = {}) {
  const value = opt.value || memberValue;
  const energy = me.energy.active;
  const stage0 = me.stage.map(s => (s ? { def: s.card.def, locked: s.enteredTurn === g.turn } : null));
  const handM = me.hand.filter(c => c.def.kind === 'M');
  let best = { score: stageValue2(stage0, value), left: energy, plan: [] };
  const seen = new Set();
  const dfs = (stage, left, used, plan) => {
    if (plan.length >= 3) return;
    for (let a = 0; a < 3; a++) {
      const s = stage[a];
      if (s && s.locked) continue;
      const tried = new Set();
      for (const c of handM) {
        if (used.has(c.uid) || tried.has(c.def.id)) continue;
        tried.add(c.def.id);
        let cost = g.costOf(me, c);
        if (s && cost > 0) cost = Math.max(0, cost - s.def.cost);
        if (cost > left) continue;
        const ns = stage.slice(); ns[a] = { def: c.def, locked: true };
        const key = ns.map(x => (x ? x.def.id : '-')).join('|') + '#' + (left - cost);
        if (seen.has(key)) continue;
        seen.add(key);
        const np = plan.concat([{ uid: c.uid, area: a }]);
        const sc = stageValue2(ns, value);
        if (sc > best.score || (sc === best.score && left - cost > best.left)) best = { score: sc, left: left - cost, plan: np };
        used.add(c.uid);
        dfs(ns, left - cost, used, np);
        used.delete(c.uid);
      }
    }
  };
  dfs(stage0, energy, new Set(), []);
  return best.plan;
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
  if (!lives.length) return [];
  const combos = [];
  const n = lives.length;
  for (let mask = 1; mask < (1 << n); mask++) {
    const pick = lives.filter((_, k) => mask & (1 << k));
    if (pick.length > 3) continue;
    combos.push(pick);
  }
  const est = estimateContext(g, me);
  let best = null;
  for (const pick of combos) {
    const p = successRate(g, me, pick.map(x => x.c), est, samples);
    const score = pick.reduce((s, x) => s + previewScore(g, me, x.c), 0);
    const ev = p * score;
    if (p < minP) continue;
    if (!best || ev > best.ev + 1e-9 || (Math.abs(ev - best.ev) < 1e-9 && pick.length < best.pick.length)) best = { ev, p, score, pick };
  }
  return best ? best.pick.map(x => x.i) : [];
}

function previewScore(g, me, card) {
  const ef = g.effect(card);
  const live = { card, need: card.def.need.slice(), bonus: 0 };
  if (ef && ef.preview) ef.preview({ g, me, card, live });
  return card.def.score + live.bonus;
}

function estimateContext(g, me) {
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

function successRate(g, me, cards, est, samples) {
  const needs = cards.map(card => {
    const ef = g.effect(card);
    const live = { card, need: card.def.need.slice(), bonus: 0 };
    if (ef && ef.preview) ef.preview({ g, me, card, live });
    return live.need;
  });
  const arr = est.unknown;
  if (!arr.length || est.blades === 0) {
    return meetAll(est.pool, needs).ok ? 1 : 0;
  }
  let ok = 0;
  const idx = arr.map((_, i) => i);
  for (let s = 0; s < samples; s++) {
    const pool = { c: est.pool.c.slice(), all: est.pool.all, gen: est.pool.gen };
    // 部分シャッフルで blades 枚を選ぶ
    const n = Math.min(est.blades, arr.length);
    for (let k = 0; k < n; k++) {
      const j = k + Math.floor(g.rng() * (idx.length - k));
      [idx[k], idx[j]] = [idx[j], idx[k]];
      addBladeHeart(pool, arr[idx[k]].def.bh);
    }
    if (meetAll(pool, needs).ok) ok++;
  }
  return ok / samples;
}

// 標準方針をまとめたもの。deck.strategy で一部を差し替えられる
export function makePolicy(strategy = {}) {
  return {
    mulligan: v => (strategy.mulligan ? strategy.mulligan(v, defaultMulligan) : defaultMulligan(v, strategy.mulliganOpt)),
    main: api => (strategy.main ? strategy.main(api, defaultMain) : defaultMain(api, strategy.mainOpt)),
    setLives: v => (strategy.setLives ? strategy.setLives(v, defaultSetLives) : defaultSetLives(v, strategy.liveOpt)),
    chooseSuccess: (v, zone) => (strategy.chooseSuccess ? strategy.chooseSuccess(v, zone) : 0),
  };
}

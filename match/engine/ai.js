// 標準のプレイ方針（どのデッキでも使える簡単な判断）
// デッキファイルの strategy で、マリガン・メインフェイズ・ライブの出し方を上書きできる。
import { emptyPool, addHearts, addBladeHeart, meetAll, needTotal, poolTotal } from './hearts.js';
import { AREAS, cardLabel } from './game.js';

export const UTIL_LIVE = 6, UTIL_ENERGY = 4;
const RE_LIVE_REC = /控え室から.{0,20}ライブカードを.{0,6}手札に加える/;
const RE_ENERGY = /エネルギーを.{0,6}アクティブにする|エネルギーデッキから.{0,20}置く/;
export function utilityOf(def) {
  if (!def || def.kind !== 'M') return { live: false, energy: false };
  if (!def._util) def._util = { live: RE_LIVE_REC.test(def.text || ''), energy: RE_ENERGY.test(def.text || '') };
  return def._util;
}


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
  if (opt.keep) return keepListMulligan(v, opt.keep);
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

// マリガンを「残すカードの優先リスト」で決める（noteのキープ基準をそのまま書く用）
// keep: [{ ids: ['番号',...] | cost: 4 | costMin/costMax | live: true, n: 残す枚数 }, ...]  上から順に、合うカードを n 枚まで残す
function keepListMulligan(v, keep) {
  const hand = v.hand;
  const kept = new Set();
  // 控え室に送りたいカードは1枚残す（1ターン目からライブ置き場に伏せて控え室へ送る）
  const tw = v.me.prefer && v.me.prefer.toWaiting;
  if (tw) { const i = hand.findIndex(c => tw.includes(c.def.id)); if (i >= 0) kept.add(i); }
  const groupLeft = {}; // 同じ group のルールは残す枚数を共有する（「AかBのどちらか1枚」）
  for (const rule of keep) {
    // ifKept：それより上のルールで1枚以上残せたときだけ使う（例：5コストか恋がある手札だけ、ほかのカードも残す）
    if (rule.ifKept && kept.size === 0) continue;
    // ifGroups：書いたグループをどれも残せたときだけ使う（例：15エマ・9コスト・4コストがそろったときだけライブを1枚残す）
    if (rule.ifGroups && !rule.ifGroups.every(gr => groupLeft[gr] === 0)) continue;
    if (rule.group != null && groupLeft[rule.group] == null) groupLeft[rule.group] = rule.n ?? 1;
    let n = rule.group != null ? groupLeft[rule.group] : rule.n ?? 1;
    const hit = c => {
      const d = c.def;
      if (rule.ids && !rule.ids.includes(d.id)) return false;
      if (rule.live != null && (d.kind === 'L') !== rule.live) return false;
      if (rule.cost != null && (d.kind !== 'M' || d.cost !== rule.cost)) return false;
      if (rule.costMin != null && (d.kind !== 'M' || d.cost < rule.costMin)) return false;
      if (rule.costMax != null && (d.kind !== 'M' || d.cost > rule.costMax)) return false;
      return true;
    };
    hand.forEach((c, i) => { if (n > 0 && !kept.has(i) && hit(c)) { kept.add(i); n--; } });
    if (rule.group != null) groupLeft[rule.group] = n;
  }
  return hand.map((_, i) => i).filter(i => !kept.has(i));
}

// ---------------- メインフェイズ ----------------
// 手札のメンバーを最大3回まで出す組み合わせを全部試し、ステージの合計の強さが一番高くなるものを選ぶ。
// 同じ強さならエネルギーが多く残る方。
export function defaultMain(api, opt = {}) {
  const { g, me } = api;
  const logStart = g.trace ? g.logs.length : 0;
  me.candRound = 0;
  try { mainBody(api, opt); } finally { if (g.trace) groupCandidates(g, me, logStart); }
}

// ログ：メインフェイズの盤面候補を、最後に作った盤面の下にまとめる（一段下げる）
function groupCandidates(g, me, start) {
  const cands = [];
  for (let i = g.logs.length - 1; i >= start; i--) if (g.logs[i].kind === 'cand') cands.unshift(g.logs.splice(i, 1)[0]);
  g.log(me, 'board', `作った盤面（アクティブなエネルギー残り${me.energy.active}枚／全部で${me.energy.n}枚）`, 0, me.stage.map((s, a) => `${AREAS[a]}：${s ? cardLabel(s.card) : 'なし'}`));
  for (const c of cands) { c.depth = (c.depth || 0) + 1; g.logs.push(c); }
}

function mainBody(api, opt) {
  const { g, me } = api;
  // 手順（strategy.script）があるターンは、runScript がバトンタッチ先を残して起動能力を使う
  if (!(me.script && (me.script[g.turn] || []).length)) useAbilities(api);
  runScript(api);
  // 1枚出すごとに組み直す（登場時の効果で手札が変わるため）。出す予定の残りのカードは捨てないよう me.reserved に入れておく
  for (let k = 0; k < 4; k++) {
    const plan = bestPlays(g, me, opt);
    if (!plan.length) break;
    let step = firstStep(g, me, plan);
    // 今のエネルギーでは出せない（起動能力でエネルギーを起こす前提の手順）：先に起動能力を使ってみる
    if (!step) { useAbilities(api); step = firstStep(g, me, plan); }
    if (!step) break;
    const idx = me.hand.findIndex(c => c.uid === step.uid);
    if (idx < 0) break;
    me.reserved = new Set(plan.filter(x => x !== step).map(x => x.uid));
    const ok = api.play(idx, step.area, true, step.area2 ?? null);
    me.reserved = null;
    if (!ok) break;
    // 出したあとに使えるようになる起動能力（入れ替え先が控え室にある、など）
    useAbilities(api);
  }
  // メインフェイズの最後：もう出すカードが無いときに使う起動能力（ブレードを得る、ライブを拾う、など。効果側は ctx.late を見る）
  useAbilities(api, { late: true });
}

// 先に出すカード：登場時に手札を見る・引く効果のあるメンバーを先に（結果を見て組み直せるように）
function firstStep(g, me, plan) {
  const rank = st => {
    const c = me.hand.find(x => x.uid === st.uid);
    const ef = c && g.effect(c);
    return ef && ef.onEnter ? 0 : 1;
  };
  // 今のエネルギーで出せる手順だけ（起動能力で起こすエネルギーを見込んだ手順は、出せるようになってから）
  const ok = st => {
    const c = me.hand.find(x => x.uid === st.uid);
    if (!c) return false;
    let cost = g.costOf(me, c);
    const s = me.stage[st.area];
    if (s && cost > 0) cost = Math.max(0, cost - s.card.def.cost);
    if (st.area2 != null && me.stage[st.area2]) cost = Math.max(0, cost - me.stage[st.area2].card.def.cost);
    return cost <= me.energy.active;
  };
  return plan.filter(ok).sort((a, b) => rank(a) - rank(b))[0] || null;
}

// ステージのメンバーの起動能力で、このターンにまだ起こせるエネルギーの見込み（効果側の energyPotential）
function abilityPotential(g, me) {
  let n = 0;
  me.stage.forEach((s, area) => {
    if (!s) return;
    const ef = g.effect(s.card);
    if (ef && ef.energyPotential) n += ef.energyPotential({ g, me, slot: s, area }) || 0;
  });
  return Math.min(n, me.energy.n);
}

// 起動能力：効果側の ai(ctx) が true を返したら使う（使うと盤面が変わるので1つずつ確認）
export function useAbilities(api, { late = false, keep = null } = {}) {
  const { g, me } = api;
  for (let guard = 0; guard < 8; guard++) {
    let used = false;
    for (let area = 0; area < 3 && !used; area++) {
      const s = me.stage[area];
      if (!s) continue;
      // keep：このあとの手順でバトンタッチ先にするメンバー。自分を控え室に置く起動能力などで消えないよう、能力を使わない
      if (keep && keep.has(s)) continue;
      g.abilities(s).forEach(({ ab }, k) => {
        if (used || !ab.ai) return;
        const ctx = { g, me, opp: g.opp(me), card: s.card, slot: s, area, late };
        if (ab.ai(ctx) && api.activate(area, k, { late })) used = true;
      });
    }
    // 控え室にあるときだけ使える起動能力（効果側の fromWaiting：控え室からステージに登場する、など）
    if (!used) {
      const seen = new Set();
      for (const c of me.waiting.slice()) {
        if (used || seen.has(c.def.id)) continue;
        seen.add(c.def.id);
        const ef = g.effect(c);
        const fw = ef && ef.fromWaiting;
        if (!fw) continue;
        const ctx = { g, me, opp: g.opp(me), card: c, late };
        if (fw.ai(ctx) && g.runEffect(me, c, 'fromWaiting', () => fw.run(ctx)) !== false) used = true;
      }
    }
    if (!used) break;
  }
}

export function bestPlays(g, me, opt = {}) {
  const value = opt.value || memberValue;
  const energy = me.energy.active;
  // 起動能力で起こせるエネルギー（ウェイトのエネルギーがあるときだけ使える）。手順の途中で使う
  const pot0 = abilityPotential(g, me);
  const stage0 = me.stage.map(s => (s ? { def: s.card.def, locked: s.enteredTurn === g.turn, slot: s } : null));
  const handM = me.hand.filter(c => c.def.kind === 'M');
  const cands = [{ stage: stage0, left: energy, plan: [] }];
  const seen = new Map();
  const dfs = (stage, left, used, plan, pot = pot0) => {
    if (plan.length >= 3) return;
    for (let a = 0; a < 3; a++) {
      const s = stage[a];
      if (s && s.locked) continue;
      if (s && s.slot && !g.canTarget(me, a)) continue;
      if (s && s.slot && isLocked(g, me, s.slot, a)) continue; // 固定するメンバー（strategy.lock）
      const tried = new Set();
      for (const c of handM) {
        if (used.has(c.uid) || tried.has(c.def.id)) continue;
        tried.add(c.def.id);
        // 2人とバトンタッチできるカード：もう1つのエリアも空ける
        const ce = g.effect(c);
        if (ce && ce.doubleBaton && s) {
          for (let a2 = 0; a2 < 3; a2++) {
            const s2 = stage[a2];
            if (a2 === a || !s2 || s2.locked || (s2.slot && (!g.canTarget(me, a2) || isLocked(g, me, s2.slot, a2)))) continue;
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
        // 足りない分は起動能力で起こす（起こせるのはウェイトのエネルギーの数まで）
        const usePot = Math.max(0, cost - left);
        if (usePot > Math.min(pot, me.energy.n - left)) continue;
        const ns = stage.slice(); ns[a] = { def: c.def, locked: true, card: c };
        // 登場時・バトンタッチ時にエネルギーが戻る効果（refund / batonRefund）。ウェイトのエネルギーの数まで
        cost -= usePot;
        cost -= refundOf(g, me, c, s, left - cost);
        const npot = pot - usePot;
        const key = ns.map(x => (x ? x.def.id : '-')).join('|') + '#' + (left - cost) + '/' + npot;
        const np = plan.concat([{ uid: c.uid, area: a }]);
        // 同じ盤面・同じ残りエネルギーになる手順は、使うカードが少ない方だけ残す
        const prev = seen.get(key);
        if (prev && prev.plan.length <= np.length) continue;
        if (prev) { prev.plan = np; prev.stage = ns; }
        else { const cand = { stage: ns, left: left - cost, plan: np }; seen.set(key, cand); cands.push(cand); }
        used.add(c.uid);
        dfs(ns, left - cost, used, np, npot);
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
    // ライブ回収・エネルギー回復を持つメンバーを出す価値（このゲームではとても強い効果。opt.utilWeight で調整）
    const u = card ? utilityOf(card.def) : null;
    const ub = u ? (opt.utilWeight ?? 1) * ((u.live && me.waiting.some(c => c.def.kind === 'L') ? 1 : 0) + (u.energy ? 0.5 : 0)) : 0;
    return sum + ub + (ef && ef.aiBonus ? ef.aiBonus({ g, me, card, area: st.area }) || 0 : 0);
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
  if (g.trace) {
    const plays = c => c.plan.map(st => { const x = me.hand.find(h => h.uid === st.uid); return x ? `${AREAS[st.area]}に${cardLabel(x)}` : '?'; });
    me.candRound = (me.candRound || 0) + 1;
    top.slice().sort((a, b) => b.score - a.score).slice(0, 4).forEach((c, i) => {
      const ps = plays(c);
      const what = ps.length === 0 ? '出さない' : ps.length === 1 ? ps[0] : `次の${ps.length}枚を出す`;
      g.log(me, 'cand', `${me.candRound}回目の検討（使えるエネルギー${me.energy.active}枚）${i === 0 ? '◎' : '・'} ${what}：評価値${c.score.toFixed(2)}（うちライブの期待値${c.ev.toFixed(2)}）`, 0, ps.length >= 2 ? ps : null);
    });
  }
  return best.plan;
}

// 出したときに戻ってくるエネルギーの見込み（効果側の refund：登場時、batonRefund：バトンタッチで控え室に置かれる側）
function refundOf(g, me, card, prev, leftAfter) {
  let r = 0;
  const ce = g.effect(card);
  if (ce && ce.refund) r += ce.refund({ g, me, card }) || 0;
  const pc = prev && (prev.card || (prev.slot && prev.slot.card));
  const pe = pc && g.effect(pc);
  if (pe && pe.batonRefund) r += pe.batonRefund({ g, me, card: pc, newCard: card }) || 0;
  return Math.max(0, Math.min(r, me.energy.n - leftAfter));
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
  // 盤面スタッツ（ステージのハートとブレードの合計）が足りないターンはライブをしない（opt.statMin：{ ターン: 最低値 }）
  const smin = opt.statMin && opt.statMin[g.turn];
  if (smin != null && combos.length) {
    const st = boardStat(g, me);
    if (st < smin) { combos.length = 0; g.log(me, 'plan', `盤面スタッツ（ハートとブレードの合計）${st}が${smin}より少ないので、ライブを温存する`); }
    else g.log(me, 'plan', `盤面スタッツ（ハートとブレードの合計）${st}が${smin}以上なので、ライブをする`);
  }
  let est = combos.length ? estimateContext(g, me) : null;
  // エールでブレードハートの無いカードが多くめくれても成功する組み合わせを選ぶ（opt.bladeMargin：{ ターン: 外れてもよい枚数 }）
  const margin = opt.bladeMargin && opt.bladeMargin[Math.min(g.turn, Math.max(...Object.keys(opt.bladeMargin).map(Number)))];
  if (est && margin) est = { ...est, blades: Math.max(0, est.blades - margin) };
  let best = null;
  // 相手の点数の見込みがあるとき（対戦）は、相手と比べた勝ち負けで選ぶ
  const oppD = opt.oppAware === false ? null : oppDistribution(g, me);
  let bestU = null;
  for (const pick of combos) {
    const st = {};
    const p = successRate(g, me, pick.map(x => x.c), est, samples, st);
    const score = pick.reduce((s, x) => s + previewScore(g, me, x.c), 0) + (st.adj || 0);
    if (g.trace) g.listLog(me, 'est', pick.map(x => x.c), t => `ライブの候補 ${t}：成功の見込み${Math.round(p * 100)}%・成功時の点数${score.toFixed(1)}点${planLives(g, me, pick.map(x => x.c.def.id)) ? '（このターンの目標の組み合わせ）' : ''}`);
    if (oppD) {
      const ids = pick.map(x => x.c.def.id);
      let u = liveUtility(g, me, oppD, p, score);
      if (planLives(g, me, ids)) u += opt.planUtil ?? 0.08;               // そのターンに置きたい組み合わせ
      else if (usesReserved(g, me, ids)) u -= opt.reserveUtil ?? 0.08;    // 後のターン用のライブを使う
      if (opt.pace) {                                                       // 点数の進行（目標点）に届くなら少し高く
        const tg = opt.pace[Math.min(succ, opt.pace.length - 1)];
        if (score >= tg) u += 0.03;
      }
      u -= 0.02 * pick.length;                                              // 使うライブは少ない方がよい
      if (!bestU || u > bestU.u + 1e-9) bestU = { u, p, score, pick };
      continue;
    }
    if (opt.pace) {
      // 点数の進行（例：1→4→7）に合わせる：目標に届く中で一番小さい点数、届かなければ一番大きい点数
      const tg = opt.pace[Math.min(succ, opt.pace.length - 1)];
      const th0 = g.turn <= 1 && opt.th1 != null ? opt.th1 : (succ === opt.pace.length - 1 && score >= tg && opt.thLast != null ? opt.thLast : minP);
      const pids = pick.map(x => x.c.def.id);
      const planned = planLives(g, me, pids);
      // そのターンに置きたい組み合わせは、成功の見込みが低めでも置く（opt.planMinP）
      const th = planned && opt.planMinP != null && g.turn > 1 ? Math.min(th0, opt.planMinP) : th0;
      if (p < th || p <= 0) continue;
      if (!planned && opt.reserveStrict && usesReserved(g, me, pids)) continue; // 後のターンのために取っておく
      // そのターンに置きたい組み合わせを一番に。次に点数の進行
      const key = (planned ? 2000 : 0) + (score >= tg ? 1000 - score : score);
      if (!best || key > best.key || (key === best.key && p > best.p + 1e-9)) best = { key, p, score, pick };
      continue;
    }
    let ev = p * score;
    if (p < minP) continue;
    // そのターンに置きたい組み合わせなら高く見る
    const ids = pick.map(x => x.c.def.id);
    if (planLives(g, me, ids)) ev *= opt.planLiveBonus ?? 1.6;
    // 次のターン以降の目標で使うライブを先に使ってしまう組み合わせは低く見る
    else if (usesReserved(g, me, ids)) {
      if (opt.reserveStrict) continue; // 後のターンのために取っておく（しゃがむ）
      ev *= opt.reservePenalty ?? 0.4;
    }
    if (!best || ev > best.ev + 1e-9 || (Math.abs(ev - best.ev) < 1e-9 && pick.length < best.pick.length)) best = { ev, p, score, pick };
  }
  if (oppD) {
    // 置かない（しゃがむ）ときより得になるなら置く
    const u0 = -oppD.pSucc * (g.opp(me).success.length >= 2 ? 3 : 1);
    best = bestU && bestU.u > u0 + (opt.oppMargin ?? 0.02) ? bestU : null;
  }
  const out = best ? best.pick.map(x => x.i) : [];
  // わざと成功しないライブ（opt.dummyTurns）：そのターンにライブを置かないなら、一番いらないライブを1枚置いてエールをする
  // （エールでめくったカードが控え室に行く。控え室のメンバーを増やすテクニック）
  if (opt.dummyTurns && opt.dummyTurns.includes(g.turn) && !out.some(i => me.hand[i].def.kind === 'L')) {
    const keep = protectedCards(g, me, opt);
    const L = me.hand.map((c, i) => ({ c, i })).filter(x => x.c.def.kind === 'L' && !keep.has(x.c.uid))
      .sort((a, b) => handVal(a.c, me) - handVal(b.c, me));
    if (L.length && me.hand.filter(c => c.def.kind === 'L').length >= (opt.dummyMinLives ?? 2)) { out.push(L[0].i); g.log(me, 'plan', `わざと成功しないライブ：${cardLabel(L[0].c)}`); }
  }
  // 空いた枠に不要なメンバーを伏せて、同じ枚数を引き直す（ライブでないカードは控え室へ行く）
  // 山札を削りたいデッキ（prefer.mill）は、空いた枠をいつも埋めて引き直す
  if ((opt.fill || (me.prefer && me.prefer.mill)) && out.length < 3) {
    const keep = protectedCards(g, me, opt);
    // 伏せたいメンバー（strategy.prefer.fillPrefer：控え室に置いておきたいカード）を先に
    const fp = c => (me.prefer && me.prefer.fillPrefer && me.prefer.fillPrefer.includes(c.def.id) ? 1 : 0);
    const cand = me.hand.map((c, i) => ({ c, i }))
      .filter(x => x.c.def.kind === 'M' && !keep.has(x.c.uid) && (x.c.def.cost <= (opt.fillMaxCost ?? 99) || isToWaiting(me, x.c) || fp(x.c)))
      .sort((a, b) => (isToWaiting(me, b.c) - isToWaiting(me, a.c)) || (fp(b.c) - fp(a.c)) || (handVal(a.c, me) - handVal(b.c, me)));
    for (const x of cand) { if (out.length >= 3) break; out.push(x.i); }
  }
  // 引きに行くカード（opt.digFor）：そのターンに手札に無ければ、ライブカード置き場を n 枚まで埋めて同じ枚数を引き直す
  // digFor: { ids: [探すカード], turns: [1, 2], n: 3, keep: [置かないカード] }
  // digFor は1つでも配列でもよい。配列なら、手札に無い探すカードがある最初のものを使う
  const digs = opt.digFor ? [].concat(opt.digFor) : [];
  const dig = digs.find(d => (d.turns || []).includes(g.turn) && !me.hand.some(c => d.ids.includes(c.def.id)) && !(d.skipIfStage && me.stage.some(s => s && d.ids.includes(s.card.def.id))));
  // 伏せたいカード（strategy.prefer.fillPrefer）を先に置く
  const fp = c => (me.prefer && me.prefer.fillPrefer && me.prefer.fillPrefer.includes(c.def.id) ? 1 : 0);
  if (dig && out.length < (dig.n ?? 3)) {
    const prot = protectedCards(g, me, opt);
    const next = turnTarget(me, g.turn + 1);
    const nextItems = next && next.board ? next.board[0].map(x => (typeof x === 'number' ? { cost: x } : x)) : [];
    const used = new Set();
    const forNext = c => nextItems.some((it, k) => !used.has(k) && (it.id ? c.def.id === it.id : c.def.kind === 'M' && c.def.cost === it.cost) && used.add(k));
    // 置かないカード：この dig の keep と、ほかの dig で探しているカード（もう手札にあるキーカード）
    const keepIds = new Set([...(dig.keep || []), ...digs.flatMap(d => d.ids)]);
    // 次のターンの盤面に要るカードは1枚ずつ残す
    const hold = new Set(me.hand.filter(c => forNext(c)).map(c => c.uid));
    const cand = me.hand.map((c, i) => ({ c, i }))
      // ライブカードは伏せない（伏せるとライブになり、失敗して控え室へ行く。ライブをするターンはいっしょに失敗する）
      .filter(x => !out.includes(x.i) && !keepIds.has(x.c.def.id) && !hold.has(x.c.uid) && x.c.def.kind !== 'L')
      .sort((a, b) => (prot.has(a.c.uid) - prot.has(b.c.uid)) || (fp(b.c) - fp(a.c)) || (handVal(a.c, me) - handVal(b.c, me)));
    const before = out.length;
    for (const x of cand) { if (out.length >= (dig.n ?? 3)) break; out.push(x.i); }
    if (out.length > before) g.log(me, 'plan', `${dig.label || '探すカード'}が手札に無いので、ライブカード置き場を${out.length}枚まで埋めて引き直す`);
  }
  return out;
}

// ---------------- 相手の点数を意識したライブの判断 ----------------
// 相手のこのターンの点数の見込み：{ none: 成功しない確率, pSucc, dist: [[点数, 確率], ...] }
// ・相手のデッキのひとり回しの結果（me.oppModel）から引く
// ・自分が後攻なら、先攻が伏せた枚数が見える。0枚ならライブなし
export function oppDistribution(g, me) {
  const model = me.oppModel;
  if (!model) return null;
  const opp = g.opp(me);
  const second = g.order()[1] === me;
  if (second && opp.liveZone.length === 0) return { none: 1, pSucc: 0, dist: [] };
  const prof = model[Math.min(g.turn, model.length - 1)];
  if (!prof || !prof.n) return null;
  let none = prof.none / prof.n;
  let dist = Object.entries(prof.scores).map(([sc, c]) => [+sc, c / prof.n]);
  // 後攻で、先攻がカードを伏せているのが見えるなら「ライブなし」の分を減らす（伏せたのが全部メンバーのこともあるので半分）
  if (second && opp.liveZone.length > 0 && none < 1) {
    const k = 0.5;
    const succ = 1 - none;
    const scale = (succ + none * k) / succ;
    dist = dist.map(([sc, q]) => [sc, q * scale]);
    none = none * (1 - k);
  }
  return { none, pSucc: 1 - none, dist };
}

// 置き方の良さ：（自分がライブに勝つ確率）−（相手がライブに勝つ確率）
// 同点は両方勝ち。ただし両方が成功ライブ2枚の千秋楽で同点なら、どちらも移動しない
function liveUtility(g, me, D, p, s) {
  const opp = g.opp(me);
  const finalTie = me.success.length === 2 && opp.success.length === 2;
  let weWin = D.none, oppWin = 0;
  for (const [os, q] of D.dist) {
    if (os < s) weWin += q;
    else if (os === s) { if (!finalTie) { weWin += q; oppWin += q * p; } }
    else oppWin += q * p;
    oppWin += q * (1 - p);
  }
  // 勝ち負けが決まるライブは重く見る：相手が成功ライブ2枚なら負けを、自分が2枚なら勝ちを3倍で数える
  // （アグロ相手には「3ターン目までに負けない」ことを優先し、決めに行くターンは取り切りに行く）
  const wMe = me.success.length >= 2 ? 3 : 1;
  const wOpp = opp.success.length >= 2 ? 3 : 1;
  return wMe * p * weWin - wOpp * oppWin;
}

// 控え室に置いておきたいカードか（控え室にまだ無いときだけ）
function isToWaiting(me, c) {
  const tw = me.prefer && me.prefer.toWaiting;
  return !!(tw && tw.includes(c.def.id) && !me.waiting.some(x => tw.includes(x.def.id)));
}

// 手札の並べ替え用のおおまかな価値
function handVal(c, me) {
  const d = c.def;
  if (d.kind === 'M' && me) return 2 + (d.cost >= 9 ? 0.2 : 0) + d.hearts.reduce((a, b) => a + b, 0) * 0.2 + d.blades * 0.1 + preferBonus(me, d) * 0.5;
  if (d.kind === 'L') return 3 + d.score * 0.3;
  return 2 + (d.cost >= 9 ? 0.2 : 0) + d.hearts.reduce((a, b) => a + b, 0) * 0.2 + d.blades * 0.1;
}

// 入れ替えに使わずに残すカード：次に出す中コストの一番いい1枚と、序盤は大型の一番いい1枚
// 盤面スタッツ：ステージのメンバーのハートの数と（アクティブな）ブレードの数の合計
export function boardStat(g, me) {
  let n = 0;
  me.stage.forEach((s, area) => {
    if (!s) return;
    const h = g.heartsOf(me, s, area);
    n += h.h.reduce((a, b) => a + b, 0) + (h.all || 0);
    if (s.active) n += g.bladesOf(me, s, area);
  });
  return n;
}

export function protectedCards(g, me, opt = {}) {
  const keep = protectedCards0(g, me, opt);
  // 控え室に送りたいカードは守らない
  for (const c of me.hand) if (keep.has(c.uid) && isToWaiting(me, c)) keep.delete(c.uid);
  return keep;
}

function protectedCards0(g, me, opt = {}) {
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
      const c = ms.filter(x => match(x.def) && !keep.has(x.uid) && !isToWaiting(me, x)).sort((a, b) => memberValue(b.def) - memberValue(a.def))[0];
      if (c) keep.add(c.uid);
    }
  }
  // ステージの空き枠を次のターンに埋めるための低コストのメンバー
  const empty = me.stage.filter(x => !x).length;
  if (empty && opt.protFill !== false && !(me.prefer && me.prefer.protFill === false)) {
    const low = ms.filter(c => c.def.cost <= 2 && !keep.has(c.uid)).sort((a, b) => memberValue(b.def) - memberValue(a.def));
    low.slice(0, empty).forEach(c => keep.add(c.uid));
  }
  // 後のターンに必ず使うカード（strategy.prefer.hold）を1枚手札に残す
  // hold: { from: 2, to: 5, ids: [優先するカード], cost: 2, skipIfWaiting: [控え室にあれば残さなくてよいカード] }
  // 複数書くときは配列（それぞれ1枚ずつ。ids は前に書いたものほど優先）
  const hds = me.prefer && me.prefer.hold ? [].concat(me.prefer.hold) : [];
  for (const hd of hds) {
    if (!(g.turn >= (hd.from ?? 1) && g.turn <= (hd.to ?? 99)) || (hd.skipIfWaiting && me.waiting.some(c => hd.skipIfWaiting.includes(c.def.id)))) continue;
    const rank = d => { const k = (hd.ids || []).indexOf(d.id); return k < 0 ? 99 : k; };
    const c = ms.filter(x => !keep.has(x.uid) && ((hd.ids && hd.ids.includes(x.def.id)) || (hd.cost != null && x.def.cost === hd.cost)))
      .sort((a, b) => (rank(a.def) - rank(b.def)) || (memberValue(b.def) - memberValue(a.def)))[0];
    if (c) keep.add(c.uid);
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

// ---------------- 手順（strategy.script）と固定するメンバー（strategy.lock） ----------------
// script: { 4: [{ play: { id | cost }, area, onto: { id | cost } }, ...] }
//  そのターンのメインフェイズの最初に、書いた順に出す。手札に無い・エネルギーが足りないなどで出せない手順は飛ばす（いつものAIの判断に戻る）
//  area を書かないときは onto（バトンタッチ元）に合うエリア、それも無ければ空いているエリア
// lock: [{ id, area, fromTurn, toTurn }]  そのターンの間、そのエリアのそのメンバーにはバトンタッチしない
export function isLocked(g, me, slot, area) {
  const lk = me.lock;
  if (!lk) return false;
  return lk.some(l => g.turn >= (l.fromTurn ?? 1) && g.turn <= (l.toTurn ?? 99) && slot.card.def.id === l.id && (l.area == null || l.area === area));
}

// 手順のカードの指定：id／ids（どれか）／minCost（このコスト以上）／cost（ちょうど）
const matchSpec = (spec, def) => !!spec && (spec.id ? def.id === spec.id : spec.ids ? spec.ids.includes(def.id) : spec.minCost != null ? def.kind === 'M' && def.cost >= spec.minCost : def.cost === spec.cost);

function runScript(api) {
  const { g, me } = api;
  const steps = (me.script && me.script[g.turn]) || [];
  // このあとの手順でバトンタッチ先にするメンバー（手札に出すカードがあるものだけ）
  const keepFrom = i => {
    const keep = new Set();
    for (const st0 of steps.slice(i)) for (const st of st0.oneOf || [st0]) {
      // ontoWait（起動能力を使ったあとにバトンタッチする）の相手は、能力を使ってほしいので残さない
      if (!st.play || !st.onto || st.ontoWait || !me.hand.some(c => c.def.kind === 'M' && matchSpec(st.play, c.def))) continue;
      const s = me.stage.find(x => x && matchSpec(st.onto, x.card.def));
      if (s) { keep.add(s); break; }
    }
    return keep;
  };
  // 手順の前に起動能力を使う（先に手札を整える能力など）
  if (steps.length) useAbilities(api, { keep: keepFrom(0) });
  for (const [i, st0] of steps.entries()) {
    // oneOf：書いた順に試して、最初にできたものだけ行う（例：9にこがいれば9にこ、いなければほかの9）
    // ifStage：ステージにこのメンバーがいるときだけ行う（例：15がいるときだけ9へバトンタッチ）
    if (st0.ifStage && !me.stage.some(x => x && matchSpec(st0.ifStage, x.card.def))) continue;
    // ifWaiting：控え室にこのカードがあるときだけ行う（例：控え室に15セラスがいるときだけ11さやか）
    if (st0.ifWaiting && !me.waiting.some(c => matchSpec(st0.ifWaiting, c.def))) continue;
    if (!condOk(me, st0)) continue;
    for (const st of st0.oneOf || [st0]) {
      if (!st.play) continue;
      if (st !== st0 && st.ifWaiting && !me.waiting.some(c => matchSpec(st.ifWaiting, c.def))) continue;
      const idx = me.hand.findIndex(c => c.def.kind === 'M' && matchSpec(st.play, c.def));
      if (idx < 0) continue;
      let area = st.area;
      if (area == null && st.onto) area = me.stage.findIndex(x => x && matchSpec(st.onto, x.card.def));
      if (area == null || area < 0) area = me.stage.findIndex(x => !x);
      if (area < 0) continue;
      if (st.onto && !(me.stage[area] && matchSpec(st.onto, me.stage[area].card.def))) continue;
      const slot = me.stage[area];
      // unlock：lock（固定するメンバー）を無視してバトンタッチする／ontoWait：バトンタッチ元がウェイト状態（起動能力を使ったあと）のときだけ
      if (slot && ((!st.unlock && isLocked(g, me, slot, area)) || !g.canTarget(me, area))) continue;
      if (st.ontoWait && (!slot || slot.active)) continue;
      if (api.play(idx, area, true)) { g.log(me, 'plan', `手順：${cardLabel(me.stage[area].card)}を出した`); useAbilities(api, { keep: keepFrom(i + 1) }); break; }
    }
  }
}

// ---------------- ターンごとの目標（strategy.turnPlan） ----------------
// turnPlan: { 4: { board: [[13, 13, 2]], lives: [['ライブ番号', 'ライブ番号']] }, ... }
//  board：目標の盤面（候補を複数書ける）。要素はコストの数か {cost, id, area}（area 0=左 1=センター 2=右）
//  lives：そのターンに置きたいライブの組み合わせ（候補を複数書ける）
// ひとり回しでも対戦でも、自分のターン数（g.turn）で引く
export function turnTarget(me, turn) {
  const tp = me && me.turnPlan;
  if (!tp) return null;
  const t = tp[turn] || null;
  // alt：条件に合うときは、その盤面・ライブの目標に差し替える（例：2TのMusic S.T.A.R.T!!が成功していないとき）
  if (t && t.alt) for (const a of t.alt) if (condOk(me, a)) return { ...t, ...a, alt: undefined };
  return t;
}

// 手順・目標の条件：ifSuccess / ifNoSuccess（成功ライブ置き場にこのカードがある／無い）、ifNoStage（ステージにいない）
const hasId = (cards, ids) => cards.some(c => [].concat(ids).includes(c.def.id));
export function condOk(me, a) {
  if (a.ifSuccess && !hasId(me.success, a.ifSuccess)) return false;
  if (a.ifNoSuccess && hasId(me.success, a.ifNoSuccess)) return false;
  if (a.ifNoStage && me.stage.some(x => x && matchSpec(a.ifNoStage, x.card.def))) return false;
  return true;
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

// 次の2ターンの目標のライブ（各ターンの最初の候補）に必要な枚数が手札に足りなくなるか
function usesReserved(g, me, ids) {
  for (const t of [g.turn + 1, g.turn + 2]) {
    const tgt = turnTarget(me, t);
    if (!tgt || !tgt.lives || !tgt.lives[0]) continue;
    const need = tgt.lives[0];
    for (const id of new Set(ids)) {
      const want = need.filter(x => x === id).length;
      if (!want) continue;
      const have = me.hand.filter(c => c.def.id === id).length;
      if (have - ids.filter(x => x === id).length < want) return true;
    }
  }
  return false;
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
    // このターンにまだ起動能力で足せるブレードの見込み（効果側の estBlades）
    const ef = g.effect(s.card);
    if (s.active && ef && ef.estBlades) blades += ef.estBlades({ g, me, slot: s, area }) || 0;
  });
  // デッキの中身は分かるが順番は分からないので、残りデッキ（＋控え室）からランダムに引いて試す
  // ただし、効果でデッキの上に置いたカード（me.knownTop）はエールで必ずめくれ、
  // デッキの下に置いたカード（me.knownBottom）はデッキが多ければめくれない
  const kt = me.knownTop, kb = me.knownBottom;
  let top = 0;
  while (kt && top < me.deck.length && top < blades && kt.has(me.deck[top].uid)) top++;
  let bottom = 0;
  while (kb && bottom < me.deck.length - top && kb.has(me.deck[me.deck.length - 1 - bottom].uid)) bottom++;
  const fixed = me.deck.slice(0, top);
  const rest = me.deck.slice(top, me.deck.length - bottom);
  const unknown = rest.length >= blades - top ? rest : me.deck.length - top >= blades - top ? me.deck.slice(top) : me.deck.slice(top).concat(me.waiting);
  return { pool, blades, unknown, fixed };
}

// 成功率を見積もる。stats を渡すと、成功したときの点数の増減（効果の successAdjust）の平均を stats.adj に入れる
export function successRate(g, me, cards, est0, samples, stats = null) {
  let est = est0;
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
  const fixed = est.fixed || [];
  const blades = est.blades + extra - Math.min(fixed.length, est.blades + extra);
  if (fixed.length) {
    // 上に置いたと分かっているカードは必ずめくれる
    const base = { c: est.pool.c.slice(), all: est.pool.all, gen: est.pool.gen };
    for (const c of fixed.slice(0, est.blades + extra)) addBladeHeart(base, c.def.bh);
    est = { ...est, pool: base };
  }
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
    mulligan: v => ((v.me.prefer = strategy.prefer || null), (v.me.turnPlan = strategy.turnPlan || null), (v.me.script = strategy.script || null), (v.me.lock = strategy.lock || null), strategy.mulligan ? strategy.mulligan(v, defaultMulligan) : defaultMulligan(v, strategy.mulliganOpt)),
    // ライブの点数の進行（pace）は、盤面づくりでも同じ目標を使う
    main: api => (strategy.main ? strategy.main(api, defaultMain) : defaultMain(api, { pace: strategy.liveOpt && strategy.liveOpt.pace, onlyCombos: strategy.liveOpt && strategy.liveOpt.onlyCombos, ...strategy.mainOpt })),
    setLives: v => (strategy.setLives ? strategy.setLives(v, defaultSetLives) : defaultSetLives(v, strategy.liveOpt)),
    chooseSuccess: (v, zone) => (strategy.chooseSuccess ? strategy.chooseSuccess(v, zone) : 0),
  };
}

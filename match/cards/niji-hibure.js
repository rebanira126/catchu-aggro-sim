// 虹ヶ咲（非ブレ＝ブレードハートを持たないメンバー）のカード効果（カード番号で登録）
// エネルギーやメンバーをアクティブにして動くデッキ用。
// ・me.nijiAct：このターンに『虹ヶ咲』の効果でウェイトのエネルギー／メンバーをアクティブにしたか（Cara Tesoro が見る）
import { memberValue, turnTarget } from '../engine/ai.js';
import {
  inGroup, isLive, isMember, hasBladeHeart, cardWorth, discardWorst, willDiscard, lookTake, recover, takeTop,
} from './lib.js';

const NIJI = '虹ヶ咲';

// 次のターンの目標（turnPlan の盤面・ライブの組み合わせのどれか）を、このカードがそろえるなら高く見る
// ・盤面：ステージと手札にまだ無いメンバー
// ・ライブ：組み合わせの相方が手札にあり、このライブがまだ手札に無い
// それ以外はいつもの「持っておきたさ」
export function nextWorth(g, me, card, extraHand = []) {
  const tgt = turnTarget(me, g.turn + 1);
  const hand = me.hand.concat(extraHand).filter(c => c !== card);
  const base = cardWorth(g, me, card);
  if (!tgt) return base;
  let bonus = 0;
  const have = d => me.stage.some(s => s && s.card.def.id === d) || hand.some(c => c.def.id === d);
  const haveCost = c => me.stage.some(s => s && s.card.def.cost === c) || hand.some(h => isMember(h) && h.def.cost === c);
  for (const want of tgt.board || []) {
    for (const x of want) {
      const it = typeof x === 'number' ? { cost: x } : x;
      if (it.id ? card.def.id === it.id && !have(it.id) : isMember(card) && card.def.cost === it.cost && !haveCost(it.cost)) bonus = Math.max(bonus, 6);
    }
  }
  if (isLive(card)) {
    for (const combo of tgt.lives || []) {
      if (!combo.includes(card.def.id) || hand.some(c => c.def.id === card.def.id)) continue;
      const others = combo.filter((id, k) => k !== combo.indexOf(card.def.id));
      if (others.every(id => hand.some(c => c.def.id === id))) bonus = Math.max(bonus, 8); // これで組み合わせがそろう
      else bonus = Math.max(bonus, 3);
    }
  }
  return base + bonus;
}
const EMMA17 = 'PL!N-pb1-008';
const isNiji = c => inGroup(c.def, NIJI);
const noBH = c => isMember(c) && !hasBladeHeart(c.def);
const nijiNoBH = c => noBH(c) && isNiji(c);

// ---------------- 共通の動き ----------------
function actFlags(g, me) {
  if (!me.nijiAct || me.nijiAct.turn !== g.turn) me.nijiAct = { turn: g.turn, energy: false, member: false };
  return me.nijiAct;
}

// 『虹ヶ咲』の効果でエネルギーを n 枚アクティブにする（ウェイトのエネルギーが無ければ何も起きない）
export function nijiEnergy(g, me, n, label = '') {
  const before = me.energy.active;
  me.energy.active = Math.min(me.energy.n, me.energy.active + n);
  const got = me.energy.active - before;
  if (got > 0) { actFlags(g, me).energy = true; g.log(me, 'eff', `${label}エネルギーを${got}枚アクティブにした`); }
  return got;
}

// 『虹ヶ咲』の効果でウェイトのメンバーをアクティブにする
export function nijiActivate(g, me, slot, label = '') {
  if (!slot || slot.active) return false;
  slot.active = true;
  actFlags(g, me).member = true;
  g.log(me, 'eff', `${label}${slot.card.def.name}をアクティブにした`);
  return true;
}

// 自分のメンバーを効果でウェイトにする。「メンバーがウェイト状態になったとき」の自動能力（onOwnWait）を起こす
export function waitOwn(g, me, slot, label = '') {
  if (!slot || !slot.active) return false;
  slot.active = false;
  g.log(me, 'eff', `${label}${slot.card.def.name}をウェイトにした`);
  me.stage.forEach((s, area) => {
    if (!s) return;
    const ef = g.effect(s.card);
    if (ef && ef.onOwnWait) ef.onOwnWait({ g, me, opp: g.opp(me), card: s.card, slot: s, area, waited: slot });
  });
  return true;
}

const kanata9 = me => me.stage.find(s => s && s.active && s.card.def.id === 'PL!N-pb1-006') || null;
const waitedNiji = (me, except = null) => me.stage.some(s => s && s !== except && !s.active && isNiji(s.card));

// あと extra エネルギーあれば出せるようになる手札のメンバーがあるか（バトンタッチも考える）
// waitNiji：同時に『虹ヶ咲』のメンバーがウェイトになる（17エマのコストが2減る）
export function needsEnergy(g, me, extra, { waitNiji = false } = {}) {
  const act = me.energy.active;
  for (const c of me.hand) {
    if (!isMember(c)) continue;
    let cost = g.costOf(me, c);
    if (waitNiji && c.def.id === EMMA17 && !waitedNiji(me)) cost = Math.max(0, cost - 2);
    for (let a = 0; a < 3; a++) {
      const s = me.stage[a];
      if (s && !g.canTarget(me, a)) continue;
      const base = s ? s.card.def.cost : 0;
      if (c.def.cost <= base) continue; // 小さくなる入れ替えは考えない
      const pay = Math.max(0, cost - base);
      if (pay > act && pay <= act + extra) return true;
    }
  }
  return false;
}

// このターンにまだ起こせるエネルギーの見込み（17彼方の残りの起動×2、アクティブな9彼方×1）
function energyPotential(g, me) {
  let n = 0;
  for (const s of me.stage) {
    if (!s) continue;
    const id = s.card.def.id;
    if (id === 'PL!N-bp7-006') n += 2 * kanataUsesLeft(g, me, s);
    if (id === 'PL!N-pb1-006' && s.active) n += 1;
  }
  return Math.min(n, me.energy.n - me.energy.active);
}

// 17彼方の「3枚落とす」起動能力の、このターンの残り回数
function kanataUsesLeft(g, me, slot) {
  if (me.deck.length < 3) return 0;
  const u = slot.uses && slot.uses['PL!N-bp7-006#0'];
  const used = u && u.turn === g.turn ? u.n : 0;
  return Math.max(0, 2 - used);
}

// 17栞子の反応（ウェイトになったメンバーをアクティブにしてブレード+2）が、このターンまだ使えるか
const shiorikoReady = (g, me) => me.stage.some(s => s && s.card.def.id === 'PL!N-sd2-010' && !(s.uses && s.uses.react && s.uses.react.turn === g.turn));

// 手札のライブが少なく、控え室に拾える『虹ヶ咲』のライブがあるか
const wantLive = (me, max = 1) => me.hand.filter(isLive).length < max && me.waiting.some(c => isLive(c) && isNiji(c));

export default {
  // ---------------- ライブ ----------------
  // Just Believe!!!（5点）
  'PL!N-bp7-026': {
    note: 'ライブ開始時：手札を2枚まで捨て、その数まで虹ヶ咲メンバーにブレード+1。ライブ成功時：エールにブレードハートなしのメンバーが2枚以上でスコア+1',
    order: { liveStart: 6 },
    liveStart({ g, me }) {
      const targets = me.stage.filter(s => s && s.active && isNiji(s.card));
      let n = 0;
      while (n < 2 && n < targets.length && willDiscard(g, me)) { discardWorst(g, me, 1); n++; }
      for (let k = 0; k < n; k++) targets[k].mods.push({ blades: 1, untilLiveEnd: true });
      if (n) g.log(me, 'eff', `Just Believe!!!：${n}人がブレード+1`);
    },
    liveSuccess({ g, me, live }) {
      if (me.cheer.filter(noBH).length >= 2) { live.bonus += 1; g.log(me, 'eff', 'Just Believe!!!：スコア+1'); }
    },
    successAdjust({ cheer }) { return cheer.filter(noBH).length >= 2 ? 1 : 0; },
  },
  // Cara Tesoro（5点）
  'PL!N-pb1-037': {
    note: 'ライブ開始時：このターン虹ヶ咲の効果でウェイトのエネルギーをアクティブにしていたらスコア+1、さらにウェイトのメンバーもアクティブにしていたら代わりに+2',
    order: { liveStart: 9 },
    liveStart({ g, me, live }) { const b = caraBonus(g, me); if (b) { live.bonus += b; g.log(me, 'eff', `Cara Tesoro：スコア+${b}`); } },
    preview({ g, me, live }) { live.bonus += caraBonus(g, me); },
  },
  // TOKIMEKI Runners（2点）
  'PL!N-bp5-026': {
    note: 'ライブ開始時：ステージのハートに6色すべてあればスコア+1。ライブ成功時：スコアが3なら控え室の虹ヶ咲のカードを1枚手札に',
    order: { liveStart: 8 },
    liveStart({ g, me, live }) { if (sixColors(g, me)) { live.bonus += 1; g.log(me, 'eff', 'TOKIMEKI Runners：スコア+1'); } },
    liveSuccess({ g, me, live }) { if (live.card.def.score + live.bonus === 3) recover(g, me, isNiji, 'TOKIMEKI Runners：'); },
    preview({ g, me, live }) { if (sixColors(g, me)) live.bonus += 1; },
  },

  // ---------------- メンバー ----------------
  // エマ・ヴェルデ（15）bp7-008
  'PL!N-bp7-008': {
    note: '登場：控え室のブレードハートなしメンバーを4枚までデッキの下に置き、1枚につきエネルギーを1枚アクティブ',
    onEnter({ g, me }) {
      const waitE = me.energy.n - me.energy.active;
      // 戻す枚数：ウェイトのエネルギーの数まで（それ以上は戻しても得がない。ただしデッキに非ブレを増やすため最低2枚）
      const cand = me.waiting.filter(noBH).sort((a, b) => cardWorth(g, me, a) - cardWorth(g, me, b));
      const n = Math.min(4, cand.length, Math.max(waitE, 2));
      const put = cand.slice(0, n);
      for (const c of put) { me.waiting.splice(me.waiting.indexOf(c), 1); me.deck.push(c); }
      if (put.length) g.log(me, 'eff', `エマ・ヴェルデ：控え室の${put.length}枚をデッキの下に置いた`);
      nijiEnergy(g, me, put.length, 'エマ・ヴェルデ：');
    },
    refund: ({ me }) => Math.min(4, me.waiting.filter(noBH).length),
  },
  // エマ・ヴェルデ（17）pb1-008
  [EMMA17]: {
    note: '常時：ステージにウェイトの虹ヶ咲メンバーがいれば手札のこのカードのコスト-2。登場：メンバー1人かエネルギー2枚をアクティブ',
    // アクティブな9彼方がいれば、起動能力でウェイトにしてからプレイする（コスト-2）
    handCost({ me, base }) { return waitedNiji(me) || kanata9(me) ? base - 2 : base; },
    onPay({ g, me }) {
      if (waitedNiji(me)) return;
      const k = kanata9(me);
      if (!k) return;
      waitOwn(g, me, k, '近江彼方：');
      nijiEnergy(g, me, 1, '近江彼方：');
    },
    refund: () => 2,
    onEnter({ g, me, slot }) {
      const waited = me.stage.filter(s => s && s !== slot && !s.active).sort((a, b) => g.bladesOf(me, b, 0) - g.bladesOf(me, a, 0))[0];
      // まだ出したいメンバーがあればエネルギー、なければウェイトのメンバーを起こす（エールのブレードが増える）
      if (waited && !needsEnergy(g, me, 2)) nijiActivate(g, me, waited, 'エマ・ヴェルデ：');
      else if (!nijiEnergy(g, me, 2, 'エマ・ヴェルデ：') && waited) nijiActivate(g, me, waited, 'エマ・ヴェルデ：');
    },
  },
  // エマ・ヴェルデ（13）bp3-008
  'PL!N-bp3-008': {
    note: '起動（ターン1回）：ほかの虹ヶ咲メンバー1人をウェイト→1枚引く。ライブ開始時：手札を2枚捨ててよい→ウェイトのメンバー1人をアクティブにし、その人とこのメンバーに緑ハート+1',
    activated: [{
      once: 1,
      ai: ({ g, me, slot, late }) => {
        const t = emmaTarget(me, slot);
        if (!t) return false;
        // 17栞子がすぐ起こしてくれる、または17エマのコストを下げたい、またはメイン終わり（ライブ開始時に起こせる）
        return (late && me.hand.length >= 3) || (shiorikoReady(g, me) && willDiscard(g, me)) || needsEnergy(g, me, 0, { waitNiji: true }) || (late && shiorikoReady(g, me));
      },
      run: ({ g, me, slot }) => {
        const t = emmaTarget(me, slot);
        if (!t) return false;
        waitOwn(g, me, t, 'エマ・ヴェルデ：');
        g.draw(me, 1);
      },
    }],
    order: { liveStart: 2 },
    liveStart({ g, me, slot }) {
      const t = me.stage.filter(s => s && s !== slot && !s.active).sort((a, b) => g.bladesOf(me, b, 0) - g.bladesOf(me, a, 0))[0];
      if (!t || me.hand.length < 2 || !willDiscard(g, me, 2)) return;
      discardWorst(g, me, 2);
      nijiActivate(g, me, t, 'エマ・ヴェルデ：');
      for (const s of [t, slot]) s.mods.push({ hearts: { c: [0, 0, 0, 1, 0, 0] }, untilLiveEnd: true });
    },
  },
  // 近江彼方（17）bp7-006
  'PL!N-bp7-006': {
    note: '起動（ターン1回）[E]：デッキの上4枚を並べ替え（使わない）。起動（ターン2回）：デッキの上3枚を控え室→虹ヶ咲のライブかブレードハートなしの虹ヶ咲メンバーがあれば、エネルギー2枚アクティブかブレード+2',
    // 出すと毎ターン、エネルギー最大4枚かブレード最大+4になる（盤面の強さの数字に表れない分）
    energyPotential: ({ g, me, slot }) => kanataUsesLeft(g, me, slot) * 2,
    aiBonus: ({ me, card }) => (me.deck.length >= 6 && !me.stage.some(s => s && s.card.def.id === card.def.id) ? 3 : 0),
    activated: [{
      once: 2,
      can: ({ me }) => me.deck.length >= 3,
      ai: ({ g, me, slot, late }) => {
        if (me.deck.length < 3) return false;
        if (late) return slot.active; // メインの終わり：ブレード+2のため
        return me.energy.n - me.energy.active >= 1 && needsEnergy(g, me, energyPotential(g, me), { waitNiji: true });
      },
      run: ({ g, me, slot, late }) => {
        const milled = me.deck.splice(0, 3);
        me.waiting.push(...milled);
        const hit = milled.some(c => (isLive(c) && isNiji(c)) || nijiNoBH(c));
        g.log(me, 'eff', `近江彼方：デッキの上3枚を控え室に置いた（${milled.map(c => c.def.name).join('、')}）${hit ? '' : '→ 該当なし'}`);
        if (!hit) return;
        const waitE = me.energy.n - me.energy.active;
        if (!late && waitE > 0 && needsEnergy(g, me, Math.max(2, energyPotential(g, me) + 2), { waitNiji: true })) nijiEnergy(g, me, 2, '近江彼方：');
        else { slot.mods.push({ blades: 2, untilLiveEnd: true }); g.log(me, 'eff', '近江彼方：ブレード+2'); }
      },
    }],
  },
  // 近江彼方（9）pb1-006
  'PL!N-pb1-006': {
    note: '起動：このメンバーをウェイト→エネルギーを1枚アクティブ',
    energyPotential: ({ slot }) => (slot.active ? 1 : 0),
    activated: [{
      ai: ({ g, me, slot, late }) => {
        if (!slot.active || me.energy.n - me.energy.active < 1) return false;
        if (late) return shiorikoReady(g, me) && willDiscard(g, me); // 17栞子がすぐ起こしてくれる
        return needsEnergy(g, me, energyPotential(g, me), { waitNiji: true });
      },
      run: ({ g, me, slot }) => { if (!slot.active) return false; waitOwn(g, me, slot, '近江彼方：'); nijiEnergy(g, me, 1, '近江彼方：'); },
    }],
  },
  // 近江彼方（4）bp7-018
  'PL!N-bp7-018': {
    note: '登場：手札を1枚捨ててよい→デッキの上5枚からブレードハートなしの虹ヶ咲メンバーを1枚手札に',
    onEnter({ g, me }) { if (willDiscard(g, me)) { discardWorst(g, me, 1); lookTake(g, me, 5, nijiNoBH, '近江彼方：'); } },
    aiBonus: () => 1,
  },
  // 宮下 愛（9）bp5-005
  'PL!N-bp5-005': {
    note: '自動：コスト10以上のブレードハートなし虹ヶ咲メンバーとバトンタッチして控え室に置かれたら、エネルギー2枚アクティブ。コスト15以上ならさらに1枚引く',
    onBatonOut({ g, me, newCard }) {
      if (!newCard || !nijiNoBH(newCard) || newCard.def.cost < 10) return;
      nijiEnergy(g, me, 2, '宮下 愛：');
      if (newCard.def.cost >= 15) g.draw(me, 1);
    },
    batonRefund: ({ newCard }) => (nijiNoBH(newCard) && newCard.def.cost >= 10 ? 2 : 0),
  },
  // 天王寺璃奈（4）bp5-009
  // 非ブレのデッキでは、手札に17コストしか無いときも探す（次のターンに出せる9コストか、9から繋がる15エマを）
  'PL!N-bp5-009': {
    note: '登場：このメンバーをウェイトにし手札を1枚捨ててよい→デッキの上5枚からコスト9以上の虹ヶ咲メンバーを1枚手札に',
    onEnter({ g, me, slot }) {
      if (!rinaWants(g, me) || !willDiscard(g, me)) return;
      slot.active = false;
      discardWorst(g, me, 1);
      lookTake(g, me, 5, c => isMember(c) && c.def.cost >= 9 && isNiji(c), '天王寺璃奈：');
    },
    aiBonus({ g, me }) { return rinaWants(g, me) ? 1.5 : 0; },
  },
  // 三船栞子（9）bp5-022
  'PL!N-bp5-022': {
    note: '登場：手札を1枚捨ててよい→控え室の虹ヶ咲のライブを1枚手札に',
    onEnter({ g, me }) {
      const wl = me.prefer && me.prefer.wantLives;
      const want = c => isLive(c) && isNiji(c) && wl && wl.includes(c.def.id);
      const need = wantLive(me, 2) || (wl && !me.hand.some(want) && me.waiting.some(want));
      if (need && willDiscard(g, me)) { discardWorst(g, me, 1); recover(g, me, c => want(c), '三船栞子：') || recover(g, me, c => isLive(c) && isNiji(c), '三船栞子：'); }
    },
  },
  // 三船栞子（17）sd2-010
  'PL!N-sd2-010': {
    note: '登場：2枚引く。自動（ターン1回）：虹ヶ咲メンバーがウェイトになったとき、手札を1枚捨ててよい→そのメンバーをアクティブにしブレード+2',
    onEnter({ g, me }) { g.draw(me, 2); },
    onOwnWait({ g, me, slot, waited }) {
      if (!isNiji(waited.card) || !willDiscard(g, me)) return;
      // 17エマのコストを下げるためにウェイトにしたときは起こさない
      if (me.hand.some(c => c.def.id === EMMA17) && !waitedNiji(me, waited) && needsEnergy(g, me, 0, { waitNiji: true })) return;
      if (!g.useOnce(slot, 'react')) return;
      discardWorst(g, me, 1);
      nijiActivate(g, me, waited, '三船栞子：');
      waited.mods.push({ blades: 2, untilLiveEnd: true });
    },
  },
  // 上原歩夢（15）sd2-001
  'PL!N-sd2-001': {
    note: '起動（ターン1回）[E][E]：控え室の虹ヶ咲のライブを1枚手札に',
    activated: [{
      once: 1,
      ai: ({ me, late }) => me.energy.active >= 2 && (late ? wantLive(me, 3) : wantLive(me, 1)),
      run: ({ g, me }) => {
        if (!g.payEnergy(me, 2)) return false;
        const wl = me.prefer && me.prefer.wantLives;
        (wl && recover(g, me, c => isLive(c) && wl.includes(c.def.id), '上原歩夢：')) || recover(g, me, c => isLive(c) && isNiji(c), '上原歩夢：');
      },
    }],
  },
  // 鐘 嵐珠（15）bp1-012
  'PL!N-bp1-012': {
    note: '常時：ライブ中のカードが3枚以上で虹ヶ咲のライブを含むならALLハート2・ブレード+2。起動（ターン1回）[E][E][E]：控え室のライブを1枚手札に',
    hearts({ me }) { return lanzhu(me) ? { all: 2 } : null; },
    blades({ me }) { return lanzhu(me) ? 2 : 0; },
    activated: [{
      once: 1,
      ai: ({ me, late }) => me.energy.active >= 3 && (late ? me.hand.filter(isLive).length < 3 : me.hand.filter(isLive).length === 0) && me.waiting.some(isLive),
      run: ({ g, me }) => { if (!g.payEnergy(me, 3)) return false; recover(g, me, isLive, '鐘 嵐珠：'); },
    }],
  },
  // 百生吟子（15）HS-PR-039
  'PL!HS-PR-039': {
    note: '登場：デッキの上から（10−手札の枚数）枚見て、2枚まで手札に。残りは控え室',
    onEnter({ g, me }) {
      const n = Math.max(0, 10 - me.hand.length);
      if (!n) return;
      const top = takeTop(g, me, n);
      const pick = top.slice().sort((a, b) => cardWorth(g, me, b) - cardWorth(g, me, a)).slice(0, 2);
      for (const c of pick) { top.splice(top.indexOf(c), 1); me.hand.push(c); }
      me.waiting.push(...top);
      g.log(me, 'eff', `百生吟子：デッキの上${n}枚から${pick.map(c => c.def.name).join('、')}を手札に加えた`);
    },
  },
  // 日野下花帆（4）HS-bp6-001
  'PL!HS-bp6-001': {
    note: '登場：デッキの上から（ステージのメンバー数＋2）枚見て、1枚を上に戻し残りを控え室。ライブ成功時：エールのカード1枚をデッキの上に置いてよい',
    onEnter({ g, me }) {
      const n = me.stage.filter(Boolean).length + 2;
      const top = takeTop(g, me, n);
      if (!top.length) return;
      const keep = top.slice().sort((a, b) => nextWorth(g, me, b) - nextWorth(g, me, a))[0];
      top.splice(top.indexOf(keep), 1);
      me.deck.unshift(keep);
      me.waiting.push(...top);
      g.log(me, 'eff', `日野下花帆：デッキの上${n}枚から${keep.def.name}を上に戻し、${top.length}枚を控え室に置いた`);
    },
    liveSuccess({ g, me }) {
      if (!me.cheer.length) return;
      // 次のターンに引くカード：次のターンの目標の盤面・ライブの組み合わせに足りないものを優先
      const c = me.cheer.slice().sort((a, b) => nextWorth(g, me, b) - nextWorth(g, me, a))[0];
      me.cheer.splice(me.cheer.indexOf(c), 1);
      me.deck.unshift(c);
      g.log(me, 'eff', `日野下花帆：エールの${c.def.name}をデッキの上に置いた`);
    },
  },
  // 中須かすみ（2）bp1-002
  'PL!N-bp1-002': {
    note: '登場：デッキの上3枚を見て、好きな枚数を上に戻し残りは控え室。起動（控え室にあるとき）[E][E]手札を1枚捨てる：控え室からステージに登場',
    // 次のターンの目標に足りないカードを上に（一番欲しいものを一番上に）。いらないカードは控え室へ
    onEnter({ g, me }) {
      const top = takeTop(g, me, 3);
      const keep = top.filter(c => nextWorth(g, me, c) >= 6).sort((a, b) => nextWorth(g, me, b) - nextWorth(g, me, a));
      const drop = top.filter(c => !keep.includes(c));
      me.deck.unshift(...keep);
      me.waiting.push(...drop);
      g.log(me, 'eff', `中須かすみ：デッキの上3枚：${keep.map(c => c.def.name).join('、') || 'なし'}を上に戻し、${drop.length}枚を控え室に置いた`);
    },
    fromWaiting: {
      // メインフェイズの終わりに、空いているエリアがあってエネルギーが余っていれば出す
      ai: ({ g, me, late }) => late && me.energy.active >= 2 && me.hand.length >= 1 && kasumiArea(g, me) >= 0 && willDiscard(g, me),
      run: ({ g, me, card }) => {
        const area = kasumiArea(g, me);
        if (area < 0 || !g.payEnergy(me, 2)) return false;
        discardWorst(g, me, 1);
        me.waiting.splice(me.waiting.indexOf(card), 1);
        g.log(me, 'eff', '中須かすみ：控え室から登場');
        g.putMember(me, card, area, { from: 'waiting' });
      },
    },
  },
};

function caraBonus(g, me) {
  const f = me.nijiAct && me.nijiAct.turn === g.turn ? me.nijiAct : null;
  if (!f || !f.energy) return 0;
  return f.member ? 2 : 1;
}

function sixColors(g, me) {
  const has = [0, 0, 0, 0, 0, 0];
  me.stage.forEach((s, area) => {
    if (!s) return;
    g.heartsOf(me, s, area).h.forEach((x, i) => { if (x > 0) has[i] = 1; });
  });
  return has.every(Boolean);
}

// 璃奈で探したいか：次のターンに出せる大きいメンバーが手札に無い
function rinaWants(g, me) {
  const nextE = me.energy.n + 1;
  const top = Math.max(0, ...me.stage.filter(Boolean).map(s => s.card.def.cost), 4);
  return !me.hand.some(c => isMember(c) && c.def.cost >= 9 && c.def.cost - top <= nextE);
}

// かすみを控え室から出すエリア：空いているエリア（このターンに登場したメンバーのいるエリアは選べない）
function kasumiArea(g, me) {
  return me.stage.findIndex(s => !s);
}

function lanzhu(me) {
  return me.liveZone.length >= 3 && me.liveZone.some(c => isLive(c) && isNiji(c));
}

// 13エマがウェイトにするメンバー：ほかのアクティブな虹ヶ咲メンバーのうちブレードが一番少ない人
function emmaTarget(me, slot) {
  return me.stage.filter(s => s && s !== slot && s.active && isNiji(s.card)).sort((a, b) => memberValue(a.card.def) - memberValue(b.card.def))[0] || null;
}

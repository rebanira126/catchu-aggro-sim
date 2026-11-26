// Printemps（μ's）で使うカードの効果（カード番号で登録）
// デッキ：劉茶さん「【ラブカ】新ことりで更なる安定感！Printemps」 https://note.com/liucha1122/n/n343727b5d05c
//
// このデッキの動き：メインフェイズやライブ開始時にメンバーをウェイトにして（コストを下げる・ハートを得る・ライブを拾う）、
// ライブ開始時に WAO-WAO Powerful day! や 17小泉花陽でアクティブに戻す。
// 「このターン中に Printemps のカードの効果でウェイトからアクティブにしたメンバー」は slot.prAct（そのターンの番号）で数える。
import { cardLabel } from '../engine/game.js';
import { inGroup, inUnit, isLive, isMember, discardWorst, willDiscard, recover, pickBest, takeTop, activateEnergy, cardWorth } from './lib.js';

const MUSE = "μ's";
const PR = 'Printemps';
const isMuse = c => inGroup(c.def, MUSE);
const isPr = c => inUnit(c.def, PR);
const needSum = need => need.reduce((a, b) => a + b, 0);

const WAO = 'PL!-pb1-028';    // WAO-WAO Powerful day!
const HANAYO17 = 'PL!-pb2-017'; // 小泉花陽（17）
const HANAYO15 = 'PL!-bp3-008'; // 小泉花陽（15）
const HONOKA7 = 'PL!-pb2-010';  // 高坂穂乃果（7）
const HONOKA2 = 'PL!-pb2-028';  // 高坂穂乃果（2）：ライブ開始時に自分をウェイト→黄+1
const HANAYO2B = 'PL!-bp4-017'; // 小泉花陽（2）：ライブ開始時に自分をウェイト→センターのμ'sにブレード+1
const HONOKA4 = 'PL!-pb2-019';  // 高坂穂乃果（4）：ライブ開始時に自分をウェイト＋手札1枚→センターのμ'sにブレード+2

const YELLOW = c => { const h = [0, 0, 0, 0, 0, 0]; h[2] = c; return { c: h }; };

// ライブ開始時にウェイトのメンバーをアクティブに戻せるか（WAO-WAOを置いている／17花陽の下にカードがある）
function under17(me) {
  return me.stage.reduce((n, s) => n + (s && s.card.def.id === HANAYO17 ? Math.min(3, s.under.length) : 0), 0);
}
function canReact(me, lives) {
  return lives.some(c => c.def.id === WAO) || under17(me) > 0;
}
const liveCards = me => (me.lives || []).map(l => l.card);

// Printemps の効果でメンバーをアクティブにする（7穂乃果・Love marginal が数える）
function wake(g, me, slot, label) {
  slot.active = true;
  slot.prAct = g.turn;
  g.log(me, 'eff', `${label}${cardLabel(slot.card)}をアクティブにした`);
}
const wokenCount = (g, me) => me.stage.filter(s => s && s.active && s.prAct === g.turn).length;

// ウェイトにする
function rest(g, me, slot, label) {
  slot.active = false;
  g.log(me, 'eff', `${label}${cardLabel(slot.card)}をウェイトにした`);
}

// 見積もり用：ライブ開始時にアクティブに戻るメンバーの数と、それで増えるエールの枚数
// pick：一緒に置くライブ
function reactEstimate(g, me, pick) {
  const wao = pick.some(c => c.def.id === WAO);
  const n17 = under17(me);
  const react = wao || n17 > 0;
  let waits = 0, cheer = 0;
  me.stage.forEach((s, area) => {
    if (!s || !isPr(s.card)) return;
    if (!s.active) { waits++; cheer += g.bladesOf(me, s, area); return; }
    const id = s.card.def.id;
    // ライブ開始時に自分からウェイトになるメンバー（estBlades で引いた分が戻る）
    if (id === HONOKA2) { waits++; cheer += 1; }
    else if (react && id === HANAYO2B && area !== 1) { waits++; cheer += 1 + 1; }
    else if (react && id === HONOKA4 && area !== 1 && me.hand.length >= 1) { waits++; cheer += 2 + 2; }
  });
  // 15花陽のライブ開始時：Printemps のメンバー1人をウェイト（estBlades で1引いてある）
  if (react && me.stage.some(s => s && s.active && s.card.def.id === HANAYO15)) { waits++; cheer += 1; }
  const n = wao ? waits : Math.min(waits, n17);
  const frac = waits ? n / waits : 0;
  cheer *= frac;
  // 7穂乃果：アクティブに戻したメンバー1人につきブレード+1
  cheer += n * me.stage.filter(s => s && s.card.def.id === HONOKA7).length;
  return { n, waits, cheer, wao };
}

// ライブの見積もり（preview）：戻るメンバーのエールは、組み合わせの最初のライブの見積もりにだけ足す（二重に数えない）
function previewReact(g, me, card, live, pick) {
  const p = pick && pick.length ? pick : [card];
  if (p[0] !== card) return null;
  const r = reactEstimate(g, me, p);
  live.cheer += Math.round(r.cheer);
  return r;
}

export default {
  // ---------------- ライブ ----------------
  // 小夜啼鳥恋詩（2点）bp4-024
  'PL!-bp4-024': {
    note: 'ライブ開始時：自分のμ\'sメンバー1人にブレード+1（アクティブのメンバーに）',
    order: { liveStart: 9 },
    liveStart({ g, me }) {
      const t = me.stage.map((s, a) => ({ s, a })).filter(x => x.s && x.s.active && isMuse(x.s.card))[0];
      if (!t) return;
      t.s.mods.push({ blades: 1, untilLiveEnd: true });
      g.log(me, 'eff', `小夜啼鳥恋詩：${cardLabel(t.s.card)}にブレード+1`);
    },
    preview({ g, me, card, live, pick }) {
      previewReact(g, me, card, live, pick);
      if (me.stage.some(s => s && s.active && isMuse(s.card))) live.cheer += 1;
    },
  },
  // Hello,星を数えて（3点）bp8-022
  'PL!-bp8-022': {
    note: 'ライブ成功時：エールで公開したカードに黄のブレードハートが5枚以上ならスコア+1',
    liveSuccess({ g, me, live }) {
      const n = me.cheer.filter(c => c.def.bh && c.def.bh.c === 3).length;
      if (n >= 5) { live.bonus += 1; g.log(me, 'eff', `Hello,星を数えて：黄のブレードハート${n}枚 → スコア+1`); }
    },
    preview({ g, me, card, live, pick }) { previewReact(g, me, card, live, pick); },
    successAdjust({ cheer }) { return cheer.filter(c => c.def.bh && c.def.bh.c === 3).length >= 5 ? 1 : 0; },
  },
  // WAO-WAO Powerful day!（5点）pb1-028
  [WAO]: {
    note: 'ライブ開始時：Printempsのメンバーをアクティブにする。ウェイトから3人以上アクティブになったらスコア+1',
    order: { liveStart: 6 },
    liveStart({ g, me, live }) {
      let n = 0;
      for (const s of me.stage) if (s && !s.active && isPr(s.card)) { wake(g, me, s, 'WAO-WAO Powerful day!：'); n++; }
      if (n >= 3) { live.bonus += 1; g.log(me, 'eff', `WAO-WAO Powerful day!：${n}人がアクティブになった → スコア+1`); }
    },
    preview({ g, me, card, live, pick }) {
      previewReact(g, me, card, live, pick);
      const r = reactEstimate(g, me, pick && pick.length ? pick : [card]);
      if (r.waits >= 3) live.bonus += 1;
    },
  },
  // Love marginal（7点）pb2-040
  'PL!-pb2-040': {
    note: 'ライブ開始時：このターンにPrintempsの効果でウェイトからアクティブにしたメンバーが1人以上なら必要ハートの無色-3、2人以上でさらに-2、3人以上でさらに-1',
    order: { liveStart: 8 },
    liveStart({ g, me, live }) {
      const n = wokenCount(g, me);
      const red = n >= 3 ? 6 : n >= 2 ? 5 : n >= 1 ? 3 : 0;
      if (!red) return;
      live.need[0] = Math.max(0, live.need[0] - red);
      g.log(me, 'eff', `Love marginal：アクティブにしたメンバー${n}人 → 必要ハートの無色-${red}`);
    },
    preview({ g, me, card, live, pick }) {
      previewReact(g, me, card, live, pick);
      const n = reactEstimate(g, me, pick && pick.length ? pick : [card]).n;
      const red = n >= 3 ? 6 : n >= 2 ? 5 : n >= 1 ? 3 : 0;
      live.need[0] = Math.max(0, live.need[0] - red);
    },
  },

  // ---------------- メンバー ----------------
  // 高坂穂乃果（2）pb2-028
  [HONOKA2]: {
    note: 'ライブ開始時：自分をウェイトにしてよい→黄+1（いつも使う）',
    order: { liveStart: 2 },
    liveStart({ g, me, slot }) {
      if (!slot.active) return;
      rest(g, me, slot, '高坂穂乃果：');
      slot.mods.push({ hearts: YELLOW(1), untilLiveEnd: true });
    },
    estHearts({ slot }) { return slot.active ? YELLOW(1) : null; },
    estBlades() { return -1; },
  },
  // 小泉花陽（2）bp4-017
  [HANAYO2B]: {
    note: 'ライブ開始時：自分をウェイトにしてよい→センターのμ\'sメンバーにブレード+1（あとでアクティブに戻せるときだけ）',
    order: { liveStart: 2 },
    liveStart({ g, me, slot, area }) {
      const c = me.stage[1];
      if (!slot.active || area === 1 || !c || !isMuse(c.card) || !canReact(me, liveCards(me))) return;
      rest(g, me, slot, '小泉花陽：');
      c.mods.push({ blades: 1, untilLiveEnd: true });
      g.log(me, 'eff', `小泉花陽：センターの${cardLabel(c.card)}にブレード+1`);
    },
  },
  // 高坂穂乃果（4）pb2-019
  [HONOKA4]: {
    note: 'ライブ開始時：自分をウェイトにし手札1枚を捨ててよい→センターのμ\'sメンバーにブレード+2（あとでアクティブに戻せるときだけ）',
    order: { liveStart: 2 },
    liveStart({ g, me, slot, area }) {
      const c = me.stage[1];
      if (!slot.active || area === 1 || !c || !isMuse(c.card) || !me.hand.length || !canReact(me, liveCards(me))) return;
      rest(g, me, slot, '高坂穂乃果：');
      discardWorst(g, me, 1);
      c.mods.push({ blades: 2, untilLiveEnd: true });
      g.log(me, 'eff', `高坂穂乃果：センターの${cardLabel(c.card)}にブレード+2`);
    },
  },
  // 小泉花陽（2）pb2-008
  'PL!-pb2-008': {
    note: '登場：自分をウェイトにしてよい→デッキの上4枚から必要ハート合計8以上のμ\'sライブを1枚手札に、残りは控え室（いつも使う）',
    onEnter({ g, me, slot }) {
      rest(g, me, slot, '小泉花陽：');
      const top = takeTop(g, me, 4);
      const pick = pickBest(g, me, top, c => isLive(c) && isMuse(c) && needSum(c.def.need) >= 8);
      if (pick) { top.splice(top.indexOf(pick), 1); me.hand.push(pick); }
      me.waiting.push(...top);
      g.log(me, 'eff', `小泉花陽：デッキの上4枚から${pick ? cardLabel(pick) + 'を手札に加えた' : '手札に加えるカードなし'}`);
    },
  },
  // 南ことり（4）bp8-003
  'PL!-bp8-003': {
    note: '常時：ウェイトのμ\'sメンバーがμ\'sメンバーとバトンタッチするとき、減るコストは「コスト+1」。起動（ターン1回）：自分をウェイトにし手札1枚を捨てる→デッキの上2枚から1枚手札に、残りは控え室',
    batonAura({ g, slot, card }) { return !slot.active && isMuse(slot.card) && isMember(card) && isMuse(card) ? 1 : 0; },
    activated: [{
      once: 1,
      can: ({ slot, me }) => slot.active && me.hand.length >= 1,
      restPlan: ({ slot }) => [{ rest: [slot] }],
      // 1〜2T（ライブより手札を整える）、WAO-WAOでアクティブに戻せるとき、手札にライブが無いとき
      ai: ({ g, me, slot }) => me.hand.length >= 2 && (g.turn <= 2 || me.hand.some(c => c.def.id === WAO) || under17(me) > 0 || !me.hand.some(isLive) || batonHelps(g, me, slot)),
      run({ g, me, slot }) {
        rest(g, me, slot, '南ことり：');
        discardWorst(g, me, 1);
        const top = takeTop(g, me, 2);
        const pick = pickBest(g, me, top);
        if (pick) { top.splice(top.indexOf(pick), 1); me.hand.push(pick); }
        me.waiting.push(...top);
        g.log(me, 'eff', `南ことり：デッキの上2枚から${pick ? cardLabel(pick) + 'を手札に加えた' : '手札に加えるカードなし'}`);
      },
    }],
  },
  // 南 ことり（13）pb1-003
  'PL!-pb1-003': {
    note: '登場：自分をウェイトにしてよい→ステージのPrintempsメンバー1人につきエネルギーを1枚アクティブに（2枚以上起こせて、手札にメンバーがいるときに使う）',
    onEnter({ g, me, slot }) {
      const k = me.stage.filter(s => s && isPr(s.card)).length;
      const gain = Math.min(k, me.energy.n - me.energy.active);
      if (gain < 2 || !me.hand.some(isMember)) return;
      rest(g, me, slot, '南 ことり：');
      activateEnergy(me, k);
      g.log(me, 'eff', `南 ことり：エネルギーを${gain}枚アクティブにした`);
    },
    refund({ me }) { return me.stage.filter(s => s && isPr(s.card)).length + 1; },
  },
  // 高坂穂乃果（7）pb2-010
  [HONOKA7]: {
    note: 'ライブ開始時：このターンにPrintempsの効果でウェイトからアクティブにしたメンバー1人につきブレード+1',
    order: { liveStart: 8 },
    liveStart({ g, me, slot }) {
      const n = wokenCount(g, me);
      if (!n) return;
      slot.mods.push({ blades: n, untilLiveEnd: true });
      g.log(me, 'eff', `高坂穂乃果：アクティブにしたメンバー${n}人 → ブレード+${n}`);
    },
  },
  // 南 ことり（13）pb2-012
  'PL!-pb2-012': {
    note: '常時：出すとき名前の異なるPrintempsメンバー2人をウェイトにしてよい→コスト-2（使えるときはいつも使う）。起動（ターン1回）：自分をウェイトにし、手札2枚を捨てるかPrintempsメンバー2人をウェイト→控え室のPrintempsのライブを1枚手札に',
    handCost({ me, card, base }) {
      return me.hand.includes(card) && restPair(me) ? base - 2 : base;
    },
    // コスト-2のためにウェイトにする2人は、なるべくバトンタッチ元以外から選ぶ（バトンタッチ元は控え室に行くので、ウェイトの人数が残らない）
    //  ステージに3人いれば、残る2人をウェイトにして、ライブ開始時のWAO-WAOで起こせる人数を増やす（noteの「2コス2枚をウェイトにして新13ことり」）
    //  バトンタッチ元以外で2人そろわないか、エネルギーが足りないときだけ、バトンタッチ元も含める（4ことりの常時能力でバトンタッチの減る値が+1になる）
    restsOnPlay({ g, me, card, slot }) {
      if (!me.hand.includes(card) || !isPr(slot.card)) { me.k13Choice = null; return false; }
      const inc = includeSource(g, me, card, slot);
      me.k13Choice = { card: card.uid, slot: slot.card.uid, inc };
      return inc;
    },
    onPay({ g, me, card, area, baton }) {
      const src = baton ? me.stage[area] : null;
      const ch = me.k13Choice;
      const inc = !!(src && ch && ch.card === card.uid && ch.slot === src.card.uid ? ch.inc : src && restPair(me, src) && restPair(me, src).includes(src) && !restPair(me, null, src));
      me.k13Choice = null;
      const pair = inc ? restPair(me, src) : restPair(me, null, src);
      if (!pair) return;
      for (const s of pair) rest(g, me, s, '南 ことり（コスト）：');
    },
    activated: [{
      once: 1,
      // 控え室にPrintempsのライブが無くても、コストを払って使える（自分をウェイトにして、WAO-WAOで起こす人数を増やすため）
      can: ({ me, slot }) => slot.active && (otherActivePr(me, slot).length >= 2 || me.hand.length >= 2),
      ai: ({ g, me, slot, late }) => late && payChoice(g, me, slot) != null,
      // 盤面の検討用：自分＋ほかのPrintempsメンバー2人をウェイトにする組み合わせ
      restPlan: ({ me, slot }) => {
        const o = otherActivePr(me, slot);
        const out = [];
        for (let i = 0; i < o.length; i++) for (let j = i + 1; j < o.length; j++) out.push({ rest: [slot, o[i], o[j]], force: [o[i], o[j]] });
        return out;
      },
      run({ g, me, slot, force }) {
        const how = force ? 'rest' : payChoice(g, me, slot);
        if (how == null) return false;
        rest(g, me, slot, '南 ことり：');
        if (how === 'rest') for (const s of force || otherActivePr(me, slot).slice(0, 2)) rest(g, me, s, '南 ことり：');
        else discardWorst(g, me, 2, new Set(me.hand.filter(c => c.def.id === WAO).slice(0, 1).map(c => c.uid)));
        // ウェイトにして払ったときは、アクティブに戻せる WAO-WAO を優先して拾う
        const wao = how === 'rest' && !me.hand.some(c => c.def.id === WAO) && me.waiting.find(c => c.def.id === WAO);
        if (wao) { me.waiting.splice(me.waiting.indexOf(wao), 1); me.hand.push(wao); g.log(me, 'eff', `南 ことり：控え室から${cardLabel(wao)}を手札に加えた`); }
        else recover(g, me, c => isLive(c) && isPr(c), '南 ことり：');
      },
    }],
  },
  // 小泉花陽（17）pb2-017
  [HANAYO17]: {
    note: '登場：控え室のPrintempsメンバー4枚を下に置く。ライブ開始時：下のカードを3枚まで控え室に置き、1枚につきウェイトのPrintempsメンバー1人をアクティブに',
    order: { liveStart: 7 },
    onEnter({ g, me, slot }) {
      const cand = me.waiting.filter(c => isMember(c) && isPr(c)).sort((a, b) => cardWorth(g, me, a) - cardWorth(g, me, b)).slice(0, 4);
      for (const c of cand) { me.waiting.splice(me.waiting.indexOf(c), 1); slot.under.push(c); }
      if (cand.length) g.listLog(me, 'eff', cand, t => `小泉花陽：控え室から${t}を下に置いた`);
    },
    liveStart({ g, me, slot }) {
      const waits = me.stage.map((s, a) => ({ s, a })).filter(x => x.s && !x.s.active && isPr(x.s.card))
        .sort((x, y) => g.bladesOf(me, y.s, y.a) - g.bladesOf(me, x.s, x.a));
      const k = Math.min(3, slot.under.length, waits.length);
      for (let i = 0; i < k; i++) {
        const u = slot.under.shift();
        me.waiting.push(u);
        wake(g, me, waits[i].s, '小泉花陽：');
      }
    },
  },
  // 小泉花陽（15）bp3-008
  [HANAYO15]: {
    note: '起動（ターン1回）：自分をウェイト→控え室のμ\'sのライブを1枚手札に。ライブ開始時：μ\'sメンバー1人をウェイトにしてよい→黄+2（あとでアクティブに戻せるか、ブレード1以下のメンバーがいるとき）',
    order: { liveStart: 3 },
    activated: [{
      once: 1,
      can: ({ me, slot }) => slot.active && me.waiting.some(c => isLive(c) && isMuse(c)),
      restPlan: ({ slot }) => [{ rest: [slot] }],
      ai: ({ me, late }) => me.hand.some(c => c.def.id === WAO) || under17(me) > 0 || !me.hand.some(isLive) || (late && me.hand.filter(isLive).length < 2),
      run({ g, me, slot }) {
        rest(g, me, slot, '小泉花陽：');
        recover(g, me, c => isLive(c) && isMuse(c), '小泉花陽：');
      },
    }],
    liveStart({ g, me, slot }) {
      const react = canReact(me, liveCards(me));
      const cand = me.stage.map((s, a) => ({ s, a, b: s ? g.bladesOf(me, s, a) : 0 }))
        .filter(x => x.s && x.s.active && isMuse(x.s.card) && (!react || isPr(x.s.card)))
        .sort((x, y) => x.b - y.b);
      const t = cand[0];
      if (!t || (!react && t.b > 1)) return;
      rest(g, me, t.s, '小泉花陽：');
      slot.mods.push({ hearts: YELLOW(2), untilLiveEnd: true });
    },
    estHearts() { return YELLOW(2); },
    estBlades() { return -1; },
  },
};

// 13ことりのコスト：名前の異なる、アクティブなPrintempsメンバー2人（バトンタッチ元を先に選ぶ）
function restPair(me, first = null, without = null) {
  const act = me.stage.filter(s => s && s !== without && s.active && isPr(s.card));
  const order = first && act.includes(first) ? [first, ...act.filter(s => s !== first)] : act;
  const pick = [];
  const names = new Set();
  for (const s of order) {
    if (s.card.def.names.some(n => names.has(n))) continue;
    pick.push(s); s.card.def.names.forEach(n => names.add(n));
    if (pick.length === 2) return pick;
  }
  return null;
}
// 新13ことりのコスト-2のウェイトに、バトンタッチ元を含めるか
//  バトンタッチ元以外の2人でウェイトにでき、そのときのコストを払えるなら含めない
function includeSource(g, me, card, slot) {
  const withSrc = restPair(me, slot);
  if (!withSrc || !withSrc.includes(slot)) return false;
  if (!restPair(me, null, slot)) return true;
  // 含めないときのコスト：手札でのコスト（-2済み）－バトンタッチ元のコスト（アクティブのまま）
  const exCost = Math.max(0, g.costOf(me, card) - slot.card.def.cost);
  return exCost > me.energy.active;
}
// ウェイトにすると「コスト+1」減って、手札のμ'sメンバーをこのメンバーからバトンタッチで出せるようになるか
function batonHelps(g, me, slot) {
  if (slot.enteredTurn === g.turn) return false;
  const e = me.energy.active;
  return me.hand.some(c => isMember(c) && isMuse(c) && g.costOf(me, c) - slot.card.def.cost > e && g.costOf(me, c) - slot.card.def.cost - 1 <= e);
}
function otherActivePr(me, slot) {
  return me.stage.filter(s => s && s !== slot && s.active && isPr(s.card));
}
// 13ことりの起動の払い方：'rest'（2人ウェイト）／'discard'（手札2枚）／null（使わない）
function payChoice(g, me, slot) {
  if (!slot.active) return null;
  const others = otherActivePr(me, slot);
  // 手札にWAO-WAOがあり、この起動でウェイトのPrintempsが3人以上になるなら使う（ライブ開始時に3人起こしてスコア+1。noteの3Tの6点）
  //  2人ウェイトで払えるならそちら（手札を残す）、無理なら手札2枚（WAO-WAOは残す）
  const waitPr = me.stage.filter(s => s && !s.active && isPr(s.card)).length;
  if (me.hand.some(c => c.def.id === WAO) && waitPr < 3) {
    if (others.length >= 2 && waitPr + 3 >= 3) return 'rest';
    if (waitPr + 1 >= 3 && me.hand.length >= 3) return 'discard';
  }
  if (!me.waiting.some(c => isLive(c) && isPr(c))) return null;
  const react = me.hand.some(c => c.def.id === WAO) || me.waiting.some(c => c.def.id === WAO) || under17(me) >= 2;
  if (others.length >= 2 && react) return 'rest';
  if (willDiscard(g, me, 2)) return 'discard';
  // WAO-WAOを拾い直すためなら、手札を2枚捨ててでも使う（手札が1枚以上残るとき）
  if (me.hand.length >= 3 && me.waiting.some(c => c.def.id === WAO) && !me.hand.some(c => c.def.id === WAO)) return 'discard';
  if (others.length >= 2 && !me.hand.some(isLive)) return 'rest';
  return null;
}

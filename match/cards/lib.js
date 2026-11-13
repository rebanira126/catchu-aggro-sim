// カード効果を書くときの共通の道具（判断のしかたも含む）
import { memberValue, protectedCards, preferBonus, turnTarget } from '../engine/ai.js';

export const inGroup = (def, g) => def.groups.includes(g);
export const inUnit = (def, u) => def.unit === u;
export const isMember = c => c.def.kind === 'M';
export const isLive = c => c.def.kind === 'L';

// ステージにいる、条件に合うメンバーの「名前の種類」の数
export function distinctNames(me, pred, exceptSlot = null) {
  const names = new Set();
  for (const s of me.stage) if (s && s !== exceptSlot && pred(s.card.def)) for (const n of s.card.def.names) names.add(n);
  return names.size;
}

// エネルギーを n 枚までアクティブにする
export function activateEnergy(me, n) {
  me.energy.active = Math.min(me.energy.n, me.energy.active + n);
}

// デッキの上から n 枚を取り出す（足りなければリフレッシュ 10.2.2.2：控え室をシャッフルしてデッキの下へ）
export function takeTop(g, me, n) {
  if (me.deck.length < n && me.waiting.length) {
    me.deck = me.deck.concat(g.shuffle(me.waiting.splice(0)));
    g.log(me, 'rule', 'リフレッシュ（控え室をデッキの下に入れた）');
  }
  return me.deck.splice(0, n);
}

// ---------------- 判断の目安 ----------------
// カード1枚の「手札に持っておきたさ」。捨てるときは低いものから、拾うときは高いものから選ぶ
export function cardWorth(g, me, card) {
  const inHand = me.hand.includes(card);
  if (isLive(card)) {
    // 自分以外に手札にあるライブの枚数で決める（同じライブが2枚あっても両方を低く見ないように）
    const others = me.hand.filter(isLive).length - (inHand ? 1 : 0);
    const base = others === 0 ? 9 : others === 1 ? 7 : others === 2 ? 5 : 2;
    const need = card.def.need.reduce((a, b) => a + b, 0);
    // 決めの大きいライブは、手札に無ければ探す価値が高い
    const bl = me.prefer && me.prefer.bigLive;
    if (bl && g.turn >= 2 && card.def.score >= bl && !me.hand.some(c => c !== card && isLive(c) && c.def.score >= bl)) return 8.5;
    return base + (need <= 8 ? 0.5 : 0) + card.def.score * 0.05;
  }
  const e = me.energy.n;
  // バトンタッチで減る分も考えた、次のターンに出すのに必要なエネルギー
  const onStage = Math.max(0, ...me.stage.filter(Boolean).map(s => s.card.def.cost));
  const c = Math.max(0, card.def.cost - onStage);
  const v = memberValue(card.def) + preferBonus(me, card.def) + planNeed(g, me, card) * 4;
  if (c <= e + 1) return 4 + v / 4;
  if (c <= e + 4) return 3 + v / 8;
  return 1;
}

export function pickBest(g, me, cards, pred = () => true) {
  let best = null, bw = -Infinity;
  for (const c of cards) {
    if (!pred(c)) continue;
    const w = cardWorth(g, me, c);
    if (w > bw) { bw = w; best = c; }
  }
  return best;
}

// 手札を n 枚控え室に置く（持っておきたさが低いものから）
export function discardWorst(g, me, n, keep = new Set()) {
  const out = [];
  // このターンに出す予定のカード（me.reserved）と、次のターン以降のために残すカードはなるべく捨てない
  const soft = new Set([...keep, ...(me.reserved || []), ...protectedCards(g, me)]);
  for (let k = 0; k < n; k++) {
    let cand = me.hand.filter(c => !soft.has(c.uid));
    if (!cand.length) cand = me.hand.filter(c => !keep.has(c.uid));
    if (!cand.length) break;
    cand.sort((a, b) => cardWorth(g, me, a) - cardWorth(g, me, b));
    const c = cand[0];
    me.hand.splice(me.hand.indexOf(c), 1);
    me.waiting.push(c);
    out.push(c);
  }
  if (out.length) g.log(me, 'eff', `手札から${out.map(c => c.def.name).join('、')}を控え室に置いた`);
  return out;
}

// 「手札を1枚控え室に置いてもよい」を払うか：残したいカード以外に、捨ててよいカードがあるときだけ払う
export function willDiscard(g, me, n = 1) {
  const soft = new Set([...(me.reserved || []), ...protectedCards(g, me)]);
  const cand = me.hand.filter(c => !soft.has(c.uid)).sort((a, b) => cardWorth(g, me, a) - cardWorth(g, me, b));
  if (cand.length < n) return false;
  return cardWorth(g, me, cand[n - 1]) <= ((me.prefer && me.prefer.discardAt) ?? 5.5);
}

// 控え室から条件に合うカードを1枚手札に加える
export function recover(g, me, pred, label = '') {
  const c = pickBest(g, me, me.waiting, pred);
  if (!c) return null;
  me.waiting.splice(me.waiting.indexOf(c), 1);
  me.hand.push(c);
  g.log(me, 'eff', `${label}控え室から${c.def.name}を手札に加えた`);
  return c;
}

// デッキの上から n 枚見て、条件に合うものを1枚まで手札に。残りは控え室
export function lookTake(g, me, n, pred, label = '') {
  const top = takeTop(g, me, n);
  const pick = pickBest(g, me, top, pred);
  if (pick) { top.splice(top.indexOf(pick), 1); me.hand.push(pick); }
  me.waiting.push(...top);
  g.log(me, 'eff', `${label}デッキの上${n}枚から${pick ? pick.def.name + 'を手札に加えた' : '手札に加えるカードなし'}`);
  return pick;
}

// 「このメンバーをステージから控え室に置く：…」の起動能力で、メンバーを控え室へ
export function sacrificeSelf(g, me, slot, area) {
  me.stage[area] = null;
  me.waiting.push(slot.card);
  g.log(me, 'eff', `${slot.card.def.name}をステージから控え室に置いた`);
}

// ブレードハート（色ハート・ALL・ドロー・スコアのアイコン）を持つカードか
export const hasBladeHeart = def => !!(def.bh || def.icon);

// 相手のステージのメンバー1人をウェイトにする（条件に合うアクティブなメンバーのうち、ブレードが一番多い人）
export function waitOpp(g, opp, pred = () => true, label = '') {
  let best = null, ba = -1;
  opp.stage.forEach((s, area) => {
    if (!s || !s.active || !pred(s, area)) return;
    const b = g.bladesOf(opp, s, area);
    if (b > ba) { ba = b; best = s; }
  });
  if (!best) return null;
  best.active = false;
  g.log(opp, 'eff', `${label}${best.card.def.name}がウェイトになった`);
  return best;
}

// ステージのメンバーが全員『グループ』か
export const allInGroup = (me, grp) => me.stage.every(s => !s || inGroup(s.card.def, grp));

// カード名に「名前」を含むか（空白の有無はそろえて比べる）
export const hasName = (def, n) => (def.names || []).some(x => x.replace(/\s/g, '') === n.replace(/\s/g, ''));

// 「このメンバーをウェイトにし、手札を1枚控え室に置いてもよい：デッキの上から5枚見て、コスト min 以上の『グループ』のメンバーを1枚手札に」
export function searchBigOnEnter(group, min = 9, label = '') {
  return {
    note: `登場：自分をウェイトにし手札1枚を捨ててよい→デッキの上5枚からコスト${min}以上の${group}メンバーを1枚手札に`,
    onEnter({ g, me, slot }) {
      if (me.hand.some(c => isMember(c) && c.def.cost >= min)) return;
      if (!willDiscard(g, me)) return;
      slot.active = false;
      discardWorst(g, me, 1);
      lookTake(g, me, 5, c => isMember(c) && c.def.cost >= min && inGroup(c.def, group), label);
    },
    aiBonus({ me }) { return me.hand.some(c => isMember(c) && c.def.cost >= min) ? 0 : 1.5; },
  };
}

// デッキの上から n 枚見て、好きな枚数を好きな順番で上に戻し、残りを控え室に置く（持っておきたいカードだけ戻す）
export function scry(g, me, n, label = '') {
  const top = takeTop(g, me, n);
  const keep = top.filter(c => cardWorth(g, me, c) >= 5).sort((a, b) => cardWorth(g, me, b) - cardWorth(g, me, a));
  const drop = top.filter(c => !keep.includes(c));
  me.deck.unshift(...keep);
  me.waiting.push(...drop);
  g.log(me, 'eff', `${label}デッキの上${n}枚：${keep.length}枚を上に戻し、${drop.length}枚を控え室に置いた`);
}

// 好きな色のハートを1つ：手札のライブの必要ハートで、ステージに足りない色を選ぶ（なければ ALL 扱い）
export function anyColorHeart(slot) {
  slot.mods.push({ hearts: { all: 1 }, untilLiveEnd: true });
}

// 相手のステージのメンバー n 人までウェイト
export function waitOppN(g, opp, n, pred, label = '', lock = false) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const s = waitOpp(g, opp, x => !out.includes(x) && pred(x), label);
    if (!s) break;
    if (lock) s.lockActive = true;
    out.push(s);
  }
  return out;
}

// 相手がまだこのターンのライブをしていないか（ウェイトにして効果があるか）
export const oppYetToPerform = (g, me) => g.order()[0] === me;

// 次の2ターンの目標の盤面に入っていて、まだステージに無いメンバーなら 1（サーチや捨てる札の判断で高く見る）
function planNeed(g, me, card) {
  for (const t of [g.turn + 1, g.turn + 2]) {
    const tgt = turnTarget(me, t);
    if (!tgt || !tgt.board) continue;
    for (const x of tgt.board[0]) {
      const it = typeof x === 'number' ? { cost: x } : x;
      const match = d => (it.id ? d.id === it.id : d.cost === it.cost);
      if (match(card.def) && !me.stage.some(s => s && match(s.card.def))) return 1;
    }
  }
  return 0;
}

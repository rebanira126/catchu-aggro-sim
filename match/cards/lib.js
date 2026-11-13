// カード効果を書くときの共通の道具（判断のしかたも含む）
import { memberValue } from '../engine/ai.js';

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
    const base = others === 0 ? 9 : others === 1 ? 6 : 2;
    return base + card.def.score * 0.1;
  }
  const e = me.energy.n;
  // バトンタッチで減る分も考えた、次のターンに出すのに必要なエネルギー
  const onStage = Math.max(0, ...me.stage.filter(Boolean).map(s => s.card.def.cost));
  const c = Math.max(0, card.def.cost - onStage);
  if (c <= e + 1) return 4 + memberValue(card.def) / 4;
  if (c <= e + 4) return 3 + memberValue(card.def) / 8;
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
  for (let k = 0; k < n; k++) {
    const cand = me.hand.filter(c => !keep.has(c.uid));
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

// 「手札を1枚控え室に置いてもよい」を払うか：手札に捨ててよいカードがあるときだけ払う
export function willDiscard(g, me, n = 1) {
  if (me.hand.length < n) return false;
  const sorted = me.hand.slice().sort((a, b) => cardWorth(g, me, a) - cardWorth(g, me, b));
  return cardWorth(g, me, sorted[n - 1]) <= 4 || me.hand.length >= 5;
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

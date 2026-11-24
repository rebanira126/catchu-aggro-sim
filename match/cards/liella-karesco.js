// カレスコランプ（常夏）で使うLiella!のカード効果（カード番号で登録）
// デッキ：つきみやさん「ウエイト無効化！4t12エネの暴力！ラブカ秋選抜東北エリア 4-0 優勝【カレスコランプ(常夏)】」
//   https://note.com/tukimiya_816/n/n97089b824952
import { cardLabel } from '../engine/game.js';
import { inUnit, inGroup, isLive, isMember, discardWorst, willDiscard, takeTop, pickBest, cardWorth, hasBladeHeart } from './lib.js';

const KS = 'KALEIDOSCORE';
const isLiella = c => inGroup(c.def, 'Liella!');
const isLiellaMember = c => isMember(c) && isLiella(c);

export default {
  // ---------------- ライブ ----------------
  // WE WILL!!（2点）bp7-024
  'PL!SP-bp7-024': {
    note: 'ライブ成功時：自分のエネルギーが相手より2枚以上多ければスコア+1',
    liveSuccess({ g, me, live }) {
      const opp = g.opp(me);
      if (me.energy.n >= opp.energy.n + 2) { live.bonus += 1; g.log(me, 'eff', `WE WILL!!：エネルギー${me.energy.n}枚（相手${opp.energy.n}枚）→ スコア+1`); }
    },
    preview({ g, me, live }) { if (me.energy.n >= g.opp(me).energy.n + 2) live.bonus += 1; },
  },
  // ニュートラル（5点）pb2-049
  'PL!SP-pb2-049': {
    note: 'ライブ成功時：エールでKALEIDOSCOREのカードを5枚以上公開していればエネルギーを1枚ウェイトで置く。エネルギーが11枚以上ならスコア+1',
    liveSuccess({ g, me, live }) {
      const n = me.cheer.filter(c => inUnit(c.def, KS)).length;
      if (n >= 5) g.addEnergyByEffect(me, { label: `ニュートラル（KALEIDOSCORE${n}枚）：` });
      if (me.energy.n >= 11) { live.bonus += 1; g.log(me, 'eff', `ニュートラル：エネルギー${me.energy.n}枚 → スコア+1`); }
    },
    preview({ me, live }) { if (me.energy.n >= 11) live.bonus += 1; },
  },

  // ---------------- メンバー ----------------
  // 唐 可可（2）bp2-002
  'PL!SP-bp2-002': {
    note: '登場：デッキの上3枚からコスト11以上のカードを1枚手札に（あれば）、残りは控え室',
    onEnter({ g, me }) {
      const top = takeTop(g, me, 3);
      const pick = pickBest(g, me, top, c => isMember(c) && c.def.cost >= 11);
      if (pick) { top.splice(top.indexOf(pick), 1); me.hand.push(pick); }
      me.waiting.push(...top);
      g.log(me, 'eff', `唐 可可：デッキの上3枚から${pick ? cardLabel(pick) + 'を手札に加えた' : '手札に加えるカードなし'}`);
    },
  },
  // 唐 可可（10）pb2-013
  'PL!SP-pb2-013': {
    note: '登場：手札のKALEIDOSCOREのカードを1枚捨ててよい→エネルギーを1枚ウェイトで置く。捨てたカードがブレードハートを持たなければ1枚引く（ブレードハートのないカードを優先して捨てる）',
    onEnter({ g, me }) {
      if (me.energyDeck <= 0) return;
      const keep = new Set([...(me.reserved || [])]);
      const cand = me.hand.filter(c => inUnit(c.def, KS) && !keep.has(c.uid))
        .sort((a, b) => (cardWorth(g, me, a) - (hasBladeHeart(a.def) ? 0 : 2)) - (cardWorth(g, me, b) - (hasBladeHeart(b.def) ? 0 : 2)));
      const c = cand[0];
      if (!c) return;
      me.hand.splice(me.hand.indexOf(c), 1);
      me.waiting.push(c);
      g.log(me, 'eff', `唐 可可：${cardLabel(c)}を控え室に置いた`);
      g.addEnergyByEffect(me, { label: '唐 可可：' });
      if (!hasBladeHeart(c.def)) g.draw(me, 1);
    },
  },
  // 桜小路きな子（10）bp2-006
  'PL!SP-bp2-006': {
    note: '登場：バトンタッチで控え室に置かれたLiella!メンバーを手札に。起動（ターン1回）：手札のコスト4以下のLiella!メンバーを1枚捨てて、その登場能力を使う（ランプの4コスト、なければ2恋。2可可はあとの進行に要るので使わない）',
    onEnter({ g, me, baton, batonFrom }) {
      if (!baton || !batonFrom) return;
      const c = batonFrom.card;
      const i = me.waiting.indexOf(c);
      if (i < 0 || !isLiellaMember(c)) return;
      me.waiting.splice(i, 1);
      me.hand.push(c);
      g.log(me, 'eff', `桜小路きな子：${cardLabel(c)}を手札に戻した`);
    },
    activated: [{
      once: 1,
      can: ({ g, me }) => !!kinakoTarget(g, me),
      ai: ({ g, me }) => !!kinakoTarget(g, me),
      run({ g, me }) {
        const c = kinakoTarget(g, me);
        if (!c) return false;
        me.hand.splice(me.hand.indexOf(c), 1);
        me.waiting.push(c);
        g.log(me, 'eff', `桜小路きな子：${cardLabel(c)}を控え室に置いて、その登場能力を使う`);
        const ef = g.effect(c);
        const slot = { card: c, active: true, under: [], enteredTurn: g.turn, mods: [] };
        g.runEffect(me, c, 'onEnter', () => ef.onEnter({ g, me, opp: g.opp(me), card: c, slot, area: -1, baton: false }));
      },
    }],
  },
  // 葉月 恋（11）bp5-005
  'PL!SP-bp5-005': {
    note: '起動（ターン1回）：デッキの上3枚を控え室に置く→Liella!メンバー1枚につきブレード+1。自動（ターン1回・メインフェイズ）：カードが控え室に置かれたとき、エネルギー1枚でその中から1枚手札に（この起動で置いたカードから拾う）',
    activated: [{
      once: 1,
      can: () => true,
      ai: ({ late }) => late,
      run({ g, me, slot }) {
        const top = takeTop(g, me, 3);
        me.waiting.push(...top);
        const n = top.filter(isLiellaMember).length;
        if (n) slot.mods.push({ blades: n, untilLiveEnd: true });
        g.listLog(me, 'eff', top, t => `葉月 恋：デッキの上から${t}を控え室に置いた${n ? `（ブレード+${n}）` : ''}`);
        // 自動能力：エネルギー1枚で1枚拾う（ライブや大きいメンバーがあるとき）
        const pick = pickBest(g, me, top, c => isLive(c) || (isMember(c) && c.def.cost >= 10));
        if (pick && me.energy.active >= 1 && (!slot.uses || !slot.uses.auto11 || slot.uses.auto11 !== g.turn)) {
          me.energy.active -= 1;
          me.waiting.splice(me.waiting.indexOf(pick), 1);
          me.hand.push(pick);
          slot.uses = slot.uses || {};
          slot.uses.auto11 = g.turn;
          g.log(me, 'eff', `葉月 恋：エネルギー1枚で${cardLabel(pick)}を手札に加えた`);
        }
      },
    }],
  },
  // 嵐 千砂都＆鬼塚夏美（15）pb2-000
  'PL!SP-pb2-000': {
    note: '常時：2人のメンバーとバトンタッチしてよい。登場：バトンタッチで控え室に置かれたLiella!メンバー1枚につき1枚引き、そのうちブレードハートを持たないもの1枚につきブレード+2',
    doubleBaton: true,
    onEnter({ g, me, slot, baton, batonFrom, second }) {
      if (!baton) return;
      const out = [batonFrom, second].filter(Boolean).map(s => s.card).filter(isLiellaMember);
      if (!out.length) return;
      g.draw(me, out.length);
      const nb = out.filter(c => !hasBladeHeart(c.def)).length;
      if (nb) slot.mods.push({ blades: 2 * nb, untilLiveEnd: true });
      g.log(me, 'eff', `嵐 千砂都＆鬼塚夏美：${out.length}枚引いた${nb ? `（ブレード+${2 * nb}）` : ''}`);
    },
  },
};

// きな子の起動で捨てるカード：ランプの4コスト（ほかに捨てる手札があるとき）→ 2恋（2可可はあとの進行に要るので使わない）
function kinakoTarget(g, me) {
  const keep = new Set([...(me.reserved || [])]);
  const cand = me.hand.filter(c => isLiellaMember(c) && c.def.cost <= 4 && !keep.has(c.uid) && g.effect(c) && g.effect(c).onEnter);
  const ramp = cand.filter(c => /エネルギーカードを1枚ウェイト状態で置く/.test(c.def.text || '') && c.def.cost === 4);
  if (ramp.length && me.energyDeck > 0 && me.hand.length >= 3 && (g.turn <= 2 || willDiscard(g, me, 2))) return ramp[0];
  return cand.find(c => c.def.id === 'PL!SP-bp1-005' && me.hand.length >= 3) || null;
}

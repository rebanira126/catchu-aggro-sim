// 虹ヶ咲（とユニット混成カード）のカード効果（カード番号で登録）
import { inGroup, isLive, isMember, discardWorst, recover, waitOpp, anyColorHeart, hasName, oppYetToPerform, cardWorth } from './lib.js';

const NIJI = '虹ヶ咲';

export default {
  // ---------------- ライブ ----------------
  // Love U my friends（3点）
  'PL!N-bp3-030': {
    note: 'ライブ成功時：エールにALLブレードを持つカードがあればスコア+1',
    liveSuccess({ me, live }) { if (me.cheer.some(c => c.def.bh && c.def.bh.c === 'all')) live.bonus += 1; },
  },
  // Daydream Mermaid（3点）
  'PL!N-bp4-030': {
    note: 'ライブ成功時：エネルギーを1枚ウェイトで置くか、控え室のメンバーを1枚手札に。成功ライブ置き場に虹ヶ咲があれば両方',
    liveSuccess({ g, me }) {
      const both = me.success.some(c => inGroup(c.def, NIJI));
      const energy = () => g.addEnergyByEffect(me, { label: 'Daydream Mermaid：' });
      const member = () => recover(g, me, isMember, 'Daydream Mermaid：');
      if (both) { energy(); member(); return; }
      // 片方だけ：手札のメンバーが少なければメンバー、そうでなければエネルギー
      if (me.energyDeck > 0 && me.hand.filter(isMember).length >= 2) energy(); else if (!member()) energy();
    },
  },
  // Burn!!（7点）
  'PL!N-bp7-029': {
    note: 'ライブ成功時：メンバー1人の下のエネルギーをすべてエネルギー置き場にウェイトで置いてよい。1枚以上置いてエネルギー10枚以上ならスコア+1',
    order: { liveSuccess: 7 },
    liveSuccess({ g, me, live }) {
      const slot = me.stage.filter(Boolean).sort((a, b) => b.under.filter(u => u.def.kind === 'E').length - a.under.filter(u => u.def.kind === 'E').length)[0];
      const es = slot ? slot.under.filter(u => u.def.kind === 'E') : [];
      if (!es.length) return;
      slot.under = slot.under.filter(u => u.def.kind !== 'E');
      // 下のエネルギーをエネルギー置き場へ（数の上では、いったんエネルギーデッキに戻してから置く）
      me.energyDeck += es.length;
      for (let k = 0; k < es.length; k++) g.addEnergyByEffect(me, { label: 'Burn!!：' });
      if (me.energy.n >= 10) { live.bonus += 1; g.log(me, 'eff', 'Burn!!：スコア+1'); }
    },
    preview({ me, live }) {
      const n = Math.max(0, ...me.stage.filter(Boolean).map(s => s.under.filter(u => u.def.kind === 'E').length));
      if (n && me.energy.n + n >= 10) live.bonus += 1;
    },
  },

  // ---------------- メンバー ----------------
  // 朝香果林（4）bp7-016：エネルギー1で好きな色のハート+1
  'PL!N-bp7-016': {
    note: 'ライブ開始時：エネルギー1を払ってよい→ライブ終了時まで好きな色のハート+1',
    order: { liveStart: 3 },
    liveStart({ g, me, slot }) { if (g.payEnergy(me, 1)) anyColorHeart(slot); },
  },
  // 優木せつ菜（4）sd2-019
  'PL!N-sd2-019': {
    note: '登場：ライブ終了時まで青ハート+1。ライブ開始時：相手のコスト2以下のメンバー1人をウェイト',
    onEnter({ slot }) { slot.mods.push({ hearts: { c: [0, 0, 0, 0, 1, 0] }, untilLiveEnd: true }); },
    liveStart({ g, me, opp }) { if (oppYetToPerform(g, me)) waitOpp(g, opp, s => s.card.def.cost <= 2, '優木せつ菜：'); },
  },
  // 優木せつ菜（11）bp7-007
  'PL!N-bp7-007': {
    note: '常時：下のエネルギー1枚につき赤+1、エネルギーが6枚より多い分だけ赤+1。ライブ成功時：エネルギーデッキからエネルギーを1枚この下に置く',
    hearts({ me, slot }) {
      const n = slot.under.filter(u => u.def.kind === 'E').length + Math.max(0, me.energy.n - 6);
      return n ? { c: [0, n, 0, 0, 0, 0] } : null;
    },
    order: { liveSuccess: 3 },
    liveSuccess({ g, me, slot }) {
      if (me.energyDeck <= 0) return;
      me.energyDeck--;
      slot.under.push(g.energyCard());
      g.log(me, 'eff', `優木せつ菜：エネルギーを下に置いた（${slot.under.filter(u => u.def.kind === 'E').length}枚）`);
    },
  },
  // 国木田花丸&優木せつ菜&嵐 千砂都（15）
  'LL-bp7-001': {
    note: '常時：手札の「国木田花丸」「優木せつ菜」「嵐 千砂都」を1枚ずつ控え室に置けばコスト10。登場：控え室のライブを1枚手札に。ライブ成功時：控え室のメンバーを1枚手札に',
    handCost({ me, card, base }) { return trio(me, card) ? 10 : base; },
    onPay({ g, me, card, cost }) {
      if (cost !== 10) return;
      const t = trio(me, card);
      if (!t) return;
      for (const c of t) { me.hand.splice(me.hand.indexOf(c), 1); me.waiting.push(c); }
      g.log(me, 'eff', `手札の${t.map(c => c.def.name).join('、')}を控え室に置いて、コスト10で登場`);
    },
    onEnter({ g, me }) { recover(g, me, isLive, '国木田花丸&優木せつ菜&嵐 千砂都：'); },
    liveSuccess({ g, me }) { recover(g, me, isMember, '国木田花丸&優木せつ菜&嵐 千砂都：'); },
  },
  // 朝香果林（15）bp4-004
  'PL!N-bp4-004': {
    note: 'ライブ開始時：1枚引き、相手のコスト9以下のメンバー1人までウェイト。さらに相手のウェイトのメンバーの数まで、控え室の虹ヶ咲メンバーをデッキの上に置く',
    liveStart({ g, me, opp }) {
      g.draw(me, 1);
      if (oppYetToPerform(g, me)) waitOpp(g, opp, s => s.card.def.cost <= 9, '朝香果林：');
      const n = opp.stage.filter(s => s && !s.active).length;
      const cand = me.waiting.filter(c => isMember(c) && inGroup(c.def, NIJI)).sort((a, b) => cardWorth(g, me, b) - cardWorth(g, me, a)).slice(0, n);
      for (const c of cand) { me.waiting.splice(me.waiting.indexOf(c), 1); me.deck.unshift(c); }
    },
  },
};

// 「国木田花丸」「優木せつ菜」「嵐 千砂都」を1枚ずつ（このカード以外の手札から）。そろわなければ null
function trio(me, card) {
  const out = [];
  for (const n of ['国木田花丸', '優木せつ菜', '嵐 千砂都']) {
    const c = me.hand.find(x => x !== card && isMember(x) && !out.includes(x) && x.def.names.length === 1 && hasName(x.def, n));
    if (!c) return null;
    out.push(c);
  }
  return out;
}

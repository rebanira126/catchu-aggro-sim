// 蓮ノ空のカード効果（カード番号で登録）
import { inGroup, inUnit, isLive, isMember, discardWorst, willDiscard, recover, waitOpp, waitOppN, searchBigOnEnter, scry, sacrificeSelf, cardWorth, oppYetToPerform } from './lib.js';
import { memberValue } from '../engine/ai.js';

const HASU = '蓮ノ空';
const EDEL = 'Edel Note';
const isEdel = def => inUnit(def, EDEL);
// メインフェイズに相手をウェイトにして効果があるのは、相手のアクティブフェイズがもう終わっている（自分が後攻の）とき
const oppActiveDone = (g, me) => g.order()[1] === me;

export default {
  // ---------------- ライブ ----------------
  // Retrofuture（4点）
  'PL!HS-bp5-022': {
    note: 'ライブ開始時：エネルギー2を払ってよい→コスト9以上のEdel Noteがいれば、控え室のコスト4以下のEdel Noteを空いているエリアに登場させるか、必要ハートの紫-1',
    order: { liveStart: 5 },
    liveStart({ g, me, live }) {
      if (!me.stage.some(s => s && s.card.def.cost >= 9 && isEdel(s.card.def))) return;
      if (!g.payEnergy(me, 2)) return;
      const empty = me.stage.findIndex(s => !s);
      const cand = me.waiting.filter(c => isMember(c) && c.def.cost <= 4 && isEdel(c.def)).sort((a, b) => memberValue(b.def) - memberValue(a.def))[0];
      if (empty >= 0 && cand) {
        me.waiting.splice(me.waiting.indexOf(cand), 1);
        g.putMember(me, cand, empty, { from: 'waiting' });
      } else live.need[6] = Math.max(0, live.need[6] - 1);
    },
    preview({ me, live }) {
      if (me.stage.some(s => s && s.card.def.cost >= 9 && isEdel(s.card.def)) && me.energy.active >= 2) live.need[6] = Math.max(0, live.need[6] - 1);
    },
  },
  // Edelied（7点）
  'PL!HS-pb1-030': {
    note: 'ライブ開始時：Edel Noteのメンバー1人にブレード+2、名前の異なるEdel Noteのメンバー1人に紫ハート+2',
    liveStart({ me }) {
      const es = me.stage.filter(s => s && isEdel(s.card.def));
      if (!es.length) return;
      const b = es.find(s => s.active) || es[0];
      b.mods.push({ blades: 2, untilLiveEnd: true });
      const h = es.find(s => s !== b && !s.card.def.names.some(n => b.card.def.names.includes(n)));
      if (h) h.mods.push({ hearts: { c: [0, 0, 0, 0, 0, 2] }, untilLiveEnd: true });
    },
    preview({ me, live }) {
      const es = me.stage.filter(s => s && isEdel(s.card.def));
      const names = new Set(); es.forEach(s => s.card.def.names.forEach(n => names.add(n)));
      if (names.size >= 2) live.need[6] = Math.max(0, live.need[6] - 2);
      if (es.length) live.cheer += 2;
    },
  },

  // ---------------- メンバー ----------------
  // 桂城 泉（2）pb1-016：紫を持つほかのメンバー1人に紫+1
  'PL!HS-pb1-016': {
    note: '登場：紫ハートを持つほかのメンバー1人は、ライブ終了時まで紫ハート+1',
    onEnter({ me, slot }) {
      const t = me.stage.find(s => s && s !== slot && s.card.def.hearts[5] > 0);
      if (t) t.mods.push({ hearts: { c: [0, 0, 0, 0, 0, 1] }, untilLiveEnd: true });
    },
  },
  // 桂城 泉（4）bp5-008
  'PL!HS-bp5-008': searchBigOnEnter(HASU, 9, '桂城 泉：'),
  // 桂城 泉（4）cl1-008：自分を控え室に置き、控え室の蓮ノ空のカードを1枚手札に
  'PL!HS-cl1-008': {
    note: '起動：自分を控え室に置く→控え室の蓮ノ空のカードを1枚手札に（手札にライブが無いときにライブを拾う）',
    activated: [{
      ai: ({ me }) => !me.hand.some(isLive) && me.waiting.some(c => isLive(c) && inGroup(c.def, HASU)),
      run({ g, me, slot, area }) { sacrificeSelf(g, me, slot, area); recover(g, me, c => inGroup(c.def, HASU), '桂城 泉：'); },
    }],
  },
  // 桂城 泉（4）pb1-024：デッキの上2枚を整える
  'PL!HS-pb1-024': {
    note: '登場：デッキの上2枚を見て、好きな枚数を好きな順番で上に戻し、残りを控え室に',
    onEnter({ g, me }) { scry(g, me, 2, '桂城 泉：'); },
  },
  // 桂城 泉（9）bp5-016
  'PL!HS-bp5-016': {
    note: '登場：手札1枚を捨ててよい→相手のコスト4以下のメンバーを2人までウェイト（相手のアクティブフェイズが済んでいるときだけ使う）。常時：相手のウェイトのメンバーが2人以上なら紫+1',
    onEnter({ g, me, opp }) {
      if (!oppActiveDone(g, me)) return;
      if (!opp.stage.some(s => s && s.active && s.card.def.cost <= 4) || !willDiscard(g, me)) return;
      discardWorst(g, me, 1);
      waitOppN(g, opp, 2, s => s.card.def.cost <= 4, '桂城 泉：');
    },
    hearts({ g, me }) { return g.opp(me).stage.filter(s => s && !s.active).length >= 2 ? { c: [0, 0, 0, 0, 0, 1] } : null; },
  },
  // 百生吟子（9）cl1-004
  'PL!HS-cl1-004': {
    note: '登場：デッキの上3枚を控え室に置くか、相手のコスト2以下のメンバー1人をウェイト',
    onEnter({ g, me, opp }) {
      if (oppActiveDone(g, me) && opp.stage.some(s => s && s.active && s.card.def.cost <= 2)) { waitOpp(g, opp, s => s.card.def.cost <= 2, '百生吟子：'); return; }
      for (let k = 0; k < 3; k++) { const c = g.topCard(me); if (c) me.waiting.push(c); }
      g.log(me, 'eff', '百生吟子：デッキの上3枚を控え室に置いた');
    },
  },
  // 日野下花帆（9）sd1-001
  'PL!HS-sd1-001': {
    note: '自動：コスト10以上の蓮ノ空メンバーとバトンタッチして控え室に置かれたとき、エネルギーを2枚アクティブ',
    onBatonOut({ g, me, newCard }) {
      if (newCard.def.cost >= 10 && inGroup(newCard.def, HASU)) { me.energy.active = Math.min(me.energy.n, me.energy.active + 2); g.log(me, 'eff', '日野下花帆：エネルギーを2枚アクティブにした'); }
    },
  },
  // 村野さやか（11）bp1-002
  'PL!HS-bp1-002': {
    note: '起動：エネルギー2と自分を控え室に置く→控え室のコスト15以下の蓮ノ空メンバーをこのエリアに登場',
    activated: [{
      can: ({ me }) => me.energy.active >= 2,
      ai: ({ me, slot }) => me.energy.active >= 2 && me.waiting.some(c => isMember(c) && c.def.cost <= 15 && inGroup(c.def, HASU) && memberValue(c.def) > memberValue(slot.card.def) + 2),
      run({ g, me, slot, area }) {
        const c = me.waiting.filter(x => isMember(x) && x.def.cost <= 15 && inGroup(x.def, HASU)).sort((a, b) => memberValue(b.def) - memberValue(a.def))[0];
        if (!c || !g.payEnergy(me, 2)) return false;
        sacrificeSelf(g, me, slot, area);
        me.waiting.splice(me.waiting.indexOf(c), 1);
        g.putMember(me, c, area, { from: 'waiting' });
      },
    }],
  },
  // 桂城 泉（13）sd1-008
  'PL!HS-sd1-008': {
    note: '登場：2枚引いて1枚捨てる。ライブ開始時：手札の蓮ノ空2枚を捨ててよい→ほかの蓮ノ空メンバー1人に、桃・緑・青・紫から選んだハート+2',
    onEnter({ g, me }) { g.draw(me, 2); discardWorst(g, me, 1); },
    order: { liveStart: 4 },
    liveStart({ g, me, slot }) {
      const t = me.stage.find(s => s && s !== slot && inGroup(s.card.def, HASU));
      if (!t || me.hand.filter(c => inGroup(c.def, HASU)).length < 2 || !willDiscard(g, me, 2)) return;
      const keep = new Set(me.hand.filter(c => !inGroup(c.def, HASU)).map(c => c.uid));
      discardWorst(g, me, 2, keep);
      // 桃=1 緑=4 青=5 紫=6 のうち、ライブの必要ハートが一番多い色
      const want = [1, 4, 5, 6].map(i => [i, me.lives.reduce((s, l) => s + (l.need[i] || 0), 0)]).sort((a, b) => b[1] - a[1])[0][0];
      const c = [0, 0, 0, 0, 0, 0]; c[want - 1] = 2;
      t.mods.push({ hearts: { c }, untilLiveEnd: true });
    },
  },
  // セラス 柳田 リリエンフェルト（15）bp6-007
  'PL!HS-bp6-007': {
    note: '自動（ターン1回）：自分のステージにEdel Noteが登場したとき、相手は自分のアクティブなメンバー1人をウェイトにする（相手がブレードの一番少ないメンバーを選ぶ）',
    onAnyEnter({ g, me, opp, slot, entered }) {
      if (!isEdel(entered.card.def) || !oppActiveDone(g, me)) return;
      if (!opp.stage.some(s => s && s.active) || !g.useOnce(slot, 'bp6-007')) return;
      let pick = null, pb = 99;
      opp.stage.forEach((s, a) => { if (s && s.active) { const b = g.bladesOf(opp, s, a); if (b < pb) { pb = b; pick = s; } } });
      pick.active = false;
      g.log(opp, 'eff', `セラス：${pick.card.def.name}がウェイトになった`);
    },
  },
  // セラス 柳田 リリエンフェルト（15）PR-032
  'PL!HS-PR-032': {
    note: '登場：控え室のスコア6以上のライブを1枚手札に',
    onEnter({ g, me }) { recover(g, me, c => isLive(c) && c.def.score >= 6, 'セラス：'); },
  },
};

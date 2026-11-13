// Liella! のカード効果（カード番号で登録）
import { inUnit, inGroup, isLive, isMember, distinctNames, activateEnergy, discardWorst, willDiscard, lookTake, recover } from './lib.js';

const catchuNames = (me, except) => distinctNames(me, d => inUnit(d, 'CatChu!'), except);
const needSum = need => need.reduce((a, b) => a + b, 0);

export default {
  // ---------------- ライブ ----------------
  // ディストーション（3点）
  'PL!SP-pb1-023': {
    note: 'ライブ開始時：名前の異なるCatChu!が2人以上ならエネルギーを6枚までアクティブ。全部アクティブならスコア+1',
    order: { liveStart: 6 },
    liveStart({ me, live }) {
      if (catchuNames(me) >= 2) activateEnergy(me, 6);
      if (me.energy.active === me.energy.n) live.bonus += 1;
    },
    preview({ me, live }) {
      if (catchuNames(me) >= 2 && me.energy.n <= me.energy.active + 6) live.bonus += 1;
    },
  },
  // ディストーション（6点）
  'PL!SP-pb2-048': {
    note: 'ライブ開始時：名前の異なるCatChu!1人につき必要ハートの無色を2減らし赤を1増やす。赤が9以上ならスコア+1',
    liveStart({ me, live }) { applyDistortion6(me, live); },
    preview({ me, live }) { applyDistortion6(me, live); },
  },
  // START!! True dreams
  'PL!SP-bp7-023': {
    note: 'ライブ成功時：エールで公開したLiella!のカードを1枚デッキの一番上に置いてよい',
    liveSuccess({ g, me }) {
      const next = me.energy.n + 1;
      const score = c => (isMember(c) ? (c.def.cost <= next ? c.def.cost : -1) : (me.hand.some(isLive) ? -1 : 0.5));
      const pick = me.cheer.filter(c => inGroup(c.def, 'Liella!')).sort((a, b) => score(b) - score(a))[0];
      if (pick && score(pick) >= 0) {
        me.cheer.splice(me.cheer.indexOf(pick), 1);
        me.deck.unshift(pick);
        g.log(me, 'eff', `START!! True dreams：${pick.def.name}をデッキの一番上に置いた`);
      }
    },
  },
  // Chance Day, Chance Way!（フォーメーションチェンジ。今の対応カードでは位置で変わる効果が登場時だけなので何もしない）
  'PL!SP-bp4-027': {
    note: 'ライブ成功時：フォーメーションチェンジしてよい（位置の影響が出ないため何もしない）',
    liveSuccess() {},
  },

  // ---------------- メンバー ----------------
  // 葉月 恋（2）：手札1枚を捨ててよい → 上5枚からLiella!を1枚
  'PL!SP-bp1-005': {
    note: '登場：手札1枚を捨ててよい→デッキの上5枚からLiella!のカードを1枚まで手札に',
    onEnter({ g, me }) { if (willDiscard(g, me)) { discardWorst(g, me, 1); lookTake(g, me, 5, c => inGroup(c.def, 'Liella!'), '葉月 恋：'); } },
  },
  // 澁谷かのん（2）：ライブ置き場に必要ハート合計8以上のLiella!ライブがあれば黄+1
  'PL!SP-bp5-012': {
    note: '常時：必要ハート合計8以上のLiella!のライブがライブ置き場にあれば黄ハート+1',
    hearts({ me }) {
      const has = me.lives.some(l => inGroup(l.card.def, 'Liella!') && needSum(l.need) >= 8);
      return has ? { c: [0, 0, 1, 0, 0, 0] } : null;
    },
  },
  // 平安名すみれ（2）：ライブ成功時、スコアが上がったライブかスコアアイコンのライブをエールで出していれば1枚引く
  'PL!SP-pb2-004': {
    note: 'ライブ成功時：スコアが元より高いライブか、スコアアイコンのライブがエールにあれば1枚引く',
    liveSuccess({ g, me }) {
      const up = me.lives.some(l => l.bonus > 0);
      const icon = me.cheer.some(c => isLive(c) && c.def.icon === 'score');
      if (up || icon) { g.draw(me, 1); g.log(me, 'eff', '平安名すみれ：1枚引いた'); }
    },
  },
  // 米女メイ（2）：ライブ開始時、名前の異なるほかのCatChu!1人につきエネルギー1枚アクティブ
  'PL!SP-pb2-018': {
    note: 'ライブ開始時：このメンバーと名前の異なるCatChu!1人につきエネルギーを1枚アクティブ',
    order: { liveStart: 4 },
    liveStart({ me, slot }) {
      const own = new Set(slot.card.def.names);
      const names = new Set();
      for (const s of me.stage) if (s && s !== slot && inUnit(s.card.def, 'CatChu!')) for (const n of s.card.def.names) if (!own.has(n)) names.add(n);
      activateEnergy(me, names.size);
    },
  },
  // 米女メイ（5）：手札1枚を捨ててよい → 上5枚からLiella!のメンバーを1枚
  'PL!SP-bp2-007': {
    note: '登場：手札1枚を捨ててよい→デッキの上5枚からLiella!のメンバーを1枚まで手札に',
    onEnter({ g, me }) { if (willDiscard(g, me)) { discardWorst(g, me, 1); lookTake(g, me, 5, c => isMember(c) && inGroup(c.def, 'Liella!'), '米女メイ：'); } },
  },
  // 平安名すみれ（5）：左サイドに登場したら2枚引いて2枚捨てる
  'PL!SP-pb2-037': {
    note: '登場（左サイド）：2枚引いて2枚捨てる',
    onEnter({ g, me, area }) { if (area === 0) { g.draw(me, 2); discardWorst(g, me, 2); } },
  },
  // 澁谷かのん（11）：ライブ開始時 エネルギー2を払わないなら手札2枚を捨てる／ライブ成功時 エネルギー6でスコア+1
  'PL!SP-pb1-001': {
    note: 'ライブ開始時：エネルギー2を払うか手札2枚を捨てる。ライブ成功時：エネルギー6を払ってよい→合計スコア+1',
    order: { liveStart: 1 },
    liveStart({ g, me }) { if (!g.payEnergy(me, 2)) discardWorst(g, me, Math.min(2, me.hand.length)); },
    liveSuccess({ g, me }) {
      if (me.perf && g.payEnergy(me, 6)) { me.perf.totalBonus += 1; g.log(me, 'eff', '澁谷かのん：エネルギー6でスコア+1'); }
    },
  },
  // 米女メイ（11）：ライブ成功時 エネルギー3を払ってよい → 控え室のLiella!のライブを1枚手札に
  'PL!SP-pb2-007': {
    note: 'ライブ成功時：エネルギー3を払ってよい→控え室のLiella!のライブを1枚手札に',
    order: { liveSuccess: 6 },
    liveSuccess({ g, me }) {
      if (me.hand.filter(isLive).length >= 2) return;
      if (!me.waiting.some(c => isLive(c) && inGroup(c.def, 'Liella!'))) return;
      if (g.payEnergy(me, 3)) recover(g, me, c => isLive(c) && inGroup(c.def, 'Liella!'), '米女メイ：');
    },
  },
  // 平安名すみれ（13）：手札1枚を捨ててよい → 控え室のCatChu!のカードを1枚手札に
  'PL!SP-pb2-015': {
    note: '登場：手札1枚を捨ててよい→控え室のCatChu!のカードを1枚手札に',
    onEnter({ g, me }) {
      if (!me.waiting.some(c => inUnit(c.def, 'CatChu!'))) return;
      if (willDiscard(g, me)) { discardWorst(g, me, 1); recover(g, me, c => inUnit(c.def, 'CatChu!'), '平安名すみれ：'); }
    },
  },
};

function applyDistortion6(me, live) {
  const k = catchuNames(me);
  live.need[0] = Math.max(0, live.need[0] - 2 * k);
  live.need[2] += k;
  if (live.need[2] >= 9) live.bonus += 1;
}

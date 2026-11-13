// Liella! のカード効果
import { inUnit, inGroup, distinctNames, activateEnergy } from './lib.js';

const catchuNames = me => distinctNames(me, d => inUnit(d, 'CatChu!'));

export default {
  // ディストーション（3点）
  'PL!SP-pb1-023': {
    note: 'ライブ開始時：名前の異なるCatChu!が2人以上ならエネルギーを6枚までアクティブ。全部アクティブならスコア+1',
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
      const pick = me.cheer
        .filter(c => inGroup(c.def, 'Liella!'))
        .sort((a, b) => score(b) - score(a))[0];
      function score(c) {
        if (c.def.kind === 'M') return c.def.cost <= next ? c.def.cost : -1;
        return 0.5;
      }
      if (pick && score(pick) >= 0) {
        me.cheer.splice(me.cheer.indexOf(pick), 1);
        me.deck.unshift(pick);
        g.log(me, 'eff', `START!! True dreams：${pick.def.name}をデッキの一番上に置いた`);
      }
    },
  },
};

function applyDistortion6(me, live) {
  const k = catchuNames(me);
  live.need[0] = Math.max(0, live.need[0] - 2 * k);
  live.need[2] += k;
  if (live.need[2] >= 9) live.bonus += 1;
}

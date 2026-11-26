// 人魚Burn!!（明星さんの13せつ菜型）で使うカードの効果（カード番号で登録）
import { cardLabel } from '../engine/game.js';
import { isLive, isMember, recover, sacrificeSelf, hasName } from './lib.js';

// エネルギー置き場のエネルギーを1枚メンバーの下に置く（ウェイト状態のものから）。置けたら true
export function energyUnder(g, me, slot, label = '') {
  if (me.energy.n <= 0) return false;
  const waited = me.energy.n - me.energy.active;
  me.energy.n--;
  if (waited <= 0) me.energy.active--;
  slot.under.push(g.energyCard());
  g.log(me, 'eff', `${label}エネルギーを1枚${cardLabel(slot.card)}の下に置いた（エネルギー${me.energy.n}枚・下${slot.under.filter(u => u.def.kind === 'E').length}枚）`);
  return true;
}

const SETSUNA = '優木せつ菜';
const SETSUNA13 = 'PL!N-bp4-007';
// 9せつ菜の起動で出すせつ菜：13せつ菜を先に（3Tの 9→13、5Tの 13-13-11）。次に11せつ菜
const setsunaPick = me => me.hand.filter(c => isMember(c) && hasName(c.def, SETSUNA) && c.def.cost <= 13 && c.def.cost >= 11)
  .sort((a, b) => (b.def.id === SETSUNA13) - (a.def.id === SETSUNA13) || b.def.cost - a.def.cost)[0];

// ステージに赤ハートを4つ以上持つメンバーがいるか（CHASE!）
const red4 = (g, me) => me.stage.some((s, area) => s && g.heartsOf(me, s, area).h[1] >= 4);

export default {
  // ---------------- ライブ ----------------
  // CHASE!（1点）
  'PL!N-bp5-028': {
    note: 'ライブ開始時：赤ハートを4つ以上持つメンバーがいればスコア+2、必要ハートが赤5になる',
    order: { liveStart: 6 },
    liveStart({ g, me, live }) {
      if (!red4(g, me)) return;
      live.bonus += 2;
      live.need = [0, 0, 5, 0, 0, 0, 0];
      g.log(me, 'eff', 'CHASE!：スコア+2、必要ハートが赤5になった');
    },
    preview({ g, me, live }) { if (red4(g, me)) { live.bonus += 2; live.need = [0, 0, 5, 0, 0, 0, 0]; } },
  },

  // ---------------- メンバー ----------------
  // 優木せつ菜（9）bp3-007
  'PL!N-bp3-007': {
    note: '起動[E][E]：自分を控え室に置き、手札のコスト13以下の「優木せつ菜」をこのエリアに登場させる。その後エネルギー置き場のエネルギー1枚をその下に置く',
    activated: [{
      // 13せつ菜（か11せつ菜）が手札にあり、エネルギーが2枚あれば使う。3Tは13せつ菜のときだけ（11せつ菜は4コストの上に出す）
      ai: ({ g, me }) => {
        if (me.energy.active < 2) return false;
        const c = setsunaPick(me);
        return !!c && (c.def.id === SETSUNA13 || g.turn >= 4);
      },
      run: ({ g, me, slot, area }) => {
        const c = setsunaPick(me);
        if (!c || !g.payEnergy(me, 2)) return false;
        sacrificeSelf(g, me, slot, area);
        me.hand.splice(me.hand.indexOf(c), 1);
        g.log(me, 'eff', `優木せつ菜（9）：手札の${cardLabel(c)}を登場させる`);
        g.putMember(me, c, area, { from: 'effect' });
        energyUnder(g, me, me.stage[area], '優木せつ菜（9）：');
      },
    }],
    // 起動のあとエネルギーが2枚減る代わりに、出るせつ菜のコストは払わない
    energyPotential: () => 0,
  },
  // 優木せつ菜（13）bp4-007
  'PL!N-bp4-007': {
    note: '登場：自分と相手は控え室のライブを1枚ずつ手札に。常時：自分と相手のエネルギーの合計が15枚以上なら赤+2。ライブ成功時：自分と相手はエネルギーを1枚ウェイトで置く',
    onEnter({ g, me, opp }) {
      const wl = me.prefer && me.prefer.wantLives;
      (wl && recover(g, me, c => isLive(c) && wl.includes(c.def.id), '優木せつ菜（13）：')) || recover(g, me, isLive, '優木せつ菜（13）：');
      if (opp) recover(g, opp, isLive, '優木せつ菜（13）（相手）：');
    },
    hearts({ g, me }) {
      const opp = g.opp(me);
      return me.energy.n + (opp ? opp.energy.n : 0) >= 15 ? { c: [0, 2, 0, 0, 0, 0] } : null;
    },
    liveSuccess({ g, me, opp }) {
      g.addEnergyByEffect(me, { label: '優木せつ菜（13）：' });
      if (opp) g.addEnergyByEffect(opp, { label: '優木せつ菜（13）（相手）：' });
    },
  },
  // 上原歩夢（15）bp3-001
  'PL!N-bp3-001': {
    note: 'ライブ開始時：エネルギー置き場のエネルギー1枚をこの下に置いてよい→1枚引き、ステージのメンバー全員ブレード+2',
    order: { liveStart: 2 },
    liveStart({ g, me, slot }) {
      if (!energyUnder(g, me, slot, '上原歩夢：')) return;
      g.draw(me, 1);
      for (const s of me.stage) if (s) s.mods.push({ blades: 2, untilLiveEnd: true });
      g.log(me, 'eff', '上原歩夢：1枚引き、メンバー全員ブレード+2');
    },
  },
};

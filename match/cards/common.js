// 文章で登録する効果。同じ文章のカードは全部これで動く（再録・同じ効果の新カードも自動で対応）
import { memberValue } from '../engine/ai.js';
import { isLive, isMember, recover, sacrificeSelf, discardWorst, willDiscard, lookTake } from './lib.js';

export const T = {
  recoverLive: '【起動】このメンバーをステージから控え室に置く：自分の控え室からライブカードを1枚手札に加える。',
  recoverMember: '【起動】このメンバーをステージから控え室に置く：自分の控え室からメンバーカードを1枚手札に加える。',
  bladePlus2: '【ライブ開始時】[E]支払ってもよい：ライブ終了時まで、[ブレード][ブレード]を得る。',
  look3: '【登場】手札を1枚控え室に置いてもよい：自分のデッキの上からカードを3枚見る。その中から1枚を手札に加え、残りを控え室に置く。',
  draw1discard1: '【登場】カードを1枚引き、手札を1枚控え室に置く。',
  draw2discard2: '【登場】カードを2枚引き、手札を2枚控え室に置く。',
  successLoot: '【ライブ成功時】カードを1枚引き、手札を1枚控え室に置く。',
};

export default {
  [T.recoverLive]: {
    note: '起動：自分を控え室に置き、控え室のライブを1枚手札に',
    activated: [{
      ai: ({ me }) => me.hand.filter(isLive).length === 0 && me.waiting.some(isLive),
      run: ({ g, me, slot, area }) => { sacrificeSelf(g, me, slot, area); recover(g, me, isLive); },
    }],
  },
  [T.recoverMember]: {
    note: '起動：自分を控え室に置き、控え室のメンバーを1枚手札に',
    activated: [{
      ai: ({ me, slot }) => {
        const e = me.energy.active;
        if (me.hand.some(c => isMember(c) && c.def.cost <= e)) return false;
        return me.waiting.some(c => isMember(c) && c.def.cost <= e && memberValue(c.def) > memberValue(slot.card.def) + 1);
      },
      run: ({ g, me, slot, area }) => { sacrificeSelf(g, me, slot, area); recover(g, me, isMember); },
    }],
  },
  [T.bladePlus2]: {
    note: 'ライブ開始時：エネルギー1枚でブレード+2',
    order: { liveStart: 3 },
    liveStart: ({ g, me, slot }) => {
      if (slot && slot.active && g.payEnergy(me, 1)) slot.mods.push({ blades: 2, untilLiveEnd: true });
    },
  },
  [T.look3]: {
    note: '登場：手札1枚を捨ててよい→デッキの上3枚から1枚手札に',
    onEnter: ({ g, me }) => { if (willDiscard(g, me)) { discardWorst(g, me, 1); lookTake(g, me, 3, () => true); } },
  },
  [T.draw1discard1]: {
    note: '登場：1枚引いて1枚捨てる',
    onEnter: ({ g, me }) => { g.draw(me, 1); discardWorst(g, me, 1); },
  },
  [T.draw2discard2]: {
    note: '登場：2枚引いて2枚捨てる',
    onEnter: ({ g, me }) => { g.draw(me, 2); discardWorst(g, me, 2); },
  },
  [T.successLoot]: {
    note: 'ライブ成功時：1枚引いて1枚捨てる',
    liveSuccess: ({ g, me }) => { g.draw(me, 1); discardWorst(g, me, 1); },
  },
};

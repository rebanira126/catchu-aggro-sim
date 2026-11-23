// Liella!（金太郎飴・デッキコード SJBQ8）で使うカードの効果（カード番号で登録）
import { cardLabel } from '../engine/game.js';
import { discardWorst, willDiscard } from './lib.js';

export default {
  // 嵐 千砂都（5）pb2-036：5平安名すみれ（pb2-037）の右サイド版
  'PL!SP-pb2-036': {
    note: '登場（右サイド）：2枚引いて2枚捨てる',
    onEnter({ g, me, area }) { if (area === 2) { g.draw(me, 2); discardWorst(g, me, 2); } },
  },
  // ウィーン・マルガレーテ（11）pb2-010
  'PL!SP-pb2-010': {
    note: 'ライブ開始時：手札を1枚捨てないならエネルギー1枚をエネルギーデッキに戻す。ライブ成功時：2枚引くか、エネルギー1枚をウェイトで置く',
    order: { liveStart: 3 },
    liveStart({ g, me }) {
      // 要らない手札があれば捨てる。無ければエネルギーを戻す（手札が無いときも）
      if (me.hand.length && (willDiscard(g, me) || me.energy.n === 0)) { discardWorst(g, me, 1); return; }
      if (me.energy.n > 0) {
        if (me.energy.active >= me.energy.n) me.energy.active--;
        me.energy.n--; me.energyDeck++;
        g.log(me, 'eff', 'ウィーン・マルガレーテ：エネルギー1枚をエネルギーデッキに置いた');
      } else if (me.hand.length) discardWorst(g, me, 1);
    },
    liveSuccess({ g, me }) {
      // 早く決着をつけるデッキなので、ふつうは2枚引く。手札が多いときはエネルギー
      if (me.hand.length >= 6 && me.energyDeck > 0) {
        me.energy.n++; me.energyDeck--;
        g.log(me, 'eff', 'ウィーン・マルガレーテ：エネルギー1枚をウェイトで置いた');
      } else { g.draw(me, 2); g.log(me, 'eff', 'ウィーン・マルガレーテ：2枚引いた'); }
    },
  },
};

// 僕光μ's（noteのレシピ）で使うカードの効果（カード番号で登録）
import { inGroup, isLive, recover } from './lib.js';

const isMuse = c => inGroup(c.def, "μ's");

export default {
  // 園田海未（9）bp6-013
  'PL!-bp6-013': {
    note: '登場：成功ライブ置き場のスコアの合計が6以上なら、控え室のμ\'sのライブを1枚手札に',
    onEnter({ g, me }) {
      const sum = me.success.reduce((a, c) => a + (c.def.score || 0), 0);
      if (sum >= 6) recover(g, me, c => isLive(c) && isMuse(c), '園田海未：');
    },
  },
  // 南 ことり（2）bp3-012
  'PL!-bp3-012': {
    note: 'ライブ開始時：桃・黄・紫から1色を選び、成功ライブ置き場のカード1枚につきそのハート+1（ライブ中のカードの必要ハートで一番多い色を選ぶ）',
    liveStart({ me, slot }) {
      const n = me.success.length;
      if (!n) return;
      // 必要ハートの並びは [無色, 桃, 赤, 黄, 緑, 青, 紫]、ハートの並びは [桃, 赤, 黄, 緑, 青, 紫]
      const need = [0, 0, 0, 0, 0, 0];
      for (const l of me.lives || []) (l.card.def.need || []).slice(1).forEach((x, i) => { need[i] += x; });
      const col = [0, 2, 5].sort((a, b) => need[b] - need[a])[0];
      const c = [0, 0, 0, 0, 0, 0];
      c[col] = n;
      slot.mods.push({ hearts: { c }, untilLiveEnd: true });
    },
  },
  // 矢澤 にこ（15）sd1-009
  'PL!-sd1-009': {
    note: 'ライブ開始時：控え室のμ\'sのカードが25枚以上なら、ライブの合計スコア+1',
    liveStart({ g, me, slot }) {
      if (me.waiting.filter(isMuse).length >= 25) { slot.mods.push({ score: 1, untilLiveEnd: true }); g.log(me, 'eff', '矢澤 にこ：ライブの合計スコア+1'); }
    },
  },
  // sweet&sweet holiday（4点）bp6-023
  'PL!-bp6-023': {
    note: 'ライブ成功時：1枚引く。成功ライブ置き場にμ\'sのカードがあれば、さらに1枚引く',
    liveSuccess({ g, me }) {
      const n = me.success.some(isMuse) ? 2 : 1;
      g.draw(me, n);
      g.log(me, 'eff', `sweet&sweet holiday：${n}枚引いた`);
    },
  },
};

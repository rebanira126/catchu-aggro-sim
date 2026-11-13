// Aqours（と恋アクで使うほかのグループのカード）のカード効果（カード番号で登録）
import { inGroup, isLive, isMember, discardWorst, willDiscard, recover, waitOpp, waitOppN, searchBigOnEnter, scry, hasBladeHeart, hasName, lookTake, takeTop, cardWorth, oppYetToPerform } from './lib.js';
import { memberValue } from '../engine/ai.js';

const AQ = 'Aqours';
const isAq = c => inGroup(c.def, AQ);
const heartSum = def => def.hearts.reduce((a, b) => a + b, 0);

export default {
  // ---------------- ライブ ----------------
  // Landing action Yeah!!（1点）
  'PL!S-bp5-020': {
    note: 'ライブ成功時：余剰ハートが3つ以上なら、それをすべて失ってスコア+1',
    order: { liveSuccess: 4 },
    liveSuccess({ me, live }) { if (me.perf && me.perf.excess >= 3) { me.perf.excess = 0; live.bonus += 1; } },
  },
  // MIRACLE WAVE
  'PL!S-bp3-019': {
    note: 'ライブ成功時：エールにブレードハートを持たないカードが0枚か、余剰ハートが2つ以上なら、このカードのスコアは4になる（カードデータのスコアは7）',
    order: { liveSuccess: 4 },
    liveSuccess({ me, live }) {
      if ((me.perf && me.perf.excess >= 2) || me.cheer.every(c => hasBladeHeart(c.def))) live.bonus = 4 - live.card.def.score;
    },
  },
  // コワレヤスキ（5点）
  'PL!S-bp6-024': {
    note: 'ライブ成功時：相手は余剰ハートをすべて失う。2つ以上失わせたらスコア+1',
    order: { liveSuccess: 1 },
    liveSuccess({ opp, live }) {
      const lost = opp.perf ? opp.perf.excess || 0 : 0;
      if (opp.perf) opp.perf.excess = 0;
      if (lost >= 2) live.bonus += 1;
    },
  },
  // HAPPY PARTY TRAIN（3点）
  'PL!S-bp7-020': {
    note: 'ライブ開始時：ステージのメンバーが全員アクティブなら必要ハートの無色-1。デッキの一番下を控え室に置き、それがAqoursのメンバーなら無色-1',
    liveStart({ g, me, live }) {
      if (me.stage.filter(Boolean).every(s => s.active)) live.need[0] = Math.max(0, live.need[0] - 1);
      const c = g.bottomCard(me);
      if (!c) return;
      me.waiting.push(c);
      if (isMember(c) && isAq(c)) live.need[0] = Math.max(0, live.need[0] - 1);
    },
    preview({ me, live }) { if (me.stage.filter(Boolean).every(s => s.active)) live.need[0] = Math.max(0, live.need[0] - 1); },
  },
  // 恋になりたいAQUARIUM（8点）
  'PL!S-bp7-022': {
    note: '常時：エールをデッキの下から行う。ライブ成功時：エールに赤・緑・青を持つAqoursのメンバーがそれぞれあればスコア+1',
    cheerFromBottom: true,
    liveSuccess({ me, live }) {
      const ms = me.cheer.filter(c => isMember(c) && isAq(c));
      if ([1, 3, 4].every(i => ms.some(c => c.def.hearts[i] > 0))) live.bonus += 1;
    },
  },
  // Guilty Night, Guilty Kiss!（3点）
  'PL!S-bp7-025': {
    note: 'ライブ成功時：相手のコスト4以下のメンバーを2人までウェイトにして次のアクティブフェイズでアクティブにしないか、1枚引く',
    liveSuccess({ g, me, opp }) {
      const n = opp.stage.filter(s => s && s.card.def.cost <= 4).length;
      if (n >= 2) waitOppN(g, opp, 2, s => s.card.def.cost <= 4, 'Guilty Night, Guilty Kiss!：', true);
      else g.draw(me, 1);
    },
  },

  // ---------------- メンバー ----------------
  // 優木あんじゅ（4）bp5-222
  'PL!-bp5-222': {
    note: '登場：自分をウェイトにし手札1枚を捨ててよい→デッキの上3枚から1枚手札に（手札にライブが無いときに使う）',
    onEnter({ g, me, slot }) {
      if (me.hand.some(isLive) || !willDiscard(g, me)) return;
      slot.active = false;
      discardWorst(g, me, 1);
      lookTake(g, me, 3, () => true, '優木あんじゅ：');
    },
  },
  // 津島善子（4）bp5-006
  'PL!S-bp5-006': searchBigOnEnter(AQ, 9, '津島善子：'),
  // 国木田花丸（4）bp6-016：控え室から登場したらデッキの上3枚から1枚
  'PL!S-bp6-016': {
    note: '登場：控え室から登場した場合、デッキの上3枚から1枚手札に、残りを控え室に',
    onEnter({ g, me, from }) { if (from === 'waiting') lookTake(g, me, 3, () => true, '国木田花丸：'); },
  },
  // 小原鞠莉（4）cl1-008：ブレードを失う手札交換なので、AIは使わない
  'PL!S-cl1-008': {
    note: '起動（ターン1回）：自分をウェイトにし手札1枚を捨てる→1枚引く（ブレードを失うのでAIは使わない）',
    activated: [{
      once: 1,
      can: ({ slot, me }) => slot.active && me.hand.length >= 1,
      run({ g, me, slot }) { slot.active = false; discardWorst(g, me, 1); g.draw(me, 1); },
    }],
  },
  // 徒町小鈴（9）HS-pb1-013
  'PL!HS-pb1-013': {
    note: 'ライブ開始時：デッキの上2枚を整える。ライブ成功時：ステージにこのメンバーよりコストが高いメンバーがいれば1枚引く',
    liveStart({ g, me }) { scry(g, me, 2, '徒町小鈴：'); },
    liveSuccess({ g, me, slot }) { if (me.stage.some(s => s && s.card.def.cost > slot.card.def.cost)) g.draw(me, 1); },
  },
  // 高海千歌（9）bp7-001
  'PL!S-bp7-001': {
    note: '登場：手札1枚を捨ててよい→控え室のコスト10以上のメンバーを1枚手札に。「桜内梨子」か「渡辺 曜」ならブレード+2',
    onEnter({ g, me, slot }) {
      if (!me.waiting.some(c => isMember(c) && c.def.cost >= 10) || !willDiscard(g, me)) return;
      discardWorst(g, me, 1);
      const c = recover(g, me, x => isMember(x) && x.def.cost >= 10, '高海千歌：');
      if (c && (hasName(c.def, '桜内梨子') || hasName(c.def, '渡辺 曜'))) slot.mods.push({ blades: 2, untilLiveEnd: true });
    },
  },
  // 国木田花丸（11）bp7-007
  'PL!S-bp7-007': {
    note: '登場：控え室のコスト2以下のメンバーを1枚手札に。「津島善子」か「黒澤ルビィ」なら空いているエリアに登場させてよい。ライブ開始時：控え室のAqoursメンバーを3枚までデッキの下に置き、1枚につきブレード+1',
    onEnter({ g, me }) {
      const c = recover(g, me, x => isMember(x) && x.def.cost <= 2, '国木田花丸：');
      const empty = me.stage.findIndex(s => !s);
      if (c && empty >= 0 && (hasName(c.def, '津島善子') || hasName(c.def, '黒澤ルビィ'))) {
        me.hand.splice(me.hand.indexOf(c), 1);
        g.putMember(me, c, empty, { from: 'hand-effect' });
      }
    },
    order: { liveStart: 6 },
    liveStart({ g, me, slot }) {
      const cs = me.waiting.filter(c => isMember(c) && isAq(c)).sort((a, b) => cardWorth(g, me, a) - cardWorth(g, me, b)).slice(0, 3);
      for (const c of cs) { me.waiting.splice(me.waiting.indexOf(c), 1); me.deck.push(c); }
      if (cs.length) slot.mods.push({ blades: cs.length, untilLiveEnd: true });
    },
  },
  // 渡辺 曜（13）bp2-005
  'PL!S-bp2-005': {
    note: '登場：手札1枚を捨ててよい→デッキの上7枚から赤・緑・青のどれかを持つメンバーを3枚まで手札に',
    onEnter({ g, me }) {
      if (!willDiscard(g, me)) return;
      discardWorst(g, me, 1);
      const top = takeTop(g, me, 7);
      const ok = c => isMember(c) && [1, 3, 4].some(i => c.def.hearts[i] > 0);
      const picks = top.filter(ok).sort((a, b) => cardWorth(g, me, b) - cardWorth(g, me, a)).slice(0, 3);
      for (const c of picks) top.splice(top.indexOf(c), 1);
      me.hand.push(...picks);
      me.waiting.push(...top);
      g.log(me, 'eff', `渡辺 曜：デッキの上7枚から${picks.length}枚を手札に加えた`);
    },
  },
  // 津島善子（13）bp3-006
  'PL!S-bp3-006': {
    note: '起動（センター・ターン1回）：自分をウェイトにし手札1枚を捨てる→ほかのAqoursメンバー1人を控え室に置き、控え室のコストが2高いAqoursメンバーをそのエリアに登場',
    activated: [{
      once: 1,
      can: ({ area, slot, me }) => area === 1 && slot.active && me.hand.length >= 1,
      ai: ({ g, me, area, slot }) => area === 1 && slot.active && !!swapTarget(g, me, slot) && willDiscard(g, me),
      run({ g, me, slot }) {
        const t = swapTarget(g, me, slot);
        if (!t) return false;
        slot.active = false;
        discardWorst(g, me, 1);
        const { area: a, up } = t;
        me.waiting.push(me.stage[a].card);
        for (const u of me.stage[a].under) { if (u.def.kind === 'E') me.energyDeck++; else me.waiting.push(u); }
        me.stage[a] = null;
        me.waiting.splice(me.waiting.indexOf(up), 1);
        g.putMember(me, up, a, { from: 'waiting' });
      },
    }],
  },
  // 松浦果南（13）bp5-003
  'PL!S-bp5-003': {
    note: '登場：手札のブレードハートを持たないメンバーを2枚まで捨ててよい→同じ枚数の控え室のAqoursライブを手札に',
    onEnter({ g, me }) {
      if (me.hand.filter(isLive).length >= 2) return;
      const lives = me.waiting.filter(c => isLive(c) && isAq(c)).length;
      const cand = me.hand.filter(c => isMember(c) && !hasBladeHeart(c.def) && cardWorth(g, me, c) <= 5).sort((a, b) => cardWorth(g, me, a) - cardWorth(g, me, b));
      const n = Math.min(2, lives, cand.length);
      for (const c of cand.slice(0, n)) { me.hand.splice(me.hand.indexOf(c), 1); me.waiting.push(c); }
      for (let k = 0; k < n; k++) recover(g, me, c => isLive(c) && isAq(c), '松浦果南：');
    },
  },
  // 渡辺 曜（15）bp7-005
  'PL!S-bp7-005': {
    note: '登場：控え室のメンバー1枚をステージのメンバー1人の下に置く。常時：下にメンバーがいるAqoursメンバーはブレード+1（センターの起動能力はAIは使わない）',
    onEnter({ g, me, slot }) {
      const c = me.waiting.filter(isMember).sort((a, b) => cardWorth(g, me, a) - cardWorth(g, me, b))[0];
      if (!c) return;
      // 下にメンバーがいないAqoursメンバーを優先（ブレード+1が増える）
      const t = me.stage.find(s => s && isAq(s.card) && !s.under.some(isMember)) || slot;
      me.waiting.splice(me.waiting.indexOf(c), 1);
      t.under.push(c);
      g.log(me, 'eff', `渡辺 曜：${c.def.name}を${t.card.def.name}の下に置いた`);
    },
    bladeAura({ slot }) { return isAq(slot.card) && slot.under.some(isMember) ? 1 : 0; },
  },
  // 黒澤ダイヤ（15）cl1-004
  'PL!S-cl1-004': {
    note: '自動（センター・ターン1回）：エールにライブが2枚以上あるとき、相手の元々のハートが4つ以下のメンバー1人をウェイト',
    cheer({ g, me, opp, slot, area }) {
      if (area !== 1 || me.cheer.filter(isLive).length < 2 || !oppYetToPerform(g, me)) return;
      if (g.useOnce(slot, 'cl1-004')) waitOpp(g, opp, s => heartSum(s.card.def) <= 4, '黒澤ダイヤ：');
    },
  },
};

// 善子13の入れ替え先：ほかのAqoursメンバーXと、控え室のコストX+2のAqoursメンバーで、強くなるもの
function swapTarget(g, me, self) {
  let best = null;
  me.stage.forEach((s, a) => {
    if (!s || s === self || !isAq(s.card)) return;
    const up = me.waiting.filter(c => isMember(c) && isAq(c) && c.def.cost === s.card.def.cost + 2).sort((x, y) => memberValue(y.def) - memberValue(x.def))[0];
    if (up && memberValue(up.def) > memberValue(s.card.def) + 1 && (!best || memberValue(up.def) > memberValue(best.up.def))) best = { area: a, up };
  });
  return best;
}

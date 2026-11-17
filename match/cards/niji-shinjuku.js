// 虹ヶ咲のカード効果（カード番号で登録）その2
// 「虹信宿5t目」（ファンミ第三幕 Day1 Aブロック Top4・1KF21S）で使うカードのうち、まだ動いていなかったもの
import { cardLabel } from '../engine/game.js';
import { inGroup, isLive, isMember, discardWorst, willDiscard, recover, waitOpp, comboMissing, allInGroup } from './lib.js';
import nijiHibure, { nijiActivate } from './niji-hibure.js';

const NIJI = '虹ヶ咲';
const isNiji = c => inGroup(c.def, NIJI);
const nijiLive = c => isLive(c) && isNiji(c);

// 余剰ハートの赤の数：無色の要求は、赤以外の余ったハートから先に払ったとして数える
function redExcess(me) {
  const perf = me.perf;
  if (!perf || !perf.pool || !perf.ok) return 0;
  const need = [0, 0, 0, 0, 0, 0, 0];
  for (const l of me.lives || []) l.need.forEach((x, i) => { need[i] += x; });
  const pool = perf.pool;
  const R = Math.max(0, (pool.c[2] || 0) - need[2]);
  let colorNeed = 0; for (let i = 1; i <= 6; i++) colorNeed += need[i];
  const total = pool.c.reduce((a, b) => a + b, 0) + (pool.all || 0) + (pool.gen || 0);
  const other = Math.max(0, total - colorNeed - R);
  return Math.max(0, R - Math.max(0, need[0] - other));
}

// オードリー：一番ブレードの多い自分の『虹ヶ咲』のメンバーが、両方のステージのほかの全員より多いか
function audreyOk(g, me) {
  const opp = g.opp(me);
  const all = [];
  me.stage.forEach((s, a) => { if (s) all.push({ s, b: g.bladesOf(me, s, a), mine: true }); });
  opp.stage.forEach((s, a) => { if (s) all.push({ s, b: g.bladesOf(opp, s, a), mine: false }); });
  const top = all.filter(x => x.mine && isNiji(x.s.card)).sort((x, y) => y.b - x.b)[0];
  if (!top) return false;
  return all.every(x => x === top || x.b < top.b);
}

// エールで公開されたカードのブレードハートの色（桃・赤・黄・緑・青・紫）の種類の数（ALLは数えない）
function cheerColors(cheer) {
  const set = new Set();
  for (const c of cheer) if (c.def.bh && typeof c.def.bh.c === 'number') set.add(c.def.bh.c);
  return set.size;
}

// 控え室から拾いたい『虹ヶ咲』のライブ：目標の組み合わせに足りないもの → 主力のライブ → どれでも
function recoverNijiLive(g, me, label) {
  const miss = comboMissing(g, me, { upTo: 2 });
  const wl = me.prefer && me.prefer.wantLives;
  return (miss.size && recover(g, me, c => nijiLive(c) && miss.has(c.def.id), label))
    || (wl && recover(g, me, c => nijiLive(c) && wl.includes(c.def.id), label))
    || recover(g, me, nijiLive, label);
}
const wantNijiLive = (g, me, max) => {
  if (!me.waiting.some(nijiLive)) return false;
  const miss = comboMissing(g, me, { upTo: 2 });
  if (miss.size && me.waiting.some(c => nijiLive(c) && miss.has(c.def.id))) return true;
  return me.hand.filter(isLive).length < max;
};

export default {
  // ---------------- ライブ ----------------
  // Eutopia（5点）
  'PL!N-bp1-029': {
    note: 'ライブ開始時：ライブ中のカードが3枚以上ならスコア+2',
    liveStart({ g, me, live }) { if (me.liveZone.length >= 3) { live.bonus += 2; g.log(me, 'eff', 'Eutopia：スコア+2'); } },
  },
  // Colorful Dreams! Colorful Smiles!（1点）
  'PL!N-bp7-025': {
    note: 'ライブ開始時：虹ヶ咲のメンバー1人にブレード+1。ライブ成功時：エールのカードに色のハートが3種類以上でスコア+1',
    order: { liveStart: 5 },
    liveStart({ g, me }) {
      let best = null, ba = -1;
      me.stage.forEach((s, a) => { if (s && s.active && isNiji(s.card)) { const b = g.bladesOf(me, s, a); if (b > ba) { ba = b; best = s; } } });
      if (best) { best.mods.push({ blades: 1, untilLiveEnd: true }); g.log(me, 'eff', `Colorful Dreams! Colorful Smiles!：${cardLabel(best.card)}がブレード+1`); }
    },
    liveSuccess({ g, me, live }) { if (cheerColors(me.cheer) >= 3) { live.bonus += 1; g.log(me, 'eff', 'Colorful Dreams! Colorful Smiles!：スコア+1'); } },
    successAdjust({ cheer }) { return cheerColors(cheer) >= 3 ? 1 : 0; },
    preview({ g, me, live }) { if (me.stage.some(s => s && s.active && isNiji(s.card))) live.cheer = (live.cheer || 0) + 1; },
  },
  // オードリー（2点）
  'PL!N-bp7-027': {
    note: 'ライブ成功時：自分の虹ヶ咲メンバー1人が、両方のステージのほかの全員より多くのブレードを持てばスコア+1',
    liveSuccess({ g, me, live }) { if (audreyOk(g, me)) { live.bonus += 1; g.log(me, 'eff', 'オードリー：スコア+1'); } },
    preview({ g, me, live }) { if (audreyOk(g, me)) live.bonus += 1; },
  },
  // 僕らの旅は終わらない（Aqours・ライブ）
  'PL!S-bp7-021': {
    note: 'ライブ開始時：メンバーが3人以上なら、デッキの下5枚を控え室へ。メンバーが3枚以上なら1枚引き、5枚ともメンバーならスコア+1',
    order: { liveStart: 7 },
    liveStart({ g, me, live }) {
      if (me.stage.filter(Boolean).length < 3) return;
      const n = Math.min(5, me.deck.length);
      const put = me.deck.splice(me.deck.length - n, n);
      me.waiting.push(...put);
      const m = put.filter(isMember).length;
      g.listLog(me, 'eff', put, t => `僕らの旅は終わらない：デッキの下から${t}を控え室に置いた`);
      if (m >= 3) g.draw(me, 1);
      if (n === 5 && m === 5) { live.bonus += 1; g.log(me, 'eff', '僕らの旅は終わらない：スコア+1'); }
    },
  },

  // ---------------- メンバー ----------------
  // 優木せつ菜（9）bp5-019：9三船栞子 bp5-022 と同じ効果
  'PL!N-bp5-019': { ...nijiHibure['PL!N-bp5-022'], note: '登場：手札を1枚捨ててよい→控え室の虹ヶ咲のライブを1枚手札に' },
  // 中須かすみ（4）bp5-014
  'PL!N-bp5-014': {
    note: '起動（ターン1回）[E][E]手札を1枚捨てる：控え室の虹ヶ咲のライブを1枚手札に',
    activated: [{
      once: 1,
      can: ({ me }) => me.hand.length >= 1 && me.energy.active >= 2 && me.waiting.some(nijiLive),
      ai: ({ g, me, late }) => me.energy.active >= 2 && me.hand.length >= 1 && willDiscard(g, me) && wantNijiLive(g, me, late ? 3 : 1),
      run: ({ g, me }) => {
        if (!me.hand.length || !g.payEnergy(me, 2)) return false;
        discardWorst(g, me, 1);
        recoverNijiLive(g, me, '中須かすみ：');
      },
    }],
  },
  // 宮下 愛（15）bp3-005
  'PL!N-bp3-005': {
    note: '自動：このターンにメンバーが3回登場したとき、手札が5枚になるまで引く。ライブ開始時：このターンにメンバーが2回以上登場していればライブの合計スコア+1',
    onAnyEnter({ g, me }) {
      if (!me.entries || me.entries.turn !== g.turn || me.entries.n !== 3) return;
      const n = Math.max(0, 5 - me.hand.length);
      if (n) { g.draw(me, n); g.log(me, 'eff', `宮下 愛：${n}枚引いた`); }
    },
    liveStart({ g, me, slot }) {
      if (me.entries && me.entries.turn === g.turn && me.entries.n >= 2) { slot.mods.push({ score: 1, untilLiveEnd: true }); g.log(me, 'eff', '宮下 愛：ライブの合計スコア+1'); }
    },
  },
  // 優木せつ菜（11）sd2-007
  'PL!N-sd2-007': {
    note: 'ライブ成功時：1枚引く。相手もライブに成功していれば、さらに1枚引き、手札を1枚捨てる',
    liveSuccess({ g, me, opp }) {
      g.draw(me, 1);
      if (opp.perf && opp.perf.ok && opp.liveZone.length) { g.draw(me, 1); discardWorst(g, me, 1); }
    },
  },
  // 上原歩夢（9）sd2-013
  'PL!N-sd2-013': {
    note: '登場／ライブ開始時：ステージが虹ヶ咲だけなら、相手の元々のブレードが2以下のメンバー1人をウェイト',
    onEnter({ g, me, opp }) { if (allInGroup(me, NIJI)) waitOpp(g, opp, s => s.card.def.blades <= 2, '上原歩夢：'); },
    liveStart({ g, me, opp }) { if (allInGroup(me, NIJI)) waitOpp(g, opp, s => s.card.def.blades <= 2, '上原歩夢：'); },
  },
  // 宮下 愛（4）sd2-017
  'PL!N-sd2-017': {
    note: 'ライブ開始時：[E]を払ってよい→自分のメンバー1人をアクティブ',
    order: { liveStart: 1 },
    liveStart({ g, me }) {
      const t = me.stage.filter(s => s && !s.active).sort((a, b) => b.card.def.blades - a.card.def.blades)[0];
      if (t && g.payEnergy(me, 1)) nijiActivate(g, me, t, '宮下 愛：');
    },
  },
  // Circle of Love（1点）bp8-029
  'PL!N-bp8-029': {
    note: 'ライブ成功時：余剰ハートの赤2つにつきスコア+1（+3まで）。その後、余剰ハートをすべて失う',
    order: { liveSuccess: 8 },
    liveSuccess({ g, me, live }) {
      const red = redExcess(me);
      const add = Math.min(3, Math.floor(red / 2));
      if (add) { live.bonus += add; g.log(me, 'eff', `Circle of Love：スコア+${add}`); }
      if (me.perf) { me.perf.excess = 0; me.perf.rest = null; }
    },
    // 見込み：ステージの赤ハートから、ライブ置き場のライブの赤の要求を引いた分（エールは数えない）
    preview({ me, live }) { let r = 0; for (const x of me.stage) if (x) r += x.card.def.hearts[1] || 0; live.bonus += Math.min(3, Math.floor(Math.max(0, r - 2) / 2)); },
  },
};

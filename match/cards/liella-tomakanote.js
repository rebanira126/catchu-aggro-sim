// Liella!（ウィーン・マルガレーテ軸「トマカノーテ」・デッキコード 252KM）で使うカードの効果（カード番号で登録）
import { cardLabel } from '../engine/game.js';
import { inGroup, isLive, isMember, cardWorth, discardWorst, willDiscard, recover, takeTop, pickBest, comboMissing, hasBladeHeart, waitOpp } from './lib.js';

const LIELLA = 'Liella!';
const isLiella = c => inGroup(c.def, LIELLA);
const KANON13 = 'PL!SP-bp2-001';
const MAR15 = 'PL!SP-bp2-010';

// ステージと控え室にいる、名前の異なる『Liella!』のメンバーの数
function liellaNames(me) {
  const names = new Set();
  const cards = me.waiting.concat(me.stage.filter(Boolean).map(s => s.card));
  for (const c of cards) if (isMember(c) && isLiella(c)) for (const n of c.def.names) names.add(n);
  return names.size;
}

// strategy.prefer.millTurns のターンか（デッキの上のカードを控え室に送るために登場時効果を必ず使う）
const millTurn = (g, me) => !!(me.prefer && me.prefer.millTurns && me.prefer.millTurns.includes(g.turn) && me.hand.length > 0);

// ステージにいる名前の異なる『KALEIDOSCORE』のメンバーの数
function kaleido(me) { const n = new Set(); for (const x of me.stage) if (x && x.card.def.unit === 'KALEIDOSCORE') for (const k of x.card.def.names) n.add(k); return n.size; }

// ステージにいる、ハートを4つ以上持つ『Liella!』のメンバーの数
function bigHearts(g, me) { let n = 0; me.stage.forEach((x, a) => { if (!x || !isLiella(x.card)) return; const h = g.heartsOf(me, x, a); if (h.h.reduce((p, q) => p + q, 0) + (h.all || 0) >= 4) n++; }); return n; }

// 手札のメンバーのうち、ステージ・控え室にまだ無い名前の『Liella!』のメンバーの数
function newHandNames(me) {
  const seen = new Set();
  for (const c of me.waiting.concat(me.stage.filter(Boolean).map(s => s.card))) if (isMember(c) && isLiella(c)) for (const n of c.def.names) seen.add(n);
  const add = new Set();
  for (const c of me.hand) if (isMember(c) && isLiella(c)) for (const n of c.def.names) if (!seen.has(n)) add.add(n);
  return add.size;
}

// 15マルガレーテのライブ開始時能力が働くか（ほかのメンバーがいて、13かのんで無効にされていない）
const marActive = (me, slot) => !slot.mods.some(m => m.noLiveStart) && me.stage.some(s => s && s !== slot);

// このターンと次のターンの目標のライブで、手札に足りないものがあるか
function livesShort(g, me) {
  const miss = comboMissing(g, me, { upTo: 1 });
  if (miss.size) return true;
  return me.hand.filter(isLive).length < 2;
}

export default {
  // ---------------- ライブ ----------------
  // 未来予報ハレルヤ！（3点）
  'PL!SP-bp1-026': {
    note: 'ライブ開始時：ステージと控え室に名前の異なるLiella!のメンバーが5人以上なら、必要ハートが赤2・黄2・紫2になる',
    order: { liveStart: 1 },
    liveStart({ g, me, live }) {
      if (liellaNames(me) >= 5) { live.need = [0, 0, 2, 2, 0, 0, 2]; g.log(me, 'eff', '未来予報ハレルヤ！：必要ハートが赤2・黄2・紫2になった'); }
    },
    // 見込み：ライブ置き場の空いた枠（最大2枠）に手札の名前の異なるメンバーを伏せる分も数える（伏せたカードはライブ開始時より前に控え室へ行く）
    preview({ me, live }) { if (liellaNames(me) + Math.min(2, newHandNames(me)) >= 5) live.need = [0, 0, 2, 2, 0, 0, 2]; },
  },
  // ビタミンSUMMER!（5点）
  'PL!SP-bp2-024': {
    note: 'ライブ成功時：手札の枚数が相手より多ければスコア+1',
    liveSuccess({ g, me, opp, live }) { if (opp && me.hand.length > opp.hand.length) { live.bonus += 1; g.log(me, 'eff', 'ビタミンSUMMER!：スコア+1'); } },
    // ライブを置いたあとの手札の枚数で見込む（ひとり回しでは相手の手札を5枚とする）
    preview({ g, me, live }) { const o = g.opp(me); const oh = o && !o.virtual ? o.hand.length : 5; if (me.hand.length - 2 > oh) live.bonus += 1; },
  },
  // Bubble Rise（4点）
  'PL!SP-bp2-025': {
    note: 'ライブ成功時：ステージに「澁谷かのん」「ウィーン・マルガレーテ」「鬼塚冬毬」のうち名前の異なるメンバーが2人以上いれば、エールのカードを1枚手札に',
    liveSuccess({ g, me }) {
      const names = new Set();
      for (const s of me.stage) if (s) for (const n of s.card.def.names) if (['澁谷かのん', 'ウィーン・マルガレーテ', '鬼塚冬毬'].includes(n.replace(/\s/g, '')) || ['澁谷かのん', 'ウィーン・マルガレーテ', '鬼塚冬毬'].includes(n)) names.add(n.replace(/\s/g, ''));
      if (names.size < 2 || !me.cheer.length) return;
      // 手札に無いもの（ビタミンSUMMER!・Bubble Rise・13かのん）を優先
      const want = ['PL!SP-bp2-024', 'PL!SP-bp2-025', KANON13];
      const miss = want.filter(id => !me.hand.some(c => c.def.id === id));
      const c = me.cheer.find(x => miss.includes(x.def.id)) || pickBest(g, me, me.cheer, () => true);
      if (!c) return;
      me.cheer.splice(me.cheer.indexOf(c), 1);
      me.hand.push(c);
      g.log(me, 'eff', `Bubble Rise：エールの${cardLabel(c)}を手札に加えた`);
    },
  },

  // ---------------- メンバー ----------------
  // ウィーン・マルガレーテ（15）bp2-010
  [MAR15]: {
    note: '常時：相手のライブの必要ハートが無色+1。ライブ開始時：ほかのメンバーがいればエールの枚数-8',
    oppNeedMod({ need }) { need[0] += 1; },
    order: { liveStart: 1 },
    liveStart({ g, me, slot }) {
      if (!me.stage.some(s => s && s !== slot) || !me.perf) return;
      me.perf.cheerBonus = (me.perf.cheerBonus || 0) - 8;
      g.log(me, 'eff', 'ウィーン・マルガレーテ：エールの枚数が8枚減る');
    },
    // 成功の見込み：エールの枚数を8枚少なく見る
    estBlades: ({ me, slot }) => (marActive(me, slot) ? -8 : 0),
  },
  // 澁谷かのん（13）bp2-001
  [KANON13]: {
    note: '登場：ステージのLiella!メンバー1人のライブ開始時能力をライブ終了時まで無効にしてよい→無効にしたら控え室のLiella!のカードを1枚手札に',
    onEnter({ g, me, slot }) {
      // 無効にする相手：エールを減らしている15マルガレーテ（いなければ何もしない）
      const t = me.stage.find(s => s && s !== slot && s.card.def.id === MAR15 && !s.mods.some(m => m.noLiveStart));
      if (!t) return;
      t.mods.push({ noLiveStart: true, untilLiveEnd: true });
      g.log(me, 'eff', `澁谷かのん：${cardLabel(t.card)}のライブ開始時能力を無効にした`);
      // ライブが足りなければライブ、足りていれば13かのん（次のターンにバトンタッチで出し直す）
      if (livesShort(g, me)) recover(g, me, c => isLive(c) && isLiella(c), '澁谷かのん：') || recover(g, me, isLiella, '澁谷かのん：');
      else recover(g, me, c => c.def.id === KANON13, '澁谷かのん：') || recover(g, me, isLiella, '澁谷かのん：');
    },
  },
  // 葉月 恋（4）bp2-005
  'PL!SP-bp2-005': {
    note: '登場：[E][E]払ってよい→デッキの上7枚からLiella!のカードを1枚手札に',
    onEnter({ g, me }) {
      if (me.energy.active < 2) return;
      // ほかに出したいメンバーのエネルギーが残るときだけ払う（1Tは払う）
      const rest = me.energy.active - 2;
      const want = me.hand.some(c => isMember(c) && c !== null && g.costOf(me, c) <= rest && c.def.cost >= 4);
      if (g.turn > 1 && !want && rest < 2) return;
      if (!g.payEnergy(me, 2)) return;
      const top = takeTop(g, me, 7);
      const pick = pickBest(g, me, top, isLiella);
      if (pick) { top.splice(top.indexOf(pick), 1); me.hand.push(pick); }
      me.waiting.push(...top);
      g.log(me, 'eff', `葉月 恋：デッキの上7枚から${pick ? cardLabel(pick) + 'を手札に加えた' : '手札に加えるカードなし'}`);
    },
  },
  // 唐 可可（9）bp2-013
  'PL!SP-bp2-013': {
    note: '登場：控え室のカードを1枚までデッキの一番上に置く',
    // このターンのエールでめくれるので、ブレードハートのあるカードを置く（ALL＞色）。
    // 控え室にその名前が1枚しかないメンバーは置かない（未来予報ハレルヤ！の「名前の異なるメンバー」が減る）
    onEnter({ g, me }) {
      if (!me.waiting.length) return;
      const nameCount = new Map();
      for (const c of me.waiting.concat(me.stage.filter(Boolean).map(x => x.card))) if (isMember(c)) for (const n of c.def.names) nameCount.set(n, (nameCount.get(n) || 0) + 1);
      const score = c => {
        let v = 0;
        if (c.def.bh) v += c.def.bh.c === 'all' ? 3 : 2;
        if (isMember(c) && c.def.names.some(n => nameCount.get(n) === 1)) v -= 4;
        return v + cardWorth(g, me, c) / 20;
      };
      const c = me.waiting.slice().sort((a, b) => score(b) - score(a))[0];
      if (score(c) < 0) return;
      me.waiting.splice(me.waiting.indexOf(c), 1);
      me.deck.unshift(c);
      me.knownTop = me.knownTop || new Set(); me.knownTop.add(c.uid);
      g.log(me, 'eff', `唐 可可：控え室の${cardLabel(c)}をデッキの一番上に置いた`);
    },
  },
  // ---------------- トマカノーテ（DUO環境・H4BWC）で使うカード ----------------
  // 唐 可可（4）bp5-013
  'PL!SP-bp5-013': {
    note: '登場：手札を1枚捨ててよい→デッキの上5枚からSunny PassionのメンバーかブレードハートのあるLiella!のメンバーを1枚手札に。残りは控え室',
    onEnter({ g, me }) {
      if (!(millTurn(g, me) || willDiscard(g, me))) return;
      discardWorst(g, me, 1);
      const top = takeTop(g, me, 5);
      const pick = pickBest(g, me, top, c => isMember(c) && (inGroup(c.def, 'Sunny Passion') || (isLiella(c) && hasBladeHeart(c.def))));
      if (pick) { top.splice(top.indexOf(pick), 1); me.hand.push(pick); }
      me.waiting.push(...top);
      g.log(me, 'eff', `唐 可可：デッキの上5枚から${pick ? cardLabel(pick) + 'を手札に加えた' : '手札に加えるカードなし'}`);
    },
  },
  // 米女メイ（4）bp7-018
  'PL!SP-bp7-018': {
    note: '登場：手札のライブを1枚捨ててよい→デッキの上5枚から1枚手札に。残りは控え室',
    onEnter({ g, me }) {
      const lives = me.hand.filter(isLive).sort((a, b) => cardWorth(g, me, a) - cardWorth(g, me, b));
      if (!lives.length) return;
      // millTurns のターンか、ライブが3枚以上あるときに使う
      if (!(millTurn(g, me) || lives.length >= 3)) return;
      const c = lives[0];
      me.hand.splice(me.hand.indexOf(c), 1); me.waiting.push(c);
      g.log(me, 'eff', `米女メイ：手札の${cardLabel(c)}を控え室に置いた`);
      const top = takeTop(g, me, 5);
      const pick = pickBest(g, me, top, () => true);
      if (pick) { top.splice(top.indexOf(pick), 1); me.hand.push(pick); }
      me.waiting.push(...top);
      g.log(me, 'eff', `米女メイ：デッキの上5枚から${pick ? cardLabel(pick) + 'を手札に加えた' : '手札に加えるカードなし'}`);
    },
  },
  // 米女メイ（9）pb2-029
  'PL!SP-pb2-029': {
    note: '登場／ライブ開始時：相手のステージのコスト2以下のメンバー1人をウェイト',
    onEnter({ g, opp }) { if (opp) waitOpp(g, opp, s => s.card.def.cost <= 2, '米女メイ：'); },
    liveStart({ g, opp }) { if (opp) waitOpp(g, opp, s => s.card.def.cost <= 2, '米女メイ：'); },
  },
  // 唐 可可（9）pb2-035
  'PL!SP-pb2-035': {
    note: '常時：左サイドにいるかぎりブレード+2',
    blades: ({ area }) => (area === 0 ? 2 : 0),
  },
  // ---------------- マルガレーテ強化の候補 ----------------
  // 鬼塚冬毬（9）bp5-011
  'PL!SP-bp5-011': {
    note: '常時：左サイドで赤3・センターで黄3・右サイドで青3を得る',
    hearts: ({ area }) => ({ c: area === 0 ? [0, 3, 0, 0, 0, 0] : area === 1 ? [0, 0, 3, 0, 0, 0] : [0, 0, 0, 0, 3, 0] }),
  },
  // 私のSymphony ～澁谷かのんVer.～（4点）
  'PL!SP-sd1-026': {
    note: 'ライブ開始時：エネルギーが9枚以上ならスコア+1',
    liveStart({ g, me, live }) { if (me.energy.n >= 9) { live.bonus += 1; g.log(me, 'eff', '私のSymphony：スコア+1'); } },
    preview({ me, live }) { if (me.energy.n >= 9) live.bonus += 1; },
  },
  // ニュートラル（6点）pb1-024
  'PL!SP-pb1-024': {
    note: 'ライブ開始時：ステージに名前の異なるKALEIDOSCOREのメンバーが2人以上ならスコア+1',
    liveStart({ g, me, live }) { if (kaleido(me) >= 2) { live.bonus += 1; g.log(me, 'eff', 'ニュートラル：スコア+1'); } },
    preview({ me, live }) { if (kaleido(me) >= 2) live.bonus += 1; },
  },
  // 絶対的LOVER（4点）pb2-045
  'PL!SP-pb2-045': {
    note: 'ライブ開始時：ステージのハートを4つ以上持つLiella!のメンバー1人につきスコア+1',
    liveStart({ g, me, live }) { const n = bigHearts(g, me); if (n) { live.bonus += n; g.log(me, 'eff', `絶対的LOVER：スコア+${n}`); } },
    preview({ g, me, live }) { live.bonus += bigHearts(g, me); },
  },
  // 常夏☆サンシャイン（6点）bp5-025
  'PL!SP-bp5-025': {
    note: 'ライブ成功時：[E]を好きな数払ってよい→4つにつきスコア+1',
    liveSuccess({ g, me, live }) {
      const k = Math.floor(me.energy.active / 4);
      if (k && g.payEnergy(me, k * 4)) { live.bonus += k; g.log(me, 'eff', `常夏☆サンシャイン：エネルギー${k * 4}枚でスコア+${k}`); }
    },
    preview({ me, live }) { live.bonus += Math.floor(me.energy.active / 4); },
  },
  // DAISUKI FULL POWER（5点）bp4-028
  'PL!SP-bp4-028': {
    note: 'ライブ開始時：アクティブなエネルギーがあればスコア+1',
    liveStart({ g, me, live }) { if (me.energy.active > 0) { live.bonus += 1; g.log(me, 'eff', 'DAISUKI FULL POWER：スコア+1'); } },
    preview({ me, live }) { if (me.energy.active > 0) live.bonus += 1; },
  },
};

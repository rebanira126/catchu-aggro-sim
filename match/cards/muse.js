// μ's のカード効果（カード番号で登録）
import { inGroup, isLive, isMember, discardWorst, willDiscard, recover, waitOpp, allInGroup, searchBigOnEnter, scry, hasBladeHeart, cardWorth, anyColorHeart, oppYetToPerform } from './lib.js';

const MUSE = "μ's";
const isMuse = c => inGroup(c.def, MUSE);
const needSum = need => need.reduce((a, b) => a + b, 0);

export default {
  // ---------------- ライブ ----------------
  // Music S.T.A.R.T!!（2点）
  'PL!-bp6-019': {
    note: '常時（成功ライブ置き場）：元々のコスト17以上のμ\'sメンバーを手札から出すコスト-2（重複しない）',
    costMod({ card }) { return isMember(card) && card.def.cost >= 17 && isMuse(card) ? -2 : 0; },
  },
  // Dreamin' Go! Go!!（9点）
  'PL!-bp6-022': {
    note: '常時（成功ライブ置き場）：元々のスコア5以上のμ\'sライブの必要ハートの無色-2（重複しない）',
    needMod({ card, need }) { if (isLive(card) && card.def.score >= 5 && isMuse(card)) need[0] -= 2; },
  },
  // 嵐のなかの恋だから（5点）
  'PL!-pb2-038': {
    note: '常時（ライブ置き場か成功ライブ置き場）：ステージにμ\'sのメンバー2人だけなら合計スコア+1（重複しない）',
    zones: ['live', 'success'],
    zoneScoreBonus({ me }) {
      const ms = me.stage.filter(Boolean);
      return ms.length === 2 && ms.every(s => isMuse(s.card)) ? 1 : 0;
    },
    preview({ me, live }) { const ms = me.stage.filter(Boolean); if (ms.length === 2 && ms.every(s => isMuse(s.card))) live.bonus += 1; },
  },
  // 僕たちはひとつの光（9点）
  'PL!-pb2-039': {
    note: 'ライブ開始時：成功ライブ置き場にμ\'sが2枚以上ならエール+10枚。ライブ成功時：ステージとエールの名前の異なるμ\'sメンバー1人につきスコア+1',
    liveStart({ g, me }) {
      if (me.success.filter(isMuse).length >= 2 && me.perf) { me.perf.cheerBonus = (me.perf.cheerBonus || 0) + 10; g.log(me, 'eff', '僕たちはひとつの光：エール+10枚'); }
    },
    liveSuccess({ g, me, live }) {
      const names = new Set();
      for (const s of me.stage) if (s && isMuse(s.card)) s.card.def.names.forEach(n => names.add(n));
      for (const c of me.cheer) if (isMember(c) && isMuse(c)) c.def.names.forEach(n => names.add(n));
      live.bonus += names.size;
      g.log(me, 'eff', `僕たちはひとつの光：名前の異なるμ'sメンバー${names.size}人 → スコア+${names.size}`);
    },
    preview({ me, live }) {
      if (me.success.filter(isMuse).length >= 2) live.cheer += 10;
      const names = new Set();
      for (const s of me.stage) if (s && isMuse(s.card)) s.card.def.names.forEach(n => names.add(n));
      live.bonus += names.size + 2; // エールで出る分の見込み
    },
  },
  // 輝夜の城で踊りたい（1点）
  'PL!-pb1-031': {
    note: 'ライブ成功時：手札1枚を捨ててよい→エールのμ\'sメンバーを1枚手札に',
    liveSuccess({ g, me }) {
      const cand = me.cheer.filter(c => isMember(c) && isMuse(c)).sort((a, b) => cardWorth(g, me, b) - cardWorth(g, me, a))[0];
      if (!cand || !willDiscard(g, me)) return;
      discardWorst(g, me, 1);
      me.cheer.splice(me.cheer.indexOf(cand), 1);
      me.hand.push(cand);
      g.log(me, 'eff', `輝夜の城で踊りたい：エールの${cand.def.name}を手札に加えた`);
    },
  },

  // ---------------- メンバー ----------------
  // 星空 凛（4）bp3-014：ウェイトにしてデッキの上2枚を整える（ブレードを失うので、ライブをしないターンだけ使う）
  'PL!-bp3-014': {
    note: '登場：自分をウェイトにしてよい→デッキの上2枚を見て、好きな枚数を上に戻し残りを控え室（手札にライブが無いときだけ使う）',
    onEnter({ g, me, slot }) {
      if (me.hand.some(isLive)) return;
      slot.active = false;
      scry(g, me, 2, '星空 凛：');
    },
  },
  // 絢瀬絵里（4）bp5-002
  'PL!-bp5-002': searchBigOnEnter(MUSE, 9, '絢瀬絵里：'),
  // 園田海未（4）pb2-031：ライブ開始時、手札のμ'sカードを捨てて紫+1
  'PL!-pb2-031': {
    note: 'ライブ開始時：手札のμ\'sカードを1枚捨ててよい→ライブ終了時まで紫ハート+1',
    order: { liveStart: 4 },
    liveStart({ g, me, slot }) {
      if (!me.hand.some(isMuse) || !willDiscard(g, me)) return;
      const keep = new Set(me.hand.filter(c => !isMuse(c)).map(c => c.uid));
      discardWorst(g, me, 1, keep);
      slot.mods.push({ hearts: { c: [0, 0, 0, 0, 0, 1] }, untilLiveEnd: true });
    },
  },
  // 星空 凛（4）bp3-005：登場したらステージのメンバーをすべてアクティブ
  'PL!-bp3-005': {
    note: '登場：ステージのメンバーをすべてアクティブにする',
    onEnter({ me }) { for (const s of me.stage) if (s) s.active = true; },
  },
  // 矢澤にこ（9）pb2-009：コスト15以上のμ'sとバトンタッチして控え室に置かれたら、エネルギー2枚アクティブ
  'PL!-pb2-009': {
    note: '自動：コスト15以上のμ\'sメンバーとバトンタッチして控え室に置かれたとき、エネルギーを2枚アクティブ',
    onBatonOut({ g, me, newCard }) {
      if (newCard.def.cost >= 15 && isMuse(newCard)) { me.energy.active = Math.min(me.energy.n, me.energy.active + 2); g.log(me, 'eff', '矢澤にこ：エネルギーを2枚アクティブにした'); }
    },
  },
  // 絢瀬絵里（9）pb2-029：ステージがμ'sだけなら、相手の元々ブレード2以下のメンバー1人をウェイト
  'PL!-pb2-029': {
    note: '登場／ライブ開始時：ステージがμ\'sだけなら、相手の元々のブレード2以下のメンバー1人をウェイト',
    onEnter({ g, me, opp }) { if (allInGroup(me, MUSE)) waitOpp(g, opp, s => s.card.def.blades <= 2, '絢瀬絵里：'); },
    liveStart({ g, me, opp }) { if (oppYetToPerform(g, me) && allInGroup(me, MUSE)) waitOpp(g, opp, s => s.card.def.blades <= 2, '絢瀬絵里：'); },
  },
  // 絢瀬絵里（15）bp4-002
  'PL!-bp4-002': {
    note: '常時：ライブ中のライブに【ライブ開始時】も【ライブ成功時】も持たないカードがあれば紫ハート+2。起動（ターン1回・成功ライブのスコア合計6以上）：手札2枚を捨てて控え室のμ\'sライブを1枚手札に',
    hearts({ me }) {
      const plain = me.lives.some(l => !/【ライブ開始時】|【ライブ成功時】/.test(l.card.def.text));
      return plain ? { c: [0, 0, 0, 0, 0, 2] } : null;
    },
    activated: [{
      once: 1,
      can: ({ me }) => me.success.reduce((s, c) => s + c.def.score, 0) >= 6 && me.hand.length >= 2 && me.waiting.some(c => isLive(c) && isMuse(c)),
      ai: ({ g, me }) => !me.hand.some(isLive) && me.hand.length >= 3 && willDiscard(g, me, 2),
      run({ g, me }) { discardWorst(g, me, 2); recover(g, me, c => isLive(c) && isMuse(c), '絢瀬絵里：'); },
    }],
  },
  // 南 ことり（15）bp6-003
  'PL!-bp6-003': {
    note: 'ライブ開始時（センター）：手札のコスト2以下のμ\'sメンバーを下に置いてよい→好きな色のハート+1。ライブ成功時：下のコスト2以下のμ\'sメンバーを空いているエリアに登場させてよい',
    liveStart({ g, me, slot, area }) {
      if (area !== 1) return;
      const c = me.hand.filter(x => isMember(x) && x.def.cost <= 2 && isMuse(x)).sort((a, b) => cardWorth(g, me, a) - cardWorth(g, me, b))[0];
      if (!c) return;
      me.hand.splice(me.hand.indexOf(c), 1);
      slot.under.push(c);
      anyColorHeart(slot);
      g.log(me, 'eff', `南 ことり：${c.def.name}を下に置き、好きな色のハート+1`);
    },
    liveSuccess({ g, me, slot }) {
      const empty = me.stage.findIndex(s => !s);
      const c = slot.under.find(x => isMember(x) && x.def.cost <= 2 && isMuse(x));
      if (empty < 0 || !c) return;
      slot.under.splice(slot.under.indexOf(c), 1);
      g.putMember(me, c, empty, { from: 'under' });
    },
  },
  // 星空 凛&小泉花陽（15）
  'PL!-pb2-000': {
    note: '常時：2人のメンバーとバトンタッチしてよい。登場：μ\'s 2人からバトンタッチしたら、控え室のμ\'sライブを1枚手札に。さらに2人のコスト合計が15なら合計スコア+1（ライブ終了時まで）',
    doubleBaton: true,
    onEnter({ g, me, slot, batonFrom, second }) {
      if (!batonFrom || !second || !isMuse(batonFrom.card) || !isMuse(second.card)) return;
      recover(g, me, c => isLive(c) && isMuse(c), '星空 凛&小泉花陽：');
      if (batonFrom.card.def.cost + second.card.def.cost === 15) { slot.mods.push({ score: 1, untilLiveEnd: true }); g.log(me, 'eff', '星空 凛&小泉花陽：合計スコア+1'); }
    },
    aiBonus({ me }) { return me.waiting.some(c => isLive(c) && isMuse(c)) ? 1 : 0; },
  },
  // 西木野真姫（17）bp6-006：色を指定してデッキの上5枚を公開。5枚すべてがその色を持てば、μ'sを1枚手札に＋ブレード+3
  // メンバーは「持っているハート」、ライブは「必要ハート」で判定。公開する前に、デッキの中で一番多くのカードが持つ色を指定する
  'PL!-bp6-006': {
    note: '起動（ターン1回）：手札1枚を捨て、色を指定してデッキの上5枚を公開。5枚すべてがその色のハート（ライブは必要ハート）を持つなら、μ\'sを1枚手札に・ライブ終了時までブレード+3（デッキで一番多くのカードが持つ色を指定。成立の見込みが2割以上のときに使う）',
    activated: [{
      once: 1,
      can: ({ me }) => me.hand.length >= 1,
      ai: ({ g, me }) => bestColor(me).p >= 0.2 && willDiscard(g, me),
      run({ g, me, slot }) {
        const { col } = bestColor(me);
        discardWorst(g, me, 1);
        const top = [];
        for (let k = 0; k < 5; k++) { const c = g.topCard(me); if (c) top.push(c); }
        const ok = top.length === 5 && top.every(c => hasColor(c, col));
        if (ok) {
          const pick = top.filter(isMuse).sort((a, b) => cardWorth(g, me, b) - cardWorth(g, me, a))[0];
          if (pick) { top.splice(top.indexOf(pick), 1); me.hand.push(pick); }
          slot.mods.push({ blades: 3, untilLiveEnd: true });
        }
        me.waiting.push(...top);
        g.log(me, 'eff', `西木野真姫：${COLOR[col]}を指定して5枚公開 → ${ok ? '成立（1枚手札に、ブレード+3）' : '不成立'}`);
      },
    }],
  },
  // 高坂穂乃果（22）pb2-001
  'PL!-pb2-001': {
    note: 'ライブ開始時：成功ライブ置き場のμ\'sカードに、スコアアイコンがあれば合計スコア+1、ALLブレードがあればALLハート+1、ドローアイコンがあれば控え室のμ\'sカードを1枚手札に',
    liveStart({ g, me, slot }) {
      const zone = me.success.filter(isMuse);
      if (zone.some(c => c.def.icon === 'score')) slot.mods.push({ score: 1, untilLiveEnd: true });
      if (zone.some(c => c.def.bh && c.def.bh.c === 'all')) slot.mods.push({ hearts: { all: 1 }, untilLiveEnd: true });
      if (zone.some(c => c.def.icon === 'draw')) recover(g, me, isMuse, '高坂穂乃果：');
    },
  },
  // 絢瀬絵里（2）bp5-011：緑・青・紫から1色を選び、成功ライブ1枚につきその色のハート+1
  'PL!-bp5-011': {
    note: 'ライブ開始時：緑・青・紫のうち1色を選び、ライブ終了時まで成功ライブ1枚につきその色のハート+1（ライブで一番足りない色を選ぶ）',
    order: { liveStart: 4 },
    liveStart({ g, me, slot }) {
      const n = me.success.length;
      if (!n) return;
      // 緑=4 青=5 紫=6（必要ハートの番号）。ライブの必要ハートの合計が一番多い色
      const want = [4, 5, 6].map(i => [i, me.lives.reduce((s, l) => s + (l.need[i] || 0), 0)]).sort((a, b) => b[1] - a[1])[0][0];
      const c = [0, 0, 0, 0, 0, 0]; c[want - 1] = n;
      slot.mods.push({ hearts: { c }, untilLiveEnd: true });
    },
  },
};

const COLOR = ['', '桃', '赤', '黄', '緑', '青', '紫'];
// カードが色 col（1=桃〜6=紫）を持つか：メンバーはハート、ライブは必要ハート
function hasColor(c, col) {
  if (isMember(c)) return c.def.hearts[col - 1] > 0;
  if (isLive(c)) return c.def.need[col] > 0;
  return false;
}
// デッキの中で一番多くのカードが持つ色と、5枚すべてがその色になる見込み
function bestColor(me) {
  const deck = me.deck.length >= 5 ? me.deck : me.deck.concat(me.waiting);
  let best = { col: 6, p: 0 };
  for (let col = 1; col <= 6; col++) {
    const k = deck.filter(c => hasColor(c, col)).length, n = deck.length;
    let p = 1;
    for (let i = 0; i < 5; i++) p *= Math.max(0, k - i) / Math.max(1, n - i);
    if (p > best.p) best = { col, p };
  }
  return best;
}

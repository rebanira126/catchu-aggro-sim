// Liella! のカード効果（カード番号で登録）
import { inUnit, inGroup, isLive, isMember, distinctNames, activateEnergy, discardWorst, willDiscard, lookTake, recover, takeTop, pickBest, cardWorth, hasBladeHeart, waitOpp, allInGroup } from './lib.js';

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
      // 次のターンに足りないものだけをデッキの上に置く：ライブ → 5コスト → 大型 の順
      const hand = me.hand, stage = me.stage.filter(Boolean).map(x => x.card.def);
      const needSum = d => d.need.reduce((a, b) => a + b, 0);
      const needLive = !hand.some(c => isLive(c) && needSum(c.def) <= 8);
      const need5 = g.turn <= 2 && !hand.some(c => isMember(c) && c.def.cost >= 3 && c.def.cost <= 5) && !stage.some(d => d.cost >= 5);
      const needBig = g.turn >= 2 && !hand.some(c => isMember(c) && c.def.cost >= 9) && stage.some(d => d.cost >= 3 && d.cost <= 5);
      const rank = c => {
        if (isLive(c)) return needLive && needSum(c.def) <= 8 ? 3 : 0;
        if (c.def.cost >= 3 && c.def.cost <= 5) return need5 ? 2 : 0;
        if (c.def.cost >= 9) return needBig ? 1 : 0;
        return 0;
      };
      let pick = null, br = 0;
      for (const c of me.cheer) {
        if (!inGroup(c.def, 'Liella!')) continue;
        const r = rank(c);
        if (r > br) { br = r; pick = c; }
      }
      if (pick) {
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
    // 手札にライブがない／序盤に5コストがないときは、探しに行く価値が高い
    aiBonus({ g, me }) {
      if (!me.hand.some(isLive)) return 2;
      if (g.turn <= 2 && !me.hand.some(c => isMember(c) && c.def.cost === 5)) return 3;
      return 0;
    },
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
    order: { liveStart: 0 }, // 先にアクティブにしておくと、かのんの支払いに回せる
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
    order: { liveStart: 2 },
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

  // ================= 加点Liella!・タワーLiella! =================
  // ---------------- ライブ ----------------
  // Shooting Voice!!（5点）
  'PL!SP-bp5-023': {
    note: 'ライブ成功時：どちらかの成功ライブが2枚以上で、エールにスコアアイコンのライブがあればスコア+2',
    order: { liveSuccess: 2 },
    liveSuccess({ g, me, opp, live }) {
      if (Math.max(me.success.length, opp.success.length) >= 2 && me.cheer.some(c => isLive(c) && c.def.icon === 'score')) {
        live.bonus += 2; g.log(me, 'eff', 'Shooting Voice!!：スコア+2');
      }
    },
    // 見積もり：条件のうち成功ライブ2枚の方だけ見て、スコアアイコンは期待値で +1
    preview({ me, opp, live }) { if (Math.max(me.success.length, opp.success.length) >= 2) live.bonus += 1; },
  },
  // Let's be ONE（1点）
  'PL!SP-bp5-026': {
    note: 'ライブ開始時：ステージのLiella!メンバーのハートの合計が11以上ならスコア+1',
    liveStart({ g, me, live }) { if (liellaHearts(g, me) >= 11) live.bonus += 1; },
    preview({ g, me, live }) { if (liellaHearts(g, me) >= 11) live.bonus += 1; },
  },
  // Welcome to 僕らのセカイ（1点）
  'PL!SP-pb2-047': {
    note: 'ライブ開始時：手札1枚を捨ててよい→ステージがLiella!だけなら、相手のコスト2以下のメンバー1人をウェイト（相手がまだライブしていないときだけ使う）',
    liveStart({ g, me, opp }) {
      if (g.order()[0] !== me || !allInGroup(me, 'Liella!')) return;
      if (!opp.stage.some(s => s && s.active && s.card.def.cost <= 2)) return;
      if (!willDiscard(g, me)) return;
      discardWorst(g, me, 1);
      waitOpp(g, opp, s => s.card.def.cost <= 2, 'Welcome to 僕らのセカイ：');
    },
  },
  // 始まりは君の空（1点 → 成功ライブ2枚以上で6点）
  'PL!SP-sd2-023': {
    note: 'ライブ開始時：自分の成功ライブが2枚以上ならスコア+5、必要ハートは赤3黄3紫3無色3になる',
    order: { liveStart: 1 },
    liveStart({ me, live }) { hajimari(me, live); },
    preview({ me, live }) { hajimari(me, live); },
  },
  // Go!! リスタート（1点）
  'PL!SP-bp2-023': {
    note: 'ライブ開始時：自分の成功ライブが相手より少なければスコア+1',
    liveStart({ me, opp, live }) { if (me.success.length < opp.success.length) live.bonus += 1; },
    preview({ me, opp, live }) { if (me.success.length < opp.success.length) live.bonus += 1; },
  },

  // ---------------- メンバー ----------------
  // 平安名すみれ（4）／鬼塚夏美（4）：エールにブレードハートを持つカードが無ければハート+1
  'PL!SP-bp2-015': noBladeHeartHeart(5, '平安名すみれ', '紫'),
  'PL!SP-bp2-020': noBladeHeartHeart(1, '鬼塚夏美', '赤'),
  // 若菜四季（4）：自分をウェイト＋手札1枚 → 上5枚からコスト9以上のLiella!メンバー
  'PL!SP-bp5-008': {
    note: '登場：自分をウェイトにし手札1枚を捨ててよい→デッキの上5枚からコスト9以上のLiella!メンバーを1枚手札に',
    onEnter({ g, me, slot }) {
      if (me.hand.some(c => isMember(c) && c.def.cost >= 9)) return;
      if (!willDiscard(g, me)) return;
      slot.active = false;
      discardWorst(g, me, 1);
      lookTake(g, me, 5, c => isMember(c) && c.def.cost >= 9 && inGroup(c.def, 'Liella!'), '若菜四季：');
    },
    aiBonus({ me }) { return me.hand.some(c => isMember(c) && c.def.cost >= 9) ? 0 : 1.5; },
  },
  // 鬼塚夏美（4）pb2-009：自分のLiella!メンバーをウェイトにして、相手のメンバーをウェイトにする妨害
  // 使うのは、相手のアクティブフェイズが済んでいて（自分が後攻）、自分のメンバーをウェイトにしても損が小さいとき
  // （このターンにライブをしない／ウェイトにするメンバーのブレードより、止める相手のブレードの方が多い）
  'PL!SP-pb2-009': {
    note: '登場／ライブ開始時：Liella!メンバー1人をウェイトにしてよい→相手の、元々のブレードが2つ以上少ないメンバー1人をウェイト（自分が余裕のあるときに使う）',
    onEnter({ g, me, opp }) { if (g.order()[1] === me) natsumiWait(g, me, opp, !me.hand.some(isLive)); },
    liveStart({ g, me, opp }) { if (g.order()[0] === me) natsumiWait(g, me, opp, false); },
  },
  // 葉月 恋（9）
  'PL!SP-bp7-005': {
    note: '登場時（ターン1回）：エネルギーを1枚ウェイトで置く（次のアクティブフェイズにアクティブにならない）。効果でエネルギーが置かれるたびブレード+1（ターン2回）',
    onEnter({ g, me, slot }) {
      if (g.useOnce(slot, 'bp7-005-enter')) g.addEnergyByEffect(me, { lock: true, label: '葉月 恋：' });
    },
    onEnergy({ g, slot }) {
      if (g.useOnce(slot, 'bp7-005-blade', 2)) slot.mods.push({ blades: 1, untilLiveEnd: true });
    },
    // 序盤に出すと、次の次のターンに大型を出せる
    aiBonus({ g, me }) { return g.turn <= 3 && me.energyDeck > 0 ? 2 : 0; },
  },
  // 鬼塚冬毬（9）：手札をすべて捨ててよい → 6枚引く
  'PL!SP-bp7-011': {
    note: '登場：手札をすべて捨ててよい→6枚引く（手札が3枚以下のときに使う）',
    onEnter({ g, me }) {
      if (me.hand.length > 3) return;
      const n = me.hand.length;
      me.waiting.push(...me.hand.splice(0));
      g.draw(me, 6);
      g.log(me, 'eff', `鬼塚冬毬：手札${n}枚を捨てて6枚引いた`);
    },
    aiBonus({ me }) { return me.hand.length <= 4 ? 2 : 0; },
  },
  // 桜小路きな子（9）：登場したらブレード+2
  'PL!SP-pb1-006': {
    note: '登場か移動のたび：ライブ終了時までブレード+2',
    onEnter({ slot }) { slot.mods.push({ blades: 2, untilLiveEnd: true }); },
  },
  // 葉月 恋（15）
  'PL!SP-bp4-005': {
    note: '登場：Liella!からバトンタッチでエネルギー7枚以上ならエネルギーを2枚ウェイトで置く。常時：エネルギー10枚以上でブレード+3',
    onEnter({ g, me, baton, batonFrom }) {
      if (baton && batonFrom && inGroup(batonFrom.card.def, 'Liella!') && me.energy.n >= 7) {
        g.addEnergyByEffect(me, { label: '葉月 恋：' });
        g.addEnergyByEffect(me, { label: '葉月 恋：' });
      }
    },
    blades({ me }) { return me.energy.n >= 10 ? 3 : 0; },
  },
  // 澁谷かのん（15）：手札1枚 → 上5枚からコスト4以下のLiella!メンバーを空きエリアに登場か手札に
  'PL!SP-pb2-001': {
    note: '登場：手札1枚を捨ててよい→デッキの上5枚からコスト4以下のLiella!メンバーを1枚、空いているエリアに登場させるか手札に',
    onEnter({ g, me }) {
      if (!willDiscard(g, me)) return;
      discardWorst(g, me, 1);
      const top = takeTop(g, me, 5);
      const pick = pickBest(g, me, top, c => isMember(c) && c.def.cost <= 4 && inGroup(c.def, 'Liella!'));
      if (pick) top.splice(top.indexOf(pick), 1);
      me.waiting.push(...top);
      if (!pick) { g.log(me, 'eff', '澁谷かのん：デッキの上5枚に出せるメンバーなし'); return; }
      const empty = me.stage.findIndex(s => !s);
      if (empty >= 0) { g.log(me, 'eff', `澁谷かのん：${pick.def.name}を空いているエリアに登場させる`); g.putMember(me, pick, empty, { from: 'effect' }); }
      else { me.hand.push(pick); g.log(me, 'eff', `澁谷かのん：${pick.def.name}を手札に加えた`); }
    },
  },
  // 嵐 千砂都（17）
  'PL!SP-bp5-003': {
    note: '常時：手札のコスト10のLiella!メンバーのコスト-2。ライブ開始時（センター）：Liella!メンバーとエネルギーをすべてアクティブ',
    order: { liveStart: 0 },
    costMod({ card }) { return isMember(card) && card.def.cost === 10 && inGroup(card.def, 'Liella!') ? -2 : 0; },
    liveStart({ g, me, area }) {
      if (area !== 1) return;
      for (const s of me.stage) if (s && inGroup(s.card.def, 'Liella!')) s.active = true;
      me.energy.active = me.energy.n;
      g.log(me, 'eff', '嵐 千砂都：メンバーとエネルギーをすべてアクティブにした');
    },
  },
  // 若菜四季（17）：エールのブレードハートなしLiella!メンバー2枚につき合計スコア+1（最大+2）
  'PL!SP-pb2-008': {
    note: 'ライブ成功時：エールのブレードハートを持たないLiella!メンバー2枚につき合計スコア+1（最大+2）',
    liveSuccess({ g, me }) {
      if (!me.perf) return;
      const n = me.cheer.filter(c => isMember(c) && !hasBladeHeart(c.def) && inGroup(c.def, 'Liella!')).length;
      const add = Math.min(2, Math.floor(n / 2));
      if (add) { me.perf.totalBonus += add; g.log(me, 'eff', `若菜四季：合計スコア+${add}`); }
    },
  },
  // 澁谷かのん（4）：ステージがLiella!だけでエネルギー7枚以上ならエネルギーを1枚
  'PL!SP-bp4-001': {
    note: '登場：ステージがLiella!だけで、エネルギー7枚以上ならエネルギーを1枚ウェイトで置く',
    onEnter({ g, me }) { if (allInGroup(me, 'Liella!') && me.energy.n >= 7) g.addEnergyByEffect(me, { label: '澁谷かのん：' }); },
  },
  // 嵐 千砂都（10）bp1-003：手札のメンバーを公開してコスト合計が10の倍数（50まで）なら合計スコア+1
  'PL!SP-bp1-003': {
    note: '起動（ターン1回）：手札のメンバーを公開し、コストの合計が10・20・30・40・50なら、ライブ終了時まで合計スコア+1',
    activated: [{
      once: 1,
      ai: ({ me, slot }) => !slot.mods.some(m => m.score) && canSum10(me),
      run({ g, me, slot }) {
        if (!canSum10(me)) return false;
        slot.mods.push({ score: 1, untilLiveEnd: true });
        g.log(me, 'eff', '嵐 千砂都：手札のメンバーのコスト合計が10の倍数 → 合計スコア+1');
      },
    }],
  },
  // 澁谷かのん（10）bp7-001：バトンタッチで控え室に置かれたら、新しいメンバーの下へ。下にいる間そのメンバーにブレード+1
  'PL!SP-bp7-001': {
    note: 'バトンタッチで控え室に置かれたとき、登場したメンバーの下に置く。Liella!メンバーの下にいる間、そのメンバーはブレード+1',
    underOnBaton: true,
    underBlades({ slot }) { return inGroup(slot.card.def, 'Liella!') ? 1 : 0; },
  },
  // 嵐 千砂都（10）bp7-003：下のメンバー1枚につきブレード+1、3枚以上で合計スコア+1。起動：手札のコスト10か20を下に置いて2枚引く
  'PL!SP-bp7-003': {
    note: '常時：下のメンバー1枚につきブレード+1、3枚以上で合計スコア+1。起動（ターン1回）：手札のコスト10か20のメンバーを下に置き、2枚引く',
    blades({ slot }) { return slot.under.filter(u => u.def.kind === 'M').length; },
    scoreBonus({ slot }) { return slot.under.filter(u => u.def.kind === 'M').length >= 3 ? 1 : 0; },
    activated: [{
      once: 1,
      ai: ({ me }) => me.hand.some(stackable),
      run({ g, me, slot }) {
        // 下に置くカード：下にいるとブレードを与える澁谷かのん（bp7-001）を優先し、決め手のコスト20は手札に2枚以上あるときだけ
        const rank = c => cardWorth(g, me, c) + (c.def.id === 'PL!SP-bp7-001' ? -3 : 0) + (c.def.cost === 20 && me.hand.filter(x => x.def.id === c.def.id).length < 2 ? 5 : 0);
        const c = me.hand.filter(stackable).sort((a, b) => rank(a) - rank(b))[0];
        if (!c) return false;
        me.hand.splice(me.hand.indexOf(c), 1);
        slot.under.push(c);
        g.draw(me, 2);
        g.log(me, 'eff', `嵐 千砂都：${c.def.name}を下に置いて2枚引いた（下${slot.under.length}枚）`);
      },
    }],
  },
  // 鬼塚夏美（13）
  'PL!SP-bp2-009': {
    note: 'ライブ開始時：手札2枚につきブレード+1。ライブ成功時：2枚引いて1枚捨てる',
    order: { liveStart: 7 },
    liveStart({ me, slot }) { const n = Math.floor(me.hand.length / 2); if (n) slot.mods.push({ blades: n, untilLiveEnd: true }); },
    liveSuccess({ g, me }) { g.draw(me, 2); discardWorst(g, me, 1); },
  },
  // 唐 可可（13）：左サイドで、自分をウェイトにして3枚引き2枚捨てる。ブレードハートなしメンバーを捨てたらアクティブに戻る
  'PL!SP-bp5-002': {
    note: '起動（左サイド・ターン1回）：自分をウェイトにして3枚引き2枚捨てる。捨てた中にブレードハートなしメンバーが1枚以上ならアクティブに、2枚ならブレード+2',
    aiBonus: ({ area }) => (area === 0 ? 1.5 : 0), // 起動能力は左サイドでしか使えない
    activated: [{
      once: 1,
      can: ({ area, slot }) => area === 0 && slot.active,
      ai: ({ area, slot }) => area === 0 && slot.active,
      run({ g, me, slot }) {
        slot.active = false;
        g.draw(me, 3);
        // ブレードハートを持たないメンバーを優先して捨てる（アクティブに戻すため）
        const keep = new Set([...(me.reserved || [])]);
        const cand = me.hand.filter(c => !keep.has(c.uid))
          .sort((a, b) => (cardWorth(g, me, a) - (isMember(a) && !hasBladeHeart(a.def) ? 1.5 : 0)) - (cardWorth(g, me, b) - (isMember(b) && !hasBladeHeart(b.def) ? 1.5 : 0)));
        const out = cand.slice(0, 2);
        for (const c of out) { me.hand.splice(me.hand.indexOf(c), 1); me.waiting.push(c); }
        const n = out.filter(c => isMember(c) && !hasBladeHeart(c.def)).length;
        if (n >= 1) slot.active = true;
        if (n >= 2) slot.mods.push({ blades: 2, untilLiveEnd: true });
        g.log(me, 'eff', `唐 可可：3枚引いて${out.map(c => c.def.name).join('、')}を捨てた${n >= 1 ? '（アクティブに戻った' + (n >= 2 ? '・ブレード+2' : '') + '）' : ''}`);
      },
    }],
  },
  // 渡辺 曜&鬼塚夏美&大沢瑠璃乃（20）
  'LL-bp2-001': {
    note: '常時：手札のこのカードのコストはほかの手札1枚につき-1。バトンタッチで控え室に置けない（ライブ開始時の手札を捨ててブレードを得る効果は使わない）',
    handCost({ me, card, base }) { return base - me.hand.filter(c => c !== card).length; },
    noBatonOut: true,
  },
  // 葉月 恋（20）：バトンタッチで控え室に置かれたLiella!メンバーを下に置き、その起動能力を得る
  'PL!SP-pb2-005': {
    note: '登場：バトンタッチした場合、控え室に置かれたLiella!メンバーをこのメンバーの下に置く。常時：下のLiella!メンバーの起動能力をすべて得る',
    onEnter({ g, me, slot, baton, batonFrom }) {
      if (!baton || !batonFrom) return;
      const c = batonFrom.card;
      const i = me.waiting.indexOf(c);
      if (i < 0 || !inGroup(c.def, 'Liella!') || !isMember(c)) return;
      me.waiting.splice(i, 1);
      slot.under.push(c);
      g.log(me, 'eff', `葉月 恋：${c.def.name}を下に置いた`);
    },
    inheritUnder: def => inGroup(def, 'Liella!'),
  },

  // ================= Burn!!（混成）で使うLiella!のカード =================
  // ウィーン・マルガレーテ（2）bp7-010
  'PL!SP-bp7-010': {
    note: '起動：自分を控え室に置く→エネルギー1枚をエネルギーデッキに戻し、控え室のカードを1枚手札に',
    activated: [{
      ai: ({ me }) => !me.hand.some(isLive) && me.waiting.some(isLive) && me.energy.n >= 4,
      run({ g, me, slot, area }) {
        me.stage[area] = null; me.waiting.push(slot.card);
        if (me.energy.n > 0) {
          if (me.energy.active >= me.energy.n) me.energy.active--;
          me.energy.n--; me.energyDeck++;
        }
        recover(g, me, () => true, 'ウィーン・マルガレーテ：');
      },
    }],
  },
  // 嵐 千砂都（11）pb2-014：フォーメーションチェンジ（位置で変わる効果を持つメンバーがいないので何もしない）
  'PL!SP-pb2-014': {
    note: '登場：ステージが5yncri5e!だけならフォーメーションチェンジしてよい（位置の影響が出ないため何もしない）',
    onEnter() {},
  },
  // 嵐 千砂都（15）sd1-003：手札2枚でブレード+5
  'PL!SP-sd1-003': {
    note: 'ライブ開始時：手札を2枚捨ててよい→ライブ終了時までブレード+5',
    order: { liveStart: 6 },
    liveStart({ g, me, slot }) {
      if (me.hand.length < 3 || !willDiscard(g, me, 2)) return;
      discardWorst(g, me, 2);
      slot.mods.push({ blades: 5, untilLiveEnd: true });
    },
  },
};

function applyDistortion6(me, live) {
  const k = catchuNames(me);
  live.need[0] = Math.max(0, live.need[0] - 2 * k);
  live.need[2] += k;
  if (live.need[2] >= 9) live.bonus += 1;
}

// ステージのLiella!メンバーが持つハートの合計
function liellaHearts(g, me) {
  let n = 0;
  me.stage.forEach((s, area) => {
    if (!s || !inGroup(s.card.def, 'Liella!')) return;
    const { h, all } = g.heartsOf(me, s, area);
    n += h.reduce((a, b) => a + b, 0) + all;
  });
  return n;
}

function hajimari(me, live) {
  if (me.success.length >= 2) {
    live.bonus += 5;
    live.need = [3, 0, 3, 3, 0, 0, 3];
  }
}

// エールにブレードハートを持つカードが無いとき、ライブ終了時までハート+1（ターン1回）
function noBladeHeartHeart(idx, name, color) {
  return {
    note: `自動（ターン1回）：エールにブレードハートを持つカードが無いとき、ライブ終了時まで${color}ハート+1`,
    cheer({ g, me, slot }) {
      if (me.cheer.some(c => hasBladeHeart(c.def))) return;
      if (!g.useOnce(slot, 'noBH')) return;
      const c = [0, 0, 0, 0, 0, 0]; c[idx] = 1;
      slot.mods.push({ hearts: { c }, untilLiveEnd: true });
      g.log(me, 'eff', `${name}：エールにブレードハートなし → ${color}ハート+1`);
    },
  };
}

// 手札のコスト10か20のメンバー（嵐 千砂都 bp7-003 の下に置ける）
function stackable(c) { return isMember(c) && (c.def.cost === 10 || c.def.cost === 20); }

// 手札のメンバーのコストの組み合わせで、合計を10・20・30・40・50にできるか
function canSum10(me) {
  const costs = me.hand.filter(isMember).map(c => c.def.cost);
  let sums = new Set([0]);
  for (const x of costs) { const next = new Set(sums); for (const v of sums) if (v + x <= 50) next.add(v + x); sums = next; }
  return [10, 20, 30, 40, 50].some(v => sums.has(v));
}

// 鬼塚夏美 pb2-009 の判断：自分のどのメンバーをウェイトにして、相手の誰を止めるか
function natsumiWait(g, me, opp, noLive) {
  let best = null;
  me.stage.forEach((s, a) => {
    if (!s || !s.active || !inGroup(s.card.def, 'Liella!')) return;
    const myLoss = noLive ? 0 : g.bladesOf(me, s, a);
    opp.stage.forEach((t, b) => {
      if (!t || !t.active || t.card.def.blades > s.card.def.blades - 2) return;
      const gain = g.bladesOf(opp, t, b) - myLoss;
      if (gain > 0 && (!best || gain > best.gain)) best = { s, t, gain };
    });
  });
  if (!best) return;
  best.s.active = false;
  best.t.active = false;
  g.log(me, 'eff', `鬼塚夏美：${best.s.card.def.name}をウェイトにして、相手の${best.t.card.def.name}をウェイトにした`);
}


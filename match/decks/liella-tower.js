// タワーLiella!：ファンミ第三幕 Day2 Aブロック Top4（加点軸タワー）
// レシピは出典の入賞レシピ（デッキコード）そのまま。回し方は plan に書いたnoteの内容を目安にしている。
const LBO = 'PL!SP-bp5-026';    // Let's be ONE
const GO = 'PL!SP-bp2-023';     // Go!! リスタート
const SV = 'PL!SP-bp5-023';     // Shooting Voice!!
const HAJI = 'PL!SP-sd2-023';   // 始まりは君の空（序盤は1点ライブとして使う）
const CHISATO10 = 'PL!SP-bp7-003'; // 嵐 千砂都（コスト10・下にメンバーを積む）
const KEKE13 = 'PL!SP-bp5-002';    // 唐 可可（コスト13・左サイドで起動）
const RAMP4 = ['PL!SP-PR-006', 'PL!SP-PR-013', 'PL!SP-sd1-014']; // 4コスのランプ（手札1枚を払ってエネルギーを置く）
const KANON4 = 'PL!SP-bp4-001';    // 澁谷かのん（コスト4・エネルギー7枚以上ならランプ）
const KANON2 = 'PL!SP-pb2-012';  // 澁谷かのん（2）：起動で自分を控え室へ → ライブ回収
const NATSUMI2 = 'PL!SP-pb2-031'; // 鬼塚夏美（2）：起動で自分を控え室へ → メンバー回収
const UNDER = ['PL!SP-pb2-005', 'PL!SP-bp7-001', 'PL!SP-bp1-003', CHISATO10]; // 10千砂都の下に敷く（20恋 → 10かのん → 10千砂都）
const THIRTEENS = [KEKE13, 'PL!SP-bp2-009']; // 13（唐可可・鬼塚夏美）

// 4T以降：余ったエネルギーで2コストを出しては起動で控え室に置き、ライブを回収する（noteの5T「6エネルギー余る。3回収まで可能」）
//  センターの2かのん → ライブ回収。2かのんが手札に無ければ、2夏美で控え室の2かのんを拾う。最後に空いたセンターは2〜4コストで埋める
function recoverLoop(api) {
  const { g, me } = api;
  if (g.turn < 4) return;
  const want = g.turn === 4 ? 2 : 3; // 4T：Shooting Voice!!＋Let's be ONE、5T以降：3枚
  const lives = () => me.hand.filter(c => c.def.kind === 'L').length;
  const center = 1;
  for (let guard = 0; guard < 6 && lives() < want && me.waiting.some(c => c.def.kind === 'L'); guard++) {
    const s = me.stage[center];
    // センターを空けたら埋め直せる（エネルギー2以上）ときだけ起動する（空いたセンターはハートとブレードが減る）
    if (s && me.energy.active < 2) break;
    if (s && s.card.def.id === KANON2) { if (!api.activate(center, 0)) break; g.log(me, 'plan', '手順：2かのんでライブを回収した'); continue; }
    if (s && s.card.def.id === NATSUMI2 && me.waiting.some(c => c.def.id === KANON2) && !me.hand.some(c => c.def.id === KANON2)) {
      // 2夏美の回収先を2かのんにする（起動の間だけ、拾いたいメンバーを2かのんにしておく）
      const pf = me.prefer;
      me.prefer = { ...(pf || {}), wantMembers: [[KANON2]] };
      const ok = api.activate(center, 0);
      me.prefer = pf;
      if (!ok) break;
      g.log(me, 'plan', '手順：2夏美で2かのんを拾った'); continue;
    }
    const k2 = me.hand.findIndex(c => c.def.id === KANON2);
    const pick = k2 >= 0 ? k2 : me.waiting.some(c => c.def.id === KANON2) ? me.hand.findIndex(c => c.def.id === NATSUMI2) : -1;
    if (pick < 0) break;
    if (s && (s.card.def.cost > 2 || !g.canTarget(me, center))) break;
    if (g.playCost(me, me.hand[pick], center, !!s) > me.energy.active) break;
    if (!api.play(pick, center, !!s)) break;
  }
  if (!me.stage[center]) {
    const i = me.hand.findIndex(c => c.def.kind === 'M' && c.def.cost <= 4 && c.def.cost <= me.energy.active);
    if (i >= 0) api.play(i, center, false);
  }
}

export default {
  id: "liella-tower",
  type: "タワーLiella!",
  name: "ファンミ第三幕 Day2 Aブロック Top4（加点軸タワー）",
  code: "13ZY5S",
  lastPlaced: "2026/11/08",
  source: "https://llofficial-cardgame.com/deckrecipe/fanmeeting202611_2a/",
  list: [
    ["PL!SP-bp2-023", 2], // Go!! リスタート（ライブ）
    ["PL!SP-bp5-023", 3], // Shooting Voice!!（ライブ）
    ["PL!SP-bp5-026", 3], // Let's be ONE（ライブ）
    ["PL!SP-sd2-023", 4], // 始まりは君の空（ライブ）
    ["PL!SP-pb2-012", 4], // 澁谷かのん（コスト2）
    ["PL!SP-pb2-031", 4], // 鬼塚夏美（コスト2）
    ["PL!SP-bp4-001", 4], // 澁谷かのん（コスト4）
    ["PL!SP-PR-006", 3], // 平安名すみれ（コスト4）
    ["PL!SP-PR-013", 3], // 鬼塚冬毬（コスト4）
    ["PL!SP-sd1-014", 2], // 嵐 千砂都（コスト4）
    ["PL!SP-bp1-003", 4], // 嵐 千砂都（コスト10）
    ["PL!SP-bp7-001", 4], // 澁谷かのん（コスト10）
    ["PL!SP-bp7-003", 4], // 嵐 千砂都（コスト10）
    ["PL!SP-bp2-009", 4], // 鬼塚夏美（コスト13）
    ["PL!SP-bp5-002", 4], // 唐 可可（コスト13）
    ["PL!SP-bp5-003", 1], // 嵐 千砂都（コスト17）
    ["PL!SP-pb2-008", 3], // 若菜四季（コスト17）
    ["LL-bp2-001", 1], // 渡辺 曜&鬼塚夏美&大沢瑠璃乃（コスト20）
    ["PL!SP-pb2-005", 3], // 葉月 恋（コスト20）
  ],
  plan: {
    board: "0-0-4 → 0-0-10 → 4-2-10 → 13-2-10 → 17-2-10 → 17-20-10（位置に意味あり。10千砂都の下にメンバーを積む）",
    score: "0 → 1〜2（相手先制なら3）→ 2〜 → 11〜（千秋楽以外9〜）→ 15〜17 → 20〜21",
    mulligan: "10嵐千砂都 ＞ 4ランプ ＞ 10澁谷かのん ＞ 1点ライブ。千砂都が無ければ10かのんをキープ",
    lives: "2T：1点ライブ（Let's be ONE／Go!! リスタート）／3T：手札の1点ライブ／4T：Shooting Voice!!＋Let's be ONE（千秋楽で12点）／5T：Shooting Voice!!＋Let's be ONE×2（17点）／6T：Shooting Voice!!×2＋Let's be ONE（21点）",
    key: "10嵐千砂都bp7-003（下のメンバー1枚ごとにブレード、3枚以上で+1）、13唐可可（ドロー）、17若菜四季、20三神",
    refs: ["https://note.com/fine_eel3362/n/n5693665d2e4f", "https://note.com/poke_lovelive/n/nbfe1b972d27f"],
  },
  // プレイ方針の上書き（まだ標準の方針のまま）
  // プレイ方針
  // ・マリガン：10コストまで、コスト2は1枚、1点ライブ（必要ハート5以下）を1枚だけ残す
  // ・盤面：嵐 千砂都（bp7-003）の下に積んだカードを失う入れ替えは避ける。唐 可可は左サイドへ
  // ・ライブ：成功2枚までは1点ライブで進め、千秋楽で大きく取りに行く
  // ・空いた枠にはコスト4以下のメンバーを伏せて引き直す（大型は残す）
  strategy: {
    // マリガン：10嵐千砂都 ＞ 4ランプ ＞ 10澁谷かのん（千砂都が無いとき）＞ 1点ライブ
    //  4かのん（bp4-001）はエネルギー7枚以上でしかランプしないので、1Tのランプとしては残さない（2Tに10千砂都へバトンタッチするエネルギー6に届かない）
    mulliganOpt: { keep: [{ ids: [CHISATO10], group: 'ten', n: 1 }, { ids: ['PL!SP-bp7-001'], group: 'ten' }, { ids: RAMP4, n: 1 }, { ids: [LBO, GO], n: 1 }] },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    main: (api, def) => { const r = def(api, { pace: [1, 1, 10], playPen: 0.3, topK: 60, setupWeight: 1 }); recoverLoop(api); return r; },
    // 1T・3Tのランプは手札を払ってでも必ず行う（4Tに9エネで 4→13）
    // 4Tはセンターの2コストを起動で控え室に置かない（エネルギーが残らず埋め直せない。ハートとブレードが減ってShooting Voice!!＋Let's be ONEが置けなくなる）
    // 10千砂都の下に敷く10・20コストは、次のターンに敷く分（1枚）を手札に残す（noteの「次のターンに敷くメンバーは、手放さずにキープ」）
    prefer: { rampTurns: [1, 3], noRecoverTurns: [4], hold: [{ from: 1, to: 5, ids: UNDER }] },
    // 手順（noteの回し方より）。出せないときはいつものAIの判断に戻る
    script: {
      // 1T：右サイドにランプの4（4かのんは1Tではランプできない）
      1: [{ oneOf: [{ play: { ids: RAMP4 }, area: 2 }, { play: { cost: 4 }, area: 2 }] }],
      2: [{ play: { id: CHISATO10 }, area: 2 }],
      // 3T：左サイドに4（7エネなら4かのんでランプ、ほかはランプの4）、センターに2
      3: [{ oneOf: [{ play: { id: KANON4 }, area: 0 }, { play: { ids: RAMP4 }, area: 0 }, { play: { cost: 4 }, area: 0 }] }, { play: { cost: 2 }, area: 1 }],
      4: [{ oneOf: [{ play: { id: KEKE13 }, area: 0 }, { play: { ids: THIRTEENS }, area: 0 }] }],
      5: [{ play: { cost: 17 }, area: 0 }],
      6: [{ play: { cost: 20 }, area: 1 }],
    },
    // 10千砂都（下にメンバーを積む）は右サイドから動かさない
    lock: [{ id: CHISATO10, area: 2, fromTurn: 2 }],
    // ターンごとの目標（noteの回し方より。10千砂都は右サイドに置いて下にメンバーを積む、13可可は左サイド）
    turnPlan: {
      1: { board: [[{ cost: 4, area: 2 }]] },
      2: { board: [[{ id: CHISATO10, area: 2 }], [{ cost: 10, area: 2 }]], lives: [[LBO], [GO]] },
      3: { board: [[4, 2, { id: CHISATO10, area: 2 }]], lives: [[LBO], [GO]] },
      4: { board: [[{ id: KEKE13, area: 0 }, 2, { id: CHISATO10, area: 2 }]], lives: [[SV, LBO], [SV]] },
      5: { board: [[17, 2, { id: CHISATO10, area: 2 }]], lives: [[SV, LBO, LBO], [SV, LBO], [SV]] },
      6: { board: [[17, 20, { id: CHISATO10, area: 2 }]], lives: [[SV, SV, LBO], [SV, LBO, LBO], [SV, LBO], [SV]] },
    },
    liveOpt: {
      fill: true, fillMaxCost: 4, pace: [1, 1, 10], minP: 0.4, th1: 0.3, thLast: 0.3,
      // 手札交換：1Tは10嵐千砂都（2Tに出す）、2・3Tは13（4Tに出す）を探す
      digFor: [
        { ids: [CHISATO10], turns: [1], n: 3, keep: [...RAMP4, KANON4, ...THIRTEENS, ...UNDER], label: '10嵐千砂都', skipIfStage: true },
        { ids: THIRTEENS, turns: [2, 3], n: 3, keep: [KANON4, ...RAMP4, SV, LBO, ...UNDER], label: '13' },
        // 2〜4T：次のターンに10千砂都の下へ敷く10・20コストが手札に無ければ探す
        { ids: UNDER, turns: [2, 3, 4], n: 2, keep: [KANON4, ...RAMP4, ...THIRTEENS, SV, LBO, KANON2, NATSUMI2], label: '10千砂都の下に敷く10・20コスト' },
      ],
    },
  },
};

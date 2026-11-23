// 金太郎飴Liella!（デッキコード SJBQ8）
// 構築の考え方：観葉植物さん「【金太郎飴Liella!】の構築思想」 https://hasami-kourin.jugem.jp/?eid=67
// 回し方は花帆の案（似た構成の 5yncri5e!アグロ：うぃっちさん「環境デッキ評価」の 2-2→2-2-5→2-2-11→2-5-15 を参考）
const KOTORI2 = 'PL!-bp3-012';     // 南 ことり（コスト2）
const ERI2 = 'PL!-bp5-011';        // 絢瀬絵里（コスト2）
const REN2 = 'PL!SP-bp1-005';      // 葉月 恋（コスト2）
const SUMIRE5 = 'PL!SP-pb2-037';   // 平安名すみれ（コスト5・左サイド）
const CHISATO5 = 'PL!SP-pb2-036';  // 嵐 千砂都（コスト5・右サイド）
const KINAKO11 = 'PL!SP-bp1-017';  // 桜小路きな子（コスト11）
const KANON11 = 'PL!SP-pb1-001';   // 澁谷かのん（コスト11）
const MAR11 = 'PL!SP-pb2-010';     // ウィーン・マルガレーテ（コスト11）
const CHISATO15 = 'PL!SP-sd1-003'; // 嵐 千砂都（コスト15）
const START = 'PL!SP-bp7-023';     // START!! True dreams
const WELCOME = 'PL!SP-pb2-047';   // Welcome to 僕らのセカイ
const HAJI = 'PL!SP-sd2-023';      // 始まりは君の空
const AIKO = 'PL!SP-sd2-024';      // アイコトバ！

const ONE = [[START], [WELCOME]]; // 1T・2Tは始まりは君の空を使わない（3Tの6点のために取っておく）
const LATE = [[HAJI, HAJI], [HAJI, AIKO], [HAJI, START], [HAJI], [AIKO, AIKO], [AIKO, START]];

export default {
  id: "liella-kintaro",
  type: "金太郎飴Liella!",
  name: "金太郎飴Liella!",
  code: "SJBQ8",
  lastPlaced: "－",
  source: "https://decklog.bushiroad.com/view/SJBQ8",
  list: [
    ["PL!SP-bp7-023", 4], // START!! True dreams（ライブ）
    ["PL!SP-pb2-047", 1], // Welcome to 僕らのセカイ（ライブ）
    ["PL!SP-sd2-023", 4], // 始まりは君の空（ライブ）
    ["PL!SP-sd2-024", 3], // アイコトバ！（ライブ）
    ["PL!-bp3-012", 4], // 南 ことり（コスト2）
    ["PL!-bp5-011", 4], // 絢瀬絵里（コスト2）
    ["PL!SP-bp1-005", 4], // 葉月 恋（コスト2）
    ["PL!SP-bp1-011", 2], // 鬼塚冬毬（コスト2）
    ["PL!SP-bp7-010", 4], // ウィーン・マルガレーテ（コスト2）
    ["PL!SP-pb1-014", 4], // 嵐 千砂都（コスト2）
    ["PL!SP-sd1-020", 1], // 鬼塚夏美（コスト2）
    ["PL!SP-sd2-010", 2], // ウィーン・マルガレーテ（コスト2）
    ["PL!SP-sd2-017", 3], // 桜小路きな子（コスト2）
    ["PL!SP-pb2-036", 2], // 嵐 千砂都（コスト5）
    ["PL!SP-pb2-037", 4], // 平安名すみれ（コスト5）
    ["PL!SP-bp1-017", 4], // 桜小路きな子（コスト11）
    ["PL!SP-pb1-001", 3], // 澁谷かのん（コスト11）
    ["PL!SP-pb2-010", 4], // ウィーン・マルガレーテ（コスト11）
    ["PL!SP-sd1-003", 3], // 嵐 千砂都（コスト15）
  ],
  plan: {
    board: "2-2 → 2-2-5（5すみれは左・5千砂都は右で2枚引いて2枚捨てる）→ 2-2-11（5から11へバトンタッチ）→ 2-5-15 / 2-11-15",
    score: "1 → 1〜3 → 6（始まりは君の空）→ 9〜12",
    mulligan: "1点ライブ（START!!・始まりは君の空）1〜2枚、2コス2枚、5コス1枚",
    lives: "1T：START!! か始まりは君の空（1点）／2T：1点ライブ、手札がよければアイコトバ！（3点）／3T：成功ライブが2枚あれば始まりは君の空（6点）／4T以降：始まりは君の空×2、始まりは君の空＋アイコトバ！",
    key: "始まりは君の空（成功ライブ2枚で6点）、2南ことり・2絢瀬絵里（成功ライブ1枚につきハート+1）、11澁谷かのん（赤4）",
    refs: ["https://hasami-kourin.jugem.jp/?eid=67", "https://note.com/witch0528/n/nc67a25b20780"],
  },
  strategy: {
    prefer: { wantLives: [HAJI, START, AIKO] },
    mulliganOpt: {
      keep: [
        { ids: [SUMIRE5, CHISATO5], n: 1 },
        { ids: [START, HAJI], n: 2 },
        { ids: [REN2, KOTORI2, ERI2], n: 2 },
      ],
    },
    mainOpt: { playPen: 0.3, topK: 60 },
    turnPlan: {
      1: { board: [[2, 2]], lives: ONE },
      2: { board: [[{ id: SUMIRE5, area: 0 }, 2, 2], [2, 2, { id: CHISATO5, area: 2 }], [5, 2, 2]], lives: [...ONE, [AIKO], [START, START]] },
      3: { board: [[11, 2, 2]], lives: [[HAJI], [AIKO], ...ONE] },
      4: { board: [[15, 5, 2], [15, 11, 2], [11, 11, 2]], lives: LATE },
      5: { board: [[15, 11, 2], [15, 15, 2]], lives: LATE },
      6: { board: [[15, 11, 2], [15, 15, 2]], lives: LATE },
    },
    script: {
      // 2T：5すみれは左、5千砂都は右（登場時の2枚引いて2枚捨てるは、その位置でだけ動く）
      2: [{ oneOf: [{ play: { id: SUMIRE5 }, area: 0 }, { play: { id: CHISATO5 }, area: 2 }] }],
      // 3T：5から11へバトンタッチ（赤4の11かのんを優先）
      3: [{ oneOf: [{ play: { id: KANON11 }, onto: { cost: 5 } }, { play: { id: MAR11 }, onto: { cost: 5 } }, { play: { id: KINAKO11 }, onto: { cost: 5 } }] }],
      // 4T：11から15千砂都へ
      4: [{ oneOf: [{ play: { id: CHISATO15 }, onto: { cost: 11 } }] }],
    },
    liveOpt: { fill: true, pace: [1, 2, 6], minP: 0.45, th1: 0.3, thLast: 0.15 },
  },
};

// トマカノーテ（DUO環境）：トマカノーテ（252KM）のバリエーション・デッキコード H4BWC
// 新しいカード（4四季・4可可・4メイ・9可可・9メイ・4かのん）に入れ替えたもの。回し方は依頼者に教えてもらったもの。
const SHIKI4 = 'PL!SP-bp5-008';   // 若菜四季（コスト4）
const KEKE4 = 'PL!SP-bp5-013';    // 唐 可可（コスト4）
const MEI4 = 'PL!SP-bp7-018';     // 米女メイ（コスト4）
const KANON4 = 'PL!SP-bp4-001';   // 澁谷かのん（コスト4）
const REN4 = 'PL!SP-bp2-005';     // 葉月 恋（コスト4）
const KEKE9 = 'PL!SP-pb2-035';    // 唐 可可（コスト9）
const MEI9 = 'PL!SP-pb2-029';     // 米女メイ（コスト9）
const MEI5 = 'PL!SP-bp2-007';     // 米女メイ（コスト5）
const KANON13 = 'PL!SP-bp2-001';  // 澁谷かのん（コスト13）
const MAR15 = 'PL!SP-bp2-010';    // ウィーン・マルガレーテ（コスト15）
const HAL = 'PL!SP-bp1-026';      // 未来予報ハレルヤ！
const VIT = 'PL!SP-bp2-024';      // ビタミンSUMMER!
const BUB = 'PL!SP-bp2-025';      // Bubble Rise

const LATE_LIVES = [[VIT, BUB, HAL], [VIT, VIT, BUB], [VIT, VIT], [VIT, BUB], [VIT, BUB, BUB]];
const MID = [{ id: MAR15 }, { id: KANON13 }];

export default {
  id: "liella-tomakanote-duo",
  type: "トマカノーテ",
  name: "トマカノーテ（DUO環境）",
  code: "H4BWC",
  lastPlaced: "－",
  source: "https://decklog.bushiroad.com/view/H4BWC",
  list: [
    ["PL!SP-bp1-026", 4], // 未来予報ハレルヤ！（ライブ）
    ["PL!SP-bp2-024", 4], // ビタミンSUMMER!（ライブ）
    ["PL!SP-bp2-025", 4], // Bubble Rise（ライブ）
    ["PL!SP-bp1-005", 4], // 葉月 恋（コスト2）
    ["PL!SP-bp1-011", 4], // 鬼塚冬毬（コスト2）
    ["PL!SP-pb1-021", 4], // ウィーン・マルガレーテ（コスト2）
    ["PL!SP-bp2-005", 2], // 葉月 恋（コスト4）
    ["PL!SP-bp4-001", 4], // 澁谷かのん（コスト4）
    ["PL!SP-bp5-008", 4], // 若菜四季（コスト4）
    ["PL!SP-bp5-013", 4], // 唐 可可（コスト4）
    ["PL!SP-bp7-018", 4], // 米女メイ（コスト4）
    ["PL!SP-bp2-007", 2], // 米女メイ（コスト5）
    ["PL!SP-pb2-029", 4], // 米女メイ（コスト9）
    ["PL!SP-pb2-035", 4], // 唐 可可（コスト9）
    ["PL!SP-bp2-001", 4], // 澁谷かのん（コスト13）
    ["PL!SP-bp2-010", 4], // ウィーン・マルガレーテ（コスト15）
  ],
  plan: {
    board: "左に4（四季・可可・メイで控え室を増やす）→ 左に9可可（9メイ）→ 15マルガレーテ → 15-4かのん（エネルギー+1）／15-5メイ → 15-13かのん → 13かのんから13かのん",
    score: "0 → 3（未来予報ハレルヤ！）→ 5〜6（ビタミンSUMMER!）→ 4（Bubble Rise、またはしゃがむ）→ 10（ビタミンSUMMER!＋Bubble Rise）→ 12〜13",
    mulligan: "9コス ＞ 4コス ＞ 未来予報ハレルヤ！ ＞ 15マルガレーテ ＞ 5コス の順に確保。できるだけ名前の異なるメンバーにする",
    lives: "トマカノーテ（252KM）と同じ",
    key: "9唐 可可（左サイドでブレード+2）、4若菜四季・4唐 可可・4米女メイ（1Tに控え室を増やす）、4澁谷かのん（4Tにエネルギー+1で5Tの13かのん）",
    refs: [],
  },
  strategy: {
    prefer: {
      fillDistinct: 'Liella!', protFill: false, protTurns: 0,
      // 1T：4コスの登場時効果を必ず使い、デッキの上のカードを控え室に送る（未来予報ハレルヤ！の条件）
      millTurns: [1],
      hold: [
        { from: 2, to: 3, ids: [MAR15] },
        { from: 3, to: 4, ids: [KANON4, MEI5] },
        { from: 4, to: 6, ids: [KANON13] },
      ],
      wantLives: [VIT, BUB, HAL],
    },
    mulliganOpt: {
      keep: [
        { ids: [KEKE9, MEI9], n: 1 },
        { ids: [SHIKI4, KEKE4, MEI4, KANON4, REN4], n: 1 },
        { ids: [HAL], n: 1 },
        { ids: [MAR15], n: 1 },
        { ids: [MEI5], n: 1 },
      ],
    },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    turnPlan: {
      1: { board: [[{ cost: 4, area: 0 }]] },
      2: { board: [[{ id: KEKE9, area: 0 }], [{ id: MEI9 }], [9]], lives: [[HAL]] },
      3: { board: [[{ id: MAR15 }]], lives: [[VIT]] },
      4: { board: [[{ id: MAR15 }, { id: KANON4 }], [{ id: MAR15 }, { id: MEI5 }]], lives: [[BUB]] },
      5: { board: [MID], lives: [[VIT, BUB]] },
      6: { board: [[...MID, 4], [...MID, 5]], lives: LATE_LIVES },
      7: { board: [[...MID, 4], [...MID, 5]], lives: LATE_LIVES },
    },
    lock: [{ id: MAR15, fromTurn: 4 }],
    script: {
      // 1T：4コス（四季・可可・メイを優先）を左サイドに
      1: [{ oneOf: [{ play: { id: SHIKI4 }, area: 0 }, { play: { id: KEKE4 }, area: 0 }, { play: { id: MEI4 }, area: 0 }, { play: { cost: 4 }, area: 0 }] }],
      // 2T：左の4コスから9可可（左サイドでブレード+2）、次点で9メイ
      2: [{ oneOf: [{ play: { id: KEKE9 }, onto: { cost: 4 }, area: 0 }, { play: { id: KEKE9 }, onto: { cost: 4 } }, { play: { id: MEI9 }, onto: { cost: 4 } }, { play: { cost: 9 }, onto: { cost: 4 } }] }],
      3: [{ play: { id: MAR15 }, onto: { cost: 9 } }],
      // 4T：4かのん（エネルギー+1）、次点で5メイ
      4: [{ ifStage: { id: MAR15 }, oneOf: [{ play: { id: KANON4 } }, { play: { id: MEI5 } }] }],
      // 5T：4かのんから13かのん（9エネルギー）、5メイから13かのん（8エネルギー）
      5: [{ oneOf: [{ play: { id: KANON13 }, onto: { id: KANON4 } }, { play: { id: KANON13 }, onto: { id: MEI5 } }, { play: { id: KANON13 }, onto: { cost: 5 } }, { play: { id: KANON13 }, onto: { cost: 4 } }] }],
      6: [{ play: { id: KANON13 }, onto: { id: KANON13 } }],
      7: [{ play: { id: KANON13 }, onto: { id: KANON13 } }],
    },
    liveOpt: {
      minScore: { 1: 99, 2: 0 },
      fill: true, fillMaxCost: 9, pace: [3, 6, 10], th1: 1.01, minP: 0.45, planMinP: 0.3,
    },
  },
};

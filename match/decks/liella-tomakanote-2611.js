// トマカノーテ（2026-11改訂版）：トマカノーテ（DUO環境・H4BWC）を依頼者が組み直したもの
// 234PYY をもとに、9コストを8枚（9可可・9メイ）にして、4Tの5コストを千砂都（右サイドで2ドロー2捨て）にしたもの（デッキコードはまだ無い）。
// 未来予報ハレルヤ！を抜いて Butterfly Wing を入れ、2Tに9可可（左サイド）で歌う。回し方は依頼者に教えてもらったもの。
const SHIKI4 = 'PL!SP-bp5-008';   // 若菜四季（コスト4）：コスト9以上のLiella!メンバーをサーチ
const KEKE4W = 'PL!SP-pb2-024';   // 唐 可可（コスト4）：相手のコスト2以下をウェイト
const KEKE4 = 'PL!SP-bp5-013';    // 唐 可可（コスト4）：ブレードハートを持つLiella!メンバーをサーチ
const KANON4 = 'PL!SP-bp4-001';   // 澁谷かのん（コスト4）：エネルギー7枚以上ならエネルギー+1
const CHISATO5 = 'PL!SP-pb2-036'; // 嵐 千砂都（コスト5）：右サイドに登場で2ドロー2捨て
const KEKE9 = 'PL!SP-pb2-035';    // 唐 可可（コスト9）：左サイドでブレード+2
const MEI9 = 'PL!SP-pb2-029';     // 米女メイ（コスト9）：登場／ライブ開始時に相手のコスト2以下をウェイト
const KANON13 = 'PL!SP-bp2-001';  // 澁谷かのん（コスト13）
const MAR15 = 'PL!SP-bp2-010';    // ウィーン・マルガレーテ（コスト15）
const VIT = 'PL!SP-bp2-024';      // ビタミンSUMMER!
const BUB = 'PL!SP-bp2-025';      // Bubble Rise
const BW = 'PL!SP-pb2-046';       // Butterfly Wing

const LATE_LIVES = [[VIT, BUB], [VIT, VIT], [VIT, BUB, BW], [BUB, BUB], [VIT, BW], [BUB, BW]];
const MID = [{ id: MAR15 }, { id: KANON13 }];

export default {
  id: "liella-tomakanote-2611",
  type: "トマカノーテ",
  name: "トマカノーテ（2026-11改訂版）",
  code: "－",
  lastPlaced: "－",
  source: "",
  list: [
    ["PL!SP-bp2-024", 4], // ビタミンSUMMER!（ライブ）
    ["PL!SP-bp2-025", 4], // Bubble Rise（ライブ）
    ["PL!SP-pb2-046", 4], // Butterfly Wing（ライブ）
    ["PL!SP-bp1-005", 4], // 葉月 恋（コスト2）
    ["PL!SP-bp1-011", 4], // 鬼塚冬毬（コスト2・ライブ回収）
    ["PL!SP-pb2-033", 4], // 鬼塚冬毬（コスト2・メンバー回収）
    ["PL!SP-sd1-006", 2], // 桜小路きな子（コスト2・ライブ回収）
    ["PL!SP-bp4-001", 4], // 澁谷かのん（コスト4）
    ["PL!SP-bp5-008", 4], // 若菜四季（コスト4）
    ["PL!SP-bp5-013", 4], // 唐 可可（コスト4）
    ["PL!SP-pb2-024", 4], // 唐 可可（コスト4）
    ["PL!SP-pb2-036", 2], // 嵐 千砂都（コスト5）
    ["PL!SP-pb2-029", 4], // 米女メイ（コスト9）
    ["PL!SP-pb2-035", 4], // 唐 可可（コスト9）
    ["PL!SP-bp2-001", 4], // 澁谷かのん（コスト13）
    ["PL!SP-bp2-010", 4], // ウィーン・マルガレーテ（コスト15）
  ],
  plan: {
    board: "左に4（四季・可可）→ 左に9可可（左サイドでブレード+2、次点で9メイ）→ 左の9に15マルガレーテ → 15-5千砂都（右）／15-4かのん＋2コス（冬毬）→ 千砂都か4かのんに13かのん → 13かのんから13かのん",
    score: "0 → 2〜3（Butterfly Wing）→ 5（ビタミンSUMMER!）→ 7（Butterfly Wing＋Bubble Rise）→ 9（Bubble Rise＋ビタミンSUMMER!）→ 最大打点",
    mulligan: "4コス（四季 ＞ 相手をウェイトにする可可 ＞ サーチの可可 ＞ かのん）＞ 9コス（可可 ＞ メイ）＞ Butterfly Wing ＞ 15マルガレーテ",
    lives: "1T：ライブなし（いらないカードを伏せて手札入替）／2T：Butterfly Wing（9メイなら+1）／3T：15マルガレーテ単騎でビタミンSUMMER!／4T：Butterfly Wing＋Bubble Rise（Butterfly Wingでマルガレーテのエール-8を止める）／5T：Bubble Rise＋ビタミンSUMMER!（13かのんでマルガレーテのライブ開始時を無効）",
    key: "1Tの4コスを左サイドに置く（2Tの9可可が左サイドに入る）。4Tの5コス（13-5=8）か4かのん（エネルギー+1で13-4=9）が5Tの13かのんの土台",
    refs: [],
  },
  strategy: {
    prefer: {
      protFill: false, protTurns: 0,
      // 1T：4コスのサーチ（四季・可可）は必ず使う。四季とメンバー回収の冬毬は、9コス・15マルガレーテ・13かのんを探す
      millTurns: [1],
      wantMembers: [[KEKE9, MEI9], MAR15, KANON13],
      hold: [
        { from: 2, to: 3, ids: [MAR15] },
        // 2T〜4T：千砂都か4かのん（千砂都優先）を1枚は手札に残す（4Tに出して、5Tに13かのんへバトンタッチするため）
        { from: 2, to: 4, ids: [CHISATO5, KANON4] },
        { from: 4, to: 6, ids: [KANON13] },
      ],
      wantLives: [BW, BUB, VIT],
    },
    mulliganOpt: {
      keep: [
        { ids: [SHIKI4, KEKE4W, KEKE4, KANON4], n: 1 },
        { ids: [KEKE9, MEI9], n: 1 },
        { ids: [BW], n: 1 },
        { ids: [MAR15], n: 1 },
      ],
    },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    turnPlan: {
      1: { board: [[{ cost: 4, area: 0 }]] },
      2: { board: [[{ id: KEKE9, area: 0 }], [{ id: MEI9 }], [9]], lives: [[BW]] },
      3: { board: [[{ id: MAR15 }]], lives: [[VIT]] },
      4: { board: [[{ id: MAR15 }, { id: CHISATO5, area: 2 }, 2], [{ id: MAR15 }, { id: KANON4 }, 2]], lives: [[BW, BUB]] },
      5: { board: [[...MID, 2], MID], lives: [[BUB, VIT]] },
      6: { board: [[...MID, 2], [...MID, 4], [...MID, 5]], lives: LATE_LIVES },
      7: { board: [[...MID, 2], [...MID, 4], [...MID, 5]], lives: LATE_LIVES },
    },
    lock: [{ id: MAR15, fromTurn: 4 }],
    // 1T〜3T は4-9-15進行を必ず守る（only：出せたらそのターンはほかのカードを出さない。手札に無いときだけAIに任せる）
    script: {
      // 1T：4コス（四季 ＞ 相手をウェイトにする可可 ＞ サーチの可可 ＞ かのん）を左サイドに
      1: [{ only: true, oneOf: [{ play: { id: SHIKI4 }, area: 0 }, { play: { id: KEKE4W }, area: 0 }, { play: { id: KEKE4 }, area: 0 }, { play: { cost: 4 }, area: 0 }] }],
      // 2T：左の4コスから9可可（左サイドでブレード+2）、次点で9メイ
      2: [{ only: true, oneOf: [{ play: { id: KEKE9 }, onto: { cost: 4 }, area: 0 }, { play: { id: KEKE9 }, onto: { cost: 4 } }, { play: { id: MEI9 }, onto: { cost: 4 } }, { play: { cost: 9 }, onto: { cost: 4 } }] }],
      3: [{ play: { id: MAR15 }, onto: { cost: 9 }, only: true }],
      // 4T：千砂都を右サイドに、次点で4かのん（エネルギー+1）
      4: [{ ifStage: { id: MAR15 }, oneOf: [{ play: { id: CHISATO5 }, area: 2 }, { play: { id: KANON4 } }] }],
      // 5T：千砂都から13かのん（8エネルギー）、4かのんから13かのん（9エネルギー）
      5: [{ oneOf: [{ play: { id: KANON13 }, onto: { id: CHISATO5 } }, { play: { id: KANON13 }, onto: { id: KANON4 } }, { play: { id: KANON13 }, onto: { cost: 5 } }, { play: { id: KANON13 }, onto: { cost: 4 } }] }],
      6: [{ play: { id: KANON13 }, onto: { id: KANON13 } }],
      7: [{ play: { id: KANON13 }, onto: { id: KANON13 } }],
    },
    liveOpt: {
      minScore: { 1: 99, 2: 0 },
      fill: true, fillMaxCost: 9, pace: [2, 5, 9], th1: 1.01, minP: 0.45, planMinP: 0.3,
    },
  },
};

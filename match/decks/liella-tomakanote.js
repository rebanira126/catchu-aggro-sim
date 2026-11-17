// トマカノーテ（ウィーン・マルガレーテ軸のLiella!・デッキコード 252KM）
// レシピはデッキログのものそのまま。回し方はこのデッキを使っていた人（このプロジェクトの依頼者）に教えてもらったもの。
const CHISATO4 = 'PL!SP-bp1-014'; // 嵐 千砂都（コスト4）
const NATSUMI4 = 'PL!SP-bp1-020'; // 鬼塚夏美（コスト4）
const REN4 = 'PL!SP-bp2-005';     // 葉月 恋（コスト4）
const KINAKO4 = 'PL!SP-bp2-017';  // 桜小路きな子（コスト4）
const KEKE9 = 'PL!SP-bp2-013';    // 唐 可可（コスト9）
const MAR9 = 'PL!SP-sd1-021';     // ウィーン・マルガレーテ（コスト9）
const MEI5 = 'PL!SP-bp2-007';     // 米女メイ（コスト5）
const KANON13 = 'PL!SP-bp2-001';  // 澁谷かのん（コスト13）
const MAR15 = 'PL!SP-bp2-010';    // ウィーン・マルガレーテ（コスト15）
const HAL = 'PL!SP-bp1-026';      // 未来予報ハレルヤ！
const VIT = 'PL!SP-bp2-024';      // ビタミンSUMMER!
const BUB = 'PL!SP-bp2-025';      // Bubble Rise

const LATE_LIVES = [[VIT, BUB, HAL], [VIT, VIT, BUB], [VIT, VIT], [VIT, BUB], [VIT, BUB, BUB]];

export default {
  id: "liella-tomakanote",
  type: "トマカノーテ",
  name: "トマカノーテ",
  code: "252KM",
  lastPlaced: "－",
  source: "https://decklog.bushiroad.com/view/252KM",
  list: [
    ["PL!SP-bp1-026", 4], // 未来予報ハレルヤ！（ライブ）
    ["PL!SP-bp2-024", 4], // ビタミンSUMMER!（ライブ）
    ["PL!SP-bp2-025", 4], // Bubble Rise（ライブ）
    ["PL!SP-bp1-005", 4], // 葉月 恋（コスト2）
    ["PL!SP-bp1-011", 4], // 鬼塚冬毬（コスト2）
    ["PL!SP-pb1-021", 4], // ウィーン・マルガレーテ（コスト2）
    ["PL!SP-bp1-014", 4], // 嵐 千砂都（コスト4）
    ["PL!SP-bp1-020", 4], // 鬼塚夏美（コスト4）
    ["PL!SP-bp2-005", 4], // 葉月 恋（コスト4）
    ["PL!SP-bp2-017", 4], // 桜小路きな子（コスト4）
    ["PL!SP-bp2-007", 4], // 米女メイ（コスト5）
    ["PL!SP-bp2-013", 4], // 唐 可可（コスト9）
    ["PL!SP-sd1-021", 4], // ウィーン・マルガレーテ（コスト9）
    ["PL!SP-bp2-001", 4], // 澁谷かのん（コスト13）
    ["PL!SP-bp2-010", 4], // ウィーン・マルガレーテ（コスト15）
  ],
  plan: {
    board: "4 → 9（バトンタッチ）→ 15マルガレーテ（バトンタッチ）→ 15-5（5メイ）→ 15-13かのん（5メイから）→ 13かのんから13かのん、空いた枠に4・5",
    score: "0 → 3（未来予報ハレルヤ！）→ 5〜6（ビタミンSUMMER!）→ 4（Bubble Rise、またはしゃがむ）→ 10（ビタミンSUMMER!＋Bubble Rise）→ 12〜13",
    mulligan: "9コス ＞ 4コス ＞ 未来予報ハレルヤ！ ＞ 15マルガレーテ ＞ 5コス の順に確保。できるだけ名前の異なるメンバーにする",
    lives: "1T：ライブなし（ライブ置き場に名前の異なるメンバーを伏せて控え室へ）／2T：未来予報ハレルヤ！（名前の異なるLiella!メンバー5人で必要ハートが軽くなる）／3T：ビタミンSUMMER!／4T：しゃがむか、Bubble Rise が2枚あれば1枚（15マルガレーテでエールは無いが盤面だけで成功）／5T：ビタミンSUMMER!＋Bubble Rise（13かのんでマルガレーテのエール-8を無効）／6T以降：ビタミンSUMMER!＋Bubble Rise＋未来予報ハレルヤ！、ビタミンSUMMER!×2 などで12〜13点",
    key: "15ウィーン・マルガレーテ（相手の必要ハート+1）、13澁谷かのん（マルガレーテのライブ開始時能力を無効にしてカードを回収）、Bubble Rise（エールのカードを回収）",
    refs: [],
  },
  strategy: {
    prefer: {
      // 1T〜：ライブ置き場に伏せるメンバーは、控え室にまだ無い名前のものを先に（未来予報ハレルヤ！の条件）
      fillDistinct: 'Liella!', protFill: false, protTurns: 0,
      hold: [
        { from: 2, to: 3, ids: [MAR15] },
        { from: 3, to: 4, ids: [MEI5] },
        { from: 4, to: 6, ids: [KANON13] },
      ],
      wantLives: [VIT, BUB, HAL],
    },
    mulliganOpt: {
      keep: [
        { ids: [KEKE9, MAR9], n: 1 },
        { ids: [CHISATO4, NATSUMI4, REN4, KINAKO4], n: 1 },
        { ids: [HAL], n: 1 },
        { ids: [MAR15], n: 1 },
        { ids: [MEI5], n: 1 },
      ],
    },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    turnPlan: {
      1: { board: [[4]] },
      2: { board: [[9]], lives: [[HAL]] },
      3: { board: [[{ id: MAR15 }]], lives: [[VIT]] },
      4: { board: [[{ id: MAR15 }, { id: MEI5 }]], lives: [[BUB]] },
      5: { board: [[{ id: MAR15 }, { id: KANON13 }]], lives: [[VIT, BUB]] },
      6: { board: [[{ id: MAR15 }, { id: KANON13 }, 4], [{ id: MAR15 }, { id: KANON13 }, 5]], lives: LATE_LIVES },
      7: { board: [[{ id: MAR15 }, { id: KANON13 }, 4], [{ id: MAR15 }, { id: KANON13 }, 5]], lives: LATE_LIVES },
    },
    // 4T以降：15マルガレーテにはバトンタッチしない（相手の必要ハート+1を残す）
    lock: [{ id: MAR15, fromTurn: 4 }],
    script: {
      // 2T：4コスから9コスへ／3T：9コスから15マルガレーテへ／4T：5メイを空いた枠へ
      2: [{ play: { cost: 9 }, onto: { cost: 4 } }],
      3: [{ play: { id: MAR15 }, onto: { cost: 9 } }],
      4: [{ ifStage: { id: MAR15 }, play: { id: MEI5 } }],
      // 5T：5メイから13かのん（登場時効果でマルガレーテのエール-8を無効にし、ライブか13かのんを回収）
      5: [{ oneOf: [{ play: { id: KANON13 }, onto: { id: MEI5 } }, { play: { id: KANON13 }, onto: { cost: 5 } }, { play: { id: KANON13 }, onto: { cost: 4 } }] }],
      // 6T以降：13かのんから13かのんへバトンタッチ（もう一度無効にして回収）
      6: [{ play: { id: KANON13 }, onto: { id: KANON13 } }],
      7: [{ play: { id: KANON13 }, onto: { id: KANON13 } }],
    },
    liveOpt: {
      // 1Tはライブをしない（minScore：1Tは99点未満を置かない。2T以降は制限なし）
      minScore: { 1: 99, 2: 0 },
      fill: true, fillMaxCost: 9, pace: [3, 6, 10], th1: 1.01, minP: 0.45, planMinP: 0.3,
    },
  },
};

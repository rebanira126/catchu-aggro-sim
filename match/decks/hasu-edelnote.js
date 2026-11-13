// Edel Note：ファンミ第三幕 Day2 Bブロック Top4
// レシピは出典の入賞レシピ（デッキコード）そのまま。回し方は plan に書いたnoteの内容を目安にしている。
const LANDING = 'PL!S-bp5-020'; // Landing action Yeah!!
const KAGUYA = 'PL!-pb1-031';   // 輝夜の城で踊りたい
const RETRO = 'PL!HS-bp5-022';  // Retrofuture
const EDELIED = 'PL!HS-pb1-030'; // Edelied
const IZUMI2 = 'PL!HS-pb1-016';  // 桂城 泉（コスト2）
const CERES4 = 'PL!HS-sd1-007';  // セラス 柳田 リリエンフェルト（コスト4）
const SAYAKA11 = 'PL!HS-bp1-002'; // 村野さやか（コスト11）
const KAHO9 = 'PL!HS-sd1-001';    // 日野下花帆（コスト9）

export default {
  id: "hasu-edelnote",
  type: "Edel Note",
  name: "ファンミ第三幕 Day2 Bブロック Top4",
  code: "1Q4DFA",
  lastPlaced: "2026/11/08",
  source: "https://llofficial-cardgame.com/deckrecipe/fanmeeting202611_2b/",
  list: [
    ["PL!-pb1-031", 1], // 輝夜の城で踊りたい（ライブ）
    ["PL!HS-bp5-022", 4], // Retrofuture（ライブ）
    ["PL!HS-pb1-030", 3], // Edelied（ライブ）
    ["PL!S-bp5-020", 4], // Landing action Yeah!!（ライブ）
    ["PL!-pb1-024", 4], // 西木野真姫（コスト2）
    ["PL!HS-pb1-016", 4], // 桂城 泉（コスト2）
    ["PL!N-sd1-006", 4], // 近江彼方（コスト2）
    ["PL!HS-bp5-008", 4], // 桂城 泉（コスト4）
    ["PL!HS-cl1-008", 2], // 桂城 泉（コスト4）
    ["PL!HS-pb1-024", 4], // 桂城 泉（コスト4）
    ["PL!HS-sd1-007", 4], // セラス 柳田 リリエンフェルト（コスト4）
    ["PL!HS-bp5-016", 4], // 桂城 泉（コスト9）
    ["PL!HS-cl1-004", 1], // 百生吟子（コスト9）
    ["PL!HS-sd1-001", 2], // 日野下花帆（コスト9）
    ["PL!HS-bp1-002", 3], // 村野さやか（コスト11）
    ["PL!HS-sd1-008", 4], // 桂城 泉（コスト13）
    ["PL!HS-bp6-007", 4], // セラス 柳田 リリエンフェルト（コスト15）
    ["PL!HS-PR-032", 1], // セラス 柳田 リリエンフェルト（コスト15）
    ["PL!N-bp4-004", 2], // 朝香果林（コスト15）
    ["PL!SP-sd1-003", 1], // 嵐 千砂都（コスト15）
  ],
  plan: {
    board: "2-2 → 2-7（または4）→ 11-2（11さやかで15セラスを踏み倒し）/ 13-2 → 2-15-7 / 7-15 → 2-15-15",
    score: "1 → 1〜2 → 4〜5 → 8〜9 → 11 → 11〜15",
    mulligan: "2コス桂城泉・セラス、11村野さやか、Retrofuture／Edelied を優先",
    lives: "1T：Landing action Yeah!! など1点／3T：Retrofuture（4点・9コス以上のEdelがいれば控えから4コス登場か紫軽減）／4T以降：Edelied（7点・ブレードと紫ハート付与）",
    key: "15セラス（相手メンバーをウェイト＝妨害）、11村野さやか（3Tに15コスを踏み倒し）、13桂城泉",
    refs: ["https://note.com/taki087/n/n76c6a1479109", "https://note.com/umi_kuku/n/ndbfeb1cadc39", "https://note.com/poke_lovelive/n/nbfe1b972d27f"],
  },
  // プレイ方針（noteの回し方より）
  // ・マリガン：2桂城泉、セラス（4）、11村野さやか、Retrofuture か Edelied
  strategy: {
    // 15セラスは控え室に置いておき、11村野さやかの起動で踏み倒す（PR-032は登場時にスコア6以上のライブを回収）
    prefer: { toWaiting: ['PL!HS-bp6-007', 'PL!HS-PR-032'] },
    mulliganOpt: { keep: [{ ids: [IZUMI2], n: 2 }, { ids: [CERES4], n: 1 }, { ids: [SAYAKA11], n: 1 }, { ids: [KAHO9], n: 1 }, { ids: [RETRO, EDELIED], n: 1 }, { ids: [LANDING, KAGUYA], n: 1 }] },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    turnPlan: {
      1: { board: [[2, 2]], lives: [[LANDING], [KAGUYA]] },
      // 2T：9日野下花帆を出しておくと、3Tに11村野さやかでバトンタッチしたときエネルギーが2枚アクティブになり、さやかの起動に回せる
      2: { board: [[2, { id: 'PL!HS-sd1-001' }], [2, 4]], lives: [[LANDING], [KAGUYA]] },
      3: { board: [[15, 2], [11, 2], [13, 2]], lives: [[RETRO]] },
      4: { board: [[15, 2]], lives: [[EDELIED]] },
      5: { board: [[15, 15, 2]], lives: [[EDELIED], [EDELIED, RETRO]] },
    },
    liveOpt: { fill: true, fillMaxCost: 4, minP: 0.4, th1: 0.3 },
  },
};

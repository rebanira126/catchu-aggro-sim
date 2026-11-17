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
const IZUMI13 = 'PL!HS-sd1-008';  // 桂城 泉（コスト13）
const IZUMI4_LOOK5 = 'PL!HS-bp5-008'; // 桂城 泉（コスト4・5枚見て9コス以上を探す）
const MAKI2 = 'PL!-pb1-024';     // 西木野真姫（コスト2・自分を控え室に置いてライブ回収）
const CERES15 = ['PL!HS-bp6-007', 'PL!HS-PR-032']; // セラス（コスト15）。Edeliedのハートを受けられるEdel Note
const NINES = [KAHO9, 'PL!HS-bp5-016', 'PL!HS-cl1-004']; // 9コス（花帆・泉・吟子）

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
    board: "4 → 9 → 13（11さやかなら15）＋Retrofutureで4 → 13/15-9（-2） → 15-15＋Retrofutureで4泉",
    score: "1 → 1〜2 → 4〜5 → 8〜9 → 11 → 11〜15",
    mulligan: "9コスは必ず1枚。9＋4コス、9＋Retrofuture はセットで残す（9が無ければ5ルックの4泉以外は戻す）",
    lives: "1・2T：Landing action Yeah!!（1点）／3T：Retrofuture（4点・控え室の4を登場）／4T：Edelied＋Landing action Yeah!!（8〜9点）／5T：Edelied＋Retrofuture（11点）",
    key: "15セラス（相手メンバーをウェイト＝妨害）、11村野さやか（3Tに15コスを踏み倒し）、13桂城泉",
    refs: ["https://note.com/0201_10/n/na9d208cbb3e3", "https://note.com/0201_10/n/n7b759de4cb39", "https://note.com/poke_lovelive/n/nbfe1b972d27f"],
  },
  // プレイ方針（みりおんさん「Edel Note徹底解説」の進行より）
  // 1T 4 → 2T 9 → 3T 13（11さやかがいれば15）＋Retrofutureで控え室の4を登場 → 4T 13/15＋9（＋2）
  // → 5T 15セラス2面＋Retrofutureで4泉を登場（Edelied＋Retrofutureで11点）
  strategy: {
    // 11さやかは3Tと5Tに使う。15セラスは控え室に置いておき、11さやかの起動で踏み倒す
    prefer: {
      toWaiting: ['PL!HS-bp6-007'],
      // 5TのEdelied＋Retrofutureのため、2枚を手札に抱える（捨てない・回収で優先）
      wantLives: [EDELIED, RETRO],
      hold: [{ from: 1, to: 5, ids: [SAYAKA11] }, { from: 1, to: 3, ids: [IZUMI13] }, { from: 3, to: 5, cost: 15 }, { from: 3, to: 4, cost: 9 }, { from: 1, to: 4, ids: [MAKI2] }],
    },
    // マリガン：9コスは必ず1枚。9＋4コス、9＋Retrofuture はセットで残す（4コスは5ルックの泉を優先）。11さやかも残す
    mulliganOpt: {
      keep: [
        { ids: [KAHO9], n: 1, group: 'c9' }, { cost: 9, group: 'c9' },
        { ids: [IZUMI4_LOOK5], n: 1, group: 'c4' }, { cost: 4, group: 'c4' },
        { ids: [RETRO], n: 1 },
        { ids: [SAYAKA11], n: 1 },
      ],
    },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    script: {
      // 1T：4コス（2Tに9へバトンタッチする先）
      1: [{ play: { cost: 4 } }],
      // 2T：4コスから9（花帆優先）へ
      2: [{ oneOf: [{ play: { id: KAHO9 }, onto: { cost: 4 } }, { play: { cost: 9 }, onto: { cost: 4 } }] }],
      // 3T：9から11さやか（控え室に15がいるとき。起動で15に入れ替わる）か13泉。空いたエリアはRetrofutureの登場先に残す
      3: [{ oneOf: [
        { ifWaiting: { ids: CERES15 }, play: { id: SAYAKA11 }, onto: { cost: 9 } },
        { play: { id: IZUMI13 }, onto: { cost: 9 } },
        { play: { cost: 13 }, onto: { cost: 9 } },
      ] }],
      // 4T：13/15がいれば、4か2から9（花帆優先）へ。空いたエリアに2コスのライブ回収（2真姫）を出して、5TのEdelied＋Retrofutureをそろえる
      4: [
        { ifStage: { minCost: 13 }, oneOf: [{ play: { id: KAHO9 }, onto: { cost: 4 } }, { play: { id: KAHO9 }, onto: { cost: 2 } }, { play: { cost: 9 }, onto: { cost: 4 } }, { play: { cost: 9 }, onto: { cost: 2 } }] },
        { oneOf: [{ play: { id: MAKI2 } }, { play: { cost: 2 } }] },
      ],
      // 5T：13から15（2エネ）、9から15（6エネ）か11さやか（控え室の15に入れ替わる）。空いたエリアはRetrofutureで4泉
      5: [
        { oneOf: [{ play: { ids: CERES15 }, onto: { cost: 13 } }, { play: { cost: 15 }, onto: { cost: 13 } }] },
        { oneOf: [{ play: { ids: CERES15 }, onto: { cost: 9 } }, { ifWaiting: { ids: CERES15 }, play: { id: SAYAKA11 }, onto: { cost: 9 } }, { play: { cost: 15 }, onto: { cost: 9 } }] },
      ],
    },
    turnPlan: {
      1: { board: [[4]], lives: [[LANDING]] },
      // 2T：9花帆なら Landing action Yeah!! を空き巣で
      2: { board: [[{ id: KAHO9 }], [9]], lives: [[LANDING]] },
      // 3T：13＋Retrofutureで4を登場（4点）。11さやかなら15
      3: { board: [[{ id: IZUMI13 }], [13], [15], [15, 2]], lives: [[RETRO]] },
      // 4T：13/15＋9（＋2）で Edelied＋Landing action Yeah!!（8〜9点）
      4: { board: [[13, { id: KAHO9 }, 4], [15, { id: KAHO9 }], [13, 9, 2], [15, 9]], lives: [[EDELIED, LANDING], [EDELIED]] },
      // 5T：15セラス2面＋Retrofutureで4泉。Edelied＋Retrofuture（11点）
      5: { board: [[15, 15]], lives: [[EDELIED, RETRO], [EDELIED]] },
      6: { board: [[15, 15, 4], [15, 15]], lives: [[EDELIED, RETRO], [EDELIED, EDELIED], [EDELIED]] },
    },
    // ライブセットフェイズの手札交換：1Tは9（2Tに出す）が手札に無ければ引き直す
    liveOpt: {
      fill: true, fillMaxCost: 4, minP: 0.4, th1: 0.3,
      digFor: [
        { ids: NINES, turns: [1], n: 3, keep: [SAYAKA11, RETRO, IZUMI13], label: '9コス', skipIfStage: true },
        { ids: [RETRO], turns: [1, 2], n: 3, keep: [...NINES, SAYAKA11, IZUMI13], label: 'Retrofuture' },
      ],
    },
  },
};

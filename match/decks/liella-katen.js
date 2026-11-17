// 加点Liella!：特別予選 Bブロック Top4
// レシピは出典の入賞レシピ（デッキコード）そのまま。回し方は plan に書いたnoteの内容を目安にしている。
const LBO = 'PL!SP-bp5-026';  // Let's be ONE
const HAJI = 'PL!SP-sd2-023'; // 始まりは君の空
const SV = 'PL!SP-bp5-023';   // Shooting Voice!!
const KANON15 = 'PL!SP-pb2-001'; // 澁谷かのん（コスト15・登場時にデッキの上5枚からコスト4以下を空いたエリアへ）
const SHIKI17 = 'PL!SP-pb2-008'; // 若菜四季（コスト17）
const REN9 = 'PL!SP-bp7-005';    // 葉月 恋（コスト9・登場時にランプ）
const SHIKI4 = 'PL!SP-bp5-008';  // 若菜四季（コスト4・コスト9以上をサーチ）
const NINES = [REN9, 'PL!SP-bp7-011', 'PL!SP-pb1-006'];

export default {
  id: "liella-katen",
  type: "加点Liella!",
  name: "特別予選 Bブロック Top4",
  code: "11WF7S",
  lastPlaced: "2026/09/26",
  source: "https://llofficial-cardgame.com/deckrecipe/masterstokubetsu2026top4_b/",
  list: [
    ["PL!SP-bp5-023", 3], // Shooting Voice!!（ライブ）
    ["PL!SP-bp5-026", 4], // Let's be ONE（ライブ）
    ["PL!SP-pb2-047", 1], // Welcome to 僕らのセカイ（ライブ）
    ["PL!SP-sd2-023", 4], // 始まりは君の空（ライブ）
    ["PL!SP-pb1-021", 4], // ウィーン・マルガレーテ（コスト2）
    ["PL!SP-pb2-016", 4], // 葉月 恋（コスト2）
    ["PL!SP-sd1-006", 1], // 桜小路きな子（コスト2）
    ["PL!SP-bp2-015", 4], // 平安名すみれ（コスト4）
    ["PL!SP-bp2-020", 4], // 鬼塚夏美（コスト4）
    ["PL!SP-bp5-008", 4], // 若菜四季（コスト4）
    ["PL!SP-bp5-022", 1], // 鬼塚冬毬（コスト4）
    ["PL!SP-pb2-009", 4], // 鬼塚夏美（コスト4）
    ["PL!SP-bp7-005", 4], // 葉月 恋（コスト9）
    ["PL!SP-bp7-011", 4], // 鬼塚冬毬（コスト9）
    ["PL!SP-pb1-006", 2], // 桜小路きな子（コスト9）
    ["PL!SP-bp4-005", 3], // 葉月 恋（コスト15）
    ["PL!SP-pb2-001", 4], // 澁谷かのん（コスト15）
    ["PL!SP-bp5-003", 1], // 嵐 千砂都（コスト17）
    ["PL!SP-pb2-008", 4], // 若菜四季（コスト17）
  ],
  plan: {
    board: "4 → 9 → 15かのん-4-2 → 17-9（-2）→ 17-17",
    score: "1 → 1〜 → 4〜（しゃがみも多い）→ 8〜10 → 14〜",
    mulligan: "2コス（恋・マルガレーテ）、4コス若菜四季（9コス以上サーチ）、1点ライブ",
    lives: "1T・2T：Let's be ONE／始まりは君の空（1点）を置く／3T：しゃがむことが多い／4T：17若菜四季＋9コスで Shooting Voice!!＋始まりは君の空（10点〜）／5T：14点〜",
    key: "17若菜四季（エールの非ブレLiella!メンバー2枚ごとに+1、最大+2）、15澁谷かのん、4すみれ・夏美（ブレハなしで色ハート）、4夏美pb2-009（ウェイト妨害）",
    refs: ["https://note.com/ryo_25_51/n/n6915083b37cc", "https://note.com/724chu/n/n445f9bffa257", "https://note.com/poke_lovelive/n/nbfe1b972d27f"],
  },
  // プレイ方針の上書き（まだ標準の方針のまま）
  // プレイ方針
  // ・マリガン：4コストまで、コスト2は2枚、1点ライブ（必要ハート5以下）を2枚まで残す
  // ・盤面：次のターンに手札の大型をバトンタッチで出せる形を少し優先
  // ・ライブ：成功2枚までは1点ライブで進め（始まりは君の空・Shooting Voice!! は成功2枚から強い）、そのあとは大きく取りに行く
  // ・空いた枠にはコスト4以下のメンバーを伏せて引き直す
  strategy: {
    // マリガン：コスト2（葉月 恋・ウィーン・マルガレーテ）を2枚、4若菜四季、1点ライブ
    mulliganOpt: { keep: [{ ids: ['PL!SP-pb2-016', 'PL!SP-pb1-021'], n: 2 }, { ids: ['PL!SP-bp5-008'], n: 1 }, { ids: [LBO, HAJI], n: 1 }] },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    // 9・15かのん・17四季は使うターンまで手札に残す
    prefer: { hold: [{ from: 1, to: 2, ids: NINES }, { from: 1, to: 3, ids: [KANON15] }, { from: 2, to: 5, ids: [SHIKI17] }, { from: 3, to: 4, ids: NINES }] },
    // 手順：1T 4 → 2T 4から9（恋はランプ）→ 3T 9から15かのん（デッキの上から4コスを空いたエリアへ）＋2
    //  → 4T 15から17四季、4から9 → 5T 9から17四季で 17-17
    script: {
      1: [{ oneOf: [{ play: { id: SHIKI4 } }, { play: { cost: 4 } }] }],
      2: [{ oneOf: [{ play: { id: REN9 }, onto: { cost: 4 } }, { play: { ids: NINES }, onto: { cost: 4 } }, { play: { cost: 9 }, onto: { cost: 4 } }] }],
      3: [{ play: { id: KANON15 }, onto: { cost: 9 } }, { play: { cost: 2 } }],
      4: [{ play: { id: SHIKI17 }, onto: { cost: 15 } }, { oneOf: [{ play: { id: REN9 }, onto: { cost: 4 } }, { play: { cost: 9 }, onto: { cost: 4 } }, { play: { cost: 9 }, onto: { cost: 2 } }] }],
      5: [{ play: { id: SHIKI17 }, onto: { cost: 9 } }],
    },
    // ターンごとの目標（poke「ラブカ環境デッキ打点表」の加点Liella!の進行より）
    turnPlan: {
      1: { board: [[4]], lives: [[LBO], [HAJI]] },
      2: { board: [[{ id: REN9 }], [9]], lives: [[LBO], [HAJI]] },
      3: { board: [[{ id: KANON15 }, 4, 2], [{ id: KANON15 }, 4]], lives: [[LBO], [HAJI]] },
      4: { board: [[{ id: SHIKI17 }, 9, 2], [{ id: SHIKI17 }, 9]], lives: [[SV, HAJI], [SV, LBO], [SV]] },
      5: { board: [[{ id: SHIKI17 }, { id: SHIKI17 }]], lives: [[SV, HAJI], [SV, SV], [SV, LBO], [SV]] },
    },
    // 手札交換：1Tは9（2Tに出す）、1・2Tは15かのん（3Tに出す）、2・3Tは17四季（4Tに出す）を探す
    liveOpt: {
      fill: true, fillMaxCost: 4, pace: [1, 1, 10], minP: 0.4, th1: 0.3, thLast: 0.3,
      digFor: [
        { ids: NINES, turns: [1], n: 3, keep: [KANON15, SHIKI17], label: '9', skipIfStage: true },
        { ids: [KANON15], turns: [1, 2], n: 3, keep: [...NINES, SHIKI17], label: '15澁谷かのん' },
        { ids: [SHIKI17], turns: [2, 3], n: 3, keep: [...NINES, KANON15, SV], label: '17若菜四季' },
      ],
    },
  },
};

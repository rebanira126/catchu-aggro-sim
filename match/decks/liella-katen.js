// 加点Liella!：特別予選 Bブロック Top4
// レシピは出典の入賞レシピ（デッキコード）そのまま。回し方は plan に書いたnoteの内容を目安にしている。
const LBO = 'PL!SP-bp5-026';  // Let's be ONE
const HAJI = 'PL!SP-sd2-023'; // 始まりは君の空
const SV = 'PL!SP-bp5-023';   // Shooting Voice!!

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
    board: "2-2 → 4-2-2 / 9 → 9-4-2 → 17-9（-2）→ 17-17",
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
    // ターンごとの目標（noteの回し方より）
    turnPlan: {
      1: { board: [[2, 2], [4]], lives: [[LBO], [HAJI]] },
      2: { board: [[4, 2, 2], [9]], lives: [[LBO], [HAJI]] },
      3: { board: [[9, 4, 2]] },
      4: { board: [[17, 9, 2], [17, 9]], lives: [[SV, HAJI]] },
      5: { board: [[17, 17]], lives: [[SV, HAJI], [SV, SV]] },
    },
    liveOpt: { fill: true, fillMaxCost: 4, pace: [1, 1, 10], minP: 0.4, th1: 0.3, thLast: 0.3 },
  },
};

// 加点Liella!：特別予選 Bブロック Top4
// レシピは出典の入賞レシピ（デッキコード）そのまま。回し方は plan に書いたnoteの内容を目安にしている。
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
  strategy: {},
};

// Aqours系（恋アク）：九州・沖縄エリア予選 入賞（恋アクAqours）
// レシピは出典の入賞レシピ（デッキコード）そのまま。回し方は plan に書いたnoteの内容を目安にしている。
export default {
  id: "aqours-koiaq",
  type: "Aqours系（恋アク）",
  name: "九州・沖縄エリア予選 入賞（恋アクAqours）",
  code: "1ATFMN",
  lastPlaced: "2026/11/03",
  source: "https://llofficial-cardgame.com/deckrecipe/area2026kyushuokinawa/",
  list: [
    ["PL!S-bp3-019", 1], // MIRACLE WAVE（ライブ）
    ["PL!S-bp6-024", 2], // コワレヤスキ（ライブ）
    ["PL!S-bp7-020", 1], // HAPPY PARTY TRAIN（ライブ）
    ["PL!S-bp7-022", 4], // 恋になりたいAQUARIUM（ライブ）
    ["PL!S-bp7-025", 4], // Guilty Night, Guilty Kiss!（ライブ）
    ["PL!S-bp2-009", 2], // 黒澤ルビィ（コスト2）
    ["PL!S-bp2-016", 3], // 国木田花丸（コスト2）
    ["PL!S-cl1-009", 1], // 黒澤ルビィ（コスト2）
    ["PL!S-sd1-015", 4], // 津島善子（コスト2）
    ["PL!-bp5-222", 4], // 優木あんじゅ（コスト4）
    ["PL!S-bp5-006", 3], // 津島善子（コスト4）
    ["PL!S-bp6-016", 3], // 国木田花丸（コスト4）
    ["PL!S-cl1-008", 4], // 小原鞠莉（コスト4）
    ["PL!HS-pb1-013", 3], // 徒町小鈴（コスト9）
    ["PL!S-bp7-001", 4], // 高海千歌（コスト9）
    ["PL!S-bp7-007", 4], // 国木田花丸（コスト11）
    ["PL!S-bp2-005", 4], // 渡辺 曜（コスト13）
    ["PL!S-bp3-006", 4], // 津島善子（コスト13）
    ["PL!S-bp5-003", 1], // 松浦果南（コスト13）
    ["PL!S-bp7-005", 3], // 渡辺 曜（コスト15）
    ["PL!S-cl1-004", 1], // 黒澤ダイヤ（コスト15）
  ],
  plan: {
    board: "4 → 9 → 13（センターウェイト）-4 → 13-13-2 → 15-15-2 → 15-15-9（13善子進行）",
    score: "0 → 3 → 3 → 9〜10 → 14〜16 → 18",
    mulligan: "1Tの4コス（優木あんじゅ優先）、9コス（千歌・徒町）、Guilty Night, Guilty Kiss!",
    lives: "2T・3T：Guilty Night, Guilty Kiss!（3点）／4T：Guilty Night＋MIRACLE WAVE（9〜10点）／5T：恋になりたいAQUARIUM＋MIRACLE WAVE かコワレヤスキ（14〜16点）／6T：恋アク×2（18点）",
    key: "13津島善子（コスト踏み倒し）、15渡辺曜（スタッツ増・非ブレ減らし）、11国木田花丸（2コス回収）",
    refs: ["https://note.com/blackriver_1111/n/n84f7e0a45946", "https://note.com/mute_tern875/n/n3ae00c719e10"],
  },
  // プレイ方針の上書き（まだ標準の方針のまま）
  strategy: {},
};

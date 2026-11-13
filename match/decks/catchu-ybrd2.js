// CatChu!：ファンミ第三幕 Day2 Bブロック Top4
// レシピは出典の入賞レシピ（デッキコード）そのまま。回し方は plan に書いたnoteの内容を目安にしている。
export default {
  id: "catchu-ybrd2",
  type: "CatChu!",
  name: "ファンミ第三幕 Day2 Bブロック Top4",
  code: "YBRD2",
  lastPlaced: "2026/11/08",
  source: "https://llofficial-cardgame.com/deckrecipe/fanmeeting202611_2b/",
  list: [
    ["PL!SP-bp7-023", 4], // START!! True dreams（ライブ）
    ["PL!SP-pb1-023", 4], // ディストーション（ライブ）
    ["PL!SP-pb2-048", 4], // ディストーション（ライブ）
    ["PL!SP-bp1-005", 4], // 葉月 恋（コスト2）
    ["PL!SP-bp4-015", 4], // 平安名すみれ（コスト2）
    ["PL!SP-bp4-019", 4], // 若菜四季（コスト2）
    ["PL!SP-pb1-018", 4], // 米女メイ（コスト2）
    ["PL!SP-pb2-004", 4], // 平安名すみれ（コスト2）
    ["PL!SP-pb2-012", 3], // 澁谷かのん（コスト2）
    ["PL!SP-pb2-018", 4], // 米女メイ（コスト2）
    ["PL!SP-sd1-020", 4], // 鬼塚夏美（コスト2）
    ["PL!SP-bp2-007", 4], // 米女メイ（コスト5）
    ["PL!SP-pb2-037", 2], // 平安名すみれ（コスト5）
    ["PL!SP-pb1-001", 4], // 澁谷かのん（コスト11）
    ["PL!SP-pb2-007", 3], // 米女メイ（コスト11）
    ["PL!SP-pb2-015", 4], // 平安名すみれ（コスト13）
  ],
  plan: {
    board: "2-2 → 5-2-2 → 11-2-2（バトンタッチ）→ 11-5-2 / 13",
    score: "1 → 4 → 7 → 8（1-4-7が理想）",
    mulligan: "2コス2枚、5コスすみれ／メイ、START!! True dreams、ディストーション",
    lives: "1T：START!! True dreams（1点）／2T：ディストーション（3点＋1）／3T：ディストーション（6点＋1）／4T以降は打点が伸びにくい",
    key: "11澁谷かのん、11米女メイ、13平安名すみれ（CatChu!名称の人数でディストーションが強化）",
    refs: ["https://note.com/happy_sloth5502/n/n9041888e2147", "https://note.com/brave_fairy8464/n/n4ce2ef4e0c96", "https://note.com/poke_lovelive/n/nbfe1b972d27f"],
  },
  // プレイ方針：マリガンで5コストまで残し、ライブは2枚まで（必要ハート9以上の6点ディストーションは3ターン目用なので戻す）
  strategy: {
    mulliganOpt: { keepCost: 5, maxLives: 2, maxNeed: 8 },
  },
};

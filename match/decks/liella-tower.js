// タワーLiella!：ファンミ第三幕 Day2 Aブロック Top4（加点軸タワー）
// レシピは出典の入賞レシピ（デッキコード）そのまま。回し方は plan に書いたnoteの内容を目安にしている。
export default {
  id: "liella-tower",
  type: "タワーLiella!",
  name: "ファンミ第三幕 Day2 Aブロック Top4（加点軸タワー）",
  code: "13ZY5S",
  lastPlaced: "2026/11/08",
  source: "https://llofficial-cardgame.com/deckrecipe/fanmeeting202611_2a/",
  list: [
    ["PL!SP-bp2-023", 2], // Go!! リスタート（ライブ）
    ["PL!SP-bp5-023", 3], // Shooting Voice!!（ライブ）
    ["PL!SP-bp5-026", 3], // Let's be ONE（ライブ）
    ["PL!SP-sd2-023", 4], // 始まりは君の空（ライブ）
    ["PL!SP-pb2-012", 4], // 澁谷かのん（コスト2）
    ["PL!SP-pb2-031", 4], // 鬼塚夏美（コスト2）
    ["PL!SP-bp4-001", 4], // 澁谷かのん（コスト4）
    ["PL!SP-PR-006", 3], // 平安名すみれ（コスト4）
    ["PL!SP-PR-013", 3], // 鬼塚冬毬（コスト4）
    ["PL!SP-sd1-014", 2], // 嵐 千砂都（コスト4）
    ["PL!SP-bp1-003", 4], // 嵐 千砂都（コスト10）
    ["PL!SP-bp7-001", 4], // 澁谷かのん（コスト10）
    ["PL!SP-bp7-003", 4], // 嵐 千砂都（コスト10）
    ["PL!SP-bp2-009", 4], // 鬼塚夏美（コスト13）
    ["PL!SP-bp5-002", 4], // 唐 可可（コスト13）
    ["PL!SP-bp5-003", 1], // 嵐 千砂都（コスト17）
    ["PL!SP-pb2-008", 3], // 若菜四季（コスト17）
    ["LL-bp2-001", 1], // 渡辺 曜&鬼塚夏美&大沢瑠璃乃（コスト20）
    ["PL!SP-pb2-005", 3], // 葉月 恋（コスト20）
  ],
  plan: {
    board: "0-0-4 → 0-0-10 → 4-2-10 → 13-2-10 → 17-2-10 → 17-20-10（位置に意味あり。10千砂都の下にメンバーを積む）",
    score: "0 → 1〜2（相手先制なら3）→ 2〜 → 11〜（千秋楽以外9〜）→ 15〜17 → 20〜21",
    mulligan: "10嵐千砂都 ＞ 4ランプ ＞ 10澁谷かのん ＞ 1点ライブ。千砂都が無ければ10かのんをキープ",
    lives: "2T：1点ライブ（Let's be ONE／Go!! リスタート）／3T：手札の1点ライブ／4T：Shooting Voice!!＋Let's be ONE（千秋楽で12点）／5T：Shooting Voice!!＋Let's be ONE×2（17点）／6T：Shooting Voice!!×2＋Let's be ONE（21点）",
    key: "10嵐千砂都bp7-003（下のメンバー1枚ごとにブレード、3枚以上で+1）、13唐可可（ドロー）、17若菜四季、20三神",
    refs: ["https://note.com/fine_eel3362/n/n5693665d2e4f", "https://note.com/poke_lovelive/n/nbfe1b972d27f"],
  },
  // プレイ方針の上書き（まだ標準の方針のまま）
  strategy: {},
};

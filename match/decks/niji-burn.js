// Burn!!（虹ヶ咲）：北陸エリア予選 入賞（人魚Burn!!）
// レシピは出典の入賞レシピ（デッキコード）そのまま。回し方は plan に書いたnoteの内容を目安にしている。
export default {
  id: "niji-burn",
  type: "Burn!!（虹ヶ咲）",
  name: "北陸エリア予選 入賞（人魚Burn!!）",
  code: "FRYTS",
  lastPlaced: "2026/10/25",
  source: "https://llofficial-cardgame.com/deckrecipe/area2026hokuriku/",
  list: [
    ["PL!N-bp3-030", 1], // Love U my friends（ライブ）
    ["PL!N-bp4-030", 4], // Daydream Mermaid（ライブ）
    ["PL!N-bp7-029", 4], // Burn!!（ライブ）
    ["PL!SP-bp4-027", 3], // Chance Day, Chance Way!（ライブ）
    ["PL!-bp5-011", 4], // 絢瀬絵里（コスト2）
    ["PL!N-PR-009", 4], // 優木せつ菜（コスト2）
    ["PL!N-sd1-006", 2], // 近江彼方（コスト2）
    ["PL!S-bp2-009", 2], // 黒澤ルビィ（コスト2）
    ["PL!S-bp2-016", 4], // 国木田花丸（コスト2）
    ["PL!SP-bp7-010", 1], // ウィーン・マルガレーテ（コスト2）
    ["PL!SP-pb1-014", 4], // 嵐 千砂都（コスト2）
    ["PL!HS-PR-022", 4], // セラス 柳田 リリエンフェルト（コスト4）
    ["PL!N-bp7-016", 4], // 朝香果林（コスト4）
    ["PL!N-sd2-019", 3], // 優木せつ菜（コスト4）
    ["PL!N-bp7-007", 4], // 優木せつ菜（コスト11）
    ["PL!S-bp7-007", 3], // 国木田花丸（コスト11）
    ["PL!SP-pb2-014", 3], // 嵐 千砂都（コスト11）
    ["LL-bp7-001", 3], // 国木田花丸&優木せつ菜&嵐 千砂都（コスト15）
    ["PL!SP-sd1-003", 3], // 嵐 千砂都（コスト15）
  ],
  plan: {
    board: "2-2（4）→ 4-2-2 → 11-2-2 → 15-2-2 / 11-11-2 → 15-11-2（メロモ三神は4T以降）",
    score: "1 → 3 → 5〜7 → 9〜11 → 15〜19",
    mulligan: "2コス2枚＋1点ライブ（Chance Day, Chance Way!）、Daydream Mermaid、11せつ菜を優先。ライブ欠損に注意し、11せつ菜と2コスを返す選択もあり",
    lives: "1T：Chance Day, Chance Way!（1点）／2T：Daydream Mermaid（3点・Mスタ2点を上から踏める）／3T：Burn!!（赤ブレハ4〜5本必要）かしゃがみ／4T以降：Burn!!＋Love U my friends、5Tに最大19点",
    key: "11優木せつ菜（下のエネルギーで赤ハート）、Burn!!（成功時にエネルギー回収）、メロモ三神（ライブを拾いつつ盤面成長）",
    refs: ["https://note.com/brave_fairy8464/n/n4ce2ef4e0c96", "https://note.com/leno1130/n/n35817796ccf7", "https://note.com/poke_lovelive/n/nbfe1b972d27f"],
  },
  // プレイ方針の上書き（まだ標準の方針のまま）
  // プレイ方針（仮。7デッキの効果がそろったので、あとでnoteの回し方に合わせて調整する）
  // ・マリガン：コスト4まで、コスト2は2枚、必要ハート6以下のライブを1枚残す
  // ・ライブ置き場の空き枠にコスト4以下のメンバーを伏せて引き直す
  strategy: {
    mulliganOpt: { keepCost: 4, maxLives: 1, maxNeed: 6, maxLow: 2 },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    liveOpt: { fill: true, fillMaxCost: 4, minP: 0.4, th1: 0.3 },
  },
};

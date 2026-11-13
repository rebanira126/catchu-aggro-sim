// Edel Note：ファンミ第三幕 Day2 Bブロック Top4
// レシピは出典の入賞レシピ（デッキコード）そのまま。回し方は plan に書いたnoteの内容を目安にしている。
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

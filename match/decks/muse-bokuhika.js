// 僕光μ's：ファンミ第三幕 Day1 Bブロック Top4
// レシピは出典の入賞レシピ（デッキコード）そのまま。回し方は plan に書いたnoteの内容を目安にしている。
const MS = 'PL!-bp6-019';        // Music S.T.A.R.T!!
const ARASHI = 'PL!-pb2-038';    // 嵐のなかの恋だから
const BOKUHIKA = 'PL!-pb2-039';  // 僕たちはひとつの光
const NIKO9 = 'PL!-pb2-009';     // 矢澤にこ（コスト9）
const ERI4 = 'PL!-bp5-002';      // 絢瀬絵里（コスト4）
const MAKI17 = 'PL!-bp6-006';    // 西木野真姫（コスト17）

export default {
  id: "muse-bokuhika",
  type: "僕光μ's",
  name: "ファンミ第三幕 Day1 Bブロック Top4",
  code: "ES0R2",
  lastPlaced: "2026/11/07",
  source: "https://llofficial-cardgame.com/deckrecipe/fanmeeting202611_1b/",
  list: [
    ["PL!-bp6-019", 4], // Music S.T.A.R.T!!（ライブ）
    ["PL!-bp6-022", 1], // Dreamin' Go! Go!!（ライブ）
    ["PL!-pb2-038", 4], // 嵐のなかの恋だから（ライブ）
    ["PL!-pb2-039", 3], // 僕たちはひとつの光（ライブ）
    ["PL!-pb1-025", 4], // 東條 希（コスト2）
    ["PL!-pb2-035", 4], // 小泉花陽（コスト2）
    ["PL!-sd1-005", 1], // 星空 凛（コスト2）
    ["PL!-bp3-014", 2], // 星空 凛（コスト4）
    ["PL!-bp5-002", 4], // 絢瀬絵里（コスト4）
    ["PL!-bp5-018", 3], // 矢澤にこ（コスト4）
    ["PL!-pb2-031", 4], // 園田海未（コスト4）
    ["PL!-bp3-005", 1], // 星空 凛（コスト4）
    ["PL!-sd1-010", 2], // 高坂 穂乃果（コスト4）
    ["PL!-pb2-009", 4], // 矢澤にこ（コスト9）
    ["PL!-pb2-029", 3], // 絢瀬絵里（コスト9）
    ["PL!-bp4-002", 2], // 絢瀬絵里（コスト15）
    ["PL!-bp6-003", 4], // 南 ことり（コスト15）
    ["PL!-pb2-000", 2], // 星空 凛&小泉花陽（コスト15）
    ["PL!-bp6-006", 4], // 西木野真姫（コスト17）
    ["PL!-pb2-001", 4], // 高坂穂乃果（コスト22）
  ],
  plan: {
    board: "4 → 9 → 17-2 → 17-9 → 17-17-2（9軸）",
    score: "0 → 2 → 6 → 8 → 18（5Tに僕光で最大18〜19点）",
    mulligan: "Music S.T.A.R.T!!、9コス矢澤にこ、4コス（絵里優先）を優先キープ。4コスは種類を問わず1枚はキープ",
    lives: "2T：Music S.T.A.R.T!!（2点）／3T：嵐のなかの恋だから（5〜6点）／4T：嵐＋Mスタ（8点）か、相手が9点以上ならしゃがむ／5T：僕たちはひとつの光（成功ライブにμ'sが2枚以上→エール+10枚）",
    key: "17西木野真姫（起動で手札を整える・メインアタッカー）、9矢澤にこ、15南ことり、22高坂穂乃果（長期戦）",
    refs: ["https://note.com/izm_i7ll/n/nb94386d5cbad", "https://note.com/emituntan/n/n6133008f3186", "https://note.com/poke_lovelive/n/nbfe1b972d27f"],
  },
  // プレイ方針（noteの回し方より）
  // ・マリガン：Music S.T.A.R.T!!、9矢澤にこ、4コス（絢瀬絵里を優先して1枚）
  // ・空いた枠にはコスト4以下のメンバーを伏せて引き直す
  strategy: {
    // 5Tの17真姫-17真姫-2（僕光）のため、3Tから2枚目の17真姫と、9（にこ優先。5Tに17真姫へ乗る先）を手札に残す
    prefer: { hold: [{ from: 3, to: 5, ids: [MAKI17] }, { from: 3, to: 4, ids: [NIKO9], cost: 9 }] },
    mulliganOpt: { keep: [{ ids: [MS], n: 1 }, { ids: [NIKO9], n: 1 }, { ids: [ERI4], group: 'c4', n: 1 }, { cost: 4, group: 'c4' }] },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    turnPlan: {
      1: { board: [[4]] },
      // 2T：9にこ（Music S.T.A.R.T!!の色を1人で満たす。3Tに17真姫へバトンタッチすると2エネ起きる）
      2: { board: [[{ id: NIKO9 }], [9]], lives: [[MS]] },
      // 3T：Music S.T.A.R.T!!でコスト-2の17真姫を9にこから出し（6エネ）、にこで起きた2エネで2コス
      3: { board: [[{ id: MAKI17 }, 2], [17, 2]], lives: [[ARASHI]] },
      4: { board: [[{ id: MAKI17 }, 9], [17, 9]], lives: [[ARASHI, MS]] },
      5: { board: [[{ id: MAKI17 }, { id: MAKI17 }, 2], [17, 17, 2], [{ id: MAKI17 }, 15, 2]], lives: [[BOKUHIKA]] },
    },
    liveOpt: { fill: true, fillMaxCost: 4, minP: 0.4, th1: 0.3 },
  },
};

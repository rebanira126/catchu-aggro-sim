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
    // 3Tに17真姫のあとに出す2コスも、1Tから手札に残す
    prefer: { hold: [{ from: 3, to: 5, ids: [MAKI17] }, { from: 3, to: 4, ids: [NIKO9], cost: 9 }, { from: 1, to: 3, cost: 2 }] },
    // マリガン：キーカード（Music S.T.A.R.T!!・9にこ・17真姫）と、4コス（絵里優先。9にこや17真姫を探せる）を1枚ずつ残す
    mulliganOpt: { keep: [{ ids: [MS], n: 1 }, { ids: [NIKO9], n: 1 }, { ids: [MAKI17], n: 1 }, { ids: [ERI4], group: 'c4', n: 1 }, { cost: 4, group: 'c4' }] },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    // 手順（noteより）。17真姫の起動は手順の前に使う。出せないときはいつものAIの判断に戻る
    //  4T：2コスから9にバトンタッチ（9にこ優先。5Tに17真姫へ乗る先を作る）
    //  5T：9から17真姫にバトンタッチ（Music S.T.A.R.T!!でコスト-2なので6エネ。2枚目が無ければ15ことり）、余ったエネルギーで2コス
    script: {
      // 3T：Music S.T.A.R.T!!でコスト-2の17真姫を9から出す（AIは15を選びがちなので手順で決める）。にこで起きた2エネで2コス
      //     （Music S.T.A.R.T!!が成功していなければ17真姫は出せないので、9-2のまま Music S.T.A.R.T!! をもう一度打つ）
      3: [{ play: { id: MAKI17 }, onto: { cost: 9 } }, { play: { cost: 2 } }],
      // 4T：17真姫がいれば2コスか4コスから9へ（9→2は7エネ）。
      //     いなければ（1ターン遅れの流れ）、3TのMusic S.T.A.R.T!!でコスト-2の17真姫を9から出し、にこで起きた2エネで2コス
      4: [
        { ifStage: { id: MAKI17 }, oneOf: [{ play: { id: NIKO9 }, onto: { cost: 2 } }, { play: { cost: 9 }, onto: { cost: 2 } }, { play: { id: NIKO9 }, onto: { cost: 4 } }, { play: { cost: 9 }, onto: { cost: 4 } }] },
        { ifNoStage: { id: MAKI17 }, ifSuccess: MS, play: { id: MAKI17 }, onto: { cost: 9 } },
        { play: { cost: 2 } },
      ],
      // 5T：9から17真姫（いなければ15ことり）。余ったエネルギーで2コス（ライブ回収）
      //     1ターン遅れの流れでは、9が無いので2コスから9へ
      5: [
        { oneOf: [{ play: { id: MAKI17 }, onto: { cost: 9 } }, { play: { id: 'PL!-bp6-003' }, onto: { cost: 9 } }, { play: { id: NIKO9 }, onto: { cost: 2 } }, { play: { cost: 9 }, onto: { cost: 2 } }] },
        { play: { cost: 2 } },
      ],
      // 6T（1ターン遅れの流れ）：9から17真姫、余りで2コス
      6: [
        { oneOf: [{ play: { id: MAKI17 }, onto: { cost: 9 } }, { play: { id: 'PL!-bp6-003' }, onto: { cost: 9 } }] },
        { play: { cost: 2 } },
      ],
    },
    turnPlan: {
      1: { board: [[4]] },
      // 2T：9にこ（Music S.T.A.R.T!!の色を1人で満たす。3Tに17真姫へバトンタッチすると2エネ起きる）
      2: { board: [[{ id: NIKO9 }], [9]], lives: [[MS]] },
      // 3T：Music S.T.A.R.T!!でコスト-2の17真姫を9にこから出し（6エネ）、にこで起きた2エネで2コス
      //     Music S.T.A.R.T!!が成功していなければ、9-2で Music S.T.A.R.T!! をもう一度（1ターン遅れの流れ）
      3: { board: [[{ id: MAKI17 }, 2], [17, 2]], lives: [[ARASHI]],
        alt: [{ ifNoSuccess: MS, board: [[{ id: NIKO9 }, 2], [9, 2]], lives: [[MS], [ARASHI]] }] },
      4: { board: [[{ id: MAKI17 }, 9], [17, 9]], lives: [[ARASHI, MS]] },
      5: { board: [[{ id: MAKI17 }, { id: MAKI17 }, 2], [17, 17, 2], [{ id: MAKI17 }, 15, 2]], lives: [[BOKUHIKA]] },
      6: { board: [[{ id: MAKI17 }, { id: MAKI17 }, 2], [17, 17, 2]], lives: [[BOKUHIKA], [ARASHI, MS]] },
    },
    // ライブセットフェイズの手札交換：キーカードが手札に無ければ、ライブカード置き場を3枚まで埋めて引き直す
    //  1T：9にこ（2Tに出す）／Music S.T.A.R.T!!（2Tに打つ）　1・2T：17真姫（3Tに出す）。キーカードとMusic S.T.A.R.T!!は置かない
    liveOpt: {
      fill: true, fillMaxCost: 4, minP: 0.4, th1: 0.3,
      digFor: [
        { ids: [NIKO9], turns: [1], n: 3, keep: [MS, MAKI17], label: '9にこ', skipIfStage: true },
        { ids: [MS], turns: [1], n: 3, keep: [NIKO9, MAKI17], label: 'Music S.T.A.R.T!!' },
        { ids: [MAKI17], turns: [1, 2], n: 3, keep: [NIKO9, MS], label: '17真姫', skipIfStage: true },
        // 2Tは3Tに打つ嵐のなかの恋だからを探す
        { ids: [ARASHI], turns: [2], n: 3, keep: [MAKI17, NIKO9, MS], label: '嵐のなかの恋だから' },
        // 3・4Tは5Tに使う2枚目の17真姫と、4Tに出す9を探す
        { ids: [MAKI17], turns: [3, 4], n: 3, keep: [NIKO9, BOKUHIKA, 'PL!-bp6-013'], label: '2枚目の17真姫' },
        { ids: [NIKO9, 'PL!-bp6-013'], turns: [3], n: 3, keep: [MAKI17, BOKUHIKA], label: '9（4Tに出す）' },
      ],
    },
  },
};

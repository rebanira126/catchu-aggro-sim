// 僕光μ's（noteのレシピ）：いずみさん「僕光μ'sをざっくり解説」
// レシピはnoteの画像と本文から（デッキログのコードは無し。一部の番号はユーザーに教えてもらった）。
// 2コスの南ことりは本文の「17真姫の効果の邪魔をする（桃を持たない）」から PL!-bp3-012 と推測
const MS = 'PL!-bp6-019';        // Music S.T.A.R.T!!
const ARASHI = 'PL!-pb2-038';    // 嵐のなかの恋だから
const BOKUHIKA = 'PL!-pb2-039';  // 僕たちはひとつの光
const SWEET = 'PL!-bp6-023';     // sweet&sweet holiday
const NIKO9 = 'PL!-pb2-009';     // 矢澤にこ（コスト9）
const MAKI17 = 'PL!-bp6-006';    // 西木野真姫（コスト17）
const ERI4 = 'PL!-bp5-002';      // 絢瀬絵里（コスト4）
const ANJU4 = 'PL!-bp5-222';     // 優木あんじゅ（コスト4）
const KOTORI15 = 'PL!-bp6-003';  // 南 ことり（コスト15）

export default {
  id: "muse-bokuhika-note",
  type: "僕光μ's",
  name: "僕光μ's（noteのレシピ）",
  code: "",
  lastPlaced: "2026/10/10",
  source: "https://note.com/izm_i7ll/n/nb94386d5cbad",
  list: [
    ["PL!-bp6-019", 4], // Music S.T.A.R.T!!（ライブ）
    ["PL!-pb2-038", 3], // 嵐のなかの恋だから（ライブ）
    ["PL!-bp6-023", 3], // sweet&sweet holiday（ライブ）
    ["PL!-pb2-039", 2], // 僕たちはひとつの光（ライブ）
    ["PL!-bp3-012", 2], // 南 ことり（コスト2）
    ["PL!-pb1-025", 4], // 東條 希（コスト2）
    ["PL!-pb2-035", 4], // 小泉花陽（コスト2）
    ["PL!-sd1-005", 2], // 星空 凛（コスト2）
    ["PL!-bp3-014", 4], // 星空 凛（コスト4）
    ["PL!-bp5-002", 4], // 絢瀬絵里（コスト4）
    ["PL!-bp5-222", 4], // 優木あんじゅ（コスト4）
    ["PL!-pb2-031", 2], // 園田海未（コスト4）
    ["PL!-pb2-009", 4], // 矢澤にこ（コスト9）
    ["PL!-bp6-013", 3], // 園田海未（コスト9）
    ["PL!-bp4-002", 2], // 絢瀬絵里（コスト15）
    ["PL!-bp6-003", 4], // 南 ことり（コスト15）
    ["PL!-sd1-009", 1], // 矢澤 にこ（コスト15）
    ["PL!-bp6-006", 4], // 西木野真姫（コスト17）
    ["PL!-pb2-001", 4], // 高坂穂乃果（コスト22）
  ],
  plan: {
    board: "4 → 9 → 17-2 → 17-9 → 17-17-2",
    score: "0 → 2 → 6 → 8 → 18（5Tに僕光で17〜18点）",
    mulligan: "Music S.T.A.R.T!!、9コス（できればにこ）、4絵里、あんじゅを優先。4コスは種類を問わず1枚はキープ",
    lives: "2T：Music S.T.A.R.T!!（2点）／3T：嵐のなかの恋だから（6点）／4T：嵐＋Music S.T.A.R.T!!（8点）か、しゃがんでsweet&sweet holidayでドロー／5T：僕たちはひとつの光（エール26枚・6外し許容で18点）",
    key: "17真姫（起動で手札補充・ブレード+3）、9にこ（17真姫へのバトンタッチで2エネ）、4あんじゅ（Music S.T.A.R.T!!を探す）、9海未（ライブ回収）",
    refs: ["https://note.com/izm_i7ll/n/nb94386d5cbad"],
  },
  // プレイ方針（noteより）
  // ・1T：4コス（絵里で9にこ、あんじゅでMusic S.T.A.R.T!!を探す）
  // ・2T：9にこを出してMusic S.T.A.R.T!!
  // ・3T：Music S.T.A.R.T!!でコスト-2の17真姫を9にこから（にこで2エネ起こして2コス）。嵐
  // ・4T：17真姫の起動のあと、2コスから9にバトンタッチ（9海未はライブ回収）
  // ・5T：17真姫の起動のあと、9から17真姫にバトンタッチ、余ったエネルギーで2コス。僕光
  strategy: {
    prefer: { hold: [{ from: 3, to: 5, ids: [MAKI17] }, { from: 3, to: 4, ids: [NIKO9, 'PL!-bp6-013'], cost: 9 }, { from: 1, to: 3, cost: 2 }] },
    mulliganOpt: {
      keep: [
        { ids: [MS], n: 1 },
        { ids: [NIKO9], n: 1, group: 'c9' }, { cost: 9, group: 'c9' },
        { ids: [MAKI17], n: 1 },
        { ids: [ERI4], n: 1, group: 'c4' }, { ids: [ANJU4], group: 'c4' }, { cost: 4, group: 'c4' },
      ],
    },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    // 4T：2コスから9へバトンタッチ（9にこ優先、次に9海未でライブ回収）／5T：17真姫の起動のあと、9から17真姫（いなければ15ことり）へ。余ったエネルギーで2コス
    script: {
      4: [{ oneOf: [{ play: { id: NIKO9 }, onto: { cost: 2 } }, { play: { id: 'PL!-bp6-013' }, onto: { cost: 2 } }, { play: { cost: 9 }, onto: { cost: 2 } }] }],
      5: [
        { oneOf: [{ play: { id: MAKI17 }, onto: { cost: 9 } }, { play: { id: KOTORI15 }, onto: { cost: 9 } }] },
        { play: { cost: 2 } },
      ],
    },
    turnPlan: {
      1: { board: [[4]] },
      2: { board: [[{ id: NIKO9 }], [9]], lives: [[MS]] },
      3: { board: [[{ id: MAKI17 }, 2], [17, 2]], lives: [[ARASHI]] },
      4: { board: [[{ id: MAKI17 }, 9], [17, 9]], lives: [[ARASHI, MS]] },
      5: { board: [[{ id: MAKI17 }, { id: MAKI17 }, 2], [17, 17, 2], [{ id: MAKI17 }, { id: KOTORI15 }, 2]], lives: [[BOKUHIKA]] },
    },
    liveOpt: {
      fill: true, fillMaxCost: 4, minP: 0.4, th1: 0.3,
      digFor: [
        { ids: [NIKO9], turns: [1], n: 3, keep: [MS, MAKI17], label: '9にこ', skipIfStage: true },
        { ids: [MS], turns: [1], n: 3, keep: [NIKO9, MAKI17], label: 'Music S.T.A.R.T!!' },
        { ids: [MAKI17], turns: [1, 2], n: 3, keep: [NIKO9, MS], label: '17真姫', skipIfStage: true },
      ],
    },
  },
};

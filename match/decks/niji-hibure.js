// 非ブレ虹ヶ咲（友人作・デッキコード 1BAYEG）
// レシピはデッキログのものそのまま。回し方は plan に書いたnote（桃軸の非ブレ虹ヶ咲）を基本形にしている。
const EMMA15 = 'PL!N-bp7-008';   // エマ・ヴェルデ（コスト15）
const EMMA17 = 'PL!N-pb1-008';   // エマ・ヴェルデ（コスト17）
const KANATA17 = 'PL!N-bp7-006'; // 近江彼方（コスト17）
const KANATA9 = 'PL!N-pb1-006';  // 近江彼方（コスト9）
const AI9 = 'PL!N-bp5-005';      // 宮下 愛（コスト9）
const SHIORIKO9 = 'PL!N-bp5-022'; // 三船栞子（コスト9）
const JB = 'PL!N-bp7-026';       // Just Believe!!!

export default {
  id: "niji-hibure",
  type: "非ブレ虹ヶ咲",
  name: "非ブレ虹ヶ咲（友人作）",
  code: "1BAYEG",
  lastPlaced: "",
  source: "https://decklog.bushiroad.com/view/1BAYEG",
  list: [
    ["PL!N-bp3-030", 2], // Love U my friends（ライブ）
    ["PL!N-bp5-026", 1], // TOKIMEKI Runners（ライブ）
    ["PL!N-bp7-026", 4], // Just Believe!!!（ライブ）
    ["PL!N-pb1-037", 2], // Cara Tesoro（ライブ）
    ["PL!S-bp5-020", 3], // Landing action Yeah!!（ライブ）
    ["PL!N-bp1-002", 2], // 中須かすみ（コスト2）
    ["PL!N-bp4-020", 3], // エマ・ヴェルデ（コスト2）
    ["PL!N-bp7-015", 1], // 桜坂しずく（コスト2）
    ["PL!N-PR-009", 1], // 優木せつ菜（コスト2）
    ["PL!N-PR-012", 2], // 三船栞子（コスト2）
    ["PL!N-sd1-011", 3], // ミア・テイラー（コスト2）
    ["PL!HS-bp6-001", 4], // 日野下花帆（コスト4）
    ["PL!N-bp5-009", 4], // 天王寺璃奈（コスト4）
    ["PL!N-bp7-018", 3], // 近江彼方（コスト4）
    ["PL!N-bp5-005", 3], // 宮下 愛（コスト9）
    ["PL!N-bp5-022", 2], // 三船栞子（コスト9）
    ["PL!N-pb1-006", 3], // 近江彼方（コスト9）
    ["PL!N-bp3-008", 1], // エマ・ヴェルデ（コスト13）
    ["PL!HS-PR-039", 1], // 百生吟子（コスト15）
    ["PL!N-bp1-012", 1], // 鐘 嵐珠（コスト15）
    ["PL!N-bp7-008", 4], // エマ・ヴェルデ（コスト15）
    ["PL!N-sd2-001", 1], // 上原歩夢（コスト15）
    ["PL!S-cl1-004", 1], // 黒澤ダイヤ（コスト15）
    ["PL!N-bp7-006", 4], // 近江彼方（コスト17）
    ["PL!N-pb1-008", 3], // エマ・ヴェルデ（コスト17）
    ["PL!N-sd2-010", 1], // 三船栞子（コスト17）
  ],
  plan: {
    board: "4（-2）→ 9 → 15エマ-4-2（9愛からバトンタッチ）→ 17彼方-15/9-2 → 17彼方-17-2",
    score: "（1・2Tはライブしない）→ 6 → 8〜11 → 15〜16",
    mulligan: "15エマ・9愛 ＞ 9コス（彼方・栞子）＞ 4コス ＞ Just Believe!!!。15エマは9コス・4コスが無くてもキープ",
    lives: "1T：ライブせず、非ブレを伏せて控え室へ／3T：Just Believe!!!（6点）／4T：Just Believe!!!＋α（9〜11点）／5T以降：15〜16点",
    key: "15エマ（控え室の非ブレを戻してエネルギーを起こす）、17彼方（3枚落としてエネルギー2かブレード2）、9愛（15エマへのバトンタッチでエネルギー2・1ドロー）",
    refs: ["https://note.com/tyomirin2/n/n9a8cb1c1a2cc"],
  },
  // プレイ方針（noteの回し方より）
  // ・マリガン：15エマ・9愛 ＞ 9コス ＞ 4コス ＞ Just Believe!!!
  // ・1〜2Tはライブをせず、空いた枠に不要なメンバー（非ブレ）を伏せて控え室に送る（15エマで戻すため）
  // ・3T：9愛 → 15エマ（バトンタッチ）、4コス、2コス でJust Believe!!!
  // ・4T以降：17彼方を出し、起動能力でエネルギーを起こして盤面を広げる
  strategy: {
    // fillPrefer：ライブフェイズで伏せて控え室に送りたいカード（ブレードハートを持たないメンバー。15エマで戻してエネルギーにする）
    // wantLives：2コストや栞子・歩夢で拾うライブ（主力のJust Believe!!!を優先）
    // protFill：空き枠を埋めるための2コストを手札に抱えない（4コスの登場時に手札を捨ててサーチする）
    prefer: { wantLives: [JB], fillPrefer: [EMMA15, KANATA17, KANATA9, AI9, SHIORIKO9, 'PL!N-sd2-010', 'PL!N-sd2-001'], protFill: false },
    mulliganOpt: {
      keep: [
        { ids: [EMMA15], n: 1 },
        { ids: [AI9], n: 1, group: 'nine' },
        { ids: [KANATA9, SHIORIKO9], group: 'nine' },
        { cost: 4, n: 1 },
        { ids: [JB], n: 1 },
      ],
    },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    turnPlan: {
      1: { board: [[4]] },
      2: { board: [[9]] },
      3: { board: [[{ id: EMMA15 }]], lives: [[JB]] },
      4: { board: [[{ id: KANATA17 }, 15], [{ id: KANATA17 }, 9], [{ id: KANATA17 }]] },
      5: { board: [[{ id: KANATA17 }, 17, 15], [{ id: KANATA17 }, 15]] },
    },
    liveOpt: { fill: true, fillMaxCost: 9, pace: [6, 9, 15], th1: 1.01, minP: 0.45 },
  },
};

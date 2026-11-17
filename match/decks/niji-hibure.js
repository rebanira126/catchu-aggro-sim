// 非ブレ虹（ファンミ第三幕 Day1 Aブロック Top4・デッキコード 1KF21S）
// レシピは公式サイトの入賞レシピそのまま。回し方は桃軸の非ブレ虹（note H・note D）と友人の回し方を元にしている。
// 友人のデッキ（niji-hibure-kento）との違い：17エマ・9彼方・9栞子・Cara Tesoro が無く、
// オードリー×4・9せつ菜（ライブ回収）・2果林/2栞子（ライブ回収）・2愛（メンバー回収）・4あんじゅで回す
const EMMA15 = 'PL!N-bp7-008';   // エマ・ヴェルデ（コスト15）
const KANATA17 = 'PL!N-bp7-006'; // 近江彼方（コスト17）
const AI9 = 'PL!N-bp5-005';      // 宮下 愛（コスト9）
const SETSUNA9 = 'PL!N-bp5-019'; // 優木せつ菜（コスト9）
const KANATA4 = 'PL!N-bp7-018';  // 近江彼方（コスト4）
const ANJU4 = 'PL!-bp5-222';     // 優木あんじゅ（コスト4）
const KAHO4 = 'PL!HS-bp6-001';   // 日野下花帆（コスト4）
const JB = 'PL!N-bp7-026';       // Just Believe!!!
const AUD = 'PL!N-bp7-027';      // オードリー
const EUTO = 'PL!N-bp1-029';     // Eutopia
const CDCS = 'PL!N-bp7-025';     // Colorful Dreams! Colorful Smiles!
const KOWARE = 'PL!S-bp6-024';   // コワレヤスキ
const TABI = 'PL!S-bp7-021';     // 僕らの旅は終わらない

const MID = [[{ id: KANATA17 }, 9, 2], [{ id: KANATA17 }, 9, 4], [{ id: KANATA17 }, 15, 2], [{ id: KANATA17 }, 9]];
const LATE = [[{ id: KANATA17 }, 15, 9], [{ id: KANATA17 }, 15, 2], [{ id: KANATA17 }, 15, 4], [{ id: KANATA17 }, 9, 2]];
const L4 = [[JB, AUD], [AUD, AUD], [JB, JB], [JB, CDCS], [AUD, CDCS]];
const L5 = [[JB, AUD, AUD], [JB, JB, AUD], [JB, AUD, EUTO], [JB, AUD], [AUD, AUD], [JB, AUD, CDCS], [JB, AUD, TABI], [JB, AUD, KOWARE]];

export default {
  id: "niji-hibure",
  type: "非ブレ虹",
  name: "非ブレ虹",
  code: "1KF21S",
  lastPlaced: "2026-11-08",
  source: "https://llofficial-cardgame.com/deckrecipe/fanmeeting202611_1a/",
  list: [
    ["PL!N-bp1-029", 1], // Eutopia（ライブ）
    ["PL!N-bp7-025", 1], // Colorful Dreams! Colorful Smiles!（ライブ）
    ["PL!N-bp7-026", 4], // Just Believe!!!（ライブ）
    ["PL!N-bp7-027", 4], // オードリー（ライブ）
    ["PL!S-bp6-024", 1], // コワレヤスキ（ライブ）
    ["PL!S-bp7-021", 1], // 僕らの旅は終わらない（ライブ）
    ["PL!N-bp4-017", 4], // 宮下 愛（コスト2）
    ["PL!N-PR-012", 4], // 三船栞子（コスト2）
    ["PL!N-sd2-016", 4], // 朝香果林（コスト2）
    ["PL!-bp5-222", 4], // 優木あんじゅ（コスト4）
    ["PL!HS-bp6-001", 4], // 日野下花帆（コスト4）
    ["PL!N-bp5-014", 2], // 中須かすみ（コスト4）
    ["PL!N-bp7-018", 4], // 近江彼方（コスト4）
    ["PL!N-sd2-017", 1], // 宮下 愛（コスト4）
    ["PL!N-bp5-005", 4], // 宮下 愛（コスト9）
    ["PL!N-bp5-019", 3], // 優木せつ菜（コスト9）
    ["PL!N-sd2-013", 1], // 上原歩夢（コスト9）
    ["PL!N-sd2-007", 2], // 優木せつ菜（コスト11）
    ["PL!N-bp1-012", 2], // 鐘 嵐珠（コスト15）
    ["PL!N-bp3-005", 1], // 宮下 愛（コスト15）
    ["PL!N-bp7-008", 4], // エマ・ヴェルデ（コスト15）
    ["PL!N-bp7-006", 4], // 近江彼方（コスト17）
  ],
  plan: {
    board: "4 → 9（愛） → 15エマ-4-2（9愛からバトンタッチ）→ 17彼方-9-2 → 17彼方-15-2 → 17彼方-15-9",
    score: "0 → 1〜2 → 6（Just Believe!!!）→ 8〜10（Just Believe!!!＋オードリー）→ 13〜16（ライブ3枚）",
    mulligan: "15エマ・9愛・4コス（彼方→あんじゅ→花帆）を1枚ずつ残す。ライブは基本すべて戻す",
    lives: "3T：Just Believe!!!（6点）／4T：Just Believe!!!＋オードリー（17彼方の起動でブレード+4してオードリー+1）／5T以降：Just Believe!!!＋オードリー×2 など3枚",
    key: "17彼方（エネルギー2を起こす／ブレード+2を2回でオードリーの条件）、15エマ・9愛（エネルギーを起こす）、9せつ菜・2果林・2栞子（ライブ回収）",
    refs: ["https://note.com/kozukozu1965023/n/n97e5e15a750f", "https://note.com/witch0528/n/nc67a25b20780"],
  },
  strategy: {
    prefer: {
      hold: [
        { from: 3, to: 4, ids: [AI9, SETSUNA9], cost: 9 },
        { from: 3, to: 5, ids: [EMMA15] },
      ],
      wantLives: [JB, AUD], wantMembers: [KANATA17, EMMA15, AI9],
      fillPrefer: [EMMA15, KANATA17, AI9, SETSUNA9], protFill: false },
    mulliganOpt: {
      keep: [
        { ids: [EMMA15], n: 1, group: 'e15' },
        { ids: [AI9], n: 1, group: 'nine' },
        { ids: [KANATA4], n: 1, group: 'four' },
        { ids: [ANJU4], group: 'four' },
        { ids: [KAHO4], group: 'four' },
      ],
    },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    turnPlan: {
      1: { board: [[4]] },
      2: { board: [[{ id: AI9 }], [9]] },
      3: { board: [[{ id: EMMA15 }]], lives: [[JB], [AUD]] },
      4: { board: MID, lives: L4 },
      5: { board: LATE, lives: L5 },
      6: { board: LATE, lives: L5 },
    },
    liveOpt: {
      digFor: { ids: [EMMA15], turns: [1, 2], n: 3, keep: [JB, AUD], label: '15エマ' },
      dummyTurns: [2], dummyMinLives: 2, fill: true, fillMaxCost: 9, pace: [6, 9, 12], th1: 1.01, minP: 0.45, planMinP: 0.45 },
  },
};

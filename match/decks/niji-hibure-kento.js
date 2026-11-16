// 非ブレ虹・検討デッキ（友人作・デッキコード 1BAYEG）
// レシピはデッキログのものそのまま。回し方は plan に書いたnote（桃軸の非ブレ虹ヶ咲）を基本形にしている。
const EMMA15 = 'PL!N-bp7-008';   // エマ・ヴェルデ（コスト15）
const EMMA17 = 'PL!N-pb1-008';   // エマ・ヴェルデ（コスト17）
const KANATA17 = 'PL!N-bp7-006'; // 近江彼方（コスト17）
const KANATA9 = 'PL!N-pb1-006';  // 近江彼方（コスト9）
const AI9 = 'PL!N-bp5-005';      // 宮下 愛（コスト9）
const SHIORIKO9 = 'PL!N-bp5-022'; // 三船栞子（コスト9）
const JB = 'PL!N-bp7-026';       // Just Believe!!!
const LOVEU = 'PL!N-bp3-030';    // Love U my friends
const TOKI = 'PL!N-bp5-026';     // TOKIMEKI Runners
const CARA = 'PL!N-pb1-037';     // Cara Tesoro
const KASUMI = 'PL!N-bp1-002';   // 中須かすみ（コスト2）
const RINA4 = 'PL!N-bp5-009';    // 天王寺璃奈（コスト4）
const KANATA4 = 'PL!N-bp7-018';  // 近江彼方（コスト4）
const KAHO4 = 'PL!HS-bp6-001';   // 日野下花帆（コスト4）
const LANDING = 'PL!S-bp5-020';  // Landing action Yeah!!

const FINAL = [
  [{ id: KANATA17 }, 9, { id: KASUMI }],
  [{ id: KANATA17 }, { id: SHIORIKO9 }, { id: KASUMI }],
  [{ id: EMMA17 }, { id: SHIORIKO9 }, { id: KASUMI }],
  [{ id: EMMA17 }, { id: KANATA9 }, { id: KASUMI }],
];
const LATE = [[17, 15, 9], [17, 15, 2]];
// 5T以降（友人の回し方）：Just Believe!!!かCara Tesoro（両方でもよい）を軸に、ライブを2〜3枚
const AXES = [JB, CARA];
const OTHERS = [JB, CARA, LOVEU, TOKI, LANDING];
const LATE_LIVES = (() => {
  const out = [];
  const seen = new Set();
  const add = combo => { const k = combo.slice().sort().join('+'); if (!seen.has(k)) { seen.add(k); out.push(combo); } };
  for (const a of AXES) for (const b of OTHERS) add([a, b]);
  for (const a of AXES) for (const b of OTHERS) for (const c of OTHERS) add([a, b, c]);
  return out;
})();
const FINAL_LIVES = [[JB, LOVEU], [JB, TOKI], [CARA, LOVEU], [CARA, TOKI]];

export default {
  id: "niji-hibure-kento",
  type: "非ブレ虹・検討デッキ",
  name: "非ブレ虹・検討デッキ（友人作）",
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
    board: "4（-2）→ 9 → 15エマ-4-2（9愛からバトンタッチ）→ 17彼方-9栞子-2かすみ ／ 17エマ-9栞子（9彼方）-2かすみ → 17-15-2（うまくいけば17-15-9）",
    score: "0 → 1〜2 → 6（Just Believe!!!）→ 9〜10（Just Believe!!!＋Love U・TOKIMEKI、Cara Tesoro＋Love U・TOKIMEKI）→ 12〜16（エールでブレードハートの無いカードが6枚くらい出ても成功する組み合わせ）",
    mulligan: "15エマ・9コス（愛→彼方→栞子）・4コス（璃奈→彼方→花帆）を1枚ずつ必ず残す。ライブは基本すべて戻す（15エマ・9コス・4コスがそろったときだけLanding action Yeah!!を1枚残してよい）",
    lives: "1・2T：15エマが手札に無ければライブカード置き場に3枚置いて3枚引き直す（Just Believe!!!は置かない）。2T：Landing action Yeah!!で1〜2点／3T：Just Believe!!!（6点。成功の見込みで打つかを決める）／4T：Just Believe!!!＋Love U my friends（10点）か Just Believe!!!＋TOKIMEKI Runners（9点）。17エマのときは Cara Tesoro＋Love U か Cara Tesoro＋TOKIMEKI／5T以降：Just Believe!!!かCara Tesoro（両方でもよい）を軸にライブ2〜3枚で12〜16点（足りないライブはライブ回収で拾う）",
    key: "17彼方（最大2回エネルギー2を起こす）、9栞子（ライブ回収）、2かすみ（控え室から登場）、17エマ（2Tに9彼方を出せば乗れる）、15エマ・9愛（エネルギーを起こす）",
    refs: ["https://note.com/tyomirin2/n/n9a8cb1c1a2cc"],
    // 4T・5Tの盤面とライブの組み合わせは、デッキを作った友人に教えてもらった回し方
  },
  // プレイ方針（noteの回し方より）
  // ・マリガン：15エマ・9愛 ＞ 9コス ＞ 4コス ＞ Just Believe!!!
  // ・1〜2Tはライブをせず、空いた枠に不要なメンバー（非ブレ）を伏せて控え室に送る（15エマで戻すため）
  // ・3T：9愛 → 15エマ（バトンタッチ）、4コス、2コス でJust Believe!!!
  // ・4T以降：17彼方を出し、起動能力でエネルギーを起こして盤面を広げる
  strategy: {
    // fillPrefer：ライブフェイズで伏せて控え室に送りたいカード（ブレードハートを持たないメンバー。15エマで戻してエネルギーにする）
    // wantLives：2コストや栞子・歩夢で拾うライブ（4T以降の組み合わせで使うライブ）
    // wantMembers：2コスト（メンバー回収）で拾うメンバー（4Tの盤面の9コスト）
    // protFill：空き枠を埋めるための2コストを手札に抱えない（4コスの登場時に手札を捨ててサーチする）
    prefer: {
      // 2コスト（かすみ優先）を2Tから1枚手札に残す。4T・5Tに必ず使う。かすみが控え室にあればそこから出すので残さなくてよい
      // 3Tから2枚目の9コスト（4Tの17-9-2用）、15エマ・17エマ（5Tの17-15-x用）も1枚ずつ残す
      hold: [
        { from: 2, to: 5, ids: [KASUMI], cost: 2, skipIfWaiting: [KASUMI] },
        { from: 3, to: 4, ids: [SHIORIKO9, AI9, KANATA9], cost: 9 },
        { from: 3, to: 5, ids: [EMMA15, EMMA17] },
      ],
      wantLives: [JB, LOVEU, TOKI, CARA], wantMembers: [SHIORIKO9, KANATA9], fillPrefer: [EMMA15, KANATA17, KANATA9, AI9, SHIORIKO9, 'PL!N-sd2-010', 'PL!N-sd2-001'], protFill: false },
    mulliganOpt: {
      // 友人の方針：15エマ・9コスト（愛→彼方→栞子）・4コスト（璃奈→彼方→花帆）を1枚ずつ必ず残す
      // ライブは基本すべて戻す。15エマ・9コスト・4コストがそろったときだけ Landing action Yeah!! を1枚残してよい
      keep: [
        { ids: [EMMA15], n: 1, group: 'e15' },
        { ids: [AI9], n: 1, group: 'nine' },
        { ids: [KANATA9], group: 'nine' },
        { ids: [SHIORIKO9], group: 'nine' },
        { ids: [RINA4], n: 1, group: 'four' },
        { ids: [KANATA4], group: 'four' },
        { ids: [KAHO4], group: 'four' },
        { ids: [LANDING], n: 1, ifGroups: ['e15', 'nine', 'four'] },
      ],
    },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    turnPlan: {
      1: { board: [[4]] },
      2: { board: [[9]], lives: [[LANDING]] },
      // 3T：15エマ（「15エマ＋4コスト」を目標にすると成績が下がったので15エマだけ）
      3: { board: [[{ id: EMMA15 }]], lives: [[JB]] },
      // 4T以降（友人の回し方）：17彼方-9栞子-2かすみ で Just Believe!!!＋Love U（10点）か Just Believe!!!＋TOKIMEKI（9点）
      // 17エマのときは 17エマ-9栞子-2かすみ か 17エマ-9彼方-2かすみ で Cara Tesoro＋Love U か Cara Tesoro＋TOKIMEKI
      4: { board: FINAL, lives: FINAL_LIVES },
      // 5T以降（友人の回し方）：17-15-2、うまくいけば17-15-9 で12〜16点
      5: { board: LATE, lives: LATE_LIVES },
      6: { board: LATE, lives: LATE_LIVES },
    },
    liveOpt: {
      // 1・2Tに15エマが手札に無ければ、ライブカード置き場に3枚置いて3枚引き直す（Just Believe!!!は置かない）
      digFor: { ids: [EMMA15], turns: [1, 2], n: 3, keep: [JB], label: '15エマ' },
      // 3T：友人は盤面スタッツ（ハートとブレードの合計）15未満なら温存するが、シミュレーターでは12〜14でも72%成功するため、
      // 温存はせず成功の見込みで決める（statMin は使わない）
      dummyTurns: [2], dummyMinLives: 2, fill: true, fillMaxCost: 9, pace: [6, 9, 12], th1: 1.01, minP: 0.45, planMinP: 0.45 },
  },
};

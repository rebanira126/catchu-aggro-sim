// 人魚Burn!!（13せつ菜型）：ラブカライフ！CUP Special Summer Sparkle 優勝（sZkさん）・推し活カップ全勝（明星さん）
// レシピは出典のnoteのリスト画像から読み取った（米女メイ・高海千歌・上原歩夢はユーザーさんに確認してもらった）。
//   リストのコスト分布（1〜3：17、4：14、9：7、10〜11：4、12〜15：6）とブレードハートの数（赤29・紫9・ALL8）は一致を確認
const DIVE = 'PL!N-bp4-026';    // DIVE!
const DM = 'PL!N-bp4-030';      // Daydream Mermaid
const CHASE = 'PL!N-bp5-028';   // CHASE!
const BURN = 'PL!N-bp7-029';    // Burn!!
const AI4 = 'PL!N-bp1-017';       // 宮下 愛（コスト4・赤青）
const SETSUNA4 = 'PL!N-sd2-019';  // 優木せつ菜（コスト4・登場で青+1・相手の2以下をウェイト）
const RINA4 = 'PL!N-bp5-009';     // 天王寺璃奈（コスト4・デッキの上5枚からコスト9以上の虹ヶ咲を探す）
const YOU4 = 'PL!S-bp2-014';      // 渡辺 曜（コスト4・赤青）
const SETSUNA9 = 'PL!N-bp3-007';  // 優木せつ菜（コスト9・起動[E][E]で手札の13以下のせつ菜に入れ替え、エネルギー1枚を下に）
const AI9 = 'PL!N-bp5-005';       // 宮下 愛（コスト9・13せつ菜にバトンタッチされるとエネルギー2枚アクティブ）
const SETSUNA11 = 'PL!N-bp7-007'; // 優木せつ菜（コスト11・下のエネルギーと7枚目以降のエネルギーで赤ハート）
const SETSUNA13 = 'PL!N-bp4-007'; // 優木せつ菜（コスト13・登場で控え室のライブを手札に・エネルギー合計15以上で赤+2）
const AYUMU15 = 'PL!N-bp3-001';   // 上原歩夢（コスト15・ライブ開始時にエネルギーを下に置いて1枚引き全員ブレード+2）
const SETSUNA2 = 'PL!N-PR-009';   // 優木せつ菜（コスト2・ライブ回収）
const SHIZUKU2 = 'PL!N-bp7-015';  // 桜坂しずく（コスト2・メンバー回収）
const RINA2 = 'PL!N-bp7-021';     // 天王寺璃奈（コスト2・ライブ回収）
const KANATA2 = 'PL!N-sd1-006';   // 近江彼方（コスト2・メンバー回収）
const MEI2 = 'PL!SP-pb1-018';    // 米女メイ（コスト2・ライブ回収）
const CHIKA2 = 'PL!S-PR-025';     // 高海千歌（コスト2・メンバー回収）

export default {
  id: "niji-mermaid-burn",
  type: "人魚Burn!!",
  name: "13せつ菜型（ラブカライフ！CUP優勝・明星さんのnote）",
  code: "",
  lastPlaced: "2026/08/16",
  source: "https://note.com/fine_eel3362/n/n89eea0137ea5",
  list: [
    [DIVE, 1], // DIVE!（ライブ・5点）
    [DM, 4], // Daydream Mermaid（ライブ・3点）
    [CHASE, 3], // CHASE!（ライブ・1点、赤4のメンバーがいれば3点）
    [BURN, 4], // Burn!!（ライブ・7点）
    [AI4, 4], // 宮下 愛（コスト4）
    [SETSUNA4, 4], // 優木せつ菜（コスト4）
    [RINA4, 4], // 天王寺璃奈（コスト4）
    [YOU4, 2], // 渡辺 曜（コスト4）
    [SETSUNA9, 4], // 優木せつ菜（コスト9）
    [AI9, 3], // 宮下 愛（コスト9）
    [SETSUNA11, 4], // 優木せつ菜（コスト11）
    [SETSUNA13, 4], // 優木せつ菜（コスト13）
    [AYUMU15, 2], // 上原歩夢（コスト15）
    [SETSUNA2, 4], // 優木せつ菜（コスト2）
    [SHIZUKU2, 4], // 桜坂しずく（コスト2）
    [RINA2, 2], // 天王寺璃奈（コスト2）
    [KANATA2, 3], // 近江彼方（コスト2）
    [MEI2, 3], // 米女メイ（コスト2）
    [CHIKA2, 1], // 高海千歌（コスト2）
  ],
  plan: {
    board: "4 → 9 → 13-4 → 13-11 / 13-13 → 13-13-11（3Tに13せつ菜が無ければ 11-4 → 11-9-2 → 11-13-4 → 11-13-13）",
    score: "1 → 1 → 3〜5 → 11 → 19",
    mulligan: "（noteに記載なし）1Tの4コスト、2Tの9コスト、13せつ菜、CHASE!を優先",
    lives: "1T：CHASE!（赤1要求）／2T：しゃがむ／3T：CHASE!（4枚めくって1枚当てる）／4T：CHASE!＋Burn!! か Daydream Mermaid＋Burn!!（19要求11点）／5T：Burn!!・Burn!!・CHASE!（33要求19点）か Burn!!・Burn!!（16点）",
    key: "9せつ菜の起動で13せつ菜に入れ替え（エネルギーを下に）、13せつ菜（ライブ回収・エネルギー+1）、Burn!!（下のエネルギーを戻してランプ）、9愛（13せつ菜にバトンタッチでエネルギー2枚）",
    refs: ["https://note.com/fine_eel3362/n/n89eea0137ea5"],
  },
  // プレイ方針（noteの回し方より）
  strategy: {
    mulliganOpt: { keep: [{ ids: [SETSUNA4, AI4, RINA4], n: 1 }, { ids: [SETSUNA9, AI9], n: 1 }, { ids: [SETSUNA13], n: 1 }, { ids: [DM], n: 1 }, { ids: [CHASE], n: 1 }, { ids: [SETSUNA11], n: 1, ifKeptLive: true }] },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    // 3TのDaydream Mermaid（13-4で4枚めくって紫1）を最優先で拾う
    prefer: { wantLives: [DM, CHASE, BURN] },
    // 11せつ菜は下にエネルギーがたまる（Burn!!で戻す）ので、バトンタッチで流さない
    lock: [{ id: SETSUNA11, fromTurn: 3 }],
    script: {
      // 1T：4せつ菜か4愛でCHASE!。4璃奈でサーチでもよい
      1: [{ oneOf: [{ play: { id: SETSUNA4 } }, { play: { id: AI4 } }, { play: { id: RINA4 } }, { play: { cost: 4 } }] }],
      // 2T：9せつ菜か9愛でしゃがむ
      2: [{ oneOf: [{ play: { id: SETSUNA9 }, onto: { cost: 4 } }, { play: { id: AI9 }, onto: { cost: 4 } }, { play: { cost: 9 }, onto: { cost: 4 } }] }],
      // 3T：9せつ菜の起動か9愛へのバトンタッチで13せつ菜、空いたエリアに4コスト
      3: [
        { oneOf: [{ activate: { id: SETSUNA9 } }, { play: { id: SETSUNA13 }, onto: { id: AI9 } }, { play: { id: SETSUNA13 }, onto: { cost: 9 } }] },
        { play: { cost: 4 } },
      ],
      // 4T：4から11せつ菜（13-11）か、9せつ菜の起動で13（13-13）
      4: [{ oneOf: [{ play: { id: SETSUNA11 }, onto: { cost: 4 } }, { activate: { id: SETSUNA9 } }, { play: { id: SETSUNA13 }, onto: { cost: 9 } }] }],
      // 5T：9せつ菜を経由して 13-13-11
      5: [{ activate: { id: SETSUNA9 } }],
    },
    turnPlan: {
      1: { board: [[4]], lives: [[CHASE]] },
      2: { board: [[9]], lives: [] },
      3: { board: [[13, 4]], lives: [[DM], [CHASE]] },
      4: { board: [[13, 11], [13, 13]], lives: [[CHASE, BURN], [DM, BURN]] },
      5: { board: [[13, 13, 11]], lives: [[BURN, BURN, CHASE], [BURN, BURN]] },
    },
    // 1TのCHASE!は「1枚めくって赤1」（約半分）でも置く
    liveOpt: { fill: true, fillMaxCost: 4, minP: 0.4, th1: 0.3, tryLives: { 1: [CHASE] },
      // 2Tはしゃがむ（CHASE!を3Tの13-4に残す）
      statMin: { 2: 99 },
      // 手札交換：1T・2Tは3TのDaydream Mermaidと13せつ菜を探す
      digFor: [{ ids: [DM], turns: [1, 2], n: 3, keep: [SETSUNA13, SETSUNA9, AI9, SETSUNA11, CHASE], label: 'Daydream Mermaid' }, { ids: [SETSUNA13], turns: [1, 2], n: 3, keep: [DM, SETSUNA9, AI9, SETSUNA11, CHASE], label: '13せつ菜' }] },
  },
};

// Burn!!（虹ヶ咲）：北陸エリア予選 入賞（人魚Burn!!）
// レシピは出典の入賞レシピ（デッキコード）そのまま。回し方は plan に書いたnoteの内容を目安にしている。
const CD = 'PL!SP-bp4-027';      // Chance Day, Chance Way!
const DM = 'PL!N-bp4-030';      // Daydream Mermaid
const BURN = 'PL!N-bp7-029';    // Burn!!
const LOVEU = 'PL!N-bp3-030';   // Love U my friends
const SETSUNA11 = 'PL!N-bp7-007'; // 優木せつ菜（コスト11）
const SETSUNA2 = 'PL!N-PR-009';   // 優木せつ菜（コスト2・赤ハート・ライブ回収）
const RUBY2 = 'PL!S-bp2-009';     // 黒澤ルビィ（コスト2・赤ハート）
const CHISATO2 = 'PL!SP-pb1-014'; // 嵐 千砂都（コスト2・紫ハート・2ブレード）
const ERI2 = 'PL!-bp5-011';       // 絢瀬絵里（コスト2・2ブレード・成功ライブ1枚ごとに好きな色）
const SANSHIN = 'LL-bp7-001';     // 国木田花丸&優木せつ菜&嵐 千砂都（手札の3人を捨ててコスト10）
const KARIN4 = 'PL!N-bp7-016';    // 朝香果林（コスト4・3ブレード・ライブ開始時に好きな色+1）
const CERES4 = 'PL!HS-PR-022';    // セラス（コスト4・紫ハート2）

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
  // プレイ方針（noteの回し方より）
  // ・マリガン：コスト2を2枚、Chance Day, Chance Way!、Daydream Mermaid、11優木せつ菜
  strategy: {
    // ライブが無い手札は、2コストの2枚目と11せつ菜も戻してライブを探す（brave_fairyさんの振り返りより）
    mulliganOpt: { keep: [{ ids: [CD], n: 1 }, { ids: [DM], n: 1 }, { cost: 2, n: 1 }, { cost: 2, n: 1, ifKeptLive: true }, { ids: [KARIN4], n: 1 }, { ids: [SETSUNA11], n: 1, ifKeptLive: true }] },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    // 手札にDaydream Mermaidが無ければ、2せつ菜（ライブ回収）で控え室から拾う（4T：エネルギーが足りなければ回収してDMでしゃがむ）
    prefer: { wantLives: [DM] },
    // 1T：Chance Day, Chance Way!（赤1）のために赤の2コスと、2Tの Daydream Mermaid（青1紫3）のためにブレードの多い2コス
    // 2T：4果林（3ブレード・好きな色）かセラス（紫2）を足して Daydream Mermaid
    script: {
      1: [{ oneOf: [{ play: { id: SETSUNA2 } }, { play: { id: RUBY2 } }, { play: { cost: 2 } }] }, { oneOf: [{ play: { id: CHISATO2 } }, { play: { id: ERI2 } }, { play: { cost: 2 } }] }],
      2: [{ oneOf: [{ play: { id: KARIN4 } }, { play: { id: CERES4 } }, { play: { cost: 4 } }] }],
      // 3T：4から11せつ菜（Daydream Mermaidでランプして7エネのとき）か、メロモ三神（手札の3人を捨ててコスト10→4からなら6エネ）
      3: [{ oneOf: [{ play: { id: SETSUNA11 }, onto: { cost: 4 } }, { play: { id: SANSHIN }, onto: { cost: 4 } }] }],
    },
    turnPlan: {
      1: { board: [[2, 2], [4]], lives: [[CD]] },
      2: { board: [[4, 2, 2]], lives: [[DM]] },
      3: { board: [[11, 2, 2]], lives: [[BURN]] },
      4: { board: [[15, 2, 2], [11, 11, 2]], lives: [[BURN, LOVEU], [BURN]] },
      5: { board: [[15, 11, 2]], lives: [[BURN, LOVEU], [BURN, BURN]] },
    },
    liveOpt: {
      fill: true, fillMaxCost: 4, minP: 0.4, th1: 0.3,
      // 手札交換：1Tは4果林（2TのDaydream Mermaidに要る3ブレード）を探す
      digFor: [{ ids: [KARIN4], turns: [1], n: 3, keep: [DM, SETSUNA11, CHISATO2, ERI2], label: '4朝香果林' }],
    },
  },
};

// Aqours系（恋アク）：九州・沖縄エリア予選 入賞（恋アクAqours）
// レシピは出典の入賞レシピ（デッキコード）そのまま。回し方は plan に書いたnoteの内容を目安にしている。
const GN = 'PL!S-bp7-025';        // Guilty Night, Guilty Kiss!
const MW = 'PL!S-bp3-019';        // MIRACLE WAVE
const KOIAQ = 'PL!S-bp7-022';     // 恋になりたいAQUARIUM
const KOWARE = 'PL!S-bp6-024';    // コワレヤスキ
const YOSHIKO13 = 'PL!S-bp3-006'; // 津島善子（コスト13）

export default {
  id: "aqours-koiaq",
  type: "Aqours系（恋アク）",
  name: "九州・沖縄エリア予選 入賞（恋アクAqours）",
  code: "1ATFMN",
  lastPlaced: "2026/11/03",
  source: "https://llofficial-cardgame.com/deckrecipe/area2026kyushuokinawa/",
  list: [
    ["PL!S-bp3-019", 1], // MIRACLE WAVE（ライブ）
    ["PL!S-bp6-024", 2], // コワレヤスキ（ライブ）
    ["PL!S-bp7-020", 1], // HAPPY PARTY TRAIN（ライブ）
    ["PL!S-bp7-022", 4], // 恋になりたいAQUARIUM（ライブ）
    ["PL!S-bp7-025", 4], // Guilty Night, Guilty Kiss!（ライブ）
    ["PL!S-bp2-009", 2], // 黒澤ルビィ（コスト2）
    ["PL!S-bp2-016", 3], // 国木田花丸（コスト2）
    ["PL!S-cl1-009", 1], // 黒澤ルビィ（コスト2）
    ["PL!S-sd1-015", 4], // 津島善子（コスト2）
    ["PL!-bp5-222", 4], // 優木あんじゅ（コスト4）
    ["PL!S-bp5-006", 3], // 津島善子（コスト4）
    ["PL!S-bp6-016", 3], // 国木田花丸（コスト4）
    ["PL!S-cl1-008", 4], // 小原鞠莉（コスト4）
    ["PL!HS-pb1-013", 3], // 徒町小鈴（コスト9）
    ["PL!S-bp7-001", 4], // 高海千歌（コスト9）
    ["PL!S-bp7-007", 4], // 国木田花丸（コスト11）
    ["PL!S-bp2-005", 4], // 渡辺 曜（コスト13）
    ["PL!S-bp3-006", 4], // 津島善子（コスト13）
    ["PL!S-bp5-003", 1], // 松浦果南（コスト13）
    ["PL!S-bp7-005", 3], // 渡辺 曜（コスト15）
    ["PL!S-cl1-004", 1], // 黒澤ダイヤ（コスト15）
  ],
  plan: {
    board: "4 → 9 → 13（センターウェイト）-4 → 13-13-2 → 15-15-2 → 15-15-9（13善子進行）",
    score: "0 → 3 → 3 → 9〜10 → 14〜16 → 18",
    mulligan: "1Tの4コス（優木あんじゅ優先）、9コス（千歌・徒町）、Guilty Night, Guilty Kiss!",
    lives: "2T・3T：Guilty Night, Guilty Kiss!（3点）／4T：Guilty Night＋MIRACLE WAVE（9〜10点）／5T：恋になりたいAQUARIUM＋MIRACLE WAVE かコワレヤスキ（14〜16点）／6T：恋アク×2（18点）",
    key: "13津島善子（コスト踏み倒し）、15渡辺曜（スタッツ増・非ブレ減らし）、11国木田花丸（2コス回収）",
    refs: ["https://note.com/blackriver_1111/n/n84f7e0a45946", "https://note.com/mute_tern875/n/n3ae00c719e10"],
  },
  // プレイ方針の上書き（まだ標準の方針のまま）
  // プレイ方針（仮。7デッキの効果がそろったので、あとでnoteの回し方に合わせて調整する）
  // ・マリガン：コスト9まで、コスト2は2枚、必要ハート6以下のライブを1枚残す
  // ・ライブ置き場の空き枠にコスト4以下のメンバーを伏せて引き直す
  strategy: {
    mulliganOpt: { keepCost: 9, maxLives: 1, maxNeed: 6, maxLow: 2 },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    // ターンごとの目標（13善子進行のnoteより）
    turnPlan: {
      1: { board: [[4]] },
      2: { board: [[9]], lives: [[GN]] },
      3: { board: [[{ id: YOSHIKO13, area: 1 }, 4], [{ id: YOSHIKO13, area: 1 }, 2]], lives: [[GN]] },
      4: { board: [[13, 13, 2]], lives: [[GN, MW]] },
      5: { board: [[15, 15, 2], [15, 15, 4]], lives: [[KOIAQ, MW], [KOIAQ], [KOWARE]] },
      6: { board: [[15, 15, 9]], lives: [[KOIAQ, KOIAQ]] },
    },
    // MIRACLE WAVE は、4ターン目に Guilty Night, Guilty Kiss! と、5ターン目に恋になりたいAQUARIUM と一緒に置くときだけ使う
    // （盤面ハート＋ブレードハートが必要ハートとほぼ同じになり、余剰ハートが出にくい）
    liveOpt: {
      fill: true, fillMaxCost: 4, minP: 0.4, th1: 0.3,
      onlyCombos: { 'PL!S-bp3-019': [{ turn: 4, with: ['PL!S-bp7-025'] }, { turn: 5, with: ['PL!S-bp7-022'] }] },
    },
  },
};

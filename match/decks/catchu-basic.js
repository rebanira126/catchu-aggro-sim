// CatChu!：基本形（花帆作）
// レシピは出典の入賞レシピ（デッキコード）そのまま。回し方は plan に書いたnoteの内容を目安にしている。
// 4T以降の目標のライブ（11かのんのライブ成功時効果：エネルギー6枚でライブの合計スコア+1）
//  4T：新ディストーション＋START!!（6＋1＋1＝8点、11かのんで9点）か、旧ディストーション2枚＋11かのん（4＋4＋1＝9点）
//  5T・6T：新ディストーション＋旧ディストーション＋11かのん（7＋4＋1＝12点）
const DIST_NEW = 'PL!SP-pb2-048'; // ディストーション（6点）
const DIST_OLD = 'PL!SP-pb1-023'; // ディストーション（3点）
const START = 'PL!SP-bp7-023';    // START!! True dreams
const LATE_LIVES = [[DIST_NEW, DIST_OLD]];

export default {
  id: "catchu-basic",
  type: "CatChu!",
  name: "基本形（花帆作）",
  code: "",
  lastPlaced: "－",
  source: "自作（CatChu!アグロシミュレーター）",
  list: [
    ["PL!SP-bp4-027", 1], // Chance Day, Chance Way!（ライブ）
    ["PL!SP-bp7-023", 4], // START!! True dreams（ライブ）
    ["PL!SP-pb1-023", 4], // ディストーション（ライブ）
    ["PL!SP-pb2-048", 3], // ディストーション（ライブ）
    ["PL!SP-bp1-005", 4], // 葉月 恋（コスト2）
    ["PL!SP-bp4-015", 4], // 平安名すみれ（コスト2）
    ["PL!SP-bp5-012", 4], // 澁谷かのん（コスト2）
    ["PL!SP-pb1-018", 4], // 米女メイ（コスト2）
    ["PL!SP-pb2-004", 4], // 平安名すみれ（コスト2）
    ["PL!SP-pb2-012", 1], // 澁谷かのん（コスト2）
    ["PL!SP-pb2-018", 4], // 米女メイ（コスト2）
    ["PL!SP-sd1-020", 4], // 鬼塚夏美（コスト2）
    ["PL!SP-pb1-014", 1], // 嵐 千砂都（コスト2）
    ["PL!SP-bp2-007", 2], // 米女メイ（コスト5）
    ["PL!SP-pb2-037", 4], // 平安名すみれ（コスト5）
    ["PL!SP-pb1-001", 4], // 澁谷かのん（コスト11）
    ["PL!SP-pb2-007", 4], // 米女メイ（コスト11）
    ["PL!SP-pb2-015", 4], // 平安名すみれ（コスト13）
  ],
  plan: {
    board: "2-2 → 5-2-2 → 11-2-2",
    score: "1 → 4 → 7（3ターン勝利優先）→ 4T 8〜9 → 5T・6T 12",
    mulligan: "5コス（すみれ／メイ）を1枚、2コスを1枚（恋を優先）残す。どちらかがあれば1T用のライブ（START!! True dreams／Chance Day, Chance Way!）1枚と3点ディストーション1枚も残す（どちらも無ければほかは残さない）",
    lives: "1T：2コスト2枚＋Chance Day／START!!、2T：5コスト＋ディストーション（pb1-023）、3T：11コストにバトンタッチ＋ディストーション（pb2-048）／4T：新ディストーション＋START!!（8点）か旧ディストーション2枚＋11かのんのライブ成功時効果（9点）／5T・6T：新ディストーション＋旧ディストーション＋11かのん（12点）",
    key: "自作の基本形（このプロジェクトで作成）",
    refs: [],
  },
  // プレイ方針（旧CatChu!シミュレーターと結果がほぼ同じになるよう調整）
  // ・マリガン：下の mulliganOpt.keep（5コスト1枚 → 2コスト1枚（恋優先） → それらがあれば1Tライブ1枚・3点ディストーション）
  // ・盤面：CatChu!の名前の種類を揃える（ディストーションが強くなる）。同じ盤面ならカードを使わない方
  // ・ライブ：1→4→7点の進行をねらう。空いた枠には不要なメンバーを伏せて引き直す
  // ・6点のディストーションは2ターン目から1枚残す
  strategy: {
    prefer: { unit: 'CatChu!', w: 1, bigLive: 6 },
    // マリガン（2026-11 ひとり回しで16通りを比べて決めた。claude/catchu_mulligan_2026-11.md）
    //  1. 5コスト（米女メイ・平安名すみれ）を1枚。これが無いと2ターン目以降に何もできない
    //  2. 2コストを1枚（葉月 恋を優先、無ければほかの2コスト）。1Tに1人しか出せない手札を減らす
    //  3. 上の2つが1枚も無ければ、ほかのカードは残さない
    //     上の2つがあれば、1T用のライブ（START!! True dreams／Chance Day, Chance Way!）1枚と3点のディストーション1枚を残す
    //     （1Tのライブの成功が上がり、2Tに4点を出しやすくなる）
    mulliganOpt: {
      keep: [
        { ids: ['PL!SP-bp2-007', 'PL!SP-pb2-037'], n: 1 },
        { ids: ['PL!SP-bp1-005'], n: 1, group: 'c2' },
        { cost: 2, n: 1, group: 'c2' },
        { ids: ['PL!SP-bp7-023', 'PL!SP-bp4-027'], n: 1, ifKept: true },
        { ids: ['PL!SP-pb1-023'], n: 1, ifKept: true },
      ],
    },
    mainOpt: { playPen: 0.3, unitBonus: { unit: 'CatChu!', w: 0.8 }, topK: 60 },
    turnPlan: {
      4: { lives: [[DIST_NEW, START], [DIST_OLD, DIST_OLD]] },
      5: { lives: LATE_LIVES },
      6: { lives: LATE_LIVES },
    },
    liveOpt: { fill: true, pace: [1, 4, 7], minP: 0.5, th1: 0.3, thLast: 0.15 },
  },
};

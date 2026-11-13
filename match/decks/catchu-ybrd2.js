// CatChu!：ファンミ第三幕 Day2 Bブロック Top4
// レシピは出典の入賞レシピ（デッキコード）そのまま。回し方は plan に書いたnoteの内容を目安にしている。
export default {
  id: "catchu-ybrd2",
  type: "CatChu!",
  name: "ファンミ第三幕 Day2 Bブロック Top4",
  code: "YBRD2",
  lastPlaced: "2026/11/08",
  source: "https://llofficial-cardgame.com/deckrecipe/fanmeeting202611_2b/",
  list: [
    ["PL!SP-bp7-023", 4], // START!! True dreams（ライブ）
    ["PL!SP-pb1-023", 4], // ディストーション（ライブ）
    ["PL!SP-pb2-048", 4], // ディストーション（ライブ）
    ["PL!SP-bp1-005", 4], // 葉月 恋（コスト2）
    ["PL!SP-bp4-015", 4], // 平安名すみれ（コスト2）
    ["PL!SP-bp4-019", 4], // 若菜四季（コスト2）
    ["PL!SP-pb1-018", 4], // 米女メイ（コスト2）
    ["PL!SP-pb2-004", 4], // 平安名すみれ（コスト2）
    ["PL!SP-pb2-012", 3], // 澁谷かのん（コスト2）
    ["PL!SP-pb2-018", 4], // 米女メイ（コスト2）
    ["PL!SP-sd1-020", 4], // 鬼塚夏美（コスト2）
    ["PL!SP-bp2-007", 4], // 米女メイ（コスト5）
    ["PL!SP-pb2-037", 2], // 平安名すみれ（コスト5）
    ["PL!SP-pb1-001", 4], // 澁谷かのん（コスト11）
    ["PL!SP-pb2-007", 3], // 米女メイ（コスト11）
    ["PL!SP-pb2-015", 4], // 平安名すみれ（コスト13）
  ],
  plan: {
    board: "2-2 → 5-2-2 → 11-2-2（バトンタッチ）→ 11-5-2 / 13",
    score: "1 → 4 → 7 → 8（1-4-7が理想）",
    mulligan: "5コス（すみれ／メイ）を最優先、次に2コス恋。どちらかがあればSTART!! True dreams・3点ディストーション・2コスメイも残す（どちらも無ければほかは残さない）",
    lives: "1T：START!! True dreams（1点）／2T：ディストーション（3点＋1）／3T：ディストーション（6点＋1）／4T以降は打点が伸びにくい",
    key: "11澁谷かのん、11米女メイ、13平安名すみれ（CatChu!名称の人数でディストーションが強化）",
    refs: ["https://note.com/happy_sloth5502/n/n9041888e2147", "https://note.com/brave_fairy8464/n/n4ce2ef4e0c96", "https://note.com/poke_lovelive/n/nbfe1b972d27f"],
  },
  // プレイ方針（旧CatChu!シミュレーターと結果がほぼ同じになるよう調整）
  // ・マリガン：下の mulliganOpt.keep（5コスト → 2コスト恋 → それらがあればSTART!!・3点ディストーション・2コストメイ）
  // ・盤面：CatChu!の名前の種類を揃える（ディストーションが強くなる）。同じ盤面ならカードを使わない方
  // ・ライブ：1→4→7点の進行をねらう。空いた枠には不要なメンバーを伏せて引き直す
  // ・6点のディストーションは2ターン目から1枚残す
  strategy: {
    prefer: { unit: 'CatChu!', w: 1, bigLive: 6 },
    // マリガン（CatChu!を使っている人の基準）
    //  1. 5コスト（米女メイ・平安名すみれ）を最優先。これが無いと2ターン目以降に何もできない
    //  2. 次に2コストの葉月 恋（START!!の成功や、5コストを引けないときに役立つ）
    //  3. 上の2つが1枚も無ければ、ほかのカードは残さない
    //     上の2つがあれば、START!! True dreams・3点のディストーション・2コストの米女メイを残してよい
    mulliganOpt: {
      keep: [
        { ids: ['PL!SP-bp2-007', 'PL!SP-pb2-037'], n: 1 },
        { ids: ['PL!SP-bp1-005'], n: 1 },
        { ids: ['PL!SP-bp7-023'], n: 1, ifKept: true },
        { ids: ['PL!SP-pb1-023'], n: 1, ifKept: true },
        { ids: ['PL!SP-pb1-018', 'PL!SP-pb2-018'], n: 1, ifKept: true },
      ],
    },
    mainOpt: { playPen: 0.3, unitBonus: { unit: 'CatChu!', w: 0.8 }, topK: 60 },
    liveOpt: { fill: true, pace: [1, 4, 7], minP: 0.5, th1: 0.3, thLast: 0.15 },
  },
};

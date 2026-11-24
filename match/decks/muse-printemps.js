// Printemps（μ's）
// レシピと回し方：劉茶さん「【ラブカ】新ことりで更なる安定感！Printemps」（2026-11-23） https://note.com/liucha1122/n/n343727b5d05c
// レシピは記事の画像から読み取った（公式カードリストの画像と照合）
const KOTORI4 = 'PL!-bp8-003';   // 南ことり（4）：ウェイトのμ'sはバトンタッチで「コスト+1」減る／起動で手札入れ替え
const KOTORI13N = 'PL!-pb2-012'; // 南 ことり（13・新）：2人ウェイトでコスト-2／起動でPrintempsのライブ回収
const KOTORI13O = 'PL!-pb1-003'; // 南 ことり（13・旧）：登場時ウェイト→Printemps1人につきエネルギー1枚アクティブ
const HONOKA2 = 'PL!-pb2-028';   // 高坂穂乃果（2）：ライブ開始時ウェイト→黄+1
const HONOKA7 = 'PL!-pb2-010';   // 高坂穂乃果（7）
const HANAYO15 = 'PL!-bp3-008';  // 小泉花陽（15）
const HANAYO17 = 'PL!-pb2-017';  // 小泉花陽（17）
const SAYO = 'PL!-bp4-024';      // 小夜啼鳥恋詩（2点）
const HELLO = 'PL!-bp8-022';     // Hello,星を数えて（3点）
const WAO = 'PL!-pb1-028';       // WAO-WAO Powerful day!（5点）
const LM = 'PL!-pb2-040';        // Love marginal（7点）

export default {
  id: 'muse-printemps',
  type: "Printemps（μ's）",
  name: 'Printemps',
  code: '',
  lastPlaced: '－',
  source: 'https://note.com/liucha1122/n/n343727b5d05c',
  list: [
    [SAYO, 4], // 小夜啼鳥恋詩（ライブ）
    [HELLO, 2], // Hello,星を数えて（ライブ）
    [WAO, 4], // WAO-WAO Powerful day!（ライブ）
    [LM, 2], // Love marginal（ライブ）
    ['PL!-bp3-012', 4], // 南 ことり（コスト2）
    ['PL!-bp4-017', 4], // 小泉花陽（コスト2）
    ['PL!-pb1-019', 4], // 高坂穂乃果（コスト2）
    ['PL!-pb2-008', 4], // 小泉花陽（コスト2）
    [HONOKA2, 4], // 高坂穂乃果（コスト2）
    [KOTORI4, 4], // 南ことり（コスト4）
    ['PL!-pb2-019', 4], // 高坂穂乃果（コスト4）
    [HONOKA7, 4], // 高坂穂乃果（コスト7）
    [KOTORI13O, 4], // 南 ことり（コスト13・旧）
    [KOTORI13N, 4], // 南 ことり（コスト13・新）
    [HANAYO15, 4], // 小泉花陽（コスト15）
    [HANAYO17, 4], // 小泉花陽（コスト17）
  ],
  plan: {
    board: "1T 4ことり（手札入れ替え）か2-2 → 2T 4-7 → 3T 2人ウェイトで新13ことり（13-2-2）→ 4T 13ことり起動のあと15花陽・7穂乃果（15-7-2）→ 5T 17花陽へ → 13-17-17",
    score: '（2）→ 6（WAO-WAO）→ 10（WAO-WAO＋Hello）→ 13〜15 → 18',
    mulligan: '4ことり・2コス・7穂乃果、WAO-WAO',
    lives: '1T：2穂乃果2人なら小夜啼鳥恋詩（2点）／3T：WAO-WAO（3人起こして6点）／4T：WAO-WAO＋Hello,星を数えて／5T〜：Love marginalを足す',
    key: "メンバーをウェイトにして（コスト・ハート・ライブ回収）、ライブ開始時にWAO-WAOや17花陽でアクティブに戻す。4ことりがいれば、ウェイトのμ'sからのバトンタッチでコストが1多く減る",
    refs: ['https://note.com/liucha1122/n/n343727b5d05c'],
  },
  strategy: {
    prefer: { wantLives: [WAO, HELLO, LM], keepLive: [WAO, { id: SAYO, to: 2 }] }, // WAO-WAOと、2Tまでは小夜啼鳥恋詩を1枚ずつ残す
    mulliganOpt: {
      keep: [
        { ids: [KOTORI4], n: 1 },
        { ids: [HONOKA7], n: 1 },
        { ids: [WAO], n: 1 },
      ],
    },
    mainOpt: { playPen: 0.3, topK: 60 },
    turnPlan: {
      1: { board: [[4], [2, 2]], lives: [[SAYO]] },
      // 2T：7穂乃果＋2コスト（小夜啼鳥恋詩の5ハートに届く盤面）。1Tの手札交換で2コストを残す
      2: { board: [[7, 2, 2], [7, 2], [4, 2, 2], [4, 7]], lives: [[SAYO]] },
      3: { board: [[13, 7], [13, 4], [13, 2, 2]], lives: [[WAO]] },
      4: { board: [[15, 13, 7], [13, 13, 7], [15, 13, 2]], lives: [[WAO, HELLO], [WAO, SAYO], [WAO]] },
      5: { board: [[17, 13, 7], [15, 13, 7]], lives: [[LM, WAO], [WAO, HELLO], [LM, HELLO]] },
      6: { board: [[17, 17, 13], [17, 13, 7]], lives: [[LM, LM, HELLO], [LM, WAO, HELLO], [LM, WAO]] },
    },
    script: {
      // 2T：7穂乃果を出す（4ことりを起動でウェイトにしてからバトンタッチすると、2エネルギーで出せる）
      2: [{ oneOf: [{ play: { id: HONOKA7 }, onto: { id: KOTORI4 }, ontoWait: true }, { play: { id: HONOKA7 }, onto: { cost: 2 } }, { play: { id: HONOKA7 } }] }],
      // 3T：2人ウェイトで新13ことり（7穂乃果からバトンタッチ）。無ければ旧13ことり
      3: [{ oneOf: [
        { play: { id: KOTORI13N }, onto: { id: HONOKA7 } },
        { play: { id: KOTORI13N }, onto: { id: KOTORI4 }, ontoWait: true },
        { play: { id: KOTORI13O }, onto: { id: HONOKA7 } },
        { play: { id: KOTORI13N }, onto: { cost: 4 } },
      ] }],
      // 4T（noteの盤面 15花陽・7穂乃果・2ことり）：13ことりの起動（2コス2人をウェイト）でライブを拾ってから、
      // ウェイトの13ことりから15花陽、2コス（2ことり以外）から7穂乃果へバトンタッチ。15花陽と7穂乃果が手札にあるときだけ
      4: [
        { activate: { id: KOTORI13N }, ifHand: [{ id: HANAYO15 }, { id: HONOKA7 }] },
        { oneOf: [{ play: { id: HANAYO15 }, onto: { id: KOTORI13N }, ontoWait: true }] },
        { oneOf: [{ play: { id: HONOKA7 }, onto: { ids: ['PL!-pb2-008', 'PL!-bp4-017', 'PL!-pb1-019', HONOKA2] } }, { play: { id: HONOKA7 }, onto: { cost: 2 } }] },
      ],
    },
    // 1〜3Tは、ライブカード置き場に伏せて引き直して探す（4ことりは残す）
    //  優先：新13ことり（1〜2T）→ 7穂乃果（1〜2T）→ 小夜啼鳥恋詩（1T・2Tのライブ用）→ WAO-WAO（1〜3T）
    liveOpt: {
      fill: true, pace: [2, 6, 10], minP: 0.45, th1: 0.3, thLast: 0.15,
      digFor: [
        { ids: [KOTORI13N], turns: [1, 2], n: 3, keep: [HONOKA7, KOTORI4], label: '新13ことり' },
        { ids: [HONOKA7], turns: [1, 2], n: 3, keep: [KOTORI13N, KOTORI4], label: '7穂乃果' },
        { ids: [SAYO], turns: [1], n: 3, keep: [KOTORI13N, HONOKA7, KOTORI4], label: '小夜啼鳥恋詩' },
        { ids: [WAO], turns: [1, 2, 3], n: 3, keep: [KOTORI13N, HONOKA7, KOTORI4], label: 'WAO-WAO' },
      ],
    },
  },
};

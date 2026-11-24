// カレスコランプ（常夏）
// レシピと回し方：つきみやさん「ウエイト無効化！4t12エネの暴力！ラブカ秋選抜東北エリア 4-0 優勝【カレスコランプ(常夏)】」（2026-11-23）
//   https://note.com/tukimiya_816/n/n97089b824952
// レシピは記事の画像から読み取った（公式カードリストの画像と照合）
const WEWILL = 'PL!SP-bp7-024';   // WE WILL!!（2点・エネルギーが相手より2枚多ければ+1）
const NEUT = 'PL!SP-pb2-049';     // ニュートラル（5点・エネルギー11枚以上で+1）
const TOKO = 'PL!SP-bp5-025';     // 常夏☆サンシャイン（6点・エネルギー4枚につき+1）
const LOVER = 'PL!SP-pb2-045';    // 絶対的LOVER（4点）
const REN15 = 'PL!SP-bp4-005';    // 葉月 恋（15・ランプ2）
const KUKU13 = 'PL!SP-bp5-002';   // 唐 可可（13・左サイドで手札入れ替え）
const CHISATO17 = 'PL!SP-bp5-003'; // 嵐 千砂都（17・コスト10が-2／センターでライブ開始時にすべてアクティブ）
const REN20 = 'PL!SP-pb2-005';    // 葉月 恋（20）
const REN11 = 'PL!SP-bp5-005';    // 葉月 恋（11）
const KUKU10 = 'PL!SP-pb2-013';   // 唐 可可（10・ランプ）
const KINAKO10 = 'PL!SP-bp2-006'; // 桜小路きな子（10）
const RAMP4 = ['PL!SP-bp1-021', 'PL!SP-PR-004', 'PL!SP-PR-013', 'PL!SP-sd1-016']; // 4コスト（手札1枚でランプ）
const TENS = [KUKU10, KINAKO10];
const REN2 = 'PL!SP-pb2-016';    // 葉月 恋（2・自分を控え室に置いて控え室のライブを手札に）

export default {
  id: 'liella-karesco',
  type: 'カレスコランプ（Liella!）',
  name: '秋選抜 東北エリア 優勝',
  code: '',
  lastPlaced: '2026/11/23',
  source: 'https://note.com/tukimiya_816/n/n97089b824952',
  list: [
    [TOKO, 3], // 常夏☆サンシャイン（ライブ）
    [WEWILL, 4], // WE WILL!!（ライブ）
    [LOVER, 1], // 絶対的LOVER（ライブ）
    [NEUT, 4], // ニュートラル（ライブ）
    ['PL!SP-bp1-005', 4], // 葉月 恋（コスト2）
    ['PL!SP-bp2-002', 3], // 唐 可可（コスト2）
    ['PL!SP-pb1-021', 3], // ウィーン・マルガレーテ（コスト2）
    ['PL!SP-pb2-016', 4], // 葉月 恋（コスト2）
    ['PL!SP-bp1-021', 4], // ウィーン・マルガレーテ（コスト4）
    ['PL!SP-PR-004', 1], // 唐 可可（コスト4）
    ['PL!SP-PR-013', 1], // 鬼塚冬毬（コスト4）
    ['PL!SP-sd1-016', 4], // 葉月 恋（コスト4）
    [KINAKO10, 3], // 桜小路きな子（コスト10）
    [KUKU10, 4], // 唐 可可（コスト10）
    [REN11, 4], // 葉月 恋（コスト11）
    [KUKU13, 2], // 唐 可可（コスト13）
    ['PL!SP-pb2-000', 1], // 嵐 千砂都＆鬼塚夏美（コスト15）
    [REN15, 4], // 葉月 恋（コスト15）
    [CHISATO17, 3], // 嵐 千砂都（コスト17）
    [REN20, 3], // 葉月 恋（コスト20）
  ],
  plan: {
    board: '1T センターに4コス（ランプ）→ 2T 10コスへ（ランプ）→ 3T 15恋へ（ランプ2）＋2コス → 4T 13可可／11恋／17千砂都 → 5T 20恋・17千砂都 → 6T 合流',
    score: '0 → 3 → 6 → 9 → 15（安定は12）→ 19',
    mulligan: '4コス＞10コス＞WE WILL!!＞15コス＞2コス（2恋＞2可可）＞ニュートラル。4コスか10コスが無ければ全部戻す',
    lives: '2T：WE WILL!!（3点）／3T：ニュートラル（6点）／4T：WE WILL!!＋ニュートラル（9点）か常夏☆サンシャイン／5T：ニュートラル＋常夏☆サンシャイン（15点）／6T：WE WILL!!＋絶対的LOVER＋常夏☆サンシャイン（19点）',
    key: 'エネルギーを増やして（4コス・10可可・15恋）、ニュートラル（11枚以上で+1）と常夏☆サンシャイン（4枚につき+1）で点を伸ばす。17千砂都はライブ開始時にウェイトのメンバーとエネルギーを起こす',
    refs: ['https://note.com/tukimiya_816/n/n97089b824952'],
  },
  strategy: {
    mulliganOpt: {
      keep: [
        { ids: RAMP4, n: 1 },
        { ids: TENS, n: 1 },
        { ids: [WEWILL], n: 1 },
        { ids: [REN15], n: 1 },
        { ids: ['PL!SP-bp1-005', 'PL!SP-bp2-002'], n: 1 },
      ],
    },
    mainOpt: { playPen: 0.3, topK: 60, setupWeight: 1 },
    // 4コスのランプは1Tは必ず使う（2T以降は捨ててよいカードがあるときだけ。2Tも必ず使うより勝率が高かった）。15恋は3Tまで、17千砂都・20恋は4Tまで手札に残す
    prefer: {
      rampTurns: [1],
      wantLives: [NEUT, TOKO, WEWILL],
      hold: [{ from: 1, to: 2, ids: [REN15] }, { from: 1, to: 3, ids: [CHISATO17, REN20] }],
    },
    script: {
      1: [{ oneOf: [{ play: { ids: RAMP4 }, area: 1 }, { play: { cost: 4 }, area: 1 }] }],
      2: [{ oneOf: [{ play: { id: KUKU10 }, onto: { cost: 4 } }, { play: { id: KINAKO10 }, onto: { cost: 4 } }] }],
      3: [{ play: { id: REN15 }, onto: { cost: 10 } }, { play: { cost: 2 }, area: 0 }],
    },
    turnPlan: {
      1: { board: [[4]], lives: [] },
      2: { board: [[10]], lives: [[WEWILL]] },
      3: { board: [[15, 2]], lives: [[NEUT], [WEWILL]] },
      4: { board: [[15, 13, 2], [17, 11, 2], [17, 10, 2], [15, 11, 2]], lives: [[WEWILL, NEUT], [TOKO], [NEUT]] },
      5: { board: [[20, 17, 2], [17, 13, 11], [20, 17, 11]], lives: [[NEUT, TOKO], [WEWILL, NEUT], [TOKO]] },
      6: { board: [[20, 17, 11], [20, 17, 15], [20, 17, 13]], lives: [[WEWILL, LOVER, TOKO], [NEUT, TOKO], [WEWILL, TOKO]] },
    },
    // 1〜2Tは、ライブカード置き場に伏せて引き直して探す（2Tの10コスは残す）
    //  優先：15恋 → ニュートラルと2恋 pb2-016（3Tに控え室からライブを持ってこられる）は同列（どちらかが無ければ探す）
    liveOpt: {
      fill: true, fillMaxCost: 4, pace: [3, 6, 9], minP: 0.45, th1: 0.3, thLast: 0.2,
      digFor: [
        { ids: [REN15], turns: [1, 2], n: 3, keep: TENS, label: '15恋' },
        { ids: [NEUT], turns: [1, 2], n: 3, keep: [...TENS, REN15], label: 'ニュートラル' },
        { ids: [REN2], turns: [1, 2], n: 3, keep: [...TENS, REN15], label: '2恋' },
      ],
    },
  },
};

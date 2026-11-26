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

const PR_NAMES = ['高坂穂乃果', '南ことり', '南 ことり', '小泉花陽'];
const nameOf = d => (d.names || []).map(n => n.replace(/\s/g, ''));

// 3T：新13ことりを出す前に、空いている枠へ2コストを出す（noteの13-2-2）
//  バトンタッチ元以外の2人（名前の違うPrintemps）をウェイトにして新13ことりのコスト-2を払えるようにする。エネルギーが足りるときだけ
function fillBefore13(api) {
  const { g, me } = api;
  if (g.turn !== 3 || !me.hand.some(c => c.def.id === KOTORI13N)) return;
  const empty = me.stage.findIndex(x => !x);
  if (empty < 0) return;
  // バトンタッチ元：アクティブの7穂乃果、なければウェイトの4ことり
  const src = me.stage.find(x => x && x.card.def.id === HONOKA7) || me.stage.find(x => x && x.card.def.id === KOTORI4 && !x.active);
  if (!src) return;
  const other = me.stage.find(x => x && x !== src);
  if (!other || !other.active) return;
  const used = new Set(nameOf(other.card.def));
  const e = me.energy.active;
  const k13 = me.hand.find(c => c.def.id === KOTORI13N);
  // 2花陽（pb2-008）は登場時に自分をウェイトにしてサーチするので、コスト-2のウェイトに使えない。ここでは出さない
  const idx = me.hand.findIndex(c => c.def.kind === 'M' && c.def.cost === 2 && c.def.id !== 'PL!-pb2-008' && nameOf(c.def).some(n => PR_NAMES.map(x => x.replace(/\s/g, '')).includes(n)) && !nameOf(c.def).some(n => used.has(n)));
  if (idx < 0) return;
  // 13ことりのコスト：13 − 2（2人ウェイト）− バトンタッチ元（ウェイトなら4ことりの常時能力で+1）
  const cost13 = Math.max(0, k13.def.cost - 2 - src.card.def.cost - (src.active ? 0 : 1));
  if (2 + cost13 > e) return;
  if (api.play(idx, empty, false)) g.log(me, 'plan', '手順：新13ことりの前に、空いている枠へ2コストを出した（2コスト2人をウェイトにするため）');
}

// 3T：盤面が4ことり＋2コスト2人（7穂乃果なし）なら、先に4ことりの起動でウェイトにしてから新13ことりをバトンタッチする
//  ウェイトの4ことりからなら減る値が5（4ことりの常時能力）なので、2コスト2人をウェイトにしてちょうど6エネルギー。2コスト2人のウェイトが残る
function restKotori4Before13(api) {
  const { g, me } = api;
  if (g.turn !== 3 || !me.hand.some(c => c.def.id === KOTORI13N) || me.stage.some(x => x && x.card.def.id === HONOKA7)) return;
  const a4 = me.stage.findIndex(x => x && x.card.def.id === KOTORI4 && x.active && x.enteredTurn !== g.turn);
  if (a4 < 0 || me.hand.length < 2) return;
  const isPrM = d => nameOf(d).some(n => PR_NAMES.map(x => x.replace(/\s/g, '')).includes(n));
  const others = me.stage.filter((x, i) => x && i !== a4 && x.active && isPrM(x.card.def));
  const names = others.map(x => nameOf(x.card.def).join('|'));
  if (others.length < 2 || names[0] === names[1]) return;
  if (me.hand.find(c => c.def.id === KOTORI13N).def.cost - 2 - 5 > me.energy.active) return;
  if (api.activate(a4, 0)) g.log(me, 'plan', '手順：4ことりの起動でウェイトにした（ウェイトの4ことりから新13ことりへバトンタッチするため）');
}

// 3T：新13ことりを出したあと、ウェイトが3人に届かなければ、noteの手順で3人ウェイトにする
//  ウェイトにした2コストへ手札の2コストをバトンタッチで出し直し（アクティブにする）、新13ことりの起動（自分＋Printemps2人をウェイト）で3人ウェイト
//  （手札2枚で払う形は、起動能力の判断のほうで選ぶ）
function restThreeAfter13(api) {
  const { g, me } = api;
  if (g.turn !== 3 || !me.hand.some(c => c.def.id === WAO)) return;
  const area13 = me.stage.findIndex(x => x && x.card.def.id === KOTORI13N && x.active);
  if (area13 < 0) return;
  const isPrM = d => d.kind === 'M' && nameOf(d).some(n => PR_NAMES.map(x => x.replace(/\s/g, '')).includes(n));
  const waitN = () => me.stage.filter(x => x && !x.active && isPrM(x.card.def)).length;
  const others = () => me.stage.filter((x, a) => x && a !== area13 && x.active && isPrM(x.card.def));
  if (waitN() >= 3) return;
  // 2人ウェイトで払うには、ほかにアクティブのPrintempsが2人要る
  for (let guard = 0; guard < 2 && others().length < 2; guard++) {
    const a = me.stage.findIndex((x, i) => x && i !== area13 && !x.active && isPrM(x.card.def) && g.canTarget(me, i));
    if (a < 0) break;
    const idx = me.hand.findIndex(c => c.def.kind === 'M' && c.def.cost <= 2 && c.def.id !== 'PL!-pb2-008' && isPrM(c.def) && g.playCost(me, c, a, true) <= me.energy.active);
    if (idx < 0) break;
    if (!api.play(idx, a, true)) break;
    g.log(me, 'plan', '手順：ウェイトにした2コストへ2コストを出し直した（新13ことりの起動で3人ウェイトにするため）');
  }
  if (api.activate(area13, 0)) g.log(me, 'plan', '手順：新13ことりの起動能力を使った（ウェイト3人でWAO-WAOを+1点に）');
}

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
    board: "1T 4ことり（手札入れ替え）か2-2 → 2T 4-7（新13ことりが見えていれば4ことりを残して2コス）→ 3T 2コス2人をウェイトにして新13ことり（13-2-2）、起動で3人ウェイト → 4T 13ことり起動のあと15花陽・7穂乃果（15-7-2）→ 5T 17花陽へ → 13-17-17",
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
        { ids: [KOTORI13N], n: 1 }, // 新13ことりは1Tからキープ（3Tに出す）
        { ids: [WAO], n: 1 },
      ],
    },
    mainOpt: { playPen: 0.3, topK: 60 },
    main: (api, def) => { fillBefore13(api); restKotori4Before13(api); const r = def(api, { pace: [2, 6, 10], playPen: 0.3, topK: 60 }); restThreeAfter13(api); return r; },
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
      //  ただし新13ことりが手札にあり4ことりがステージにいるときは、4ことりを残して2コスト（2ことり優先）を出す（noteの2T。3Tはウェイトの4ことりから新13ことり）
      2: [
        { ifHand: { id: KOTORI13N }, ifStage: { id: KOTORI4 }, oneOf: [{ play: { id: 'PL!-bp3-012' } }, { play: { ids: ['PL!-pb2-028', 'PL!-bp4-017', 'PL!-pb1-019'] } }] },
        { ifHand: { id: KOTORI13N }, ifStage: { id: KOTORI4 }, oneOf: [{ play: { id: 'PL!-bp3-012' } }, { play: { ids: ['PL!-pb2-028', 'PL!-bp4-017', 'PL!-pb1-019'] } }] },
        { ifNoHand: { id: KOTORI13N }, oneOf: [{ play: { id: HONOKA7 }, onto: { id: KOTORI4 }, ontoWait: true }, { play: { id: HONOKA7 }, onto: { cost: 2 } }, { play: { id: HONOKA7 } }] },
        { ifHand: { id: KOTORI13N }, ifNoStage: { id: KOTORI4 }, oneOf: [{ play: { id: HONOKA7 }, onto: { cost: 2 } }, { play: { id: HONOKA7 } }] },
      ],
      // 3T：2人ウェイトで新13ことり（7穂乃果からバトンタッチ）。無ければ旧13ことり
      3: [{ oneOf: [
        { play: { id: KOTORI13N }, onto: { id: HONOKA7 } },
        { play: { id: KOTORI13N }, onto: { id: KOTORI4 }, ontoWait: true },
        { play: { id: KOTORI13O }, onto: { id: HONOKA7 } },
        { play: { id: KOTORI13N }, onto: { cost: 4 } },
      ] }],
      // 4T（noteの盤面 15花陽・7穂乃果・2ことり）：13ことりの起動（2コス2人をウェイト）でライブを拾ってから、
      // ウェイトの13ことりから15花陽、2コス（2ことり以外）から7穂乃果へバトンタッチ。15花陽と7穂乃果が手札にあるときだけ
      //  15花陽が無く17花陽だけでも、13ことりの起動のあとウェイトの13ことりから17花陽へ（7穂乃果が無くても花陽だけは出す）
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

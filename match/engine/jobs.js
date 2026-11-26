// 複数のコアで分けて回すための「仕事」の形と、結果のまとめ方（ブラウザでもnodeでも使う）
// job：{ kind: 'match', a, b, firstMode, seedBase, maxTurns, start, n, profA?, profB? }（profA・profB：先に調べた点数の見込み）
//      { kind: 'profile', deck, n: 1 }
//      { kind: 'solo', deck, seedBase, turns, start, n }
// a・b・deck は { name, list, strategy, id } を持つデッキ（関数を含まない＝ワーカーに渡せる形）
import { makeMatchRunner, makeSoloRunner, soloProfile, primeProfile } from './index.js';
import { BUILTIN_DECKS } from '../decks/index.js';

// 回し方（strategy）には関数（デッキ専用の手順など）が入ることがあり、ワーカーに送れない（postMessage で複製できない）
// そのため、組み込みデッキの回し方は番号（stratId）だけを送り、ワーカー側で組み込みデッキから戻す
function hydrate(d) {
  if (!d || !d.stratId) return d;
  const base = BUILTIN_DECKS.find(x => x.id === d.stratId);
  return { ...d, strategy: base ? base.strategy : {} };
}

export function makeJobRunner(db, effects, job) {
  // profile：デッキの点数の見込み（ひとり回し120回）だけ調べる
  job = { ...job, a: hydrate(job.a), b: hydrate(job.b), deck: hydrate(job.deck) };
  if (job.kind === 'profile') {
    let res = null;
    return { step() { res = soloProfile({ db, effects, deck: job.deck }); return res; }, result: () => res };
  }
  if (job.kind === 'match') {
    // 先に調べた相手の見込みがあれば使う
    if (job.profA) primeProfile(job.a, job.profA);
    if (job.profB) primeProfile(job.b, job.profB);
    return makeMatchRunner({ db, effects, a: job.a, b: job.b, firstMode: job.firstMode || 'half', seedBase: job.seedBase ?? 1, maxTurns: job.maxTurns ?? 12, startIndex: job.start || 0 });
  }
  if (job.kind === 'solo') {
    return makeSoloRunner({ db, effects, deck: job.deck, seedBase: job.seedBase ?? 1, turns: job.turns ?? 6, startIndex: job.start || 0 });
  }
  throw new Error('知らない仕事の種類：' + job.kind);
}

// n 試合を parts 個に分ける（試合の番号が続くように。分けても1つで回したときと同じ結果になる）
export function splitJob(job, parts) {
  const n = job.n, start = job.start || 0;
  const k = Math.max(1, Math.min(parts, n));
  const out = [];
  let s = start;
  for (let i = 0; i < k; i++) {
    const m = Math.floor(n / k) + (i < n % k ? 1 : 0);
    if (m > 0) out.push({ ...job, start: s, n: m });
    s += m;
  }
  return out;
}

// 結果を足し合わせる
export function mergeAcc(kind, accs) {
  if (kind === 'match') {
    const t = { n: 0, win: 0, loss: 0, draw: 0, unres: 0, endTurn: 0, asFirst: { n: 0, win: 0 }, asSecond: { n: 0, win: 0 } };
    for (const a of accs) {
      for (const k of ['n', 'win', 'loss', 'draw', 'unres', 'endTurn']) t[k] += a[k];
      for (const s of ['asFirst', 'asSecond']) { t[s].n += a[s].n; t[s].win += a[s].win; }
    }
    return t;
  }
  const turns = accs[0] ? accs[0].turns.length : 0;
  const t = { n: 0, turns: Array.from({ length: turns }, () => ({ tried: 0, ok: 0, scoreSum: 0, scores: {} })) };
  for (const a of accs) {
    t.n += a.n;
    a.turns.forEach((T, i) => {
      const X = t.turns[i];
      X.tried += T.tried; X.ok += T.ok; X.scoreSum += T.scoreSum;
      for (const [s, c] of Object.entries(T.scores)) X.scores[s] = (X.scores[s] || 0) + c;
    });
  }
  return t;
}

// ワーカーに渡すデッキ（画面の一覧の項目から、計算に要るものだけ取り出す）
export function plainDeck(d) {
  // 組み込みデッキを元にしたデッキは、回し方を番号で送る（関数を含むので複製できない）
  //  組み込みデッキそのもの（tools から渡すとき）も同じ
  const stratId = d.stratId || (BUILTIN_DECKS.some(x => x.id === d.id && x.strategy === d.strategy) ? d.id : null);
  if (stratId) return { id: d.id || d.key, name: d.name, type: d.type, list: d.list, stratId };
  return { id: d.id || d.key, name: d.name, type: d.type, list: d.list, strategy: d.strategy || {} };
}

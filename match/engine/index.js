// エンジンの入口：デッキ同士を何試合も戦わせて集計する
import { Game } from './game.js';
import { makePolicy } from './ai.js';

export { Game } from './game.js';
export { makePolicy } from './ai.js';

// 1試合
export function playOne({ db, effects, a, b, seed, first, trace = false, maxTurns = 12, oppAware = true }) {
  const g = new Game({
    db, effects, seed, first, trace,
    players: [
      { name: a.name, list: a.list, policy: makePolicy(a.strategy) },
      { name: b.name, list: b.list, policy: makePolicy(b.strategy) },
    ],
  });
  // 相手のデッキの点数の見込み（ひとり回しで先に調べたもの）。ライブを置くかどうかの判断に使う
  if (oppAware) {
    g.p[0].oppModel = soloProfile({ db, effects, deck: b });
    g.p[1].oppModel = soloProfile({ db, effects, deck: a });
  }
  g.run(maxTurns);
  return g;
}

// デッキの「ターンごとの点数の見込み」：ひとり回しを何回かして、各ターンに何点で成功したか（失敗・ライブなしは none）を数える
// 同じデッキは一度だけ調べる（キャッシュ）
const profileCache = new Map();
export function soloProfile({ db, effects, deck, n = 120, turns = 10 }) {
  const key = (deck.id || deck.name) + '#' + JSON.stringify(deck.list);
  if (profileCache.has(key)) return profileCache.get(key);
  const prof = Array.from({ length: turns + 1 }, () => ({ n: 0, none: 0, scores: {} }));
  for (let s = 1; s <= n; s++) {
    const g = playSolo({ db, effects, deck, seed: 100003 + s * 7919, turns });
    g.p[0].turnLog.forEach((r, k) => {
      const t = prof[k + 1]; if (!t) return;
      t.n++;
      if (r.ok) t.scores[r.score] = (t.scores[r.score] || 0) + 1; else t.none++;
    });
  }
  profileCache.set(key, prof);
  return prof;
}

// 集計器。step(k) を何度も呼んで少しずつ回せる（画面を止めないため）
export function makeMatchRunner({ db, effects, a, b, seedBase = 1, firstMode = 'half', maxTurns = 12 }) {
  const acc = { n: 0, win: 0, loss: 0, draw: 0, unres: 0, endTurn: 0,
    asFirst: { n: 0, win: 0 }, asSecond: { n: 0, win: 0 } };
  let k = 0;
  return {
    step(count) {
      for (let i = 0; i < count; i++, k++) {
        const first = firstMode === 'first' ? 0 : firstMode === 'second' ? 1 : (k % 2);
        const g = playOne({ db, effects, a, b, seed: seedBase + k * 7919, first, maxTurns });
        const r = g.result;
        acc.n++;
        const side = first === 0 ? acc.asFirst : acc.asSecond;
        side.n++;
        if (r.winner === 0) { acc.win++; side.win++; acc.endTurn += r.turn; }
        else if (r.winner === 1) { acc.loss++; acc.endTurn += r.turn; }
        else if (r.winner === null) { acc.draw++; acc.endTurn += r.turn; }
        else acc.unres++;
      }
      return acc;
    },
    result: () => acc,
  };
}

// ひとり回し1試合：相手はライブをしない「かかし」。毎ターンの点数を見る（成功ライブは2枚までにして試合を続ける）
export function playSolo({ db, effects, deck, seed, turns = 6, trace = false }) {
  const idle = { mulligan: () => [], main: () => {}, setLives: () => [], chooseSuccess: () => 0 };
  const g = new Game({
    db, effects, seed, first: 0, trace,
    players: [
      { name: deck.name, list: deck.list, policy: makePolicy(deck.strategy) },
      { name: 'かかし', list: deck.list, policy: idle },
    ],
  });
  g.setup();
  const P = g.p[0];
  for (let t = 1; t <= turns; t++) {
    g.turn = t;
    g.first = 0;
    for (const X of g.order()) g.normalPhase(X);
    g.livePhase();
    g.result = null;
    // 成功ライブは2枚まで残す（3枚目で勝ちにならないように）。「成功ライブが2枚以上」の効果を試せる
    while (P.success.length > 2) P.success.pop();
  }
  return g;
}

export function makeSoloRunner({ db, effects, deck, seedBase = 1, turns = 6 }) {
  const acc = { n: 0, turns: Array.from({ length: turns }, () => ({ tried: 0, ok: 0, scoreSum: 0, scores: {} })) };
  let k = 0;
  return {
    step(count) {
      for (let i = 0; i < count; i++, k++) {
        const g = playSolo({ db, effects, deck, seed: seedBase + k * 7919, turns });
        g.p[0].turnLog.forEach((rec, t) => {
          const T = acc.turns[t];
          if (rec.attempted) T.tried++;
          if (rec.ok) { T.ok++; T.scoreSum += rec.score; T.scores[rec.score] = (T.scores[rec.score] || 0) + 1; }
        });
        acc.n++;
      }
      return acc;
    },
    result: () => acc,
  };
}

// ---------------- 仮想の相手との対戦 ----------------
// virtual：ターンごとの結果の表 [ターン] = [{ kind: 'ok', score, w } | { kind: 'fail', w } | { kind: 'none', w }]
// （noteの点数の進行などから作る。カードは使わず、確率だけで「何点で成功するか」を決める）
export function virtualTable(progression, { full = 0.5, part = 0.3, partRate = 0.6, none = [] } = {}) {
  const table = [[]];
  progression.forEach((target, k) => {
    const t = k + 1;
    if (!target || none.includes(t)) { table.push([{ kind: 'none', w: 1 }]); return; }
    const low = Math.max(1, Math.round(target * partRate));
    table.push([
      { kind: 'ok', score: target, w: full },
      { kind: 'ok', score: low, w: part },
      { kind: 'fail', w: Math.max(0, 1 - full - part) },
    ]);
  });
  return table;
}

// 仮想の相手の表を、AIが使う「相手の点数の見込み」の形にする
function profileFromVirtual(table) {
  return table.map(rows => {
    const prof = { n: 0, none: 0, scores: {} };
    for (const x of rows) {
      const c = Math.round(x.w * 1000);
      prof.n += c;
      if (x.kind === 'ok') prof.scores[x.score] = (prof.scores[x.score] || 0) + c; else prof.none += c;
    }
    return prof;
  });
}

export function makeVirtualRunner({ db, effects, deck, virtual, seedBase = 1, maxTurns = 12 }) {
  const acc = { n: 0, win: 0, loss: 0, draw: 0, unres: 0, endTurn: 0, asFirst: { n: 0, win: 0 }, asSecond: { n: 0, win: 0 } };
  const idle = { mulligan: () => [], main: () => {}, setLives: () => [], chooseSuccess: () => 0 };
  const prof = profileFromVirtual(virtual);
  let k = 0;
  return {
    step(count) {
      for (let i = 0; i < count; i++, k++) {
        const first = k % 2;
        const g = new Game({
          db, effects, seed: seedBase + k * 7919, first,
          players: [
            { name: deck.name, list: deck.list, policy: makePolicy(deck.strategy) },
            { name: '仮想の相手', list: deck.list, policy: idle, virtual },
          ],
        });
        g.p[0].oppModel = prof;
        g.run(maxTurns);
        const r = g.result;
        acc.n++;
        const side = first === 0 ? acc.asFirst : acc.asSecond;
        side.n++;
        if (r.winner === 0) { acc.win++; side.win++; acc.endTurn += r.turn; }
        else if (r.winner === 1) { acc.loss++; acc.endTurn += r.turn; }
        else if (r.winner === null) { acc.draw++; acc.endTurn += r.turn; }
        else acc.unres++;
      }
      return acc;
    },
  };
}

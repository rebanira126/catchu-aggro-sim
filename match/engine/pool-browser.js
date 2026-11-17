// ブラウザで複数のコアを使って試合を回す（Web Worker）。ワーカーが使えないときは画面のスレッドで回す
import { makeJobRunner, splitJob, mergeAcc } from './jobs.js';
import { profileKey } from './index.js';

const sleep = () => new Promise(r => setTimeout(r, 0));

export function createPool({ raw, db, effects, size }) {
  const n = Math.max(1, size ?? Math.max(1, (navigator.hardwareConcurrency || 2) - 1));
  let workers = [];
  let ready = null;
  let seq = 0;
  const waiting = new Map(); // id → { onProg, resolve, reject }

  function start() {
    if (ready) return ready;
    ready = new Promise(resolve => {
      try {
        let ok = 0;
        for (let i = 0; i < n; i++) {
          const w = new Worker(new URL('./sim-worker.js', import.meta.url), { type: 'module' });
          w.onmessage = e => {
            const m = e.data;
            if (m.type === 'ready') { if (++ok === n) resolve(true); return; }
            const h = waiting.get(m.id);
            if (!h) return;
            if (m.type === 'prog') h.onProg(m.k);
            else if (m.type === 'done') { waiting.delete(m.id); h.resolve(m.acc); }
            else if (m.type === 'error') { waiting.delete(m.id); h.reject(new Error(m.message)); }
          };
          w.onerror = () => { workers = []; resolve(false); };
          w.postMessage({ type: 'init', raw });
          workers.push(w);
        }
        // 一定時間たっても準備できなければ画面のスレッドで回す
        setTimeout(() => resolve(false), 15000);
      } catch (err) {
        workers = [];
        resolve(false);
      }
    });
    return ready;
  }

  // job を分けて回し、結果をまとめて返す。onProg(k)：k 試合終わるごとに呼ぶ
  async function run(job, onProg = () => {}) {
    const ok = await start();
    if (!ok || !workers.length) {
      // ワーカーなし：画面のスレッドで少しずつ回す
      const r = makeJobRunner(db, effects, job);
      let done = 0;
      while (done < job.n) { const k = Math.min(20, job.n - done); r.step(k); done += k; onProg(k); await sleep(); }
      return r.result();
    }
    // 対戦のAIが使う相手の点数の見込みは、一度だけ調べて各ワーカーに配る
    if (job.kind === 'match' && workers.length > 1) {
      const [profA, profB] = await Promise.all([profile(job.a), profile(job.b)]);
      job = { ...job, profA, profB };
    }
    const parts = splitJob(job, workers.length);
    const accs = await Promise.all(parts.map((p, i) => send(workers[i % workers.length], p, onProg)));
    return mergeAcc(job.kind, accs);
  }

  function send(w, job, onProg = () => {}) {
    return new Promise((resolve, reject) => {
      const id = ++seq;
      waiting.set(id, { onProg, resolve, reject });
      w.postMessage({ type: 'job', id, job });
    });
  }
  const profiles = new Map();
  let rr = 0;
  function profile(deck) {
    const k = profileKey(deck);
    if (!profiles.has(k)) profiles.set(k, send(workers[rr++ % workers.length], { kind: 'profile', deck, n: 1 }));
    return profiles.get(k);
  }

  return { run, size: n, usingWorkers: async () => (await start()) && workers.length > 0 };
}

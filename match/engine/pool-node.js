// nodeで複数のコアを使って試合を回す（worker_threads）。ツール（tools/*.mjs）から使う
//   const pool = createNodePool();               // コア数−1 個のワーカー（環境変数 SIM_THREADS で指定もできる）
//   const acc = await pool.run({ kind: 'match', a, b, n: 400 });
//   await pool.close();
import { Worker } from 'node:worker_threads';
import os from 'node:os';
import { splitJob, mergeAcc } from './jobs.js';
import { profileKey } from './index.js';

export function defaultThreads() {
  const env = +process.env.SIM_THREADS;
  if (env > 0) return env;
  const cores = (os.availableParallelism ? os.availableParallelism() : os.cpus().length) || 1;
  return Math.max(1, cores - 1);
}

export function createNodePool(size = defaultThreads()) {
  const workers = [];
  const idle = [];
  const queue = [];
  const waiting = new Map();
  let seq = 0;
  for (let i = 0; i < size; i++) {
    const w = new Worker(new URL('./sim-worker-node.js', import.meta.url));
    w.on('message', m => {
      const h = waiting.get(m.id); waiting.delete(m.id);
      if (m.error) h.reject(new Error(m.error)); else h.resolve(m.acc);
      next(w);
    });
    w.on('error', err => { for (const h of waiting.values()) h.reject(err); waiting.clear(); });
    workers.push(w); idle.push(w);
  }
  function next(w) {
    const t = queue.shift();
    if (!t) { idle.push(w); return; }
    waiting.set(t.id, t); w.postMessage({ id: t.id, job: t.job });
  }
  // 小さな仕事を1つワーカーに渡す（空いているワーカーが無ければ待つ）
  function submit(job) {
    return new Promise((resolve, reject) => {
      const t = { id: ++seq, job, resolve, reject };
      const w = idle.pop();
      if (w) { waiting.set(t.id, t); w.postMessage({ id: t.id, job }); } else queue.push(t);
    });
  }
  // デッキの点数の見込み（対戦のAIが使う）。一度だけ調べてワーカーに配る
  const profiles = new Map();
  function profile(deck) {
    const k = profileKey(deck);
    if (!profiles.has(k)) profiles.set(k, submit({ kind: 'profile', deck, n: 1 }));
    return profiles.get(k);
  }
  // job を分けて回し、まとめる。parts：分ける数（既定はワーカーの数）
  async function run(job, parts = size) {
    if (job.kind === 'match' && size > 1) {
      const [profA, profB] = await Promise.all([profile(job.a), profile(job.b)]);
      job = { ...job, profA, profB };
    }
    const accs = await Promise.all(splitJob(job, parts).map(submit));
    return mergeAcc(job.kind, accs);
  }
  async function close() { await Promise.all(workers.map(w => w.terminate())); }
  return { run, close, size };
}

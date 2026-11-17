// ブラウザのワーカー（別のコアで試合を回す）。app.js の engine/pool-browser.js から使う
import { EFFECTS } from '../cards/index.js';
import { buildDb } from './carddb.js';
import { makeJobRunner } from './jobs.js';

let db = null;
self.onmessage = e => {
  const m = e.data;
  try {
    if (m.type === 'init') { db = buildDb(m.raw); self.postMessage({ type: 'ready' }); return; }
    if (m.type === 'job') {
      const r = makeJobRunner(db, EFFECTS, m.job);
      let done = 0;
      // 少しずつ回して進み具合を知らせる
      while (done < m.job.n) {
        const k = Math.min(10, m.job.n - done);
        r.step(k); done += k;
        self.postMessage({ type: 'prog', id: m.id, k });
      }
      self.postMessage({ type: 'done', id: m.id, acc: r.result() });
    }
  } catch (err) {
    self.postMessage({ type: 'error', id: m.id, message: String(err && err.message || err) });
  }
};

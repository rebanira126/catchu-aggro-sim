// nodeのワーカー（別のコアで試合を回す）。engine/pool-node.js から使う
import { parentPort } from 'node:worker_threads';
import { EFFECTS } from '../cards/index.js';
import { loadDbNode } from './load-node.js';
import { makeJobRunner } from './jobs.js';

const db = loadDbNode();
parentPort.on('message', m => {
  try {
    const r = makeJobRunner(db, EFFECTS, m.job);
    r.step(m.job.n || 1);
    parentPort.postMessage({ id: m.id, acc: r.result() });
  } catch (err) {
    parentPort.postMessage({ id: m.id, error: String(err && err.stack || err) });
  }
});

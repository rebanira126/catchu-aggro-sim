// nodeでカードデータを読む（テスト・レポート用）
import fs from 'node:fs';
import { buildDb } from './carddb.js';

export function loadDbNode() {
  const raw = JSON.parse(fs.readFileSync(new URL('../data/rabuka_cards.json', import.meta.url), 'utf8'));
  return buildDb(raw);
}

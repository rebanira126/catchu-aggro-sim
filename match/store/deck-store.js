// 保存デッキの窓口。画面やエンジンはこの形（list/get/save/remove/exportAll/importAll）だけを使う。
// 今はブラウザの LocalStorage に保存する。あとでDBに移すときは、同じ形のクラスを作って差し替える。

/**
 * 保存デッキの形
 * { id, type, name, lastPlaced, source, list: [[カード番号, 枚数], ...], updatedAt }
 */

export class MemoryDeckStore {
  constructor() { this.items = new Map(); }
  async list() { return [...this.items.values()].sort((a, b) => (a.type + a.name).localeCompare(b.type + b.name, 'ja')); }
  async get(id) { return this.items.get(id) || null; }
  async save(deck) {
    const id = deck.id || `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const item = { ...deck, id, updatedAt: new Date().toISOString() };
    this.items.set(id, item);
    return item;
  }
  async remove(id) { this.items.delete(id); }
  async exportAll() { return JSON.stringify({ version: 1, decks: await this.list() }, null, 1); }
  async importAll(text) {
    const data = JSON.parse(text);
    const decks = Array.isArray(data) ? data : data.decks;
    if (!Array.isArray(decks)) throw new Error('デッキの一覧が見つかりません');
    let n = 0;
    for (const d of decks) {
      if (!d || !Array.isArray(d.list)) continue;
      await this.save({ ...d, id: d.id && String(d.id).startsWith('user-') ? d.id : undefined });
      n++;
    }
    return n;
  }
}

export class LocalStorageDeckStore extends MemoryDeckStore {
  constructor(key = 'loveca-match-decks-v1') {
    super();
    this.key = key;
    try {
      const raw = localStorage.getItem(key);
      if (raw) for (const d of JSON.parse(raw)) this.items.set(d.id, d);
    } catch (e) { /* 読めないときは空のまま */ }
  }
  persist() {
    try { localStorage.setItem(this.key, JSON.stringify([...this.items.values()])); } catch (e) { /* 保存できない環境 */ }
  }
  async save(deck) { const r = await super.save(deck); this.persist(); return r; }
  async remove(id) { await super.remove(id); this.persist(); }
}

// 使える保存先を選ぶ（LocalStorage が使えなければメモリだけ）
export function createDeckStore() {
  try {
    const k = '__loveca_test__';
    localStorage.setItem(k, '1'); localStorage.removeItem(k);
    return { store: new LocalStorageDeckStore(), label: 'このブラウザ' };
  } catch (e) {
    return { store: new MemoryDeckStore(), label: 'この画面だけ（閉じると消えます）' };
  }
}

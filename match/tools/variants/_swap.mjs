// 入れ替え案の共通部分：[抜くカード番号, 枚数] と [入れるカード番号, 枚数] でレシピを書き換える
export function swap(deck, out, add) {
  const list = deck.list.map(x => x.slice());
  for (const [id, n] of out) {
    const e = list.find(x => x[0] === id);
    if (!e || e[1] < n) throw new Error(`抜けません：${id}×${n}`);
    e[1] -= n;
  }
  for (const [id, n] of add) {
    const e = list.find(x => x[0] === id);
    if (e) e[1] += n; else list.push([id, n]);
  }
  deck.list = list.filter(x => x[1] > 0);
  deck.name += '（入れ替え案）';
  return deck;
}

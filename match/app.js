// 画面の動き（対戦・ひとり回し・デッキとカード）
import { EFFECTS, effectStatus } from './cards/index.js';
import { BUILTIN_DECKS } from './decks/index.js';
import { playOne, playSolo, makeMatchRunner, makeSoloRunner } from './engine/index.js';
import { parseRecipe, recipeText, checkDeck } from './engine/recipe.js';
import { POINTS, POINT_LIMIT } from './data/points.js';
import { createDeckStore } from './store/deck-store.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (a, b) => (b ? (a / b * 100).toFixed(1) : '0.0');
const sleep = () => new Promise(r => setTimeout(r, 0));

let DB = null;
const { store, label: storeLabel } = createDeckStore();
let saved = [];

// ---------------- デッキ一覧 ----------------
const builtinByType = new Map();
for (const d of BUILTIN_DECKS) if (!builtinByType.has(d.type)) builtinByType.set(d.type, d);

function entries() {
  const b = BUILTIN_DECKS.map(d => ({ key: 'b:' + d.id, builtin: true, type: d.type, name: d.name, lastPlaced: d.lastPlaced, source: d.source, list: d.list, plan: d.plan, strategy: d.strategy }));
  const u = saved.map(s => {
    const base = builtinByType.get(s.type);
    return { key: 'u:' + s.id, builtin: false, id: s.id, type: s.type, name: s.name, lastPlaced: s.lastPlaced || '－', source: s.source || '', list: s.list, plan: base ? base.plan : null, strategy: base ? base.strategy : {} };
  });
  return b.concat(u);
}
function types() {
  const t = [...builtinByType.keys()];
  for (const s of saved) if (!t.includes(s.type)) t.push(s.type);
  return t;
}
const byKey = key => entries().find(e => e.key === key);
const buildsOf = type => entries().filter(e => e.type === type);
const buildLabel = e => `${e.name} · 最終入賞 ${e.lastPlaced || '－'}${e.builtin ? '' : '（保存）'}`;

function fillTypeSelect(sel, value) {
  sel.innerHTML = types().map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  if (value && types().includes(value)) sel.value = value;
}
function fillBuildSelect(sel, type, value) {
  const list = buildsOf(type);
  sel.innerHTML = list.map(e => `<option value="${esc(e.key)}">${esc(buildLabel(e))}</option>`).join('');
  if (value && list.some(e => e.key === value)) sel.value = value;
}

// ---------------- 画面の切り替え ----------------
function showTab() {
  const tab = (location.hash || '#match').slice(1);
  for (const v of ['match', 'solo', 'decks']) $('view-' + v).hidden = v !== tab;
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  if (tab === 'decks') renderDeckList();
}
window.addEventListener('hashchange', showTab);

// ---------------- ① 対戦 ----------------
const matchState = { mode: 'env', first: 'half', running: false, last: null };

function renderMatchForm() {
  const myType = $('myType').value || 'CatChu!';
  fillTypeSelect($('myType'), myType);
  fillBuildSelect($('myBuild'), $('myType').value, $('myBuild').value || 'b:catchu-basic');
  const prev = {};
  document.querySelectorAll('#oppList .opp').forEach(el => { prev[el.dataset.type] = { on: el.querySelector('input').checked, key: el.querySelector('select').value }; });
  $('oppList').innerHTML = types().map((t, i) => {
    const p = prev[t];
    return `<div class="opp" data-type="${esc(t)}">
      <label><input type="checkbox" ${p ? (p.on ? 'checked' : '') : 'checked'} id="opp${i}"><span>${esc(t)}</span></label>
      <select aria-label="${esc(t)}の構築"></select></div>`;
  }).join('');
  document.querySelectorAll('#oppList .opp').forEach(el => {
    const t = el.dataset.type;
    fillBuildSelect(el.querySelector('select'), t, prev[t] && prev[t].key);
  });
  $('myDeckField').hidden = matchState.mode === 'rr';
  $('oppLegend').textContent = matchState.mode === 'rr' ? '総当たりに入れるデッキ（タイプごとに構築を選ぶ）' : '相手のデッキ（タイプごとに構築を選ぶ）';
  updateEstimate();
}

function selectedOpps() {
  return [...document.querySelectorAll('#oppList .opp')].filter(el => el.querySelector('input').checked).map(el => byKey(el.querySelector('select').value)).filter(Boolean);
}
function updateEstimate() {
  const n = +$('nGames').value;
  const k = selectedOpps().length;
  const pairs = matchState.mode === 'rr' ? (k * (k - 1)) / 2 : k;
  // 1試合あたり約3ミリ秒（実測）で見積もり
  const sec = Math.round(pairs * n * 0.003);
  $('estimate').textContent = `見積もり：${pairs}組 × ${n.toLocaleString()}回 ＝ 約${sec < 60 ? sec + '秒' : Math.round(sec / 60) + '分'}`;
}

document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
  matchState.mode = b.dataset.mode;
  document.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('on', x === b));
  renderMatchForm();
}));
document.querySelectorAll('[data-first]').forEach(b => b.addEventListener('click', () => {
  matchState.first = b.dataset.first;
  document.querySelectorAll('[data-first]').forEach(x => x.classList.toggle('on', x === b));
}));
$('myType').addEventListener('change', () => fillBuildSelect($('myBuild'), $('myType').value));
$('oppList').addEventListener('change', updateEstimate);
$('nGames').addEventListener('change', updateEstimate);

async function runPair(a, b, n, onProg) {
  const r = makeMatchRunner({ db: DB, effects: EFFECTS, a, b, firstMode: matchState.first, seedBase: 1 });
  let done = 0;
  while (done < n) {
    const k = Math.min(20, n - done);
    r.step(k); done += k; onProg(k);
    await sleep();
  }
  return r.result();
}

$('matchForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (matchState.running) return;
  const n = +$('nGames').value;
  const opps = selectedOpps();
  if (!opps.length) { $('matchMsg').textContent = '相手のデッキを1つ以上選んでください。'; return; }
  matchState.running = true; $('runMatch').disabled = true; $('traceBox').hidden = true;
  const pairs = [];
  if (matchState.mode === 'env') {
    const me = byKey($('myBuild').value);
    for (const o of opps) pairs.push([me, o]);
  } else {
    for (let i = 0; i < opps.length; i++) for (let j = i + 1; j < opps.length; j++) pairs.push([opps[i], opps[j]]);
  }
  const total = pairs.length * n; let done = 0;
  const bar = $('matchBar');
  $('matchMsg').textContent = '計算中…';
  const results = [];
  try {
    for (const [a, b] of pairs) {
      const acc = await runPair(a, b, n, k => { done += k; bar.style.width = (done / total * 100).toFixed(1) + '%'; });
      results.push({ a, b, acc });
    }
    matchState.last = { mode: matchState.mode, results, opps };
    if (matchState.mode === 'env') renderEnvResult(results); else renderRRResult(results, opps);
    $('matchMsg').textContent = `計算が終わりました（1組 ${n.toLocaleString()}回）`;
  } catch (err) {
    $('matchMsg').textContent = '計算中にエラーが起きました：' + err.message;
  } finally {
    matchState.running = false; $('runMatch').disabled = false;
  }
});

function renderEnvResult(results) {
  const me = results[0].a;
  let w = 0, n = 0, fw = 0, fn = 0, sw = 0, sn = 0, et = 0, en = 0;
  for (const { acc } of results) {
    w += acc.win / acc.n; n++;
    if (acc.asFirst.n) { fw += acc.asFirst.win / acc.asFirst.n; fn++; }
    if (acc.asSecond.n) { sw += acc.asSecond.win / acc.asSecond.n; sn++; }
    const fin = acc.win + acc.loss + acc.draw; if (fin) { et += acc.endTurn / fin; en++; }
  }
  $('resH').textContent = `結果：${me.type}（${me.name}） vs 環境`;
  $('tiles').innerHTML = [
    ['環境全体の勝率', n ? (w / n * 100).toFixed(1) + '%' : '--', 'acc', '選んだ相手の単純平均'],
    ['先攻の勝率', fn ? (fw / fn * 100).toFixed(1) + '%' : '--'],
    ['後攻の勝率', sn ? (sw / sn * 100).toFixed(1) + '%' : '--'],
    ['平均決着ターン', en ? (et / en).toFixed(1) : '--'],
  ].map(([k, v, c, s]) => `<div class="tile"><span class="k">${k}</span><span class="v ${c || ''}">${v}</span>${s ? `<span class="hint">${s}</span>` : ''}</div>`).join('');
  $('resultBox').innerHTML = `<table><thead><tr><th scope="col">相手デッキ</th><th scope="col">勝率</th><th scope="col" class="n">先攻</th><th scope="col" class="n">後攻</th><th scope="col" class="n">引分</th><th scope="col" class="n">未決着</th><th scope="col" class="n">決着T</th><th scope="col"><span class="sr">ログ</span></th></tr></thead><tbody>${results.map(({ b, acc }, i) => {
    const wr = acc.win / acc.n * 100; const fin = acc.win + acc.loss + acc.draw;
    return `<tr><th scope="row">${esc(b.type)}<span class="sub">${esc(buildLabel(b))}</span></th>
      <td><div class="bar"><div class="track"><div class="fill" style="width:${wr.toFixed(1)}%"></div></div><span>${wr.toFixed(1)}%</span></div></td>
      <td class="n">${pct(acc.asFirst.win, acc.asFirst.n)}%</td><td class="n">${pct(acc.asSecond.win, acc.asSecond.n)}%</td>
      <td class="n">${pct(acc.draw, acc.n)}%</td><td class="n">${pct(acc.unres, acc.n)}%</td><td class="n">${fin ? (acc.endTurn / fin).toFixed(1) : '-'}</td>
      <td><button type="button" class="linkbtn" data-trace="${i}">1ゲーム見る</button></td></tr>`;
  }).join('')}</tbody></table>`;
  $('resultBox').querySelectorAll('[data-trace]').forEach(btn => btn.addEventListener('click', () => {
    const { a, b } = results[+btn.dataset.trace];
    showTrace(a, b);
  }));
}

function renderRRResult(results, opps) {
  $('resH').textContent = '結果：総当たり';
  const key = (x, y) => x.key + '|' + y.key;
  const map = new Map();
  for (const { a, b, acc } of results) { map.set(key(a, b), acc.win / acc.n); map.set(key(b, a), acc.loss / acc.n); }
  const avg = opps.map(x => { const v = opps.filter(y => y !== x).map(y => map.get(key(x, y))); return v.reduce((s, z) => s + z, 0) / (v.length || 1); });
  $('tiles').innerHTML = opps.map((x, i) => `<div class="tile"><span class="k">${esc(x.type)}</span><span class="v">${(avg[i] * 100).toFixed(1)}%</span><span class="hint">平均勝率</span></div>`).join('');
  $('resultBox').innerHTML = `<table class="matrix"><thead><tr><th scope="col">行のデッキの勝率</th>${opps.map(o => `<th scope="col" class="n">${esc(o.type)}</th>`).join('')}</tr></thead><tbody>${opps.map(x => `<tr><th scope="row">${esc(x.type)}<span class="sub">${esc(x.name)}</span></th>${opps.map(y => {
    if (x === y) return '<td class="n">-</td>';
    const v = map.get(key(x, y)) * 100;
    const bg = v >= 55 ? '#E8F1EC' : v <= 45 ? '#FCE8EF' : 'transparent';
    return `<td class="n"><span class="cell" style="background:${bg}">${v.toFixed(1)}%</span></td>`;
  }).join('')}</tr>`).join('')}</tbody></table>`;
}

function renderLog(g, el) {
  el.innerHTML = g.logs.map(x => {
    const who = x.p == null ? '' : (x.p === 0 ? 'p1' : 'p2');
    const tag = `${x.turn ? x.turn + 'T ' : ''}${x.p == null ? '' : (x.p === 0 ? '自分' : '相手')}`;
    return `<li><span class="tag ${who}">${esc(tag || '準備')}</span><span>${esc(x.msg)}</span></li>`;
  }).join('');
}

function showTrace(a, b) {
  const seed = 1 + Math.floor(Math.random() * 1e6);
  const g = playOne({ db: DB, effects: EFFECTS, a, b, seed, trace: true, first: matchState.first === 'second' ? 1 : matchState.first === 'first' ? 0 : undefined });
  const box = $('traceBox');
  const res = g.result.winner === 0 ? '自分の勝ち' : g.result.winner === 1 ? '相手の勝ち' : g.result.winner === null ? '引き分け' : '未決着';
  box.innerHTML = `<h2>1ゲームのログ：${esc(a.type)} vs ${esc(b.type)}（${res}・${g.result.turn}ターン）</h2><ol class="log" id="traceLog"></ol>`;
  renderLog(g, $('traceLog'));
  box.hidden = false;
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------------- ② ひとり回し ----------------
function renderSoloForm() {
  fillTypeSelect($('soloType'), $('soloType').value || 'CatChu!');
  fillBuildSelect($('soloBuild'), $('soloType').value, $('soloBuild').value);
}
$('soloType').addEventListener('change', () => fillBuildSelect($('soloBuild'), $('soloType').value));

function targets(plan) {
  if (!plan || !plan.score) return [];
  return plan.score.split('→').map(s => s.trim());
}
const minOf = s => { const m = String(s || '').match(/\d+/); return m ? +m[0] : null; };

$('soloForm').addEventListener('submit', async e => {
  e.preventDefault();
  const deck = byKey($('soloBuild').value);
  if (!deck) return;
  const n = +$('soloN').value;
  const r = makeSoloRunner({ db: DB, effects: EFFECTS, deck, turns: 6 });
  let done = 0;
  while (done < n) { const k = Math.min(25, n - done); r.step(k); done += k; $('soloBar').style.width = (done / n * 100) + '%'; await sleep(); }
  const acc = r.result();
  const tg = targets(deck.plan);
  $('soloTable').innerHTML = `<table><thead><tr><th scope="col">ターン</th><th scope="col">目標の点数</th><th scope="col" class="n">ライブ成功率</th><th scope="col" class="n">成功時の平均点</th><th scope="col" class="n">目標に届いた割合</th><th scope="col">判定</th></tr></thead><tbody>${acc.turns.map((T, i) => {
    const target = tg[i] || '-';
    const min = minOf(target);
    let reach = null;
    if (min != null) {
      if (min === 0) reach = 1;
      else { let c = 0; for (const [s, k] of Object.entries(T.scores)) if (+s >= min) c += k; reach = c / acc.n; }
    }
    const verdict = reach == null ? '<span class="chip">目標なし</span>' : reach >= 0.6 ? '<span class="chip done">届いている</span>' : reach >= 0.3 ? '<span class="chip">ときどき</span>' : '<span class="chip todo">届かない</span>';
    return `<tr><th scope="row">${i + 1}T</th><td>${esc(target)}</td><td class="n">${pct(T.ok, acc.n)}%</td><td class="n">${T.ok ? (T.scoreSum / T.ok).toFixed(1) : '-'}</td><td class="n">${reach == null ? '-' : (reach * 100).toFixed(0) + '%'}</td><td>${verdict}</td></tr>`;
  }).join('')}</tbody></table>`;
  $('soloPlan').textContent = deck.plan ? `盤面の目標：${deck.plan.board}` : '';
});

$('soloTrace').addEventListener('click', () => {
  const deck = byKey($('soloBuild').value);
  if (!deck) return;
  const g = playSolo({ db: DB, effects: EFFECTS, deck, seed: 1 + Math.floor(Math.random() * 1e6), turns: 6, trace: true });
  g.logs = g.logs.filter(x => x.p !== 1);
  renderLog(g, $('soloLog'));
});

// ---------------- ③ デッキとカード ----------------
let editing = null; // 編集中のデッキ（entry）

function renderDeckList() {
  $('storeLabel').textContent = storeLabel;
  const sel = editing ? editing.key : null;
  $('deckList').innerHTML = types().map(t => `<div class="deck-group"><h3>${esc(t)}</h3>${buildsOf(t).map(e => {
    const st = coverage(e.list);
    return `<button type="button" class="deck-item ${e.key === sel ? 'sel' : ''}" data-key="${esc(e.key)}">
      <span class="nm"><span>${esc(e.name)}</span><span class="chip ${e.builtin ? '' : 'acc'}">${e.builtin ? '組み込み' : '保存'}</span></span>
      <span class="hint">最終入賞 ${esc(e.lastPlaced || '－')} · 効果 ${st.done}/${st.total}種類対応</span></button>`;
  }).join('')}</div>`).join('');
  $('deckList').querySelectorAll('[data-key]').forEach(b => b.addEventListener('click', () => openDeck(byKey(b.dataset.key))));
  $('typeList').innerHTML = types().map(t => `<option value="${esc(t)}"></option>`).join('');
  if (!editing) openDeck(entries()[0]);
}

function coverage(list) {
  let done = 0, total = 0;
  for (const [id] of list) { const c = DB[id]; if (!c || !c.text) continue; total++; if (effectStatus(c) === 'done') done++; }
  return { done, total };
}

function openDeck(e) {
  editing = e;
  $('fType').value = e ? e.type : '';
  $('fName').value = e ? e.name : '';
  $('fDate').value = e ? (e.lastPlaced || '－') : '－';
  $('fSrc').value = e ? (e.source || '') : '';
  $('fList').value = e ? recipeText(e.list, DB) : '';
  $('delDeck').disabled = !e || e.builtin;
  $('editMsg').textContent = e && e.builtin ? '組み込みのデッキです。変えて「保存」すると、保存デッキとして別に残ります。' : '';
  renderDeckDetail();
  document.querySelectorAll('.deck-item').forEach(b => b.classList.toggle('sel', e && b.dataset.key === e.key));
}

function renderDeckDetail() {
  const { list, errors } = parseRecipe($('fList').value, DB);
  const chk = checkDeck(list, DB, POINTS, POINT_LIMIT);
  $('deckCheck').innerHTML = [
    ['カード', `${chk.members + chk.lives}枚 / ${list.length}種類`],
    ['メンバー・ライブ', `${chk.members} / ${chk.lives}`],
    ['ポイント制限', `${chk.points} / ${POINT_LIMIT}`],
  ].map(([k, v]) => `<div class="tile soft"><span class="k">${k}</span><span class="v" style="font-size:20px">${v}</span></div>`).join('');
  const issues = errors.concat(chk.issues);
  $('editMsg').textContent = issues.length ? '確認：' + issues.join('／') : (editing && editing.builtin ? '組み込みのデッキです。変えて「保存」すると、保存デッキとして別に残ります。' : 'デッキの決まり（60枚・4枚まで・ポイント）を満たしています。');
  const plan = (builtinByType.get($('fType').value) || {}).plan;
  $('planBox').innerHTML = plan ? `<dl><dt>回し方（${esc($('fType').value)}）</dt><dd>盤面：${esc(plan.board)}<br>点数：${esc(plan.score)}<br>マリガン：${esc(plan.mulligan)}<br>ライブ：${esc(plan.lives)}</dd></dl>` : '<p class="hint">このデッキタイプの回し方はまだありません（標準の方針で動きます）。</p>';
  const rows = list.slice().sort((x, y) => {
    const a = DB[x[0]], b = DB[y[0]];
    return (a.kind === 'L' ? 0 : 1) - (b.kind === 'L' ? 0 : 1) || (a.cost || 0) - (b.cost || 0);
  });
  $('cardTable').innerHTML = `<table><thead><tr><th scope="col">枚数</th><th scope="col">カード</th><th scope="col">コスト</th><th scope="col">効果の種類</th><th scope="col">対応</th></tr></thead><tbody>${rows.map(([id, n]) => {
    const c = DB[id];
    const kinds = [...new Set((c.text.match(/【(登場|起動|常時|自動|ライブ開始時|ライブ成功時)】/g) || []).map(s => s.slice(1, -1)))].join('・') || 'なし';
    const st = effectStatus(c);
    const chip = st === 'none' ? '<span class="chip done">効果なし</span>' : st === 'done' ? '<span class="chip done">対応済み</span>' : '<span class="chip todo">未実装</span>';
    return `<tr><td class="n">×${n}</td><td>${esc(c.name)}<span class="mono">${esc(id)}</span></td><td>${c.kind === 'L' ? 'ライブ（' + c.score + '点）' : c.cost}</td><td title="${esc(c.text)}">${esc(kinds)}</td><td>${chip}</td></tr>`;
  }).join('')}</tbody></table>`;
}
$('fList').addEventListener('input', renderDeckDetail);
$('fType').addEventListener('input', renderDeckDetail);

function formDeck() {
  const { list } = parseRecipe($('fList').value, DB);
  return { type: $('fType').value.trim(), name: $('fName').value.trim(), lastPlaced: $('fDate').value.trim() || '－', source: $('fSrc').value.trim(), list };
}

async function saveDeck(asNew) {
  const d = formDeck();
  if (!d.type || !d.name) { $('editMsg').textContent = 'デッキタイプと構築名を入れてください。'; return; }
  if (!d.list.length) { $('editMsg').textContent = 'レシピが空です。'; return; }
  const id = !asNew && editing && !editing.builtin ? editing.id : undefined;
  const item = await store.save({ ...d, id });
  saved = await store.list();
  editing = byKey('u:' + item.id);
  renderDeckList(); openDeck(editing); renderMatchForm(); renderSoloForm();
  $('editMsg').textContent = `「${item.name}」を保存しました。`;
}
$('deckForm').addEventListener('submit', e => { e.preventDefault(); saveDeck(false); });
$('saveAs').addEventListener('click', () => saveDeck(true));
$('delDeck').addEventListener('click', async () => {
  if (!editing || editing.builtin) return;
  if (!confirm(`「${editing.name}」を削除しますか？`)) return;
  await store.remove(editing.id);
  saved = await store.list(); editing = null;
  renderDeckList(); renderMatchForm(); renderSoloForm();
});
$('newDeck').addEventListener('click', () => { openDeck(null); editing = null; $('fType').focus(); });
$('exportBtn').addEventListener('click', async () => {
  $('xferTitle').textContent = '書き出し'; $('xferHint').textContent = '保存デッキをまとめた文字列です。コピーして別の端末で「取り込む」に貼り付けます。';
  $('xferText').value = await store.exportAll(); $('xferDo').hidden = true; $('xfer').showModal();
});
$('importBtn').addEventListener('click', () => {
  $('xferTitle').textContent = '取り込み'; $('xferHint').textContent = '「書き出す」で出した文字列を貼り付けてください。';
  $('xferText').value = ''; $('xferDo').hidden = false; $('xfer').showModal();
});
$('xferDo').addEventListener('click', async () => {
  try {
    const n = await store.importAll($('xferText').value);
    saved = await store.list(); renderDeckList(); renderMatchForm(); renderSoloForm();
    $('xferHint').textContent = `${n}個のデッキを取り込みました。`;
  } catch (err) { $('xferHint').textContent = '取り込めませんでした：' + err.message; }
});

// ---------------- 起動 ----------------
(async function init() {
  try {
    DB = await fetch('./data/cards.json').then(r => r.json());
  } catch (e) {
    $('loading').textContent = 'カードデータを読み込めませんでした。'; return;
  }
  saved = await store.list();
  $('loading').hidden = true;
  renderMatchForm(); renderSoloForm();
  showTab();
})();

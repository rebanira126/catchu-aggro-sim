// ラブカの1試合を進める本体（総合ルール ver.1.06 に沿う）
// カード効果は cards/ の登録表から呼び出す。登録のないカードは数値だけのカードとして動く。
import { makeRng } from './rng.js';
import { emptyPool, addHearts, addBladeHeart, meetAll, poolTotal } from './hearts.js';

export const AREAS = ['左サイド', 'センター', '右サイド'];

let uidSeq = 1;

export class Game {
  /**
   * @param {object} opt
   * @param {object} opt.db      カードデータ（id → 定義）
   * @param {object} opt.effects カード効果の登録表（id → 効果定義）
   * @param {Array}  opt.players [{name, list:[[id,枚数],...], policy}] ×2
   * @param {number} opt.seed
   * @param {number} [opt.first] 先攻プレイヤー（0/1）。省略時はランダム
   * @param {boolean}[opt.trace] ログを残すか
   */
  constructor(opt) {
    this.db = opt.db;
    // 効果の引き方：関数（定義 → 効果）か、カード番号 → 効果 の表
    const ef = opt.effects || {};
    this.resolve = typeof ef === 'function' ? ef : (def => ef[def.id] || null);
    this.efCache = new Map();
    this.rng = makeRng(opt.seed || 1);
    this.trace = !!opt.trace;
    this.logs = [];
    this.turn = 0;
    this.result = null; // {winner: 0|1|null(引き分け), turn}
    this.p = opt.players.map((pl, i) => this.makePlayer(pl, i));
    this.first = opt.first != null ? opt.first : this.rng.int(2);
  }

  makePlayer(pl, i) {
    const deck = [];
    for (const [id, n] of pl.list) {
      const def = this.db[id];
      if (!def) throw new Error(`カードが見つかりません: ${id}`);
      for (let k = 0; k < n; k++) deck.push({ uid: uidSeq++, def });
    }
    return {
      i, name: pl.name || `P${i + 1}`, policy: pl.policy,
      deck, hand: [], waiting: [], success: [], liveZone: [], cheer: [],
      stage: [null, null, null],
      energy: { n: 0, active: 0 }, energyDeck: 12,
      lives: [], // パフォーマンス中のライブ
      turnLog: [], // ターンごとの記録
      perf: null,
      // 仮想の相手（カードを使わず、ターンごとに「何点で成功するか」の確率だけで動く）
      virtual: pl.virtual || null,
    };
  }

  opp(P) { return this.p[1 - P.i]; }

  log(P, kind, msg) {
    if (this.trace) this.logs.push({ turn: this.turn, p: P ? P.i : null, kind, msg });
  }

  name(card) { return card.def.name; }

  // ---------------- 基本の操作 ----------------
  shuffle(arr) { return this.rng.shuffle(arr); }

  // リフレッシュ（10.2）：デッキが無く控え室にカードがあれば、控え室をシャッフルしてデッキへ
  refresh(P) {
    if (P.deck.length === 0 && P.waiting.length > 0) {
      P.deck = this.shuffle(P.waiting.splice(0));
      this.log(P, 'rule', 'リフレッシュ（控え室をデッキに戻した）');
    }
  }

  topCard(P) {
    this.refresh(P);
    return P.deck.shift() || null;
  }

  bottomCard(P) {
    this.refresh(P);
    return P.deck.pop() || null;
  }

  draw(P, n = 1) {
    let got = 0;
    for (let k = 0; k < n; k++) {
      const c = this.topCard(P);
      if (!c) break;
      P.hand.push(c); got++;
    }
    return got;
  }

  activeEnergy(P) { return P.energy.active; }

  payEnergy(P, n) {
    if (n <= 0) return true;
    if (P.energy.active < n) return false;
    P.energy.active -= n;
    return true;
  }

  addEnergy(P, { active = false } = {}) {
    if (P.energyDeck <= 0) return false;
    P.energyDeck--; P.energy.n++;
    if (active) P.energy.active++;
    return true;
  }

  // カードの効果でエネルギーを置く。置いたら「エネルギーが置かれたとき」の自動能力（onEnergy）を起こす
  // lock：次のターンのアクティブフェイズにアクティブにならない
  addEnergyByEffect(P, { active = false, lock = false, label = '' } = {}) {
    if (!this.addEnergy(P, { active })) return false;
    if (lock) P.energy.locked = (P.energy.locked || 0) + 1;
    this.log(P, 'eff', `${label}エネルギーを1枚${active ? 'アクティブ' : 'ウェイト'}状態で置いた（${P.energy.n}枚）`);
    P.stage.forEach((s, area) => {
      if (!s) return;
      const ef = this.effect(s.card);
      if (ef && ef.onEnergy) ef.onEnergy({ g: this, me: P, opp: this.opp(P), card: s.card, slot: s, area });
    });
    return true;
  }

  // 成功ライブカード置き場（と、指定があればライブカード置き場）にあるカードの常時能力。同じカードは重複しない
  zoneStatics(P, hook, { live = false } = {}) {
    const seen = new Set();
    const out = [];
    const cards = live ? P.success.concat(P.liveZone) : P.success;
    for (const c of cards) {
      const ef = this.effect(c);
      if (!ef || !ef[hook] || seen.has(c.def.id)) continue;
      if (live && ef.zones && !ef.zones.some(z => (z === 'success' ? P.success : P.liveZone).includes(c))) continue;
      seen.add(c.def.id);
      out.push({ ef, card: c });
    }
    return out;
  }

  // ライブの必要ハート（成功ライブ置き場のカードの常時能力 needMod を反映）
  liveNeed(P, card) {
    const need = card.def.need.slice();
    for (const { ef } of this.zoneStatics(P, 'needMod')) ef.needMod({ g: this, me: P, card, need });
    for (let i = 0; i < need.length; i++) need[i] = Math.max(0, need[i]);
    return need;
  }

  // エネルギーカード（メンバーの下に置くとき用）
  energyCard() { return { uid: uidSeq++, def: { kind: 'E', id: 'ENERGY', name: 'エネルギー' } }; }

  // [ターン1回] などの回数制限。使えたら true を返して回数を数える
  useOnce(slot, key, limit = 1) {
    slot.uses = slot.uses || {};
    const u = slot.uses[key];
    const n = u && u.turn === this.turn ? u.n : 0;
    if (n >= limit) return false;
    slot.uses[key] = { turn: this.turn, n: n + 1 };
    return true;
  }

  // メンバーが持つ起動能力（下に置かれたカードから得たものも含む）
  abilities(slot) {
    const ef = this.effect(slot.card);
    const list = ((ef && ef.activated) || []).map((ab, k) => ({ ab, key: `${slot.card.def.id}#${k}`, card: slot.card }));
    if (ef && ef.inheritUnder) {
      for (const u of slot.under) {
        if (u.def.kind !== 'M' || !ef.inheritUnder(u.def)) continue;
        const ue = this.effect(u);
        ((ue && ue.activated) || []).forEach((ab, k) => list.push({ ab, key: `${u.def.id}#${k}`, card: u }));
      }
    }
    return list;
  }

  effect(card) {
    const def = card.def;
    if (!this.efCache.has(def.id)) this.efCache.set(def.id, this.resolve(def) || null);
    return this.efCache.get(def.id);
  }

  // 同時に起きる自動能力（ライブ開始時・ライブ成功時）を、効果ごとの順番（order が小さい順）で解決する
  fire(P, hook, extra = {}) {
    const opp = this.opp(P);
    const list = [];
    P.stage.forEach((s, area) => {
      if (!s) return;
      const ef = this.effect(s.card);
      if (ef && ef[hook]) list.push({ ef, ctx: { g: this, me: P, opp, card: s.card, slot: s, area, lives: P.lives, ...extra } });
    });
    for (const live of P.lives.slice()) {
      const ef = this.effect(live.card);
      if (ef && ef[hook]) list.push({ ef, ctx: { g: this, me: P, opp, card: live.card, live, lives: P.lives, ...extra } });
    }
    list.sort((a, b) => ((a.ef.order && a.ef.order[hook]) ?? 5) - ((b.ef.order && b.ef.order[hook]) ?? 5));
    for (const { ef, ctx } of list) ef[hook](ctx);
  }

  // ---------------- メンバー ----------------
  // 置けるエリアか（このターンにステージに来たメンバーのいるエリアは指定できない 9.6.2.1.2.1）
  canTarget(P, area) {
    const s = P.stage[area];
    if (s && s.enteredTurn === this.turn) return false;
    // バトンタッチで控え室に置けないメンバー
    const ef = s && this.effect(s.card);
    if (ef && ef.noBatonOut) return false;
    return true;
  }

  // 実際に払うコスト（バトンタッチ時は置き換えるメンバーのコスト分減る）
  playCost(P, card, area, baton) {
    let cost = this.costOf(P, card);
    const s = P.stage[area];
    if (baton && s && cost > 0) cost = Math.max(0, cost - s.card.def.cost);
    return cost;
  }

  costOf(P, card) {
    const ef = this.effect(card);
    let c = card.def.cost;
    if (ef && ef.handCost) c = ef.handCost({ g: this, me: P, card, base: c });
    // ステージのメンバーの常時能力によるコストの増減（costMod）
    for (const s of P.stage) {
      if (!s) continue;
      const se = this.effect(s.card);
      if (se && se.costMod) c += se.costMod({ g: this, me: P, card, slot: s }) || 0;
    }
    for (const { ef } of this.zoneStatics(P, 'costMod')) c += ef.costMod({ g: this, me: P, card }) || 0;
    return Math.max(0, c);
  }

  // 手札のメンバーをプレイする。成功したら true
  play(P, handIdx, area, baton = true, area2 = null) {
    const card = P.hand[handIdx];
    if (!card || card.def.kind !== 'M') return false;
    if (!this.canTarget(P, area)) return false;
    const prev = P.stage[area];
    const doBaton = !!(baton && prev);
    let cost = this.playCost(P, card, area, doBaton);
    // 2人とバトンタッチ（doubleBaton を持つカード）
    let second = null;
    const ef = this.effect(card);
    if (area2 != null) {
      second = P.stage[area2];
      if (!doBaton || !ef || !ef.doubleBaton || area2 === area || !second || !this.canTarget(P, area2)) return false;
      cost = Math.max(0, cost - second.card.def.cost);
    }
    if (!this.payEnergy(P, cost)) return false;
    const handCost = this.costOf(P, card);
    P.hand.splice(handIdx, 1);
    // 別のコストの払い方（手札を控え室に置いてコストを下げる、など）
    if (ef && ef.onPay) ef.onPay({ g: this, me: P, card, cost: handCost });
    if (second) {
      P.stage[area2] = null;
      for (const u of second.under) { if (u.def.kind === 'E') P.energyDeck++; else P.waiting.push(u); }
      P.waiting.push(second.card);
      this.log(P, 'play', `${AREAS[area2]}の${second.card.def.name}ともバトンタッチ`);
    }
    this.putMember(P, card, area, { baton: doBaton, from: 'hand', second });
    return true;
  }

  // メンバーをエリアに置く（プレイでも効果による登場でも使う）
  putMember(P, card, area, { baton = false, from = 'hand', second = null } = {}) {
    const prev = P.stage[area];
    const slot = { card, active: true, under: [], enteredTurn: this.turn, mods: [] };
    if (prev) {
      // バトンタッチ、または重複メンバー処理（10.4）：前のメンバーは控え室へ
      for (const u of prev.under) {
        if (u.def.kind === 'E') { P.energyDeck++; } else P.waiting.push(u);
      }
      const pe = this.effect(prev.card);
      // 「バトンタッチで控え室に置かれたとき、そのメンバーの下に置く」カード
      if (baton && pe && pe.underOnBaton) slot.under.push(prev.card);
      else P.waiting.push(prev.card);
      // 「バトンタッチして控え室に置かれたとき」の自動能力
      if (baton && pe && pe.onBatonOut) pe.onBatonOut({ g: this, me: P, card: prev.card, newCard: card });
    }
    P.stage[area] = slot;
    this.log(P, 'play', `${AREAS[area]}に${card.def.name}（コスト${card.def.cost}）を${baton ? 'バトンタッチで' : ''}登場`);
    const ef = this.effect(card);
    if (ef && ef.onEnter) ef.onEnter({ g: this, me: P, opp: this.opp(P), card, slot, area, baton, batonFrom: baton ? prev : null, second, from });
    // 「自分のステージにメンバーが登場したとき」の自動能力（ステージのほかのメンバーも含む）
    P.stage.forEach((s, a) => {
      if (!s) return;
      const se = this.effect(s.card);
      if (se && se.onAnyEnter) se.onAnyEnter({ g: this, me: P, opp: this.opp(P), card: s.card, slot: s, area: a, entered: slot, enteredArea: area });
    });
    return slot;
  }

  members(P) { return P.stage.map((s, a) => (s ? { ...s, area: a } : null)).filter(Boolean); }

  // メンバーのブレード数（常時効果・一時的な増減を含む）
  bladesOf(P, slot, area) {
    let b = slot.card.def.blades;
    const ef = this.effect(slot.card);
    if (ef && ef.blades) b += ef.blades({ g: this, me: P, slot, area }) || 0;
    for (const m of slot.mods) if (m.blades) b += m.blades;
    // ステージのメンバーがほかのメンバーに与えるブレード（bladeAura）
    for (const o of P.stage) {
      if (!o) continue;
      const oe = this.effect(o.card);
      if (oe && oe.bladeAura) b += oe.bladeAura({ g: this, me: P, slot, area, source: o }) || 0;
    }
    // 下に置かれたカードが与えるブレード（underBlades）
    for (const u of slot.under) {
      const ue = u.def.kind === 'M' && this.effect(u);
      if (ue && ue.underBlades) b += ue.underBlades({ g: this, me: P, slot, area, card: u }) || 0;
    }
    return Math.max(0, b);
  }

  // メンバーのハート（[桃..紫]、ALL、無色を返す）
  heartsOf(P, slot, area) {
    const h = slot.card.def.hearts.slice();
    let all = 0;
    const ef = this.effect(slot.card);
    const extra = [];
    if (ef && ef.hearts) extra.push(ef.hearts({ g: this, me: P, slot, area }));
    for (const m of slot.mods) if (m.hearts) extra.push(m.hearts);
    for (const e of extra) {
      if (!e) continue;
      if (e.c) for (let i = 0; i < 6; i++) h[i] += e.c[i] || 0;
      if (e.all) all += e.all;
    }
    return { h, all };
  }

  // ---------------- 試合の流れ ----------------
  setup() {
    for (const P of this.p) {
      this.shuffle(P.deck);
      this.draw(P, 6);
      for (let k = 0; k < 3; k++) this.addEnergy(P, { active: true });
    }
    // マリガン：先攻から（6.2.1.6）
    for (const P of this.order()) {
      const back = P.policy.mulligan(this.view(P)) || [];
      const idxs = [...new Set(back)].filter(i => i >= 0 && i < P.hand.length).sort((a, b) => b - a);
      if (!idxs.length) continue;
      const aside = idxs.map(i => P.hand.splice(i, 1)[0]);
      this.draw(P, aside.length);
      P.deck.push(...aside);
      this.shuffle(P.deck);
      this.log(P, 'mull', `マリガン：${aside.map(c => c.def.name).join('、')}を戻した`);
    }
  }

  order() { return [this.p[this.first], this.p[1 - this.first]]; }

  run(maxTurns = 12) {
    this.setup();
    while (!this.result && this.turn < maxTurns) {
      this.turn++;
      for (const P of this.order()) this.normalPhase(P);
      this.livePhase();
    }
    if (!this.result) this.result = { winner: undefined, turn: this.turn }; // 未決着
    return this.result;
  }

  normalPhase(P) {
    // アクティブフェイズ
    for (const s of P.stage) if (s) { if (s.lockActive) s.lockActive = false; else s.active = true; }
    P.energy.active = Math.max(0, P.energy.n - (P.energy.locked || 0));
    P.energy.locked = 0;
    // エネルギーフェイズ
    if (this.addEnergy(P)) P.energy.active++;
    // ドローフェイズ
    this.draw(P, 1);
    this.log(P, 'turn', `${this.turn}ターン目（${P === this.p[this.first] ? '先攻' : '後攻'}）：エネルギー${P.energy.n}、手札${P.hand.length}枚`);
    // メインフェイズ（仮想の相手は何もしない）
    if (!P.virtual) P.policy.main(this.mainApi(P));
  }

  mainApi(P) {
    const g = this;
    return {
      g, me: P, opp: this.opp(P), turn: this.turn,
      isFirst: P === this.p[this.first],
      play: (handIdx, area, baton = true, area2 = null) => g.play(P, handIdx, area, baton, area2),
      activate: (area, abilityIdx = 0) => g.activate(P, area, abilityIdx),
      view: () => g.view(P),
    };
  }

  // 起動能力
  activate(P, area, k = 0) {
    const s = P.stage[area];
    if (!s) return false;
    const item = this.abilities(s)[k];
    if (!item) return false;
    const { ab, key } = item;
    const ctx = { g: this, me: P, opp: this.opp(P), card: s.card, slot: s, area };
    if (ab.can && !ab.can(ctx)) return false;
    if (ab.once && !this.useOnce(s, key, ab.once)) return false;
    return ab.run(ctx) !== false;
  }

  livePhase() {
    const [A, B] = this.order();
    // ライブカードセット（先攻 → 後攻）
    for (const P of [A, B]) {
      if (P.virtual) { this.virtualSet(P); continue; }
      const pick = P.policy.setLives(this.view(P)) || [];
      const idxs = [...new Set(pick)].filter(i => i >= 0 && i < P.hand.length).slice(0, 3).sort((a, b) => b - a);
      const set = idxs.map(i => P.hand.splice(i, 1)[0]);
      P.liveZone.push(...set);
      this.draw(P, set.length);
      if (set.length) this.log(P, 'set', `ライブカード置き場に${set.length}枚セット`);
    }
    // 盤面の記録（集計用）
    for (const P of [A, B]) (P.stageLog = P.stageLog || []).push({ s: P.stage.map(x => (x ? x.card.def.cost : 0)).join('-'), E: P.energy.n, h: P.hand.length });
    // パフォーマンス（先攻 → 後攻）
    for (const P of [A, B]) this.perform(P);
    this.judge();
  }

  // 仮想の相手：このターンの結果をくじで決め、ライブするならダミーのライブを1枚伏せる
  virtualSet(P) {
    const table = P.virtual[Math.min(this.turn, P.virtual.length - 1)] || [];
    let r = this.rng() * table.reduce((a, x) => a + x.w, 0);
    let pick = table[table.length - 1] || { kind: 'none' };
    for (const x of table) { r -= x.w; if (r <= 0) { pick = x; break; } }
    P.vPick = pick;
    if (pick.kind === 'none') return;
    P.liveZone.push({ uid: uidSeq++, def: { kind: 'L', id: 'VIRTUAL', name: '（相手のライブ）', score: 0, need: [0, 0, 0, 0, 0, 0, 0], names: [], groups: [], text: '' } });
    this.log(P, 'set', 'ライブカード置き場に1枚セット');
  }

  perform(P) {
    P.perf = null;
    if (P.virtual && P.liveZone.length) {
      const pick = P.vPick || { kind: 'fail' };
      const perf = { cheerN: 0, cheer: [], scoreIcons: 0, ok: pick.kind === 'ok', score: 0, setCount: 1, totalBonus: 0, excess: 0 };
      P.perf = perf;
      if (perf.ok) { P.lives = [{ card: P.liveZone[0], need: [0, 0, 0, 0, 0, 0, 0], bonus: pick.score }]; this.log(P, 'live', `ライブ：${pick.score}点で成功`); }
      else { P.liveZone = []; P.lives = []; this.log(P, 'live', 'ライブ失敗'); }
      return;
    }
    const nonLive = P.liveZone.filter(c => c.def.kind !== 'L');
    P.liveZone = P.liveZone.filter(c => c.def.kind === 'L');
    P.waiting.push(...nonLive);
    if (!P.liveZone.length) { this.log(P, 'live', 'ライブなし'); return; }
    P.lives = P.liveZone.map(card => ({ card, need: this.liveNeed(P, card), bonus: 0 }));
    const perf = { cheerN: 0, cheer: [], scoreIcons: 0, ok: false, score: 0, setCount: P.liveZone.length, totalBonus: 0 };
    P.perf = perf;
    this.log(P, 'live', `ライブ：${P.lives.map(l => l.card.def.name).join('＋')}`);
    // ライブ開始時（11.5）
    this.fire(P, 'liveStart');
    // エール（8.3.10〜8.3.12）
    let blades = 0;
    P.stage.forEach((s, area) => { if (s && s.active) blades += this.bladesOf(P, s, area); });
    blades += perf.cheerBonus || 0;
    perf.cheerN = blades;
    // 「エールをデッキの下から行う」常時能力（ライブカード置き場のライブ）
    const fromBottom = P.liveZone.some(c => { const e = this.effect(c); return e && e.cheerFromBottom; });
    let draws = 0;
    for (let k = 0; k < blades; k++) {
      const c = fromBottom ? this.bottomCard(P) : this.topCard(P);
      if (!c) break;
      perf.cheer.push(c);
      if (c.def.icon === 'draw') draws++;
      if (c.def.icon === 'score') perf.scoreIcons++;
    }
    P.cheer = perf.cheer;
    if (draws) this.draw(P, draws);
    // エールのあとのチェックタイミング（8.3.13）：「エールにより公開された〜とき」の自動能力
    this.fire(P, 'cheer');
    // 所有ハート（8.3.14）：全メンバーのハート＋エールのブレードハート
    const pool = emptyPool();
    P.stage.forEach((s, area) => {
      if (!s) return;
      const { h, all } = this.heartsOf(P, s, area);
      addHearts(pool, h); pool.all += all;
    });
    for (const c of perf.cheer) addBladeHeart(pool, c.def.bh);
    perf.pool = pool;
    const res = meetAll(pool, P.lives.map(l => l.need));
    perf.ok = res.ok;
    // 余剰ハート：必要ハートを満たしたあとに残ったハートの数
    perf.excess = res.ok ? poolTotal(res.rest) : 0;
    this.log(P, 'cheer', `エール${blades}枚（ドロー${draws}・スコア${perf.scoreIcons}）→ ${res.ok ? '成功' : '失敗'}`);
    if (!res.ok) {
      P.waiting.push(...P.liveZone);
      P.liveZone = []; P.lives = [];
    }
  }

  liveScore(P) {
    if (!P.liveZone.length) return null;
    let s = 0;
    for (const l of P.lives) s += l.card.def.score + l.bonus;
    s += (P.perf ? P.perf.scoreIcons : 0) + (P.perf ? (P.perf.totalBonus || 0) : 0);
    for (const { ef } of this.zoneStatics(P, 'zoneScoreBonus', { live: true })) s += ef.zoneScoreBonus({ g: this, me: P }) || 0;
    // 「ライブの合計スコアを＋１する」常時能力（ステージのメンバー、ライブ終了時までの効果）
    P.stage.forEach((sl, area) => {
      if (!sl) return;
      const ef = this.effect(sl.card);
      if (ef && ef.scoreBonus) s += ef.scoreBonus({ g: this, me: P, slot: sl, area }) || 0;
      for (const m of sl.mods) if (m.score) s += m.score;
    });
    return s;
  }

  judge() {
    const [A, B] = this.order();
    // ライブ成功時（8.4.4）
    for (const P of [A, B]) if (P.liveZone.length) this.fire(P, 'liveSuccess');
    const sa = this.liveScore(A), sb = this.liveScore(B);
    A.lastScore = sa; B.lastScore = sb;
    let winners = [];
    if (sa == null && sb == null) winners = [];
    else if (sb == null) winners = [A];
    else if (sa == null) winners = [B];
    else if (sa > sb) winners = [A];
    else if (sb > sa) winners = [B];
    else winners = [A, B];
    const moved = [];
    for (const P of winners) {
      if (winners.length === 2 && P.success.length === 2) continue; // 千秋楽の同点は移動しない（8.4.7.1）
      if (!P.liveZone.length) continue;
      const k = P.policy.chooseSuccess ? P.policy.chooseSuccess(this.view(P), P.liveZone) : 0;
      const card = P.liveZone.splice(Math.max(0, Math.min(k || 0, P.liveZone.length - 1)), 1)[0];
      P.success.push(card);
      moved.push(P);
    }
    for (const P of [A, B]) {
      const rec = {
        turn: this.turn, first: P === A, set: P.perf ? P.perf.setCount : 0,
        attempted: !!P.perf, ok: !!(P.perf && P.perf.ok), score: P.lastScore, won: moved.includes(P),
        success: P.success.length,
      };
      P.turnLog.push(rec);
      this.log(P, 'judge', `スコア ${rec.score == null ? '-' : rec.score} ${rec.won ? '→ 成功ライブ獲得' : ''}（${P.success.length}枚）`);
      P.waiting.push(...P.liveZone, ...P.cheer);
      P.liveZone = []; P.cheer = []; P.lives = []; P.perf = null;
      for (const s of P.stage) if (s) s.mods = s.mods.filter(m => !m.untilLiveEnd);
    }
    // 勝敗（1.2.1）
    const wa = A.success.length >= 3, wb = B.success.length >= 3;
    if (wa && wb) this.result = { winner: null, turn: this.turn };
    else if (wa) this.result = { winner: A.i, turn: this.turn };
    else if (wb) this.result = { winner: B.i, turn: this.turn };
    if (this.result) this.log(null, 'end', this.result.winner == null ? '引き分け' : `${this.p[this.result.winner].name}の勝ち`);
    // 次のターンの先攻（8.4.13）
    if (moved.length === 1) this.first = moved[0].i;
  }

  // 方針（AI）に渡す情報
  view(P) {
    const opp = this.opp(P);
    return {
      g: this, me: P, opp, turn: this.turn,
      isFirst: P === this.p[this.first],
      hand: P.hand, stage: P.stage, energy: P.energy,
      mySuccess: P.success.length, oppSuccess: opp.success.length,
    };
  }
}

// ラブカの1試合を進める本体（総合ルール ver.1.06 に沿う）
// カード効果は cards/ の登録表から呼び出す。登録のないカードは数値だけのカードとして動く。
import { makeRng } from './rng.js';
import { emptyPool, addHearts, addBladeHeart, meetAll } from './hearts.js';

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
    this.effects = opt.effects || {};
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

  effect(card) { return this.effects[card.def.id] || null; }

  // ---------------- メンバー ----------------
  // 置けるエリアか（このターンにステージに来たメンバーのいるエリアは指定できない 9.6.2.1.2.1）
  canTarget(P, area) {
    const s = P.stage[area];
    return !(s && s.enteredTurn === this.turn);
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
    return Math.max(0, c);
  }

  // 手札のメンバーをプレイする。成功したら true
  play(P, handIdx, area, baton = true) {
    const card = P.hand[handIdx];
    if (!card || card.def.kind !== 'M') return false;
    if (!this.canTarget(P, area)) return false;
    const prev = P.stage[area];
    const doBaton = !!(baton && prev);
    const cost = this.playCost(P, card, area, doBaton);
    if (!this.payEnergy(P, cost)) return false;
    P.hand.splice(handIdx, 1);
    this.putMember(P, card, area, { baton: doBaton, from: 'hand' });
    return true;
  }

  // メンバーをエリアに置く（プレイでも効果による登場でも使う）
  putMember(P, card, area, { baton = false, from = 'hand' } = {}) {
    const prev = P.stage[area];
    if (prev) {
      // バトンタッチ、または重複メンバー処理（10.4）：前のメンバーは控え室へ
      P.waiting.push(prev.card);
      for (const u of prev.under) {
        if (u.def.kind === 'E') { P.energyDeck++; } else P.waiting.push(u);
      }
    }
    const slot = { card, active: true, under: [], enteredTurn: this.turn, mods: [] };
    P.stage[area] = slot;
    this.log(P, 'play', `${AREAS[area]}に${card.def.name}（コスト${card.def.cost}）を${baton ? 'バトンタッチで' : ''}登場`);
    const ef = this.effect(card);
    if (ef && ef.onEnter) ef.onEnter({ g: this, me: P, opp: this.opp(P), card, slot, area, baton, batonFrom: baton ? prev : null, from });
    return slot;
  }

  members(P) { return P.stage.map((s, a) => (s ? { ...s, area: a } : null)).filter(Boolean); }

  // メンバーのブレード数（常時効果・一時的な増減を含む）
  bladesOf(P, slot, area) {
    let b = slot.card.def.blades;
    const ef = this.effect(slot.card);
    if (ef && ef.blades) b += ef.blades({ g: this, me: P, slot, area }) || 0;
    for (const m of slot.mods) if (m.blades) b += m.blades;
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
    for (const s of P.stage) if (s) { s.active = true; }
    P.energy.active = P.energy.n;
    // エネルギーフェイズ
    if (this.addEnergy(P)) P.energy.active++;
    // ドローフェイズ
    this.draw(P, 1);
    this.log(P, 'turn', `${this.turn}ターン目（${P === this.p[this.first] ? '先攻' : '後攻'}）：エネルギー${P.energy.n}、手札${P.hand.length}枚`);
    // メインフェイズ
    P.policy.main(this.mainApi(P));
  }

  mainApi(P) {
    const g = this;
    return {
      g, me: P, opp: this.opp(P), turn: this.turn,
      isFirst: P === this.p[this.first],
      play: (handIdx, area, baton = true) => g.play(P, handIdx, area, baton),
      activate: (area, abilityIdx = 0) => g.activate(P, area, abilityIdx),
      view: () => g.view(P),
    };
  }

  // 起動能力
  activate(P, area, k = 0) {
    const s = P.stage[area];
    if (!s) return false;
    const ef = this.effect(s.card);
    const ab = ef && ef.activated && ef.activated[k];
    if (!ab) return false;
    const ctx = { g: this, me: P, opp: this.opp(P), card: s.card, slot: s, area };
    if (ab.can && !ab.can(ctx)) return false;
    return ab.run(ctx) !== false;
  }

  livePhase() {
    const [A, B] = this.order();
    // ライブカードセット（先攻 → 後攻）
    for (const P of [A, B]) {
      const pick = P.policy.setLives(this.view(P)) || [];
      const idxs = [...new Set(pick)].filter(i => i >= 0 && i < P.hand.length).slice(0, 3).sort((a, b) => b - a);
      const set = idxs.map(i => P.hand.splice(i, 1)[0]);
      P.liveZone.push(...set);
      this.draw(P, set.length);
      if (set.length) this.log(P, 'set', `ライブカード置き場に${set.length}枚セット`);
    }
    // パフォーマンス（先攻 → 後攻）
    for (const P of [A, B]) this.perform(P);
    this.judge();
  }

  perform(P) {
    P.perf = null;
    const nonLive = P.liveZone.filter(c => c.def.kind !== 'L');
    P.liveZone = P.liveZone.filter(c => c.def.kind === 'L');
    P.waiting.push(...nonLive);
    if (!P.liveZone.length) { this.log(P, 'live', 'ライブなし'); return; }
    P.lives = P.liveZone.map(card => ({ card, need: card.def.need.slice(), bonus: 0 }));
    const perf = { cheerN: 0, cheer: [], scoreIcons: 0, ok: false, score: 0, setCount: P.liveZone.length };
    P.perf = perf;
    this.log(P, 'live', `ライブ：${P.lives.map(l => l.card.def.name).join('＋')}`);
    // ライブ開始時（11.5）：ステージのメンバー → ライブカードの順
    const opp = this.opp(P);
    P.stage.forEach((s, area) => {
      if (!s) return;
      const ef = this.effect(s.card);
      if (ef && ef.liveStart) ef.liveStart({ g: this, me: P, opp, card: s.card, slot: s, area, lives: P.lives });
    });
    for (const live of P.lives.slice()) {
      const ef = this.effect(live.card);
      if (ef && ef.liveStart) ef.liveStart({ g: this, me: P, opp, card: live.card, live, lives: P.lives });
    }
    // エール（8.3.10〜8.3.12）
    let blades = 0;
    P.stage.forEach((s, area) => { if (s && s.active) blades += this.bladesOf(P, s, area); });
    perf.cheerN = blades;
    let draws = 0;
    for (let k = 0; k < blades; k++) {
      const c = this.topCard(P);
      if (!c) break;
      perf.cheer.push(c);
      if (c.def.icon === 'draw') draws++;
      if (c.def.icon === 'score') perf.scoreIcons++;
    }
    P.cheer = perf.cheer;
    if (draws) this.draw(P, draws);
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
    return s;
  }

  judge() {
    const [A, B] = this.order();
    // ライブ成功時（8.4.4）
    for (const P of [A, B]) {
      if (!P.liveZone.length) continue;
      const opp = this.opp(P);
      P.stage.forEach((s, area) => {
        if (!s) return;
        const ef = this.effect(s.card);
        if (ef && ef.liveSuccess) ef.liveSuccess({ g: this, me: P, opp, card: s.card, slot: s, area, lives: P.lives });
      });
      for (const live of P.lives.slice()) {
        const ef = this.effect(live.card);
        if (ef && ef.liveSuccess) ef.liveSuccess({ g: this, me: P, opp, card: live.card, live, lives: P.lives });
      }
    }
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

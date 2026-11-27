// トマカノーテ（CFJUG）：トマカノーテ（2026-11改訂版）から、依頼者が基本形として組み直したもの（デッキコード CFJUG）
// 葉月 恋 bp1-005×4 → 澁谷かのん bp5-012×4、桜小路きな子 sd1-006×2 → 嵐 千砂都 pb2-036×2（千砂都は4枚に）。
// 回し方は2026-11改訂版と同じ（strategy をそのまま使う）。
import base from './liella-tomakanote-2611.js';

export default {
  ...base,
  id: "liella-tomakanote-cfjug",
  name: "トマカノーテ（CFJUG）",
  code: "CFJUG",
  lastPlaced: "－",
  source: "https://decklog.bushiroad.com/view/CFJUG",
  list: [
    ["PL!SP-bp2-024", 4], // ビタミンSUMMER!（ライブ）
    ["PL!SP-bp2-025", 4], // Bubble Rise（ライブ）
    ["PL!SP-pb2-046", 4], // Butterfly Wing（ライブ）
    ["PL!SP-bp1-011", 4], // 鬼塚冬毬（コスト2・ライブ回収）
    ["PL!SP-pb2-033", 4], // 鬼塚冬毬（コスト2・メンバー回収）
    ["PL!SP-bp5-012", 4], // 澁谷かのん（コスト2）
    ["PL!SP-bp4-001", 4], // 澁谷かのん（コスト4）
    ["PL!SP-bp5-008", 4], // 若菜四季（コスト4）
    ["PL!SP-bp5-013", 4], // 唐 可可（コスト4）
    ["PL!SP-pb2-024", 4], // 唐 可可（コスト4）
    ["PL!SP-pb2-036", 4], // 嵐 千砂都（コスト5）
    ["PL!SP-pb2-029", 4], // 米女メイ（コスト9）
    ["PL!SP-pb2-035", 4], // 唐 可可（コスト9）
    ["PL!SP-bp2-001", 4], // 澁谷かのん（コスト13）
    ["PL!SP-bp2-010", 4], // ウィーン・マルガレーテ（コスト15）
  ],
  plan: {
    ...base.plan,
    key: base.plan.key + "。2コスのかのん bp5-012 はビタミンSUMMER!・Bubble Riseを置くと黄ハートが2つになり、名前がかのんなのでBubble Riseの条件も満たす",
  },
};

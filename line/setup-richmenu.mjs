// 報平安官方帳號：建立並套用圖文選單（六格）
// 用法：node setup-richmenu.mjs  → 依提示貼上「報平安」的 Channel access token (long-lived)
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const NAME = 'safe-main-v1';
const W = 2500, H = 1686, COLS = 3, ROWS = 2, CW = W / COLS, RH = H / ROWS;
const area = (i, action) => {
  const c = i % COLS, r = Math.floor(i / COLS);
  const x = Math.round(c * CW), y = Math.round(r * RH);
  return { bounds: { x, y, width: Math.round((c + 1) * CW) - x, height: Math.round((r + 1) * RH) - y }, action };
};
const menu = {
  size: { width: W, height: H },
  selected: true,
  name: NAME,
  chatBarText: '防詐・報平安 選單',
  areas: [
    area(0, { type: 'message', label: '查可疑訊息', text: '查訊息' }),
    area(1, { type: 'message', label: '查電話', text: '查電話' }),
    area(2, { type: 'uri', label: '撥打165', uri: 'tel:165' }),
    area(3, { type: 'uri', label: '我要報平安', uri: 'https://kftseng2oo1.github.io/safe/' }),
    area(4, { type: 'message', label: '平安狀態', text: '平安狀態' }),
    area(5, { type: 'uri', label: '防詐App', uri: 'https://kftseng2oo1.github.io/scam/' }),
  ],
};

let token = (process.env.LINE_CHANNEL_ACCESS_TOKEN || '').trim();
if (!token) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  token = (await rl.question('貼上「報平安」的 Channel access token 後按 Enter：')).trim();
  rl.close();
}
if (!/^[A-Za-z0-9+/=]{100,}$/.test(token)) {
  console.error('✗ 這看起來不是 Channel access token（應是 100 字以上的英數字）。請到 LINE Developers → 報平安 → Messaging API 分頁最下方複製。');
  process.exit(1);
}
const auth = { Authorization: 'Bearer ' + token };
async function call(url, opt = {}) {
  const r = await fetch(url, { ...opt, headers: { ...auth, ...(opt.headers || {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`${opt.method || 'GET'} ${url} → ${r.status} ${t}`);
  return t ? JSON.parse(t) : {};
}

try {
  const { richMenuId } = await call('https://api.line.me/v2/bot/richmenu', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(menu),
  });
  console.log('建立選單', richMenuId);
  const png = await readFile(path.join(here, 'richmenu.png'));
  await call(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: 'POST', headers: { 'Content-Type': 'image/png' }, body: png,
  });
  console.log('已上傳圖片');
  await call(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, { method: 'POST' });
  console.log('已設為預設選單');
  // 清掉舊版同名選單
  const { richmenus = [] } = await call('https://api.line.me/v2/bot/richmenu/list');
  for (const m of richmenus) {
    if (m.richMenuId !== richMenuId && /^safe-main-/.test(m.name)) {
      await call(`https://api.line.me/v2/bot/richmenu/${m.richMenuId}`, { method: 'DELETE' });
      console.log('移除舊選單', m.richMenuId);
    }
  }
  console.log('完成 ✅ 若手機上沒看到新選單，把聊天室關掉再打開。');
} catch (e) {
  console.error('✗ 失敗：', e.message);
  process.exit(1);
}

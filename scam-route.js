// ===== arcar /scam 路由：防詐查證 =====
// 用法：在 arcar 的 fetch handler 裡加上
//   if (url.pathname === '/scam') return handleScam(request, env, corsHeaders);
// 需要的 secret：ANTHROPIC_API_KEY（若 arcar 已用其他名稱，改下面 KEY_NAME）
// 不寫入任何 KV，訊息內容不留存。

const SCAM_MODEL = 'claude-haiku-5-5';   // 想更準可改 'claude-sonnet-5-5'
const KEY_NAME = 'ANTHROPIC_API_KEY';

const SCAM_SYSTEM = `你是台灣的反詐騙查證助理，使用者多半是長輩。請判斷使用者提供的訊息、電話、網址或截圖是否為詐騙。

只輸出一個 JSON 物件，不要任何其他文字：
{"level":"danger|suspicious|safe","summary":"一句話結論，15字內","reasons":["原因1","原因2"],"advice":"具體建議，40字內"}

判斷原則：
- danger：符合台灣常見詐騙手法，例如解除分期、假檢警監管帳戶、假投資／老師帶單、假親友借錢換號碼、要驗證碼或密碼、遊戲點數付款、假物流／假健保／假罰單／假欠費連結、假中獎退稅、假網拍、假交友要錢、偽冒政府但網址不是 .gov.tw。
- suspicious：有部分可疑跡象但無法確定，或資訊不足。
- safe：只有在內容明顯是一般生活訊息、且沒有要錢、要個資、要點連結、要加好友時才用。拿不準就選 suspicious。
- reasons 最多 3 點，每點 25 字內，用長輩聽得懂的白話，不用英文縮寫。
- advice 要具體可做：例如「不要點連結，打 165 確認」、「打舊號碼給本人確認」、「直接打銀行背面的客服電話」。
- 電話或網址若無法查證，請說明無法確認，並教對方自行用官方管道查詢。
- 不要要求使用者提供更多個資。`;

async function handleScam(request, env, corsHeaders) {
  const headers = { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' };
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'POST only' }), { status: 405, headers });

  let body;
  try { body = await request.json(); } catch (e) {
    return new Response(JSON.stringify({ error: 'bad json' }), { status: 400, headers });
  }
  const text = String(body.text || '').slice(0, 4000);
  const image = typeof body.image === 'string' ? body.image : null;
  if (!text && !image) return new Response(JSON.stringify({ error: 'empty' }), { status: 400, headers });
  if (image && image.length > 2_800_000) return new Response(JSON.stringify({ error: 'image too large' }), { status: 413, headers });

  const content = [];
  if (image) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } });
  content.push({ type: 'text', text: text ? `請查證以下內容：\n\n${text}` : '請查證這張截圖的內容。' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env[KEY_NAME],
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: SCAM_MODEL,
        max_tokens: 600,
        system: SCAM_SYSTEM,
        messages: [{ role: 'user', content }]
      })
    });
    if (!r.ok) throw new Error('anthropic ' + r.status);
    const data = await r.json();
    const raw = (data.content || []).map(c => c.text || '').join('');
    const m = raw.match(/\{[\s\S]*\}/);
    const out = JSON.parse(m ? m[0] : raw);

    const level = ['danger', 'suspicious', 'safe'].includes(out.level) ? out.level : 'suspicious';
    return new Response(JSON.stringify({
      level,
      summary: String(out.summary || ''),
      reasons: Array.isArray(out.reasons) ? out.reasons.slice(0, 3).map(String) : [],
      advice: String(out.advice || '不確定時請打 165 反詐騙專線確認。')
    }), { headers });
  } catch (e) {
    // 前端收到非 2xx 會自動改用本機規則比對
    return new Response(JSON.stringify({ error: 'ai failed' }), { status: 502, headers });
  }
}

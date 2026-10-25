# 防詐查證

給長輩用的防詐騙查證 PWA。貼上可疑訊息或上傳截圖，AI 判斷是否為詐騙，並用語音念出結果。

- 前端：`index.html`（單檔 PWA，ES5，iOS WebView 相容）
- 後端：arcar Worker 的 `/scam` 路由（v20 起，需 `ANTHROPIC_API_KEY`）；`scam-route.js` 是獨立參考版
- LINE：報平安官方帳號也能查詐騙，見 [`line/`](line/README.md)（arcar v21 起）
- 離線時改用內建 16 條台灣常見詐騙規則比對
- 歷史紀錄只存在手機本機；後端不留存訊息內容

網址：https://kftseng2oo1.github.io/scam/

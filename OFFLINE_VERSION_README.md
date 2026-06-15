# 台語 700 離線版音檔備份

## 這個資料夾是什麼

`/Users/wanghaomei/taigi700-audio/` 裡有 2125 個 mp3，是台語 700 單字卡 app 的**離線版本專用音檔**（詞語 + 例詞）。

音檔來源：國立臺中科技大學 閩南語700建議用字
https://digimagic2022.url.tw/ntcmin700/page01.htm

---

## 專案位置

- GitHub repo：https://github.com/howmay-w/taigi700
- 公開版網址：https://howmay-w.github.io/taigi700/
- 公開版音檔：https://static.kiantiong.com/sutiau/（由 kiantiong.com 授權提供）

---

## 目前版本差異（2026-06 更新）

| | 公開版（master） | 離線版（feature/offline） |
|---|---|---|
| 詞語音檔 | 本地 audio/ 資料夾 | 本地 audio/ 資料夾 |
| 例詞播放按鈕 | 有 | 有 |
| Service Worker | 無 | 有（預快取全部音檔） |
| 自錄音檔 no.647、no.100 | 無 | 有（audio/custom/5.mp3、6.mp3） |
| 離線可用 | 否 | 是 |

---

## 自訂音檔（2 個，僅離線版）

| 檔名 | 詞號 | 詞 | 說明 |
|---|---|---|---|
| audio/custom/5.mp3 | no.647 | 遮的 tsia ê（這裡的） | 與另一詞條共用原 ID，自錄修正 |
| audio/custom/6.mp3 | no.100 | 遐的 hia ê（那裡的） | 原資料庫查無，自錄補充 |

---

## 如何重建離線版（從 master 開始）

```bash
# 1. clone repo
git clone https://github.com/howmay-w/taigi700.git /tmp/taigi700
cd /tmp/taigi700

# 2. 從 master 開新 branch（或重用 feature/offline）
git checkout -b feature/offline

# 3. 把音檔複製進來（若 audio/ 資料夾已有則略過）
cp -r /Users/wanghaomei/taigi700-audio/*.mp3 audio/

# 4. 告訴 Claude Code：
#    「參考 OFFLINE_VERSION_README.md，幫我重建離線版」
```

### Claude Code 需要做的事

- `CUSTOM_AUDIO` 常數路由 no.100 → `audio/custom/6.mp3`、no.647 → `audio/custom/5.mp3`
- `wordAudioSrc(q)` 先查 CUSTOM_AUDIO 再 fallback 到 minnan700-*.mp3
- `MISSING_AUDIO` 清空（no.100 已有自錄音檔）
- `playAudio()` 加 Media Session metadata（鎖定畫面標題 + 圖示）
- 加入 `sw.js`（Service Worker：靜態資源在 install 快取，音檔背景批次快取）
- 產生 `audio-files.json`（2127 個檔名清單，SW 用於批次快取）
- `index.html` 底部：SW 註冊 + CACHE_AUDIO message + 進度 toast

---

## 安裝到 iPhone 的步驟

1. GitHub Pages → Settings → Pages → Branch 改成 `feature/offline`
2. 等約 1 分鐘部署完成
3. iPhone Safari 打開 https://howmay-w.github.io/taigi700/
4. 分享 → 加入主畫面
5. 打開 PWA，等 toast 顯示「已可離線使用 ✓」（約 1-2 分鐘，視網速）
6. GitHub Pages Branch 改回 `master`
7. 離線版 PWA 已固定在手機，不受 master 影響

---

## 更新離線版（UI 改動同步）

1. 把 master 改動 merge 進 `feature/offline`
2. 更新 `sw.js` 裡的 `CACHE` 版本號（`taigi700-v1` → `taigi700-v2` 等）
3. 重新走安裝步驟

---

## 注意事項

- `audio/` 資料夾（2125 個 mp3，約 40MB）已追蹤在 git 裡
- `audio-files.json` 是自動產生的清單，若音檔有增減需重新產生：
  ```bash
  ls audio/*.mp3 audio/custom/*.mp3 | python3 -c "
  import sys, json
  files = [l.strip().replace('/home/user/taigi700/', '') for l in sys.stdin]
  print(json.dumps(sorted(files)))
  " > audio-files.json
  ```

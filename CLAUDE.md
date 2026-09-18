# hobby/metronome — SetClick（セトリ・メトロノーム）

## 目的
Koki（ドラム）がリハ・ライブで使うメトロノーム。セトリを複数保存し、曲をタップするとその曲の BPM・拍子で即クリックが鳴る。

## 構成
- **単一 HTML の PWA**（ビルドなし）：`index.html` / `manifest.webmanifest` / `sw.js` / `icon-*.png`
- データは端末の localStorage（キー `setclick:v1`）。サーバー・クラウド同期なし
- ホスティング想定：GitHub Pages（midnight-chat-sales と同じパターン）

## 設計上の要点（変えるときは理由を理解してから）
- **発音は Web Audio の先読みスケジューラ**（Worker の 25ms tick → 120ms 先まで AudioContext 時刻で予約）。setTimeout で直接鳴らすとテンポが揺れる
- **再生中のテンポ変更**は「次に鳴る予定の拍」を起点に組み直して位相を保つ（`Engine.setBpm`）
- **拍子モデル**：曲は `ts`（'4/4' 等）と `sub`（'none'|'8th'|'triplet'|'16th'）を持つ。6/8・9/8・12/8 は付点4分を1拍、5/8・7/8 は8分を1拍として数える（`meterInfo` / `toEngine`）
- **音量**：全体（master）＋ 1拍目・表拍・裏拍の3系統ゲイン
- iOS 対策：`navigator.audioSession.type='playback'`（マナーモード対策）、古い iOS は無音 audio ループで代替。再生中は Wake Lock
- iPhone はホーム画面アプリとブラウザで保存領域が別 → 共有リンクは「新しいセトリ」画面に貼り付けても取り込める
- Service Worker はキャッシュ優先＋裏で更新。**アセット構成を変えたら `sw.js` の `CACHE` 番号を上げる**。localhost では `?sw` を付けたときだけ登録

## 開発・検証
- ローカル: `node tools/serve.js` → http://localhost:8741 （`hobby/.claude/launch.json` に `setclick` として登録済み）
- `?debug` を付けると `window.SetClick`（Engine / state / parseBulk）が生え、`Engine.log` に発音予定時刻、`Engine.peak()` で実出力のピーク値が取れる。耳で聞けない環境でもテンポ・音量バランスを数値検証できる
- アイコン再生成: `py -3 tools/make_icons.py`（素の `python` ではなく `py -3`。Pillow 入り）

## 未決・今後の候補
- クラウド同期（端末間共有）：必要になったら検討。今は共有リンク＋JSON バックアップで代替
- 曲ごとのカウント小節数・変拍子のアクセント位置（7/8 の 2+2+3 など）

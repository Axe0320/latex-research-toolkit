# Phase 5 — 機能連携の実装

[← INTEGRATION_PLAN.md](../../INTEGRATION_PLAN.md) | [← フェーズ一覧](README.md)

**ステータス**：未着手

## 目的

4モジュールが単に同居しているだけの状態から、[02-integrations.md](../02-integrations.md) で設計した実際のワークフロー連携を実装する。Phase 1〜4で各モジュールの受信側/送信側の土台は作成済みなので、ここで配線を完成させる。

## スコープ

| # | 機能 | 実装内容 |
|---|---|---|
| 1 | Chart → Figure Converter 送信 | `shared/clipboard` 経由での画像Blob受け渡し（[02-integrations.md](../02-integrations.md) §3.1） |
| 2 | Table ⇄ Chart パーサー共通化 | `shared/lib/dataParsing` の実装・両モジュールからの利用に切り替え |
| 3 | 共通クリップボードバス | `shared/clipboard` + `shared/persistence` の `clipboard`ストアの実装・全モジュールへの「送る」メニュー追加 |
| 4 | Export Paper Assets | IndexedDB 3ストア（`citationLibrary`/`tableSessions`/`figures`）を読み出しJSZipでまとめる機能の実装（[02-integrations.md](../02-integrations.md) §3.2） |
| 5 | Toast統一 | 全モジュールが `shared/ui` のToastを使うようリファクタ |
| 6 (任意) | Vision AI OCRの展開 | `shared/ocr` を Table（画像→表データ抽出）・Citation（参考文献リスト画像→引用抽出）に展開（[02-integrations.md](../02-integrations.md) §3.3。時間・優先度次第で次フェーズ以降に先送り可） |

## 完了条件

- [ ] Chartで生成した図から「Send to Figure Converter」を押すと、Figureタブが自動で開き変換キューに画像が入っている
- [ ] Export Paper Assetsボタンで、現在のCitation Library・Tableの表・Chartの図をまとめたZIPがダウンロードできる
- [ ] 4モジュール共通で同じToastコンポーネントが使われている
- [ ] （任意）Table・CitationにOCRインポートが追加されている

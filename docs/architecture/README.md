# モジュール別アーキテクチャ

[← INTEGRATION_PLAN.md](../../INTEGRATION_PLAN.md) | [← README.md](../../README.md)

統合前の4つの個別課題それぞれの内部構造・処理パイプライン・データモデル。統合後の実装は `src/modules/<module>/` 配下にそのまま移植されており、各ページに示すデータフローは現行コードと対応している。

`docs/00-overview.md`〜`04-risks.md`（統合計画そのものの検討過程）とは目的が異なるため、別フォルダに分けている。こちらは統合後の各モジュールの技術リファレンス。

| モジュール | 内容 | ドキュメント |
|---|---|---|
| 📚 参考文献 | Citation ⇄ BibTeX 変換エンジン・DOI解決・BibTeX Library | [citation.md](citation.md) |
| 📋 表 | フォーマット検出・TableModel・LaTeX生成 | [table.md](table.md) |
| 🖼️ 画像変換 | PDF/EPS変換エンジン・ベクター/ラスタ変換パス | [figure-convert.md](figure-convert.md) |
| 📊 グラフ | Zustand状態管理・matplotlibバックエンド・OCRパイプライン | [chart.md](chart.md) |

## 図の色の凡例（4ページ共通）

各ページの「システム全体」「OCRパイプライン」等の詳細図は、以下の配色を共通ルールとして使っている。

| 色 | 意味 |
|---|---|
| 🟣 紫 `#6C63FF` | 入力・ユーザー操作 |
| 🟢 緑 `#10B981` | 内部処理・変換ロジック |
| 🟠 オレンジ `#F59E0B` | 外部API・バックエンド呼び出し |
| 🔵 青 `#3B82F6` | 出力成果物・ダウンロード |
| 🟦 水色 `#60A5FA` | UI表示パネル（Preview / Edit など） |
| 🟪 濃紫 `#8B5CF6` | 永続化ストア（IndexedDB / Zustand） |
| 🔴 赤 `#EF4444` | フォーマッタ・整形ロジック |

「処理パイプライン詳細」（table.md）や「変換パス詳細」（figure-convert.md）のような、特定の技術的な流れだけを抜き出した補助図は、上記とは別の簡易配色（処理ステップ／データの2トーンなど）を用いる場合がある。

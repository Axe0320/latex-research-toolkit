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

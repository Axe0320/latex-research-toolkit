# Academic Suite（LaTeX Research Toolkit）統合計画

4つのリポジトリ（citation-bibtex-converter / latex-table-composer / latex-figure-composer / figure-modification）を、機能が実際に連携する1つのReact SPAへ統合するための計画。

**方針：完全な単一アプリへの統合**（ユーザー選定）。

## 目次

| ドキュメント | 内容 |
|---|---|
| [docs/00-overview.md](docs/00-overview.md) | 対象リポジトリ・現状分析・技術スタック差分・リポジトリ運用方針（新規リポジトリ作成／旧4デプロイ維持） |
| [docs/01-architecture.md](docs/01-architecture.md) | ベースリポジトリ・バージョン統一方針・ディレクトリ構造・永続化(IndexedDB)・UI設計・バックエンド方針 |
| [docs/02-integrations.md](docs/02-integrations.md) | 機能連携設計（クリップボードバス・Export Paper Assets等）・Vision AI OCRの展開・アカウントログイン連携の検討結果 |
| [docs/03-tech-alignment.md](docs/03-tech-alignment.md) | Lint・Tailwind移行・Node・共通UI・テスト・ルーティング・CI等の横展開項目 |
| [docs/04-risks.md](docs/04-risks.md) | リスクと残課題（解決済み事項含む） |
| [docs/decisions-log.md](docs/decisions-log.md) | 判断が変わった/確定した事項の時系列ログ |
| [docs/phases/](docs/phases/README.md) | Phase 1〜8 の詳細計画・完了条件チェックリスト |

## 現在のステータス

計画策定フェーズ完了。[docs/04-risks.md](docs/04-risks.md) の通り、残っているユーザー判断事項は無し。次のアクションは [docs/phases/phase-1-scaffold.md](docs/phases/phase-1-scaffold.md) からの実装着手。

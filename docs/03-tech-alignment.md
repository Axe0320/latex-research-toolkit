# 03. その他の技術/スタイル横展開項目

[← INTEGRATION_PLAN.md に戻る](../INTEGRATION_PLAN.md) | [← 00-overview.md](00-overview.md)

| 項目 | 現状 | 統一方針 |
|---|---|---|
| Lint | Cのみ `.oxlintrc.json` あり。Bは`lint`スクリプトのみ（設定ファイル未確認）。A/Dはlint未導入 | Cが既に導入済みのoxlintに統一。高速・ゼロコンフィグに近く3アプリへの導入コストが低い |
| Tailwind移行のブリッジ | A/Cはplain CSS + CSS変数、BはTailwind3、DはTailwind4 | Tailwind4の`@theme`はCSS変数ベース設定に対応。A/C既存のCSS変数(`--color-accent`等)をそのまま`@theme`に取り込み、Phase 6での全面書き換えを回避 |
| Node バージョン | 統一指定なし（B独自計画はNode 24 LTS推奨） | 統合後`package.json`に`engines: {"node": ">=24"}`を明記し全体へ適用 |
| 共通UIコンポーネント | Toast(B独自実装)、ファイルドロップゾーン相当がB/C/Dでそれぞれ別実装 | `shared/ui`への集約対象にFileDropzoneも追加（Toastは既存記載どおり） |
| テスト | Vitestテストが存在するのはA(112件+回帰8件)のみ | Phase 7でB/C/Dにも段階的にVitest+React Testing Libraryを追加しAの水準に揃える |
| ルーティング | 4アプリともルーター未使用 | タブ状態をURL（`/citation` `/table` `/figure` `/chart`）に反映し、ブックマーク・ブラウザバックに対応 |
| エラーバウンダリ | 4アプリとも未実装（単体の小規模アプリだったため不要だった） | モジュールごとに`ErrorBoundary`でラップし、1モジュールの不具合が他タブを巻き込まないようにする → **実装済み（2026-07-06、Phase 8着手前）**：`shared/ui/ModuleErrorBoundary`（`Sentry.ErrorBoundary`をラップ）を`App.tsx`で各モジュールに適用。Playwrightで実際に1モジュールをクラッシュさせ、他タブが引き続き動作することを確認済み |
| コード分割 | なし（4アプリはそれぞれ独立ビルドだったため不要だった） | `React.lazy`でタブごとに動的import。[04-risks.md](04-risks.md) リスク1（バンドルサイズ）の直接対策 |
| Sentry適用範囲 | Dのみ導入 | **アプリ全体に拡大**（決定）。`main.tsx`で一度initすれば全モジュールのErrorBoundaryもカバーでき追加コストはほぼゼロ。**Sentry側のプロジェクトはD単体のものを流用せず、統合アプリ用に新規プロジェクトを作成しDSNを分ける**（2026-07-06追加決定）。旧4デプロイは維持されるため、Dの旧Sentryプロジェクトはそのまま旧単体デプロイ用として使い続け、新DSNを取り違えないよう注意する |
| CI | 4リポジトリともGitHub Actions等のCI設定が一切ない | `npm run build` + `vitest`を回す最低限のワークフローを新設。バージョン昇格（[01-architecture.md](01-architecture.md) §2.2）の回帰検知に直結するため優先度高 |
| Vision AI OCR | Dのみ実装 | Table・Citationへの展開を検討（[02-integrations.md](02-integrations.md) §3.3、優先度は中） |

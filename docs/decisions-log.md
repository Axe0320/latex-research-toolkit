# 決定事項の変遷ログ

[← INTEGRATION_PLAN.md に戻る](../INTEGRATION_PLAN.md) | [← 00-overview.md](00-overview.md)

計画策定セッション中に判断が変わった/確定した事項を時系列で記録する。理由の再検討過程を残すことで、後から「なぜこうなったか」を追跡できるようにする。

### 2026-07-06 — 統合アーキテクチャ：完全な単一アプリに統合

4リポジトリ自身が持っていた2つの矛盾する統合計画（citation/table側=単一SPA選択的統合 vs figure-modification側=pnpm workspaceモノレポ）のうち、ユーザーは「完全な単一アプリ」を明示的に選択。モノレポ案は不採用。詳細：[00-overview.md](00-overview.md)。

### 2026-07-06 — バージョン統一方針：ダウングレード → 昇格へ方針転換

- **初期判断**：latex-figure-composerのみReact19/Vite8/TS6.0と先行していたため、3リポジトリに合わせてCをダウングレード（React18.3/Vite6/TS5.6）する方針とした。理由：影響範囲が小さい（C単体）。
- **ユーザーからの疑問**：「先行しているCに他を合わせるべきでは？」
- **再検証**：WebSearchでZustand・`@sentry/react`・`@tailwindcss/vite`のReact19対応状況を確認した結果、互換性ブロッカーは無いことが判明。さらに、Phase 2〜4でB/Dの全機能をどのみち手動で再検証する計画になっているため、その過程でバージョンも合わせて上げる限界費用は小さいと判断し直した。
- **最終決定**：Cに合わせて全体を昇格（React19.2/Vite8.1/TS6.0）。詳細：[01-architecture.md](01-architecture.md) §2.2。

### 2026-07-06 — 永続化方針：IndexedDBへの統一

ユーザーからの質問「IndexedDBを他リポジトリにも対応させるべきか」を受け、D専用だったIndexedDB基盤を全モジュール共通の永続化層として拡張する方針を決定。Citation LibraryのlocalStorage上限（500件/4MB）撤廃、Tableの永続化機能新設という副次的な改善も判明。詳細：[01-architecture.md](01-architecture.md) §2.4。

### 2026-07-06 — バックエンド方針：Chart専用維持 + Citation用プロキシ新設

Pythonバックエンドは既存どおりChartモジュール専用に留める。追加でCitationモジュールの脆い外部CORSプロキシ依存（corsproxy.io/allorigins.win）を自前プロキシ関数に置き換える改善を提案・採用。詳細：[01-architecture.md](01-architecture.md) §2.6。

### 2026-07-06 — LLM/Vision AI OCRの展開方針

D専用だったOCRパイプラインをTable・Citationにも展開可能な共通モジュール（`shared/ocr`）として設計。一方、Claude/ChatGPTのアカウントログイン経由でのサブスクリプション連携は、2026年のAnthropic/OpenAI両社の規約・仕様（WebSearchで確認）により不採用と決定。詳細：[02-integrations.md](02-integrations.md) §3.3-3.4。

### 2026-07-06 — リポジトリ運用：新規リポジトリ作成、旧4デプロイは維持

旧4つのVercelデプロイはそのまま残し、統合アプリは新規リポジトリ（提案名: `latex-research-toolkit`）を作成してプッシュする方針を確定。詳細：[00-overview.md](00-overview.md) §2。

### 2026-07-06 — ドキュメント構成：単一ファイルから分割

`INTEGRATION_PLAN.md` が肥大化したため、`docs/`配下にトピック別・フェーズ別ファイルへ分割。`INTEGRATION_PLAN.md`自体は各ドキュメントへのインデックスとして再構成。

### 2026-07-06 — 最終レビュー：セキュリティ・スコープ管理の追加事項

計画の最終見直しで新たに発見・追加した事項：
- `/api/resolve-citation`プロキシにSSRF対策（許可リスト方式）が必須であることを明記
- IndexedDBのスキーマバージョニング規約（`schemaVersion`+マイグレーション関数）をPhase 1で先に決める方針を追加
- 4リポジトリのシークレット漏洩チェックを実施し、実際の漏洩は無いことを確認（プレースホルダーのみ）
- スコープが大きいため、Phase 5の5つの連携機能を薄く広く実装するより1つの連携ストーリーを完全に仕上げることを優先する指針を追加
- 授業提出物としての位置づけ（今回の統合が新規課題か個人発展プロジェクトか）はユーザー自身が担当教員に確認すべき事項として明記（AIからは判断不可）

### 2026-07-06 — 本統合は最終提出物であることが確定、README.mdをPhase 8に追加

ユーザーが確認：本統合は最終提出物としての位置づけ。旧4リポジトリのREADMEが共通して持つ形式（課題背景・アーキテクチャ図・技術スタック・課題要件の明記等）を踏襲したREADME.mdの作成をPhase 8のスコープに追加。設計ドキュメント（`docs/`一式）へのリンクも含める方針とした。詳細：[phases/phase-8-deploy.md](phases/phase-8-deploy.md)。

### 2026-07-06 — リポジトリ名・配置場所・Phase 1範囲の確定、実装着手

- **リポジトリ名**：候補（`latex-research-toolkit` / `academic-suite` / `paper-forge` / `scholarly-toolkit`）を提示し、ユーザーは提案どおり `latex-research-toolkit` を選択。
- **配置場所**：`c:\dev\Integration-app` 直下（`repos/`・`docs/`と同階層）をそのまま新リポジトリのルートとする。別サブフォルダは切らない。
- **Phase 1のスコープ**：ローカルでの実装・動作確認だけでなく、GitHub上への新規リポジトリ作成・pushまで含めることを確定。
- これによりPhase 1着手の前提が揃ったため実装を開始する。

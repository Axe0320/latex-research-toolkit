# 04. リスクと残課題

[← INTEGRATION_PLAN.md に戻る](../INTEGRATION_PLAN.md) | [← 00-overview.md](00-overview.md)

1. **バンドルサイズ**：pdf-lib + jsPDF + JSZip + Tesseract.js + Sentry + matplotlib系Python依存が1プロジェクトに集約される。タブ（モジュール）ごとに `React.lazy` / dynamic import でコード分割必須（[03-tech-alignment.md](03-tech-alignment.md)で対応方針を明記済み）。
2. **Tailwind 3→4 移行**：B のユーティリティクラスに破壊的変更が入る可能性（config形式変更等）。[phases/phase-2-table.md](phases/phase-2-table.md) で個別確認。
3. **React18→19 / Vite→8 / TS→6.0 昇格**：Zustand・`@sentry/react`・`@tailwindcss/vite`の互換性はWebSearchで確認済みだが、`@vitejs/plugin-react`のバージョン更新とTS6.0での型エラー有無は各Phaseで実ビルド確認が必須（コンパイルエラーとして顕在化するため検知は容易）。
4. **localStorage/IndexedDB のキー衝突**：A の Library（localStorage）と D の Zustand永続化（IndexedDB）は別ストレージだが、キー命名規則は事前に整理する。

---

## 解決済みの項目

- ~~旧4つのVercelデプロイの扱い~~ → **解決**：そのまま維持。新統合アプリは新規リポジトリで作成（[00-overview.md](00-overview.md) §2）
- ~~Sentryの適用範囲~~ → **解決**：アプリ全体に拡大（[03-tech-alignment.md](03-tech-alignment.md)）
- ~~アカウントログインでのLLM連携可否~~ → **解決**：不採用、APIキー方式を維持（[02-integrations.md](02-integrations.md) §3.4）

## 現時点で残っているユーザー判断事項

なし（2026-07-06 時点）。実装フェーズで新たなリスクが見つかり次第この文書に追記する。

**リポジトリ名確定**：`latex-research-toolkit` に確定（2026-07-06）。配置場所は `c:\dev\Integration-app` 直下（このディレクトリ自体を新リポジトリのルートにする）。GitHub上への新規リポジトリ作成・pushもPhase 1のスコープに含める。

---

## 実装前の最終チェックリスト

計画レビューの最終ラウンドで洗い出した、実装着手前に確認しておきたい項目。

- [x] **`/api/resolve-citation`のSSRF対策** → **実装済み（2026-07-06、Phase 7完了後・Phase 8着手前）**：既知ドメインへの許可リスト方式（`doi.org`/`dl.acm.org`/`link.springer.com`/`ieeexplore.ieee.org`/`sciencedirect.com`、HTTPSのみ、リダイレクト先も再検証）でURLを制限し、`api/resolve-citation.py`を新設。`fetchCitation.ts`の外部公開CORSプロキシ（corsproxy.io/allorigins.win）依存をこれに置き換えた。詳細：decisions-log.md
- [x] **IndexedDBスキーマバージョニング規約** → **対応方針を確定（2026-07-06）**：Table（`tableSessions`）に加えCitation（`citationLibrary`）・Chart（`layout`）にも`schemaVersion`+`migrate()`を適用。Chart の `figures`（FigureType判別共用体で型変更コストが高い）・`previews`（opaqueなbase64文字列でスキーマ自体が無い）は対象外とし、既存の構造検出型マイグレーション（`migrateFigures()`）を踏襲することにした。詳細：decisions-log.md
- [x] **授業提出物としての位置づけの確認** → **確定：本統合が最終提出物**（2026-07-06）。README.mdの作成をPhase 8に追加済み（[phases/phase-8-deploy.md](phases/phase-8-deploy.md)）
- [x] **ブラウザ互換性** → **簡易確認済み（2026-07-06）**：Playwrightで Chromium/Firefox/WebKit の3エンジンで全4タブを開き、コンソールエラー無し・見た目に崩れが無いことを確認（実機Safariでの確認ではなくWebKitエンジンでの近似確認）
- [x] **UI文言中の自己参照URL** → **確認済み（2026-07-06）**：`src/`配下を検索し旧デプロイURL（`*.vercel.app`）への言及なしを確認
- [ ] **Vercel Hobbyプランの上限**：matplotlib依存の関数サイズ（D自身が250MB以内を検証済み）・実行時間上限を、`/api/resolve-citation`追加後の現在の関数構成で再確認する（Phase 8のデプロイ作業内で確認予定）
- [x] **新規連携機能（Phase 5）の優先順位** → **ユーザー判断により決着**：「1つを完全に仕上げる」ではなく6項目全部（OCR展開含む）を実施する方針をユーザーが選択（[phases/phase-5-integrations.md](phases/phase-5-integrations.md)）

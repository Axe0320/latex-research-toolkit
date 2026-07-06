# Phase 2 — Table モジュール移植（B: latex-table-composer）

[← INTEGRATION_PLAN.md](../../INTEGRATION_PLAN.md) | [← フェーズ一覧](README.md)

**ステータス**：未着手

## 目的

latex-table-composer を `modules/table/` として移植する。B 自身の `INTEGRATION_PLAN.md`（§16「移植対象」・§23「回帰防止ルール」）が既に詳細な移植手順を定義済みなので、それを踏襲する。

## スコープ（B自身の計画を踏襲）

**移植する**
- `src/lib/table/`（テーブルロジック一式：parser / normalize / formatters / generators / editor / merge）
- `src/components/` のうち：PreviewPanel, LatexPanel, FormattingBar, TableEditorToolbar, RowControls, ColumnControls, NoteEditor, MergePanel
- `components/shared/Toast.tsx` → `shared/ui` へ昇格（4モジュール共通化、[02-integrations.md](../02-integrations.md) 連携#5）

**移植しない**
- `App.tsx`（親構造が異なるため）
- vite config / tsconfig / tailwind config / package全体の上書き / node_modules

**バージョン処理**：Vite 6→8.1 / TS 5.5→6.0 昇格（[01-architecture.md](../01-architecture.md) §2.2）。Tailwind 3→4 移行もこのPhaseで実施（[04-risks.md](../04-risks.md) リスク2）。

**新規追加（今回の統合で決定した拡張）**
- Table の「複数表タブ」に IndexedDB永続化（`tableSessions`ストア）を追加（[01-architecture.md](../01-architecture.md) §2.4、Bには元々存在しなかった機能）
- `shared/lib/dataParsing` へのCSV/TSV検出ロジック共通化（Dのsklearn貼り付け・CSV入力と統合、[02-integrations.md](../02-integrations.md) 連携#2）

## 手順（B自身の計画 §22 を踏襲）

1. `feature/table-integration` ブランチを作成
2. `src/lib/table/` をコピー
3. 移植対象コンポーネントをコピー
4. `App.tsx` にタブレイアウトを追加（Tableタブ）
5. Tailwind 3→4 のクラス差分を確認・修正
6. IndexedDB永続化を追加
7. 動作確認（下記チェックリスト）
8. `npm run build`
9. ローカル動作確認
10. commit → push → merge判断

## 完了条件（B自身のDone Definition §23を流用）

- [ ] parse（CSV/TSV/Excel/Classification Report/Log/Markdown）が正常動作
- [ ] preview（インライン編集・セル内改行・注釈UI）が正常動作
- [ ] LaTeX export（現在の表/全表、booktabs等の罫線設定）が正常動作
- [ ] 行・列編集（追加・削除・途中挿入）が正常動作
- [ ] 注釈（`\tnote`/`\footnotemark`、自動採番、detach）が正常動作
- [ ] merge（複数ソース統合、per-source direction）が正常動作
- [ ] 複数表タブがIndexedDBに永続化され、リロード後も保持される（新規機能）
- [ ] Citation機能に regression なし
- [ ] UI崩れなし・モバイルで崩れなし
- [ ] `npm run build` 成功

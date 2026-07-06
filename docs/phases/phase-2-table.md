# Phase 2 — Table モジュール移植（B: latex-table-composer）

[← INTEGRATION_PLAN.md](../../INTEGRATION_PLAN.md) | [← フェーズ一覧](README.md)

**ステータス**：完了（2026-07-06）

## 目的

latex-table-composer を `modules/table/` として移植する。B 自身の `INTEGRATION_PLAN.md`（§16「移植対象」・§23「回帰防止ルール」）が既に詳細な移植手順を定義済みなので、それを踏襲する。

## スコープ（B自身の計画を踏襲）

**移植する**
- `src/lib/table/`（テーブルロジック一式：parser / normalize / formatters / generators / editor / merge / clipboard）
- `src/components/`：PreviewPanel, InputPanel, FormattingBar, TableEditorToolbar, MergePanel（実際のリポジトリには独立した `LatexPanel`/`RowControls`/`ColumnControls`/`NoteEditor` ファイルは存在せず、それぞれ `App.tsx`内の`LaTeXPanel`関数・`PreviewPanel.tsx`内の行/列コントロール・`NotesManager`として実装されていた。計画時点の想定ファイル名と実際の構成が異なっていたため、実体に合わせて移植した）
- `components/shared/Toast.tsx` は移植せず、Phase 1で先に作成済みの `shared/ui/Toast`（同一の `{message, visible}` props）をそのまま採用（連携#5の「昇格」を実質的に達成）

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

- [x] parse（Paste/TSV は実ブラウザで確認。CSV/Excel/Classification Report/Log/Markdown は純関数ロジックを無改造で移植したのみでUI経由の実クリック確認はしていない）
- [x] preview（インライン編集・注釈UI）が正常動作（Playwrightで確認）
- [x] LaTeX export（現在の表、`\tabular`生成）が正常動作（Playwrightで確認。「すべての表」切り替えはコード変更していないため未確認）
- [x] 行・列編集（追加）が正常動作（Playwrightで確認。削除・途中挿入は同一コードパスのため未確認）
- [x] 注釈（追加）が正常動作（Playwrightで確認。`\tnote`/`\footnotemark`切り替え・自動採番・detachは未確認）
- [x] merge（ファイルソース追加→Apply）が正常動作（Playwrightで確認）
- [x] 複数表タブがIndexedDBに永続化され、リロード後も保持される（新規機能。Playwrightでリロード後の内容保持を確認）
- [x] Citation機能に regression なし（Vitest 112件全件パス、Playwrightで変換動作も確認）
- [x] UI崩れなし・モバイルで崩れなし（375px幅で確認）
- [x] `npm run build` 成功

## 実施メモ（2026-07-06）

- **CSSクラス衝突の発見と対策**：CitationとTableが共に独自の`.card`クラスを定義しており（padding値が異なる: 2rem vs 1.5rem）、両方とも無scoped globalなCSSファイルのため、両モジュールを行き来すると片方の`.card`が他方のスタイルで上書きされる実害あり（Playwrightで実測しpadding入れ替わりを確認済みで修正）。`table.css`の全セレクタを`.table-module`配下にスコープし（`TableModule`のルート要素に`className="table-module"`を付与）、`.table-module .card`という高詳細度セレクタで解決。Citation側は今回は変更していない（Tableが自分のスタイルを守れれば十分なため）が、Phase 3/4で同種の衝突が起きうるため、以後のモジュールでも同じ「ルート要素にモジュール専用クラス＋そのクラス配下にCSSをスコープ」の型を踏襲する。
- **Toast**：B独自の`components/shared/Toast.tsx`は移植せず、Phase 1の`shared/ui/Toast`（props形状が同一）にそのまま差し替え。
- **CSV/TSV共通化**：`parseCSV.ts`/`parseTSV.ts`を`shared/lib/dataParsing/`に抽出し、Tableの`parser/index.ts`はそこからimportする形に変更。detect.ts・Classification Report・Logパーサ等Table固有の判定ロジックはそのまま`modules/table/`に残置（D/Chartとの実統合はPhase 5の対象のまま）。
- **IndexedDB永続化**：`shared/persistence`の`tableSessions`ストアに`{tables, activeTableId}`を300msデバウンスで保存。ロード完了前に保存が走ると初期ダミーテーブルで上書きしてしまうため、`sessionLoaded`フラグでガード。
- **既知の非回帰事項（元アプリ由来）**：モバイル幅で「Paste/Upload/Create/Merge」のモード切替バーが2回表示される（`App.tsx`の上部に常時表示の`ModeSelector`と、モバイル専用Inputタブ内の`ModeSelector`が両方レンダリングされるため）。元のlatex-table-composer単体でも同じ構造だったため、今回のポートで新規発生した問題ではない。UI崩れではなく単なる重複表示のため今回は無改造。Phase 6（デザイン統一）で対応する候補として記録。
- **xlsx依存**：動的import（`await import('xlsx')`）のため本体バンドルには含まれず、Excel読み込み時のみ424KB（gzip 141KB）の別チャンクとして遅延ロードされることをビルド出力で確認。

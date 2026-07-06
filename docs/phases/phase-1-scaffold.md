# Phase 1 — 土台構築（Scaffold）

[← INTEGRATION_PLAN.md](../../INTEGRATION_PLAN.md) | [← フェーズ一覧](README.md)

**ステータス**：完了（2026-07-06）。リポジトリ：https://github.com/Axe0320/latex-research-toolkit

## 目的

citation-bibtex-converter (A) をベースに、統合後アプリの雛形を作る。バージョン昇格（[01-architecture.md](../01-architecture.md) §2.2）をこの段階で一度に適用し、以降のPhaseは新しいスタックの上でモジュールを移植していく。

## スコープ

- 新規リポジトリの作成（[00-overview.md](../00-overview.md) §2、提案名 `latex-research-toolkit`）
- A のソース一式をコピーし、React 19.2 / Vite 8.1 / TypeScript 6.0 / Tailwind 4 に昇格
- `@vitejs/plugin-react` を `^6.x` 系に更新
- `shared/ui`（Header, TabBar, Card, Button, Toast）と `shared/theme.ts`（`#6C63FF`等のデザイントークン）を新規作成
- `shared/persistence`（共有IndexedDB接続の一元管理＋`schemaVersion`によるマイグレーション規約、[01-architecture.md](../01-architecture.md) §2.4）の骨格作成
- Citation の既存機能を `modules/citation/` 配下に再配置（App.tsx分割）
- タブシェル（現時点ではCitationタブのみ有効、他タブはプレースホルダー）

## 手順

1. 新規リポジトリを作成し、A の内容をコピー（`node_modules`・`package-lock.json`は除く）
2. `package.json` の依存を React19.2/Vite8.1/TS6.0系に更新し `npm install`
3. `tsc -b && vite build` が通ることを確認（型エラーはこの時点で必ず顕在化する）
4. A の既存 Vitest スイート（`__tests__/pr1234.test.ts` 112件 + `regression.test.ts` 8件）を新バージョンで実行し、全件パスを確認
5. `App.tsx` を `modules/citation/CitationModule.tsx` に切り出し、`src/App.tsx` を4タブのシェルとして再構成
6. `shared/ui`・`shared/theme.ts`・`shared/persistence` の骨格を作成
7. `.gitignore` に `repos/`（調査用clone、リポジトリに含めない）を追加、またはリポジトリ外へ退避

## 完了条件

- [x] `npm run build` 成功
- [x] 既存Vitestスイート（112件、うち回帰8件を含む）全件パス（元リポジトリでの実行結果と一致することを確認済み）
- [x] Citation機能（TXT⇄BibTeX変換・DOI/URL fetch・Library・バッチ処理）に regression なし（Playwrightで実ブラウザ動作確認：TXT→BibTeX変換、タブ切り替え後の状態保持を確認）
- [x] タブシェルが表示され、Citationタブが正常動作する

## 実施メモ（2026-07-06）

- バージョン昇格の実クエリ：React 19.2.7 / Vite 8.1.3 / TypeScript 6.0.2 / `@vitejs/plugin-react` 6.0.2 / Tailwind 4.3.1（`@tailwindcss/vite`）。互換性ブロッカーなし。
- TS6.0の `noUncheckedSideEffectImports` により `src/vite-env.d.ts`（`/// <reference types="vite/client" />`）が新たに必要になった（旧TS5.5では不要だった）。C (latex-figure-composer) から移植。
- `vite.config.ts` は `defineConfig` を `vite` ではなく `vitest/config` からimportする必要がある（`test` オプションの型を持たせるため）。
- Vitestのデフォルトdiscoveryが `repos/`（調査用clone）内のテストも拾ってしまうため、`vite.config.ts` に `test.exclude: ['repos/**', 'node_modules/**']` を追加。
- Citation本体のロジック・スタイル（`index.css`→`modules/citation/citation.css`）は無改造で移設。IndexedDBへの実移行（localStorage→`citationLibrary`ストア）はまだ未実施——`shared/persistence`は骨格のみで、Citationの実データ移行は今後のフェーズで対応する。
- シェルの `Header`（LaTeX Research Toolkit）とCitationモジュール自身の内部見出し（Citation ⇄ BibTeX）が二重表示になっている。意図的に許容（Phase 6のデザイン統一パスで解消予定）。
- 新規リポジトリ `Axe0320/latex-research-toolkit`（public）を作成しpush済み。旧4リポジトリのVercelデプロイ・GitHubリポジトリは無変更。

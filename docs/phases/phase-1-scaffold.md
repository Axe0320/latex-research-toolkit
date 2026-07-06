# Phase 1 — 土台構築（Scaffold）

[← INTEGRATION_PLAN.md](../../INTEGRATION_PLAN.md) | [← フェーズ一覧](README.md)

**ステータス**：未着手

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

- [ ] `npm run build` 成功
- [ ] 既存Vitestスイート（112件+回帰8件）全件パス
- [ ] Citation機能（TXT⇄BibTeX変換・DOI/URL fetch・Library・バッチ処理）に regression なし
- [ ] タブシェルが表示され、Citationタブが正常動作する

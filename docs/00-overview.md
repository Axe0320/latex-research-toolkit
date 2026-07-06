# 00. 概要・現状分析・リポジトリ運用

[← INTEGRATION_PLAN.md に戻る](../INTEGRATION_PLAN.md)

## 対象リポジトリ

| # | リポジトリ | 役割 |
|---|---|---|
| A | [citation-bibtex-converter](https://github.com/Axe0320/citation-bibtex-converter) | Citation ⇄ BibTeX 相互変換・BibTeX Library |
| B | [latex-table-composer](https://github.com/Axe0320/latex-table-composer) | 表データ → LaTeX table 変換・編集 |
| C | [latex-figure-composer](https://github.com/Axe0320/latex-figure-composer) | 画像 (PNG/JPG/SVG) → LaTeX 向け PDF/EPS 変換 |
| D | [figure-modification](https://github.com/Axe0320/figure-modification) | データ → matplotlib グラフ生成・編集・合成（Python バックエンド） |

**方針：完全な単一アプリへの統合**（ユーザー選定）。4機能をタブ切り替えの1つの React SPA にまとめ、機能間でデータを受け渡せる「連携」を実装する。

---

## 1. 現状分析

### 1.1 既存の統合ドキュメントとその矛盾

- A/B 側 `INTEGRATION_PLAN.md`：**選択的コードコピーで単一 SPA に統合**する方針（citation-bibtex-converter をホストにし、`src/lib/table/` と一部コンポーネントのみ移植）。
- D 側 `DESIGN.md` / `docs/integration.md`：**pnpm workspace モノレポ（apps/\*）**で4リポジトリを並存させる方針。

→ 今回は「完全な単一アプリ」を選んだため、**A/B 側の方針（選択的統合・単一 SPA）を全体に拡張**し、D のモノレポ案は不採用とする。

### 1.2 技術スタックの差分（要吸収）

| 項目 | A: citation | B: table | C: figure-composer | D: figure-modification |
|---|---|---|---|---|
| React | 18.3.1 | 18.3.1 | **19.2.7** | 18.3.1 |
| Vite | 5.4 | 5.4 | **8.1** | 6.0 |
| TypeScript | 5.5 | 5.5 | **6.0** | 5.6 |
| スタイル | Plain CSS (CSS変数) | Tailwind 3 | Plain CSS (CSS変数) | **Tailwind 4** |
| 状態管理 | useState (App.tsx集約) | useState | useState + hook | **Zustand** |
| 永続化 | localStorage (Library) | なし | なし | **IndexedDB** |
| バックエンド | なし | なし | なし | **Python (Vercel Functions)** |
| 主要依存 | — | xlsx | pdf-lib, jspdf, jszip, svg2pdf.js | zustand, idb, tesseract.js, @sentry/react |
| テスト | Vitest (`__tests__/`, 112件) | なし | なし | なし |

**リスクの核心**：C (latex-figure-composer) だけ React/Vite/TS が大きく先行している。D (figure-modification) だけ Python バックエンドと重量級フロント（Zustand/IndexedDB/Sentry/Tesseract.js/Tailwind4）を持つ。

C のソースを grep した限り React 19 専用 API（`use()`, `useOptimistic`, `useActionState`, `forwardRef` 依存パターン等）は不使用。また4リポジトリとも `main.tsx` は既に `createRoot`+`StrictMode`（React18〜19共通の標準形）で統一されており、旧 `ReactDOM.render` は残っていない。`tsconfig.app.json` の `strict` 設定も4リポジトリで完全一致していることを確認済み。

**Cへ揃える（アップグレード）ルートは技術的にブロックされていない**ことをWebSearchで確認済み（Zustand・`@sentry/react`(D採用の^10.61.0はv8.6.0以降の要件を満たす)・`@tailwindcss/vite`はいずれもReact19対応済み）。当初は「A/Dの再検証コストが上がる」ことを理由にCをダウングレードする方針としていたが、Phase 2〜4ではB/Dの全機能をどのみち手動で再検証する必要があり（モジュール移植そのものの検証プロセス）、その過程でバージョンも合わせて上げる限界費用は小さいと判断し直した。**最終的にCへ揃える昇格ルートを採用**する（詳細は [01-architecture.md](01-architecture.md) §2）。

---

## 2. リポジトリ運用方針（確定）

- **旧4つのVercelデプロイはそのまま維持する**。統合後も個別URLで生き続ける（授業提出物としての参照実績を残すため）。
- **統合後のアプリは新規リポジトリとして作成し、そこへプッシュする**（既存4リポジトリのいずれかを流用・リネームしない）。ベースにするコード（citation-bibtex-converter）はコピー元として使うだけで、そのリポジトリ自体を書き換えることはしない。
- **リポジトリ名（確定）**：`latex-research-toolkit`（2026-07-06 ユーザー確定）。根拠は [01-architecture.md](01-architecture.md) §2.5 で採用したブランド名（`latex-figure-composer`のREADMEに既出の呼称）とスタイルを合わせ、既存4リポジトリのkebab-case命名規則にも沿う。配置場所は `c:\dev\Integration-app` 直下（このディレクトリ自体を新リポジトリのルートにする）。
- **作業ディレクトリの取り扱い注意**：現在 `c:\dev\Integration-app\repos\` には調査用に4リポジトリをそのままclone済み（各々が独立した`.git`を持つ）。新リポジトリを`git init`する際、この`repos/`フォルダをそのまま含めると入れ子`.git`やnode_modulesがコミットされてしまうため、
  - 実装フェーズ開始時に `repos/` を `.gitignore` に追加するか、
  - リポジトリ本体の外（例：スクラッチパスや別ディレクトリ）に退避する
  のいずれかを先に行う。
- **シークレット漏洩チェック（確認済み）**：4リポジトリ内を`sk-ant-`/`sk-proj-`/`AIza`等のAPIキーパターンでgrepした結果、実際の漏洩キーは無し（`figure-modification/test/.env.example`はプレースホルダーのみ、`.gitignore`で実ファイルの`test/.env`は除外済み）。ただし新リポジトリへコピーする際は、各自のローカル環境にある`.env`/`.env.local`（未commit）を誤って含めないよう`.gitignore`を先に整備してからコピーする。

---

**関連ドキュメント**

- [01-architecture.md](01-architecture.md) — アーキテクチャ・バージョン方針・UI設計・永続化・バックエンド方針
- [02-integrations.md](02-integrations.md) — 機能連携設計・LLM/OCR拡張・アカウント連携の検討結果
- [03-tech-alignment.md](03-tech-alignment.md) — その他の技術横展開項目
- [04-risks.md](04-risks.md) — リスクと残課題
- [decisions-log.md](decisions-log.md) — 決定事項の変遷ログ
- [phases/](phases/) — フェーズ別詳細計画

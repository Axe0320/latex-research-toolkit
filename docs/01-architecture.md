# 01. アーキテクチャ

[← INTEGRATION_PLAN.md に戻る](../INTEGRATION_PLAN.md) | [← 00-overview.md](00-overview.md)

## 2.1 ベースリポジトリ

**A: citation-bibtex-converter を土台にする**（A/B 側計画が既にこれを前提としており、最も枯れていてテストもある）。

## 2.2 バージョン統一方針

| 項目 | 統一先 | 理由 |
|---|---|---|
| React | **19.2.7**（Cに合わせて昇格） | 互換性ブロッカーなし（Zustand/`@sentry/react`^10系/`@tailwindcss/vite`いずれも対応済みをWebSearchで確認）。A/B/DはPhase 2〜4のポーティング時にどのみち全機能を手動再検証するため、同時にバージョンを上げても限界費用が低い |
| Vite | **8.1系**（Cに合わせて昇格） | 同上。`@vitejs/plugin-react`をA/B/Dで`^6.x`系に合わせて更新する作業が追加で必要 |
| TypeScript | **6.0系**（Cに合わせて昇格） | 同上。major bumpのリスクは`tsc -b`のコンパイルエラーとして即座に顕在化する安全なリスク種別のため許容 |
| スタイル | **Tailwind 4 + 共通デザイントークン** | 最新かつ D で採用済み。A/Cのplain CSSはTailwindユーティリティへ、BのTailwind3クラスはTailwind4へ移行 |
| アクセントカラー | `#6C63FF`（既に4リポジトリ全てのREADMEで共有意図あり） | 全リポジトリのMermaid図で既に採用済みの色 |

**方針転換の経緯**（詳細は [decisions-log.md](decisions-log.md)）：当初はCをダウングレードする方針だったが、「A/Dの再検証コストが上がる」という当初の反対理由はPhase 2〜4で発生する必須の手動再検証と重複しており、昇格の限界費用は小さいと判断し直した。互換性ブロッカーが無いことも確認済みのため、最終的に**Cへ揃える昇格ルート**を採用する。

## 2.3 ディレクトリ構造

```
src/
├── App.tsx                      # タブシェル: Citation | Table | Figure | Chart
├── modules/
│   ├── citation/                 # A: parseCitation, fetchCitation, lib/citation, lib/bibtex, lib/library
│   │   ├── lib/
│   │   ├── components/           # FieldSelector, LibraryPanel
│   │   └── CitationModule.tsx
│   ├── table/                    # B: lib/table, table用コンポーネント
│   │   ├── lib/
│   │   ├── components/           # PreviewPanel, LatexPanel, FormattingBar, TableEditorToolbar,
│   │   │                         # RowControls, ColumnControls, NoteEditor, MergePanel
│   │   └── TableModule.tsx
│   ├── figure-convert/           # C: converters/, hooks/useConversion
│   │   ├── converters/
│   │   ├── hooks/
│   │   ├── components/
│   │   └── FigureConvertModule.tsx
│   └── chart/                    # D: 16図種の入力・編集・合成・OCR
│       ├── components/{input,editor,compose,import,preview}/
│       ├── store/figureStore.ts  # Zustandはchartモジュールにスコープ
│       ├── ocr/                  # → shared/ocr へ昇格予定（02-integrations.md §3.3）
│       └── ChartModule.tsx
├── shared/
│   ├── ui/                       # Header, TabBar, Card, Button, Toast（4つの重複実装を統一）
│   ├── theme.ts                  # #6C63FF等のデザイントークン
│   ├── lib/dataParsing/          # NEW: B と D で重複しているCSV/TSV検出ロジックを共通化
│   ├── clipboard/                # NEW: モジュール間データ受け渡しバス（02-integrations.md 参照）
│   ├── persistence/              # NEW: 共有IndexedDB接続・バージョン管理の一元化（§2.4）
│   └── ocr/                      # NEW: Vision AI OCRパイプラインの共通化（02-integrations.md §3.3）
└── main.tsx

api/                              # D の Python Vercel Functions をそのまま移設
├── render.py
├── compose.py
├── ocr.py
├── stat_test.py
├── resolve-citation.py           # NEW: Citation用DOI/URL解決プロキシ（§2.6）
└── _lib/                         # 16図種レンダラー
```

**状態管理方針**：グローバル単一ストアにはしない（B側計画の「single mega state禁止」を踏襲）。Citation/Table/FigureConvertはモジュールローカルなuseState、ChartのみZustandをそのモジュール内にスコープして保持。

## 2.4 永続化方針：IndexedDBへの統一

D の `src/storage/db.ts`（`idb`ライブラリ、`openDB(DB_NAME, DB_VERSION, {upgrade...})`パターン）を全モジュール共通の永続化基盤として拡張する。

- **Citation (A)**：現行の `localStorage`ベースLibrary（500件/4MB上限）を IndexedDB オブジェクトストア `citationLibrary` に移行。人為的な容量上限を撤廃できる
- **Table (B)**：現状「複数表タブ」に永続化機能が無い（リロードで消失）→ オブジェクトストア `tableSessions` を新設し、新規の永続化機能として追加
- **Figure Convert (C)**：単体では永続化不要（ワンショット変換）。ただしモジュール間クリップボード（[02-integrations.md](02-integrations.md) §3.1）経由でBlobを受け取る側として関与
- **Chart (D)**：既存の `figures` / `layout` / `previews` ストアをそのまま踏襲

**実装方針**：4モジュールが個別にDB接続を持つと `indexedDB.open()` のバージョン競合を招くため、`shared/persistence` に単一DB（`academic-suite`）への接続とバージョン管理を集約し、モジュールごとにオブジェクトストアを分離する。

**スキーマバージョニング規約**：D の `figureStore.ts` には既に `migrateFigures()`（旧保存形式→新形式への変換）という前例がある。共有DB化にあたり、この移行パターンを最初から `shared/persistence` の統一規約として採用する（各ストアのレコードに `schemaVersion` を持たせ、読み込み時にマイグレーション関数を通す）。ユーザーデータが蓄積してから場当たり的に対応するのは難易度が上がるため、Phase 1の時点でこの規約を決めておく。

**例外**：Chart モジュールのOCR機能で使うユーザー入力のVision API キー（Claude/GPT-4o/Gemini）は「アプリデータ」ではなく「ユーザーのシークレット」であるため、IndexedDB統一の対象外とし現状どおり `localStorage` に保持する（無理に統一しない）。

## 2.5 UI設計

- **ブランド名**：latex-figure-composer の README に既出の **「LaTeX Research Toolkit」** を正式名称として採用する（4リポジトリ中で唯一既に存在するツール群共通の呼称）。[00-overview.md](00-overview.md) §2でリポジトリ名の提案にも使用。
- **シェル構成**：`Header`（タイトル＋サブタイトル）+ `TabBar`（Citation / Table / Figure / Chart）。B側旧計画の visual language（`background: #F8FAFC`、card-based layout、compact toolbar、`#6C63FF`アクセント）を4タブ全体に拡張する。
- **各タブ内部レイアウト**：ゼロから作り直さず、各モジュールの既存レイアウトを維持（Table: Input|Preview + LaTeX全幅、Chart: 入力|編集|プレビューの3カラム 等）。
- **タブ切り替え時にモジュールをアンマウントしない**：条件付きレンダリングではなく `display:none` 相当の切り替えで、一度マウントしたモジュールの状態を保持する。理由：Tableで編集中にChartタブへ移動して戻ってきたら編集内容が消える、という体験は「連携」を謳うアプリとして致命的。初回ロードのみ `React.lazy` で遅延させる。
- **URLルーティング**：現状4アプリともルーター未使用。タブ状態をURL（`/citation` `/table` `/figure` `/chart`）に反映し、ブックマーク・ブラウザの戻るボタンに対応させる（新規導入 or 軽量に`history.pushState`で自作）。
- **ダークモード**：Dのロードマップに未着手事項としてあるのみ。今回は非目標としてバックログに送る。

## 2.6 バックエンド方針

**Python バックエンドは Chart モジュール専用のまま維持する。追加で1点、軽量プロキシ関数の新設を推奨する。**

- **現状維持でよい理由**：Vercel Functions はルート単位でデプロイされるため、`/api/*.py` のコールドスタートやmatplotlib依存のバンドルサイズ（D自身が250MB以内を検証済み）はChart機能を使ったときにしか発生せず、Citation/Table/Figureの3モジュールの体験には影響しない。D の `vercel.json`（`buildCommand`＋`PYTHON_VERSION`指定のみの最小構成、Vercelの`api/*.py`自動検出に依存）はほぼそのまま流用できる。
- **新規追加を推奨**：Citation モジュール（`fetchCitation.ts`）は DOI/URL 解決のために `corsproxy.io` → `allorigins.win` という外部の公開CORSプロキシへ2段階フォールバックする実装になっている（README自身がIEEE/ScienceDirectでの失敗を制限事項として明記）。統合でPythonバックエンド基盤が既に手に入るため、同一プロジェクト内に軽量プロキシ関数 `/api/resolve-citation` を追加し、外部公開プロキシへの依存を自前のサーバーサイドfetchに置き換える。必須ではないが、統合のついでに実施する価値が高い改善。
- **⚠️ SSRF対策が必須**：このプロキシ関数はサーバーサイドでユーザー入力のURLを任意にfetchするため、バリデーションなしに実装すると内部ネットワークや意図しない宛先への footholdになり得る（SSRF）。DOI形式（`10.\d{4,}/...`）または既存READMEの「対応ソース」表に列挙された既知ドメイン（`doi.org`, `dl.acm.org`, `link.springer.com`等）のみを許可する許可リスト（allowlist）で入力を制限すること。

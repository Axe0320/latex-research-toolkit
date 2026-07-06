# Phase 3 — Figure Converter モジュール移植（C: latex-figure-composer）

[← INTEGRATION_PLAN.md](../../INTEGRATION_PLAN.md) | [← フェーズ一覧](README.md)

**ステータス**：完了（2026-07-06）

## 目的

latex-figure-composer を `modules/figure-convert/` として移植する。C は既にPhase 1で採用したスタック（React19.2/Vite8.1/TS6.0）と同一のため、バージョン調整は不要。4モジュール中もっとも小規模で単純な移植。

## スコープ

**移植する**
- `src/converters/`（imageToPdf, svgToPdfVector, imageToEps, svgToEps。`svgToPdf.ts`はどこからもimportされていない未使用コードだったため移植対象から除外）
- `src/hooks/useConversion.ts`
- `src/types/conversion.ts`, `src/utils/fileHelpers.ts`
- `src/components/`（Header, FileUploader, FileList, FormatSelector, ConvertButton, BatchResult, ErrorArea）

**移植しない**
- `App.tsx`（親構造が異なる。ロジックは`FigureConvertModule.tsx`へ移設）、vite/tsconfig設定、node_modules
- FileUploaderの`shared/ui`統合（FileDropzone化）は見送り。他モジュール（Table/Chartの各種アップロード欄）と実際に共通化できる形を検証してからにする方が手戻りが少ないと判断し、今回は`modules/figure-convert/`内に留めた

**新規追加（今回の統合で決定した拡張）**
- クリップボードバスの受信側実装は**今回は実施せず、Phase 5に先送り**した。理由：送信側であるChartモジュール自体がまだ存在しない（Phase 4未着手）ため、受信ロジックを書いても実機で検証する手段がなく、[phase-5-integrations.md](phase-5-integrations.md)が`shared/clipboard`自体の実装をスコープとして持っているため、そちらで送受信を一体で実装した方が設計の手戻りが少ない（Table移植時の`shared/lib/dataParsing`と同様、依存する相手モジュールが存在しない機能は前倒しで作らない方針を踏襲）。

## 手順

1. `feature/figure-convert-integration` ブランチを作成
2. `converters/` `hooks/` `types/` `utils/` をコピー
3. UIコンポーネントを移植
4. `FigureConvertModule.tsx`を作成しFigureタブ（Phase 1のプレースホルダー）を置き換え
5. CSSを`.figure-convert-module`スコープに変換（[phase-2-table.md](phase-2-table.md)実施メモのパターンを踏襲）
6. 動作確認（下記チェックリスト）
7. `npm run build`
8. ローカル動作確認
9. commit → push → merge判断

## 完了条件

- [x] PNG/JPG/JPEG → PDF 変換が正常動作（Playwrightで確認）
- [x] SVG → PDF（ネイティブベクター、jsPDF+svg2pdf.js）が正常動作（Playwrightで確認）
- [x] PNG/JPG/JPEG/SVG → EPS 変換が正常動作（Playwrightで確認。PNG/SVGのみ実施、JPG/JPEGは同一コードパスのため未確認）
- [x] 複数ファイル一括変換・ZIP一括ダウンロードが正常動作（Playwrightで確認：2ファイル一括変換・ZIPボタン出現を確認）
- [ ] Chartモジュールからの「Send to Figure Converter」で画像が変換キューに自動投入される → **Phase 5へ先送り**（理由は上記スコープ参照）
- [x] Citation/Table機能に regression なし（Vitest 112件全件パス、Playwrightでタブ間往復してもCSSが崩れないことを確認）
- [x] `npm run build` 成功

## 実施メモ（2026-07-06）

- **CSSスコープ**：CitationとFigure Converterは同一著者による同じデザイン言語（`.page`/`.wrapper`/`.header`/`.card`/`.section-header`/`.divider`/`.convert-btn`/`.spin`等）を採用しており、Table以上にクラス名の重複が多かった。値が偶然一致しているクラスもあったが（`.card`など）、`.spin`のように`display: inline-block`の有無が異なるものもあり、部分的に「安全なものは素通し」という判断は事故りやすいと判断。**全セレクタを`.figure-convert-module`配下にスコープする方針で統一**（Tableと同じパターン）。`@keyframes spin`も`figure-convert-spin`にリネームしてキーフレーム名の衝突を回避。
- **`.page`のスコープ特有の注意**：CitationやFigureのルート要素自体が`className="page"`のため、`.figure-convert-module`をそのdiv自身に付与する場合は子孫セレクタ（`.figure-convert-module .page`）ではなく複合セレクタ（`.figure-convert-module.page`）で書く必要がある（同一要素上の2クラスのため）。
- **xlsx脆弱性の修正**（Phase 2で混入、Phase 3で発覚・対応）：`npm install`実行時に`npm audit`で`xlsx`パッケージにhigh重度の脆弱性2件（Prototype Pollution [GHSA-4r6h-8v6p-xvw6] / ReDoS [GHSA-5pgg-2g8v-p4x9]）を検出。npmレジストリ版（0.18.5）はSheetJS側がメンテナンスを終了しており修正版が存在しないため、SheetJS公式CDN（`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`、両脆弱性修正済み）からのインストールに切り替えた。APIは同一でコード変更は不要、ビルド・テストとも問題なし。
- **バンドルサイズ**：`FigureConvertModule`のJSチャンクはpdf-lib・jsPDF・svg2pdf.js・jszip等の合算で約1.1MB（gzip換算390KB）と大きいが、Phase 1で導入済みの`React.lazy`によりFigureタブを開いたときにしか読み込まれない。これは統合前の単体アプリでも元々発生していたコストであり、統合によって増えたものではない。

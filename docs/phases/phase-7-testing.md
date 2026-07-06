# Phase 7 — テスト統合

[← INTEGRATION_PLAN.md](../../INTEGRATION_PLAN.md) | [← フェーズ一覧](README.md)

**ステータス**：完了（2026-07-06）

## 目的

Vitestテストが存在するのはA(Citation)のみ（[03-tech-alignment.md](../03-tech-alignment.md)）。統合を機に、B/C/Dにもテストを追加しAの水準に揃える。

## スコープ

- Aの既存Vitestテスト（`pr1234.test.ts` 112件 + `regression.test.ts` 8件）を1つのVitest設定に集約（Phase 1で既に動作確認済みのものを正式に組み込む）
- Table（B）: `lib/table/` のparser/normalize/formatters/generatorsに対する単体テストを新規追加
- Figure Convert（C）: `converters/` の変換ロジックに対する単体テストを新規追加
- Chart（D）: 16図種のパラメータ処理・データ変換ロジックに対する単体テストを新規追加（matplotlib描画自体はPython側なのでE2E/スナップショット検討）
- CI（GitHub Actions）で `npm run build` + `vitest run` を自動実行（[03-tech-alignment.md](../03-tech-alignment.md)）

## 完了条件

- [x] 全モジュールのコアロジックにVitestテストが存在する
- [x] CI上で build + test が自動実行される
- [x] 既存112+8件のテストが引き続き全件パスする

## 実施メモ（2026-07-06）

### 0. repos/内のサンプルデータをテストフィクスチャとして適応

ユーザーから「testの際にrepos内にある各種テストファイルが必要ならまずはそちらの本プログラムへの適応を行って」と指示された。事前調査の結果、B/C/Dの3リポジトリには自動テストコード（`*.test.ts`等）は存在せず、`test/`・`test-data/`配下に**手動QA用のサンプルデータ・チェックリスト**のみが存在することを確認した：

- `latex-table-composer/test-data/*.csv`（Merge機能検証用の4ファイル：main/append_rows/append_columns/replace_target）
- `latex-figure-composer/test/approach.{png,jpg,jpeg,svg}`（変換テスト用サンプル画像、SVGは実際の`viewBox="0 0 800 480"`を持つ）
- `figure-modification/test/csv/*.csv`（16図種分のサンプルCSV）+ `README.md`（各図種の期待値付き手動チェックリスト）

これらをそれぞれ`test-data/{table,figure-convert,chart}/`にコピーし、新規Vitestテストの実データフィクスチャとして採用した（Chart側は`validate()`のテストのみに留まり今回はCSVフィクスチャを直接使うテストは書いていないが、将来のCSV→FigureData変換テスト追加時に流用可能）。当初は各モジュールの`__tests__/fixtures/`に分散配置していたが、`repos/`自体はGitHubにpushされない参照用クローンであるため「サンプルデータを一箇所にまとめておきたい」というユーザーの意向を受け、プロジェクト直下の`test-data/`にモジュール別サブフォルダで集約する構成に変更した（元の4リポジトリがそれぞれ`test/`・`test-data/`を1つだけ持っていた構成に近い）。

### 1. Citation（A）：既存テストの確認

`pr1234.test.ts`（104件）+ `regression.test.ts`（8件）＝112件は既にPhase 1で正式に組み込み済みであることを確認（追加作業なし）。

### 2. shared/lib：dataParsing・latexEscapeにテスト追加（想定外の発見・バグ修正）

Table/ChartのCSV/TSVパーサーが共通利用する`shared/lib/dataParsing`（`parseCSV`/`parseTSV`）にテストを追加。さらに`shared/lib/latexEscape`（Table・Figure Convert・Chart全てのLaTeXキャプション/ラベル生成で共用）のテストを書く過程で、**逐次`.replace()`方式の実装がバックスラッシュのエスケープ後に生成される`\textbackslash{}`の中括弧を、後続の`{`/`}`エスケープ処理で二重エスケープしてしまうバグ**（`latexEscape('a\\b')`が`'a\textbackslash\{\}b'`となり、LaTeX上で余計な中括弧が可視化される）を発見。原因は「複数の特殊文字を順番に`.replace()`していくと、先の置換結果に含まれる文字が後の置換で再度処理されてしまう」という構造的な欠陥で、どの順序に並べ替えても別の文字の組み合わせで同種の問題が起きる。単一パスの正規表現＋コールバックによる実装（`value.replace(/[\\&%$#_{}]/g, ch => MAP[ch])`）に書き換えて修正し、回帰テストを追加した。

### 3. Table（B）：parser/normalize/formatters/generators/mergeに単体テスト追加

`lib/table/`配下の全コアロジックにテストを追加（8ファイル、59テスト）：`detect`・`parseClassificationReport`・`parseLog`・`parseInput`（オーケストレーション）・`normalizeTable`・`formatValue`・`latexGenerator`・`mergeTables`（`test-data/`の実CSVフィクスチャを使用）。

テスト作成過程で`latexGenerator`の`borderTemplate: 'full'`が、隣接する行境界ごとに前の行の`lineAfter`と次の行の`lineBefore`が独立して`\hline`を出力するため**2重線になる**仕様（バグではなく実装上の副作用）であることが判明。動作を変更するかはUI上の見た目のインパクトが不明で今回のスコープ外と判断し、テストは現状の挙動（2重線）をそのまま固定するアサーションとして記録し、コメントで理由を明記した。

### 4. Figure Convert（C）：convertersに単体テスト追加

`converters/imageToEps.ts`・`imageToPdf.ts`・`svgToEps.ts`・`svgToPdfVector.ts`は`Image`/`Canvas`/`URL.createObjectURL`などブラウザ専用APIに依存しており、実画像デコードを伴うテストはNode環境では現実的でないと判断。代わりに、これらの内部にある**純粋なロジック部分**（EPSバウンディングボックス計算・RGBA→16進エンコード・EPSファイル構造組み立て・px→pt変換・PDFページサイズ計算・SVG寸法パース）をテスト可能な形に整理した：

- `svgToEps.ts`と`svgToPdfVector.ts`に全く同じ内容で重複定義されていた`parseSvgDimensions`を`converters/parseSvgDimensions.ts`に切り出し（2箇所の重複を解消しつつテスト対象にできた）。DOMParserが必要なため、このテストファイルのみ`happy-dom`を`// @vitest-environment happy-dom`で指定（他の全テストはデフォルトの`node`環境のまま、既存テストへの影響なし）。
- `imageToPdf.ts`の`pixelsToPt`/`calcPageSize`をexportしてテスト可能にした。
- `imageToEps.ts`の`calcEpsBBox`/`rgbaToHex`/`buildEps`は元々export済みだったのでそのままテスト。

`happy-dom`を新規devDependencyとして追加（`jsdom`より軽量）。3ファイル・19テスト。

### 5. Chart（D）：figureApi.validate・figureStoreに単体テスト追加

16図種のパラメータ処理・データ変換ロジックの中核は各図種専用の巨大な入力コンポーネント（`components/input/*.tsx`、React/UI密結合）にあり単体テストの費用対効果が低いと判断。代わりに、**全図種で共通のバリデーションロジック**である`api/figureApi.ts`の`validate()`（純粋関数）に焦点を当ててテストした。8図種（confusion_matrix/heatmap/bar_chart/line_plot/scatter_plot/histogram/box_plot・violin_plot/error_bar）に個別の検証ケースがあり、残り8図種（roc_curve/pr_curve/learning_curve/feature_importance/stacked_bar/combo_chart/pie_chart）には検証ロジックが存在せず常に素通りすることも確認・明示的にテストで固定した（将来の意図しない変更を検知できるようにするため。バリデーション未実装であること自体は今回のスコープ外として現状維持）。

`store/figureStore.ts`（Zustand）はIndexedDB永続化層（`storage/db.ts`）をモック化し、状態遷移ロジック（追加・更新・削除・並べ替え・レイアウト変更）を実IndexedDBなしでテスト。また非exportだった`migrateFigures`（旧形式scatter_plotデータの移行ロジック）をexportしてテスト対象にした。2ファイル・38テスト。

### 6. CI（GitHub Actions）

`.github/workflows/ci.yml`を新規作成。`main`へのpush/PR時に`npm ci` → `npm run build`（型チェック含む） → `npm test`を自動実行。

### 検証結果

新規テスト128件を追加し、既存112件と合わせて**全17ファイル・240件が全件パス**。`npm run build`もグリーン（テストファイル自体の型エラー1件をビルド時に検出・修正済み — `tsc -b`がテストコードも型チェック対象にしていることを再確認）。

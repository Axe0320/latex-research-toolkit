# 02. 機能連携設計

[← INTEGRATION_PLAN.md に戻る](../INTEGRATION_PLAN.md) | [← 00-overview.md](00-overview.md)

単にコードを1つのリポジトリに集めるだけでなく、**実際にワークフローとして繋がる**機能を実装する。これが今回の統合の本丸。

## 3. 連携機能一覧

| # | 連携機能 | 内容 |
|---|---|---|
| 1 | **Chart → Figure Converter 送信** | Chart モジュールで生成した PNG/SVG に「Send to Figure Converter」ボタンを追加。押すと Figure タブに切り替わり、その画像が変換キューに自動投入された状態で開く（ダウンロード→再アップロードの手間を排除） |
| 2 | **Table ⇄ Chart のパーサー共通化** | B の `lib/table/parser`（CSV/TSV/Classification Report検出）と D の sklearn貼り付け・CSV入力は8割ロジックが重複 → `shared/lib/dataParsing` に統合。将来的に「この表の数値列をChartでプロットする」ボタンも実装可能に |
| 3 | **共通クリップボードバス** | `shared/clipboard` に `{type: 'table'|'figure'|'citation', payload}` を保持する軽量ストア。画像Blobをそのまま渡せるよう共有IndexedDB（`clipboard`ストア）に実装（localStorageは文字列専用でBlobを扱えないため） |
| 4 | **Export Paper Assets（統合成果物のZIP出力）** | Citation の `.bib`、Table の LaTeX table コード、Figure の PDF/EPS をまとめて1つの ZIP としてダウンロードする機能。論文執筆の最終成果物を1アクションで得られる、最も価値の高い連携機能 |
| 5 | **Toast/通知の統一** | B に既存の `components/shared/Toast.tsx` を `shared/ui` に昇格し、4モジュール共通で使用（現状4リポジトリがそれぞれ独自実装） |
| 6 | **Vision AI OCRパイプラインの共通化** | D専用だったOCR機能を`shared/ocr`に昇格し、Table・Citationからも利用可能にする（§3.3） |
| 7 | **LaTeX図表引用コードの生成**（Phase 5完了後にユーザー要望で追加） | Figure Converter・Chartの両方で、変換/出力したファイルを`\begin{figure}...\end{figure}`で囲んだLaTeXコードを生成しコピーできる機能。Tableの`latexGenerator`と同じ「データ→LaTeXコード生成」パターンを図に適用したもの（§3.5） |

## 3.1 クリップボードバスの技術設計

単一スロット方式（履歴は持たず、送信するたびに上書き）。マルチアイテム管理は本プロジェクトの規模には過剰設計。

```ts
type ClipboardItem =
  | { type: 'figure'; format: 'png' | 'svg'; blob: Blob; sourceModule: 'chart' }
  | { type: 'table'; data: TableModel; sourceModule: 'table' }
  | { type: 'citation'; entries: LibraryEntry[]; sourceModule: 'citation' }

useClipboard(): { item: ClipboardItem | null; send(item: ClipboardItem): void; consume(): ClipboardItem | null }
```

フロー：送信元で `send()` → 対象タブへ自動切り替え → 遷移先モジュールのマウント時に `consume()` で読み取り、ローカル状態に反映（読み取り後はストアから消費されクリアされる）。

## 3.2 Export Paper Assets の設計

[01-architecture.md](01-architecture.md) §2.4 でCitation LibraryとTableセッションを両方IndexedDBへ永続化する方針にしたことで、この機能は「ライブなReact状態を横断的に読みに行く」複雑な仕組みが不要になる。**IndexedDBの3ストア（`citationLibrary` / `tableSessions` / `figures`）を読み出してJSZipでまとめるだけ**の単純な実装で済む。永続化方針とこの連携機能は意図的に設計を接続している。

## 3.3 Vision AI OCRパイプラインの他モジュールへの展開

現状 Chart モジュール（D）にしか無い「画像 → Vision AI（Claude / GPT-4o / Gemini） → 構造化データ」というOCRパイプラインは、**Table・Citation モジュールにも横展開できる汎用パターン**である。

**D の既存実装**（移植・共通化のベース）：
- `src/ocr/imagePreprocess.ts`・`src/ocr/tesseractWorker.ts` — 前処理・Tesseract.jsフォールバック
- `src/hooks/useOcr.ts` — 状態管理フック
- `src/api/ocrApi.ts` + backend `api/ocr.py` — Vision API呼び出し（JSONスキーマ付きプロンプト）
- `components/import/{ImportModal,OcrSettings,OcrConfirm,PointDigitizer}.tsx` — UI一式（APIキー管理・抽出結果確認編集・手動点取り）

**展開先の具体案**：

| モジュール | ユースケース | 抽出先スキーマ |
|---|---|---|
| Table (B) | 印刷された表・スクリーンショットの写真から表データを自動抽出 | `TableModel`（行・列・セル値） |
| Citation (A) | 参考文献リストの写真・スクリーンショットから引用を一括抽出 | 引用テキスト配列 → 既存の `detectFormat`/`parseByFormat` にそのまま渡せる |

**設計方針**：`chart/ocr` 一式を `shared/ocr` に昇格し、Vision AI呼び出し部分は「抽出先JSONスキーマ」と「プロンプトテンプレート」をモジュール側から注入できるようパラメータ化する。APIキー管理UI（`OcrSettings.tsx`）・プロバイダ選択・Tesseract.jsフォールバックの仕組みはそのまま共通化して再利用する。Figure Convert (C) は抽出対象となるデータを持たない（画像フォーマット変換のみ）ため対象外。

**優先度**：必須機能ではなく、§4（移行フェーズ）の Phase 5（機能連携）で余裕があれば着手する追加候補。まずはOCRなしでの各モジュール移植を優先する。

## 3.4 アカウントログイン連携（Claude / ChatGPT）について — 不採用

「ユーザーがClaude/ChatGPTアカウントにログインして、そのPro/Plusサブスクリプションの利用枠でOCR機能を使えるようにできないか」という発想について、2026年7月時点の状況をWebSearchで確認した。

- **Anthropic（Claude）**：2026年2月19日に方針を発表、4月4日に施行。Claude Pro/Max/Teamのサブスクリプションは、サードパーティ製ツール経由（OAuthトークン利用）の場合は**利用枠の対象外**となった。理由は「サブスクリプション裁定取引」防止（本来API課金なら高額になる利用を、安価なサブスク経由で肩代わりさせる行為の規制）。API キー認証は引き続き利用可能。
- **OpenAI（ChatGPT）**：「Sign in with ChatGPT」は2025年5月発表だが、2026年4月時点でも**Codex系ツール内でのみ提供**されており、任意のサードパーティWebアプリ向けの一般公開されたOAuth連携ではない。コミュニティによる非公式な実験的ワークアラウンドは存在するが、本プロジェクトのような公開Webアプリに組み込むのは規約リスクが高く不適切。

**結論**：アカウントログインによるサブスクリプション連携は**両社とも一般的な選択肢として提供されておらず、Anthropicは明示的に禁止している**。現行の「ユーザーが自分のAPIキーを入力し、ブラウザのlocalStorageにのみ保存する」方式（D が既に採用）が、両社の利用規約に沿った唯一の現実的な実装であり、これを維持する。

## 3.5 LaTeX図表引用コードの生成

Phase 5完了後、ユーザーから「TableのLaTeX出力と同じように、FigureやChartで作った図についても`\includegraphics`の引用コードを生成できないか」という要望があり、実装した（連携#7）。

**参考にした出力例**（ユーザー提示）：
```latex
\begin{figure*}[tb]
\begin{center}
\includegraphics[width=1.0\linewidth]{Approach04.png}
\caption{Overview of Our Approach}\label{Approach}
\end{center}
\end{figure*}
```

**設計方針**：Tableの`latexGenerator.ts`と全く同じ「データ／設定 → LaTeXコード文字列を返す純粋関数」パターンを踏襲。`shared/latexFigure/generateFigureLatex.ts`として実装し、Figure Converter・Chartの両方から呼び出す。

**オプション項目**（Tableの`FormattingBar`と同程度＝4〜5項目）：
- 環境：`figure` / `figure*`
- 配置指定：`tb` / `htbp` / `h` / `t` / `b` / `p`
- 幅：100% / 80% / 60% / 50% / 40%
- 幅の基準：`\linewidth` / `\textwidth` / `\columnwidth`
- 中央揃え方式：`center`環境 / `\centering`

キャプション・ラベルは各図・各変換ファイルごとに個別入力（Figure Converterはバッチ変換に対応しているため、ファイルごとに異なるキャプションを付けられるようにする必要があった）。

**配置**：
- **Chart**：`FigurePreview`の下に新規`LatexFigureExport`コンポーネントとして追加。デフォルトキャプションは図の`title`パラメータ、デフォルトラベルは`fig:` + タイトルのスラッグ
- **Figure Converter**：変換完了後の結果一覧の下に新規セクション「4. LaTeX Code」として追加。変換済みファイルごとに個別のキャプション/ラベル入力とコピーボタンを表示（オプションは全ファイル共通）

**副産物**：この実装のためにTableの`lib/table/formatters/shared/latexEscape.ts`（LaTeX特殊文字エスケープ）を`shared/lib/latexEscape.ts`に切り出し、Table・Figure両方から共通利用する形にした。

# Phase 5 — 機能連携の実装

[← INTEGRATION_PLAN.md](../../INTEGRATION_PLAN.md) | [← フェーズ一覧](README.md)

**ステータス**：完了（2026-07-06）。6項目すべて実装（ユーザーが全項目実施を選択）。

## 目的

4モジュールが単に同居しているだけの状態から、[02-integrations.md](../02-integrations.md) で設計した実際のワークフロー連携を実装する。Phase 1〜4で各モジュールの受信側/送信側の土台は作成済みなので、ここで配線を完成させる。

## スコープ

| # | 機能 | 実装内容 |
|---|---|---|
| 1 | Chart → Figure Converter 送信 | `shared/clipboard` 経由での画像Blob受け渡し（[02-integrations.md](../02-integrations.md) §3.1） |
| 2 | Table ⇄ Chart パーサー共通化 | `shared/lib/dataParsing` の実装・両モジュールからの利用に切り替え |
| 3 | 共通クリップボードバス | `shared/clipboard` + `shared/persistence` の `clipboard`ストアの実装・全モジュールへの「送る」メニュー追加 |
| 4 | Export Paper Assets | IndexedDB 3ストア（`citationLibrary`/`tableSessions`/`figures`）を読み出しJSZipでまとめる機能の実装（[02-integrations.md](../02-integrations.md) §3.2） |
| 5 | Toast統一 | 全モジュールが `shared/ui` のToastを使うようリファクタ |
| 6 (任意) | Vision AI OCRの展開 | `shared/ocr` を Table（画像→表データ抽出）・Citation（参考文献リスト画像→引用抽出）に展開（[02-integrations.md](../02-integrations.md) §3.3。時間・優先度次第で次フェーズ以降に先送り可） |

## 完了条件

- [x] Chartで生成した図から「Figure Converterへ送る」を押すと、Figureタブが自動で開き変換キューに画像が入っている（Playwrightで実際にクリックし、キューに`chart-figure.png`が追加されることを確認）
- [x] Export Paper Assetsボタンで、現在のCitation Library・Tableの表・Chartの図をまとめたZIPがダウンロードできる（Playwrightで実際にダウンロードイベントを確認）
- [x] Toastコンポーネントの統一：Table（Phase 2で対応済み）・Citation（今回対応）が`shared/ui`のToastを使用。Figure Convert・Chartは元々独自Toastを持っていなかったため対象外
- [x] Table・CitationにOCRインポートを追加（画像→Vision AI/Tesseract→取り込み。Playwrightでタブ表示を確認、バックエンドのスキーマ追加も実施）

## 実施メモ（2026-07-06）

### 1. Chart → Figure Converter 送信・共通クリップボードバス（連携#1・#3）

`shared/clipboard`（`ClipboardItem`型は現時点で`type:'figure'`のみ実装。Table/Citationを送信元とする連携は今回作られていないため、投機的な型を先に増やさなかった）と`shared/navigation`（タブ切り替えをプロップドリリングなしでリクエストできる小さなpub-sub）を新規作成。`shared/persistence`に`clipboard`ストアを追加。Chartの`FigurePreview`に「Figure Converterへ送る」ボタンを追加し、現在のプレビューPNGをBlob化して送信 → `requestTab('figure')`でFigureタブへ自動遷移。Figure Convert側は`useClipboard()`の反応的な`item`を`useEffect`で監視し、届いたBlobを`File`化して既存の`addFiles()`にそのまま渡すことで、Figure Converter自体の変換ロジックは一切変更していない。

### 2. Table ⇄ Chart パーサー共通化（連携#2）

Chartの`components/input/DataInput/parseCsv.ts`（タブ/カンマを区別せず単純splitするだけで引用符付きCSVフィールドを扱えなかった）を、Phase 2で作成済みの`shared/lib/dataParsing`（`parseCSV`/`parseTSV`）に委譲する実装に置き換えた。呼び出し側7ファイルの関数シグネチャは変更なし。

### 3. Export Paper Assets（連携#4）

`src/exportPaperAssets.ts`（`shared/`配下ではなくsrcルート直下に配置：Citation/Table/Chartそれぞれのデータ形状を具体的に知っているオーケストレーターであり、モジュール非依存であるべき`shared/`の性質とは異なるため）。`citationLibrary`から`.bib`、`tableSessions`から`latexGenerator`経由で`.tex`、`figures`+`previews`から図のPNGを読み出し、JSZipで`paper-assets.zip`にまとめる。App.tsxのヘッダー行に配置したボタンから起動。**jszip・Table生成ロジックを動的importにしてメインバンドルから除外**（静的importで一度386KBまでメインバンドルが膨張したのを確認し修正、通常時は281KB程度に復帰）。

### 4. Toast統一（連携#5）

Citationの独自Toast実装（`toastMsg`/`toastVisible`状態＋`.toast`カスタムCSS）を`shared/ui`の`useToast`/`Toast`に置き換え、`citation.css`から不要になった`.toast`関連ルールを削除。CitationのLibrary容量上限（500件/4MB、`checkBeforeSave`）もこのタイミングで撤廃（後述）。

### 5. Citation LibraryのIndexedDB移行（[01-architecture.md](../01-architecture.md) §2.4の積み残し）

Phase 1で先送りしていたCitation Libraryの永続化を`localStorage`から`shared/persistence`の`citationLibrary`ストアへ移行。`load()`/`save()`が非同期になったため、Table/Chartで確立した「`xxxLoaded`フラグで初回ロード完了前の保存を防ぐ」パターンをCitationにも適用。設計方針通り、人為的な容量上限（`checkBeforeSave`・`SaveResult`型）を完全に撤廃した。Playwrightでライブラリに1件追加→リロード→保持されることを確認。

### 6. Vision AI OCRの`shared/ocr`展開（連携#6、任意項目）

- **抽出したもの**：`imagePreprocess.ts`（無改造コピー）、`OcrSettings.tsx`（Chart側の完全に汎用的な実装をそのまま`shared/ocr`に移動し、Chart側は移動先を再import。これは実質的な重複解消）、および新規の汎用版`tesseractWorker.ts`・`visionOcr.ts`・`useOcr.ts`（`FigureType`ではなく任意の`domainType: string`を受け取る設計に一般化）。
- **あえて統合しなかったもの**：Chart自身の`hooks/useOcr.ts`・`api/ocrApi.ts`・`ocr/tesseractWorker.ts`は元のまま維持した。ChartのOCRフロー（自動検出・PointDigitizer・16図種のスキーマ切り替え）は複雑かつ既に動作確認済みのため、無理に共通化して回帰リスクを負うより、新規の汎用実装との一部重複を許容する判断とした（`OcrSettings.tsx`のような完全に汎用なコンポーネントのみ実利ある統合を行った）。
- **バックエンド拡張**：`api/_lib/vision.py`の`SCHEMAS`/`FIGURE_TYPE_JA`辞書に`table_data`（表データ抽出用）と`citation_list`（参考文献リスト抽出用）を追加しただけ（`ocr.py`本体は`type`をただの文字列キーとして扱う設計だったため、構造変更は不要だった）。
- **Table側**：新規`OcrImportContent.tsx`をInputPanelの新モード「OCR」として追加。Vision AIの`{columns, rows}`抽出結果（またはTesseractの生テキスト）をTSV文字列に変換し、既存の`parseInput()`（Paste機能と同じパーサー）にそのまま渡す設計とし、専用の確認・編集UIを新たに作らずTableの既存の堅牢なパーサー・プレビュー機能を再利用した。
- **Citation側**：新規`OcrImport.tsx`を入力ソースタブに追加（Text/DOI/URL/File/**OCR**）。抽出した引用文字列を既存の`input`ステートに流し込み、`inputSource`を自動的に`text`に切り替えることで、Table同様に既存の変換パイプラインをそのまま再利用。
- **未検証事項**：実際のVision AI API呼び出し（Claude/OpenAI/Gemini）は有効なAPIキーがないため実行できていない。Phase 4のOCRエンドポイント検証（不正キーで401エラーが正しく返ることを確認済み）と同水準の間接検証に留まる。Tesseract.jsのブラウザ内OCRパスも同様に未実機検証。

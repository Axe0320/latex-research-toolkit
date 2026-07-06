# Phase 3 — Figure Converter モジュール移植（C: latex-figure-composer）

[← INTEGRATION_PLAN.md](../../INTEGRATION_PLAN.md) | [← フェーズ一覧](README.md)

**ステータス**：未着手

## 目的

latex-figure-composer を `modules/figure-convert/` として移植する。C は既にPhase 1で採用したスタック（React19.2/Vite8.1/TS6.0）と同一のため、バージョン調整は不要。4モジュール中もっとも小規模で単純な移植。

## スコープ

**移植する**
- `src/converters/`（imageToPdf, svgToPdfVector, imageToEps, svgToEps）
- `src/hooks/useConversion.ts`
- `src/types/conversion.ts`, `src/utils/fileHelpers.ts`
- `src/components/`（FileUploader, FileList, FormatSelector, ConvertButton, BatchResult, ErrorArea）→ FileUploaderは`shared/ui`のFileDropzoneへ統合検討（[03-tech-alignment.md](../03-tech-alignment.md)）

**移植しない**
- `App.tsx`（親構造が異なる）、vite/tsconfig設定、node_modules

**新規追加（今回の統合で決定した拡張）**
- クリップボードバスの受信側実装：Chartモジュールからの「Send to Figure Converter」を受け取り、変換キューに自動投入（[02-integrations.md](../02-integrations.md) 連携#1・§3.1）

## 手順

1. `feature/figure-convert-integration` ブランチを作成
2. `converters/` `hooks/` をコピー
3. UIコンポーネントを移植し、`shared/ui`へ統合できるものは統合
4. `App.tsx`にFigureタブを追加
5. クリップボードバスの受信ロジックを実装
6. 動作確認（下記チェックリスト）
7. `npm run build`
8. ローカル動作確認
9. commit → push → merge判断

## 完了条件

- [ ] PNG/JPG/JPEG → PDF 変換が正常動作
- [ ] SVG → PDF（ネイティブベクター、jsPDF+svg2pdf.js）が正常動作
- [ ] PNG/JPG/JPEG/SVG → EPS 変換が正常動作
- [ ] 複数ファイル一括変換・ZIP一括ダウンロードが正常動作
- [ ] Chartモジュールからの「Send to Figure Converter」で画像が変換キューに自動投入される（新規機能）
- [ ] Citation/Table機能に regression なし
- [ ] `npm run build` 成功

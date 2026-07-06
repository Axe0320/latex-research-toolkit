# Phase 4 — Chart モジュール移植（D: figure-modification、最重量）

[← INTEGRATION_PLAN.md](../../INTEGRATION_PLAN.md) | [← フェーズ一覧](README.md)

**ステータス**：未着手

## 目的

figure-modification を `modules/chart/` として移植する。4モジュール中もっとも複雑（16図種・Zustand・IndexedDB・OCR・Pythonバックエンド）。慎重な検証が必要。

## スコープ

**フロントエンド移植**
- `src/components/{input,editor,compose,import,preview,common}/`（16図種の入力・編集・合成・OCR・共通コンポーネント）
- `src/store/figureStore.ts`（Zustand、chartモジュールにスコープしたまま維持）
- `src/hooks/useOcr.ts`, `src/ocr/`, `src/api/{figureApi,ocrApi}.ts`
- `src/types/figures.ts`

**バックエンド移植（`api/`、そのまま）**
- `render.py` / `compose.py` / `ocr.py` / `stat_test.py` / `_lib/`（16図種レンダラー）
- ルートの `vercel.json`（`PYTHON_VERSION`指定）を統合後アプリのルートにマージ

**バージョン処理**：Vite 6.0→8.1 / TS 5.6→6.0 昇格（[01-architecture.md](../01-architecture.md) §2.2）。Tailwind 4は変更なし（既にD採用）。

**永続化変更**：`src/storage/db.ts` の DB名を `academic-suite` に変更し、`shared/persistence` に接続ロジックを集約（[01-architecture.md](../01-architecture.md) §2.4）。既存のオブジェクトストア（`figures`/`layout`/`previews`）はそのまま維持し、他モジュールのストア（`citationLibrary`/`tableSessions`/`clipboard`）と同居させる。

**新規追加（今回の統合で決定した拡張）**
- 「Send to Figure Converter」ボタンの実装（送信側、[02-integrations.md](../02-integrations.md) 連携#1）
- OCRパイプラインの`shared/ocr`への切り出し（Table/Citationからの再利用に向けた準備、[02-integrations.md](../02-integrations.md) §3.3。Phase 4では切り出しの土台作りまで、実際の他モジュール展開はPhase 5以降）
- Sentryの適用範囲をアプリ全体に拡大（`main.tsx`でのinit、[03-tech-alignment.md](../03-tech-alignment.md)）

## 手順

1. `feature/chart-integration` ブランチを作成
2. フロントエンド一式をコピー、`shared/persistence`へのDB接続切り替え
3. `api/`一式をコピー、ルート`vercel.json`をマージ
4. `App.tsx`にChartタブを追加
5. 16図種すべてを個別に動作確認（下記チェックリスト）
6. OCRパイプライン（Vision AI 3種 + Tesseract.jsフォールバック）を確認
7. Compose機能（グリッド/自由配置）を確認
8. `npm run build`
9. ローカル動作確認（`vercel dev`でPython API込みの動作確認が必要）
10. commit → push → merge判断

## 完了条件

- [ ] 16図種（棒・積み上げ棒・棒+折れ線複合・折れ線・散布図・円・ヒストグラム・箱ひげ・バイオリン・エラーバー・ヒートマップ・混合行列・ROC・PR・学習曲線・特徴量重要度）すべてが描画・編集・出力できる
- [ ] 手入力・CSV・sklearn貼り付け・OCRインポートの全入力方式が動作
- [ ] Compose（グリッド/自由配置）とSVG/PDF/EPS出力が動作
- [ ] 統計有意差ブラケット（t検定・Mann-Whitney、多重比較補正）が動作
- [ ] `/api/*.py` がVercel Functionsとして同一プロジェクトにデプロイされる
- [ ] IndexedDBが `academic-suite` DBの `figures`/`layout`/`previews` ストアとして他モジュールと共存する
- [ ] Citation/Table/Figure Convert機能に regression なし
- [ ] `npm run build` 成功

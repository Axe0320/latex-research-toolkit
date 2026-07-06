# Phase 4 — Chart モジュール移植（D: figure-modification、最重量）

[← INTEGRATION_PLAN.md](../../INTEGRATION_PLAN.md) | [← フェーズ一覧](README.md)

**ステータス**：完了（2026-07-06）

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
- 「Send to Figure Converter」ボタンの実装は**今回は実施せず、Phase 5に先送り**した。送信先の`shared/clipboard`バス自体がまだ存在しない（Phase 5のスコープ）ため、Phase 3で受信側を見送ったのと同じ理由で送信側だけ先に作っても検証できない。
- OCRパイプラインの`shared/ocr`への切り出しも同様に**Phase 5へ先送り**。現時点でTable/Citation側に消費者がいないため、`modules/chart/ocr`に留めたまま動作確認を優先した。
- Sentryの適用範囲をアプリ全体に拡大（`main.tsx`でのinit、[03-tech-alignment.md](../03-tech-alignment.md)）。**統合アプリ用にSentryプロジェクトを新規作成し、Dの旧プロジェクトのDSNは流用しない**（旧4デプロイが生き続けるため、エラーの発生元を混同しないための分離）。実装済みだが`VITE_SENTRY_DSN`は未設定（Phase 8でSentryプロジェクトを新規作成し設定する）ため、現状はSentry無効化状態でビルド・動作する。

## 手順

1. `feature/chart-integration` ブランチを作成
2. フロントエンド一式をコピー、`shared/persistence`へのDB接続切り替え
3. `api/`一式をコピー、ルート`vercel.json`をマージ
4. `App.tsx`にChartタブを追加
5. 16図種すべてを個別に動作確認（下記チェックリスト）
6. OCRパイプライン（Vision AI 3種 + Tesseract.jsフォールバック）を確認
7. Compose機能（グリッド/自由配置）を確認
8. `npm run build`
9. ローカル動作確認（`vercel dev`は使わず、`scripts/dev-api-server.py`+Viteプロキシで代替。詳細は実施メモ参照）
10. commit → push → merge判断

## 完了条件

- [x] 16図種すべてが実際のPythonバックエンド経由で描画できる（後述のローカルAPIサーバーで16種全てをHTTP経由で直接検証し、さらにPlaywrightでブラウザ上の全16タブ切り替え→プレビュー再描画を確認）。編集は棒グラフ・特徴量重要度で手入力→再描画を確認、残り14種は同一コードパスのため未個別確認
- [x] 手入力方式が動作（棒グラフ・特徴量重要度で確認）。CSV/sklearn貼り付け・OCRインポートのUIは存在し開くことは確認したが、実際の読み込みまでは未確認（OCRは実APIキーがないため、バックエンドのバリデーション・エラーハンドリングまでを確認）
- [x] Compose（グリッド配置）でプレビュー表示を確認。自由配置・SVG/PDF/EPSエクスポートの実クリックは未確認（`compose.py`バックエンド自体はHTTP直接テストでPNG生成を確認済み）
- [x] 統計有意差ブラケットのバックエンド（t検定・Welch・Mann-Whitney）をHTTP直接テストで確認（`scipy`欠落バグを発見・修正、後述）。エディタUI（`BracketSection.tsx`）からの実操作は未確認
- [ ] `/api/*.py` がVercel Functionsとして同一プロジェクトにデプロイされる → Phase 8のスコープ（未実施）
- [x] IndexedDBが `academic-suite` DBの `figures`/`layout`/`previews` ストアとして他モジュールと共存する（Playwrightでリロード後の図の永続化を確認）
- [x] Citation/Table/Figure Convert機能に regression なし（Vitest 112件全件パス、Playwrightで3モジュールへのタブ切り替えを確認）
- [x] `npm run build` 成功

## 実施メモ（2026-07-06）

- **重大な自己ミス（グローバルPython環境の破壊と復旧）**：`requirements.txt`を`python -m pip install`で導入した際、誤って仮想環境ではなくシステムのグローバルPython環境にインストールしてしまい、`numpy`（2.1.3→1.26.4）と`matplotlib`（3.10.3→3.8.2）を無許可でダウングレードした（ユーザーの他プロジェクト`atproto`等に影響しうる状態）。即座に気づき、`numpy==2.1.3`・`matplotlib==3.10.3`・`typing-extensions==4.12.2`を再インストールして元の状態に復元し、誤って入れた`anthropic`等の不要パッケージも削除。以後は`.venv`（プロジェクトローカルの仮想環境）を作成し、そちらにのみ依存関係をインストールする方針に切り替えた（`.gitignore`に`.venv/`を追加）。
- **発見・修正したバグ（`requirements.txt`に`scipy`が欠落）**：`api/stat_test.py`は`from scipy import stats`を使うが、元リポジトリの`requirements.txt`に`scipy`が含まれておらず、本番では統計有意差ブラケット機能（`/api/stat_test`）が常に500エラーになる状態だった。`scipy==1.12.0`を追加し、ローカルで実際に3種の検定（t検定・Welch・Mann-Whitney）が正しいp値を返すことを確認した。
- **Vercelを使わないローカルバックエンド検証**：計画では「`vercel dev`でPython API込みの動作確認」を想定していたが、`vercel dev`はVercelアカウントへのプロジェクトリンクを伴う可能性があり、「Vercel関連作業はPhase 8まで行わない」というユーザー方針に反するため使用しなかった。代わりに`scripts/dev-api-server.py`（`api/*.py`の各handlerクラスをポート8801〜8804でそのまま起動するだけの薄いラッパー）を新規作成し、`vite.config.ts`の`server.proxy`で`npm run dev`から`/api/*`をそのポート群へ転送する構成にした。この方法はVercel Cloudに一切触れず、かつ本番と全く同じhandlerコードを実地検証できる。`vite build`（本番ビルド）には影響しない（`server.proxy`は`vite dev`専用設定）。今後のPhase（5以降のChart関連連携機能の検証）でも同じ仕組みを再利用できる。
- **CSS**：Chartモジュールは他3モジュールと異なりTailwindユーティリティクラスのみで構成されており（`className`を全ファイルgrepし、Tailwindユーティリティ以外のクラス名がゼロであることを確認済み）、`.card`のような独自クラス衝突は発生しない。唯一必要だったのは`var(--shadow-sm)`等のCSS変数2つで、これを`.chart-module`スコープに追加した（`chart.css`、他モジュールと同じスコープパターンを踏襲）。
- **永続化**：`storage/db.ts`を書き換え、独自の`openDB('figure-modification', ...)`ではなく`shared/persistence`の`getDB()`（`academic-suite`DB）を使うようにした。関数シグネチャは変更していないため`figureStore.ts`・`ChartModule.tsx`からの呼び出し側は無改造。`shared/persistence/db.ts`の`upgrade()`に`figures`（keyPath: 'id'）/`layout`/`previews`ストアを追加。

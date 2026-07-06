# 決定事項の変遷ログ

[← INTEGRATION_PLAN.md に戻る](../INTEGRATION_PLAN.md) | [← 00-overview.md](00-overview.md)

計画策定セッション中に判断が変わった/確定した事項を時系列で記録する。理由の再検討過程を残すことで、後から「なぜこうなったか」を追跡できるようにする。

### 2026-07-06 — 統合アーキテクチャ：完全な単一アプリに統合

4リポジトリ自身が持っていた2つの矛盾する統合計画（citation/table側=単一SPA選択的統合 vs figure-modification側=pnpm workspaceモノレポ）のうち、ユーザーは「完全な単一アプリ」を明示的に選択。モノレポ案は不採用。詳細：[00-overview.md](00-overview.md)。

### 2026-07-06 — バージョン統一方針：ダウングレード → 昇格へ方針転換

- **初期判断**：latex-figure-composerのみReact19/Vite8/TS6.0と先行していたため、3リポジトリに合わせてCをダウングレード（React18.3/Vite6/TS5.6）する方針とした。理由：影響範囲が小さい（C単体）。
- **ユーザーからの疑問**：「先行しているCに他を合わせるべきでは？」
- **再検証**：WebSearchでZustand・`@sentry/react`・`@tailwindcss/vite`のReact19対応状況を確認した結果、互換性ブロッカーは無いことが判明。さらに、Phase 2〜4でB/Dの全機能をどのみち手動で再検証する計画になっているため、その過程でバージョンも合わせて上げる限界費用は小さいと判断し直した。
- **最終決定**：Cに合わせて全体を昇格（React19.2/Vite8.1/TS6.0）。詳細：[01-architecture.md](01-architecture.md) §2.2。

### 2026-07-06 — 永続化方針：IndexedDBへの統一

ユーザーからの質問「IndexedDBを他リポジトリにも対応させるべきか」を受け、D専用だったIndexedDB基盤を全モジュール共通の永続化層として拡張する方針を決定。Citation LibraryのlocalStorage上限（500件/4MB）撤廃、Tableの永続化機能新設という副次的な改善も判明。詳細：[01-architecture.md](01-architecture.md) §2.4。

### 2026-07-06 — バックエンド方針：Chart専用維持 + Citation用プロキシ新設

Pythonバックエンドは既存どおりChartモジュール専用に留める。追加でCitationモジュールの脆い外部CORSプロキシ依存（corsproxy.io/allorigins.win）を自前プロキシ関数に置き換える改善を提案・採用。詳細：[01-architecture.md](01-architecture.md) §2.6。

### 2026-07-06 — LLM/Vision AI OCRの展開方針

D専用だったOCRパイプラインをTable・Citationにも展開可能な共通モジュール（`shared/ocr`）として設計。一方、Claude/ChatGPTのアカウントログイン経由でのサブスクリプション連携は、2026年のAnthropic/OpenAI両社の規約・仕様（WebSearchで確認）により不採用と決定。詳細：[02-integrations.md](02-integrations.md) §3.3-3.4。

### 2026-07-06 — リポジトリ運用：新規リポジトリ作成、旧4デプロイは維持

旧4つのVercelデプロイはそのまま残し、統合アプリは新規リポジトリ（提案名: `latex-research-toolkit`）を作成してプッシュする方針を確定。詳細：[00-overview.md](00-overview.md) §2。

### 2026-07-06 — ドキュメント構成：単一ファイルから分割

`INTEGRATION_PLAN.md` が肥大化したため、`docs/`配下にトピック別・フェーズ別ファイルへ分割。`INTEGRATION_PLAN.md`自体は各ドキュメントへのインデックスとして再構成。

### 2026-07-06 — 最終レビュー：セキュリティ・スコープ管理の追加事項

計画の最終見直しで新たに発見・追加した事項：
- `/api/resolve-citation`プロキシにSSRF対策（許可リスト方式）が必須であることを明記
- IndexedDBのスキーマバージョニング規約（`schemaVersion`+マイグレーション関数）をPhase 1で先に決める方針を追加
- 4リポジトリのシークレット漏洩チェックを実施し、実際の漏洩は無いことを確認（プレースホルダーのみ）
- スコープが大きいため、Phase 5の5つの連携機能を薄く広く実装するより1つの連携ストーリーを完全に仕上げることを優先する指針を追加
- 授業提出物としての位置づけ（今回の統合が新規課題か個人発展プロジェクトか）はユーザー自身が担当教員に確認すべき事項として明記（AIからは判断不可）

### 2026-07-06 — 本統合は最終提出物であることが確定、README.mdをPhase 8に追加

ユーザーが確認：本統合は最終提出物としての位置づけ。旧4リポジトリのREADMEが共通して持つ形式（課題背景・アーキテクチャ図・技術スタック・課題要件の明記等）を踏襲したREADME.mdの作成をPhase 8のスコープに追加。設計ドキュメント（`docs/`一式）へのリンクも含める方針とした。詳細：[phases/phase-8-deploy.md](phases/phase-8-deploy.md)。

### 2026-07-06 — リポジトリ名・配置場所・Phase 1範囲の確定、実装着手

- **リポジトリ名**：候補（`latex-research-toolkit` / `academic-suite` / `paper-forge` / `scholarly-toolkit`）を提示し、ユーザーは提案どおり `latex-research-toolkit` を選択。
- **配置場所**：`c:\dev\Integration-app` 直下（`repos/`・`docs/`と同階層）をそのまま新リポジトリのルートとする。別サブフォルダは切らない。
- **Phase 1のスコープ**：ローカルでの実装・動作確認だけでなく、GitHub上への新規リポジトリ作成・pushまで含めることを確定。
- これによりPhase 1着手の前提が揃ったため実装を開始する。

### 2026-07-06 — Vercelデプロイのタイミング、Sentryプロジェクトの分離

- **Vercelデプロイのタイミング**：早期にpreviewデプロイして`vercel.json`（Python Functions混在設定）を検証しておく案を提示したが、ユーザーは計画通りPhase 8（全Phase完了後の一括デプロイ）を選択。
- **Sentryプロジェクトの分離（ユーザー提案・採用）**：実装タイミングはPhase 4のままでよいが、Sentry側の管理単位（プロジェクト）はDが元々使っていたものを流用せず、統合アプリ用に新規作成することに決定。旧4デプロイ（Dの単体デプロイ含む）がそのまま生き続ける方針のため、同一Sentryプロジェクトを共有するとエラーの発生元（統合アプリ vs 旧D単体）が混同されてしまうのが理由。詳細：[03-tech-alignment.md](03-tech-alignment.md)、[phases/phase-4-chart.md](phases/phase-4-chart.md)、[phases/phase-8-deploy.md](phases/phase-8-deploy.md)。

### 2026-07-06 — xlsx依存の脆弱性対応（npmレジストリ版→SheetJS公式CDN版に切替）

Phase 3実装中の`npm install`で、Phase 2で追加した`xlsx@0.18.5`（npmレジストリ版）にhigh重度の脆弱性2件（Prototype Pollution: GHSA-4r6h-8v6p-xvw6、ReDoS: GHSA-5pgg-2g8v-p4x9）があることが`npm audit`で判明。WebSearchで調査した結果、SheetJSはnpmレジストリへの修正版配布を停止しており、自社CDN（`https://cdn.sheetjs.com/`）でのみ修正版（Prototype Pollutionは0.19.3で、ReDoSは0.20.2で解決済み）を配布していることを確認。ユーザーへ「リスク受容のまま進める」か「CDN版に切り替える」かを確認したところ、ユーザーは詳細調査のうえでの提案を希望。調査結果を提示し、最終提出物として脆弱性を実際に解消する方が望ましいと判断し、`npm i --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`で最新版（両脆弱性修正済み）に切替。APIは同一のためコード変更不要、ビルド・Vitest・Playwright動作確認とも問題なし、`npm audit`は0件に。詳細：[phases/phase-3-figure-convert.md](phases/phase-3-figure-convert.md)実施メモ。

### 2026-07-06 — Figure Converterのクリップボードバス受信側実装をPhase 5へ先送り

Phase 3のスコープには当初「クリップボードバスの受信側実装」が含まれていたが、送信側であるChartモジュール自体がPhase 4未着手で存在せず、実機で検証する手段がないため実装を見送った。`shared/clipboard`自体もPhase 5のスコープとして計画されており、送受信を一体で設計・実装する方が手戻りが少ないと判断。Table移植時の`shared/lib/dataParsing`（Chart側の実統合をPhase 5に残した）と同じ考え方。詳細：[phases/phase-3-figure-convert.md](phases/phase-3-figure-convert.md)。

### 2026-07-06 — Phase 4作業中のインシデント：グローバルPython環境を誤って変更・即時復旧

`requirements.txt`のインストールコマンドを実行した際、プロジェクト用の仮想環境ではなくユーザーのシステムPython環境に対して実行してしまい、既存の`numpy`（2.1.3）・`matplotlib`（3.10.3）を`requirements.txt`指定のバージョン（1.26.4・3.8.2）に無許可でダウングレードした。ユーザーの他プロジェクト（`atproto`使用）に影響しうる状態だったため、気づいた直後に元のバージョンへ再インストールして復旧し、誤って追加された`anthropic`等の不要パッケージも削除した。再発防止のため、以後は`.venv`（プロジェクトローカルの仮想環境）を作成し、そちらにのみ依存関係をインストールする方針に切り替えた。ユーザーへの実害は発生しなかったが、記録として残す。

### 2026-07-06 — Chartのローカルバックエンド検証は`vercel dev`を使わず自前サーバーで代替

Chartモジュール移植（Phase 4）のローカル動作確認では、計画で想定していた`vercel dev`を使用しなかった。`vercel dev`はVercelアカウントへのプロジェクトリンクを伴う可能性があり、「Vercelへの接続はPhase 8まで行わない」という既存の方針（Vercelデプロイのタイミングに関する決定を参照）に抵触するため。代わりに`scripts/dev-api-server.py`（`api/*.py`の各ハンドラをそのまま複数ポートで起動する薄いラッパー）と`vite.config.ts`の`server.proxy`設定を新規追加し、Vercel Cloudに一切触れずに本番と同一のPythonコードを実地検証できるようにした。`vite build`（本番ビルド）には影響しない。副産物として、`api/stat_test.py`が`scipy`を使うにもかかわらず`requirements.txt`に`scipy`が欠落しているバグ（本番では統計検定機能が常に500エラーになる）を発見・修正した。詳細：[phases/phase-4-chart.md](phases/phase-4-chart.md)実施メモ。

### 2026-07-06 — Phase 5のスコープ：6項目全部を実施

Phase 5開始前に、`04-risks.md`の最終レビューで残っていた「5つの連携機能を薄く実装するより1つを完全に仕上げる方を優先する」という指針とのバランスをユーザーに確認。選択肢（コア機能のみ／1ストーリーのみ完全実装／6項目全部）を提示した結果、ユーザーは「6項目全部（OCR展開含む）」を選択。結果として計画時点の「任意」項目だったVision AI OCRのTable/Citation展開も含め全項目を実装した。詳細：[phases/phase-5-integrations.md](phases/phase-5-integrations.md)。

### 2026-07-06 — OCR共通化はOcrSettingsのみ実施、Chart本体のOCRロジックは意図的に非統合のまま

`shared/ocr`への切り出しにあたり、Chart自身の`useOcr`/`ocrApi`/`tesseractWorker`（`FigureType`に密結合した複雑な実装）はそのまま維持し、新規に汎用版（`domainType: string`を受け取る設計）を`shared/ocr`に作成してTable/Citationのみがそれを使う構成にした。完全な統合（Chartも汎用版に置き換える）は見送った。理由：Chartの既存OCRフロー（自動検出・PointDigitizer・16図種のスキーマ切り替え）はPhase 4で動作確認済みの複雑な機能であり、無理に共通化して回帰リスクを負うより、`OcrSettings.tsx`（完全に汎用的で実利のある統合ができた部分）だけ実際に統合し、それ以外は多少の重複を許容する方が安全と判断した。詳細：[phases/phase-5-integrations.md](phases/phase-5-integrations.md)実施メモ。

### 2026-07-06 — LaTeX図表引用コード生成機能を追加（Phase 5完了後のユーザー要望）

Phase 5完了後、ユーザーから「TableのLaTeX出力機能と同様に、FigureやChartで生成した図についても`\begin{figure}...\end{figure}`形式のLaTeX引用コードを生成できないか」という提案があった。Tableの`latexGenerator.ts`と全く同じ設計パターン（データ/設定→LaTeX文字列を返す純粋関数）が図にもそのまま適用できると判断し、「Figure Converter・Chart両方に追加し、Tableの`FormattingBar`と同程度のオプション選択（環境・配置・幅・幅の基準・中央揃え方式の5項目）を持たせたい」というユーザーの要望通りに実装した。`shared/latexFigure`として共通ロジックを新規作成し、副産物としてTable専用だった`latexEscape.ts`を`shared/lib/`に切り出して共通化した。詳細：[02-integrations.md](02-integrations.md) §3.5。

**副次的なバグ修正**：この機能のPlaywright検証中に、ローカル開発用`scripts/dev-api-server.py`（Phase 4で新規作成）が単一スレッドの`HTTPServer`だったため、Chartが起動時に発火する2件同時の`/api/render`リクエストの片方がVite開発プロキシ経由で502エラーになる問題を発見。`ThreadingHTTPServer`に変更して解決（本番のVercel Functionsは各リクエストが独立プロセスのため影響なし。開発ツールのみの修正）。

### 2026-07-06 — Phase 6で発見：citation.cssの無スコープなグローバルリセットがアプリ全体のTailwind paddingを破壊していた

Phase 6（デザイン統一・モバイル崩れ確認）でPlaywrightにより375px幅を検証中、Citationタブを一度でも開くと（`mountedTabs`によりタブはアンマウントされないためセッション中ずっと）、アプリ共通ヘッダー（TabBar・Export Paper Assetsボタン）のTailwind `px-*` paddingが0になる現象を発見。原因は`citation.css`が唯一`.citation-module`のようなラッパークラスでスコープされておらず、`*, *::before, *::after { margin:0; padding:0; }`という素の（`@layer`未指定の）ユニバーサルリセットをドキュメント全体に適用していたこと。CSS Cascade Layersの仕様上、レイヤー未指定のルールは`@layer utilities`内のTailwindユーティリティより常に優先されるため、指定margin/padding系のユーティリティクラスが軒並み無効化されていた。Table/Figure-Convertは既に`.table-module`/`.figure-convert-module`パターンでスコープ済みだったため影響を受けず、Citationのみの問題だった（Phase 2時点で確立された「各モジュールCSSは`.{module}-module`でスコープする」規約が、最初期に作られたCitationモジュール自身には適用されずに残っていたことが根本原因）。

`CitationModule.tsx`のルートに`.citation-module`クラスを追加し、`citation.css`の`:root`/`body`/`textarea`をそれぞれ`.citation-module`スコープに変更、無条件の`*`リセットは削除（Tailwind4の`@import "tailwindcss"`が同等のリセットを`@layer base`で既に提供しており冗長だった）して解決。この修正で隠れていた別の実バグ（App.tsx共通ヘッダー行が375pxで折り返さない、Chartのツールバーが375pxでページ全体を横に広げる）も連鎖的に発見・修正した。詳細：[phases/phase-6-design-unification.md](phases/phase-6-design-unification.md)実施メモ。

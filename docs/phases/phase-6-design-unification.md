# Phase 6 — デザイン統一パス

[← INTEGRATION_PLAN.md](../../INTEGRATION_PLAN.md) | [← フェーズ一覧](README.md)

**ステータス**：完了（2026-07-06）

## 目的

4モジュールを移植し機能連携も繋いだ後、見た目としても「1つのアプリ」に見えるよう仕上げる。

## スコープ

- 全モジュールをTailwind4の共通デザイントークン（[01-architecture.md](../01-architecture.md) §2.5、`@theme`によるCSS変数ブリッジ）に揃える
- ヘッダー・タブナビゲーションを1つに統一（ブランド名「LaTeX Research Toolkit」、[01-architecture.md](../01-architecture.md) §2.5）
- card / button hierarchy / spacing / border radius / shadow の統一（B旧計画のvisual languageを踏襲）
- モバイルレイアウトの崩れがないことを4モジュール全てで確認

## 完了条件

- [x] 4モジュール全てで背景色・アクセントカラー・カードスタイルが統一されている
- [x] ヘッダー/タブナビが1つに統一されている
- [x] モバイル幅（375px想定）で崩れがない

## 実施メモ（2026-07-06）

### 1. 各モジュールの重複ヘッダーを削除

App.tsx側の共通`Header`（「LaTeX Research Toolkit」＋サブタイトル）＋`TabBar`が既に1つ存在するため、各モジュールが自前で持っていた装飾的なタイトルを除去した。

- **Citation**：`<header className="header"><h1>Citation ⇄ BibTeX</h1>...</header>` ブロックを丸ごと削除。
- **Table**：タイトル/サブタイトルの`<div>`のみ削除し、`Load Example`/`Copy LaTeX`ボタン行は機能的なので維持（`justify-between`→`justify-end`のスリムな1行アクションバーに変更）。
- **Figure Convert**：`<Header />`コンポーネント呼び出しと`components/Header.tsx`自体を削除（純粋に装飾のみで、Citationと同じパターン）。対応する`figure-convert.css`内`.header`関連ルールも削除。
- **Chart**：ロゴアイコン＋「Figure Modification」の`<h1>`を削除し、`FigureList`・図読み込み・APIキー・編集/構成トグルなどの機能ボタン行はそのまま維持。

### 2. Tableのモバイル用ModeSelector重複を修正（Phase 2から持ち越し）

`TableModule.tsx`で`ModeSelector`が常時1回（デスクトップ/モバイル共通）と、モバイル専用のInputタブ内でさらにもう1回、計2回描画されていた。モバイルInputタブ内の重複呼び出しを削除。

### 3. Citation.cssのグローバルCSS漏れを修正（想定外の発見・重要）

Playwrightで375px幅の崩れを確認中、Table/Figure/Chartタブでのみアプリ共通ヘッダー行（TabBar＋Export Paper Assetsボタン）のpaddingが消失する現象を発見。原因調査の結果、`citation.css`が唯一 `.citation-module` のようなラッパークラスでスコープされておらず、
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root { --bg: ...; ... }
body { ... }
textarea { ... }
```
を**ドキュメント全体に無条件適用**していたことが判明。特に`:root`ブロックはTailwindの`.px-4`ユーティリティが使う`--spacing`変数のスコープ外に置かれるわけではないが、`*{margin:0;padding:0}`という素の（`@layer`未指定の）ルールは、CSS Cascade Layersの仕様上`@layer utilities`内のTailwindユーティリティより常に優先される。そのため一度Citationタブを開く（＝`citation.css`がロードされる）と、タブは`mountedTabs`によりアンマウントされないため、**セッション中ずっと**アプリ全体のTailwind paddingが破壊されたままになっていた。Table/Figure-Convertは既に`.table-module`/`.figure-convert-module`でスコープ済みだったため、この問題はCitationのみ。

修正：`CitationModule.tsx`のルート`<div>`に`.citation-module`クラスを追加し、`citation.css`の`:root`ブロックを`.citation-module`に変更（Table/Figure-Convertと同じパターンに統一）。素の`*`リセットは削除（Tailwind4の`@import "tailwindcss"`が同等のリセットを`@layer base`で既に提供しており冗長だった）。`body{}`ルールは削除（`src/index.css`の`@layer base`と重複。`line-height:1.6`のみ`.citation-module`に残した）。無scopeだった`textarea{...}`一式も`.citation-module textarea`に変更。Table/Figure-Convert/Chartの各`<textarea>`は元々インラインstyleで自己完結しているため、この変更による見た目への影響なしを確認済み。

### 4. アプリ共通ヘッダー行が375pxで折り返さない問題を修正

Citationの修正で隠れていた実際のバグが露呈：`App.tsx`の`<div className="flex items-center gap-3">`（TabBar＋Export Paper Assetsボタン）が折り返し不可のため、375px幅では合計約403px分の内容がはみ出していた。`flex-wrap justify-center`＋左右`px-4`を追加し、狭い画面ではTabBarとExportボタンが2行に分かれるよう修正。

### 5. Chartのツールバーが375pxでページ全体を横に広げる問題を修正

Chartの`<header>`（FigureList・図読み込み・APIキー・編集/構成トグルを横並びする行）が`overflow-x`未指定で、内容が収まらない場合にページ自体を横方向に押し広げていた（`.chart-module`全体が470px相当まで広がっていた）。`overflow-x-auto`を追加し、狭い画面ではツールバー自体がその場で横スクロールするよう修正（`FigureList`内部や図種タブバーは元々`overflow-x-auto`で正しく実装済みだった）。

### 検証方法

`vite build`の本番ビルドを`vite preview`で配信し、Playwrightで4タブ×2ビューポート（デスクトップ1280px／モバイル375px、後者は縦3000pxの高いビューポートでスクロールバー分の誤差を排除）を実際に開き、`document.documentElement.scrollWidth`がビューポート幅を超えないこと、`<h1>`テキストが「LaTeX Research Toolkit」の1回だけであること（重複ヘッダー完全排除の確認）をアサート。修正前後でスクリーンショットを比較し目視でも確認。Vitest 112件・`npm run build`（型チェック含む）も最終再実行しグリーンを確認。

# Phase 6 — デザイン統一パス

[← INTEGRATION_PLAN.md](../../INTEGRATION_PLAN.md) | [← フェーズ一覧](README.md)

**ステータス**：未着手

## 目的

4モジュールを移植し機能連携も繋いだ後、見た目としても「1つのアプリ」に見えるよう仕上げる。

## スコープ

- 全モジュールをTailwind4の共通デザイントークン（[01-architecture.md](../01-architecture.md) §2.5、`@theme`によるCSS変数ブリッジ）に揃える
- ヘッダー・タブナビゲーションを1つに統一（ブランド名「LaTeX Research Toolkit」、[01-architecture.md](../01-architecture.md) §2.5）
- card / button hierarchy / spacing / border radius / shadow の統一（B旧計画のvisual languageを踏襲）
- モバイルレイアウトの崩れがないことを4モジュール全てで確認

## 完了条件

- [ ] 4モジュール全てで背景色・アクセントカラー・カードスタイルが統一されている
- [ ] ヘッダー/タブナビが1つに統一されている
- [ ] モバイル幅（375px想定）で崩れがない

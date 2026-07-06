# Phase 7 — テスト統合

[← INTEGRATION_PLAN.md](../../INTEGRATION_PLAN.md) | [← フェーズ一覧](README.md)

**ステータス**：未着手

## 目的

Vitestテストが存在するのはA(Citation)のみ（[03-tech-alignment.md](../03-tech-alignment.md)）。統合を機に、B/C/Dにもテストを追加しAの水準に揃える。

## スコープ

- Aの既存Vitestテスト（`pr1234.test.ts` 112件 + `regression.test.ts` 8件）を1つのVitest設定に集約（Phase 1で既に動作確認済みのものを正式に組み込む）
- Table（B）: `lib/table/` のparser/normalize/formatters/generatorsに対する単体テストを新規追加
- Figure Convert（C）: `converters/` の変換ロジックに対する単体テストを新規追加
- Chart（D）: 16図種のパラメータ処理・データ変換ロジックに対する単体テストを新規追加（matplotlib描画自体はPython側なのでE2E/スナップショット検討）
- CI（GitHub Actions）で `npm run build` + `vitest run` を自動実行（[03-tech-alignment.md](../03-tech-alignment.md)）

## 完了条件

- [ ] 全モジュールのコアロジックにVitestテストが存在する
- [ ] CI上で build + test が自動実行される
- [ ] 既存112+8件のテストが引き続き全件パスする

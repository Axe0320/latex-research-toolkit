# Phase 8 — デプロイ

[← INTEGRATION_PLAN.md](../../INTEGRATION_PLAN.md) | [← フェーズ一覧](README.md)

**ステータス**：未着手

## 目的

統合アプリを新規リポジトリからVercelへデプロイする。

## スコープ

- 新規リポジトリ（[00-overview.md](../00-overview.md) §2、提案名 `latex-research-toolkit`）から単一Vercelプロジェクトとしてデプロイ
- 静的ビルド（Vite）+ Python Functions（`api/*.py`）が混在するプロジェクト設定（Dの`vercel.json`をベースに統合）
- 環境変数の整理：`VITE_SENTRY_DSN`（アプリ全体に拡大、[03-tech-alignment.md](../03-tech-alignment.md)）、Vision AI関連は引き続きユーザーのlocalStorage管理でサーバー環境変数は不要
- 旧4つのVercelデプロイは**そのまま維持**（[00-overview.md](../00-overview.md) §2で確定済み。リダイレクト等の追加作業は行わない）
- **README.md の作成**（本統合は最終提出物のため必須、[04-risks.md](../04-risks.md)で確定）

### README.md の構成案

4つの旧リポジトリのREADMEが共通して持つ形式（プロジェクト概要 → 課題背景 → 主な機能 → アーキテクチャ図 → 技術スタック → セットアップ → 制限事項 → Version History → 備考 → License）を踏襲しつつ、統合アプリとして以下を追加する。

1. **プロジェクト概要**：LaTeX Research Toolkit（4機能統合版）としての位置づけ
2. **統合前の4プロジェクトへの参照**：citation-bibtex-converter / latex-table-composer / latex-figure-composer / figure-modification へのリンクと、それぞれが単体でも別デプロイのまま残っている旨
3. **統合アーキテクチャ図**：4モジュール構成・機能連携（Chart→Figure送信、Export Paper Assets等）のMermaid図
4. **各モジュールの機能**：旧READMEの「主な機能」セクションを要約転記
5. **技術スタック**：[01-architecture.md](../01-architecture.md) §2.2の統一後バージョン表
6. **設計ドキュメントへのリンク**：`docs/`配下（本計画一式）へのリンク。設計プロセスの厚みを示す材料として有効
7. **課題要件の明記**（旧4リポジトリの慣習を踏襲）：AI支援（Claude Code）を活用した開発、実課題解決、GitHub公開、Vercelデプロイ、および「4つの個別課題プロトタイプを1つに統合した最終成果物」である旨を明記
8. **Version History / License**

## 完了条件

- [ ] 新規リポジトリからVercelへのデプロイが成功
- [ ] 全4モジュール（Citation/Table/Figure/Chart）が本番URLで動作確認できる
- [ ] Python Functions（`/api/render`, `/api/compose`, `/api/ocr`, `/api/stat_test`, `/api/resolve-citation`）が本番で応答する
- [ ] 旧4デプロイのURLが引き続き生きている（変更していないことの確認のみ）
- [ ] README.md が上記構成案に沿って作成されている

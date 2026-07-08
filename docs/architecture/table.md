# 表（LaTeX Table Composer）

[← アーキテクチャ一覧](README.md) | [← README.md](../../README.md)

### 主な機能・技術

- 貼り付け / アップロード / 新規作成 / 統合 / AI解析の5つの入力方式。TSV・CSV・Excelコピー・Markdown表・sklearnのclassification reportを自動判定する
- `TableModel` を唯一の状態源（Single Source of Truth）とし、Preview・Edit・LaTeX出力が常に同期する
- セル単位のスタイル編集・範囲選択・注釈（`\tnote{}` / `\footnotemark`）、複数ソースの統合（行/列追加・置換）に対応
- 複数表をタブ管理し、IndexedDB に自動永続化（300msデバウンス）
- フロントエンドのみで変換が完結し、バックエンドは不要

### システム全体

```mermaid
%%{init: {'flowchart': {'nodeSpacing': 30, 'rankSpacing': 22}}}%%
flowchart TD
    classDef input fill:#6C63FF,color:#fff,stroke:#4a44cc
    classDef process fill:#10B981,color:#fff,stroke:#059669
    classDef model fill:#8B5CF6,color:#fff,stroke:#6D28D9
    classDef output fill:#3B82F6,color:#fff,stroke:#2563EB
    classDef ui fill:#60A5FA,color:#fff,stroke:#2563EB

    A(["貼り付け<br/>TSV / CSV / Excel / Markdown"]):::input
    B(["アップロード<br/>.xlsx / .csv / .tsv"]):::input
    C(["新規作成<br/>空テーブル"]):::input
    D(["統合<br/>複数ソース"]):::input

    E["detect<br/>フォーマット自動判定"]:::process
    F["parse<br/>CSV / TSV / Excel / Classification Report"]:::process
    AI(["AI解析<br/>テキスト・ファイル"]):::input
    G["normalize<br/>列数補正・数値判定"]:::process

    H[("TableModel<br/>複数表管理・IndexedDB永続化")]:::model

    I["formatter<br/>小数点丸め・欠損値"]:::process
    J["latexGenerator<br/>booktabs / hline / tnote / makecell"]:::process

    K(["Preview<br/>論文風レンダリング"]):::ui
    L(["Edit<br/>セル編集・注釈・スタイル"]):::ui
    M(["LaTeX Output<br/>現在の表 / 全表"]):::output

    A & B --> E --> F
    AI -->|"parseInput()を再利用"| F
    F --> G
    C & D --> G
    G --> H
    H --> I --> J
    H --> K
    H --> L
    J --> M
```

### 処理パイプライン詳細

```mermaid
flowchart LR
    classDef step fill:#6C63FF,color:#fff,stroke:none
    classDef data fill:#EEF2FF,color:#374151,stroke:#6C63FF,stroke-width:2px

    R[Raw Input]:::data
    P[parse]:::step
    N[normalize]:::step
    T[(TableModel)]:::data
    F[formatter]:::step
    G[generator]:::step
    O[Preview / LaTeX]:::data

    R --> P --> N --> T --> F --> G --> O
```

### データモデル（TableModel）

```mermaid
classDiagram
    class TableModel {
        +string id
        +string title
        +string label
        +string environment
        +string[] columns
        +TableRow[] rows
        +TableNote[] notes
        +NoteStyle noteStyle
        +NoteNumbering noteNumbering
    }
    class TableRow {
        +string id
        +TableCell[] cells
        +string rowType
        +BorderStyle topBorder
        +BorderStyle bottomBorder
    }
    class TableCell {
        +string id
        +string value
        +boolean bold
        +boolean italic
        +boolean underline
        +string align
        +string backgroundColor
        +string[] noteMarkers
    }
    class TableNote {
        +string id
        +string marker
        +string text
    }
    TableModel "1" --> "*" TableRow
    TableRow "1" --> "*" TableCell
    TableModel "1" --> "*" TableNote
```

### 主要ファイル

```text
src/modules/table/
├── lib/table/
│   ├── parser/                    # detect / parseCSV / parseTSV / parseExcel
│   ├── normalize/                 # 列数補正・数値判定
│   ├── formatters/                # 小数点丸め・欠損値表記
│   ├── generators/latexGenerator.ts  # booktabs / hline / tnote / makecell
│   ├── editor/                    # セル・行・列編集操作
│   └── merge/mergeTables.ts       # 複数ソース統合（行/列追加・置換）
├── components/
│   ├── PreviewPanel.tsx / FormattingBar.tsx / TableEditorToolbar.tsx
│   ├── MergePanel.tsx
│   └── OcrImportContent.tsx       # AI解析（テキスト・ファイル→表データ）
└── TableModule.tsx
```

### 設計上の要点

- **TableModel を Single Source of Truth とする**：Preview・Edit・LaTeX出力のすべてが同じ `TableModel` を参照するため、編集内容が即座に他ビューへ反映される。
- **`detect` → `parse` → `normalize` の3段パイプライン**：フォーマット自動判定（TSV/CSV/Excelコピー/Markdown/sklearn classification report）を1つの `parse` 関数に混在させず、判定・変換・整形を分離することで新フォーマット追加時の影響範囲を局所化している。
- **複数表タブ管理の永続化**：`tableSessions` IndexedDB ストアに300msデバウンスで自動保存。初期ダミーテーブルが読み込み中の実データを上書きしないよう `sessionLoaded` フラグでガードしている。
- **AI解析（統合時に追加）**：抽出結果（`{columns, rows}`）を TSV 文字列に変換し、貼り付けタブと全く同じ `parseInput()` に通す設計。専用の確認/編集UIを新設せず、既存の堅牢なパーサーをそのまま再利用している。

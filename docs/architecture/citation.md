# 参考文献（Citation ⇄ BibTeX Converter）

[← アーキテクチャ一覧](README.md) | [← README.md](../../README.md)

### 主な機能・技術

- Text / DOI / URL / File / AI解析の5つの入力方式に対応。DOI・URLからは Crossref REST API で引用メタデータを自動取得する
- 引用テキストの形式自動判定は16形式（日本語4形式含む）のパーサーレジストリで実現し、優先度順に判定を試行する
- BibTeX 変換後は9つの主要引用スタイル（IEEE / APA / ACM / Nature / Springer / MLA / Chicago / Harvard / Pandoc）へ相互変換できる
- 変換したエントリは BibTeX Library（IndexedDB）に蓄積し、セッションをまたいで一括ダウンロードできる
- フロントエンドのみで変換処理が完結し、バックエンドは DOI/URL 解決用の軽量プロキシ（`/api/resolve-citation`）のみを持つ

### システム全体

```mermaid
%%{init: {'flowchart': {'nodeSpacing': 30, 'rankSpacing': 60}}}%%
flowchart TD
    classDef input  fill:#6C63FF,color:#fff,stroke:#4a44cc
    classDef api    fill:#F59E0B,color:#fff,stroke:#D97706
    classDef parse  fill:#10B981,color:#fff,stroke:#059669
    classDef format fill:#EF4444,color:#fff,stroke:#DC2626
    classDef out    fill:#3B82F6,color:#fff,stroke:#2563EB
    classDef store  fill:#8B5CF6,color:#fff,stroke:#6D28D9

    subgraph INPUTS["入力"]
        U(["URL 入力"]):::input
        D(["DOI 入力"]):::input
        T(["Text / File 入力<br/>BibTeX or 引用TXT"]):::input
        AI(["AI解析 入力<br/>テキスト・ファイル"]):::input
    end

    subgraph RESOLVE["DOI 解決"]
        direction LR
        RX["URL 正規表現<br/>doi.org / ACM / Springer"]:::api
        META[HTML メタタグ]:::api
        PROXY["/api/resolve-citation<br/>サーバーサイド解決"]:::api
        RX -->|"DOI なし"| META --> PROXY
    end

    CR[Crossref REST API]:::api

    subgraph PROC["変換・整形・出力"]
        CV["変換エンジン<br/>txt⇄bib · bib→bib · Cleanup"]:::parse
        SF["Citation Style Formatter<br/>9スタイル<br/>IEEE / APA / ACM / Nature<br/>Springer / MLA / Chicago / Harvard / Pandoc"]:::format
        OP[BibTeX / TXT]:::out
        CP([Copy]):::out
        DL([Download .bib / .txt]):::out
        CV -->|"BibTeX→TXTかつスタイル指定時"| SF
        CV --> OP
        SF --> OP
        OP --> CP
        OP --> DL
    end

    subgraph STORE["永続化"]
        LIB[("BibTeX Library<br/>IndexedDB")]:::store
    end

    U --> RX
    D --> CR
    RX -->|"DOI あり"| CR
    PROXY --> CR
    CR --> CV
    T --> CV
    AI --> CV
    CV -->|"+ Add to Library"| LIB
    LIB -->|"Export Paper Assets"| DL
```

「DOI 解決」は、URL 入力から DOI を特定するステップ（DOI を直接入力した場合はこのステップを経由せず Crossref REST API に直行する）。

### 変換エンジン詳細

```mermaid
flowchart LR
    classDef mod   fill:#10B981,color:#fff,stroke:#059669
    classDef canon fill:#6EE7B7,color:#065F46,stroke:#059669
    classDef fmt   fill:#EF4444,color:#fff,stroke:#DC2626
    classDef io    fill:#6C63FF,color:#fff,stroke:#4a44cc

    TI([TXT 入力]):::io
    BI([BibTeX 入力]):::io
    OUT([出力]):::io

    subgraph A["txt → bib"]
        A1[detectFormat<br/>16形式 registry]:::mod
        A2[parseByFormat<br/>形式別パーサー]:::mod
        A3[toCanonical<br/>authorRaw 保持]:::canon
        A4["buildBibTeX<br/>bibKey = Smith2024"]:::mod
        A1 --> A2 --> A3 --> A4
    end

    subgraph B["BibTeX 入力フロー"]
        B0[parseBibEntry]:::mod
        subgraph B1["bib → txt / bib (classic)"]
            B1a[FieldSelector<br/>16 項目]:::mod
        end
        subgraph B2["bib → Citation Style"]
            B2a[normalizeBibEntry]:::mod
            B2b["IEEE / APA / ACM / Nature<br/>Springer / MLA / Chicago / Harvard / Pandoc"]:::fmt
            B2a --> B2b
        end
        subgraph B3["bib → bib (Cleanup)"]
            B3a["retagEntry<br/>normalizeKey<br/>removeEmptyFields"]:::mod
            B3b[serialize]:::mod
            B3a --> B3b
        end
        B0 --> B1a
        B0 --> B2a
        B0 --> B3a
    end

    TI --> A1
    BI --> B0
    A4 --> OUT
    B1a --> OUT
    B2b --> OUT
    B3b --> OUT
```

### データモデル

```mermaid
classDiagram
    class CanonicalCitation {
        +string authorRaw
        +string title
        +string year
        +string journal
        +string volume
        +string number
        +string pages
        +string doi
    }
    class LibraryEntry {
        +string key
        +string type
        +string raw
        +number addedAt
    }
    class BibTeXLibrary {
        +LibraryEntry[] entries
        +save(entry)
        +mergeReplace(entries)
        +checkBeforeSave(entry)
    }
    BibTeXLibrary "1" --> "*" LibraryEntry
    CanonicalCitation ..> LibraryEntry : buildBibTeX() でシリアライズ
```

### 主要ファイル

```text
src/modules/citation/
├── lib/
│   ├── citation/                 # TXT → BibTeX 変換
│   │   ├── parsers/{english,japanese}.ts  # 15形式（日本語4形式含む）
│   │   ├── detect.ts              # detectFormat registry（priority順）
│   │   ├── canonical.ts           # CanonicalCitation
│   │   └── builder.ts             # buildBibTeX
│   ├── bibtex/                   # BibTeX → TXT 変換・整形
│   │   ├── formatters/            # 9 Citation Style Formatters
│   │   ├── normalize/             # 著者分割・正規化
│   │   └── cleanup.ts             # retagEntry / normalizeKey
│   └── library/                   # BibTeX Library（IndexedDB永続化）
├── components/
│   ├── FieldSelector.tsx          # フィールド選択（16項目）
│   ├── LibraryPanel.tsx           # BibTeX Library UI
│   └── OcrImport.tsx              # AI解析（テキスト・ファイル→抽出）
└── CitationModule.tsx
```

### 設計上の要点

- **16形式パーサーの registry パターン**：`detectFormat` は優先度順にソートされたパーサー配列を試行するため、新しい引用形式の追加は配列に1エントリ追加するだけで済む。
- **Canonical layer**：`toCanonical()` で著者名の生表記（`authorRaw`）を保持したまま正規化することで、`Smith2024` のような筆頭著者キー生成と、フォーマッタ側での表示用整形（`normalizeBibEntry`）を分離している。
- **AI解析（統合時に追加）**：画像OCRではなく、参考文献リストのテキスト・ファイルを直接 AI（Claude / GPT-4o / Gemini）に渡して構造化抽出する方式。抽出結果は既存の TXT パースパイプラインにそのまま流し込むため、専用の確認UIを新設していない（[docs/02-integrations.md](../02-integrations.md) §3.3）。
- **DOI解決のSSRF対策**：`/api/resolve-citation` はサーバーサイドで任意URLを fetch するため、DOI形式または既知の学術ドメインのみを許可するアローリストで入力を制限している。

# グラフ（Figure Modification）

[← アーキテクチャ一覧](README.md) | [← README.md](../../README.md)

### システム全体

```mermaid
flowchart TD
    classDef input  fill:#6C63FF,color:#fff,stroke:#4a44cc
    classDef api    fill:#F59E0B,color:#fff,stroke:#D97706
    classDef render fill:#10B981,color:#fff,stroke:#059669
    classDef out    fill:#3B82F6,color:#fff,stroke:#2563EB
    classDef store  fill:#8B5CF6,color:#fff,stroke:#6D28D9

    subgraph IN["① 入力"]
        M(["手入力 / テキスト貼り付け"]):::input
        C(["CSV アップロード"]):::input
        SK(["sklearn 貼り付け"]):::input
        OCR(["OCR / AI解析<br/>Vision AI・Tesseract.js"]):::input
    end

    subgraph STORE["② 状態管理"]
        ZU[("Zustand Store")]:::store
        IDB[("IndexedDB キャッシュ")]:::store
    end

    subgraph BACKEND["③ バックエンド（Vercel Functions）"]
        RND["POST /api/render"]:::api
        CMP["POST /api/compose"]:::api
        OCR2["POST /api/ocr"]:::api
        STAT["POST /api/stat_test"]:::api
        LIB["api/_lib/<br/>16 図種レンダラー<br/>（matplotlib + seaborn）"]:::render
        RND --> LIB
        CMP --> LIB
    end

    subgraph OUT["④ 出力"]
        PNG([PNG]):::out
        SVG([SVG]):::out
        PDF([PDF]):::out
        EPS([EPS]):::out
        FIGCONV(["Figure Converter へ送信"]):::out
    end

    M & C & SK --> ZU
    OCR --> OCR2 --> ZU
    ZU -->|debounced| RND
    ZU --> IDB
    RND -->|base64| IDB
    ZU --> CMP
    STAT -->|p値・座標| ZU
    IDB --> PNG --> FIGCONV
    RND --> SVG & PDF & EPS
```

### OCRパイプライン

```mermaid
flowchart TD
    classDef ui    fill:#6C63FF,color:#fff,stroke:#4a44cc
    classDef proc  fill:#10B981,color:#fff,stroke:#059669
    classDef ai    fill:#F59E0B,color:#fff,stroke:#D97706
    classDef local fill:#6B7280,color:#fff,stroke:#4B5563
    classDef edit  fill:#3B82F6,color:#fff,stroke:#2563EB

    UP([画像アップロード]):::ui
    PRE["Canvas API 前処理<br/>リサイズ・コントラスト"]:::proc
    TYPE([図種選択 16種類]):::ui
    PROV([解析方法選択]):::ui

    UP --> PRE
    PRE --> TYPE --> PROV

    PROV -->|"Vision AI"| VISION
    PROV -->|"Tesseract"| TESS
    PROV -->|"折れ線・散布図のみ"| CALIB

    VISION["Vision LLM 呼び出し<br/>JSON スキーマ付きプロンプト"]:::ai
    PARSE["JSON 解析・検証"]:::proc
    VISION --> PARSE

    TESS["Tesseract.js<br/>ブラウザ内テキスト抽出"]:::local
    GRID["グリッド解析<br/>混合行列・ヒートマップのみ自動変換"]:::local
    TESS --> GRID

    CALIB["4点軸較正<br/>X1, X2, Y1, Y2"]:::proc
    CLICK["Canvas クリックで点追加<br/>ピクセル → データ座標変換"]:::proc
    CALIB --> CLICK

    CONFIRM["OcrConfirm<br/>JSON 確認・編集"]:::edit
    APPLY([新規図として適用]):::ui

    PARSE --> CONFIRM
    GRID  --> CONFIRM
    CLICK --> CONFIRM
    CONFIRM --> APPLY
```

### データモデル

```mermaid
classDiagram
    class FigureState {
        +string id
        +FigureType type
        +Data data
        +Params params
    }
    class BaseFigureParams {
        +string title
        +number fontsize
        +number[] figsize_cm
        +number dpi
    }
    class ComposeLayout {
        +string mode
        +number gridCols
        +number gridRows
        +number gap
        +FigurePosition[] positions
    }
    class FigureStore {
        +FigureState[] figures
        +string selectedId
        +ComposeLayout layout
        +addFigure()
        +updateFigure()
        +removeFigure()
        +initialize()
    }
    FigureStore "1" --> "*" FigureState
    FigureStore "1" --> "1" ComposeLayout
    FigureState --> BaseFigureParams
```

### 主要ファイル

```text
src/modules/chart/
├── components/{input,editor,compose,import,preview}/
├── store/figureStore.ts           # Zustand（chartモジュールにスコープ）
├── hooks/useOcr.ts
├── api/{figureApi,ocrApi}.ts
└── ChartModule.tsx

api/
├── render.py / compose.py / ocr.py / stat_test.py / extract.py
└── _lib/                          # 16図種レンダラー・統計検定・Vision AI呼び出し
```

### 設計上の要点

- **`debounced` レンダリングと IndexedDB キャッシュ**：パラメータ変更のたびに `/api/render` を呼ぶとコストが高いため、デバウンスした上で結果を IndexedDB にキャッシュし、再訪時はキャッシュから即座に PNG を復元する。
- **画像OCRはChartにのみ残す**：Citation・Tableは統合時にテキスト/ファイルベースのAI解析へ置き換えたが、Chartは「グラフの画像そのものがデータ」であるため、画像OCR（Vision AI + Tesseract.js）の必要性が本質的に異なり、そのまま維持している（[docs/02-integrations.md](../02-integrations.md) §3.3）。
- **Tesseract.jsは補助手段**：APIキー不要でブラウザ内完結するが、混合行列・ヒートマップ以外は手動修正が前提（自動抽出不可のため、折れ線・散布図では手動点取りUIにフォールバックする）。
- **統計有意差ブラケット**：`stat_test.py`がWelch's t検定・Mann-Whitney U検定のp値を計算し、図上に直接ブラケットとして描画する。scipy依存を排除し、純Python実装（`api/_lib/stats_lite.py`）に置き換え済み（Vercelのバンドルサイズ制限対応、[docs/decisions-log.md](../decisions-log.md)）。

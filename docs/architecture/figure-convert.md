# 画像変換（LaTeX Figure Composer）

[← アーキテクチャ一覧](README.md) | [← README.md](../../README.md)

### 主な機能・技術

- PNG / JPG / SVG を `\includegraphics` 向けの PDF / EPS に変換。複数ファイルの一括バッチ変換に対応する
- SVG はベクターのまま埋め込み（拡大劣化なし）、EPS 変換のみ Canvas でラスタライズしてから PostScript エンコードする
- 変換後のファイルごとに `\begin{figure}...\end{figure}` の LaTeX 引用コードを個別生成できる
- Chart モジュールが生成した画像をそのまま受け取れる（ダウンロード→再アップロード不要）
- フロントエンドのみで変換が完結し、バックエンドは不要

### システム全体

```mermaid
%%{init: {'flowchart': {'nodeSpacing': 30, 'rankSpacing': 55}}}%%
flowchart TD
    classDef input fill:#6C63FF,color:#fff,stroke:#4a44cc
    classDef conv  fill:#10B981,color:#fff,stroke:#059669
    classDef out   fill:#3B82F6,color:#fff,stroke:#2563EB

    subgraph IN["入力"]
        PNG([PNG / JPG / JPEG]):::input
        SVG([SVG]):::input
        CHARTIN(["Chart から送信"]):::input
    end

    subgraph PROCESS["useConversion フック・変換エンジン"]
        DET["detectInputFormat<br/>MIME / 拡張子判定"]:::conv
        STATE["FigureFileItem[]<br/>pending→converting→done/error"]:::conv
        PAR["Promise.all<br/>並列変換（バッチ）"]:::conv
        DET --> STATE --> PAR
        P1["imageToPdf"]:::conv
        P2["svgToPdfVector<br/>jsPDF + svg2pdf.js"]:::conv
        E1["imageToEps<br/>ASCIIHex エンコード"]:::conv
        E2["svgToEps<br/>Canvas 2x ラスタライズ"]:::conv
        PAR --> P1
        PAR --> P2
        PAR --> E1
        PAR --> E2
    end

    subgraph OUT["出力・活用"]
        direction LR
        PDF([PDF]):::out
        EPS([EPS]):::out
        LTX(["LaTeX 図表引用コード"]):::out
        DL(["ダウンロード<br/>個別 / ZIP一括（まとめて）"]):::out
        PDF ~~~ EPS ~~~ LTX ~~~ DL
    end

    PNG --> DET
    SVG --> DET
    CHARTIN --> DET
    P1 --> PDF
    P2 --> PDF
    E1 --> EPS
    E2 --> EPS
    PDF --> LTX
    PDF --> DL
    EPS --> LTX
    EPS --> DL
```

### 変換パス詳細

```mermaid
flowchart LR
    classDef raster fill:#10B981,color:#fff,stroke:none
    classDef vector fill:#8B5CF6,color:#fff,stroke:none
    classDef embed  fill:#6C63FF,color:#fff,stroke:none
    classDef encode fill:#F59E0B,color:#fff,stroke:none
    classDef io     fill:#EEF2FF,color:#374151,stroke:#6C63FF,stroke-width:2px

    subgraph VECTOR["SVG → PDF（ベクター）"]
        V1[SVG text]:::io
        V2["jsPDF + svg2pdf.js<br/>DOM append → render"]:::vector
        V3["PDF ベクターデータ<br/>（拡大劣化なし）"]:::vector
        V1 --> V2 --> V3
    end

    subgraph RASTER["SVG → EPS（ラスタライズ）"]
        S1[SVG text]:::io
        S2["Image + Canvas<br/>2× scale"]:::raster
        S3["RGBA pixel data<br/>getImageData()"]:::raster
        S1 --> S2 --> S3
    end

    subgraph PDF_OUT["→ PDF"]
        P1["PDFDocument<br/>A4フィット 842pt<br/>縦横比保持"]:::embed
    end

    subgraph EPS_OUT["→ EPS"]
        E1["ASCIIHex エンコード<br/>LUT 高速変換"]:::encode
        E2["%!PS-Adobe-3.0 EPSF-3.0<br/>colorimage / 72文字折り返し"]:::encode
        E1 --> E2
    end

    R1[PNG / JPG]:::io
    R1 --> P1
    R1 --> E1
    V3 --> P1
    S3 --> E1
```

### データモデル（FigureFileItem の状態遷移）

```mermaid
stateDiagram-v2
    [*] --> pending: ファイル追加
    pending --> converting: 変換開始（Promise.all）
    converting --> done: 変換成功
    converting --> error: 変換失敗
    done --> [*]
    error --> [*]

    note right of error
        1ファイルの失敗は他ファイルの
        変換を止めない
    end note
```

### 主要ファイル

```text
src/modules/figure-convert/
├── converters/
│   ├── imageToPdf.ts / svgToPdfVector.ts
│   └── imageToEps.ts / svgToEps.ts
├── hooks/useConversion.ts         # バッチ変換の状態管理
├── components/
│   ├── FileUploader.tsx / FileList.tsx / FormatSelector.tsx
│   └── ConvertButton.tsx / BatchResult.tsx
└── FigureConvertModule.tsx
```

### 設計上の要点

- **SVGはベクターのまま埋め込む**：PNG/JPGはラスタ画像として`pdf-lib`で埋め込むのに対し、SVGは`jsPDF + svg2pdf.js`でベクターPDFとして出力するため、拡大しても劣化しない。EPS変換時のみ、PostScriptがベクターSVGを直接扱えないためCanvasで2倍スケールにラスタライズしてから変換する。
- **バッチ処理は`Promise.all`で並列化**：複数ファイルの変換は`FigureFileItem[]`のステータス（pending→converting→done/error）を個別に管理し、1ファイルの失敗が他ファイルの変換を止めないようにしている。
- **Chart連携（統合時に追加）**：`shared/clipboard`経由でChartが生成したPNGを受け取り、`addFiles()`にそのまま投入する。ダウンロード→再アップロードの手間を排除する連携機能。

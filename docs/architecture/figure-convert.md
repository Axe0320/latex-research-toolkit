# 画像変換（LaTeX Figure Composer）

[← アーキテクチャ一覧](README.md) | [← README.md](../../README.md)

### システム全体

```mermaid
flowchart TD
    classDef input fill:#6C63FF,color:#fff,stroke:#4a44cc
    classDef conv  fill:#10B981,color:#fff,stroke:#059669
    classDef out   fill:#EF4444,color:#fff,stroke:#DC2626
    classDef dl    fill:#3B82F6,color:#fff,stroke:#2563EB
    classDef hook  fill:#F59E0B,color:#fff,stroke:#D97706

    subgraph IN["① 入力"]
        PNG([PNG]):::input
        JPG([JPG / JPEG]):::input
        SVG([SVG]):::input
        CHARTIN(["Chart から送信<br/>Send to Figure Converter"]):::input
    end

    subgraph HOOK["useConversion hook"]
        DET["detectInputFormat<br/>MIME / 拡張子判定"]:::hook
        STATE["FigureFileItem[]<br/>pending→converting→done/error"]:::hook
        PAR["Promise.all<br/>並列変換（バッチ）"]:::hook
        DET --> STATE --> PAR
    end

    subgraph CONV["② 変換エンジン"]
        direction LR
        P1["imageToPdf"]:::conv
        P2["svgToPdfVector<br/>jsPDF + svg2pdf.js"]:::conv
        E1["imageToEps<br/>ASCIIHex エンコード"]:::conv
        E2["svgToEps<br/>Canvas 2x ラスタライズ"]:::conv
    end

    subgraph OUT["③ 出力"]
        PDF([PDF]):::out
        EPS([EPS]):::out
        LTX(["LaTeX 図表引用コード"]):::out
    end

    subgraph DL["④ ダウンロード"]
        INDIV([個別 ⬇]):::dl
        ZIP([ZIP 一括 / まとめてダウンロード]):::dl
    end

    PNG & JPG & CHARTIN --> DET
    SVG --> DET
    PAR --> P1 & P2
    PAR --> E1 & E2
    P1 & P2 --> PDF
    E1 & E2 --> EPS
    PDF & EPS --> LTX
    PDF & EPS --> INDIV & ZIP
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

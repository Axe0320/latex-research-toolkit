import { useCallback, useEffect, useRef, useState } from 'react'
import './chart.css'
import type {
  FigureType, FigureState, OutputFormat,
  ConfusionMatrixParams, ConfusionMatrixState,
  HeatmapParams,         HeatmapState,
  BarChartParams,        BarChartState,
  LinePlotParams,        LinePlotState,
  ScatterParams,         ScatterState,
  HistogramParams,       HistogramState,
  RocParams,             RocState,
  PrParams,              PrState,
  LearningParams,        LearningState,
  FeatureParams,         FeatureState,
  BoxParams,             BoxState,
  ViolinParams,          ViolinState,
  ErrorBarParams,        ErrorBarState,
  StackedBarParams,      StackedBarState,
  ComboParams,           ComboState,
  PieParams,             PieState,
} from './types/figures'
import { useFigureStore } from './store/figureStore'
import { getPreview } from './cache/previewCache'
import { savePreview } from './storage/db'
import { debouncedRender, renderAndCache, renderForDownload, composeAndExport } from './api/figureApi'
import { sendToClipboard } from '../../shared/clipboard'
import { requestTab } from '../../shared/navigation'
import CreateMode from './components/input/CreateMode'
import HeatmapCreateMode from './components/input/HeatmapCreateMode'
import BarChartInput from './components/input/BarChartInput'
import LinePlotInput from './components/input/LinePlotInput'
import ScatterInput from './components/input/ScatterInput'
import HistogramInput from './components/input/HistogramInput'
import RocInput from './components/input/RocInput'
import PrInput from './components/input/PrInput'
import LearningInput from './components/input/LearningInput'
import FeatureInput from './components/input/FeatureInput'
import BoxInput from './components/input/BoxInput'
import ViolinInput from './components/input/ViolinInput'
import ErrorBarInput from './components/input/ErrorBarInput'
import StackedBarInput from './components/input/StackedBarInput'
import ComboChartInput from './components/input/ComboChartInput'
import PieChartInput from './components/input/PieChartInput'
import FigureEditor from './components/editor/FigureEditor'
import HeatmapEditor from './components/editor/HeatmapEditor'
import BarChartEditor from './components/editor/BarChartEditor'
import LinePlotEditor from './components/editor/LinePlotEditor'
import ScatterEditor from './components/editor/ScatterEditor'
import HistogramEditor from './components/editor/HistogramEditor'
import RocEditor from './components/editor/RocEditor'
import PrEditor from './components/editor/PrEditor'
import LearningEditor from './components/editor/LearningEditor'
import FeatureEditor from './components/editor/FeatureEditor'
import BoxEditor from './components/editor/BoxEditor'
import ViolinEditor from './components/editor/ViolinEditor'
import ErrorBarEditor from './components/editor/ErrorBarEditor'
import StackedBarEditor from './components/editor/StackedBarEditor'
import ComboChartEditor from './components/editor/ComboChartEditor'
import PieChartEditor from './components/editor/PieChartEditor'
import FigurePreview from './components/preview/FigurePreview'
import LatexFigureExport from './components/preview/LatexFigureExport'
import FigureList from './components/common/FigureList'
import ComposeSettings from './components/compose/ComposeSettings'
import ComposeCanvas from './components/compose/ComposeCanvas'
import ImportModal from './components/import/ImportModal'

// ------------------------------------------------------------------ defaults
const DEFAULT_CM: ConfusionMatrixState = {
  id: 'fig-1',
  type: 'confusion_matrix',
  data: [[45, 3], [2, 50]],
  params: {
    title: '', fontsize: 12, figsize_cm: [12, 10], dpi: 150,
    colormap: 'Blues', normalize: false, labels: ['Class 0', 'Class 1'],
    show_values: true, xlabel: 'Predicted Label', ylabel: 'True Label',
    xlabel_top: true, linewidths: 0.1, linecolor: 'black',
    annot_fontsize: 11, tick_fontsize: 11, cell_size_cm: null,
  },
}

const DEFAULT_HEATMAP: HeatmapState = {
  id: 'fig-1',
  type: 'heatmap',
  data: [[1.00, 0.80, 0.30], [0.80, 1.00, 0.50], [0.30, 0.50, 1.00]],
  params: {
    title: '', fontsize: 12, figsize_cm: [12, 10], dpi: 150,
    mode: 'heatmap', colormap: 'Blues',
    labels_x: ['A', 'B', 'C'], labels_y: ['A', 'B', 'C'],
    show_values: true, fmt: '.2f', vmin: null, vmax: null, mask_upper: false,
    xlabel: '', ylabel: '', linewidths: 0.5, linecolor: 'white',
    annot_fontsize: 10, tick_fontsize: 10, cell_size_cm: null,
  },
}

const DEFAULT_BAR: BarChartState = {
  id: 'fig-1',
  type: 'bar_chart',
  data: { labels: ['A', 'B', 'C', 'D'], values: [[4.2, 7.8, 3.1, 6.5], [3.5, 6.1, 4.8, 5.2]] },
  params: {
    title: '', fontsize: 12, figsize_cm: [14, 10], dpi: 150,
    xlabel: '', ylabel: '', colors: ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF'],
    orientation: 'vertical', legend: ['系列1', '系列2'], show_values: false, tick_fontsize: 10,
    bar_width: 0.8, show_grid: false, grid_linestyle: '--',
    legend_loc: 'best', xlim: null, ylim: null, xtick_step: null, ytick_step: null,
    threshold_line: null, threshold_line_color: '#EF4444', threshold_line_style: '--',
    bar_colors: null, merge_threshold: null, merge_dir: 'below', merge_label: 'その他',
  },
}

const DEFAULT_LINE: LinePlotState = {
  id: 'fig-1',
  type: 'line_plot',
  data: { x: [0, 1, 2, 3, 4, 5], y: [[0.1, 0.4, 0.9, 1.6, 2.5, 3.6], [0.5, 1.2, 1.8, 2.4, 3.1, 3.8]] },
  params: {
    title: '', fontsize: 12, figsize_cm: [14, 10], dpi: 150,
    xlabel: '', ylabel: '',
    colors: ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF'],
    legend: ['系列1', '系列2'], markers: ['o', 's', '^', 'D', 'v', 'P'],
    linewidth: 1.5, tick_fontsize: 10,
    show_grid: false, grid_linestyle: '--',
    legend_loc: 'best', xlim: null, ylim: null, xtick_step: null, ytick_step: null,
    log_scale_x: false, log_scale_y: false,
  },
}

const DEFAULT_SCATTER: ScatterState = {
  id: 'fig-1',
  type: 'scatter_plot',
  data: {
    series: [
      { x: [1,2,3,4,5,6,7,8], y: [1.2,2.5,2.8,4.1,4.9,6.2,6.8,8.3] },
      { x: [1,2,3,4,5,6,7,8], y: [2.1,3.5,4.2,5.0,5.8,7.1,7.5,9.0] },
    ],
  },
  params: {
    title: '', fontsize: 12, figsize_cm: [12, 10], dpi: 150,
    xlabel: '', ylabel: '',
    colors: ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF'],
    legend: ['Group A', 'Group B'], legend_loc: 'best',
    marker_size: 40, alpha: 0.7, tick_fontsize: 10,
    show_grid: false, grid_linestyle: '--',
    xlim: null, ylim: null, xtick_step: null, ytick_step: null,
  },
}

const DEFAULT_ROC: RocState = {
  id: 'fig-1',
  type: 'roc_curve',
  data: {
    fpr: [[0,0.05,0.10,0.20,0.30,0.50,1.0], [0,0.10,0.20,0.40,0.60,0.80,1.0]],
    tpr: [[0,0.40,0.70,0.85,0.90,0.95,1.0], [0,0.30,0.60,0.75,0.85,0.92,1.0]],
    auc: [0.912, 0.847],
  },
  params: {
    title: '', fontsize: 12, figsize_cm: [12, 10], dpi: 150,
    xlabel: 'False Positive Rate', ylabel: 'True Positive Rate',
    colors: ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF'],
    legend: ['Class A', 'Class B'],
    linewidth: 1.5, tick_fontsize: 10,
    show_diagonal: true, diagonal_style: '--', diagonal_color: '#9CA3AF',
    show_auc_in_legend: true,
    legend_loc: 'lower right',
    show_grid: true, grid_linestyle: '--',
    xlim: null, ylim: null,
  },
}

const DEFAULT_PR: PrState = {
  id: 'fig-1',
  type: 'pr_curve',
  data: {
    precision: [[1.0,0.95,0.88,0.80,0.70,0.50], [1.0,0.90,0.80,0.70,0.60,0.40]],
    recall:    [[0.0,0.10,0.30,0.50,0.70,1.00], [0.0,0.15,0.35,0.55,0.75,1.00]],
    ap: [0.876, 0.742],
  },
  params: {
    title: '', fontsize: 12, figsize_cm: [12, 10], dpi: 150,
    xlabel: 'Recall', ylabel: 'Precision',
    colors: ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF'],
    legend: ['Class A', 'Class B'],
    linewidth: 1.5, tick_fontsize: 10,
    show_ap_in_legend: true,
    legend_loc: 'upper right',
    show_grid: true, grid_linestyle: '--',
    xlim: null, ylim: null,
  },
}

const DEFAULT_LEARNING: LearningState = {
  id: 'fig-1',
  type: 'learning_curve',
  data: {
    epochs: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    series: [
      { label: 'Train loss',      values: [0.80,0.42,0.25,0.18,0.14,0.11,0.09,0.08,0.07,0.07,0.06,0.06,0.05,0.05,0.05], axis: 'left'  },
      { label: 'Val accuracy',    values: [0.68,0.75,0.79,0.82,0.84,0.85,0.86,0.87,0.87,0.88,0.88,0.89,0.89,0.89,0.90], axis: 'right' },
    ],
  },
  params: {
    title: '', fontsize: 12, figsize_cm: [14, 10], dpi: 150,
    xlabel: 'Epoch', ylabel_left: 'Loss', ylabel_right: 'Accuracy',
    colors: ['#EF4444', '#3B82F6', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF'],
    markers: ['none', 'none', '^', 'D', 'v', 'P'],
    linewidth: 1.5, tick_fontsize: 10,
    legend_loc: 'best',
    show_grid: true, grid_linestyle: '--',
    xlim: null, ylim_left: null, ylim_right: null, xtick_step: null,
  },
}

const DEFAULT_FEATURE: FeatureState = {
  id: 'fig-1',
  type: 'feature_importance',
  data: {
    features:    ['Feature A','Feature B','Feature C','Feature D','Feature E','Feature F','Feature G','Feature H'],
    importances: [0.25, 0.18, 0.15, 0.12, 0.10, 0.08, 0.07, 0.05],
  },
  params: {
    title: '', fontsize: 12, figsize_cm: [14, 10], dpi: 150,
    xlabel: 'Importance', ylabel: '',
    color: '#6C63FF',
    top_n: null, sort: true, show_values: true,
    orientation: 'horizontal',
    bar_width: 0.7, tick_fontsize: 10,
    show_grid: true, grid_linestyle: '--',
    xlim: null, ylim: null,
  },
}

const DEFAULT_HISTOGRAM: HistogramState = {
  id: 'fig-1',
  type: 'histogram',
  data: [2.1,2.5,2.8,3.0,3.2,3.3,3.5,3.7,3.8,4.0,4.1,4.2,4.4,4.5,4.6,4.8,5.0,5.1,5.3,5.5],
  params: {
    title: '', fontsize: 12, figsize_cm: [12, 10], dpi: 150,
    xlabel: '', ylabel: '', bins: 20, color: '#6C63FF',
    density: false, tick_fontsize: 10,
    show_grid: false, grid_linestyle: '--',
    ylim: null, ytick_step: null,
  },
}

const DEFAULT_BOX: BoxState = {
  id: 'fig-1',
  type: 'box_plot',
  data: {
    groups: [
      [4.2, 4.8, 5.1, 3.9, 5.5, 4.6, 4.1, 5.3, 4.7, 5.0],
      [6.1, 6.8, 7.2, 5.9, 7.5, 6.4, 6.2, 7.0, 6.7, 7.1],
      [3.1, 3.5, 2.8, 3.9, 4.0, 3.2, 2.9, 3.7, 3.4, 3.8],
    ],
  },
  params: {
    title: '', fontsize: 12, figsize_cm: [12, 10], dpi: 150,
    xlabel: '', ylabel: '',
    labels: ['Group A', 'Group B', 'Group C'],
    colors: ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF'],
    tick_fontsize: 10, orientation: 'vertical',
    notch: false, showfliers: true, show_mean: false, show_median: true, show_points: false,
    show_grid: false, grid_linestyle: '--',
    xlim: null, ylim: null, brackets: [],
  },
}

const DEFAULT_VIOLIN: ViolinState = {
  id: 'fig-1',
  type: 'violin_plot',
  data: {
    groups: [
      [4.2, 4.8, 5.1, 3.9, 5.5, 4.6, 4.1, 5.3, 4.7, 5.0, 4.4, 4.9],
      [6.1, 6.8, 7.2, 5.9, 7.5, 6.4, 6.2, 7.0, 6.7, 7.1, 6.5, 6.9],
      [3.1, 3.5, 2.8, 3.9, 4.0, 3.2, 2.9, 3.7, 3.4, 3.8, 3.0, 3.6],
    ],
  },
  params: {
    title: '', fontsize: 12, figsize_cm: [12, 10], dpi: 150,
    xlabel: '', ylabel: '',
    labels: ['Group A', 'Group B', 'Group C'],
    colors: ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF'],
    tick_fontsize: 10, orientation: 'vertical',
    inner: 'box', alpha: 0.7, edgecolor: 'black', show_mean: false, show_median: true, show_points: false,
    show_grid: false, grid_linestyle: '--',
    xlim: null, ylim: null, brackets: [],
  },
}

const DEFAULT_ERRORBAR: ErrorBarState = {
  id: 'fig-1',
  type: 'error_bar',
  data: {
    labels: ['条件A', '条件B', '条件C', '条件D'],
    series: [
      { name: 'Method 1', means: [4.2, 6.1, 3.8, 5.5], errors: [0.4, 0.5, 0.3, 0.6] },
      { name: 'Method 2', means: [3.5, 5.4, 4.2, 4.9], errors: [0.3, 0.6, 0.4, 0.5] },
    ],
  },
  params: {
    title: '', fontsize: 12, figsize_cm: [14, 10], dpi: 150,
    xlabel: '', ylabel: '',
    colors: ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF'],
    legend: ['Method 1', 'Method 2'], legend_loc: 'best',
    error_color: '#374151', capsize: 5, bar_width: 0.6,
    tick_fontsize: 10, orientation: 'vertical', show_values: false,
    show_grid: false, grid_linestyle: '--',
    xlim: null, ylim: null, ytick_step: null, brackets: [],
  },
}

const DEFAULT_STACKED_BAR: StackedBarState = {
  id: 'fig-1',
  type: 'stacked_bar',
  data: { labels: ['A', 'B', 'C', 'D'], values: [[4.2, 7.8, 3.1, 6.5], [3.5, 6.1, 4.8, 5.2], [2.0, 3.0, 1.5, 2.8]] },
  params: {
    title: '', fontsize: 12, figsize_cm: [14, 10], dpi: 150,
    xlabel: '', ylabel: '',
    colors: ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF'],
    orientation: 'vertical', legend: ['系列1', '系列2', '系列3'],
    tick_fontsize: 10, bar_width: 0.8, normalize: false, show_values: false,
    show_grid: false, grid_linestyle: '--', legend_loc: 'best',
    xlim: null, ylim: null,
  },
}

const DEFAULT_COMBO: ComboState = {
  id: 'fig-1',
  type: 'combo_chart',
  data: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    bar_series:  [{ name: '売上（万円）', values: [120, 180, 150, 220] }],
    line_series: [{ name: '成長率（%）', values: [10, 50, -17, 47] }],
  },
  params: {
    title: '', fontsize: 12, figsize_cm: [14, 10], dpi: 150,
    xlabel: '', ylabel_left: '', ylabel_right: '',
    colors_bar:  ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347'],
    colors_line: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'],
    bar_width: 0.6, linewidth: 2.0,
    markers: ['o', 's', '^', 'D'],
    tick_fontsize: 10,
    show_grid: false, grid_linestyle: '--', legend_loc: 'best',
    xlim: null, ylim_left: null, ylim_right: null,
  },
}

const DEFAULT_PIE: PieState = {
  id: 'fig-1',
  type: 'pie_chart',
  data: { labels: ['カテゴリA', 'カテゴリB', 'カテゴリC', 'カテゴリD'], values: [35, 28, 22, 15] },
  params: {
    title: '', fontsize: 12, figsize_cm: [12, 10], dpi: 150,
    colors: ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF'],
    startangle: 90, autopct: true, pctdistance: 0.8,
    shadow: false, donut: 0.0, legend_loc: 'none',
    explode: [], tick_fontsize: 10,
  },
}

const FIGURE_TYPES: { type: FigureType; label: string }[] = [
  // 棒系
  { type: 'bar_chart',          label: '棒グラフ' },
  { type: 'stacked_bar',        label: '積み上げ棒' },
  { type: 'combo_chart',        label: '棒+折れ線' },
  // 線/点/円系
  { type: 'line_plot',          label: '折れ線' },
  { type: 'scatter_plot',       label: '散布図' },
  { type: 'pie_chart',          label: '円グラフ' },
  // 分布系
  { type: 'histogram',          label: 'ヒストグラム' },
  { type: 'box_plot',           label: '箱ひげ' },
  { type: 'violin_plot',        label: 'バイオリン' },
  { type: 'error_bar',          label: 'エラーバー' },
  // 行列系
  { type: 'heatmap',            label: 'ヒートマップ' },
  { type: 'confusion_matrix',   label: '混合行列' },
  // ML評価系
  { type: 'roc_curve',          label: 'ROC曲線' },
  { type: 'pr_curve',           label: 'PR曲線' },
  { type: 'learning_curve',     label: '学習曲線' },
  { type: 'feature_importance', label: '特徴量重要度' },
]

const DEFAULT_BY_TYPE: Record<FigureType, FigureState> = {
  confusion_matrix:   DEFAULT_CM,
  heatmap:            DEFAULT_HEATMAP,
  bar_chart:          DEFAULT_BAR,
  line_plot:          DEFAULT_LINE,
  scatter_plot:       DEFAULT_SCATTER,
  histogram:          DEFAULT_HISTOGRAM,
  roc_curve:          DEFAULT_ROC,
  pr_curve:           DEFAULT_PR,
  learning_curve:     DEFAULT_LEARNING,
  feature_importance: DEFAULT_FEATURE,
  box_plot:           DEFAULT_BOX,
  violin_plot:        DEFAULT_VIOLIN,
  error_bar:          DEFAULT_ERRORBAR,
  stacked_bar:        DEFAULT_STACKED_BAR,
  combo_chart:        DEFAULT_COMBO,
  pie_chart:          DEFAULT_PIE,
}

const CLEAR_DATA_BY_TYPE: Partial<Record<FigureType, FigureState['data']>> = {
  confusion_matrix:   [[]] as number[][],
  heatmap:            [[]] as number[][],
  bar_chart:          { labels: [], values: [[]] },
  line_plot:          { x: [], y: [[]] },
  scatter_plot:       { series: [{ x: [], y: [] }] },
  histogram:          [],
  roc_curve:          { fpr: [[]], tpr: [[]], auc: [0] },
  pr_curve:           { precision: [[]], recall: [[]], ap: [0] },
  learning_curve:     { epochs: [], series: [] },
  feature_importance: { features: [], importances: [] },
  box_plot:           { groups: [[]] },
  violin_plot:        { groups: [[]] },
  error_bar:          { labels: [], series: [{ name: 'Series 1', means: [], errors: [] }] },
  stacked_bar:        { labels: [], values: [[]] },
  combo_chart:        { labels: [], bar_series: [{ name: 'Series 1', values: [] }], line_series: [] },
  pie_chart:          { labels: [], values: [] },
}

const genId = () => `fig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

const slugify = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

type AppMode = 'edit' | 'compose'

// ------------------------------------------------------------------ App
export default function ChartModule() {
  const {
    figures, selectedId, layout, initialized,
    addFigure, updateFigure, removeFigure,
    setSelectedId, setLayout, reorderFigures, initialize,
  } = useFigureStore()

  const [appMode, setAppMode]           = useState<AppMode>('edit')
  // Narrow viewports only: the left (data/params) and right (preview) panels
  // don't fit side by side, so below the `md` breakpoint only one is shown at
  // a time via this tab. Unused at `md:` and above, where both panels render
  // in their normal two-column layout regardless of this value.
  const [mobileView, setMobileView]     = useState<'input' | 'preview'>('preview')
  const [openData, setOpenData]         = useState(true)
  const [openParams, setOpenParams]     = useState(true)
  const [previews, setPreviews]         = useState<Record<string, string>>({})
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [exporting, setExporting]       = useState(false)
  const [composeFormat, setComposeFormat] = useState<'png' | 'svg' | 'pdf'>('png')
  const [downloadFormat, setDownloadFormat] = useState<OutputFormat>('png')
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  const selectedFigure = figures.find((f) => f.id === selectedId) ?? figures[0] ?? null

  // ----------------------------------------------------- init
  useEffect(() => {
    initialize().then(() => {
      const { figures: figs } = useFigureStore.getState()
      if (!figs.length) {
        const fig = { ...DEFAULT_CM, id: 'fig-1' }
        addFigure(fig)
        setSelectedId(fig.id)
      }
    })
  }, [])

  // Restore previews from cache
  useEffect(() => {
    if (!initialized) return
    const cached: Record<string, string> = {}
    figures.forEach((f) => {
      const b64 = getPreview(f.id)
      if (b64) cached[f.id] = b64
    })
    if (Object.keys(cached).length) {
      setPreviews((prev) => ({ ...prev, ...cached }))
    }
  }, [initialized, figures.map((f) => f.id).join(',')])

  // ----------------------------------------------------- render on fig change
  useEffect(() => {
    if (!selectedFigure) return
    setLoading(true)
    setError(null)
    debouncedRender(
      selectedFigure,
      (b64) => {
        setPreviews((prev) => ({ ...prev, [selectedFigure.id]: b64 }))
        savePreview(selectedFigure.id, b64).catch(() => {})
        setLoading(false)
      },
      (msg) => { setError(msg); setLoading(false) },
    )
  }, [selectedFigure?.data, selectedFigure?.params])

  const prevSelectedId = useRef<string | null>(null)
  useEffect(() => {
    if (!selectedFigure) return
    if (selectedFigure.id === prevSelectedId.current) return
    prevSelectedId.current = selectedFigure.id
    if (previews[selectedFigure.id]) return
    setLoading(true)
    setError(null)
    renderAndCache(selectedFigure)
      .then((b64) => {
        setPreviews((prev) => ({ ...prev, [selectedFigure.id]: b64 }))
        savePreview(selectedFigure.id, b64).catch(() => {})
        setError(null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedFigure?.id])

  useEffect(() => {
    if (appMode !== 'compose') return
    figures.forEach((fig) => {
      if (previews[fig.id]) return
      renderAndCache(fig)
        .then((b64) => {
          setPreviews((prev) => ({ ...prev, [fig.id]: b64 }))
          savePreview(fig.id, b64).catch(() => {})
        })
        .catch(() => {})
    })
  }, [appMode])

  // ----------------------------------------------------- figure management
  const handleAddFigure = useCallback((type: FigureType) => {
    const fig = { ...DEFAULT_BY_TYPE[type], id: genId() }
    addFigure(fig)
    setSelectedId(fig.id)
  }, [addFigure, setSelectedId])

  const handleDeleteFigure = useCallback((id: string) => {
    removeFigure(id)
  }, [removeFigure])

  const handleDuplicateFigure = useCallback((id: string) => {
    const fig = figures.find((f) => f.id === id)
    if (!fig) return
    const newFig = { ...fig, id: genId() }
    addFigure(newFig)
    setSelectedId(newFig.id)
  }, [figures, addFigure, setSelectedId])

  const handleOcrApply = useCallback((
    type: FigureType,
    dataPatch: unknown,
    paramsPatch: Record<string, unknown>,
  ) => {
    const base = { ...DEFAULT_BY_TYPE[type], id: genId() }
    const patched = {
      ...base,
      data: dataPatch ?? base.data,
      params: { ...base.params, ...paramsPatch },
    } as FigureState
    addFigure(patched)
    setSelectedId(patched.id)
  }, [addFigure, setSelectedId])

  // ----------------------------------------------------- type switch
  const handleTypeSwitch = useCallback((type: FigureType) => {
    if (!selectedFigure || selectedFigure.type === type) return
    updateFigure(selectedFigure.id, () => ({ ...DEFAULT_BY_TYPE[type], id: selectedFigure.id }))
    setPreviews((prev) => { const n = { ...prev }; delete n[selectedFigure.id]; return n })
  }, [selectedFigure, updateFigure])

  // ----------------------------------------------------- generic param handler factory
  const useParamsHandler = <T,>(type: FigureType) =>
    useCallback((patch: Partial<T>) => {
      if (!selectedFigure || selectedFigure.type !== type) return
      updateFigure(selectedFigure.id, (f) => ({
        ...f, params: { ...(f as unknown as { params: T }).params, ...patch },
      } as unknown as FigureState))
    }, [selectedFigure, updateFigure])

  const handleCMParamsChange       = useParamsHandler<ConfusionMatrixParams>('confusion_matrix')
  const handleHMParamsChange       = useParamsHandler<HeatmapParams>('heatmap')
  const handleBarParamsChange      = useParamsHandler<BarChartParams>('bar_chart')
  const handleLineParamsChange     = useParamsHandler<LinePlotParams>('line_plot')
  const handleScatterParamsChange  = useParamsHandler<ScatterParams>('scatter_plot')
  const handleHistParamsChange     = useParamsHandler<HistogramParams>('histogram')
  const handleRocParamsChange      = useParamsHandler<RocParams>('roc_curve')
  const handlePrParamsChange       = useParamsHandler<PrParams>('pr_curve')
  const handleLearningParamsChange = useParamsHandler<LearningParams>('learning_curve')
  const handleFeatureParamsChange  = useParamsHandler<FeatureParams>('feature_importance')
  const handleBoxParamsChange      = useParamsHandler<BoxParams>('box_plot')
  const handleViolinParamsChange   = useParamsHandler<ViolinParams>('violin_plot')
  const handleErrorBarParamsChange  = useParamsHandler<ErrorBarParams>('error_bar')
  const handleStackedBarParamsChange = useParamsHandler<StackedBarParams>('stacked_bar')
  const handleComboParamsChange      = useParamsHandler<ComboParams>('combo_chart')
  const handlePieParamsChange        = useParamsHandler<PieParams>('pie_chart')

  // ----------------------------------------------------- data handlers
  const handleCMDataChange = useCallback((data: number[][]) => {
    if (!selectedFigure || selectedFigure.type !== 'confusion_matrix') return
    const fig = selectedFigure as ConfusionMatrixState
    const newLabels = Array.from({ length: data.length }, (_, i) => fig.params.labels[i] ?? `Class ${i}`)
    updateFigure(fig.id, (f) => ({
      ...f, data,
      params: { ...(f as ConfusionMatrixState).params, labels: newLabels },
    } as ConfusionMatrixState))
  }, [selectedFigure, updateFigure])

  const handleHMDataChange = useCallback((
    data: number[][], extractedLabels?: { x: string[], y: string[] },
  ) => {
    if (!selectedFigure || selectedFigure.type !== 'heatmap') return
    const fig = selectedFigure as HeatmapState
    const labelsX = extractedLabels?.x ?? Array.from({ length: data[0]?.length ?? 0 }, (_, i) => fig.params.labels_x[i] ?? `Col ${i}`)
    const labelsY = extractedLabels?.y ?? Array.from({ length: data.length }, (_, i) => fig.params.labels_y[i] ?? `Row ${i}`)
    updateFigure(fig.id, (f) => ({
      ...f, data,
      params: { ...(f as HeatmapState).params, labels_x: labelsX, labels_y: labelsY },
    } as HeatmapState))
  }, [selectedFigure, updateFigure])

  const handleBarDataChange = useCallback((data: BarChartState['data'], seriesLabels?: string[]) => {
    if (!selectedFigure || selectedFigure.type !== 'bar_chart') return
    updateFigure(selectedFigure.id, (f) => {
      const next = { ...f, data } as BarChartState
      if (seriesLabels) next.params = { ...next.params, legend: seriesLabels }
      return next
    })
  }, [selectedFigure, updateFigure])

  const handleLineDataChange = useCallback((data: LinePlotState['data'], seriesLabels?: string[]) => {
    if (!selectedFigure || selectedFigure.type !== 'line_plot') return
    updateFigure(selectedFigure.id, (f) => {
      const next = { ...f, data } as LinePlotState
      if (seriesLabels) next.params = { ...next.params, legend: seriesLabels }
      return next
    })
  }, [selectedFigure, updateFigure])

  const handleScatterDataChange = useCallback((data: ScatterState['data'], seriesLabels?: string[]) => {
    if (!selectedFigure || selectedFigure.type !== 'scatter_plot') return
    updateFigure(selectedFigure.id, (f) => {
      const next = { ...f, data } as ScatterState
      if (seriesLabels) next.params = { ...next.params, legend: seriesLabels }
      return next
    })
  }, [selectedFigure, updateFigure])

  const handleRocDataChange = useCallback((data: RocState['data'], seriesLabels?: string[]) => {
    if (!selectedFigure || selectedFigure.type !== 'roc_curve') return
    updateFigure(selectedFigure.id, (f) => {
      const next = { ...f, data } as RocState
      if (seriesLabels) next.params = { ...next.params, legend: seriesLabels }
      return next
    })
  }, [selectedFigure, updateFigure])

  const handlePrDataChange = useCallback((data: PrState['data'], seriesLabels?: string[]) => {
    if (!selectedFigure || selectedFigure.type !== 'pr_curve') return
    updateFigure(selectedFigure.id, (f) => {
      const next = { ...f, data } as PrState
      if (seriesLabels) next.params = { ...next.params, legend: seriesLabels }
      return next
    })
  }, [selectedFigure, updateFigure])

  const handleLearningDataChange = useCallback((data: LearningState['data']) => {
    if (!selectedFigure || selectedFigure.type !== 'learning_curve') return
    updateFigure(selectedFigure.id, (f) => ({ ...f, data } as LearningState))
  }, [selectedFigure, updateFigure])

  const handleFeatureDataChange = useCallback((data: FeatureState['data']) => {
    if (!selectedFigure || selectedFigure.type !== 'feature_importance') return
    updateFigure(selectedFigure.id, (f) => ({ ...f, data } as FeatureState))
  }, [selectedFigure, updateFigure])

  const handleHistDataChange = useCallback((data: number[]) => {
    if (!selectedFigure || selectedFigure.type !== 'histogram') return
    updateFigure(selectedFigure.id, (f) => ({ ...f, data } as HistogramState))
  }, [selectedFigure, updateFigure])

  const handleBoxDataChange = useCallback((data: BoxState['data'], labels: string[]) => {
    if (!selectedFigure || selectedFigure.type !== 'box_plot') return
    updateFigure(selectedFigure.id, (f) => ({
      ...f, data,
      params: { ...(f as BoxState).params, labels },
    } as BoxState))
  }, [selectedFigure, updateFigure])

  const handleViolinDataChange = useCallback((data: ViolinState['data'], labels: string[]) => {
    if (!selectedFigure || selectedFigure.type !== 'violin_plot') return
    updateFigure(selectedFigure.id, (f) => ({
      ...f, data,
      params: { ...(f as ViolinState).params, labels },
    } as ViolinState))
  }, [selectedFigure, updateFigure])

  const handleErrorBarDataChange = useCallback((data: ErrorBarState['data']) => {
    if (!selectedFigure || selectedFigure.type !== 'error_bar') return
    updateFigure(selectedFigure.id, (f) => ({ ...f, data } as ErrorBarState))
  }, [selectedFigure, updateFigure])

  const handleStackedBarDataChange = useCallback((data: StackedBarState['data'], seriesLabels?: string[]) => {
    if (!selectedFigure || selectedFigure.type !== 'stacked_bar') return
    updateFigure(selectedFigure.id, (f) => {
      const next = { ...f, data } as StackedBarState
      if (seriesLabels) next.params = { ...next.params, legend: seriesLabels }
      return next
    })
  }, [selectedFigure, updateFigure])

  const handleComboDataChange = useCallback((data: ComboState['data']) => {
    if (!selectedFigure || selectedFigure.type !== 'combo_chart') return
    updateFigure(selectedFigure.id, (f) => ({ ...f, data } as ComboState))
  }, [selectedFigure, updateFigure])

  const handlePieDataChange = useCallback((data: PieState['data']) => {
    if (!selectedFigure || selectedFigure.type !== 'pie_chart') return
    updateFigure(selectedFigure.id, (f) => ({ ...f, data } as PieState))
  }, [selectedFigure, updateFigure])

  const handleClearData = useCallback(() => {
    if (!selectedFigure) return
    const cleared = CLEAR_DATA_BY_TYPE[selectedFigure.type]
    if (!cleared) return
    updateFigure(selectedFigure.id, (f) => ({ ...f, data: cleared } as FigureState))
  }, [selectedFigure, updateFigure])

  // ----------------------------------------------------- reset handlers
  const useReset = (def: FigureState) =>
    useCallback(() => {
      if (!selectedFigure) return
      updateFigure(selectedFigure.id, (f) => ({ ...f, params: def.params } as unknown as FigureState))
    }, [selectedFigure, updateFigure])

  const handleCMReset       = useReset(DEFAULT_CM)
  const handleHMReset       = useReset(DEFAULT_HEATMAP)
  const handleBarReset      = useReset(DEFAULT_BAR)
  const handleLineReset     = useReset(DEFAULT_LINE)
  const handleScatterReset  = useReset(DEFAULT_SCATTER)
  const handleHistReset     = useReset(DEFAULT_HISTOGRAM)
  const handleRocReset      = useReset(DEFAULT_ROC)
  const handlePrReset       = useReset(DEFAULT_PR)
  const handleLearningReset = useReset(DEFAULT_LEARNING)
  const handleFeatureReset  = useReset(DEFAULT_FEATURE)
  const handleBoxReset      = useReset(DEFAULT_BOX)
  const handleViolinReset   = useReset(DEFAULT_VIOLIN)
  const handleErrorBarReset    = useReset(DEFAULT_ERRORBAR)
  const handleStackedBarReset  = useReset(DEFAULT_STACKED_BAR)
  const handleComboReset       = useReset(DEFAULT_COMBO)
  const handlePieReset         = useReset(DEFAULT_PIE)

  // ----------------------------------------------------- download
  const handleDownload = async () => {
    if (!selectedFigure) return
    if (downloadFormat === 'png') {
      const b64 = previews[selectedFigure.id]
      if (!b64) return
      const a = document.createElement('a')
      a.href = `data:image/png;base64,${b64}`
      a.download = `${selectedFigure.params.title || 'figure'}.png`
      a.click()
    } else {
      setDownloadLoading(true)
      try {
        const b64 = await renderForDownload(selectedFigure, downloadFormat)
        const mimeTypes: Record<string, string> = {
          svg: 'image/svg+xml', pdf: 'application/pdf', eps: 'application/postscript',
        }
        const a = document.createElement('a')
        a.href = `data:${mimeTypes[downloadFormat]};base64,${b64}`
        a.download = `${selectedFigure.params.title || 'figure'}.${downloadFormat}`
        a.click()
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setDownloadLoading(false)
      }
    }
  }

  // ----------------------------------------------------- send to Figure Converter
  const handleSendToFigureConverter = useCallback(async () => {
    if (!selectedFigure) return
    const b64 = previews[selectedFigure.id]
    if (!b64) return
    const bytes = atob(b64)
    const arr = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    const blob = new Blob([arr], { type: 'image/png' })
    await sendToClipboard({ type: 'figure', format: 'png', blob, sourceModule: 'chart' })
    requestTab('figure')
  }, [selectedFigure, previews])

  // ----------------------------------------------------- compose export
  const handleComposeExport = async () => {
    if (figures.length === 0) return
    setExporting(true)
    try {
      const b64 = await composeAndExport(figures, layout, composeFormat)
      const mimeTypes = { png: 'image/png', svg: 'image/svg+xml', pdf: 'application/pdf' }
      const a = document.createElement('a')
      a.href = `data:${mimeTypes[composeFormat]};base64,${b64}`
      a.download = `compose.${composeFormat}`
      a.click()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setExporting(false)
    }
  }

  // ----------------------------------------------------- loading state
  if (!initialized) {
    return (
      <div className="chart-module min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: '#6C63FF' }} />
          <span className="text-sm text-gray-400">読み込み中...</span>
        </div>
      </div>
    )
  }

  const showFigureTypeNav = appMode === 'edit' && Boolean(selectedFigure)

  return (
    <div className="chart-module min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Action bar (module title removed — the app shell's own header already
          shows "LaTeX Research Toolkit" + the active tab). White background,
          same as the app shell's sticky tab bar directly above and the figure
          -type nav directly below — the three stack into one continuous
          toolbar (figure-modification's flat white bar + hairline border
          style) instead of separately-bordered bands. Only the bottom-most
          bar of the stack (this one, when the figure-type nav below isn't
          shown) carries the border/shadow. APIキー moved to the app shell's
          shared header (accessible from every tab, not just Chart). */}
      <header
        className="px-4 flex items-center gap-3 overflow-x-auto"
        style={{
          height: 52, position: 'sticky', top: 92, zIndex: 25, background: 'white',
          ...(showFigureTypeNav ? {} : { borderBottom: '1px solid #E5E7EB', boxShadow: 'var(--shadow-sm)' }),
        }}
      >
        <FigureList
          figures={figures}
          selectedId={selectedFigure?.id ?? null}
          onSelect={setSelectedId}
          onDelete={handleDeleteFigure}
          onAdd={handleAddFigure}
          onDuplicate={handleDuplicateFigure}
        />

        <div className="w-px self-stretch bg-gray-200 mx-1 shrink-0" />

        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold shrink-0 transition-colors text-sm"
          style={{ background: '#6C63FF', color: 'white', boxShadow: '0 2px 8px rgba(108,99,255,0.35)' }}
        >
          <span style={{ fontSize: 15 }}>🖼️</span>
          図を読み込む
        </button>

        <div className="flex rounded-xl overflow-hidden shrink-0" style={{ border: '1px solid #E5E7EB', boxShadow: 'var(--shadow-sm)' }}>
          {(['edit', 'compose'] as AppMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setAppMode(mode)}
              className="px-5 py-2 text-sm font-bold transition-all"
              style={{
                background: appMode === mode ? '#6C63FF' : 'white',
                color: appMode === mode ? 'white' : '#6B7280',
                minWidth: 72,
              }}
            >
              {mode === 'edit' ? '編集' : '構成'}
            </button>
          ))}
        </div>
      </header>

      {/* 全幅図種タブバー — bottom-most bar of the stack, so it alone carries
          the border/shadow (see header comment above). */}
      {showFigureTypeNav && (
        <nav
          className="flex-shrink-0 flex overflow-x-auto"
          style={{
            borderBottom: '1px solid #E5E7EB', boxShadow: 'var(--shadow-sm)', scrollbarWidth: 'none',
            position: 'sticky', top: 144, zIndex: 24, background: 'white',
          }}
        >
          {FIGURE_TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => handleTypeSwitch(t.type)}
              className="px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0"
              style={{
                borderBottomColor: selectedFigure.type === t.type ? '#6C63FF' : 'transparent',
                color: selectedFigure.type === t.type ? '#6C63FF' : '#6B7280',
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}

      {/* スマホ幅（<md）のみ表示。左右パネルが並ばないため、代わりにどちらか
          一方をこのタブで切り替える。md:以上ではこのタブ自体を表示せず、
          両パネルとも常に表示する通常の2カラムレイアウトに戻る。 */}
      <div className="flex md:hidden border-b border-gray-200 bg-white shrink-0">
        {(['input', 'preview'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setMobileView(v)}
            className="flex-1 py-2.5 text-sm font-bold transition-colors"
            style={{
              color: mobileView === v ? '#6C63FF' : '#6B7280',
              borderBottom: mobileView === v ? '2px solid #6C63FF' : '2px solid transparent',
            }}
          >
            {v === 'input' ? (appMode === 'edit' ? 'データ入力' : '構成設定') : 'プレビュー'}
          </button>
        ))}
      </div>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* 左パネル */}
        <div
          className={`w-full md:w-80 flex-shrink-0 bg-white flex-col ${mobileView === 'input' ? 'flex' : 'hidden'} md:flex`}
          style={{ borderRight: '1px solid #E5E7EB', boxShadow: '2px 0 8px rgba(0,0,0,.04)', overflow: 'hidden' }}
        >
          {appMode === 'edit' ? (
            <>
              {selectedFigure && (
                <div className="flex-1 overflow-y-auto">
                    <section className="border-b border-gray-100">
                      <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                        onClick={() => setOpenData(v => !v)}
                      >
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <span style={{ fontSize: 9, color: '#9CA3AF', transition: 'transform .2s', display: 'inline-block', transform: openData ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                          データ入力
                        </p>
                        {openData && CLEAR_DATA_BY_TYPE[selectedFigure.type] !== undefined && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleClearData() }}
                            className="text-xs font-semibold px-2.5 py-1 transition-all"
                            style={{ color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: 6, background: '#FFF5F5' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFF5F5' }}
                          >
                            データクリア
                          </button>
                        )}
                      </div>
                      {openData && <div className="px-4 pb-4">
                      {selectedFigure.type === 'confusion_matrix' && (
                        <CreateMode data={selectedFigure.data} onDataChange={handleCMDataChange} />
                      )}
                      {selectedFigure.type === 'heatmap' && (
                        <HeatmapCreateMode data={selectedFigure.data} onDataChange={handleHMDataChange} />
                      )}
                      {selectedFigure.type === 'bar_chart' && (
                        <BarChartInput data={(selectedFigure as BarChartState).data} onChange={handleBarDataChange} />
                      )}
                      {selectedFigure.type === 'line_plot' && (
                        <LinePlotInput data={(selectedFigure as LinePlotState).data} onChange={handleLineDataChange} />
                      )}
                      {selectedFigure.type === 'scatter_plot' && (
                        <ScatterInput data={(selectedFigure as ScatterState).data} onChange={handleScatterDataChange} />
                      )}
                      {selectedFigure.type === 'histogram' && (
                        <HistogramInput data={(selectedFigure as HistogramState).data} onChange={handleHistDataChange} />
                      )}
                      {selectedFigure.type === 'roc_curve' && (
                        <RocInput data={(selectedFigure as RocState).data} onChange={handleRocDataChange} />
                      )}
                      {selectedFigure.type === 'pr_curve' && (
                        <PrInput data={(selectedFigure as PrState).data} onChange={handlePrDataChange} />
                      )}
                      {selectedFigure.type === 'learning_curve' && (
                        <LearningInput data={(selectedFigure as LearningState).data} onChange={handleLearningDataChange} />
                      )}
                      {selectedFigure.type === 'feature_importance' && (
                        <FeatureInput data={(selectedFigure as FeatureState).data} onChange={handleFeatureDataChange} />
                      )}
                      {selectedFigure.type === 'box_plot' && (
                        <BoxInput data={(selectedFigure as BoxState).data} labels={(selectedFigure as BoxState).params.labels} onChange={handleBoxDataChange} />
                      )}
                      {selectedFigure.type === 'violin_plot' && (
                        <ViolinInput data={(selectedFigure as ViolinState).data} labels={(selectedFigure as ViolinState).params.labels} onChange={handleViolinDataChange} />
                      )}
                      {selectedFigure.type === 'error_bar' && (
                        <ErrorBarInput data={(selectedFigure as ErrorBarState).data} onChange={handleErrorBarDataChange} />
                      )}
                      {selectedFigure.type === 'stacked_bar' && (
                        <StackedBarInput data={(selectedFigure as StackedBarState).data} onChange={handleStackedBarDataChange} />
                      )}
                      {selectedFigure.type === 'combo_chart' && (
                        <ComboChartInput data={(selectedFigure as ComboState).data} onChange={handleComboDataChange} />
                      )}
                      {selectedFigure.type === 'pie_chart' && (
                        <PieChartInput data={(selectedFigure as PieState).data} onChange={handlePieDataChange} />
                      )}
                      </div>}
                    </section>

                    <section>
                      <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                        onClick={() => setOpenParams(v => !v)}
                      >
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <span style={{ fontSize: 9, color: '#9CA3AF', transition: 'transform .2s', display: 'inline-block', transform: openParams ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                          パラメータ
                        </p>
                      </div>
                      {openParams && <div className="px-4 pb-4">
                      {selectedFigure.type === 'confusion_matrix' && (
                        <FigureEditor figure={selectedFigure as ConfusionMatrixState} onChange={handleCMParamsChange} onReset={handleCMReset} />
                      )}
                      {selectedFigure.type === 'heatmap' && (
                        <HeatmapEditor figure={selectedFigure as HeatmapState} onChange={handleHMParamsChange} onReset={handleHMReset} />
                      )}
                      {selectedFigure.type === 'bar_chart' && (
                        <BarChartEditor figure={selectedFigure as BarChartState} onChange={handleBarParamsChange} onReset={handleBarReset} />
                      )}
                      {selectedFigure.type === 'line_plot' && (
                        <LinePlotEditor figure={selectedFigure as LinePlotState} onChange={handleLineParamsChange} onReset={handleLineReset} />
                      )}
                      {selectedFigure.type === 'scatter_plot' && (
                        <ScatterEditor figure={selectedFigure as ScatterState} onChange={handleScatterParamsChange} onReset={handleScatterReset} />
                      )}
                      {selectedFigure.type === 'histogram' && (
                        <HistogramEditor figure={selectedFigure as HistogramState} onChange={handleHistParamsChange} onReset={handleHistReset} />
                      )}
                      {selectedFigure.type === 'roc_curve' && (
                        <RocEditor figure={selectedFigure as RocState} onChange={handleRocParamsChange} onReset={handleRocReset} />
                      )}
                      {selectedFigure.type === 'pr_curve' && (
                        <PrEditor figure={selectedFigure as PrState} onChange={handlePrParamsChange} onReset={handlePrReset} />
                      )}
                      {selectedFigure.type === 'learning_curve' && (
                        <LearningEditor figure={selectedFigure as LearningState} onChange={handleLearningParamsChange} onReset={handleLearningReset} />
                      )}
                      {selectedFigure.type === 'feature_importance' && (
                        <FeatureEditor figure={selectedFigure as FeatureState} onChange={handleFeatureParamsChange} onReset={handleFeatureReset} />
                      )}
                      {selectedFigure.type === 'box_plot' && (
                        <BoxEditor figure={selectedFigure as BoxState} onChange={handleBoxParamsChange} onReset={handleBoxReset} />
                      )}
                      {selectedFigure.type === 'violin_plot' && (
                        <ViolinEditor figure={selectedFigure as ViolinState} onChange={handleViolinParamsChange} onReset={handleViolinReset} />
                      )}
                      {selectedFigure.type === 'error_bar' && (
                        <ErrorBarEditor figure={selectedFigure as ErrorBarState} onChange={handleErrorBarParamsChange} onReset={handleErrorBarReset} />
                      )}
                      {selectedFigure.type === 'stacked_bar' && (
                        <StackedBarEditor figure={selectedFigure as StackedBarState} onChange={handleStackedBarParamsChange} onReset={handleStackedBarReset} />
                      )}
                      {selectedFigure.type === 'combo_chart' && (
                        <ComboChartEditor figure={selectedFigure as ComboState} onChange={handleComboParamsChange} onReset={handleComboReset} />
                      )}
                      {selectedFigure.type === 'pie_chart' && (
                        <PieChartEditor figure={selectedFigure as PieState} onChange={handlePieParamsChange} onReset={handlePieReset} />
                      )}
                      </div>}
                    </section>
                  </div>
              )}
            </>
          ) : (
            <section className="p-4 flex-1 overflow-y-auto">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">構成設定</p>
              <ComposeSettings
                figures={figures}
                layout={layout}
                onLayoutChange={setLayout}
                onReorder={reorderFigures}
                onExport={handleComposeExport}
                onFormatChange={setComposeFormat}
                format={composeFormat}
                exporting={exporting}
              />
            </section>
          )}
        </div>

        {/* 右パネル */}
        <div className={`flex-1 p-6 flex-col overflow-auto ${mobileView === 'preview' ? 'flex' : 'hidden'} md:flex`}>
          {appMode === 'edit' ? (
            <div style={{ maxWidth: 760, width: '100%', margin: '0 auto' }}>
              <FigurePreview
                b64={selectedFigure ? (previews[selectedFigure.id] ?? null) : null}
                loading={loading}
                error={error}
                format={downloadFormat}
                downloadLoading={downloadLoading}
                onFormatChange={setDownloadFormat}
                onDownload={handleDownload}
                onSendToFigureConverter={handleSendToFigureConverter}
              />
              {selectedFigure && (
                <LatexFigureExport
                  filename={`${selectedFigure.params.title || 'figure'}.${downloadFormat}`}
                  defaultCaption={selectedFigure.params.title}
                  defaultLabel={`fig:${slugify(selectedFigure.params.title || selectedFigure.type)}`}
                />
              )}
            </div>
          ) : (
            <ComposeCanvas figures={figures} layout={layout} previews={previews} />
          )}
        </div>
      </main>

      {showImportModal && (
        <ImportModal
          onApply={handleOcrApply}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  )
}

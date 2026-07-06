export type FigureType =
  | 'confusion_matrix'
  | 'heatmap'
  | 'bar_chart'
  | 'line_plot'
  | 'scatter_plot'
  | 'histogram'
  | 'roc_curve'
  | 'pr_curve'
  | 'learning_curve'
  | 'feature_importance'
  | 'box_plot'
  | 'violin_plot'
  | 'error_bar'
  | 'stacked_bar'
  | 'combo_chart'
  | 'pie_chart'

export type OutputFormat = 'png' | 'svg' | 'pdf' | 'eps'

interface BaseFigureState {
  id: string
  type: FigureType
}

export interface BaseFigureParams {
  title: string
  fontsize: number
  figsize_cm: [number, number]
  dpi: number
}

// ------------------------------------------------------------------ Phase 1
export interface ConfusionMatrixParams extends BaseFigureParams {
  colormap: string
  normalize: boolean
  labels: string[]
  show_values: boolean
  xlabel: string
  ylabel: string
  xlabel_top: boolean
  linewidths: number
  linecolor: string
  annot_fontsize: number
  tick_fontsize: number
  cell_size_cm: number | null
}

export type ConfusionMatrixState = BaseFigureState & {
  type: 'confusion_matrix'
  data: number[][]
  params: ConfusionMatrixParams
}

// ------------------------------------------------------------------ Phase 2
export interface HeatmapParams extends BaseFigureParams {
  mode: 'heatmap' | 'correlation'
  colormap: string
  labels_x: string[]
  labels_y: string[]
  show_values: boolean
  fmt: string
  vmin: number | null
  vmax: number | null
  mask_upper: boolean
  xlabel: string
  ylabel: string
  linewidths: number
  linecolor: string
  annot_fontsize: number
  tick_fontsize: number
  cell_size_cm: number | null
}

export type HeatmapState = BaseFigureState & {
  type: 'heatmap'
  data: number[][]
  params: HeatmapParams
}

// ------------------------------------------------------------------ Phase 4

// bar_chart
export type BarChartData = { labels: string[]; values: number[] | number[][] }

export interface BarChartParams extends BaseFigureParams {
  xlabel: string
  ylabel: string
  colors: string[]
  orientation: 'vertical' | 'horizontal'
  legend: string[]
  tick_fontsize: number
  show_values: boolean
  bar_width: number
  show_grid: boolean
  grid_linestyle: string
  legend_loc: string
  xlim: [number, number] | null
  ylim: [number, number] | null
  xtick_step: number | null
  ytick_step: number | null
  threshold_line: number | null
  threshold_line_color: string
  threshold_line_style: string
  bar_colors: string[] | null
  merge_threshold: number | null
  merge_dir: 'below' | 'above'
  merge_label: string
}

export type BarChartState = BaseFigureState & {
  type: 'bar_chart'
  data: BarChartData
  params: BarChartParams
}

// line_plot
export type LinePlotData = { x: number[]; y: number[] | number[][] }

export interface LinePlotParams extends BaseFigureParams {
  xlabel: string
  ylabel: string
  colors: string[]
  legend: string[]
  markers: string[]
  linewidth: number
  tick_fontsize: number
  show_grid: boolean
  grid_linestyle: string
  legend_loc: string
  xlim: [number, number] | null
  ylim: [number, number] | null
  xtick_step: number | null
  ytick_step: number | null
  log_scale_x: boolean
  log_scale_y: boolean
}

export type LinePlotState = BaseFigureState & {
  type: 'line_plot'
  data: LinePlotData
  params: LinePlotParams
}

// scatter_plot — multi-series
export type ScatterSeriesItem = { x: number[]; y: number[] }
export type ScatterData = { series: ScatterSeriesItem[] }

export interface ScatterParams extends BaseFigureParams {
  xlabel: string
  ylabel: string
  colors: string[]
  legend: string[]
  legend_loc: string
  marker_size: number
  alpha: number
  tick_fontsize: number
  show_grid: boolean
  grid_linestyle: string
  xlim: [number, number] | null
  ylim: [number, number] | null
  xtick_step: number | null
  ytick_step: number | null
}

export type ScatterState = BaseFigureState & {
  type: 'scatter_plot'
  data: ScatterData
  params: ScatterParams
}

// histogram
export interface HistogramParams extends BaseFigureParams {
  xlabel: string
  ylabel: string
  bins: number
  color: string
  density: boolean
  tick_fontsize: number
  show_grid: boolean
  grid_linestyle: string
  ylim: [number, number] | null
  ytick_step: number | null
}

export type HistogramState = BaseFigureState & {
  type: 'histogram'
  data: number[]
  params: HistogramParams
}

// ------------------------------------------------------------------ Phase 5

// roc_curve
export type RocData = { fpr: number[][], tpr: number[][], auc: number[] }

export interface RocParams extends BaseFigureParams {
  xlabel: string
  ylabel: string
  colors: string[]
  legend: string[]
  linewidth: number
  tick_fontsize: number
  show_diagonal: boolean
  diagonal_style: string
  diagonal_color: string
  show_auc_in_legend: boolean
  legend_loc: string
  show_grid: boolean
  grid_linestyle: string
  xlim: [number, number] | null
  ylim: [number, number] | null
}

export type RocState = BaseFigureState & {
  type: 'roc_curve'
  data: RocData
  params: RocParams
}

// pr_curve
export type PrData = { precision: number[][], recall: number[][], ap: number[] }

export interface PrParams extends BaseFigureParams {
  xlabel: string
  ylabel: string
  colors: string[]
  legend: string[]
  linewidth: number
  tick_fontsize: number
  show_ap_in_legend: boolean
  legend_loc: string
  show_grid: boolean
  grid_linestyle: string
  xlim: [number, number] | null
  ylim: [number, number] | null
}

export type PrState = BaseFigureState & {
  type: 'pr_curve'
  data: PrData
  params: PrParams
}

// learning_curve
export type LearningSeriesItem = { label: string; values: number[]; axis: 'left' | 'right' }
export type LearningData = { epochs: number[]; series: LearningSeriesItem[] }

export interface LearningParams extends BaseFigureParams {
  xlabel: string
  ylabel_left: string
  ylabel_right: string
  colors: string[]
  markers: string[]
  linewidth: number
  tick_fontsize: number
  legend_loc: string
  show_grid: boolean
  grid_linestyle: string
  xlim: [number, number] | null
  ylim_left: [number, number] | null
  ylim_right: [number, number] | null
  xtick_step: number | null
}

export type LearningState = BaseFigureState & {
  type: 'learning_curve'
  data: LearningData
  params: LearningParams
}

// feature_importance
export type FeatureData = { features: string[]; importances: number[] }

export interface FeatureParams extends BaseFigureParams {
  xlabel: string
  ylabel: string
  color: string
  top_n: number | null
  sort: boolean
  show_values: boolean
  orientation: 'vertical' | 'horizontal'
  bar_width: number
  tick_fontsize: number
  show_grid: boolean
  grid_linestyle: string
  xlim: [number, number] | null
  ylim: [number, number] | null
}

export type FeatureState = BaseFigureState & {
  type: 'feature_importance'
  data: FeatureData
  params: FeatureParams
}

// ------------------------------------------------------------------ Phase 7

export interface BracketItem {
  group1: number
  group2: number
  label: string
  height: number | null
}

// box_plot
export type BoxData = { groups: number[][] }
export interface BoxParams extends BaseFigureParams {
  xlabel: string; ylabel: string
  labels: string[]; colors: string[]
  tick_fontsize: number
  orientation: 'vertical' | 'horizontal'
  notch: boolean; showfliers: boolean; show_mean: boolean; show_median: boolean; show_points: boolean
  show_grid: boolean; grid_linestyle: string
  xlim: [number, number] | null; ylim: [number, number] | null
  brackets: BracketItem[]
}
export type BoxState = BaseFigureState & { type: 'box_plot'; data: BoxData; params: BoxParams }

// violin_plot
export type ViolinData = { groups: number[][] }
export interface ViolinParams extends BaseFigureParams {
  xlabel: string; ylabel: string
  labels: string[]; colors: string[]
  tick_fontsize: number
  orientation: 'vertical' | 'horizontal'
  inner: 'box' | 'stick' | 'none'
  alpha: number
  edgecolor: string
  show_mean: boolean; show_median: boolean; show_points: boolean
  show_grid: boolean; grid_linestyle: string
  xlim: [number, number] | null; ylim: [number, number] | null
  brackets: BracketItem[]
}
export type ViolinState = BaseFigureState & { type: 'violin_plot'; data: ViolinData; params: ViolinParams }

// error_bar
export type ErrorBarSeriesItem = { name: string; means: number[]; errors: number[] }
export type ErrorBarData = { labels: string[]; series: ErrorBarSeriesItem[] }
export interface ErrorBarParams extends BaseFigureParams {
  xlabel: string; ylabel: string
  colors: string[]; legend: string[]; legend_loc: string
  error_color: string; capsize: number; bar_width: number
  tick_fontsize: number
  orientation: 'vertical' | 'horizontal'
  show_values: boolean
  show_grid: boolean; grid_linestyle: string
  xlim: [number, number] | null; ylim: [number, number] | null
  ytick_step: number | null
  brackets: BracketItem[]
}
export type ErrorBarState = BaseFigureState & { type: 'error_bar'; data: ErrorBarData; params: ErrorBarParams }

// ------------------------------------------------------------------ Phase 8 (new chart types)

// stacked_bar
export type StackedBarData = { labels: string[]; values: number[][] }

export interface StackedBarParams extends BaseFigureParams {
  xlabel: string
  ylabel: string
  colors: string[]
  orientation: 'vertical' | 'horizontal'
  legend: string[]
  tick_fontsize: number
  bar_width: number
  normalize: boolean
  show_values: boolean
  show_grid: boolean
  grid_linestyle: string
  legend_loc: string
  xlim: [number, number] | null
  ylim: [number, number] | null
}

export type StackedBarState = BaseFigureState & {
  type: 'stacked_bar'
  data: StackedBarData
  params: StackedBarParams
}

// combo_chart
export type ComboSeriesItem = { name: string; values: number[] }
export type ComboData = {
  labels: string[]
  bar_series: ComboSeriesItem[]
  line_series: ComboSeriesItem[]
}

export interface ComboParams extends BaseFigureParams {
  xlabel: string
  ylabel_left: string
  ylabel_right: string
  colors_bar: string[]
  colors_line: string[]
  bar_width: number
  linewidth: number
  markers: string[]
  tick_fontsize: number
  show_grid: boolean
  grid_linestyle: string
  legend_loc: string
  xlim: [number, number] | null
  ylim_left: [number, number] | null
  ylim_right: [number, number] | null
}

export type ComboState = BaseFigureState & {
  type: 'combo_chart'
  data: ComboData
  params: ComboParams
}

// pie_chart
export type PieData = { labels: string[]; values: number[] }

export interface PieParams extends BaseFigureParams {
  colors: string[]
  startangle: number
  autopct: boolean
  pctdistance: number
  shadow: boolean
  donut: number
  legend_loc: string
  explode: number[]
  tick_fontsize: number
}

export type PieState = BaseFigureState & {
  type: 'pie_chart'
  data: PieData
  params: PieParams
}

// ------------------------------------------------------------------ union
export type FigureState =
  | ConfusionMatrixState
  | HeatmapState
  | BarChartState
  | LinePlotState
  | ScatterState
  | HistogramState
  | RocState
  | PrState
  | LearningState
  | FeatureState
  | BoxState
  | ViolinState
  | ErrorBarState
  | StackedBarState
  | ComboState
  | PieState

// ------------------------------------------------------------------ compose

export interface FigurePosition {
  figureId: string
  x: number
  y: number
  w: number
  h: number
}

export interface ComposeLayout {
  mode: 'grid' | 'free'
  gridCols: number
  gridRows: number
  gap: number
  positions: FigurePosition[]
}

export const DEFAULT_COMPOSE_LAYOUT: ComposeLayout = {
  mode: 'grid',
  gridCols: 2,
  gridRows: 0,
  gap: 0.5,
  positions: [],
}

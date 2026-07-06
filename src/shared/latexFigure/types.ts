export type FigureEnvironment = 'figure' | 'figure*'
export type FigurePlacement = 'tb' | 'htbp' | 'h' | 't' | 'b' | 'p'
export type FigureWidthUnit = 'linewidth' | 'textwidth' | 'columnwidth'
export type FigureWrapStyle = 'center-env' | 'centering'

export interface FigureLatexOptions {
  environment: FigureEnvironment
  placement: FigurePlacement
  widthFraction: number
  widthUnit: FigureWidthUnit
  wrapStyle: FigureWrapStyle
}

export const DEFAULT_FIGURE_LATEX_OPTIONS: FigureLatexOptions = {
  environment: 'figure*',
  placement: 'tb',
  widthFraction: 1.0,
  widthUnit: 'linewidth',
  wrapStyle: 'center-env',
}

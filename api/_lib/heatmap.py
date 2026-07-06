import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from _lib.common import setup_japanese_font

setup_japanese_font()

_MARGIN_W_IN = 4.0 / 2.54
_MARGIN_H_IN = 3.0 / 2.54


def render(data: list, params: dict):
    if not data or not data[0]:
        raise ValueError('data is empty')

    rows = len(data)
    cols = len(data[0])
    if any(len(r) != cols for r in data):
        raise ValueError('all rows must have the same length')

    mode = params.get('mode', 'heatmap')

    cell_size_cm = params.get('cell_size_cm')
    if cell_size_cm and float(cell_size_cm) > 0:
        cell_in = float(cell_size_cm) / 2.54
        figsize_in = (cols * cell_in + _MARGIN_W_IN, rows * cell_in + _MARGIN_H_IN)
    else:
        figsize_cm = params.get('figsize_cm', [10, 8])
        figsize_in = (figsize_cm[0] / 2.54, figsize_cm[1] / 2.54)

    arr = np.array(data, dtype=float)

    if mode == 'correlation':
        colormap = params.get('colormap', 'coolwarm')
        vmin = params.get('vmin', -1)
        vmax = params.get('vmax', 1)
    else:
        colormap = params.get('colormap', 'Blues')
        vmin = params.get('vmin') or None
        vmax = params.get('vmax') or None

    mask = None
    if params.get('mask_upper', False) and rows == cols:
        mask = np.triu(np.ones_like(arr, dtype=bool), k=1)

    fmt         = params.get('fmt', '.2f')
    show_values = bool(params.get('show_values', True))

    raw_x   = params.get('labels_x', [])
    raw_y   = params.get('labels_y', [])
    labels_x = [str(l).replace('\\n', '\n') for l in raw_x] if raw_x else True
    labels_y = [str(l).replace('\\n', '\n') for l in raw_y] if raw_y else True

    linewidths     = float(params.get('linewidths', 0.5))
    linecolor      = params.get('linecolor', 'white')
    fontsize       = params.get('fontsize', 12)
    annot_fontsize = params.get('annot_fontsize', 10)
    tick_fontsize  = params.get('tick_fontsize', 10)

    fig, ax = plt.subplots(figsize=figsize_in)
    sns.heatmap(
        arr,
        ax=ax,
        cmap=colormap,
        mask=mask,
        vmin=vmin,
        vmax=vmax,
        annot=show_values,
        fmt=fmt,
        xticklabels=labels_x,
        yticklabels=labels_y,
        linewidths=linewidths,
        linecolor=linecolor,
        annot_kws={'size': annot_fontsize},
        square=True,
    )

    ax.tick_params(axis='both', labelsize=tick_fontsize)
    ax.set_title(params.get('title', ''), fontsize=fontsize)

    xlabel = params.get('xlabel', '')
    ylabel = params.get('ylabel', '')
    if xlabel:
        ax.set_xlabel(xlabel, fontsize=fontsize)
    if ylabel:
        ax.set_ylabel(ylabel, fontsize=fontsize)

    fig.tight_layout()
    return fig

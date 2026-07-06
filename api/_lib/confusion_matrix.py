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
    if len(data) != len(data[0]):
        raise ValueError('data must be a square matrix')

    n = len(data)

    cell_size_cm = params.get('cell_size_cm')
    if cell_size_cm and float(cell_size_cm) > 0:
        cell_in = float(cell_size_cm) / 2.54
        figsize_in = (n * cell_in + _MARGIN_W_IN, n * cell_in + _MARGIN_H_IN)
    else:
        figsize_cm = params.get('figsize_cm', [10, 8])
        figsize_in = (figsize_cm[0] / 2.54, figsize_cm[1] / 2.54)

    arr = np.array(data, dtype=float)
    if params.get('normalize'):
        row_sums = arr.sum(axis=1, keepdims=True)
        arr = arr / np.where(row_sums == 0, 1, row_sums)
        fmt = '.2f'
    else:
        fmt = 'd'
        arr = arr.astype(int)

    raw_labels = params.get('labels', 'auto')
    if isinstance(raw_labels, list):
        labels = [str(l).replace('\\n', '\n') for l in raw_labels]
    else:
        labels = raw_labels

    linewidths     = float(params.get('linewidths', 0.1))
    linecolor      = params.get('linecolor', 'black')
    fontsize       = params.get('fontsize', 12)
    annot_fontsize = params.get('annot_fontsize', 11)
    tick_fontsize  = params.get('tick_fontsize', 11)

    fig, ax = plt.subplots(figsize=figsize_in)
    sns.heatmap(
        arr,
        ax=ax,
        cmap=params.get('colormap', 'Blues'),
        annot=bool(params.get('show_values', True)),
        fmt=fmt,
        xticklabels=labels,
        yticklabels=labels,
        linewidths=linewidths,
        linecolor=linecolor,
        annot_kws={'size': annot_fontsize},
        square=True,
    )

    ax.tick_params(axis='both', labelsize=tick_fontsize)
    ax.set_title(params.get('title', ''), fontsize=fontsize)

    xlabel = params.get('xlabel', 'Predicted Label')
    ylabel = params.get('ylabel', 'True Label')
    if xlabel:
        ax.set_xlabel(xlabel, fontsize=fontsize)
    if ylabel:
        ax.set_ylabel(ylabel, fontsize=fontsize)

    if params.get('xlabel_top', True):
        ax.xaxis.set_ticks_position('top')
        ax.xaxis.set_label_position('top')

    fig.tight_layout()
    return fig

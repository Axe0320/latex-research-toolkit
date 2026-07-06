import numpy as np
import matplotlib.pyplot as plt
from _lib.common import setup_japanese_font, apply_common_axes, apply_legend

setup_japanese_font()

_DEFAULT_COLORS = ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF']


def render(data: dict, params: dict):
    fpr_list = data.get('fpr', [])
    tpr_list = data.get('tpr', [])
    auc_list = data.get('auc', [])

    if not fpr_list or not tpr_list:
        raise ValueError('fpr と tpr を指定してください')
    if len(fpr_list) != len(tpr_list):
        raise ValueError('fpr と tpr の系列数が一致しません')

    n_series = len(fpr_list)

    w_cm, h_cm = params.get('figsize_cm', [12, 10])
    fig, ax = plt.subplots(figsize=(w_cm / 2.54, h_cm / 2.54))

    colors   = params.get('colors', _DEFAULT_COLORS)
    legend   = params.get('legend', [])
    lw       = float(params.get('linewidth', 1.5))
    tick_fs  = params.get('tick_fontsize', 10)
    show_auc = params.get('show_auc_in_legend', True)

    for i in range(n_series):
        fpr = np.array(fpr_list[i], dtype=float)
        tpr = np.array(tpr_list[i], dtype=float)
        color = colors[i % len(colors)]
        label = legend[i] if i < len(legend) else f'Class {i}'
        if show_auc and i < len(auc_list):
            label = f'{label} (AUC={float(auc_list[i]):.3f})'
        ax.plot(fpr, tpr, color=color, linewidth=lw, label=label, zorder=2)

    if params.get('show_diagonal', True):
        ax.plot([0, 1], [0, 1],
                linestyle=params.get('diagonal_style', '--'),
                color=params.get('diagonal_color', '#9CA3AF'),
                linewidth=1, zorder=1)

    ax.tick_params(labelsize=tick_fs)
    ax.set_title(params.get('title',  ''), fontsize=params.get('fontsize', 12))
    ax.set_xlabel(params.get('xlabel', 'False Positive Rate'), fontsize=params.get('fontsize', 11))
    ax.set_ylabel(params.get('ylabel', 'True Positive Rate'),  fontsize=params.get('fontsize', 11))

    apply_common_axes(ax, params)
    apply_legend(ax, params, n_series, tick_fs)

    fig.tight_layout()
    return fig

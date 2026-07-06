import numpy as np
import matplotlib.pyplot as plt
from _lib.common import setup_japanese_font, apply_common_axes, apply_legend

setup_japanese_font()

_DEFAULT_COLORS = ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF']


def render(data: dict, params: dict):
    precision_list = data.get('precision', [])
    recall_list    = data.get('recall',    [])
    ap_list        = data.get('ap',        [])

    if not precision_list or not recall_list:
        raise ValueError('precision と recall を指定してください')
    if len(precision_list) != len(recall_list):
        raise ValueError('precision と recall の系列数が一致しません')

    n_series = len(precision_list)

    w_cm, h_cm = params.get('figsize_cm', [12, 10])
    fig, ax = plt.subplots(figsize=(w_cm / 2.54, h_cm / 2.54))

    colors  = params.get('colors', _DEFAULT_COLORS)
    legend  = params.get('legend', [])
    lw      = float(params.get('linewidth', 1.5))
    tick_fs = params.get('tick_fontsize', 10)
    show_ap = params.get('show_ap_in_legend', True)

    for i in range(n_series):
        precision = np.array(precision_list[i], dtype=float)
        recall    = np.array(recall_list[i],    dtype=float)
        color = colors[i % len(colors)]
        label = legend[i] if i < len(legend) else f'Class {i}'
        if show_ap and i < len(ap_list):
            label = f'{label} (AP={float(ap_list[i]):.3f})'
        ax.plot(recall, precision, color=color, linewidth=lw, label=label, zorder=2)

    ax.tick_params(labelsize=tick_fs)
    ax.set_title(params.get('title',  ''), fontsize=params.get('fontsize', 12))
    ax.set_xlabel(params.get('xlabel', 'Recall'),    fontsize=params.get('fontsize', 11))
    ax.set_ylabel(params.get('ylabel', 'Precision'), fontsize=params.get('fontsize', 11))

    apply_common_axes(ax, params)
    apply_legend(ax, params, n_series, tick_fs)

    fig.tight_layout()
    return fig

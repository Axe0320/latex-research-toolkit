import numpy as np
import matplotlib.pyplot as plt
from _lib.common import setup_japanese_font, apply_common_axes, apply_legend

setup_japanese_font()

_DEFAULT_COLORS = ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF']


def render(data: dict, params: dict):
    labels = list(data.get('labels', []))
    values = data.get('values', [])
    if not labels or not values:
        raise ValueError('labels と values を指定してください')

    arr = np.array(values, dtype=float)  # (n_series, n_cats)
    if arr.ndim == 1:
        arr = arr[np.newaxis, :]
    n_series, n_cats = arr.shape
    if n_cats != len(labels):
        raise ValueError('labels の数と values の列数が一致しません')

    normalize = params.get('normalize', False)
    if normalize:
        col_sum = arr.sum(axis=0)
        col_sum[col_sum == 0] = 1
        arr = arr / col_sum * 100

    w_cm, h_cm = params.get('figsize_cm', [14, 10])
    fig, ax = plt.subplots(figsize=(w_cm / 2.54, h_cm / 2.54))

    colors  = params.get('colors', _DEFAULT_COLORS)
    legend  = params.get('legend', [])
    orient  = params.get('orientation', 'vertical')
    tick_fs = params.get('tick_fontsize', 10)
    bar_w   = float(params.get('bar_width', 0.8))
    show_v  = params.get('show_values', False)

    x = np.arange(n_cats)
    bottoms = np.zeros(n_cats)

    for i, row in enumerate(arr):
        color = colors[i % len(colors)]
        label = legend[i] if i < len(legend) else f'Series {i+1}'
        if orient == 'horizontal':
            bars = ax.barh(x, row, bar_w, left=bottoms, label=label, color=color, zorder=2)
        else:
            bars = ax.bar(x, row, bar_w, bottom=bottoms, label=label, color=color, zorder=2)
        if show_v:
            for bar in bars:
                if orient == 'horizontal':
                    w = bar.get_width()
                    if w > 1e-6:
                        ax.text(bar.get_x() + w / 2, bar.get_y() + bar.get_height() / 2,
                                f'{w:.1f}', ha='center', va='center', fontsize=tick_fs - 2, color='white')
                else:
                    h = bar.get_height()
                    if h > 1e-6:
                        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_y() + h / 2,
                                f'{h:.1f}', ha='center', va='center', fontsize=tick_fs - 2, color='white')
        bottoms += row

    if orient == 'horizontal':
        ax.set_yticks(x)
        ax.set_yticklabels(labels, fontsize=tick_fs)
        ax.tick_params(axis='x', labelsize=tick_fs)
        if normalize:
            ax.set_xlim(0, 100)
    else:
        ax.set_xticks(x)
        ax.set_xticklabels(labels, fontsize=tick_fs)
        ax.tick_params(axis='y', labelsize=tick_fs)
        if normalize:
            ax.set_ylim(0, 100)

    ax.set_title(params.get('title', ''), fontsize=params.get('fontsize', 12))
    ax.set_xlabel(params.get('xlabel', ''), fontsize=params.get('fontsize', 11))
    ax.set_ylabel(params.get('ylabel', ''), fontsize=params.get('fontsize', 11))

    apply_common_axes(ax, params)
    apply_legend(ax, params, n_series, tick_fs)

    fig.tight_layout()
    return fig

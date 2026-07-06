import numpy as np
import matplotlib.pyplot as plt
from _lib.common import setup_japanese_font, apply_common_axes, apply_legend

setup_japanese_font()

_DEFAULT_COLORS  = ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF']
_DEFAULT_MARKERS = ['o', 's', '^', 'D', 'v', 'P']


def render(data: dict, params: dict):
    x = data.get('x', [])
    y = data.get('y', [])
    if not x or not y:
        raise ValueError('x と y を指定してください')

    x_arr  = np.array(x, dtype=float)
    is_multi = isinstance(y[0], list)
    y_arr  = np.array(y, dtype=float)
    if not is_multi:
        y_arr = y_arr[np.newaxis, :]

    n_series = y_arr.shape[0]
    if y_arr.shape[1] != len(x_arr):
        raise ValueError('x の長さと y の列数が一致しません')

    w_cm, h_cm = params.get('figsize_cm', [14, 10])
    fig, ax = plt.subplots(figsize=(w_cm / 2.54, h_cm / 2.54))

    colors   = params.get('colors',  _DEFAULT_COLORS)
    legend   = params.get('legend',  [])
    markers  = params.get('markers', _DEFAULT_MARKERS)
    lw       = params.get('linewidth', 1.5)
    tick_fs  = params.get('tick_fontsize', 10)

    for i, row in enumerate(y_arr):
        label = legend[i] if i < len(legend) else (f'Series {i+1}' if n_series > 1 else None)
        ax.plot(
            x_arr, row,
            color=colors[i % len(colors)],
            marker=markers[i % len(markers)],
            linewidth=lw,
            label=label,
        )

    # 対数スケール
    if params.get('log_scale_x'):
        ax.set_xscale('log')
    if params.get('log_scale_y'):
        ax.set_yscale('log')

    ax.tick_params(labelsize=tick_fs)
    ax.set_title(params.get('title',  ''), fontsize=params.get('fontsize', 12))
    ax.set_xlabel(params.get('xlabel', ''), fontsize=params.get('fontsize', 11))
    ax.set_ylabel(params.get('ylabel', ''), fontsize=params.get('fontsize', 11))

    apply_common_axes(ax, params)
    apply_legend(ax, params, n_series, tick_fs)

    fig.tight_layout()
    return fig

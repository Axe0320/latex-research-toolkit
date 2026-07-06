import numpy as np
import matplotlib.pyplot as plt
from _lib.common import setup_japanese_font, apply_common_axes, apply_legend

setup_japanese_font()

_DEFAULT_COLORS = ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF']


def render(data: dict, params: dict):
    series_list = data.get('series', [])
    if not series_list:
        raise ValueError('series データを指定してください')

    w_cm, h_cm = params.get('figsize_cm', [12, 10])
    fig, ax = plt.subplots(figsize=(w_cm / 2.54, h_cm / 2.54))

    colors  = params.get('colors', _DEFAULT_COLORS)
    legend  = params.get('legend', [])
    size    = params.get('marker_size', 40)
    alpha   = params.get('alpha', 0.7)
    tick_fs = params.get('tick_fontsize', 10)
    n_series = len(series_list)

    for i, s in enumerate(series_list):
        x = np.array(s.get('x', []), dtype=float)
        y = np.array(s.get('y', []), dtype=float)
        color = colors[i % len(colors)]
        label = legend[i] if i < len(legend) else (f'Series {i+1}' if n_series > 1 else None)
        ax.scatter(x, y, color=color, s=size, alpha=alpha, label=label, zorder=2)

    ax.tick_params(labelsize=tick_fs)
    ax.set_title(params.get('title',  ''), fontsize=params.get('fontsize', 12))
    ax.set_xlabel(params.get('xlabel', ''), fontsize=params.get('fontsize', 11))
    ax.set_ylabel(params.get('ylabel', ''), fontsize=params.get('fontsize', 11))

    apply_common_axes(ax, params)
    apply_legend(ax, params, n_series, tick_fs)

    fig.tight_layout()
    return fig

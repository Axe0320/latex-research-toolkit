import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
from _lib.common import setup_japanese_font

setup_japanese_font()

_DEFAULT_COLORS  = ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF']
_DEFAULT_MARKERS = ['o', 's', '^', 'D', 'v', 'P']


def render(data: dict, params: dict):
    epochs      = data.get('epochs', [])
    series_list = data.get('series', [])

    if not epochs or not series_list:
        raise ValueError('epochs と series を指定してください')

    has_right = any(s.get('axis', 'left') == 'right' for s in series_list)

    w_cm, h_cm = params.get('figsize_cm', [14, 10])
    fig, ax1 = plt.subplots(figsize=(w_cm / 2.54, h_cm / 2.54))
    ax2 = ax1.twinx() if has_right else None

    colors   = params.get('colors',  _DEFAULT_COLORS)
    markers  = params.get('markers', _DEFAULT_MARKERS)
    lw       = float(params.get('linewidth', 1.5))
    tick_fs  = params.get('tick_fontsize', 10)
    ep       = np.array(epochs, dtype=float)

    lines = []
    for i, s in enumerate(series_list):
        vals   = np.array(s.get('values', []), dtype=float)
        color  = colors[i % len(colors)]
        marker = markers[i % len(markers)]
        label  = s.get('label', f'Series {i+1}')
        ax     = ax1 if s.get('axis', 'left') == 'left' else ax2
        line, = ax.plot(ep, vals, color=color, linewidth=lw,
                        marker=marker, markersize=4, label=label, zorder=2)
        lines.append(line)

    # 左軸
    ax1.tick_params(labelsize=tick_fs)
    ax1.set_title(params.get('title', ''),        fontsize=params.get('fontsize', 12))
    ax1.set_xlabel(params.get('xlabel', 'Epoch'), fontsize=params.get('fontsize', 11))
    ax1.set_ylabel(params.get('ylabel_left', ''), fontsize=params.get('fontsize', 11))

    ylim_left = params.get('ylim_left')
    if ylim_left and len(ylim_left) == 2:
        ax1.set_ylim(float(ylim_left[0]), float(ylim_left[1]))

    # 右軸
    if ax2:
        ax2.set_ylabel(params.get('ylabel_right', ''), fontsize=params.get('fontsize', 11))
        ax2.tick_params(labelsize=tick_fs)
        ylim_right = params.get('ylim_right')
        if ylim_right and len(ylim_right) == 2:
            ax2.set_ylim(float(ylim_right[0]), float(ylim_right[1]))

    # 左右軸の目盛を揃える（グリッド線を一致させる）
    if ax2:
        ax1.yaxis.set_major_locator(ticker.MaxNLocator(nbins=5, integer=False))
        ax2.yaxis.set_major_locator(ticker.MaxNLocator(nbins=5, integer=False))

    # X軸
    xlim = params.get('xlim')
    if xlim and len(xlim) == 2:
        ax1.set_xlim(float(xlim[0]), float(xlim[1]))
    xtick_step = params.get('xtick_step')
    if xtick_step and float(xtick_step) > 0:
        ax1.xaxis.set_major_locator(ticker.MultipleLocator(float(xtick_step)))

    # グリッド
    if params.get('show_grid', False):
        ax1.grid(True, linestyle=params.get('grid_linestyle', '--'), alpha=0.4, zorder=0)

    # 凡例（両軸のラインをまとめる）
    legend_loc = params.get('legend_loc', 'best')
    if legend_loc == 'outside':
        ax1.legend(handles=lines, loc='center left', bbox_to_anchor=(1.05, 0.5),
                   borderaxespad=0, fontsize=tick_fs, framealpha=0.9)
    else:
        ax1.legend(handles=lines, loc=legend_loc, fontsize=tick_fs, framealpha=0.9)

    fig.tight_layout()
    return fig

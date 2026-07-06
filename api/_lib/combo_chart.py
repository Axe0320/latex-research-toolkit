import numpy as np
import matplotlib.pyplot as plt
from _lib.common import setup_japanese_font, apply_legend

setup_japanese_font()

_BAR_COLORS  = ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347']
_LINE_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6']
_MARKERS = ['o', 's', '^', 'D', 'v', 'P']


def render(data: dict, params: dict):
    labels      = list(data.get('labels', []))
    bar_series  = data.get('bar_series', [])
    line_series = data.get('line_series', [])

    if not labels:
        raise ValueError('labels を指定してください')
    if not bar_series and not line_series:
        raise ValueError('bar_series または line_series を指定してください')

    n_cats = len(labels)
    x = np.arange(n_cats)

    w_cm, h_cm = params.get('figsize_cm', [14, 10])
    fig, ax1 = plt.subplots(figsize=(w_cm / 2.54, h_cm / 2.54))

    colors_bar  = params.get('colors_bar',  _BAR_COLORS)
    colors_line = params.get('colors_line', _LINE_COLORS)
    bar_w       = float(params.get('bar_width', 0.6))
    linewidth   = float(params.get('linewidth', 1.5))
    markers     = params.get('markers', _MARKERS)
    tick_fs     = params.get('tick_fontsize', 10)
    fontsize    = params.get('fontsize', 12)

    n_bars = len(bar_series)
    bar_handles = []
    for i, s in enumerate(bar_series):
        vals   = np.array(s.get('values', [0] * n_cats), dtype=float)
        offset = (i - (n_bars - 1) / 2) * bar_w / max(n_bars, 1)
        color  = colors_bar[i % len(colors_bar)]
        name   = s.get('name', f'Bar {i+1}')
        b = ax1.bar(x + offset, vals, bar_w / max(n_bars, 1), label=name, color=color, zorder=2, alpha=0.85)
        bar_handles.append(b)

    ax1.set_xticks(x)
    ax1.set_xticklabels(labels, fontsize=tick_fs)
    ax1.tick_params(axis='y', labelsize=tick_fs)
    ax1.set_xlabel(params.get('xlabel', ''), fontsize=fontsize)
    ax1.set_ylabel(params.get('ylabel_left', ''), fontsize=fontsize)
    ax1.set_title(params.get('title', ''), fontsize=fontsize)

    ylim_left = params.get('ylim_left')
    if ylim_left and len(ylim_left) == 2:
        ax1.set_ylim(ylim_left[0], ylim_left[1])

    xlim = params.get('xlim')
    if xlim and len(xlim) == 2:
        ax1.set_xlim(xlim[0], xlim[1])

    if params.get('show_grid', False):
        ax1.grid(True, linestyle=params.get('grid_linestyle', '--'), alpha=0.4, zorder=0)

    line_handles = []
    if line_series:
        ax2 = ax1.twinx()
        ax2.set_ylabel(params.get('ylabel_right', ''), fontsize=fontsize)
        ax2.tick_params(axis='y', labelsize=tick_fs)

        ylim_right = params.get('ylim_right')
        if ylim_right and len(ylim_right) == 2:
            ax2.set_ylim(ylim_right[0], ylim_right[1])

        for i, s in enumerate(line_series):
            vals   = np.array(s.get('values', [0] * n_cats), dtype=float)
            color  = colors_line[i % len(colors_line)]
            marker = markers[i % len(markers)]
            name   = s.get('name', f'Line {i+1}')
            ln, = ax2.plot(x, vals, color=color, linewidth=linewidth,
                           marker=marker, markersize=5, label=name, zorder=3)
            line_handles.append(ln)

    # 凡例を ax1 にまとめる
    all_handles = [b[0] if hasattr(b, '__getitem__') else b for b in bar_handles] + line_handles
    all_labels  = [s.get('name', f'Bar {i+1}') for i, s in enumerate(bar_series)] + \
                  [s.get('name', f'Line {i+1}') for i, s in enumerate(line_series)]
    if all_handles:
        loc = params.get('legend_loc', 'best')
        if loc == 'outside':
            ax1.legend(all_handles, all_labels, loc='upper left',
                       bbox_to_anchor=(1.12, 1), borderaxespad=0, fontsize=tick_fs)
        else:
            ax1.legend(all_handles, all_labels, loc=loc, fontsize=tick_fs)

    fig.tight_layout()
    return fig

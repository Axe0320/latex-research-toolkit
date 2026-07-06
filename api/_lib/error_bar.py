import numpy as np
import matplotlib.pyplot as plt
from _lib.common import apply_common_axes, apply_legend, setup_japanese_font

setup_japanese_font()

_DEFAULT_COLORS = ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF']


def render(data: dict, params: dict):
    labels_list = data.get('labels', [])
    series      = data.get('series', [])
    if not labels_list or not series:
        raise ValueError('データを入力してください')

    n_groups  = len(labels_list)
    n_series  = len(series)
    colors      = params.get('colors', _DEFAULT_COLORS)
    error_color = params.get('error_color', '#374151')
    capsize     = int(params.get('capsize', 5))
    bar_width   = float(params.get('bar_width', 0.6))
    orientation = params.get('orientation', 'vertical')
    show_values = bool(params.get('show_values', False))
    tick_fs     = params.get('tick_fontsize', 10)
    fs          = params.get('fontsize', 12)

    w_cm, h_cm = params.get('figsize_cm', [14, 10])
    fig, ax = plt.subplots(figsize=(w_cm / 2.54, h_cm / 2.54))

    x         = np.arange(n_groups)
    single_w  = bar_width / n_series
    offsets   = np.linspace(-(bar_width - single_w) / 2, (bar_width - single_w) / 2, n_series)
    vert      = (orientation == 'vertical')

    for i, s in enumerate(series):
        color   = colors[i % len(colors)]
        means   = [float(v) for v in s.get('means',  [0.0] * n_groups)][:n_groups]
        errors  = [float(v) for v in s.get('errors', [0.0] * n_groups)][:n_groups]
        name    = s.get('name', f'Series {i+1}')
        ek      = {'ecolor': error_color, 'capsize': capsize, 'elinewidth': 1.5}

        if vert:
            bars = ax.bar(x + offsets[i], means, width=single_w, color=color,
                          label=name, yerr=errors, error_kw=ek, zorder=2)
            if show_values:
                for bar, m, e in zip(bars, means, errors):
                    ax.text(bar.get_x() + bar.get_width() / 2,
                            bar.get_height() + e + (max(means) - min(means)) * 0.02,
                            f'{m:.2f}', ha='center', va='bottom', fontsize=tick_fs - 1)
        else:
            ax.barh(x + offsets[i], means, height=single_w, color=color,
                    label=name, xerr=errors, error_kw=ek, zorder=2)

    if vert:
        ax.set_xticks(x)
        ax.set_xticklabels(labels_list, fontsize=tick_fs)
    else:
        ax.set_yticks(x)
        ax.set_yticklabels(labels_list, fontsize=tick_fs)

    ax.tick_params(labelsize=tick_fs)
    if params.get('title'):
        ax.set_title(params['title'], fontsize=fs)
    if params.get('xlabel'):
        ax.set_xlabel(params['xlabel'], fontsize=fs)
    if params.get('ylabel'):
        ax.set_ylabel(params['ylabel'], fontsize=fs)

    apply_common_axes(ax, params)
    apply_legend(ax, params, n_series, tick_fs)

    # 有意差ブラケット
    from _lib.box_plot import _draw_bracket
    all_groups = [s.get('means', []) for s in series]
    all_flat   = [v for g in all_groups for v in g]
    for b in params.get('brackets', []):
        _draw_bracket(ax, b.get('group1', 0) + 1, b.get('group2', 1) + 1,
                      b.get('height'), b.get('label', '*'), vert,
                      [[v] for v in all_flat] if all_flat else [[0]], tick_fs)

    fig.tight_layout()
    return fig

import numpy as np
import matplotlib.pyplot as plt
from _lib.common import setup_japanese_font, apply_common_axes

setup_japanese_font()


def render(data: dict, params: dict):
    features    = list(data.get('features',    []))
    importances = list(data.get('importances', []))

    if not features or not importances:
        raise ValueError('features と importances を指定してください')
    if len(features) != len(importances):
        raise ValueError('features と importances の長さが一致しません')

    vals = np.array(importances, dtype=float)

    # ソート
    if params.get('sort', True):
        idx      = np.argsort(vals)[::-1]
        features = [features[i] for i in idx]
        vals     = vals[idx]

    # top_n
    top_n = params.get('top_n')
    if top_n and int(top_n) > 0:
        n        = int(top_n)
        features = features[:n]
        vals     = vals[:n]

    w_cm, h_cm = params.get('figsize_cm', [14, 10])
    fig, ax = plt.subplots(figsize=(w_cm / 2.54, h_cm / 2.54))

    color    = params.get('color', '#6C63FF')
    bar_w    = float(params.get('bar_width', 0.7))
    tick_fs  = params.get('tick_fontsize', 10)
    orient   = params.get('orientation', 'horizontal')
    show_val = params.get('show_values', False)
    x        = np.arange(len(features))

    if orient == 'horizontal':
        bars = ax.barh(x, vals, bar_w, color=color, zorder=2)
        ax.set_yticks(x)
        ax.set_yticklabels(features, fontsize=tick_fs)
        ax.tick_params(axis='x', labelsize=tick_fs)
        if show_val:
            span = max(abs(float(vals.max())), 1e-9)
            for bar in bars:
                v = bar.get_width()
                ax.text(v + span * 0.01, bar.get_y() + bar.get_height() / 2,
                        f'{v:.4g}', va='center', fontsize=tick_fs - 1)
    else:
        bars = ax.bar(x, vals, bar_w, color=color, zorder=2)
        ax.set_xticks(x)
        ax.set_xticklabels(features, fontsize=tick_fs, rotation=45, ha='right')
        ax.tick_params(axis='y', labelsize=tick_fs)
        if show_val:
            span = max(abs(float(vals.max())), 1e-9)
            for bar in bars:
                v = bar.get_height()
                ax.text(bar.get_x() + bar.get_width() / 2, v + span * 0.01,
                        f'{v:.4g}', ha='center', fontsize=tick_fs - 1)

    ax.set_title(params.get('title',  ''), fontsize=params.get('fontsize', 12))
    ax.set_xlabel(params.get('xlabel', ''), fontsize=params.get('fontsize', 11))
    ax.set_ylabel(params.get('ylabel', ''), fontsize=params.get('fontsize', 11))

    apply_common_axes(ax, params)

    fig.tight_layout()
    return fig

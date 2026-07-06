import numpy as np
import matplotlib.pyplot as plt
from _lib.common import apply_common_axes, setup_japanese_font

setup_japanese_font()

_DEFAULT_COLORS = ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF']


def render(data: dict, params: dict):
    groups = data.get('groups', [])
    if not groups:
        raise ValueError('データを入力してください')

    n = len(groups)
    labels      = params.get('labels', [f'Group {i+1}' for i in range(n)])
    colors      = params.get('colors', _DEFAULT_COLORS)
    orientation = params.get('orientation', 'vertical')
    notch       = bool(params.get('notch', False))
    showfliers  = bool(params.get('showfliers', True))
    show_mean   = bool(params.get('show_mean', False))
    show_median = bool(params.get('show_median', True))
    show_points = bool(params.get('show_points', False))
    tick_fs     = params.get('tick_fontsize', 10)
    fs          = params.get('fontsize', 12)

    w_cm, h_cm = params.get('figsize_cm', [12, 10])
    fig, ax = plt.subplots(figsize=(w_cm / 2.54, h_cm / 2.54))

    vert = (orientation == 'vertical')
    median_color = 'black' if show_median else 'none'
    bp = ax.boxplot(
        groups, notch=notch, showfliers=showfliers, vert=vert,
        patch_artist=True, labels=labels,
        medianprops={'color': median_color, 'linewidth': 1.5},
        whiskerprops={'linewidth': 1}, capprops={'linewidth': 1},
        flierprops={'marker': 'o', 'markersize': 4, 'alpha': 0.5, 'markeredgewidth': 0.5},
    )
    for i, patch in enumerate(bp['boxes']):
        patch.set_facecolor(colors[i % len(colors)])
        patch.set_alpha(0.75)

    if show_points:
        pos = list(range(1, n + 1))
        for p_x, g in zip(pos, groups):
            jitter = [p_x + (i - len(g) / 2) * 0.02 for i in range(len(g))]
            if vert:
                ax.scatter(jitter, g, s=12, color='black', alpha=0.4, zorder=3)
            else:
                ax.scatter(g, jitter, s=12, color='black', alpha=0.4, zorder=3)

    if show_mean:
        means = [float(np.mean(g)) for g in groups]
        pos = list(range(1, n + 1))
        if vert:
            ax.scatter(pos, means, marker='D', color='black', s=25, zorder=3)
        else:
            ax.scatter(means, pos, marker='D', color='black', s=25, zorder=3)

    ax.tick_params(labelsize=tick_fs)
    if params.get('title'):
        ax.set_title(params['title'], fontsize=fs)
    if params.get('xlabel'):
        ax.set_xlabel(params['xlabel'], fontsize=fs)
    if params.get('ylabel'):
        ax.set_ylabel(params['ylabel'], fontsize=fs)

    apply_common_axes(ax, params)

    # 有意差ブラケット
    for b in params.get('brackets', []):
        _draw_bracket(ax, b.get('group1', 0) + 1, b.get('group2', 1) + 1,
                      b.get('height'), b.get('label', '*'), vert, groups, tick_fs)

    fig.tight_layout()
    return fig


def _draw_bracket(ax, x1, x2, height, label, vert, groups, fontsize):
    all_vals = [v for g in groups for v in g]
    if not all_vals:
        return
    data_range = max(all_vals) - min(all_vals) if all_vals else 1.0
    if height is None:
        relevant = [v for i in range(min(x1, x2) - 1, max(x1, x2)) if i < len(groups) for v in groups[i]]
        height = (max(relevant) if relevant else max(all_vals)) + data_range * 0.08

    gap = data_range * 0.02
    if vert:
        ax.plot([x1, x1, x2, x2], [height, height + gap, height + gap, height],
                'k-', lw=1, clip_on=False)
        ax.text((x1 + x2) / 2, height + gap * 1.5, label,
                ha='center', va='bottom', fontsize=fontsize)
    else:
        ax.plot([height, height + gap, height + gap, height], [x1, x1, x2, x2],
                'k-', lw=1, clip_on=False)
        ax.text(height + gap * 1.5, (x1 + x2) / 2, label,
                ha='left', va='center', fontsize=fontsize)

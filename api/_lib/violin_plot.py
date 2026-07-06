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
    alpha       = float(params.get('alpha', 0.7))
    edgecolor   = params.get('edgecolor', 'black')
    inner       = params.get('inner', 'box')
    show_mean   = bool(params.get('show_mean', False))
    show_median = bool(params.get('show_median', True))
    show_points = bool(params.get('show_points', False))
    orientation = params.get('orientation', 'vertical')
    tick_fs     = params.get('tick_fontsize', 10)
    fs          = params.get('fontsize', 12)

    w_cm, h_cm = params.get('figsize_cm', [12, 10])
    fig, ax = plt.subplots(figsize=(w_cm / 2.54, h_cm / 2.54))

    vert = (orientation == 'vertical')
    # violinplot requires ≥2 points
    valid = [g if len(g) >= 2 else list(g) + list(g) for g in groups]

    parts = ax.violinplot(valid, vert=vert, showmedians=show_median, showextrema=True)

    for i, pc in enumerate(parts['bodies']):
        pc.set_facecolor(colors[i % len(colors)])
        pc.set_alpha(alpha)
        pc.set_edgecolor(edgecolor)
        pc.set_linewidth(0.5)

    for key in ('cbars', 'cmins', 'cmaxes', 'cmedians'):
        if key in parts:
            parts[key].set_color(edgecolor)
            parts[key].set_linewidth(1)

    positions = list(range(1, n + 1))

    if inner == 'box':
        ax.boxplot(valid, vert=vert, widths=0.1, patch_artist=False,
                   positions=positions,
                   medianprops={'color': 'white', 'linewidth': 1.5},
                   whiskerprops={'linewidth': 0.8, 'color': '#555'},
                   capprops={'linewidth': 0.8, 'color': '#555'},
                   boxprops={'linewidth': 0.8, 'color': '#555'},
                   flierprops={'marker': 'o', 'markersize': 2, 'alpha': 0.4})
    elif inner == 'stick':
        for pos, g in zip(positions, valid):
            if vert:
                ax.scatter([pos] * len(g), g, s=1.5, color='black', alpha=0.4, zorder=2)
            else:
                ax.scatter(g, [pos] * len(g), s=1.5, color='black', alpha=0.4, zorder=2)

    if show_points:
        for pos, g in zip(positions, valid):
            jitter = [pos + (i - len(g) / 2) * 0.02 for i in range(len(g))]
            if vert:
                ax.scatter(jitter, g, s=12, color='black', alpha=0.4, zorder=3)
            else:
                ax.scatter(g, jitter, s=12, color='black', alpha=0.4, zorder=3)

    if show_mean:
        import numpy as np
        means = [float(np.mean(g)) for g in valid]
        if vert:
            ax.scatter(positions, means, marker='D', color='black', s=25, zorder=3)
        else:
            ax.scatter(means, positions, marker='D', color='black', s=25, zorder=3)

    if vert:
        ax.set_xticks(positions)
        ax.set_xticklabels(labels, fontsize=tick_fs)
    else:
        ax.set_yticks(positions)
        ax.set_yticklabels(labels, fontsize=tick_fs)

    ax.tick_params(labelsize=tick_fs)
    if params.get('title'):
        ax.set_title(params['title'], fontsize=fs)
    if params.get('xlabel'):
        ax.set_xlabel(params['xlabel'], fontsize=fs)
    if params.get('ylabel'):
        ax.set_ylabel(params['ylabel'], fontsize=fs)

    apply_common_axes(ax, params)

    # 有意差ブラケット（box_plot と同じヘルパーを再利用）
    from _lib.box_plot import _draw_bracket
    for b in params.get('brackets', []):
        _draw_bracket(ax, b.get('group1', 0) + 1, b.get('group2', 1) + 1,
                      b.get('height'), b.get('label', '*'), vert, groups, tick_fs)

    fig.tight_layout()
    return fig

import numpy as np
import matplotlib.pyplot as plt
from _lib.common import setup_japanese_font, apply_common_axes, apply_legend

setup_japanese_font()

_DEFAULT_COLORS = ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF']


def _apply_merge(labels, arr, params):
    """単一系列の場合のみ、閾値でカテゴリを1本にまとめる。"""
    merge_thr = params.get('merge_threshold')
    if merge_thr is None:
        return labels, arr

    vals = arr[0]
    merge_dir = params.get('merge_dir', 'below')
    merge_label = params.get('merge_label') or 'その他'

    if merge_dir == 'below':
        mask = vals < float(merge_thr)
    else:
        mask = vals > float(merge_thr)

    if not mask.any():
        return labels, arr

    others_val = float(vals[mask].sum())
    new_labels = [l for l, m in zip(labels, mask) if not m] + [merge_label]
    new_vals = np.append(vals[~mask], others_val)
    return new_labels, new_vals[np.newaxis, :]


def render(data: dict, params: dict):
    labels = list(data.get('labels', []))
    values = data.get('values', [])
    if not labels or not values:
        raise ValueError('labels と values を指定してください')

    is_grouped = isinstance(values[0], list)
    arr = np.array(values, dtype=float)
    if not is_grouped:
        arr = arr[np.newaxis, :]  # (1, n_categories)

    n_series, n_cats = arr.shape
    if n_cats != len(labels):
        raise ValueError('labels の数と values の列数が一致しません')

    # まとめ処理（単一系列のみ）
    if not is_grouped:
        labels, arr = _apply_merge(labels, arr, params)
        n_series, n_cats = arr.shape

    w_cm, h_cm = params.get('figsize_cm', [14, 10])
    fig, ax = plt.subplots(figsize=(w_cm / 2.54, h_cm / 2.54))

    colors   = params.get('colors', _DEFAULT_COLORS)
    legend   = params.get('legend', [])
    orient   = params.get('orientation', 'vertical')
    show_v   = params.get('show_values', False)
    tick_fs  = params.get('tick_fontsize', 10)
    bar_w    = float(params.get('bar_width', 0.8)) / n_series
    bar_colors_param = params.get('bar_colors')  # per-bar color override

    x = np.arange(n_cats)

    for i, row in enumerate(arr):
        offset = (i - (n_series - 1) / 2) * bar_w
        color  = colors[i % len(colors)]
        label  = legend[i] if i < len(legend) else (f'Series {i+1}' if n_series > 1 else None)

        if orient == 'horizontal':
            bars = ax.barh(x + offset, row, bar_w, label=label, color=color, zorder=2)
        else:
            bars = ax.bar(x + offset, row, bar_w, label=label, color=color, zorder=2)

        # 棒ごとの色（単一系列かつ bar_colors が指定された場合）
        if i == 0 and bar_colors_param and n_series == 1:
            for j, bar in enumerate(bars):
                if j < len(bar_colors_param):
                    bar.set_facecolor(bar_colors_param[j])

        if show_v:
            span = max(abs(row.max()), abs(row.min()), 1e-9)
            for bar in bars:
                if orient == 'horizontal':
                    val = bar.get_width()
                    ax.text(val + span * 0.01, bar.get_y() + bar.get_height() / 2,
                            f'{val:.2g}', va='center', fontsize=tick_fs - 1)
                else:
                    val = bar.get_height()
                    ax.text(bar.get_x() + bar.get_width() / 2, val + span * 0.01,
                            f'{val:.2g}', ha='center', fontsize=tick_fs - 1)

    if orient == 'horizontal':
        ax.set_yticks(x)
        ax.set_yticklabels(labels, fontsize=tick_fs)
        ax.tick_params(axis='x', labelsize=tick_fs)
    else:
        ax.set_xticks(x)
        ax.set_xticklabels(labels, fontsize=tick_fs)
        ax.tick_params(axis='y', labelsize=tick_fs)

    ax.set_title(params.get('title', ''), fontsize=params.get('fontsize', 12))
    ax.set_xlabel(params.get('xlabel', ''), fontsize=params.get('fontsize', 11))
    ax.set_ylabel(params.get('ylabel', ''), fontsize=params.get('fontsize', 11))

    apply_common_axes(ax, params)
    apply_legend(ax, params, n_series, tick_fs)

    # 閾値線
    thr = params.get('threshold_line')
    if thr is not None:
        thr_color = params.get('threshold_line_color', '#EF4444')
        thr_style = params.get('threshold_line_style', '--')
        if orient == 'horizontal':
            ax.axvline(float(thr), color=thr_color, linestyle=thr_style, linewidth=1.5, zorder=3)
        else:
            ax.axhline(float(thr), color=thr_color, linestyle=thr_style, linewidth=1.5, zorder=3)

    fig.tight_layout()
    return fig

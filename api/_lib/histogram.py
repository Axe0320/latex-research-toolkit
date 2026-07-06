import numpy as np
import matplotlib.pyplot as plt
from _lib.common import setup_japanese_font, apply_common_axes

setup_japanese_font()


def render(data: list, params: dict):
    if not data:
        raise ValueError('データを入力してください')

    w_cm, h_cm = params.get('figsize_cm', [12, 10])
    fig, ax = plt.subplots(figsize=(w_cm / 2.54, h_cm / 2.54))

    ax.hist(
        np.array(data, dtype=float),
        bins=int(params.get('bins', 20)),
        color=params.get('color', '#6C63FF'),
        density=bool(params.get('density', False)),
        edgecolor='white',
        linewidth=0.5,
        zorder=2,
    )

    tick_fs = params.get('tick_fontsize', 10)
    ax.tick_params(labelsize=tick_fs)
    ax.set_title(params.get('title',  ''), fontsize=params.get('fontsize', 12))
    ax.set_xlabel(params.get('xlabel', ''), fontsize=params.get('fontsize', 11))
    ylabel = params.get('ylabel', '') or ('Density' if params.get('density') else 'Frequency')
    ax.set_ylabel(ylabel, fontsize=params.get('fontsize', 11))

    # histogram は y 軸のみ共通設定（x 軸範囲・目盛は xlim/xtick_step なし）
    apply_common_axes(ax, params)

    fig.tight_layout()
    return fig

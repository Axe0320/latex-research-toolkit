import numpy as np
import matplotlib.pyplot as plt
from _lib.common import setup_japanese_font

setup_japanese_font()

_DEFAULT_COLORS = ['#6C63FF', '#FF6584', '#43CFAA', '#FFB347', '#5BC0EB', '#C879FF',
                   '#A78BFA', '#FB923C', '#34D399', '#60A5FA', '#F472B6', '#FBBF24']


def render(data: dict, params: dict):
    labels = list(data.get('labels', []))
    values = list(data.get('values', []))

    if not labels or not values:
        raise ValueError('labels と values を指定してください')
    if len(labels) != len(values):
        raise ValueError('labels と values の数が一致しません')

    vals = np.array(values, dtype=float)
    if vals.sum() <= 0:
        raise ValueError('values の合計が 0 以下です')

    w_cm, h_cm = params.get('figsize_cm', [12, 10])
    fig, ax = plt.subplots(figsize=(w_cm / 2.54, h_cm / 2.54))

    colors     = params.get('colors', _DEFAULT_COLORS)[:len(labels)]
    startangle = float(params.get('startangle', 90))
    show_pct   = params.get('autopct', True)
    pctdist    = float(params.get('pctdistance', 0.8))
    shadow     = params.get('shadow', False)
    donut      = float(params.get('donut', 0.0))
    tick_fs    = params.get('tick_fontsize', 10)
    fontsize   = params.get('fontsize', 12)

    explode_param = params.get('explode', [])
    explode = [float(explode_param[i]) if i < len(explode_param) else 0.0
               for i in range(len(labels))]

    autopct_str = f'%1.1f%%' if show_pct else None

    wedges, texts, autotexts = ax.pie(
        vals,
        labels=labels,
        colors=colors,
        startangle=startangle,
        autopct=autopct_str,
        pctdistance=pctdist,
        shadow=shadow,
        explode=explode if any(e > 0 for e in explode) else None,
    ) if show_pct else (*ax.pie(
        vals,
        labels=labels,
        colors=colors,
        startangle=startangle,
        shadow=shadow,
        explode=explode if any(e > 0 for e in explode) else None,
    ), [])

    for t in texts:
        t.set_fontsize(tick_fs)
    for at in autotexts:
        at.set_fontsize(tick_fs - 1)

    if donut > 0:
        circle = plt.Circle((0, 0), min(max(donut, 0.1), 0.9), color='white')
        ax.add_artist(circle)

    ax.set_title(params.get('title', ''), fontsize=fontsize)

    loc = params.get('legend_loc', 'none')
    if loc != 'none':
        if loc == 'outside':
            ax.legend(wedges, labels, loc='upper left',
                      bbox_to_anchor=(1.02, 1), borderaxespad=0, fontsize=tick_fs)
        else:
            ax.legend(wedges, labels, loc=loc, fontsize=tick_fs)

    fig.tight_layout()
    return fig

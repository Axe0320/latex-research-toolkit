import io
import os
import matplotlib.pyplot as plt


def setup_japanese_font() -> None:
    import matplotlib as mpl
    from matplotlib import font_manager
    mpl.rcParams['axes.unicode_minus'] = False
    font_path = os.path.join(os.path.dirname(__file__), 'ipaexg.ttf')
    if os.path.exists(font_path):
        font_manager.fontManager.addfont(font_path)
        mpl.rcParams['font.family'] = 'IPAexGothic'


def fig_to_bytes(fig, fmt: str = 'png', dpi: int = 150) -> bytes:
    buf = io.BytesIO()
    fig.savefig(buf, format=fmt, dpi=dpi, bbox_inches='tight')
    plt.close(fig)
    return buf.getvalue()


def apply_common_axes(ax, params: dict) -> None:
    """グリッド・軸範囲・目盛間隔をまとめて適用する。"""
    from matplotlib.ticker import MultipleLocator

    # グリッド
    if params.get('show_grid', False):
        ax.grid(True, linestyle=params.get('grid_linestyle', '--'), alpha=0.4, zorder=0)
    else:
        ax.grid(False)

    # 軸範囲
    xlim = params.get('xlim')
    if xlim and len(xlim) == 2:
        ax.set_xlim(xlim[0], xlim[1])
    ylim = params.get('ylim')
    if ylim and len(ylim) == 2:
        ax.set_ylim(ylim[0], ylim[1])

    # 目盛間隔
    xtick_step = params.get('xtick_step')
    if xtick_step and xtick_step > 0:
        ax.xaxis.set_major_locator(MultipleLocator(xtick_step))
    ytick_step = params.get('ytick_step')
    if ytick_step and ytick_step > 0:
        ax.yaxis.set_major_locator(MultipleLocator(ytick_step))


def apply_legend(ax, params: dict, n_series: int, tick_fs: int) -> None:
    """凡例を配置する。legend_loc='outside' のとき axes 外に出す。"""
    if n_series <= 1 and not params.get('legend'):
        return
    loc = params.get('legend_loc', 'best')
    if loc == 'outside':
        ax.legend(loc='upper left', bbox_to_anchor=(1.02, 1),
                  borderaxespad=0, fontsize=tick_fs)
    else:
        ax.legend(loc=loc, fontsize=tick_fs)

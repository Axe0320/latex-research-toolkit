from http.server import BaseHTTPRequestHandler
import json
import base64
import importlib
import io
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.image as mpimg


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length))
        except Exception:
            self._respond(400, {'error': 'Invalid JSON'})
            return

        figures = body.get('figures', [])
        layout  = body.get('layout', {})
        fmt     = body.get('output', {}).get('format', 'png')
        dpi     = int(body.get('output', {}).get('dpi', 150))

        if not figures:
            self._respond(400, {'error': 'No figures provided'})
            return

        try:
            from _lib.common import fig_to_bytes

            rendered: list[bytes] = []
            for spec in figures:
                figure_type = spec.get('type', '')
                if not figure_type.replace('_', '').isalnum():
                    self._respond(400, {'error': f'Unknown type: {figure_type}'})
                    return

                try:
                    mod = importlib.import_module(f'_lib.{figure_type}')
                except ModuleNotFoundError as e:
                    if e.name == f'_lib.{figure_type}':
                        self._respond(400, {'error': f'Unknown type: {figure_type}'})
                    else:
                        self._respond(500, {'error': f'Dependency missing: {e}'})
                    return

                fig = mod.render(spec.get('data'), spec.get('params', {}))
                rendered.append(fig_to_bytes(fig, 'png', dpi))

            cols      = max(1, int(layout.get('gridCols', 2)))
            grid_rows = int(layout.get('gridRows', 0))
            gap_in    = float(layout.get('gap', 0.5)) / 2.54   # cm → inches

            # Load rendered PNGs as float arrays via matplotlib
            images = [mpimg.imread(io.BytesIO(b)) for b in rendered]
            n      = len(images)
            rows   = grid_rows if grid_rows > 0 else math.ceil(n / cols)

            # Image sizes in inches at the target DPI
            img_w = [img.shape[1] / dpi for img in images]
            img_h = [img.shape[0] / dpi for img in images]

            # Maximum cell dimensions per column / row
            col_w = [
                max((img_w[r * cols + c] for r in range(rows) if r * cols + c < n), default=0.0)
                for c in range(cols)
            ]
            row_h = [
                max((img_h[r * cols + c] for c in range(cols) if r * cols + c < n), default=0.0)
                for r in range(rows)
            ]

            fig_w = sum(col_w) + gap_in * (cols + 1)
            fig_h = sum(row_h) + gap_in * (rows + 1)

            compose_fig = plt.figure(figsize=(fig_w, fig_h), facecolor='white')

            for i, img in enumerate(images):
                r, c = divmod(i, cols)

                # Cell top-left (inches from figure top-left, y increases downward)
                cell_x = gap_in * (c + 1) + sum(col_w[:c])
                cell_y = gap_in * (r + 1) + sum(row_h[:r])

                # Centre image within cell
                off_x = (col_w[c] - img_w[i]) / 2
                off_y = (row_h[r] - img_h[i]) / 2

                img_left = cell_x + off_x
                img_top  = cell_y + off_y

                # matplotlib axes use bottom-left origin, y increasing upward
                img_bot = fig_h - img_top - img_h[i]

                ax = compose_fig.add_axes([
                    img_left / fig_w,
                    img_bot  / fig_h,
                    img_w[i] / fig_w,
                    img_h[i] / fig_h,
                ])
                ax.imshow(img, interpolation='nearest', aspect='auto')
                ax.axis('off')

            buf = io.BytesIO()
            compose_fig.savefig(buf, format=fmt, dpi=dpi,
                                bbox_inches=None, facecolor='white', edgecolor='none')
            plt.close(compose_fig)
            buf.seek(0)
            b64 = base64.b64encode(buf.read()).decode()
            self._respond(200, {'image': b64})

        except ValueError as e:
            self._respond(400, {'error': str(e)})
        except Exception as e:
            self._respond(500, {'error': str(e)})

    def _respond(self, status: int, body: dict):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())

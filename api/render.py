from http.server import BaseHTTPRequestHandler
import json
import base64
import importlib
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import matplotlib
matplotlib.use('Agg')


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length))
        except Exception:
            self._respond(400, {'error': 'Invalid JSON'})
            return

        figure_type = body.get('type', '')
        data        = body.get('data')
        params      = body.get('params', {})
        fmt         = body.get('output', {}).get('format', 'png')

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

        try:
            from _lib.common import fig_to_bytes
            fig = mod.render(data, params)
            raw = fig_to_bytes(fig, fmt, params.get('dpi', 150))
            b64 = base64.b64encode(raw).decode()
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

from http.server import BaseHTTPRequestHandler
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length))
        except Exception:
            self._respond(400, {'error': 'Invalid JSON'})
            return

        image_b64   = body.get('image', '')
        figure_type = body.get('type', '')
        provider    = body.get('provider', 'claude')
        api_key     = body.get('api_key', '')

        if not image_b64:
            self._respond(400, {'error': '画像が必要です'})
            return
        if not api_key:
            self._respond(400, {'error': 'APIキーが必要です'})
            return

        from _lib.vision import SCHEMAS, call_vision, classify_and_extract

        if figure_type == 'auto':
            try:
                result = classify_and_extract(image_b64, SCHEMAS, provider, api_key)
                detected_type = result.pop('type', '')
                self._respond(200, {'extracted': result, 'type': detected_type})
            except Exception as e:
                self._respond(500, {'error': str(e)})
            return

        schema = SCHEMAS.get(figure_type)
        if schema is None:
            self._respond(400, {'error': f'未対応の図種: {figure_type}'})
            return

        try:
            result = call_vision(image_b64, figure_type, schema, provider, api_key)
            self._respond(200, {'extracted': result, 'type': figure_type})
        except Exception as e:
            self._respond(500, {'error': str(e)})

    def _respond(self, status: int, body: dict):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(body, ensure_ascii=False).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

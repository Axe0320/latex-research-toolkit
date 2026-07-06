"""
Text-based AI extraction for Citation/Table's "AI解析": the user pastes text
or uploads a file directly (instead of an image) and an LLM structures it
into the same citation_list/table_data schema Chart's image OCR already
uses. Deliberately a separate endpoint from api/ocr.py (image-only, used by
Chart) rather than making `image` optional there — keeps that working path
untouched and this one's request shape simple.
"""
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

        text     = body.get('text', '')
        domain   = body.get('domain', '')
        provider = body.get('provider', 'claude')
        api_key  = body.get('api_key', '')

        if not text.strip():
            self._respond(400, {'error': 'テキストが必要です'})
            return
        if not api_key:
            self._respond(400, {'error': 'APIキーが必要です'})
            return

        from _lib.vision import SCHEMAS, FIGURE_TYPE_JA, call_vision_text

        schema = SCHEMAS.get(domain)
        if not schema:
            self._respond(400, {'error': f'Unknown domain: {domain}'})
            return
        label = FIGURE_TYPE_JA.get(domain, domain)

        try:
            result = call_vision_text(text, schema, label, provider, api_key)
            self._respond(200, {'extracted': result})
        except Exception as e:
            self._respond(500, {'error': str(e)})

    def _respond(self, status: int, body: dict):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())

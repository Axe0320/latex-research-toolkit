"""
Local dev server for api/*.py — runs each handler class on its own port,
exactly as `HTTPServer(addr, handler_cls)` would (the same code path Vercel
invokes in production), without requiring `vercel dev` (which links the
project to a Vercel Cloud account; this repo's policy is to defer all Vercel
interaction to Phase 8's deploy). Pair with `npm run dev`, which proxies each
`/api/*` route to its port here (see vite.config.ts).

Usage:
    python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
    .venv/Scripts/python scripts/dev-api-server.py
"""
import sys
import os
import threading
from http.server import HTTPServer

API_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'api')
sys.path.insert(0, API_DIR)
os.chdir(API_DIR)

import render, compose, stat_test, ocr  # noqa: E402

# Route -> (handler class, port). One HTTPServer per handler — matches how
# Vercel runs each api/*.py as its own isolated function.
ROUTES = {
    'render': (render.handler, 8801),
    'compose': (compose.handler, 8802),
    'stat_test': (stat_test.handler, 8803),
    'ocr': (ocr.handler, 8804),
}

if __name__ == '__main__':
    servers = []
    for name, (handler_cls, port) in ROUTES.items():
        srv = HTTPServer(('127.0.0.1', port), handler_cls)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        servers.append(srv)
        print(f'/api/{name} -> http://127.0.0.1:{port}')

    print('dev api server ready (Ctrl+C to stop)')
    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        for srv in servers:
            srv.shutdown()

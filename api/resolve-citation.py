"""
Server-side proxy for fetching a publisher page's HTML so the Citation module
can extract a DOI from its meta tags (citation_doi / prism.doi / DC.Identifier)
without hitting CORS. Replaces the client's prior fallback to public proxies
(corsproxy.io, api.allorigins.win) — see docs/01-architecture.md §2.6.

SSRF guard: only known academic-publisher hosts (docs/01-architecture.md §2.6,
citation-bibtex-converter README "対応ソース" table) are fetchable, over HTTPS
only. The redirect target is re-validated against the same allowlist so a
disallowed host can't be reached via a redirect from an allowed one.
"""
from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.error
from urllib.parse import urlparse

ALLOWED_HOSTS = {
    'doi.org',
    'dx.doi.org',
    'dl.acm.org',
    'link.springer.com',
    'ieeexplore.ieee.org',
    'sciencedirect.com',
    'www.sciencedirect.com',
}

FETCH_TIMEOUT_SEC = 10
MAX_BYTES = 2 * 1024 * 1024  # 2MB cap — plenty for an HTML <head>, bounds response size


def _is_allowed(url: str) -> bool:
    try:
        parsed = urlparse(url)
    except ValueError:
        return False
    if parsed.scheme != 'https':
        return False
    return (parsed.hostname or '').lower() in ALLOWED_HOSTS


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length))
        except Exception:
            self._respond(400, {'error': 'Invalid JSON'})
            return

        url = body.get('url', '')
        if not isinstance(url, str) or not url:
            self._respond(400, {'error': 'url is required'})
            return

        if not _is_allowed(url):
            self._respond(400, {'error': 'このドメインはサポートされていません'})
            return

        req = urllib.request.Request(
            url,
            headers={
                'Accept': 'text/html,application/xhtml+xml',
                'User-Agent': 'Mozilla/5.0 (compatible; LaTeXResearchToolkit/1.0)',
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=FETCH_TIMEOUT_SEC) as res:
                if not _is_allowed(res.geturl()):
                    self._respond(400, {'error': 'リダイレクト先が許可されていません'})
                    return
                html = res.read(MAX_BYTES).decode('utf-8', errors='replace')
        except urllib.error.HTTPError as e:
            self._respond(e.code, {'error': f'HTTP {e.code}'})
            return
        except Exception:
            self._respond(502, {'error': '取得に失敗しました'})
            return

        self._respond(200, {'html': html})

    def _respond(self, status: int, body: dict):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())

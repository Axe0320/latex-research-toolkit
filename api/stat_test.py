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

        g1   = body.get('group1', [])
        g2   = body.get('group2', [])
        test = body.get('test', 'mannwhitney')

        if len(g1) < 2 or len(g2) < 2:
            self._respond(400, {'error': 'データが2件以上必要です'})
            return

        try:
            from scipy import stats
            if test == 'ttest':
                result = stats.ttest_ind(g1, g2)
            elif test == 'welch':
                result = stats.ttest_ind(g1, g2, equal_var=False)
            else:
                result = stats.mannwhitneyu(g1, g2, alternative='two-sided')

            p = float(result.pvalue)
            if p < 0.001:
                label = '***'
            elif p < 0.01:
                label = '**'
            elif p < 0.05:
                label = '*'
            else:
                label = 'ns'

            self._respond(200, {'p_value': p, 'label': label})
        except Exception as e:
            self._respond(500, {'error': str(e)})

    def _respond(self, status: int, body: dict):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())

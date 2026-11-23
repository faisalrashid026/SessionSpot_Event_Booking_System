"""Loopback-only static QA harness. No application backend or database.

Routes compare the immutable approved extraction, serve current files, or
exercise native forms with scripts blocked, failed initialization or storage
failures. These injections never alter application files.
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import sys
import threading

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / 'qa/improvements'
BASE = QA / 'approved-baseline/SessionSpot-Part2'
LOCK = threading.Lock()
class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        url = urlsplit(path)
        parts = unquote(url.path).strip('/').split('/')
        scope = parts.pop(0) if parts and parts[0] in {'baseline','nojs','failed-init','quota','denied','package'} else 'current'
        self.scope = scope
        root = BASE if scope == 'baseline' else ROOT
        if scope == 'package':
            root = Path((QA / 'package-root.txt').read_text().strip())
        target = root.joinpath(*parts).resolve()
        if not target.is_relative_to(root.resolve()): return str(root / 'missing')
        return str(target)
    def end_headers(self):
        self.send_header('Cache-Control','no-store')
        if getattr(self,'scope','') == 'nojs': self.send_header('Content-Security-Policy', "script-src 'none'; object-src 'none'")
        super().end_headers()
    def do_GET(self):
        self.translate_path(self.path)
        url = urlsplit(self.path)
        with LOCK:
            with (QA / 'server-requests.jsonl').open('a') as f: f.write(json.dumps({'method':'GET','path':url.path,'query':url.query})+'\n')
        if self.scope == 'failed-init' and url.path.endswith('/js/app.js'):
            body=b'throw new Error("Intentional QA initialization failure");'
            self.send_response(200); self.send_header('Content-Type','text/javascript'); self.send_header('Content-Length',str(len(body))); self.end_headers(); self.wfile.write(body); return
        target = Path(self.translate_path(self.path))
        if self.scope in {'quota','denied'} and target.suffix == '.html' and target.is_file():
            if self.scope == 'quota': script="const realSet = Storage.prototype.setItem; Storage.prototype.setItem = function(k,v) { if(this === localStorage) throw new DOMException('QA quota failure','QuotaExceededError'); return realSet.call(this,k,v); };"
            else: script="Object.defineProperty(window,'localStorage',{get(){throw new DOMException('QA denied storage','SecurityError');}});"
            body=target.read_text().replace('<head>', '<head><script>'+script+'</script>',1).encode()
            self.send_response(200); self.send_header('Content-Type','text/html'); self.send_header('Content-Length',str(len(body))); self.end_headers(); self.wfile.write(body); return
        super().do_GET()
    def do_POST(self):
        with LOCK:
            with (QA / 'server-requests.jsonl').open('a') as f: f.write(json.dumps({'method':'POST','path':urlsplit(self.path).path})+'\n')
        self.send_error(405,'The UI QA server does not process form submissions')
    def log_message(self,*args): pass
if __name__ == '__main__':
    QA.mkdir(exist_ok=True)
    ThreadingHTTPServer(('127.0.0.1',int(sys.argv[1]) if len(sys.argv)>1 else 8004),Handler).serve_forever()

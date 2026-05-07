#!/usr/bin/env python3
import http.server
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

handler = http.server.SimpleHTTPRequestHandler
with http.server.HTTPServer(("", PORT), handler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()

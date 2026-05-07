#!/usr/bin/env python3
import http.server
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

handler = http.server.SimpleHTTPRequestHandler
with http.server.HTTPServer(("0.0.0.0", PORT), handler) as httpd:
    print(f"Serving at http://0.0.0.0:{PORT}")
    httpd.serve_forever()

#!/usr/bin/env python3
"""Static server for the Little Heart Heroes site with caching disabled,
so the preview always reflects the latest edits (no stale pages)."""
import http.server
import socketserver
import os

PORT = 9100
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static-site")


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
        print(f"Serving {DIRECTORY} at http://localhost:{PORT} (no-cache)")
        httpd.serve_forever()

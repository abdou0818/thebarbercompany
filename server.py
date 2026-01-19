import os
import json
import time
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.getcwd()

class APIServerHandler(SimpleHTTPRequestHandler):
    def _set_headers(self, status=200, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def _read_json(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length) if length > 0 else b''
        try:
            return json.loads(body.decode('utf-8') or '{}')
        except Exception:
            return {}

    def _write_json_file(self, filename, data):
        path = os.path.join(ROOT, filename)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def _read_json_file(self, filename, default):
        path = os.path.join(ROOT, filename)
        if not os.path.exists(path):
            return default
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return default

    def _bump_version(self):
        doc = self._read_json_file('settings-version.json', {"version": 1, "updatedAt": datetime.now(timezone.utc).isoformat(), "settings": {}})
        v = doc.get('version', 1)
        doc['version'] = v + 1 if isinstance(v, int) else int(time.time())
        doc['updatedAt'] = datetime.now(timezone.utc).isoformat()
        self._write_json_file('settings-version.json', doc)
        return doc['version']

    def _get_admin_token(self):
        doc = self._read_json_file('settings-version.json', {"version": 1, "updatedAt": datetime.now(timezone.utc).isoformat(), "settings": {}})
        token = doc.get('adminToken', '')
        if isinstance(token, str):
            return token
        return ''

    def _require_admin(self):
        expected = self._get_admin_token()
        # If token not set yet, allow for bootstrap
        if not expected:
            return True
        provided = self.headers.get('X-Admin-Token', '')
        if provided == expected:
            return True
        self._set_headers(403)
        self.wfile.write(json.dumps({"error": "Forbidden: invalid admin token"}, ensure_ascii=False).encode('utf-8'))
        return False

    def do_GET(self):
        if self.path.startswith('/api/settings'):
            data = self._read_json_file('settings-version.json', {"version": 1, "updatedAt": datetime.now(timezone.utc).isoformat(), "settings": {}})
            self._set_headers()
            self.wfile.write(json.dumps(data.get('settings', {}), ensure_ascii=False).encode('utf-8'))
            return
        if self.path.startswith('/api/contacts'):
            data = self._read_json_file('contacts.json', [])
            self._set_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
            return
        if self.path.startswith('/api/gallery'):
            data = self._read_json_file('gallery.json', [])
            self._set_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
            return
        if self.path.startswith('/api/background'):
            data = self._read_json_file('background.json', None)
            self._set_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
            return
        return super().do_GET()

    def do_POST(self):
        # Admin token setup (bootstrap or update)
        if self.path.startswith('/api/admin-token'):
            body = self._read_json()
            new_token = str(body.get('token', '')).strip()
            if not new_token:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "Missing token"}, ensure_ascii=False).encode('utf-8'))
                return
            doc = self._read_json_file('settings-version.json', {"version": 1, "updatedAt": datetime.now(timezone.utc).isoformat(), "settings": {}})
            existing = doc.get('adminToken', '')
            # If token already exists, require valid current token
            if existing:
                provided = self.headers.get('X-Admin-Token', '')
                if provided != existing:
                    self._set_headers(403)
                    self.wfile.write(json.dumps({"error": "Forbidden: invalid current token"}, ensure_ascii=False).encode('utf-8'))
                    return
            doc['adminToken'] = new_token
            # bump version to notify clients
            v = doc.get('version', 1)
            doc['version'] = v + 1 if isinstance(v, int) else int(time.time())
            doc['updatedAt'] = datetime.now(timezone.utc).isoformat()
            self._write_json_file('settings-version.json', doc)
            self._set_headers()
            self.wfile.write(json.dumps({"ok": True}, ensure_ascii=False).encode('utf-8'))
            return

        # Require admin token for write endpoints
        if not self._require_admin():
            return

        if self.path.startswith('/api/settings'):
            body = self._read_json()
            settings = body.get('settings', body)
            doc = self._read_json_file('settings-version.json', {"version": 1, "updatedAt": datetime.now(timezone.utc).isoformat(), "settings": {}})
            doc['settings'] = settings if isinstance(settings, dict) else {}
            v = doc.get('version', 1)
            doc['version'] = v + 1 if isinstance(v, int) else int(time.time())
            doc['updatedAt'] = datetime.now(timezone.utc).isoformat()
            self._write_json_file('settings-version.json', doc)
            self._set_headers()
            self.wfile.write(json.dumps({"ok": True, "version": doc['version']}, ensure_ascii=False).encode('utf-8'))
            return
        if self.path.startswith('/api/contacts'):
            body = self._read_json()
            contacts = body.get('contacts', body)
            if not isinstance(contacts, list):
                contacts = []
            self._write_json_file('contacts.json', contacts)
            ver = self._bump_version()
            self._set_headers()
            self.wfile.write(json.dumps({"ok": True, "count": len(contacts), "version": ver}, ensure_ascii=False).encode('utf-8'))
            return
        if self.path.startswith('/api/gallery'):
            body = self._read_json()
            images = body.get('images', body)
            if not isinstance(images, list):
                images = []
            self._write_json_file('gallery.json', images)
            ver = self._bump_version()
            self._set_headers()
            self.wfile.write(json.dumps({"ok": True, "count": len(images), "version": ver}, ensure_ascii=False).encode('utf-8'))
            return
        if self.path.startswith('/api/background'):
            body = self._read_json()
            if body.get('clear'):
                path = os.path.join(ROOT, 'background.json')
                try:
                    if os.path.exists(path):
                        os.remove(path)
                except Exception:
                    pass
                ver = self._bump_version()
                self._set_headers()
                self.wfile.write(json.dumps({"ok": True, "cleared": True, "version": ver}, ensure_ascii=False).encode('utf-8'))
                return
            bg = body
            self._write_json_file('background.json', bg)
            ver = self._bump_version()
            self._set_headers()
            self.wfile.write(json.dumps({"ok": True, "version": ver}, ensure_ascii=False).encode('utf-8'))
            return
        self._set_headers(404)
        self.wfile.write(json.dumps({"error": "Not Found"}, ensure_ascii=False).encode('utf-8'))


def run(port=8001):
    server = ThreadingHTTPServer(('', port), APIServerHandler)
    print(f"Serving with API on port {port} (http://localhost:{port}/)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    import sys
    p = 8001
    if len(sys.argv) > 1:
        try:
            p = int(sys.argv[1])
        except Exception:
            pass
    run(p)
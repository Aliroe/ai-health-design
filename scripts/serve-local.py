#!/usr/bin/env python3
"""本地预览服务器：模拟 vercel.json 的 rewrites 路由。
用法: python3 scripts/serve-local.py [端口]  (默认 8000)
"""
import json
import mimetypes
import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = json.load(open(os.path.join(ROOT, "vercel.json")))


def _match(pattern, path):
    """支持 vercel 的 :param 与 :param* 通配模式。"""
    if pattern == path:
        return {}
    if ":" not in pattern:
        return None
    rx = re.escape(pattern)
    rx = rx.replace(r":", ":").replace(r"\*", "*")
    rx = rx.replace(":", r"\:") if False else rx
    # 先处理 :param*（贪婪多段），再处理 :param（单段）
    tokens = []
    i = 0
    while i < len(rx):
        if rx[i] == ":":
            j = i + 1
            while j < len(rx) and (rx[j].isalnum() or rx[j] == "_"):
                j += 1
            name = rx[i + 1:j]
            greedy = j < len(rx) and rx[j] == "*"
            if greedy:
                tokens.append("(?P<%s>.*)" % name)
                i = j + 1
            else:
                tokens.append("(?P<%s>[^/]+)" % name)
                i = j
        else:
            tokens.append(re.escape(rx[i]))
            i += 1
    regex = "^" + "".join(tokens) + "$"
    m = re.match(regex, path)
    return m.groupdict() if m else None


def resolve(path):
    for r in CONFIG.get("rewrites", []):
        params = _match(r["source"], path)
        if params is not None:
            dest = r["destination"]
            for k, v in params.items():
                dest = dest.replace(":" + k + "*", v).replace(":" + k, v)
            return dest
    for r in CONFIG.get("redirects", []):
        params = _match(r["source"], path)
        if params is not None:
            dest = r["destination"]
            for k, v in params.items():
                dest = dest.replace(":" + k + "*", v).replace(":" + k, v)
            return dest
    return path


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def _path(self):
        from urllib.parse import unquote
        return unquote(self.path.split("?", 1)[0])

    def translate_path(self, path):
        target = resolve(self._path())
        if target.startswith("/prototype/") and not os.path.exists(
            os.path.join(ROOT, target.lstrip("/"))
        ):
            target = target + "/index.html"
        return super().translate_path(target)

    def do_GET(self):
        p = self._path()
        if p in ("/", "/test", "/mac", "/pitch", "/docs") or p.endswith("/"):
            return self.handle_document(p)
        return super().do_GET()

    def handle_document(self, path):
        target = resolve(path.rstrip("/") or "/")
        if target.startswith("/prototype/") and target.endswith("/"):
            target += "index.html"
        fs = os.path.join(ROOT, target.lstrip("/"))
        if os.path.isfile(fs):
            ctype, _ = mimetypes.guess_type(fs)
            body = open(fs, "rb").read()
            self.send_response(200)
            self.send_header("Content-Type", ctype or "text/html")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"\n  🌿 AI 健康伴侣 · 本地预览服务")
    print(f"  ────────────────────────────────")
    print(f"  正式版原型   http://127.0.0.1:{port}/")
    print(f"  测试版原型   http://127.0.0.1:{port}/test")
    print(f"  macOS 版     http://127.0.0.1:{port}/mac")
    print(f"  路演 PPT     http://127.0.0.1:{port}/pitch")
    print(f"  文档中心     http://127.0.0.1:{port}/docs")
    print(f"  ────────────────────────────────")
    print(f"  Ctrl+C 停止服务")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止。")


if __name__ == "__main__":
    main()

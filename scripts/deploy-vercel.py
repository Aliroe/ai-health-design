import hashlib
import json
import os
import subprocess
import urllib.request

TOKEN = os.environ["VTOKEN"]
API = "https://api.vercel.com"

def req(method, url, data=None, headers=None, binary=False):
    h = {"Authorization": f"Bearer {TOKEN}"}
    if headers:
        h.update(headers)
    body = data
    if isinstance(data, (dict, list)):
        body = json.dumps(data).encode()
        h["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=60) as resp:
            raw = resp.read()
            return resp.status, (raw if binary else json.loads(raw))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:500]

SRC = "/tmp/verchk/deploy-src"
subprocess.run(["rm", "-rf", SRC], check=True)
subprocess.run(["mkdir", "-p", SRC], check=True)
subprocess.run("git archive HEAD | tar -x -C %s" % SRC, shell=True, check=True)

files = []
for root, _, names in os.walk(SRC):
    for name in names:
        p = os.path.join(root, name)
        rel = os.path.relpath(p, SRC)
        size = os.path.getsize(p)
        if size == 0:
            continue
        with open(p, "rb") as f:
            content = f.read()
            digest = hashlib.sha1(content).hexdigest()
            code, resp = req("POST", f"{API}/v2/files", data=content, headers={"Content-Type": "application/octet-stream", "x-vercel-digest": digest}, binary=True)
        if code != 200:
            print("upload fail:", rel, code, resp); raise SystemExit(1)
        files.append({"file": rel, "sha": digest, "size": size})
        print(f"uploaded {rel} ({size}B)")
payload = {
    "name": "ai-health-app",
    "project": "ai-health-app",
    "target": "production",
    "files": files,
}
code, resp = req("POST", f"{API}/v13/deployments", data=payload)
print("deploy status:", code)
if code in (200, 201):
    print("url:", resp.get("url"), "| id:", resp.get("id"))
    print("readyState:", resp.get("readyState"))
else:
    print(resp)

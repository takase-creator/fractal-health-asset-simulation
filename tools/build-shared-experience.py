"""Generate the common experience from the approved Nippn reference.
Company-specific Google campaigns keep their own settings and data.
"""
from pathlib import Path
import re, shutil, hashlib, base64, mimetypes
root=Path(__file__).resolve().parent.parent
source=root/'nippn'
for src in (source/'assets').rglob('*'):
    if not src.is_file(): continue
    dest=root/'assets'/src.relative_to(source/'assets')
    dest.parent.mkdir(parents=True,exist_ok=True)
    if not dest.exists() or dest.read_bytes()!=src.read_bytes(): shutil.copy2(src,dest)
# The reference company stays in its own directory; common assets have no company name.
p=root/'assets/message-first.js';s=p.read_text()
s=s.replace('株式会社ニップン様｜操作確認用','BODY PALETTE｜共通体験ページ').replace('公開期間は未設定です。アンケートの回答は送信・保存されません。','このページでは回答を送信・保存しません。回答の保存には、企業から案内された専用URLをご利用ください。')
p.write_text(s)
h=(source/'index.html').read_text()
h=h.replace('ニップン様｜健康資産・健康年数シミュレーション | BODY PALETTE','健康資産・健康年数シミュレーション | BODY PALETTE')
h=h.replace('株式会社ニップン様｜操作確認用','BODY PALETTE｜共通体験ページ').replace('公開期間は未設定です。アンケートの回答は送信・保存されません。','このページでは回答を送信・保存しません。回答の保存には、企業から案内された専用URLをご利用ください。')
h=h.replace('aria-label="操作確認用のご案内"','aria-label="共通体験ページのご案内"')
h=h.replace('<head>','<head>\n<link rel="canonical" href="https://takase-creator.github.io/fractal-health-asset-simulation/health-asset-simulation.html">',1)
for f in ['assets/message-first.js']:
    digest=hashlib.sha256((root/f).read_bytes()).hexdigest()[:10]
    h=re.sub(re.escape(f)+r'\?v=[a-f0-9]+',f+'?v='+digest,h)
for name in ['health-asset-simulation.html','body-palette.html']:(root/name).write_text(h)
# Keep the previous standalone download usable without relative CSS, JS or images.
public='https://takase-creator.github.io/fractal-health-asset-simulation/'
def data_url(relative):
    p=root/relative.split('?')[0]
    if not p.is_file():return relative
    return 'data:'+str(mimetypes.guess_type(p.name)[0] or 'application/octet-stream')+';base64,'+base64.b64encode(p.read_bytes()).decode()
def css(m):
    p=root/m[1].split('?')[0]
    if not p.exists():return m[0]
    s=p.read_text()
    def url(u):
        raw=u[1].strip('"\'');path=(p.parent/raw).resolve()
        if path.is_file() and path.is_relative_to(root):return 'url("'+data_url(str(path.relative_to(root)))+'")'
        return u[0]
    return '<style>'+re.sub(r'url\(([^)]+)\)',url,s)+'</style>'
off=re.sub(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>',css,h)
def js(m):
    p=root/m[1].split('?')[0]
    if not p.exists():return m[0]
    code=p.read_text().replace('</script','<\\/script')
    for folder in ['ocr/','vendor/']:
        for q in ['"',"'"]:code=code.replace(q+'assets/'+folder,q+public+'assets/'+folder)
    return '<script>'+code+'</script>'
off=re.sub(r'<script src="([^"]+)"[^>]*></script>',js,off)
off=re.sub(r'\s+srcset="[^"]+"','',off)
off=re.sub(r'(src=")((?:\./)?assets/images/[^\"]+)(")',lambda m:m[1]+data_url(m[2].removeprefix('./'))+m[3],off)
off=off.replace('BODY PALETTE｜共通体験ページ','BODY PALETTE｜保存用HTML').replace('このページでは回答を送信・保存しません。回答の保存には、企業から案内された専用URLをご利用ください。','回答は送信・保存しません。写真の読取エンジン等の取得には通信が必要です。')
(root/'BODY_PALETTE_offline.html').write_text(off)
# Separate preview has the same logo, typography, palette and current survey fields.
css_hash=hashlib.sha256((root/'assets/min/seminar-survey.css').read_bytes()).hexdigest()[:10]
js_hash=hashlib.sha256((root/'assets/min/seminar-survey.js').read_bytes()).hexdigest()[:10]
(root/'survey-preview.html').write_text('''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>アンケート画面確認｜BODY PALETTE</title><link rel="stylesheet" href="assets/min/seminar-survey.css?v='''+css_hash+'''"><link rel="stylesheet" href="assets/shared-pages.css"></head><body data-mode="asset" class="shared-survey-page"><header class="shared-header"><a href="health-asset-simulation.html"><img src="assets/images/bp-logo-official.png" alt="BODY PALETTE" width="200" height="108"></a><span>アンケート画面確認</span></header><main class="shared-content"><p class="shared-note">企業別の本番URLでは、事前と同じ意欲設問を加えた9問をGoogleに保存できます。この画面は共通の8問を確認するためのもので、回答は送信・保存しません。</p><div id="p1" hidden></div><button id="resetFormBtn" type="button" hidden>リセット</button></main><script src="assets/min/seminar-survey.js?v='''+js_hash+'''"></script><script>document.querySelector('.ph-step').textContent='STEP 4';</script></body></html>''')
print('Generated common simulator, legacy entry, standalone HTML and survey preview from the approved reference.')

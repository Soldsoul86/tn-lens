"""Assemble the distributable single-file TN Lens civic dashboard."""
from pathlib import Path
import json
root=Path(__file__).resolve().parent
html=(root/'templates/index.template.html').read_text(encoding='utf-8')
css=(root/'static/styles.css').read_text(encoding='utf-8')+'\n'+(root/'static/social-dashboard.css').read_text(encoding='utf-8')
js=(root/'static/app.js').read_text(encoding='utf-8')
social_module=(root/'static/social-dashboard.module.js').read_text(encoding='utf-8')
assert js.count('/* SOCIAL_MODULE_INJECT */')==1
js=js.replace('/* SOCIAL_MODULE_INJECT */',social_module)
seed=json.loads((root/'data/seed.json').read_text(encoding='utf-8'))
development=json.loads((root/'data/development2031.json').read_text(encoding='utf-8'))
embed=lambda obj:json.dumps(obj,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
html=html.replace('/* STYLES_INJECT */',css).replace('/* SEED_INJECT */',embed(seed)).replace('/* DEVELOPMENT_INJECT */',embed(development)).replace('/* SCRIPT_INJECT */',js)
assert not any(x in html for x in ('/* STYLES_INJECT */','/* SEED_INJECT */','/* DEVELOPMENT_INJECT */','/* SCRIPT_INJECT */','/* SOCIAL_MODULE_INJECT */'))
(root/'static/index.html').write_text(html,encoding='utf-8')
print('Built TN Lens social-first research preview.')

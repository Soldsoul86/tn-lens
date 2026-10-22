"""Build the portable, offline-compatible TN Lens public-research preview."""
from pathlib import Path
import json
root=Path(__file__).resolve().parent
html=(root/"templates/index.template.html").read_text(encoding="utf-8")
css=(root/"static/styles.css").read_text(encoding="utf-8")
js=(root/"static/app.js").read_text(encoding="utf-8")
seed=json.loads((root/"data/seed.json").read_text(encoding="utf-8"))
embedded=json.dumps(seed,ensure_ascii=False,separators=(",",":")).replace("<","\\u003c")
html=html.replace("/* STYLES_INJECT */",css).replace("/* SEED_INJECT */",embedded).replace("/* SCRIPT_INJECT */",js)
(root/"static/index.html").write_text(html,encoding="utf-8")
print("Built TN Lens static preview.")

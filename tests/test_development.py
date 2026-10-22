"""Checks that Tamil Nadu 2031 sources and policy goals preserve provenance."""
import json
import re
import subprocess
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def test_goals_require_attribution_and_have_no_fabricated_targets():
    data=json.loads((ROOT/'data/development2031.json').read_text(encoding='utf-8'))
    assert len(data['outcomes'])==7
    assert len({x['id'] for x in data['outcomes']})==7
    for goal in data['outcomes']:
        assert goal['intent_class'] in {'illustrative_unendorsed','published_theme_not_pledge'}
        assert goal['intent_attribution']
        if goal['intent_class']=='published_theme_not_pledge':
            assert goal['intent_source_url'].startswith('https://')
        else:
            assert goal['intent_source_url'] is None
        assert goal['north_star']['baseline'] is None
        assert goal['north_star']['target_2031'] is None
        assert goal['policy_levers'] and goal['delivery_actors'] and goal['constraints']
        assert goal['pilot'] and goal['next_evidence']

def test_historical_context_has_dates_sources_and_limits():
    data=json.loads((ROOT/'data/development2031.json').read_text(encoding='utf-8'))
    assert len(data['context'])>=4
    for item in data['context']:
        assert item['period'] and item['source_url'].startswith('https://') and item['caveat']

def test_build_embeds_development_module():
    subprocess.run([sys.executable,'build.py'],cwd=ROOT,check=True,capture_output=True)
    html=(ROOT/'static/index.html').read_text(encoding='utf-8')
    assert 'id="view_development"' in html
    assert 'data-nav="development"' in html
    assert 'DEVELOPMENT_INJECT' not in html
    m=re.search(r'<script type="application/json" id="development-data">(.*?)</script>',html,re.S)
    assert m
    data=json.loads(m.group(1))
    assert len(data['outcomes'])==7
    assert 'download-development' in html

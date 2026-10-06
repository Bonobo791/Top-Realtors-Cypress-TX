from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import json
root=Path(__file__).parent/'dist'; failures=[];count=0
class Page(HTMLParser):
 def __init__(self): super().__init__(); self.links=[]; self.ids=[]; self.h1=0
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='h1': self.h1+=1
  if 'id' in a: self.ids.append(a['id'])
  if t in ['a','link','img']:
   k='src' if t=='img' else 'href'
   if k in a:self.links.append(a[k])
  if t=='img' and not a.get('alt'):failures.append('Missing image alt text')
parsed={}
for f in root.rglob('*.html'):
 p=Page();p.feed(f.read_text());parsed[f]=p
 if p.h1!=1:failures.append(f'{f}: {p.h1} h1 elements')
 if len(p.ids)!=len(set(p.ids)):failures.append(f'{f}: duplicate IDs')
for f,p in parsed.items():
 for href in p.links:
  u=urlsplit(href)
  if u.scheme or u.netloc:continue
  t=root/u.path.lstrip('/') if u.path.startswith('/') else f.parent/u.path
  if not u.path:t=f
  if t.is_dir():t=t/'index.html'
  if not t.exists():failures.append(f'{f.name}: missing {href}')
  elif u.fragment and t in parsed and u.fragment not in parsed[t].ids:failures.append(f'{f.name}: broken anchor {href}')
  count+=1
alltext=' '.join(x.read_text() for x in root.rglob('*.html'))
for banned in ['555-0147','1,463','750+','Compass','#1 Pick','Certified Relocation Specialist','<form','<script']:
 if banned in alltext:failures.append('Unwanted content: '+banned)
agents=json.loads((root.parent/'agents.json').read_text())
assert len(agents)==7
for a in agents:
 if not (root/'realtors'/f'{a["slug"]}.html').exists():failures.append('Missing profile '+a['name'])
 for fact in a['facts']:
  if fact['source']>=len(a['sources']):failures.append('Invalid citation')
print(json.dumps({'pages':len(parsed),'agent_profiles':len(agents),'local_references_checked':count,'failures':failures}))
assert not failures

from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
import json, re
root=(Path(__file__).parent/'dist').resolve(); failures=[];count=0
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class Page(HTMLParser):
 def __init__(self): super().__init__(); self.links=[]; self.ids=[]; self.h1=0; self.stack=[]; self.errors=[]
 def handle_starttag(self,t,a):
  if t not in VOID:self.stack.append(t)
  if t in {'form','script'}:self.errors.append('Unwanted content: <'+t)
  a=dict(a)
  if t=='h1': self.h1+=1
  if 'id' in a: self.ids.append(a['id'])
  if t in ['a','link','img']:
   k='src' if t=='img' else 'href'
   if k in a:
    self.links.append(a[k])
    scheme=urlsplit(a[k]).scheme
    icon=t=='link' and a.get('rel')=='icon' and a[k].startswith('data:image/svg+xml,')
    if scheme not in {'','http','https','tel','mailto'} and not icon:
     self.errors.append('Unsafe link scheme: '+scheme)
  if t=='img' and 'alt' not in a:failures.append('Missing image alt text')
 def handle_startendtag(self,t,a):
  self.handle_starttag(t,a)
  if t not in VOID:self.handle_endtag(t)
 def handle_endtag(self,t):
  if self.stack and self.stack[-1]==t:self.stack.pop()
  else:self.errors.append('invalid nesting at </'+t+'>')
parsed={}
for f in root.rglob('*.html'):
 resolved=f.resolve()
 try:resolved.relative_to(root)
 except ValueError:
  failures.append(f'{f}: HTML path outside dist');continue
 p=Page();p.feed(f.read_text());p.close();parsed[resolved]=p
 failures.extend(f'{f.name}: {error}' for error in p.errors)
 if p.stack:failures.append(f'{f.name}: unclosed tags: '+', '.join(p.stack))
 if p.h1!=1:failures.append(f'{f}: {p.h1} h1 elements')
 if len(p.ids)!=len(set(p.ids)):failures.append(f'{f}: duplicate IDs')
for f,p in parsed.items():
 for href in p.links:
  u=urlsplit(href)
  if u.scheme or u.netloc:continue
  count+=1
  path=unquote(u.path)
  t=(root/path.lstrip('/') if path.startswith('/') else f.parent/path).resolve() if path else f
  try:t.relative_to(root)
  except ValueError:
   failures.append(f'{f.name}: path outside dist {href}');continue
  if t.is_dir():t=(t/'index.html').resolve()
  try:t.relative_to(root)
  except ValueError:
   failures.append(f'{f.name}: path outside dist {href}');continue
  if not t.exists():failures.append(f'{f.name}: missing {href}')
  elif u.fragment and t in parsed and unquote(u.fragment) not in parsed[t].ids:failures.append(f'{f.name}: broken anchor {href}')
alltext=' '.join(x.read_text() for x in parsed)
for banned in ['555-0147','1,463','750+','Compass','#1 Pick','Certified Relocation Specialist']:
 if banned in alltext:failures.append('Unwanted content: '+banned)
agents=json.loads((root.parent/'agents.json').read_text())
if len(agents)!=7:failures.append(f'Expected 7 profiles, found {len(agents)}')
valid_agents=[];slugs=set()
for a in agents:
 slug=a['slug']
 if not isinstance(slug,str) or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',slug):
  failures.append(f'Invalid profile slug: {slug!r}');continue
 if slug in slugs:failures.append(f'Duplicate profile slug: {slug}')
 slugs.add(slug);valid_agents.append(a)
expected={root/'realtors'/f'{a["slug"]}.html' for a in valid_agents}
for extra in set((root/'realtors').glob('*.html'))-expected:
 failures.append('Unexpected profile '+extra.name)
for a in valid_agents:
 if not (root/'realtors'/f'{a["slug"]}.html').exists():failures.append('Missing profile '+a['name'])
 for fact in a['facts']:
  index=fact.get('source')
  if type(index) is not int or not 0<=index<len(a['sources']):
   failures.append(f"Invalid citation in {a['slug']}: {index!r}")
print(json.dumps({'pages':len(parsed),'agent_profiles':len(agents),'local_references_checked':count,'failures':failures}))
raise SystemExit(1 if failures else 0)

import json
from html.parser import HTMLParser
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

REPO = Path(__file__).resolve().parents[1]
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
        'link', 'meta', 'param', 'source', 'track', 'wbr'}


class Elements(HTMLParser):
    """Record element ancestors and attributes without a browser dependency."""
    def __init__(self):
        super().__init__()
        self.stack = []
        self.elements = []

    def handle_starttag(self, tag, attrs):
        node = (tag, dict(attrs))
        self.elements.append((node, self.stack.copy()))
        if tag not in VOID:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break


class SiteTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.site = Path(self.temp.name) / 'site'
        self.site.mkdir()
        for name in ('generate.py', 'check_site.py', 'agents.json'):
            shutil.copy2(REPO / name, self.site / name)
        shutil.copytree(REPO / 'dist', self.site / 'dist')
        self.agents = json.loads((self.site / 'agents.json').read_text())

    def run_script(self, name):
        return subprocess.run([sys.executable, str(self.site / name)],
                              capture_output=True, text=True)

    def save_agents(self):
        (self.site / 'agents.json').write_text(json.dumps(self.agents))

    def check(self):
        result = self.run_script('check_site.py')
        return result, json.loads(result.stdout)

    def edit_home(self, addition):
        path = self.site / 'dist/index.html'
        path.write_text(path.read_text().replace('</main>', addition + '</main>'))

    def test_current_site_and_repeat_generation(self):
        before = {p.relative_to(self.site): p.read_bytes()
                  for p in (self.site / 'dist').rglob('*.html')}
        self.assertEqual(self.run_script('generate.py').returncode, 0)
        self.assertEqual(before, {p.relative_to(self.site): p.read_bytes()
                                 for p in (self.site / 'dist').rglob('*.html')})
        self.assertEqual(self.run_script('generate.py').returncode, 0)
        self.assertEqual(before, {p.relative_to(self.site): p.read_bytes()
                                 for p in (self.site / 'dist').rglob('*.html')})
        result, report = self.check()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(report, {'pages': 9, 'agent_profiles': 7,
                                 'local_references_checked': 184, 'failures': []})

    def test_featured_summary_and_button_are_outside_identity(self):
        self.assertEqual(self.run_script('generate.py').returncode, 0)
        markup = Elements()
        markup.feed((self.site / 'dist/index.html').read_text())
        direct_children = [node[0] for node, parents in markup.elements
                           if parents and parents[-1][1].get('class') == 'feature-card']
        self.assertEqual(direct_children, ['span', 'div', 'p', 'a', 'p'])
        for node, parents in markup.elements:
            if node[0] in ('p', 'a'):
                self.assertFalse(any(p[1].get('class') == 'identity' for p in parents))

    def test_checker_rejects_unbalanced_markup(self):
        self.edit_home('<div class="unclosed">')
        result, report = self.check()
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue(any('nesting' in f or 'unclosed' in f for f in report['failures']))

    def test_citation_indices_must_be_in_range_integers(self):
        for value in (-1, 2, 0.5, '0', True, None):
            with self.subTest(value=value):
                self.agents[0]['facts'][0]['source'] = value
                self.save_agents()
                before = {p: p.read_bytes() for p in (self.site / 'dist').rglob('*.html')}
                result = self.run_script('generate.py')
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('Invalid citation', result.stderr)
                self.assertIn('lippincott-team', result.stderr)
                self.assertEqual(before, {p: p.read_bytes() for p in before})
                result, report = self.check()
                self.assertNotEqual(result.returncode, 0)
                self.assertTrue(any('Invalid citation' in f for f in report['failures']))

    def test_missing_featured_profile_has_explicit_error(self):
        self.agents = self.agents[1:]
        self.save_agents()
        result = self.run_script('generate.py')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Required 'lippincott-team' profile", result.stderr)

    def test_rename_removes_old_generated_profile(self):
        self.agents[1]['slug'] = 'renamed-kevan'
        self.save_agents()
        self.assertEqual(self.run_script('generate.py').returncode, 0)
        self.assertFalse((self.site / 'dist/realtors/kevan-pewitt.html').exists())
        self.assertTrue((self.site / 'dist/realtors/renamed-kevan.html').exists())
        self.assertEqual(self.check()[0].returncode, 0)

    def test_removal_removes_old_generated_profile_and_preserves_assets(self):
        self.agents.pop(1)
        self.save_agents()
        keep = self.site / 'dist/realtors/notes.txt'
        keep.write_text('not a generated HTML page')
        assets = {p: p.read_bytes() for p in (self.site / 'dist/assets').iterdir()}
        self.assertEqual(self.run_script('generate.py').returncode, 0)
        self.assertFalse((self.site / 'dist/realtors/kevan-pewitt.html').exists())
        self.assertEqual(keep.read_text(), 'not a generated HTML page')
        self.assertEqual(assets, {p: p.read_bytes() for p in assets})

    def test_checker_rejects_extra_profile(self):
        shutil.copy2(self.site / 'dist/realtors/kevan-pewitt.html',
                     self.site / 'dist/realtors/old-profile.html')
        result, report = self.check()
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue(any('Unexpected profile' in f for f in report['failures']))

    def test_generator_refuses_profile_directory_outside_dist(self):
        outside = self.site / 'outside-profiles'
        outside.mkdir()
        unrelated = outside / 'unrelated.html'
        unrelated.write_text('unrelated file must survive')
        shutil.rmtree(self.site / 'dist/realtors')
        (self.site / 'dist/realtors').symlink_to(outside, target_is_directory=True)
        result = self.run_script('generate.py')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Profile directory outside dist', result.stderr)
        self.assertEqual(unrelated.read_text(), 'unrelated file must survive')
        self.assertEqual(list(outside.iterdir()), [unrelated])

    def test_phone_attribute_is_escaped(self):
        payload = '+17134941818" onclick="alert(1)&<test>'
        self.agents[0]['tel'] = payload
        self.save_agents()
        self.assertEqual(self.run_script('generate.py').returncode, 0)
        markup = Elements()
        markup.feed((self.site / 'dist/realtors/lippincott-team.html').read_text())
        phones = [attrs for (tag, attrs), _ in markup.elements
                  if tag == 'a' and attrs.get('href', '').startswith('tel:')]
        self.assertEqual(phones, [{'href': 'tel:' + payload}])

    def test_checker_rejects_mixed_case_form_and_script_tags(self):
        for tag in ('FORM', 'ScRiPt'):
            with self.subTest(tag=tag):
                self.edit_home(f'<{tag}></{tag}>')
                result, report = self.check()
                self.assertNotEqual(result.returncode, 0)
                self.assertTrue(any('Unwanted content: <' + tag.lower() in f
                                    for f in report['failures']))

    def test_checker_rejects_paths_outside_dist(self):
        outside = self.site / 'private.txt'
        outside.write_text('outside the public site')
        for href in ('../private.txt', '/../private.txt', '/%2e%2e/private.txt'):
            with self.subTest(href=href):
                self.edit_home(f'<a href="{href}">Outside</a>')
                result, report = self.check()
                self.assertNotEqual(result.returncode, 0)
                self.assertTrue(any('outside dist' in f and href in f
                                    for f in report['failures']))

    def test_checker_rejects_symlink_escape(self):
        outside = self.site / 'private.txt'
        outside.write_text('outside the public site')
        (self.site / 'dist/assets/escape.txt').symlink_to(outside)
        self.edit_home('<a href="/assets/escape.txt">Outside</a>')
        result, report = self.check()
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue(any('outside dist' in f for f in report['failures']))

    def test_checker_checks_normalized_fragments(self):
        self.edit_home('<a href="/realtors/../index.html#missing">Broken</a>')
        result, report = self.check()
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue(any('broken anchor' in f for f in report['failures']))

    def test_checker_accepts_encoded_existing_asset_path(self):
        self.edit_home('<a href="/assets/%73ite.css">Styles</a>')
        result, report = self.check()
        self.assertEqual(result.returncode, 0, report)

    def test_invalid_json_fails_without_modifying_pages(self):
        (self.site / 'agents.json').write_text('{broken')
        before = {p: p.read_bytes() for p in (self.site / 'dist').rglob('*.html')}
        for script in ('generate.py', 'check_site.py'):
            result = self.run_script(script)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('JSONDecodeError', result.stderr)
        self.assertEqual(before, {p: p.read_bytes() for p in before})


if __name__ == '__main__':
    unittest.main()

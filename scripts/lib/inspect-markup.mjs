import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';
import { srcsetUrls } from './srcset-urls.mjs';
function contained(root, target) {
  const relative = path.relative(root, target);
  return (
    relative !== '..' &&
    !relative.startsWith('..' + path.sep) &&
    !path.isAbsolute(relative)
  );
}
export function inspectMarkup(root, file) {
  const realRoot = fs.realpathSync(root);
  const realFile = fs.realpathSync(file);
  const $ = load(fs.readFileSync(file, 'utf8'));
  const failures = [];
  let references = 0;
  const fail = (message) =>
    failures.push(path.relative(root, file) + ': ' + message);
  $('iframe,object,embed,form').each((_, el) =>
    fail('Prohibited tag ' + el.tagName),
  );
  $('script').each((_, el) => {
    const node = $(el);
    if (node.attr('type') !== 'application/ld+json' || node.attr('src'))
      fail('Executable or externally loaded script');
    else {
      try {
        JSON.parse(node.text());
      } catch {
        fail('Invalid structured data JSON');
      }
    }
  });
  $('img').each((_, el) => {
    if ($(el).attr('alt') === undefined) fail('Image missing alt decision');
  });
  $('*').each((_, el) => {
    const node = $(el);
    const values = [];
    for (const key of [
      'href',
      'src',
      'poster',
      'data',
      'action',
      'formaction',
      'background',
      'xlink:href',
    ])
      if (node.attr(key) !== undefined)
        values.push({ value: node.attr(key), attribute: key });
    if (node.attr('srcset'))
      values.push(
        ...srcsetUrls(node.attr('srcset')).map((value) => ({
          value,
          attribute: 'srcset',
        })),
      );
    for (const { value, attribute } of values) {
      if (value.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(value)) {
        const protocol = value.startsWith('//')
          ? 'https:'
          : value.match(/^[a-z][a-z\d+.-]*:/i)[0].toLowerCase();
        const contact = el.tagName === 'a' && attribute === 'href';
        const inlineImage =
          (el.tagName === 'img' && attribute === 'src') ||
          (el.tagName === 'link' &&
            attribute === 'href' &&
            node.attr('rel') === 'icon');
        if (!(
          ['http:', 'https:'].includes(protocol) ||
          (contact && ['mailto:', 'tel:'].includes(protocol)) ||
          (inlineImage && protocol === 'data:')
        ))
          fail('Prohibited URL scheme');
        continue;
      }
      references++;
      let decoded, fragment;
      try {
        decoded = decodeURIComponent(value.split(/[?#]/)[0]);
        fragment = decodeURIComponent(value.split('#')[1] ?? '');
      } catch {
        fail('Malformed URL encoding');
        continue;
      }
      if (decoded.includes('\\')) {
        fail('Backslash local path');
        continue;
      }
      let target;
      if (!decoded) target = realFile;
      else if (decoded.startsWith('/'))
        target = path.resolve(realRoot, '.' + decoded);
      else target = path.resolve(path.dirname(realFile), decoded);
      if (!contained(realRoot, target)) {
        fail('Reference outside build');
        continue;
      }
      if (!fs.existsSync(target)) {
        fail('Missing local reference ' + value);
        continue;
      }
      target = fs.realpathSync(target);
      if (!contained(realRoot, target)) {
        fail('Reference outside build');
        continue;
      }
      if (fs.statSync(target).isDirectory())
        target = path.join(target, 'index.html');
      if (!fs.existsSync(target)) {
        fail('Missing directory index ' + value);
        continue;
      }
      target = fs.realpathSync(target);
      if (!contained(realRoot, target)) {
        fail('Reference outside build');
        continue;
      }
      if (fragment && target.endsWith('.html')) {
        const other = load(fs.readFileSync(target, 'utf8'));
        if (
          !other('[id]')
            .toArray()
            .some((item) => other(item).attr('id') === fragment)
        )
          fail('Missing fragment ' + value);
      }
    }
  });
  return { references, failures };
}

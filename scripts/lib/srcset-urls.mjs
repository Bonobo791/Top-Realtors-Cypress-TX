// Extract URL tokens using the HTML srcset URL/descriptor boundaries.
export function srcsetUrls(input) {
  const urls = [];
  let position = 0;
  while (position < input.length) {
    while (position < input.length && /[\t\n\f\r ,]/.test(input[position]))
      position++;
    const start = position;
    while (position < input.length && !/[\t\n\f\r ]/.test(input[position]))
      position++;
    if (start === position) break;
    const url = input.slice(start, position);
    urls.push(url.replace(/,+$/, ''));
    if (url.endsWith(',')) continue;
    let inParens = false;
    while (position < input.length) {
      const character = input[position++];
      if (character === '(') inParens = true;
      else if (character === ')') inParens = false;
      else if (character === ',' && !inParens) break;
    }
  }
  return urls;
}

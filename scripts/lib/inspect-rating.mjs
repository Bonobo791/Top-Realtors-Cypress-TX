import assert from 'node:assert/strict';

export function inspectRating(panel, rating) {
  assert.equal(panel.length, 1, 'Exactly one rating panel');
  assert.equal(panel.find('.rating-score').length, rating ? 1 : 0);
  if (!rating) return;
  const text = panel.text();
  assert.equal(
    panel.find('.rating-score').text(),
    `${rating.value} / 5`,
    'Rating score',
  );
  assert(
    text.includes(`${rating.count} ${rating.count_type}`),
    'Rating count and type',
  );
  assert(
    text.includes(rating.subject) && text.includes(rating.scope),
    'Rating subject and scope',
  );
  const source = panel.find('a');
  assert.equal(source.length, 1, 'Rating source link');
  assert.equal(source.attr('href'), rating.source, 'Rating source URL');
  assert.equal(source.text(), rating.platform, 'Rating platform');
  assert.equal(
    panel.find('time').attr('datetime'),
    rating.checked,
    'Rating timestamp',
  );
  assert.equal(
    panel.find('time').text(),
    rating.checked,
    'Rating visible date',
  );
}

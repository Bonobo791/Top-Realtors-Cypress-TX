import { z } from 'zod';
export const ORIGIN = 'https://toprealtorscypresstx.com';
export const SPONSORED_SLUG = 'lippincott-team';
export const FACTS_CHECKED = 'October 3, 2026';
// HAR feedback on the sponsored organization belongs to its named individual.
const teamRatingSubjects: Readonly<Record<string, string>> = {
  [SPONSORED_SLUG]: 'Amy Lippincott',
};
const text = z.string().trim().min(1);
const webUrl = text.refine((value) => {
  try {
    const u = new URL(value);
    return (
      ['http:', 'https:'].includes(u.protocol) &&
      !!u.hostname &&
      !u.username &&
      !u.password
    );
  } catch {
    return false;
  }
}, 'Expected a public HTTP(S) URL');
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const siteSchema = z.object({
  name: text,
  origin: z.literal(ORIGIN),
  indexing: z.boolean(),
  sponsored_slug: z.literal(SPONSORED_SLUG),
});
export const agentSchema = z
  .object({
    slug,
    name: text,
    initials: text,
    type: text,
    brokerage: text,
    official: webUrl,
    official_label: text.optional(),
    har: webUrl,
    phone: text.optional(),
    tel: z
      .string()
      .regex(/^\+[1-9]\d{6,14}$/)
      .optional(),
    license: text.optional(),
    intro: text,
    short: text,
    draft: z.boolean().default(false),
    facts: z
      .array(z.object({ text, source: z.number().int().nonnegative() }))
      .min(1),
    sources: z
      .array(z.object({ label: text, url: webUrl, supports: text }))
      .min(1),
  })
  .superRefine((agent, ctx) => {
    agent.facts.forEach((fact, i) => {
      if (fact.source >= agent.sources.length)
        ctx.addIssue({
          code: 'custom',
          path: ['facts', i, 'source'],
          message: 'Citation index outside sources',
        });
    });
    if (!!agent.phone !== !!agent.tel)
      ctx.addIssue({
        code: 'custom',
        path: ['tel'],
        message: 'Phone text and telephone target must be supplied together',
      });
    if (agent.phone && agent.tel) {
      const digits = agent.phone.replace(/\D/g, '');
      const target = agent.tel.slice(1);
      const localNorthAmerican =
        target.length === 11 &&
        target.startsWith('1') &&
        digits === target.slice(1);
      if (digits !== target && !localNorthAmerican)
        ctx.addIssue({
          code: 'custom',
          path: ['tel'],
          message: 'Phone text must match its telephone target',
        });
    }
  });
export type Agent = z.infer<typeof agentSchema>;
const directorySchema = z
  .array(agentSchema)
  .length(7)
  .superRefine((data, ctx) => {
    if (new Set(data.map((a) => a.slug)).size !== data.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate profile slug' });
    if (!data.some((a) => a.slug === SPONSORED_SLUG && !a.draft))
      ctx.addIssue({
        code: 'custom',
        message: 'Published sponsored profile required',
      });
  });
export const ratingSchema = z.object({
  subject: text,
  value: z.number().min(0).max(5),
  count: z.number().int().positive(),
  count_type: z.literal('completed surveys'),
  platform: z.literal('HAR Client Experience Rating'),
  source: webUrl,
  scope: z.literal('Individual agent; not a team-wide or Cypress-only score'),
  checked: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const date = new Date(value + 'T00:00:00Z');
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    }, 'Invalid calendar date'),
});
export type Rating = z.infer<typeof ratingSchema>;
export function parseSite(input: unknown) {
  return siteSchema.parse(input);
}
export function parseDirectory(input: unknown) {
  return directorySchema.parse(input);
}
export function parseRatingSnapshot(
  input: unknown,
  agents: Agent[],
  asOf = new Date().toISOString().slice(0, 10),
) {
  const parsed = z.record(slug, ratingSchema).parse(input);
  for (const [key, rating] of Object.entries(parsed)) {
    const agent = agents.find((a) => a.slug === key);
    if (!agent || rating.source !== agent.har)
      throw new Error('Rating must match a profile and its HAR source');
    if (rating.checked > asOf)
      throw new Error('Rating check date cannot be in the future');
    let subject: string | undefined;
    if (Object.hasOwn(teamRatingSubjects, agent.slug))
      subject = teamRatingSubjects[agent.slug];
    else if (!isTeam(agent)) subject = agent.name;
    if (!subject || rating.subject !== subject)
      throw new Error('Rating subject must match its verified individual');
  }
  return parsed;
}
export function canonical(path: string) {
  if (
    !/^\/(?:|terms\.html|privacy\.html|404\.html|realtors\/[a-z0-9]+(?:-[a-z0-9]+)*\.html)$/.test(
      path,
    )
  )
    throw new Error('Unapproved canonical path');
  return ORIGIN + path;
}
export function profilePath(agent: Pick<Agent, 'slug'>) {
  return '/realtors/' + slug.parse(agent.slug) + '.html';
}
export function orderProfiles(agents: Agent[]) {
  return agents
    .filter((a) => !a.draft)
    .sort((a, b) => {
      if (a.slug === SPONSORED_SLUG) return -1;
      if (b.slug === SPONSORED_SLUG) return 1;
      return a.name
        .replace(/^The /, '')
        .localeCompare(b.name.replace(/^The /, ''), 'en');
    });
}
export function publicPaths(agents: Agent[]) {
  return [
    '/',
    '/terms.html',
    '/privacy.html',
    ...orderProfiles(agents).map(profilePath),
  ];
}
export function jsonLd(input: unknown) {
  return JSON.stringify(input).replaceAll('<', '\\u003c');
}
export function isTeam(agent: Pick<Agent, 'type'>) {
  return /(?:^| )team$/i.test(agent.type);
}

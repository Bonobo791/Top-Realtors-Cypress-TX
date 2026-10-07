import { getCollection } from 'astro:content';
import rawSite from '../content/site.json';
import rawRatings from '../content/ratings.json';
import {
  parseSite,
  parseRatingSnapshot,
  orderProfiles,
  publicPaths,
  canonical,
  profilePath,
  isTeam,
  type Agent,
} from './contracts';
export const site = parseSite(rawSite);
export async function getDirectory() {
  const entries = await getCollection('realtors');
  const agents: Agent[] = entries.map((entry) => entry.data);
  const ratings = parseRatingSnapshot(rawRatings, agents);
  const ordered = orderProfiles(agents);
  return { agents: ordered, ratings, paths: publicPaths(agents) };
}
export function directorySchema(agents: Agent[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Cypress real estate directory',
    itemListOrder: 'https://schema.org/ItemListUnordered',
    numberOfItems: agents.length,
    itemListElement: agents.map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: a.name,
      url: canonical(profilePath(a)),
    })),
  };
}
export function profileSchema(agent: Agent) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: canonical(profilePath(agent)),
    mainEntity: {
      '@type': isTeam(agent) ? 'Organization' : 'Person',
      name: agent.name,
      url: agent.official,
      sameAs: [agent.har],
    },
  };
}

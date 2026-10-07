import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { agentSchema, parseDirectory } from './lib/contracts';
export const collections = {
  realtors: defineCollection({
    loader: file('src/content/realtors.json', {
      parser: (text) =>
        parseDirectory(JSON.parse(text)).map((agent) => ({
          ...agent,
          id: agent.slug,
        })),
    }),
    schema: agentSchema,
  }),
};

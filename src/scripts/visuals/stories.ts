import { dccStory } from './dcc';
import { deliveryLoopStory } from './delivery-loop';
import { designSystemStory } from './design-system';
import { omelanskiStory } from './omelanski';
import { qaAgentStory } from './qa-agent';
import type { StoryFactory } from './story';
import { wpStarterStory } from './wp-starter';

/** Story per `data-visual` key. A visual without an entry stays on its static drawing. */
export const STORIES: Record<string, StoryFactory> = {
  'qa-agent': qaAgentStory,
  'delivery-loop': deliveryLoopStory,
  'design-system': designSystemStory,
  dcc: dccStory,
  'wp-starter': wpStarterStory,
  omelanski: omelanskiStory,
};

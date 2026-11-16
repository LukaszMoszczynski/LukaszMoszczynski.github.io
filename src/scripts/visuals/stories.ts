import { deliveryLoopStory } from './delivery-loop';
import { designSystemStory } from './design-system';
import { qaAgentStory } from './qa-agent';
import type { StoryFactory } from './story';

/** Story per `data-visual` key. A visual without an entry stays on its static drawing. */
export const STORIES: Record<string, StoryFactory> = {
  'qa-agent': qaAgentStory,
  'delivery-loop': deliveryLoopStory,
  'design-system': designSystemStory,
};

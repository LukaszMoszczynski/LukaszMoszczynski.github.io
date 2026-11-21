import { dccStory } from './wordpress-shop';
import { deliveryLoopStory } from './human-in-the-loop';
import { designSystemStory } from './design-system';
import { homePlatformStory } from './multi-brand-sites';
import { omelanskiStory } from './company-website';
import { qaAgentStory } from './qa-agent';
import type { StoryFactory } from './story';
import { wpStarterStory } from './figma-to-wordpress';

/** Story per `data-visual` key. A visual without an entry stays on its static drawing. */
export const STORIES: Record<string, StoryFactory> = {
  'qa-agent': qaAgentStory,
  'human-in-the-loop': deliveryLoopStory,
  'design-system': designSystemStory,
  'multi-brand-sites': homePlatformStory,
  'wordpress-shop': dccStory,
  'figma-to-wordpress': wpStarterStory,
  'company-website': omelanskiStory,
};

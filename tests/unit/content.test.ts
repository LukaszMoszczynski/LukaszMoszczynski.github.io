import { describe, expect, it } from 'vitest';
import { getProjects } from '../../src/content/projects';

const ORDER = ['qa-agent', 'delivery-loop', 'design-system', 'home-platform', 'dcc', 'wp-starter', 'omelanski'];

describe('getProjects', () => {
  for (const lang of ['en', 'pl'] as const) {
    it(`returns the 7 projects in order (${lang})`, async () => {
      const projects = await getProjects(lang);
      expect(projects.map((project) => project.slug)).toEqual(ORDER);
    });

    it(`marks both home.pl entries with origin and no links (${lang})`, async () => {
      const projects = await getProjects(lang);
      const homePl = projects.filter((project) => project.slug === 'qa-agent' || project.slug === 'delivery-loop');
      expect(homePl).toHaveLength(2);
      for (const project of homePl) {
        expect(project.data.origin).toBe('home.pl');
        expect(project.data.links).toEqual([]);
      }
    });

    it(`gives only home.pl entries an origin (${lang})`, async () => {
      const projects = await getProjects(lang);
      const withOrigin = projects.filter((project) => project.data.origin).map((project) => project.slug);
      expect(withOrigin).toEqual(['qa-agent', 'delivery-loop']);
    });

    it(`gives client work a client chip and every project a title (${lang})`, async () => {
      const projects = await getProjects(lang);
      // Only the home.pl projects carry a client chip.
      const clients = Object.fromEntries(projects.filter((project) => project.data.client).map((project) => [project.slug, project.data.client]));
      expect(clients).toEqual({ 'qa-agent': 'home.pl', 'delivery-loop': 'home.pl', 'home-platform': 'home.pl' });
      for (const project of projects) expect(project.data.title).not.toBe(project.data.client);
    });
  }

  it('uses the same visual, order and links in both languages', async () => {
    const [english, polish] = await Promise.all([getProjects('en'), getProjects('pl')]);
    english.forEach((project, index) => {
      const other = polish[index];
      expect(other.data.visual).toBe(project.data.visual);
      expect(other.data.order).toBe(project.data.order);
      expect(other.data.links.map((link) => link.href)).toEqual(project.data.links.map((link) => link.href));
    });
  });
});

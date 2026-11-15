import { describe, expect, it } from 'vitest';
import { getProjects } from '../../src/content/projects';

const ORDER = ['dcc', 'design-system', 'qa-agent', 'dark-factory', 'wp-starter', 'omelanski'];

describe('getProjects', () => {
  for (const lang of ['en', 'pl'] as const) {
    it(`returns the 6 projects in order (${lang})`, async () => {
      const projects = await getProjects(lang);
      expect(projects.map((project) => project.slug)).toEqual(ORDER);
    });

    it(`marks both home.pl entries with origin and no links (${lang})`, async () => {
      const projects = await getProjects(lang);
      const homePl = projects.filter((project) => project.slug === 'qa-agent' || project.slug === 'dark-factory');
      expect(homePl).toHaveLength(2);
      for (const project of homePl) {
        expect(project.data.origin).toBe('home.pl');
        expect(project.data.links).toEqual([]);
      }
    });

    it(`gives only home.pl entries an origin (${lang})`, async () => {
      const projects = await getProjects(lang);
      const withOrigin = projects.filter((project) => project.data.origin).map((project) => project.slug);
      expect(withOrigin).toEqual(['qa-agent', 'dark-factory']);
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

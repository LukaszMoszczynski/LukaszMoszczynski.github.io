import { describe, expect, it } from 'vitest';
import { AGENT_RUNS } from '../../src/scripts/agent-runs';

describe('AGENT_RUNS', () => {
  it('has qa, factory and figma runs', () => expect(Object.keys(AGENT_RUNS).sort()).toEqual(['factory', 'figma', 'qa']));
  for (const [name, lines] of Object.entries(AGENT_RUNS)) {
    it(`${name} starts with a comment and ends with ok`, () => {
      expect(lines[0].kind).toBe('comment');
      expect(lines[lines.length - 1].kind).toBe('ok');
    });
  }
});

export type LogLine = { kind: 'comment' | 'step' | 'ok'; text: string };
export type RunKey = 'qa' | 'factory' | 'figma';

const comment = (text: string): LogLine => ({ kind: 'comment', text });
const step = (text: string): LogLine => ({ kind: 'step', text });
const ok = (text: string): LogLine => ({ kind: 'ok', text });

/** Illustrative runs: descriptions only, the numbers are made up. */
export const AGENT_RUNS: Record<RunKey, LogLine[]> = {
  qa: [
    comment('# new feature → tests, report, MR comment'),
    step('agent: writing test scenarios → scenarios/checkout.md'),
    step('agent: generating Playwright specs · 9 cases'),
    step('run: master vs feature branch'),
    step('screenshots: 18 pairs compared'),
    ok('✓ 8 passed · 1 visual difference found'),
    ok('✓ comment posted on the GitLab MR'),
    ok('✓ full HTML report ready'),
  ],
  factory: [
    comment('# Jira label → reviewed merge request'),
    step('jira: label added to the task'),
    step('factory (local docker): task picked up'),
    step('agent: implementing · running tests'),
    ok('✓ branch pushed to GitLab'),
    step('auto-reviewer: 2 comments left'),
    step('factory: picked up the comments · fixing'),
    ok('✓ review clean · ready for a human'),
  ],
  figma: [
    comment('# figma → code, one command'),
    step('skill figma-design-to-code loaded'),
    step('reading frame 95:645 · 66 variables'),
    step('agent: building Section/Numbers'),
    ok('✓ tokens synced · light + dark'),
    ok('✓ deployed to preview'),
  ],
};

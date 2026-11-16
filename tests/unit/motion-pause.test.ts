import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { motionPaused, onMotionPauseChange, PAUSE_CLASS, PAUSE_KEY, setMotionPaused, storedPause } from '../../src/scripts/motion-pause';

/** A tiny stand-in for <html>, document events and localStorage (vitest runs in Node). */
function fakeDom(storage: Map<string, string> | null) {
  const classes = new Set<string>();
  const events = new EventTarget();
  vi.stubGlobal('document', {
    documentElement: {
      classList: {
        contains: (name: string) => classes.has(name),
        toggle: (name: string, on: boolean) => (on ? classes.add(name) : classes.delete(name)),
      },
    },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
  });
  vi.stubGlobal('localStorage', storage
    ? { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) }
    : { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem: () => { throw new Error('blocked'); } });
  return classes;
}

describe('motion pause', () => {
  let storage: Map<string, string>;
  beforeEach(() => {
    storage = new Map();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('pauses, stores, notifies and resumes', () => {
    const classes = fakeDom(storage);
    const seen: boolean[] = [];
    const stop = onMotionPauseChange((paused) => seen.push(paused));
    expect(motionPaused()).toBe(false);
    setMotionPaused(true);
    expect(classes.has(PAUSE_CLASS)).toBe(true);
    expect(motionPaused()).toBe(true);
    expect(storage.get(PAUSE_KEY)).toBe('1');
    expect(storedPause()).toBe(true);
    setMotionPaused(false);
    expect(motionPaused()).toBe(false);
    expect(storage.has(PAUSE_KEY)).toBe(false);
    stop();
    setMotionPaused(true);
    expect(seen).toEqual([true, false]);
  });

  it('still works for the page when storage is blocked', () => {
    fakeDom(null);
    expect(storedPause()).toBe(false);
    expect(() => setMotionPaused(true)).not.toThrow();
    expect(motionPaused()).toBe(true);
  });
});

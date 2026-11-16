import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText } from '../../src/scripts/copy';

afterEach(() => vi.unstubAllGlobals());

describe('copyText', () => {
  it('writes to the clipboard and resolves true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    expect(await copyText('a@b.c')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('a@b.c');
  });

  it('on rejection selects the text node and resolves false', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    const selection = { removeAllRanges: vi.fn(), addRange: vi.fn() };
    const range = { selectNodeContents: vi.fn() };
    vi.stubGlobal('window', { getSelection: () => selection });
    vi.stubGlobal('document', { createRange: () => range });
    const node = {} as Node;
    expect(await copyText('a@b.c', node)).toBe(false);
    expect(range.selectNodeContents).toHaveBeenCalledWith(node);
    expect(selection.addRange).toHaveBeenCalledWith(range);
  });

  it('resolves false when there is no clipboard at all', async () => {
    vi.stubGlobal('navigator', {});
    expect(await copyText('x')).toBe(false);
  });
});

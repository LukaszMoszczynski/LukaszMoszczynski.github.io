/**
 * Copies text to the clipboard. On failure (no API, permission denied) it
 * selects `source` (the visible text node) so the visitor can press Ctrl+C,
 * and resolves false. GSAP-free.
 */
export async function copyText(text: string, source?: Node): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      if (source) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(source);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    } catch {
      /* nothing more to try */
    }
    return false;
  }
}

import { motionEnabled } from './lifecycle';
import { motionPaused, onMotionPauseChange, setMotionPaused } from './motion-pause';

/**
 * Every "Pause animations" button on the page (footer and menu): shown only when motion is
 * allowed, aria-pressed follows the shared state, a click flips it for the whole site.
 */
export function initMotionToggles(): () => void {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-motion-toggle]')];
  if (!buttons.length || !motionEnabled()) return () => {};
  const sync = () => buttons.forEach((button) => button.setAttribute('aria-pressed', String(motionPaused())));
  const handle = () => setMotionPaused(!motionPaused());
  buttons.forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', handle);
  });
  sync();
  const stopListening = onMotionPauseChange(sync);
  return () => {
    stopListening();
    buttons.forEach((button) => button.removeEventListener('click', handle));
  };
}

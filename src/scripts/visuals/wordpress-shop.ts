import { markDone, part, parts, storyTimeline } from './story';

/**
 * DCC shop: the orange "add to cart" button is pressed, the payment bar fills, the PDF
 * voucher prints out of the top and tilts into place, then the product cards pop in.
 */
export function dccStory(screen: HTMLElement): gsap.core.Timeline {
  const button = part(screen, '.dcc-buy');
  const payment = part(screen, '.dcc-pay-fill');
  const voucher = part(screen, '.dcc-voucher');
  const cards = parts(screen, '.dcc-card');
  const voucherHidden = 'inset(0% 0% 100% 0%)';
  const timeline = storyTimeline();

  timeline
    .set(button, { scale: 1 }, 0)
    .set(payment, { scaleX: 0 }, 0)
    .set(voucher, { clipPath: voucherHidden, yPercent: -25, rotation: 0 }, 0)
    .set(cards, { scale: 0.6, opacity: 0 }, 0)
    .to(button, { scale: 0.86, duration: 0.15, ease: 'power2.in' }, 0.3)
    .to(button, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, 0.45)
    .to(payment, { scaleX: 1, duration: 1.0, ease: 'power1.inOut' }, 0.7)
    .to(voucher, { clipPath: 'inset(0% 0% 0% 0%)', yPercent: 0, duration: 0.7 }, 1.8)
    .to(voucher, { rotation: -6, duration: 0.5, ease: 'back.out(3)' }, 2.5)
    .to(cards, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)', stagger: 0.12 }, 2.9);
  markDone(timeline);
  timeline
    .to(voucher, { clipPath: voucherHidden, yPercent: -25, duration: 0.45, ease: 'power2.in' })
    .to(payment, { scaleX: 0, duration: 0.45, ease: 'power2.in' }, '<')
    .to(cards, { opacity: 0, duration: 0.45, ease: 'power1.in' }, '<');
  return timeline;
}

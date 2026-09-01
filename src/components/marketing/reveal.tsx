'use client';

import { useCallback, useState, type CSSProperties, type ElementType } from 'react';

import { cn } from '@/lib/utils';

/**
 * Scroll reveal — the page's single motion primitive.
 *
 * Everything on the public site that animates in does so through this
 * component, so the whole page shares one curve, one distance and one
 * duration instead of accumulating ad-hoc effects.
 *
 * The hidden state lives in CSS (`[data-reveal] { opacity: 0 }`, itself
 * guarded on `scripting: enabled`) rather than in React state, so there
 * is no flash of un-revealed content between paint and hydration, and a
 * no-JS visitor sees the finished page. Reduced-motion visitors get the
 * content immediately — see globals.css.
 *
 * Reveals fire once and then disconnect; nothing re-animates on scroll
 * back up, which is the difference between "alive" and "restless".
 */
export function Reveal({
  children,
  as: Tag = 'div',
  className,
  delay = 0,
  variant = 'default',
}: {
  children: React.ReactNode;
  as?: ElementType;
  className?: string;
  /** Stagger, in ms. Keep groups under ~240ms total. */
  delay?: number;
  /** `frame` is the slightly longer, slightly scaled reveal for large
   *  product visuals. */
  variant?: 'default' | 'frame';
}) {
  const [visible, setVisible] = useState(false);

  // A ref callback rather than an effect: the observer attaches exactly
  // when the node exists (and detaches via the React 19 ref cleanup if it
  // is ever swapped), with no dependency array to keep in sync.
  const attach = useCallback((el: HTMLElement | null) => {
    if (!el) return;

    // Environments without IntersectionObserver — very old browsers, and
    // any non-DOM renderer — simply get the finished content.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    // Anything already on screen at mount reveals synchronously rather
    // than waiting for the observer's first tick. This is both nicer
    // (the masthead is never briefly blank) and safer: a document that
    // is hidden when it loads — a background tab, a prerender, an
    // offscreen embed — receives no IntersectionObserver callbacks at
    // all, and the page must not depend on one to become visible.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // Trigger a little before the element is fully on screen, so the
      // reveal completes as the reader arrives rather than after.
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={attach}
      data-reveal={variant === 'frame' ? 'frame' : ''}
      data-visible={visible ? 'true' : undefined}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}

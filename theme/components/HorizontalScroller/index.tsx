import { useSite } from '@rspress/core/runtime';
import type {
  PointerEvent as ReactPointerEvent,
  ReactNode,
  WheelEvent as ReactWheelEvent,
} from 'react';
import { useEffect, useRef, useState } from 'react';

import './index.css';

interface HorizontalScrollerProps {
  children?: ReactNode;
  className?: string;
  itemCount?: number;
}

interface DragState {
  pointerId: number;
  scrollLeft: number;
  startX: number;
}

export function HorizontalScroller({
  children,
  className = '',
  itemCount = 3,
}: HorizontalScrollerProps) {
  const { site } = useSite();
  const trackRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const classes = ['card', 'horizontal-scroller', className].filter(Boolean).join(' ');
  const panelMedia = [
    {
      type: 'video',
      src: `${site.base}media/bacteria-animation.mp4`,
      label: 'Bacteria animation',
    },
    {
      type: 'image',
      src: `${site.base}images/trynka-group-september-2025.jpg`,
      label: 'The Trynka Group at the Wellcome Sanger Institute',
    },
  ];

  const updateActiveIndex = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;

    setActiveIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  const scrollToItem = (index: number) => {
    const track = trackRef.current;
    if (!track) return;

    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
  };

  const startMouseDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;

    const track = event.currentTarget;
    dragStateRef.current = {
      pointerId: event.pointerId,
      scrollLeft: track.scrollLeft,
      startX: event.clientX,
    };
    track.setPointerCapture(event.pointerId);
    track.classList.add('horizontal-scroller__track--dragging');
  };

  const continueMouseDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.currentTarget.scrollLeft =
      dragState.scrollLeft - (event.clientX - dragState.startX);
  };

  const finishMouseDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const track = event.currentTarget;
    dragStateRef.current = null;
    track.classList.remove('horizontal-scroller__track--dragging');
    if (track.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }

    const nextIndex = Math.max(
      0,
      Math.min(itemCount - 1, Math.round(track.scrollLeft / track.clientWidth)),
    );
    scrollToItem(nextIndex);
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const track = event.currentTarget;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    const canScroll =
      (delta < 0 && track.scrollLeft > 0) ||
      (delta > 0 && track.scrollLeft < maxScrollLeft);

    if (!canScroll) return;

    event.preventDefault();
    track.scrollLeft += delta;
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      const track = trackRef.current;
      if (!track || track.clientWidth === 0 || dragStateRef.current) return;

      const currentIndex = Math.round(track.scrollLeft / track.clientWidth);
      const nextIndex = (currentIndex + 1) % itemCount;
      track.scrollTo({ left: nextIndex * track.clientWidth, behavior: 'smooth' });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [itemCount]);

  return (
    <div className={classes}>
      <div
        ref={trackRef}
        className="horizontal-scroller__track"
        onPointerCancel={finishMouseDrag}
        onPointerDown={startMouseDrag}
        onPointerMove={continueMouseDrag}
        onPointerUp={finishMouseDrag}
        onScroll={updateActiveIndex}
        onWheel={handleWheel}
      >
        {Array.from({ length: itemCount }, (_, index) => {
          const media = panelMedia[index];

          return (
            <div
              className="horizontal-scroller__item"
              aria-label={
                media
                  ? `${media.label}, panel ${index + 1} of ${itemCount}`
                  : `Placeholder ${index + 1} of ${itemCount}`
              }
              key={index}
            >
              {media?.type === 'video' ? (
                <video autoPlay loop muted playsInline preload="auto" aria-hidden="true">
                  <source src={media.src} type="video/mp4" />
                </video>
              ) : media?.type === 'image' ? (
                <img src={media.src} alt={media.label} draggable={false} />
              ) : null}
            </div>
          );
        })}
      </div>

      {children}

      <div className="horizontal-scroller__indicators" aria-label="Choose a panel">
        {Array.from({ length: itemCount }, (_, index) => (
          <button
            className="horizontal-scroller__indicator"
            aria-current={index === activeIndex ? 'true' : undefined}
            aria-label={`Show panel ${index + 1}`}
            key={index}
            onClick={() => scrollToItem(index)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

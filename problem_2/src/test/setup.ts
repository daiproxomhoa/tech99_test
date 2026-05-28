import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// jsdom doesn't implement window.scrollTo — framer-motion calls it during
// keyframe measurement and jsdom logs a noisy "Not implemented" warning.
// Stub to a no-op so test output stays clean.
window.scrollTo = (() => {}) as typeof window.scrollTo;

// jsdom doesn't implement matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

// crypto.randomUUID polyfill for older jsdom
if (!('randomUUID' in crypto)) {
  (crypto as { randomUUID?: () => string }).randomUUID = () =>
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// jsdom returns 0 from getBoundingClientRect — patch to return a non-zero
// size so layout-dependent virtualized lists render in tests.
const origGetBoundingClientRect = Element.prototype.getBoundingClientRect;
Element.prototype.getBoundingClientRect = function () {
  const r = origGetBoundingClientRect.call(this);
  if (r.width === 0 && r.height === 0) {
    return { x: 0, y: 0, top: 0, left: 0, right: 400, bottom: 480, width: 400, height: 480, toJSON: () => ({}) } as DOMRect;
  }
  return r;
};

// jsdom doesn't implement ResizeObserver — provide a non-zero initial size so
// virtualized lists that depend on measured height render in tests.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    constructor(private cb: ResizeObserverCallback) {}
    observe(target: Element) {
      const rect = { width: 400, height: 480, top: 0, left: 0, right: 400, bottom: 480, x: 0, y: 0 } as DOMRectReadOnly;
      const entry = { target, contentRect: rect, borderBoxSize: [], contentBoxSize: [], devicePixelContentBoxSize: [] } as unknown as ResizeObserverEntry;
      queueMicrotask(() => this.cb([entry], this as unknown as ResizeObserver));
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

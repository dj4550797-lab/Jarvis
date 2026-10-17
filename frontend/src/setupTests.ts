import "@testing-library/jest-dom";

// Mock missing browser DOM APIs in jsdom
window.HTMLElement.prototype.scrollIntoView = () => {};

if (typeof window.ResizeObserver === "undefined") {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
}

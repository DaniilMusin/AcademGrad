import '@testing-library/jest-dom'

// Mock процесса для тестов
Object.defineProperty(window, 'process', {
  value: {
    env: {
      NODE_ENV: 'test',
    },
  },
})

// Mock для ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock для IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver {
  root = null
  rootMargin = ''
  thresholds = []

  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
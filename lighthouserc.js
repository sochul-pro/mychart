module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Ready',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/screener',
        'http://localhost:3000/stocks/005930',
      ],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance
        'first-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 4000 }],

        // Accessibility
        'color-contrast': 'warn',
        'document-title': 'error',
        'html-has-lang': 'error',
        'meta-viewport': 'error',

        // Best Practices
        'errors-in-console': 'warn',
        'image-aspect-ratio': 'warn',

        // SEO
        'meta-description': 'warn',
        'crawlable-anchors': 'warn',

        // PWA (선택적)
        'installable-manifest': 'off',
        'service-worker': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};

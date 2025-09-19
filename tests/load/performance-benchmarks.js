/**
 * Performance Benchmarking with Artillery
 * Tests key user actions and system operations for performance
 */

module.exports = {
  config: {
    target: process.env.TARGET_URL || 'http://localhost:3000',
    phases: [
      // Warm-up phase
      {
        duration: 30,
        arrivalRate: 1,
        name: 'Warm-up'
      },
      // Baseline load
      {
        duration: 120,
        arrivalRate: 5,
        name: 'Baseline Load'
      },
      // Peak load simulation
      {
        duration: 180,
        arrivalRate: 15,
        name: 'Peak Load'
      },
      // Stress test
      {
        duration: 60,
        arrivalRate: 25,
        name: 'Stress Test'
      },
      // Cool down
      {
        duration: 30,
        arrivalRate: 1,
        name: 'Cool Down'
      }
    ],
    // Performance thresholds
    ensure: {
      'http.response_time.p95': 500, // 95th percentile response time < 500ms
      'http.response_time.p99': 1000, // 99th percentile response time < 1000ms
      'http.request_rate': 100, // At least 100 requests per second
      'errors.rate': 0.01 // Error rate < 1%
    },
    // Load testing configuration
    defaults: {
      headers: {
        'User-Agent': 'NetPost-LoadTest/1.0'
      }
    },
    // Metrics and reporting
    engines: {
      socketio: {
        transports: ['websocket']
      }
    },
    plugins: {
      'artillery-plugin-metrics-by-endpoint': {},
      'artillery-plugin-publish-metrics': [
        {
          type: 'cloudwatch',
          region: 'us-west-2'
        }
      ]
    }
  },
  scenarios: [
    {
      name: 'User Authentication Flow',
      weight: 20,
      flow: [
        {
          get: {
            url: '/auth/login',
            capture: {
              json: '$.csrfToken',
              as: 'csrfToken'
            }
          }
        },
        {
          post: {
            url: '/api/auth/login',
            json: {
              email: 'loadtest-{{ $randomString() }}@netpost.app',
              password: 'LoadTest123!',
              csrfToken: '{{ csrfToken }}'
            },
            capture: {
              json: '$.token',
              as: 'authToken'
            }
          }
        },
        {
          get: {
            url: '/dashboard',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        }
      ]
    },
    {
      name: 'Inventory Management Operations',
      weight: 30,
      flow: [
        // Authenticate first
        {
          post: {
            url: '/api/auth/login',
            json: {
              email: 'performance-test@netpost.app',
              password: 'TestPassword123!'
            },
            capture: {
              json: '$.token',
              as: 'authToken'
            }
          }
        },
        // Get inventory list
        {
          get: {
            url: '/api/inventory',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            capture: {
              json: '$.items[0].id',
              as: 'itemId'
            }
          }
        },
        // Get specific item details
        {
          get: {
            url: '/api/inventory/{{ itemId }}',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        },
        // Update item
        {
          put: {
            url: '/api/inventory/{{ itemId }}',
            headers: {
              'Authorization': 'Bearer {{ authToken }}',
              'Content-Type': 'application/json'
            },
            json: {
              title: 'Updated Item Title - {{ $randomString() }}',
              price: '{{ $randomInt(10, 500) }}.99',
              description: 'Updated description for load testing'
            }
          }
        },
        // Search inventory
        {
          get: {
            url: '/api/inventory/search?q=camera&category=Electronics',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        }
      ]
    },
    {
      name: 'Listing Creation and Management',
      weight: 25,
      flow: [
        // Authenticate
        {
          post: {
            url: '/api/auth/login',
            json: {
              email: 'listings-test@netpost.app',
              password: 'TestPassword123!'
            },
            capture: {
              json: '$.token',
              as: 'authToken'
            }
          }
        },
        // Get available inventory items
        {
          get: {
            url: '/api/inventory?status=available',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            capture: {
              json: '$.items[0].id',
              as: 'itemId'
            }
          }
        },
        // Create listing
        {
          post: {
            url: '/api/listings',
            headers: {
              'Authorization': 'Bearer {{ authToken }}',
              'Content-Type': 'application/json'
            },
            json: {
              itemId: '{{ itemId }}',
              marketplaces: ['ebay', 'poshmark'],
              pricing: {
                ebay: '{{ $randomInt(50, 200) }}.99',
                poshmark: '{{ $randomInt(40, 180) }}.00'
              },
              title: 'Load Test Listing - {{ $randomString() }}',
              description: 'Generated listing for performance testing'
            },
            capture: {
              json: '$.id',
              as: 'listingId'
            }
          }
        },
        // Get listing details
        {
          get: {
            url: '/api/listings/{{ listingId }}',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        },
        // Update listing
        {
          put: {
            url: '/api/listings/{{ listingId }}',
            headers: {
              'Authorization': 'Bearer {{ authToken }}',
              'Content-Type': 'application/json'
            },
            json: {
              pricing: {
                ebay: '{{ $randomInt(45, 195) }}.99',
                poshmark: '{{ $randomInt(35, 175) }}.00'
              }
            }
          }
        }
      ]
    },
    {
      name: 'Analytics and Reporting',
      weight: 15,
      flow: [
        // Authenticate
        {
          post: {
            url: '/api/auth/login',
            json: {
              email: 'analytics-test@netpost.app',
              password: 'TestPassword123!'
            },
            capture: {
              json: '$.token',
              as: 'authToken'
            }
          }
        },
        // Dashboard analytics
        {
          get: {
            url: '/api/analytics/dashboard',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        },
        // Profit analytics
        {
          get: {
            url: '/api/analytics/profit?period=30d',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        },
        // Marketplace performance
        {
          get: {
            url: '/api/analytics/marketplace-performance',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        },
        // Inventory turnover
        {
          get: {
            url: '/api/analytics/inventory-turnover',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            }
          }
        }
      ]
    },
    {
      name: 'File Upload Performance',
      weight: 10,
      flow: [
        // Authenticate
        {
          post: {
            url: '/api/auth/login',
            json: {
              email: 'upload-test@netpost.app',
              password: 'TestPassword123!'
            },
            capture: {
              json: '$.token',
              as: 'authToken'
            }
          }
        },
        // Simulate image upload
        {
          post: {
            url: '/api/upload/image',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            formData: {
              file: '@tests/fixtures/test-image-1mb.jpg',
              itemId: '{{ $randomString() }}',
              type: 'inventory'
            }
          }
        },
        // Bulk image upload
        {
          post: {
            url: '/api/upload/images/bulk',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            formData: {
              'files[0]': '@tests/fixtures/test-image-500kb.jpg',
              'files[1]': '@tests/fixtures/test-image-800kb.jpg',
              'files[2]': '@tests/fixtures/test-image-1.2mb.jpg',
              itemId: '{{ $randomString() }}'
            }
          }
        }
      ]
    }
  ]
};
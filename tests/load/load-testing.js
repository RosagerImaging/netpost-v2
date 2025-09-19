/**
 * Load Testing Configuration for NetPost Platform
 * Tests system stability under expected beta user volumes
 */

module.exports = {
  config: {
    target: process.env.TARGET_URL || 'http://localhost:3000',
    phases: [
      // Phase 1: Beta Launch Simulation (50 concurrent users)
      {
        duration: 300, // 5 minutes
        arrivalRate: 10,
        name: 'Beta Launch Load'
      },
      // Phase 2: Growth Simulation (100 concurrent users)
      {
        duration: 600, // 10 minutes
        arrivalRate: 20,
        name: 'Growth Phase'
      },
      // Phase 3: Peak Usage (150 concurrent users)
      {
        duration: 300, // 5 minutes
        arrivalRate: 30,
        name: 'Peak Usage'
      },
      // Phase 4: Stress Test (200+ concurrent users)
      {
        duration: 180, // 3 minutes
        arrivalRate: 40,
        name: 'Stress Test'
      }
    ],
    // Beta Launch Success Criteria
    ensure: {
      'http.response_time.p95': 2000, // 95% of responses under 2 seconds
      'http.response_time.p99': 5000, // 99% of responses under 5 seconds
      'http.request_rate': 50, // Minimum 50 requests per second
      'errors.rate': 0.05, // Error rate under 5%
      'socketio.response_time.p95': 1000 // WebSocket responses under 1 second
    },
    payload: {
      // Test user data
      path: './tests/fixtures/test-users.csv',
      fields: ['email', 'password', 'subscription_tier']
    },
    variables: {
      // Test configuration
      testDuration: 23, // 23 minutes total
      maxConcurrentUsers: 200,
      targetRPS: 100
    },
    // WebSocket testing for real-time features
    engines: {
      socketio: {
        transports: ['websocket'],
        upgrade: true,
        rememberUpgrade: true
      }
    },
    plugins: {
      'artillery-plugin-expect': {},
      'artillery-plugin-metrics-by-endpoint': {
        useOnlyRequestNames: true
      }
    }
  },
  scenarios: [
    {
      name: 'New User Onboarding Flow',
      weight: 15,
      flow: [
        {
          get: {
            url: '/',
            expect: {
              statusCode: 200,
              contentType: 'text/html'
            }
          }
        },
        {
          get: {
            url: '/auth/signup',
            expect: {
              statusCode: 200
            }
          }
        },
        {
          post: {
            url: '/api/auth/signup',
            json: {
              email: 'loadtest-{{ $randomString() }}@example.com',
              password: 'LoadTest123!',
              firstName: '{{ $randomString() }}',
              lastName: '{{ $randomString() }}'
            },
            expect: {
              statusCode: 201
            },
            capture: {
              json: '$.token',
              as: 'authToken'
            }
          }
        },
        {
          get: {
            url: '/onboarding',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: {
              statusCode: 200
            }
          }
        },
        {
          post: {
            url: '/api/onboarding/complete',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            json: {
              preferences: {
                categories: ['Electronics', 'Fashion'],
                marketplaces: ['ebay', 'poshmark'],
                goals: 'side_income'
              }
            },
            expect: {
              statusCode: 200
            }
          }
        }
      ]
    },
    {
      name: 'Active User Session',
      weight: 40,
      flow: [
        // Login
        {
          post: {
            url: '/api/auth/login',
            json: {
              email: '{{ email }}',
              password: '{{ password }}'
            },
            capture: {
              json: '$.token',
              as: 'authToken'
            },
            expect: {
              statusCode: 200
            }
          }
        },
        // Dashboard load
        {
          get: {
            url: '/api/dashboard',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: {
              statusCode: 200,
              hasProperty: 'stats'
            }
          }
        },
        // Connect WebSocket for real-time updates
        {
          engine: 'socketio',
          socketio: {
            emit: {
              channel: 'user-auth',
              data: {
                token: '{{ authToken }}'
              }
            }
          }
        },
        // Browse inventory
        {
          get: {
            url: '/api/inventory?page=1&limit=20',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: {
              statusCode: 200,
              hasProperty: 'items'
            },
            capture: {
              json: '$.items[0].id',
              as: 'itemId'
            }
          }
        },
        // View item details
        {
          get: {
            url: '/api/inventory/{{ itemId }}',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: {
              statusCode: 200
            }
          }
        },
        // Check active listings
        {
          get: {
            url: '/api/listings?status=active',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: {
              statusCode: 200
            }
          }
        },
        // View analytics
        {
          get: {
            url: '/api/analytics/summary',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: {
              statusCode: 200
            }
          }
        }
      ]
    },
    {
      name: 'Power User Operations',
      weight: 25,
      flow: [
        // Login as Pro user
        {
          post: {
            url: '/api/auth/login',
            json: {
              email: '{{ email }}',
              password: '{{ password }}'
            },
            capture: {
              json: '$.token',
              as: 'authToken'
            }
          }
        },
        // Bulk inventory operations
        {
          get: {
            url: '/api/inventory?limit=50',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            capture: {
              json: '$.items[*].id',
              as: 'itemIds'
            }
          }
        },
        // Bulk price update
        {
          put: {
            url: '/api/inventory/bulk-update',
            headers: {
              'Authorization': 'Bearer {{ authToken }}',
              'Content-Type': 'application/json'
            },
            json: {
              itemIds: '{{ itemIds }}',
              updates: {
                priceAdjustment: 5,
                adjustmentType: 'percentage'
              }
            },
            expect: {
              statusCode: 200
            }
          }
        },
        // Create multiple listings
        {
          post: {
            url: '/api/listings/bulk-create',
            headers: {
              'Authorization': 'Bearer {{ authToken }}',
              'Content-Type': 'application/json'
            },
            json: {
              items: [
                {
                  itemId: '{{ itemIds[0] }}',
                  marketplaces: ['ebay', 'poshmark']
                },
                {
                  itemId: '{{ itemIds[1] }}',
                  marketplaces: ['facebook']
                }
              ]
            },
            expect: {
              statusCode: 201
            }
          }
        },
        // Advanced analytics query
        {
          get: {
            url: '/api/analytics/detailed?period=90d&breakdown=marketplace',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            expect: {
              statusCode: 200
            }
          }
        },
        // Export data
        {
          post: {
            url: '/api/export/inventory',
            headers: {
              'Authorization': 'Bearer {{ authToken }}'
            },
            json: {
              format: 'csv',
              dateRange: '30d'
            },
            expect: {
              statusCode: 202
            }
          }
        }
      ]
    },
    {
      name: 'Mobile User Simulation',
      weight: 20,
      flow: [
        // Mobile login
        {
          post: {
            url: '/api/auth/login',
            headers: {
              'User-Agent': 'NetPost-Mobile/1.0 (iOS)',
              'X-Platform': 'mobile'
            },
            json: {
              email: '{{ email }}',
              password: '{{ password }}'
            },
            capture: {
              json: '$.token',
              as: 'authToken'
            }
          }
        },
        // Mobile dashboard
        {
          get: {
            url: '/api/mobile/dashboard',
            headers: {
              'Authorization': 'Bearer {{ authToken }}',
              'User-Agent': 'NetPost-Mobile/1.0 (iOS)'
            },
            expect: {
              statusCode: 200
            }
          }
        },
        // Add sourcing item (mobile-first feature)
        {
          post: {
            url: '/api/sourcing',
            headers: {
              'Authorization': 'Bearer {{ authToken }}',
              'User-Agent': 'NetPost-Mobile/1.0 (iOS)',
              'Content-Type': 'application/json'
            },
            json: {
              title: 'Mobile Sourced Item {{ $randomString() }}',
              category: 'Electronics',
              purchasePrice: '{{ $randomInt(10, 100) }}.99',
              estimatedValue: '{{ $randomInt(50, 200) }}.00',
              condition: 'good',
              notes: 'Found at local thrift store'
            },
            expect: {
              statusCode: 201
            }
          }
        },
        // Sync status check
        {
          get: {
            url: '/api/sync/status',
            headers: {
              'Authorization': 'Bearer {{ authToken }}',
              'User-Agent': 'NetPost-Mobile/1.0 (iOS)'
            },
            expect: {
              statusCode: 200,
              hasProperty: 'lastSync'
            }
          }
        },
        // Upload image (mobile camera)
        {
          post: {
            url: '/api/upload/mobile-image',
            headers: {
              'Authorization': 'Bearer {{ authToken }}',
              'User-Agent': 'NetPost-Mobile/1.0 (iOS)'
            },
            formData: {
              file: '@tests/fixtures/mobile-camera-photo.jpg',
              compress: 'true',
              quality: '0.8'
            },
            expect: {
              statusCode: 200
            }
          }
        }
      ]
    }
  ]
};
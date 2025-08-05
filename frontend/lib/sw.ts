/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { Queue } from 'workbox-background-sync';

// TypeScript declarations for service worker
declare const self: ServiceWorkerGlobalScope;

// Precache and route static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// App Shell - Cache the main application shell
registerRoute(
  ({ request, url }) => {
    return (
      request.destination === 'document' &&
      (url.pathname.startsWith('/patient') || url.pathname === '/')
    );
  },
  new NetworkFirst({
    cacheName: 'app-shell',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// API Routes - Different strategies for different endpoints
// Patient data - Always try network first for fresh data
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/patients'),
  new NetworkFirst({
    cacheName: 'patient-api',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
  })
);

// Questionnaires - Cache with background sync for offline support
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/questionnaires'),
  new StaleWhileRevalidate({
    cacheName: 'questionnaires-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// Authentication endpoints - Always use network
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/auth'),
  new NetworkOnly()
);

// Static assets (images, fonts, etc.)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// Background Sync for Questionnaire Responses
const questionnaireQueue = new Queue('questionnaire-responses', {
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        const response = await fetch(entry.request);
        if (response.ok) {
          console.log('Successfully synced questionnaire response');
          
          // Notify the main thread of successful sync
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              payload: { url: entry.request.url }
            });
          });
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Failed to sync questionnaire response:', error);
        
        // Put the request back in the queue for retry
        await queue.unshiftRequest(entry);
        
        // Notify the main thread of sync failure
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_FAILED',
            payload: { 
              url: entry.request.url, 
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        });
        break;
      }
    }
  }
});

// Intercept questionnaire response submissions for background sync
registerRoute(
  ({ url, request }) => {
    return url.pathname.includes('/api/patients/responses') && request.method === 'POST';
  },
  async ({ event }) => {
    try {
      // Try to submit immediately
      const response = await fetch(event.request.clone());
      
      if (response.ok) {
        return response;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log('Network failed, queuing for background sync');
      
      // Add to background sync queue
      await questionnaireQueue.pushRequest({ request: event.request });
      
      // Return a response indicating the request was queued
      return new Response(
        JSON.stringify({
          success: false,
          queued: true,
          message: 'Your response has been saved and will be submitted when you\'re back online.'
        }),
        {
          status: 202,
          statusText: 'Accepted - Queued for Background Sync',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }
);

// Background Sync for Media Uploads
const mediaQueue = new Queue('media-uploads', {
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        const response = await fetch(entry.request);
        if (response.ok) {
          console.log('Successfully synced media upload');
          
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'MEDIA_SYNC_SUCCESS',
              payload: { url: entry.request.url }
            });
          });
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Failed to sync media upload:', error);
        
        await queue.unshiftRequest(entry);
        
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'MEDIA_SYNC_FAILED',
            payload: { 
              url: entry.request.url, 
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        });
        break;
      }
    }
  }
});

// Handle media upload failures
registerRoute(
  ({ url, request }) => {
    return url.pathname.includes('/api/media/upload') && request.method === 'POST';
  },
  async ({ event }) => {
    try {
      const response = await fetch(event.request.clone());
      
      if (response.ok) {
        return response;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log('Media upload failed, queuing for background sync');
      
      await mediaQueue.pushRequest({ request: event.request });
      
      return new Response(
        JSON.stringify({
          success: false,
          queued: true,
          message: 'Your file has been saved and will be uploaded when you\'re back online.'
        }),
        {
          status: 202,
          statusText: 'Accepted - Queued for Background Sync',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }
);

// Offline fallback for navigation
const navigationHandler = async (params: any) => {
  try {
    return await new NetworkFirst({
      cacheName: 'navigations',
      networkTimeoutSeconds: 3,
    }).handle(params);
  } catch (error) {
    // Return offline page for navigation requests
    const cache = await caches.open('app-shell');
    return cache.match('/offline') || new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Clinical Trial Platform</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              text-align: center; 
              padding: 2rem; 
              background: #f8fafc;
              color: #334155;
            }
            .container { 
              max-width: 400px; 
              margin: 0 auto; 
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .icon { 
              font-size: 3rem; 
              margin-bottom: 1rem; 
            }
            h1 { 
              color: #1e293b; 
              margin-bottom: 1rem;
            }
            p { 
              margin-bottom: 1.5rem; 
              line-height: 1.6;
            }
            .retry-btn {
              background: #2563eb;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              cursor: pointer;
              font-size: 1rem;
              margin-top: 1rem;
            }
            .retry-btn:hover {
              background: #1d4ed8;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📱</div>
            <h1>You're Offline</h1>
            <p>
              Your responses are saved locally and will be submitted automatically 
              when your connection is restored.
            </p>
            <p>
              You can continue completing questionnaires offline.
            </p>
            <button class="retry-btn" onclick="location.reload()">
              Try Again
            </button>
          </div>
          
          <script>
            // Auto-reload when back online
            window.addEventListener('online', () => {
              location.reload();
            });
            
            // Show online/offline status
            function updateStatus() {
              if (navigator.onLine) {
                document.body.style.borderTop = '4px solid #22c55e';
              } else {
                document.body.style.borderTop = '4px solid #ef4444';
              }
            }
            
            window.addEventListener('online', updateStatus);
            window.addEventListener('offline', updateStatus);
            updateStatus();
          </script>
        </body>
      </html>
      `,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
};

registerRoute(new NavigationRoute(navigationHandler));

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options: NotificationOptions = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: data.data,
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/icons/action-open.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    requireInteraction: data.priority === 'high',
    silent: false,
    tag: data.tag || 'clinical-trial',
    timestamp: Date.now(),
    vibrate: [100, 50, 100],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Clinical Trial Platform', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/patient';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Check if there's already a client with the target URL open
        for (const client of clients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no client is open, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLAIM_CLIENTS':
      self.clients.claim();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({
        type: 'VERSION',
        payload: { version: '1.0.0' }
      });
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName.startsWith('clinical-trial-')) {
                return caches.delete(cacheName);
              }
            })
          );
        })
      );
      break;
      
    case 'SYNC_NOW':
      // Trigger immediate sync
      event.waitUntil(
        Promise.all([
          questionnaireQueue.replayRequests(),
          mediaQueue.replayRequests()
        ])
      );
      break;
  }
});

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  // Force activation of new service worker
  event.waitUntil(self.skipWaiting());
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('clinical-trial-') && 
                !cacheName.includes('v1')) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim all clients immediately
      self.clients.claim()
    ])
  );
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

// Network status reporting
self.addEventListener('online', () => {
  console.log('Service Worker: Back online');
  
  // Notify all clients
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'ONLINE' });
    });
  });
  
  // Trigger sync of queued requests
  questionnaireQueue.replayRequests();
  mediaQueue.replayRequests();
});

self.addEventListener('offline', () => {
  console.log('Service Worker: Gone offline');
  
  // Notify all clients
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'OFFLINE' });
    });
  });
});

export {};
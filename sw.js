var CACHE = 'taigi700-v6';

var STATIC = [
  '.',
  'index.html',
  'moe700.js',
  'manifest.json',
  'favicon.svg',
  'favicon-32.png',
  'favicon-64.png',
  'icon-192.png',
  'icon-512.png',
  'audio-files.json',
  'NunitoPOJ-Regular.ttf',
  'AnonymousPro-Bold.ttf'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(STATIC);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    }).then(function() {
      return self.clients.claim();
    }).then(function() {
      // Start background audio caching after activation
      return self.clients.matchAll().then(function(clients) {
        clients.forEach(function(c) { c.postMessage({ type: 'SW_READY' }); });
      });
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(res) {
        if (!res || res.status !== 200) return res;
        var clone = res.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        return res;
      });
    })
  );
});

// Handle audio pre-cache command from page
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'CACHE_AUDIO') {
    var files = e.data.files;
    var total = files.length;
    var done = 0;
    var BATCH = 10;

    function next(i) {
      if (i >= total) {
        e.source.postMessage({ type: 'CACHE_DONE', total: total });
        return;
      }
      var batch = files.slice(i, i + BATCH);
      Promise.all(batch.map(function(url) {
        return caches.open(CACHE).then(function(cache) {
          return cache.match(url).then(function(hit) {
            if (hit) { done++; return; }
            return fetch(url).then(function(res) {
              if (res && res.status === 200) cache.put(url, res);
              done++;
            }).catch(function() { done++; });
          });
        });
      })).then(function() {
        e.source.postMessage({ type: 'CACHE_PROGRESS', done: done, total: total });
        next(i + BATCH);
      });
    }
    next(0);
  }
});

const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/db.js",
    "/index.js",
    "/manifest.json",
    "/service-worker.js",
    "/style.css",
    "/icon",
    "/icon-192x192.png",
    "/icon-512x512.png",
];

const PRECACHE = "precache-v1";
const RUNTIME = "runtime";

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(PRECACHE)
            .then((cache) => cache.addAll(FILES_TO_CACHE))
            .then(self.skipWaiting())
    );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener("activate", (event) => {
    const currentCaches = [PRECACHE, RUNTIME];
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return cacheNames.filter(
                    (cacheName) => !currentCaches.includes(cacheName)
                );
            })
            .then((cachesToDelete) => {
                return Promise.all(
                    cachesToDelete.map((cacheToDelete) => {
                        return caches.delete(cacheToDelete);
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.url.includes("/api/")) {
        event.respondWith(
            caches
                .open(RUNTIME)
                .then((cachedResponse) => {
                    return fetch(event.request)
                        .then((response) => {
                            if (response.status === 200) {
                                cachedResponse.put(
                                    event.request.url,
                                    response.clone()
                                );
                            }
                            return response;
                        })
                        .catch((err) => {
                            return err;
                        });
                })
                .catch((err) => {
                    return err;
                })
        );
        return
    }
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request).then(response => {
                if (response) {
                    return response
                } else if (event.request.headers.get("accept").includes("text/html")) {
                    return caches.match("/")
                }
            })
        }))
});

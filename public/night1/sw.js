// Night 1 test service worker. It exists only so the page meets every
// browser's install (add-to-home-screen) rules, including older ones that
// demand a fetch handler. It caches nothing: every request goes to the network.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => event.respondWith(fetch(event.request)));

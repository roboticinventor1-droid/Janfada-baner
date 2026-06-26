const CACHE_NAME = "janfada-v6";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// نصب
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // تبدیل آدرس‌ها به Requestهایی که کش مرورگر را دور می‌زنند
      const requests = ASSETS.map(url => new Request(url, { cache: "reload" }));
      
      return cache.addAll(requests).catch((err) => {
        console.log("Cache addAll failed:", err);
      });
    })
  );
});

// فعال‌سازی + حذف کش‌های قدیمی
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// فچ امن (بدون crash)
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // ❌ فقط HTTP/HTTPS
  if (!req.url.startsWith("http")) return;

  // ❌ جلوگیری از chrome-extension / غیر قابل cache
  if (
    req.url.startsWith("chrome-extension") ||
    req.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        // فقط response معتبر cache شود
        if (!res || res.status !== 200 || res.type !== "basic") {
          return res;
        }

        const clone = res.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, clone).catch(() => {});
        });

        return res;
      })
      .catch(() => {
        return caches.match(req).then((cached) => {
          return cached || caches.match("./index.html");
        });
      })
  );
});

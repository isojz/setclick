// SetClick — オフライン用 Service Worker
// ページ本体（index.html）はネット優先：更新がすぐ届く。2.5 秒で応答がなければキャッシュで開く（ライブハウスの地下対策）。
// アイコン等はキャッシュ優先。アセット構成を変えたときは CACHE の番号を上げる。
const CACHE = 'setclick-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
const NAV_TIMEOUT = 2500;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('setclick-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // ?debug や #import 付きでも同じ index.html を使う
    e.respondWith(caches.open(CACHE).then(async cache => {
      const net = fetch(req).then(res => {
        if (res && res.ok && res.type === 'basic') cache.put('./index.html', res.clone());
        return res;
      });
      try {
        return await Promise.race([net, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NAV_TIMEOUT))]);
      } catch {
        e.waitUntil(net.catch(() => null)); // 遅れて届いた新版は次回のためにキャッシュへ
        return (await cache.match('./index.html')) || net;
      }
    }));
    return;
  }

  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(req);
    if (cached) return cached;
    const res = await fetch(req);
    if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  }));
});

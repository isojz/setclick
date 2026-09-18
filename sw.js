// SetClick — オフライン用 Service Worker
// キャッシュ優先で即起動（ライブハウスの地下など電波が弱い場所でも開ける）。
// ネットワークがあれば裏で更新し、次回起動時に新しい版になる。
// アセット構成を変えたときは CACHE の番号を上げる。
const CACHE = 'setclick-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

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
  // ページ遷移は ?debug や #import 付きでも同じ index.html を返す
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(key);
    const net = fetch(req).then(res => {
      if (res && res.ok && res.type === 'basic') cache.put(key, res.clone());
      return res;
    }).catch(() => null);
    if (cached) { e.waitUntil(net); return cached; }
    return (await net) || Response.error();
  }));
});

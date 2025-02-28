//キャッシュの名前を定義
var cacheName ='好きなキャッシュの名前をここに書く';

//キャッシュするファイルのリストを定義
var filesToCache = [
 '/',
 '/index.html',
 '/index.css',
 '/main.js',
'/gradation104.github.io/サイトのパス/'
];

self.addEventListener('install',(event)=>{
    console.log('service workerをインストールしています。');
    event.waitUntill(
      caches.open(cacheName)
	  .then((cache)=>{
          console.log('service worker cacing app shell');
          return cache.addAll(filesToCache);
        }
      )
    )
  }
)

//----------------------------------------------
self.addEventListener('activate',(event)=>{
  console.log('ServiceWorkerが動作しています。');
  event.waitUntil(caches.keys()
    .then((keyList)=>{
      return Promise.all(keyList.map((key)=>{
        if(key!==cacheName){
          console.log('ServiceWorkerremovingoldcache',key);
          return caches.delete(key);
        }
      }));
    }));
  return self.clients.claim();
});

//--------------------------------------------
self.addEventListener('fetch',(event)=>{
  console.log('ServiceWorkerfetching',event.request.url);
  event.respondWith(caches.match(event.request)
    .then((response)=>{
      return response||fetch(event.request);
    })
  );
});
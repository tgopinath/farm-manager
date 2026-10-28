/**
 * A tiny HTML page that plays one camera, used inside a WebView on phones and
 * an iframe on the web.
 *
 *   hls       <video> — Safari plays HLS natively; elsewhere hls.js does
 *   mjpeg     <img>   — the browser keeps the multipart stream open
 *   snapshot  <img>   — reloaded every 2 seconds
 *
 * RTSP cannot be played by any browser or WebView. Cameras that only speak
 * RTSP need a small gateway (go2rtc, MediaMTX, or the NVR's own HLS output).
 */
export type CameraKind = 'hls' | 'mjpeg' | 'snapshot' | 'web'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

export function cameraHtml(kind: CameraKind, url: string) {
  const u = esc(url)
  const body =
    kind === 'hls'
      ? `<video id="v" autoplay muted playsinline controls></video>
         <script src="https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js"></script>
         <script>
           var v = document.getElementById('v'), src = "${u}";
           if (v.canPlayType('application/vnd.apple.mpegurl')) { v.src = src; }
           else if (window.Hls && Hls.isSupported()) { var h = new Hls(); h.loadSource(src); h.attachMedia(v);
             h.on(Hls.Events.ERROR, function (_, d) { if (d.fatal) document.body.dataset.err = '1'; }); }
           else { document.body.dataset.err = '1'; }
         </script>`
      : kind === 'snapshot'
        ? `<img id="i" src="${u}" alt="">
           <script>
             var i = document.getElementById('i'), base = "${u}";
             setInterval(function () { i.src = base + (base.indexOf('?') < 0 ? '?' : '&') + '_t=' + Date.now(); }, 2000);
             i.onerror = function () { document.body.dataset.err = '1'; };
           </script>`
        : `<img src="${u}" alt="" onerror="document.body.dataset.err='1'">`

  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  html,body{margin:0;height:100%;background:#000;display:flex;align-items:center;justify-content:center;font-family:system-ui}
  video,img{max-width:100%;max-height:100%;width:100%;object-fit:contain}
  body[data-err]::after{content:'Stream not reachable from this device';color:#ccc;position:absolute;font-size:14px}
</style></head><body>${body}</body></html>`
}

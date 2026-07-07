

(function () {
  'use strict';

  var FRAME_COUNT  = 90;          
  var SCROLL_HEIGHT_VH = 400;     

  var container    = document.getElementById('scroll-animation');
  var canvas       = document.getElementById('scroll-canvas');
  var loader       = document.getElementById('scroll-loader');
  var loaderBar    = document.getElementById('scroll-loader-bar');
  var loaderText   = document.getElementById('scroll-loader-text');
  var videoSrc     = container ? container.getAttribute('data-video') : null;

  if (!container || !canvas || !videoSrc) return;

  var ctx          = canvas.getContext('2d');
  var frames       = [];
  var currentFrame = -1;
  var ready        = false;
  var rafId        = null;

function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w   = container.clientWidth;
    var h   = window.innerHeight;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (ready) drawFrame(currentFrame);
  }

function drawFrame(index) {
    if (index < 0 || index >= frames.length) return;
    var img = frames[index];
    if (!img) return;

    var cw = canvas.width / (Math.min(window.devicePixelRatio || 1, 2));
    var ch = canvas.height / (Math.min(window.devicePixelRatio || 1, 2));

var imgRatio    = img.width / img.height;
    var canvasRatio = cw / ch;
    var drawW, drawH, dx, dy;

    if (canvasRatio > imgRatio) {
      drawW = cw;
      drawH = cw / imgRatio;
    } else {
      drawH = ch;
      drawW = ch * imgRatio;
    }
    dx = (cw - drawW) / 2;
    dy = (ch - drawH) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, drawW, drawH);
  }

function extractFrames(src, count) {
    return new Promise(function (resolve, reject) {
      var video = document.createElement('video');
      video.muted    = true;
      video.playsInline = true;
      video.preload  = 'auto';
      video.crossOrigin = 'anonymous';
      video.src = src;

      video.addEventListener('error', function () {
        reject(new Error('Video failed to load: ' + src));
      });

      video.addEventListener('loadedmetadata', function () {
        var duration  = video.duration;
        var interval  = duration / count;
        var extracted = [];
        var index     = 0;

var offCanvas = document.createElement('canvas');
        offCanvas.width  = video.videoWidth;
        offCanvas.height = video.videoHeight;
        var offCtx = offCanvas.getContext('2d');

        function seekNext() {
          if (index >= count) {
            resolve(extracted);
            video.src = '';
            video.load(); 
            return;
          }
          video.currentTime = index * interval;
        }

        video.addEventListener('seeked', function () {
          offCtx.drawImage(video, 0, 0, offCanvas.width, offCanvas.height);

var img = new Image();
          img.src = offCanvas.toDataURL('image/jpeg', 0.85);
          img.onload = function () {
            extracted.push(img);

var pct = Math.round(((index + 1) / count) * 100);
            if (loaderBar) loaderBar.style.width = pct + '%';
            if (loaderText) loaderText.textContent = 'Loading ' + pct + '%';

            index++;
            seekNext();
          };
        });

        seekNext();
      });
    });
  }

function onScroll() {
    if (!ready) return;
    if (rafId) return; 

    rafId = requestAnimationFrame(function () {
      rafId = null;

      var rect     = container.getBoundingClientRect();
      var scrollH  = container.scrollHeight || container.offsetHeight;
      var progress = -rect.top / (scrollH - window.innerHeight);
      progress = Math.max(0, Math.min(1, progress));

      var frameIdx = Math.min(Math.floor(progress * FRAME_COUNT), FRAME_COUNT - 1);

if (frameIdx !== currentFrame) {
        currentFrame = frameIdx;
        drawFrame(currentFrame);
      }

animateText(progress);
    });
  }

function animateText(progress) {
    var h3  = document.querySelector('.home .content h3');
    var p   = document.querySelector('.home .content p');
    var btn = document.querySelector('.home .content .btn');
    if (!h3) return;

applyTextAnim(h3,  progress, 0.20, 0.55);
    
    applyTextAnim(p,   progress, 0.40, 0.75);
    
    applyTextAnim(btn, progress, 0.60, 0.95);
  }

  function applyTextAnim(el, progress, start, end) {
    if (!el) return;
    var range = end - start;
    var fadeIn  = range * 0.15; 
    var fadeOut = range * 0.15; 

    var opacity, ty;

    if (progress < start) {
      opacity = 0;
      ty = 30;
    } else if (progress < start + fadeIn) {
      
      var t = (progress - start) / fadeIn;
      opacity = t;
      ty = 30 * (1 - t);
    } else if (progress < end - fadeOut) {
      
      opacity = 1;
      ty = 0;
    } else if (progress < end) {
      
      var t2 = (progress - (end - fadeOut)) / fadeOut;
      opacity = 1 - t2;
      ty = -20 * t2;
    } else {
      opacity = 0;
      ty = -20;
    }

    el.style.opacity   = opacity;
    el.style.transform = 'translateY(' + ty + 'px)';
  }

function init() {
    sizeCanvas();

container.style.height = SCROLL_HEIGHT_VH + 'vh';

var textEls = document.querySelectorAll('.home .content h3, .home .content p, .home .content .btn');
    textEls.forEach(function (el) {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'none';
    });

extractFrames(videoSrc, FRAME_COUNT)
      .then(function (extractedFrames) {
        frames = extractedFrames;
        ready  = true;

currentFrame = 0;
        drawFrame(0);

if (loader) {
          loader.style.opacity = '0';
          setTimeout(function () { loader.style.display = 'none'; }, 400);
        }

window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); 
      })
      .catch(function (err) {
        console.error('[scroll-video]', err);
        
        if (loader) loader.style.display = 'none';
        var fallback = document.querySelector('.home-fallback-img');
        if (fallback) fallback.style.display = 'block';
      });

    window.addEventListener('resize', sizeCanvas);
  }

if (window.matchMedia('(max-width: 768px)').matches) {
    if (container) container.style.height = 'auto';
    var fallback = document.querySelector('.home-fallback-img');
    if (fallback) fallback.style.display = 'block';
    if (loader) loader.style.display = 'none';
    
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/**
 * Omegatek Welcome Popup
 * Self-contained: injects its own HTML + CSS into the DOM.
 * - Shows 3s after load (if not dismissed in last 24h)
 * - Shows immediately on 'omegatek:auth-success' event
 * - Sends message via WhatsApp (wa.me)
 * - Optional newsletter subscribe via newsletter-api.php
 * - 24h cooldown stored in localStorage
 */
(function () {
   'use strict';

   var LS_KEY      = 'ot_popup_dismissed';
   var WA_NUMBER   = '27736538207';
   var COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
   var SHOW_DELAY  = 3000;                 // 3 seconds after load

   /* ── Paths (absolute so they work from any page depth) ──────────── */
   var MASCOT_IMG = '/images2/pops.png';
   var LOGO_IMG   = '/images2/OMEGATEK_SOLUTIONS_9-NO%20BG.png';

   /* ── Utility ──────────────────────────────────────────────────────── */
   function wasCooldownActive() {
      try {
         var ts = localStorage.getItem(LS_KEY);
         if (!ts) return false;
         return (Date.now() - parseInt(ts, 10)) < COOLDOWN_MS;
      } catch (e) { return false; }
   }

   function setCooldown() {
      try { localStorage.setItem(LS_KEY, Date.now().toString()); } catch (e) {}
   }

   /* ── CSS ──────────────────────────────────────────────────────────── */
   function injectStyles() {
      if (document.getElementById('ot-wp-styles')) return;
      var style = document.createElement('style');
      style.id = 'ot-wp-styles';
      style.textContent = [
         /* ▸ Overlay */
         '.ot-wp-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;visibility:hidden;transition:opacity .4s ease,visibility .4s ease;padding:16px;}',
         '.ot-wp-overlay.ot-wp-visible{opacity:1;visibility:visible;}',

         /* ▸ Card */
         '.ot-wp-card{position:relative;display:flex;flex-direction:row;max-width:820px;width:100%;border-radius:4px;overflow:hidden;box-shadow:0 24px 80px rgba(179,12,230,.25),0 0 0 1.5px rgba(179,12,230,.15);background:linear-gradient(135deg,#faf5ff 0%,#fff 60%,#f0fff4 100%);transform:translateY(40px) scale(.96);transition:transform .45s cubic-bezier(.22,1,.36,1);animation:ot-wp-shimmer 3s ease-in-out infinite alternate;}',
         '.ot-wp-overlay.ot-wp-visible .ot-wp-card{transform:translateY(0) scale(1);}',
         '@keyframes ot-wp-shimmer{0%{box-shadow:0 24px 80px rgba(179,12,230,.2),0 0 0 1.5px rgba(179,12,230,.12)} 100%{box-shadow:0 24px 80px rgba(0,245,212,.18),0 0 0 1.5px rgba(179,12,230,.18)}}',

         /* ▸ Close button */
         '.ot-wp-close{position:absolute;top:10px;right:12px;z-index:10;width:32px;height:32px;border-radius:2px;border:1px solid rgba(179,12,230,.15);background:rgba(179,12,230,.06);color:#b30ce6;font-size:20px;line-height:30px;text-align:center;cursor:pointer;transition:all .25s ease;}',
         '.ot-wp-close:hover{background:#b30ce6;color:#fff;transform:scale(1.08);}',

         /* ▸ Left column — background matched to pops.png cream (#f5efe6) */
         '.ot-wp-left{flex:0 0 270px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f5efe6;padding:36px 22px;gap:14px;position:relative;overflow:hidden;}',
         '.ot-wp-left::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 80%,rgba(179,12,230,.06) 0%,transparent 70%);pointer-events:none;}',
         '.ot-wp-mascot{width:200px;height:auto;border-radius:4px;filter:drop-shadow(0 8px 24px rgba(179,12,230,.18));transition:transform .4s cubic-bezier(.22,1,.36,1);animation:ot-wp-float 3s ease-in-out infinite;}',
         '.ot-wp-mascot:hover{transform:scale(1.08) rotate(-2deg);}',
         '@keyframes ot-wp-float{0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)}}',
         '.ot-wp-logo{width:120px;height:auto;opacity:.85;transition:opacity .3s;}',
         '.ot-wp-logo:hover{opacity:1;}',

         /* ▸ Right column */
         '.ot-wp-right{flex:1;padding:36px 32px 28px;display:flex;flex-direction:column;gap:14px;min-width:0;}',
         '.ot-wp-right h2{font-family:"Inter","Plus Jakarta Sans",system-ui,sans-serif;font-size:1.35rem;font-weight:700;color:#1a1a2e;margin:0;line-height:1.3;}',
         '.ot-wp-right h2 span{background:linear-gradient(135deg,#b30ce6,#9333ea);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}',
         '.ot-wp-right p{font-family:"Montserrat",sans-serif;font-size:.88rem;color:#555;margin:0;line-height:1.55;}',

         /* ▸ Textarea */
         '.ot-wp-textarea{width:100%;min-height:90px;max-height:150px;resize:vertical;border:1.5px solid rgba(179,12,230,.18);border-radius:3px;padding:14px 16px;font-family:"Montserrat",sans-serif;font-size:.88rem;color:#333;background:#f8f5ff;outline:none;transition:border-color .25s,box-shadow .25s;}',
         '.ot-wp-textarea:focus{border-color:#b30ce6;box-shadow:0 0 0 3px rgba(179,12,230,.1);}',
         '.ot-wp-textarea::placeholder{color:#aaa;}',

         /* ▸ Newsletter row */
         '.ot-wp-newsletter{display:flex;flex-direction:column;gap:8px;}',
         '.ot-wp-nl-label{display:flex;align-items:center;gap:8px;font-size:.82rem;color:#555;cursor:pointer;font-family:"Montserrat",sans-serif;}',
         '.ot-wp-nl-label input[type=checkbox]{accent-color:#b30ce6;width:16px;height:16px;cursor:pointer;}',
         '.ot-wp-nl-email{width:100%;border:1.5px solid rgba(179,12,230,.18);border-radius:3px;padding:10px 14px;font-size:.85rem;font-family:"Montserrat",sans-serif;background:#f8f5ff;color:#333;outline:none;transition:border-color .25s,box-shadow .25s,max-height .35s ease,opacity .35s ease,padding .35s ease;max-height:0;opacity:0;padding:0 14px;overflow:hidden;border-width:0;}',
         '.ot-wp-nl-email.ot-wp-show{max-height:50px;opacity:1;padding:10px 14px;border-width:1.5px;}',
         '.ot-wp-nl-email:focus{border-color:#b30ce6;box-shadow:0 0 0 3px rgba(179,12,230,.1);}',

         /* ▸ Send button */
         '.ot-wp-send{display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px 22px;border:none;border-radius:3px;font-family:"Inter","Plus Jakarta Sans",system-ui,sans-serif;font-size:.95rem;font-weight:600;color:#fff;background:linear-gradient(135deg,#b30ce6 0%,#9333ea 50%,#25D366 100%);background-size:200% 200%;background-position:0% 50%;cursor:pointer;transition:all .35s ease;box-shadow:0 4px 16px rgba(179,12,230,.25);position:relative;overflow:hidden;}',
         '.ot-wp-send::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);transform:translateX(-100%);transition:transform .5s ease;}',
         '.ot-wp-send:hover{background-position:100% 50%;transform:translateY(-2px);box-shadow:0 8px 28px rgba(37,211,102,.3);}',
         '.ot-wp-send:hover::before{transform:translateX(100%);}',
         '.ot-wp-send:active{transform:translateY(0);}',
         '.ot-wp-send:disabled{opacity:.55;cursor:not-allowed;transform:none!important;}',
         '.ot-wp-send .fa-whatsapp{font-size:1.15rem;}',

         /* ▸ Success state */
         '.ot-wp-success{text-align:center;padding:40px 20px;display:flex;flex-direction:column;align-items:center;gap:16px;}',
         '.ot-wp-success-icon{font-size:3rem;color:#25D366;animation:ot-wp-pop .5s cubic-bezier(.22,1,.36,1);}',
         '@keyframes ot-wp-pop{0%{transform:scale(0) rotate(-10deg);opacity:0} 60%{transform:scale(1.2) rotate(5deg)} 100%{transform:scale(1) rotate(0);opacity:1}}',
         '.ot-wp-success h3{font-family:"Inter",system-ui,sans-serif;font-size:1.2rem;color:#1a1a2e;margin:0;}',
         '.ot-wp-success p{font-size:.85rem;color:#666;margin:0;}',

         /* ▸ Confetti particles */
         '.ot-wp-confetti{position:absolute;inset:0;pointer-events:none;overflow:hidden;}',
         '.ot-wp-confetti i{position:absolute;width:8px;height:8px;border-radius:2px;opacity:0;animation:ot-wp-fall 1.2s ease-out forwards;}',
         '@keyframes ot-wp-fall{0%{opacity:1;transform:translateY(-20px) rotate(0deg) scale(1)} 100%{opacity:0;transform:translateY(300px) rotate(720deg) scale(.3)}}',

         /* ▸ Responsive */
         '@media(max-width:640px){',
         '  .ot-wp-card{flex-direction:column;max-width:420px;max-height:90vh;overflow-y:auto;}',
         '  .ot-wp-left{flex:0 0 auto;padding:24px 20px 16px;flex-direction:row;gap:16px;}',
         '  .ot-wp-mascot{width:100px;}',
         '  .ot-wp-logo{width:80px;}',
         '  .ot-wp-right{padding:20px 20px 24px;}',
         '  .ot-wp-right h2{font-size:1.15rem;}',
         '  .ot-wp-textarea{min-height:60px;}',
         '}'
      ].join('\n');
      document.head.appendChild(style);
   }

   /* ── HTML ─────────────────────────────────────────────────────────── */
   function injectHTML() {
      if (document.getElementById('ot-welcome-popup')) return;
      var div = document.createElement('div');
      div.id = 'ot-welcome-popup';
      div.className = 'ot-wp-overlay';
      div.setAttribute('role', 'dialog');
      div.setAttribute('aria-modal', 'true');
      div.setAttribute('aria-label', 'Welcome to Omegatek Solutions');
      div.innerHTML = [
         '<div class="ot-wp-card">',
         '  <button class="ot-wp-close" aria-label="Close popup">&times;</button>',
         '  <div class="ot-wp-left">',
         '    <img src="' + MASCOT_IMG + '" alt="Omegatek mascot" class="ot-wp-mascot" loading="eager">',
         '    <img src="' + LOGO_IMG + '" alt="Omegatek Solutions" class="ot-wp-logo" loading="eager">',
         '  </div>',
         '  <div class="ot-wp-right" id="ot-wp-right-content">',
         '    <h2>Welcome to <span>Omegatek Solutions</span></h2>',
         '    <p>Got a tech challenge, an app idea, or a website vision? Tell us what you need &mdash; we&rsquo;d love to help!</p>',
         '    <textarea class="ot-wp-textarea" id="ot-wp-message" placeholder="What problem are you facing?\nWhat app or website idea do you have?\nWhat brings you to Omegatek today?" maxlength="1000"></textarea>',
         '    <div class="ot-wp-newsletter">',
         '      <label class="ot-wp-nl-label">',
         '        <input type="checkbox" id="ot-wp-nl-check">',
         '        <span>Subscribe to our newsletter for tech tips &amp; updates</span>',
         '      </label>',
         '      <input type="email" class="ot-wp-nl-email" id="ot-wp-nl-email" placeholder="Your email address">',
         '    </div>',
         '    <button class="ot-wp-send" id="ot-wp-send">',
         '      <i class="fab fa-whatsapp"></i> Send via WhatsApp',
         '    </button>',
         '  </div>',
         '</div>'
      ].join('\n');
      document.body.appendChild(div);
   }

   /* ── Confetti helper ──────────────────────────────────────────────── */
   function spawnConfetti(container) {
      var colors = ['#b30ce6', '#9333ea', '#00f5d4', '#25D366', '#f59e0b', '#ef4444', '#3b82f6'];
      var frag = document.createDocumentFragment();
      for (var i = 0; i < 30; i++) {
         var c = document.createElement('i');
         c.style.left = Math.random() * 100 + '%';
         c.style.top = Math.random() * 30 + '%';
         c.style.background = colors[Math.floor(Math.random() * colors.length)];
         c.style.animationDelay = (Math.random() * .6) + 's';
         c.style.width  = (4 + Math.random() * 6) + 'px';
         c.style.height = (4 + Math.random() * 6) + 'px';
         frag.appendChild(c);
      }
      container.appendChild(frag);
   }

   /* ── Show / Hide ──────────────────────────────────────────────────── */
   var overlay = null;

   function show() {
      if (!overlay) return;
      overlay.classList.add('ot-wp-visible');
      document.body.style.overflow = 'hidden';
      /* Focus trap: focus the textarea */
      var ta = document.getElementById('ot-wp-message');
      if (ta) setTimeout(function () { ta.focus(); }, 500);
   }

   function hide() {
      if (!overlay) return;
      overlay.classList.remove('ot-wp-visible');
      document.body.style.overflow = '';
      setCooldown();
   }

   /* ── Newsletter subscribe (fire-and-forget) ───────────────────────── */
   function subscribeNewsletter(email) {
      if (!email) return;
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/admin/newsletter-api.php', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({ action: 'subscribe', email: email }));
   }

   /* ── WhatsApp send ────────────────────────────────────────────────── */
   function sendToWhatsApp(message) {
      var lines = [
         '--- Omegatek Website Inquiry ---',
         '',
         message,
         '',
         'Sent from: ' + window.location.href
      ];
      var encoded = encodeURIComponent(lines.join('\n'));
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encoded, '_blank');
   }

   /* ── Show success state ───────────────────────────────────────────── */
   function showSuccess() {
      var right = document.getElementById('ot-wp-right-content');
      if (!right) return;
      right.innerHTML = [
         '<div class="ot-wp-success">',
         '  <div class="ot-wp-confetti"></div>',
         '  <div class="ot-wp-success-icon"><i class="fas fa-check-circle"></i></div>',
         '  <h3>Message Sent!</h3>',
         '  <p>We\'ll get back to you shortly. Thanks for reaching out!</p>',
         '</div>'
      ].join('\n');
      /* Confetti */
      var confettiContainer = right.querySelector('.ot-wp-confetti');
      if (confettiContainer) spawnConfetti(confettiContainer);
      /* Auto-close after 2.5s */
      setTimeout(hide, 2500);
   }

   /* ── Bind events ──────────────────────────────────────────────────── */
   function bindEvents() {
      overlay = document.getElementById('ot-welcome-popup');
      if (!overlay) return;

      /* Close button */
      var closeBtn = overlay.querySelector('.ot-wp-close');
      if (closeBtn) closeBtn.addEventListener('click', hide);

      /* Click backdrop to close */
      overlay.addEventListener('click', function (e) {
         if (e.target === overlay) hide();
      });

      /* Escape key */
      document.addEventListener('keydown', function (e) {
         if (e.key === 'Escape' && overlay.classList.contains('ot-wp-visible')) hide();
      });

      /* Newsletter checkbox → toggle email field */
      var nlCheck = document.getElementById('ot-wp-nl-check');
      var nlEmail = document.getElementById('ot-wp-nl-email');
      if (nlCheck && nlEmail) {
         nlCheck.addEventListener('change', function () {
            if (nlCheck.checked) {
               nlEmail.classList.add('ot-wp-show');
               /* Auto-fill email if user is logged in (Supabase stores in localStorage) */
               try {
                  var sbKeys = Object.keys(localStorage).filter(function (k) { return k.indexOf('supabase.auth') > -1; });
                  for (var i = 0; i < sbKeys.length; i++) {
                     var parsed = JSON.parse(localStorage.getItem(sbKeys[i]));
                     var email = parsed && parsed.user && parsed.user.email;
                     if (email) { nlEmail.value = email; break; }
                  }
               } catch (e) {}
            } else {
               nlEmail.classList.remove('ot-wp-show');
            }
         });
      }

      /* Send button */
      var sendBtn = document.getElementById('ot-wp-send');
      var messageEl = document.getElementById('ot-wp-message');
      if (sendBtn && messageEl) {
         sendBtn.addEventListener('click', function () {
            var msg = messageEl.value.trim();
            if (!msg) {
               messageEl.style.borderColor = '#ef4444';
               messageEl.setAttribute('placeholder', 'Please type your message before sending...');
               messageEl.focus();
               setTimeout(function () { messageEl.style.borderColor = ''; }, 2000);
               return;
            }

            /* Newsletter subscribe if checked */
            if (nlCheck && nlCheck.checked && nlEmail) {
               var email = nlEmail.value.trim();
               if (email && email.indexOf('@') > 0) {
                  subscribeNewsletter(email);
               }
            }

            /* Disable button to prevent double-click */
            sendBtn.disabled = true;

            /* Send to WhatsApp */
            sendToWhatsApp(msg);

            /* Show success + auto-close */
            showSuccess();
         });
      }
   }

   /* ── Init ─────────────────────────────────────────────────────────── */
   function boot() {
      injectStyles();
      injectHTML();
      bindEvents();

      /* Schedule normal show after delay (if cooldown not active) */
      if (!wasCooldownActive()) {
         setTimeout(show, SHOW_DELAY);
      }

      /* Listen for auth success → show immediately (bypass cooldown) */
      window.addEventListener('omegatek:auth-success', function () {
         /* Small delay to let auth modal close first */
         setTimeout(show, 800);
      });
   }

   if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
   } else {
      boot();
   }
})();

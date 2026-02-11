/**
 * Copy for Agent — share-gated markdown copy with copy protection.
 * Add <script src="copy-for-agent.js" defer></script> to any Content HTML file.
 *
 * Configuration (optional data attributes on <html>):
 *   data-share-url="https://agentictribe.ge/posts/x-accounts"  — canonical URL for sharing
 *   data-share-text="20+ X ექაუნთი AI სიახლეებისთვის"         — pre-filled share text
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'at_shared_' + slugify(document.title);
  var COUNTDOWN = 15; // seconds

  var shareUrl = document.documentElement.dataset.shareUrl || window.location.href;
  var shareText = document.documentElement.dataset.shareText || document.title;

  // =====================
  // 1. COPY PROTECTION
  // =====================
  var style = document.createElement('style');
  style.textContent =
    '.square, .page, .square-body, .post-header, .intro, .section, .cta-block, .acct, .account-card {' +
    '  -webkit-user-select: none; user-select: none;' +
    '}' +
    '@media print { .share-gate-overlay, .copy-agent-btn { display: none !important; } }';
  document.head.appendChild(style);

  document.addEventListener('contextmenu', function (e) {
    if (!e.target.closest('.share-gate-overlay')) e.preventDefault();
  });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'a' || e.key === 'A')) {
      if (!e.target.closest('input, textarea')) e.preventDefault();
    }
  });

  // =====================
  // 2. COPY BUTTON
  // =====================
  var btn = document.createElement('button');
  btn.className = 'copy-agent-btn';
  setBtnIdle();
  document.body.appendChild(btn);

  btn.addEventListener('click', function () {
    if (isUnlocked()) {
      doCopy();
    } else {
      showGate();
    }
  });

  // =====================
  // 3. SHARE GATE MODAL
  // =====================
  var overlay = document.createElement('div');
  overlay.className = 'share-gate-overlay';
  overlay.innerHTML =
    '<div class="share-gate">' +
      '<button class="share-gate-close" aria-label="Close">&times;</button>' +
      '<div class="share-gate-icon">' +
        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' +
      '</div>' +
      '<h2 class="share-gate-title">გააზიარე და დააკოპირე</h2>' +
      '<p class="share-gate-desc">გააზიარე ეს პოსტი სოციალურ ქსელში — შემდეგ მარკდაუნი ავტომატურად დაკოპირდება.</p>' +
      '<div class="share-gate-buttons">' +
        '<button class="share-btn share-btn-x" data-platform="x">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' +
          '<span>X-ზე გაზიარება</span>' +
        '</button>' +
        '<button class="share-btn share-btn-li" data-platform="linkedin">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>' +
          '<span>LinkedIn-ზე</span>' +
        '</button>' +
      '</div>' +
      '<div class="share-gate-countdown" style="display:none;">' +
        '<div class="countdown-ring"><span class="countdown-num"></span></div>' +
        '<p class="countdown-text">გთხოვთ დაელოდოთ...</p>' +
      '</div>' +
      '<button class="share-gate-copy-btn" style="display:none;">დააკოპირე მარკდაუნი</button>' +
    '</div>';
  document.body.appendChild(overlay);

  // Close button
  overlay.querySelector('.share-gate-close').addEventListener('click', hideGate);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) hideGate();
  });

  // Share buttons
  overlay.querySelectorAll('.share-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var platform = this.dataset.platform;
      openShareIntent(platform);
      startCountdown();
    });
  });

  // Final copy button inside modal
  overlay.querySelector('.share-gate-copy-btn').addEventListener('click', function () {
    markUnlocked();
    hideGate();
    doCopy();
  });

  // =====================
  // 4. LOGIC
  // =====================
  function showGate() {
    // Reset state
    overlay.querySelector('.share-gate-buttons').style.display = '';
    overlay.querySelector('.share-gate-countdown').style.display = 'none';
    overlay.querySelector('.share-gate-copy-btn').style.display = 'none';
    overlay.classList.add('visible');
  }

  function hideGate() {
    overlay.classList.remove('visible');
  }

  function openShareIntent(platform) {
    var url;
    if (platform === 'x') {
      url = 'https://x.com/intent/tweet?text=' + encodeURIComponent(shareText) + '&url=' + encodeURIComponent(shareUrl);
    } else {
      url = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(shareUrl);
    }
    window.open(url, '_blank', 'width=600,height=500');
  }

  function startCountdown() {
    var buttonsDiv = overlay.querySelector('.share-gate-buttons');
    var countdownDiv = overlay.querySelector('.share-gate-countdown');
    var numEl = overlay.querySelector('.countdown-num');
    var textEl = overlay.querySelector('.countdown-text');
    var copyBtn = overlay.querySelector('.share-gate-copy-btn');

    buttonsDiv.style.display = 'none';
    countdownDiv.style.display = '';

    var remaining = COUNTDOWN;
    numEl.textContent = remaining;

    var timer = setInterval(function () {
      remaining--;
      numEl.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(timer);
        countdownDiv.style.display = 'none';
        copyBtn.style.display = '';
      }
    }, 1000);
  }

  function doCopy() {
    var md = pageToMarkdown();
    navigator.clipboard.writeText(md).then(function () {
      btn.classList.add('copied');
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> დაკოპირდა!';
      setTimeout(function () {
        btn.classList.remove('copied');
        setBtnIdle();
      }, 2500);
    });
  }

  function setBtnIdle() {
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> Copy as Markdown';
  }

  function isUnlocked() {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
  }

  function markUnlocked() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
  }

  // =====================
  // 5. DOM → MARKDOWN
  // =====================
  function pageToMarkdown() {
    var lines = [];

    var titleEl = document.querySelector('.square-header h1, .post-header .post-title, h1');
    if (titleEl) {
      lines.push('# ' + clean(titleEl.textContent));
      lines.push('');
    }

    var subtitleEl = document.querySelector('.post-subtitle');
    if (subtitleEl) {
      lines.push('*' + clean(subtitleEl.textContent) + '*');
      lines.push('');
    }

    var introEl = document.querySelector('.intro');
    if (introEl) {
      introEl.querySelectorAll('p').forEach(function (p) {
        lines.push(inlineMarkdown(p));
      });
      lines.push('');
    }

    var bodyEl = document.querySelector('.square-body');
    if (bodyEl) {
      walkSquareBody(bodyEl, lines);
    }

    if (!bodyEl) {
      document.querySelectorAll('.section').forEach(function (sec) {
        var title = sec.querySelector('.section-title');
        if (title) {
          lines.push('## ' + clean(title.textContent));
          lines.push('');
        }
        sec.querySelectorAll('.account-card').forEach(function (card) {
          lines.push(accountToMd(card, '.account-handle a', '.account-desc'));
        });
        lines.push('');
      });
    }

    var ctaEl = document.querySelector('.cta-block');
    if (ctaEl) {
      var ctaTitle = ctaEl.querySelector('.cta-title');
      if (ctaTitle) {
        lines.push('---');
        lines.push('');
        lines.push('## ' + clean(ctaTitle.textContent));
        lines.push('');
      }
      ctaEl.querySelectorAll('p').forEach(function (p) {
        lines.push(clean(p.textContent));
      });
      var stepsList = ctaEl.querySelector('.steps-list');
      if (stepsList) {
        lines.push('');
        var stepNum = 1;
        stepsList.querySelectorAll('li').forEach(function (li) {
          lines.push(stepNum + '. ' + clean(li.textContent));
          stepNum++;
        });
      }
      var result = ctaEl.querySelector('.cta-result');
      if (result) {
        lines.push('');
        lines.push('> ' + inlineMarkdown(result));
      }
      lines.push('');
    }

    document.querySelectorAll('.content-block').forEach(function (block) {
      var heading = block.querySelector('h2, h3');
      if (heading) {
        var level = heading.tagName === 'H2' ? '## ' : '### ';
        lines.push(level + clean(heading.textContent));
        lines.push('');
      }
      block.querySelectorAll('p').forEach(function (p) {
        lines.push(inlineMarkdown(p));
      });
      block.querySelectorAll('ol li, ul li').forEach(function (li, i) {
        var parent = li.closest('ol, ul');
        var prefix = parent && parent.tagName === 'OL' ? (i + 1) + '. ' : '- ';
        lines.push(prefix + clean(li.textContent));
      });
      lines.push('');
    });

    lines.push('---');
    lines.push('*Agentic Tribe*');

    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function walkSquareBody(body, lines) {
    var children = body.children;
    for (var i = 0; i < children.length; i++) {
      var el = children[i];
      if (el.classList.contains('section-label')) {
        if (i > 0) lines.push('');
        lines.push('## ' + clean(el.textContent));
        lines.push('');
      } else if (el.classList.contains('acct')) {
        lines.push(accountToMd(el, '.acct-handle a', '.acct-desc'));
      } else if (el.classList.contains('account-card')) {
        lines.push(accountToMd(el, '.account-handle a', '.account-desc'));
      }
    }
  }

  function accountToMd(card, handleSel, descSel) {
    var linkEl = card.querySelector(handleSel);
    var descEl = card.querySelector(descSel);
    var handle = linkEl ? clean(linkEl.textContent) : '';
    var url = linkEl ? linkEl.href : '';
    var desc = descEl ? clean(descEl.textContent) : '';
    var md = '- ';
    md += url ? '[' + handle + '](' + url + ')' : handle;
    if (desc) md += ' — ' + desc;
    return md;
  }

  function inlineMarkdown(el) {
    var html = el.innerHTML;
    html = html.replace(/<(strong|b)>(.*?)<\/\1>/gi, '**$2**');
    html = html.replace(/<a[^>]+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    html = html.replace(/<[^>]+>/g, '');
    return clean(html);
  }

  function clean(text) {
    return text.replace(/\s+/g, ' ').trim();
  }
})();

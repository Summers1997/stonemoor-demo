/* ============================================================================
   SITE BEHAVIOUR  -  shared JavaScript for the page templates
   ----------------------------------------------------------------------------
   Everything here is progressive: with JavaScript disabled the pages still
   render, read and submit. Nothing is required to see content.

   Contents
     1. Reveal on scroll        [data-reveal]
     2. Sticky header condense
     3. Mobile menu
     4. Animated counters       [data-count]
     5. Cookie consent          (see UI-CNS-001 for the full component)
     6. Form validation
   ========================================================================== */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---- 1. reveal on scroll ------------------------------------------------ */
  var reveals = document.querySelectorAll('[data-reveal]');
  reveals.forEach(function (el) {
    if (el.dataset.delay) el.style.setProperty('--d', el.dataset.delay + 'ms');
  });
  if (!('IntersectionObserver' in window) || reduce) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);            // fire once, then stop watching
      });
      /* threshold 0, with the trigger line in rootMargin instead of a ratio.
         A ratio threshold asks "is 15% of this showing", and an element
         taller than the viewport can never answer yes — its ceiling is
         viewport/height, so past about six viewports tall it never reveals.
         Measured across these template pages at 375x812 on 11 Sep 2026: 172
         reveal elements, worst ceiling 0.213 on a 3,512px block. Holding, but
         by 1.4x. See SCR-REV-001, which carries the same fix. */
    }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
    reveals.forEach(function (el) { io.observe(el); });

    /* An IntersectionObserver only reports elements whose intersection state
       CHANGES. Follow an anchor link, reload a page the browser restores the
       scroll position on, or flick hard on a phone, and an element can go from
       below the viewport to above it without ever intersecting — so it never
       reveals, and the page renders blank below the fold. It is invisible in
       testing because scrolling slowly works perfectly.

       sweep() reveals anything that has reached the fold and was missed. It is
       deliberately not run every frame: getBoundingClientRect forces layout, so
       it runs on load, once scrolling settles, and immediately after any jump
       larger than half a viewport — which is precisely the case the observer
       misses. Once everything is revealed it removes its own listeners. */
    var lastY = window.pageYOffset, settle = null;

    function sweep() {
      var outstanding = 0;
      reveals.forEach(function (el) {
        if (el.classList.contains('in')) return;
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add('in');
          io.unobserve(el);
        } else outstanding++;
      });
      if (!outstanding) detach();
    }

    function onScroll() {
      var y = window.pageYOffset;
      if (Math.abs(y - lastY) > window.innerHeight * 0.5) sweep();  // a jump, not a scroll
      lastY = y;
      clearTimeout(settle);
      settle = setTimeout(sweep, 120);                              // scrolling stopped
    }

    function detach() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', sweep);
      window.removeEventListener('hashchange', sweep);
      clearTimeout(settle);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', sweep);
    window.addEventListener('hashchange', sweep);
    window.addEventListener('load', sweep);   // scroll restoration lands after DOMContentLoaded
    sweep();
  }

  /* ---- 1b. in view, for devices with no pointer to hover with -------------
     The cards answer a mouse in some detail - they lift, warm their border and
     turn their icon. None of it has ever run on a phone, because all of it hangs
     off :hover and a touchscreen has no hover to give. So the card nearest the
     middle of the screen is marked, and site.css adds `.is-in-view` alongside
     its existing :hover selectors. Scrolling becomes the pointer.

     One observer rather than another scroll controller: this needs no position,
     no easing and no per-frame work, only a band across the middle of the screen
     and a class. rootMargin of -38% top and bottom is that band - roughly the
     middle quarter, which on a phone is one card at a time.

     Touch only. A mouse already has hover, and running both would mean cards
     lighting up on their own while the pointer sits somewhere else. Reduced
     motion stands it down entirely; the CSS leaves the cards at full strength
     rather than permanently dimmed. */

  var coarse = matchMedia('(hover: none) and (pointer: coarse)').matches;

  if (coarse && !reduce && 'IntersectionObserver' in window) {
    var inViewCards = document.querySelectorAll('a.card');

    if (inViewCards.length) {
      var inView = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          e.target.classList.toggle('is-in-view', e.isIntersecting);
        });
      }, { threshold: 0, rootMargin: '-38% 0px -38% 0px' });

      Array.prototype.forEach.call(inViewCards, function (el) { inView.observe(el); });
    }
  }

  /* ---- 2. sticky header --------------------------------------------------- */
  var hdr = document.querySelector('.hdr');
  if (hdr) {
    var sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:60px;height:1px;width:1px';
    /* Appended, not prepended: the skip link must stay the first element in the
       document. The sentinel is absolutely positioned, so DOM order is irrelevant
       to where it actually sits. */
    document.body.appendChild(sentinel);

    /* Keep --hdr-h equal to the header's real height, which is what
       scroll-padding-top in site.css is built from. Three reasons it is
       measured rather than written down:

         the header condenses, so its height changes as you scroll;
         each vertical's own CSS sets its own padding, so 82px on one template
           is 38px on another;
         and a hard-coded number silently stops being true the first time
           somebody changes the logo size.

       The CSS default covers the no-JavaScript case, so this only ever makes
       an already-safe value exact. */
    var measure = function () {
      document.documentElement.style.setProperty('--hdr-h', hdr.offsetHeight + 'px');
    };

    new IntersectionObserver(function (e) {
      hdr.classList.toggle('stuck', !e[0].isIntersecting);
      measure();                      /* condensing changes the height */
    }).observe(sentinel);

    measure();
    addEventListener('resize', measure, { passive: true });
    /* Text metrics change when the real font arrives, and the header is sized
       by its text. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  }

  /* ---- 3. mobile menu -----------------------------------------------------
     The closed menu has to be parked with `inert`, not just hidden with CSS.

     Below 820px the nav is a fixed, full-screen panel hidden by
     `clip-path:circle(0%)`. That hides it from EYES ONLY. It stays
     display:flex, visibility:visible and in the accessibility tree, so with
     the menu shut a keyboard user tabbing out of the burger fell into five
     invisible links, and a screen reader announced a navigation the sighted
     user had just closed. `inert` is the one thing that removes an element
     from both the tab order and the accessibility tree while leaving it
     painted and measurable, which is exactly what a clip-path transition
     needs.

     Found on 11 Sep 2026, the first time the check harness was pointed at
     real pages rather than at component demos. The library's keyboard check
     walks the component list, and no component has a burger - so this had
     never been tested in any template, on any page, ever.

     sync() also runs on resize because the breakpoint decides whether this is
     a disclosure at all: above 820px the nav is an ordinary visible row and
     must never be inert. Crossing the breakpoint with the menu open is the
     case that gets forgotten, and it leaves the nav inert and unreachable on
     a desktop-width screen. */
  var burger = document.querySelector('.burger');
  var navEl  = document.querySelector('.nav');
  if (burger) {
    var isMobile = function () {
      return getComputedStyle(burger).display !== 'none';
    };
    var sync = function () {
      var open = document.body.classList.contains('menu-open');
      var mob  = isMobile();
      burger.setAttribute('aria-expanded', String(mob ? open : true));
      if (navEl) navEl.inert = mob && !open;
      document.body.style.overflow = (mob && open) ? 'hidden' : '';
    };

    burger.addEventListener('click', function () {
      document.body.classList.toggle('menu-open');
      sync();
      /* Moving focus into the panel is what makes the menu usable from a
         keyboard at all - without it, focus is still on a button behind an
         inert region that just became live. */
      if (document.body.classList.contains('menu-open') && navEl) {
        var first = navEl.querySelector('a');
        if (first) first.focus();
      }
    });

    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('menu-open');
        sync();
      });
    });

    addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        document.body.classList.remove('menu-open');
        sync();
        burger.focus();
      }
    });

    addEventListener('resize', sync);
    sync();
  }

  /* ---- 3b. scroll-spy for an in-page nav ----------------------------------
     Only does anything when the nav points at sections of THIS page, so the
     four multi-page templates are untouched and pay nothing for it.

     A one-page site's nav has to say where you are, because there are no page
     loads to tell you. Without it the nav is decoration: five links that never
     change while the whole site scrolls past behind them.

     aria-current="true", NOT "page". The page has not changed - a section of
     it has - and aria-current="page" on a link to #menu tells a screen reader
     the visitor is on a different page than the one they are on.

     ---- THE ONE REAL BUG THIS CODE HAS ALREADY HAD ---------------------
     parseFloat('') is NaN, and NaN in a rootMargin makes the
     IntersectionObserver constructor THROW. Everything in this file shares
     one IIFE, so that exception took counters, cookie consent and form
     validation down with it - on every page in the library, not just the one
     with the in-page nav. The guard below is not defensive programming for
     its own sake; it is the difference between one dead feature and six.

     ---- WHAT THE TEST HARNESS CANNOT TELL YOU ABOUT THIS ---------------
     None of this can be exercised in check-all.html. The harness runs pages
     in a pane that is never painted, and there requestAnimationFrame never
     fires, IntersectionObserver delivers no callbacks, and scroll events are
     not dispatched at all even though pageYOffset changes. Two earlier
     drafts were rewritten on the strength of that silence before the cause
     was understood - the observer version had been correct all along.
     Verify a scroll-spy in a real browser window, or not at all. */
  var spyLinks = [].slice.call(document.querySelectorAll('.nav a[href^="#"]'))
    .map(function (a) {
      var id = a.getAttribute('href').slice(1);
      return { a: a, el: id && document.getElementById(id) };
    })
    .filter(function (x) { return x.el; });

  if (spyLinks.length && 'IntersectionObserver' in window) {
    var spyCurrent = null, inBand = [];

    var setCurrent = function (link) {
      if (!link || link === spyCurrent) return;
      spyCurrent = link;
      spyLinks.forEach(function (x) {
        if (x === link) x.a.setAttribute('aria-current', 'true');
        else x.a.removeAttribute('aria-current');
      });
    };

    var pick = function () {
      /* Document order, so two sections in the band resolve to the upper one
         rather than to whichever the observer happened to report last. */
      for (var i = 0; i < spyLinks.length; i++) {
        if (inBand.indexOf(spyLinks[i].el) !== -1) { setCurrent(spyLinks[i]); return; }
      }
    };

    var hdrEl = document.querySelector('.hdr'),
        spyH  = parseFloat(getComputedStyle(document.documentElement)
                  .getPropertyValue('--hdr-h'));
    if (!isFinite(spyH)) spyH = hdrEl ? hdrEl.offsetHeight : 64;
    if (!isFinite(spyH) || spyH < 0) spyH = 64;

    /* The band is the top 40% of the viewport under the header: the part of
       the page somebody is actually reading. */
    var spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var at = inBand.indexOf(e.target);
        if (e.isIntersecting && at === -1) inBand.push(e.target);
        if (!e.isIntersecting && at !== -1) inBand.splice(at, 1);
      });
      pick();
    }, { rootMargin: '-' + Math.round(spyH + 8) + 'px 0px -60% 0px' });

    spyLinks.forEach(function (x) { spyObserver.observe(x.el); });

    /* The last section is usually shorter than the distance from the header
       to the foot of the window, so it can never enter the band and the last
       nav item would never light up however far you scrolled. Within a couple
       of pixels of the bottom there is no scrolling left to do and the
       visitor is plainly looking at it. Two arithmetic operations per scroll
       event: no rAF, nothing measured, no layout forced. */
    addEventListener('scroll', function () {
      if (innerHeight + Math.ceil(pageYOffset) >= document.body.scrollHeight - 2) {
        setCurrent(spyLinks[spyLinks.length - 1]);
      }
    }, { passive: true });
  }

  /* ---- 4. counters -------------------------------------------------------- */
  function fmt(el, v) {
    var dec = +(el.dataset.dec || 0);
    var o = { minimumFractionDigits: dec, maximumFractionDigits: dec };
    if (el.dataset.currency) { o.style = 'currency'; o.currency = 'GBP'; o.maximumFractionDigits = 0; }
    if (el.dataset.compact) { o.notation = 'compact'; o.maximumFractionDigits = 1; }
    return new Intl.NumberFormat('en-GB', o).format(v) + (el.dataset.suffix || '');
  }
  function count(el) {
    var to = parseFloat(el.dataset.count), t0 = null;
    el.textContent = fmt(el, to);   // final value first, so a background tab never shows zero
    if (reduce) return;
    requestAnimationFrame(function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / 1700), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(el, to * e);
      if (p < 1) requestAnimationFrame(step);
    });
  }
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        count(e.target); cio.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---- 5. cookie consent -------------------------------------------------- */
  var KEY = 'cookie-consent-v1';
  var cc = document.getElementById('cc');
  if (cc) {
    var stored = null;
    try { stored = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    var reopen = document.getElementById('cc-reopen');

    function persist(analytics, marketing) {
      var rec = { analytics: analytics, marketing: marketing,
                  date: new Date().toISOString(), version: 1 };
      try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
      cc.classList.remove('in');
      if (reopen) reopen.hidden = false;
      /* Nothing non-essential fires before this point. Wire real tags here. */
    }
    if (!stored) {
      requestAnimationFrame(function () { cc.classList.add('in'); });
    } else if (reopen) { reopen.hidden = false; }

    var acc = document.getElementById('cc-accept'), rej = document.getElementById('cc-reject');
    if (acc) acc.onclick = function () { persist(true, true); };
    if (rej) rej.onclick = function () { persist(false, false); };
    if (reopen) reopen.onclick = function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      reopen.hidden = true;
      cc.classList.add('in');
    };
  }

  /* ---- 6. form validation ------------------------------------------------- */
  var form = document.querySelector('form[data-validate]');
  if (form) {
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var firstBad = null;
      form.querySelectorAll('[required]').forEach(function (input) {
        /* Not every required control lives in a .field - the consent checkbox
           sits in its own label. Fall back to the nearest label, and never
           assume the wrapper exists. */
        var field = input.closest('.field') || input.closest('label') || input.parentElement;
        if (!field) return;
        var valid;
        if (input.type === 'checkbox')   valid = input.checked;
        else if (input.type === 'email') valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value);
        else                             valid = input.value.trim().length > 0;

        field.classList.remove('bad');
        input.removeAttribute('aria-invalid');
        if (!valid) {
          void field.offsetWidth;                 // restart the shake
          field.classList.add('bad');
          input.setAttribute('aria-invalid', 'true');
          if (!firstBad) firstBad = input;
          ok = false;
        }
      });
      if (!ok) { if (firstBad) firstBad.focus(); return; }
      var done = document.getElementById('form-success');
      if (done) { form.hidden = true; done.hidden = false; done.classList.add('go'); done.focus(); }
    });
  }
})();

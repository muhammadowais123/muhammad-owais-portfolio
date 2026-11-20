/* ==========================================================================
   MUHAMMAD OWAIS - PORTFOLIO SCRIPT

   Each feature lives in its own function and is started from init() at the
   bottom of the file. Remove a call in init() to switch a feature off.

   FEATURES
   1. Theme toggle (light / dark, remembered between visits)
   2. Mobile navigation menu
   3. Header shadow on scroll
   4. Scroll-reveal animations
   5. Active navigation link while scrolling
   6. Profile image fallback (placeholder)
   7. Copy email button
   8. Footer year
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     SETTINGS
     ------------------------------------------------------------------------ */
  var THEME_STORAGE_KEY = 'owais-portfolio-theme';
  var THEME_COLORS = { light: '#f6f2ea', dark: '#11100e' };   // browser UI colour
  var DESKTOP_BREAKPOINT = '(min-width: 961px)';              // matches the CSS nav breakpoint

  var root = document.documentElement;

  // Tells the CSS that JavaScript is running (enables the reveal animations).
  root.classList.add('js');


  /* ------------------------------------------------------------------------
     HELPERS
     ------------------------------------------------------------------------ */

  /** Reads from localStorage without crashing if storage is blocked. */
  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  /** Writes to localStorage without crashing if storage is blocked. */
  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      /* Storage unavailable: the theme still works, it just is not remembered. */
    }
  }

  /** True when the visitor asked their system to reduce motion. */
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }


  /* ------------------------------------------------------------------------
     1. THEME TOGGLE
     Sets data-theme="light" or "dark" on <html>. The first visit follows the
     system preference; after that the saved choice wins.
     ------------------------------------------------------------------------ */
  function initThemeToggle() {
    var toggleButton = document.getElementById('themeToggle');
    var themeColorMeta = document.querySelector('meta[name="theme-color"]');
    var systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    var transitionTimer = null;

    if (!toggleButton) return;

    /** Applies a theme and updates the button label and browser colour. */
    function applyTheme(theme) {
      root.setAttribute('data-theme', theme);
      toggleButton.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      );
      if (themeColorMeta) themeColorMeta.setAttribute('content', THEME_COLORS[theme]);
    }

    /** Briefly enables the CSS class that fades colours between themes. */
    function playThemeTransition() {
      if (prefersReducedMotion()) return;
      root.classList.add('theme-transition');
      window.clearTimeout(transitionTimer);
      transitionTimer = window.setTimeout(function () {
        root.classList.remove('theme-transition');
      }, 450);
    }

    // Pick the starting theme: saved choice, otherwise the system preference.
    var savedTheme = readStorage(THEME_STORAGE_KEY);
    var initialTheme = savedTheme === 'light' || savedTheme === 'dark'
      ? savedTheme
      : (systemDarkQuery.matches ? 'dark' : 'light');
    applyTheme(initialTheme);

    // Button click: flip the theme and remember it.
    toggleButton.addEventListener('click', function () {
      var nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      playThemeTransition();
      applyTheme(nextTheme);
      writeStorage(THEME_STORAGE_KEY, nextTheme);
    });

    // If the visitor never chose a theme, follow system changes live.
    function handleSystemChange(event) {
      if (readStorage(THEME_STORAGE_KEY)) return;
      playThemeTransition();
      applyTheme(event.matches ? 'dark' : 'light');
    }

    if (systemDarkQuery.addEventListener) {
      systemDarkQuery.addEventListener('change', handleSystemChange);
    } else if (systemDarkQuery.addListener) {
      systemDarkQuery.addListener(handleSystemChange);   // older Safari
    }
  }


  /* ------------------------------------------------------------------------
     2. MOBILE NAVIGATION
     Opens and closes the dropdown menu shown on small screens.
     ------------------------------------------------------------------------ */
  function initMobileNav() {
    var navToggle = document.getElementById('navToggle');
    var siteNav = document.getElementById('siteNav');
    var desktopQuery = window.matchMedia(DESKTOP_BREAKPOINT);

    if (!navToggle || !siteNav) return;

    function openMenu() {
      siteNav.classList.add('is-open');
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', 'Close menu');
    }

    function closeMenu() {
      siteNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    }

    function isMenuOpen() {
      return siteNav.classList.contains('is-open');
    }

    // Hamburger button
    navToggle.addEventListener('click', function () {
      if (isMenuOpen()) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Choosing a link closes the menu
    siteNav.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu();
    });

    // Clicking outside the menu closes it
    document.addEventListener('click', function (event) {
      if (!isMenuOpen()) return;
      if (siteNav.contains(event.target) || navToggle.contains(event.target)) return;
      closeMenu();
    });

    // Escape closes the menu and returns focus to the button
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isMenuOpen()) {
        closeMenu();
        navToggle.focus();
      }
    });

    // Growing the window to desktop size resets the menu
    function handleBreakpointChange(event) {
      if (event.matches) closeMenu();
    }

    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener('change', handleBreakpointChange);
    } else if (desktopQuery.addListener) {
      desktopQuery.addListener(handleBreakpointChange);
    }
  }


  /* ------------------------------------------------------------------------
     3. HEADER SHADOW ON SCROLL
     Adds .is-scrolled to the header once the page has moved down a little.
     ------------------------------------------------------------------------ */
  function initHeaderScroll() {
    var header = document.getElementById('siteHeader');
    var ticking = false;

    if (!header) return;

    function updateHeader() {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });

    updateHeader();
  }


  /* ------------------------------------------------------------------------
     4. SCROLL-REVEAL ANIMATIONS
     Elements with .reveal fade in when they enter the screen. Containers
     marked data-reveal-stagger get a small delay between their children.
     ------------------------------------------------------------------------ */
  function initScrollReveal() {
    var revealItems = document.querySelectorAll('.reveal');
    var staggerGroups = document.querySelectorAll('[data-reveal-stagger]');

    if (!revealItems.length) return;

    // Staggered delay inside grids (resets every 4 items so rows feel even)
    staggerGroups.forEach(function (group) {
      group.querySelectorAll('.reveal').forEach(function (item, index) {
        item.style.setProperty('--reveal-delay', (index % 4) * 90 + 'ms');
      });
    });

    // No animation needed (or not supported): just show everything.
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      revealItems.forEach(function (item) {
        item.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);   // animate only once
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  }


  /* ------------------------------------------------------------------------
     5. ACTIVE NAVIGATION LINK
     Highlights the nav link of the section currently in view.
     ------------------------------------------------------------------------ */
  function initActiveNavLink() {
    var navLinks = document.querySelectorAll('.site-nav-link');
    var sections = document.querySelectorAll('main section[id]');

    if (!navLinks.length || !sections.length || !('IntersectionObserver' in window)) return;

    function setActiveLink(sectionId) {
      navLinks.forEach(function (link) {
        var isActive = link.getAttribute('href') === '#' + sectionId;
        link.classList.toggle('is-active', isActive);
        if (isActive) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    // A thin band around the middle of the screen decides the active section.
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActiveLink(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }


  /* ------------------------------------------------------------------------
     6. PROFILE IMAGE FALLBACK
     If images/profile.jpg is missing, the placeholder stays visible.
     Once you add the picture, it appears automatically.
     ------------------------------------------------------------------------ */
  function initProfileImage() {
    var imageWrapper = document.querySelector('.hero-image');
    var photo = document.querySelector('.hero-image-photo');

    if (!imageWrapper || !photo) return;

    function showPlaceholder() {
      imageWrapper.classList.add('is-placeholder');
    }

    function showPhoto() {
      imageWrapper.classList.remove('is-placeholder');
    }

    photo.addEventListener('error', showPlaceholder);
    photo.addEventListener('load', showPhoto);

    // The image may have finished (or failed) before this code ran.
    if (photo.complete) {
      if (photo.naturalWidth === 0) {
        showPlaceholder();
      } else {
        showPhoto();
      }
    }
  }


  /* ------------------------------------------------------------------------
     7. COPY EMAIL BUTTON
     Copies the email address and shows a short confirmation message.
     ------------------------------------------------------------------------ */
  function initCopyEmail() {
    var copyButton = document.getElementById('copyEmailButton');
    var statusMessage = document.getElementById('copyStatus');
    var resetTimer = null;

    if (!copyButton) return;

    var label = copyButton.querySelector('.btn-label');
    var originalLabel = label ? label.textContent : '';

    /** Fallback for browsers or file:// pages without the Clipboard API. */
    function copyWithFallback(text) {
      var helper = document.createElement('textarea');
      helper.value = text;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();

      var succeeded = false;
      try {
        succeeded = document.execCommand('copy');
      } catch (error) {
        succeeded = false;
      }

      document.body.removeChild(helper);
      return succeeded;
    }

    function showResult(succeeded, email) {
      if (label) label.textContent = succeeded ? 'Copied!' : 'Copy failed';
      if (statusMessage) {
        statusMessage.textContent = succeeded
          ? 'Email address copied to your clipboard.'
          : 'Could not copy automatically. My email is ' + email + '.';
      }

      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(function () {
        if (label) label.textContent = originalLabel;
        if (statusMessage) statusMessage.textContent = '';
      }, 2500);
    }

    copyButton.addEventListener('click', function () {
      var email = copyButton.getAttribute('data-email');

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(
          function () { showResult(true, email); },
          function () { showResult(copyWithFallback(email), email); }
        );
      } else {
        showResult(copyWithFallback(email), email);
      }
    });
  }


  /* ------------------------------------------------------------------------
     8. FOOTER YEAR
     ------------------------------------------------------------------------ */
  function initFooterYear() {
    var yearElement = document.getElementById('currentYear');
    if (yearElement) yearElement.textContent = new Date().getFullYear();
  }


  /* ------------------------------------------------------------------------
     START
     ------------------------------------------------------------------------ */
  function init() {
    initThemeToggle();
    initMobileNav();
    initHeaderScroll();
    initScrollReveal();
    initActiveNavLink();
    initProfileImage();
    initCopyEmail();
    initFooterYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
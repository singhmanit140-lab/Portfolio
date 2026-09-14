/* ============================================================
   MANIT SINGH — portfolio engine
   Boot · audio · invert · scroll · reveals · navigation
   ============================================================ */

(function () {

  'use strict';


  /* ==========================================================
     REDUCED MOTION
     ========================================================== */

  var reduce =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ==========================================================
     SHARED BUS
     ========================================================== */

  var SK = window.SK = {

    ready: false,

    _onReady: [],

    onReady: function (fn) {
      this.ready
        ? fn()
        : this._onReady.push(fn);
    },

    fireReady: function () {

      this.ready = true;

      this._onReady.splice(0).forEach(function (fn) {
        try {
          fn();
        } catch (e) {}
      });

    }

  };


  /* ==========================================================
     BOOT
     ========================================================== */

  var boot = document.getElementById('boot');
  var fillEl = document.getElementById('bootFill');
  var pctEl = document.getElementById('bootPct');

  var pct = 0;
  var targetPct = 0;
  var bootDone = false;


  function setPct(value) {

    pct = value;

    if (fillEl) {
      fillEl.style.right = (100 - value) + '%';
    }

    if (pctEl) {
      pctEl.textContent =
        String(Math.round(value)).padStart(3, '0');
    }

  }


  function crawl() {

    if (bootDone) return;

    targetPct =
      Math.min(
        96,
        targetPct + 7
      );

    if (targetPct < 96) {

      setTimeout(
        crawl,
        reduce ? 20 : 80
      );

    } else {

      finishBoot();

    }

  }


  function tickPct() {

    if (bootDone) return;

    setPct(
      pct + (targetPct - pct) * 0.14
    );

    requestAnimationFrame(tickPct);

  }


  function finishBoot() {

    var released = false;

    function release() {

      if (released) return;

      released = true;

      targetPct = 100;
      setPct(100);

      setTimeout(function () {

        bootDone = true;

        if (boot) {
          boot.classList.add('is-done');
        }

        document.body.classList.remove('is-booting');
        document.body.classList.add('is-lit');

      }, reduce ? 50 : 350);

    }


    SK.onReady(release);

    /* Never trap the visitor if WebGL/CDN is slow. */
    setTimeout(release, 9000);

  }


  requestAnimationFrame(tickPct);

  setTimeout(
    crawl,
    reduce ? 0 : 200
  );


  /* ==========================================================
     AUDIO — OFF BY DEFAULT
     ========================================================== */

  var audio = document.getElementById('bgAudio');
  var soundBtn = document.getElementById('soundToggle');

  var soundOn = false;
  var fadeTimer = null;

  var VOLUME = 0.32;


  function reflectSound() {

    if (!soundBtn) return;

    soundBtn.setAttribute(
      'aria-pressed',
      soundOn ? 'true' : 'false'
    );

    soundBtn.textContent =
      soundOn ? 'sound on' : 'sound off';

  }


  function fadeTo(target, done) {

    if (!audio) return;

    clearInterval(fadeTimer);

    var step =
      (target - audio.volume) / 16;


    fadeTimer = setInterval(function () {

      var value =
        audio.volume + step;


      if (
        (step > 0 && value >= target) ||
        (step < 0 && value <= target) ||
        step === 0
      ) {

        audio.volume =
          Math.max(
            0,
            Math.min(1, target)
          );

        clearInterval(fadeTimer);

        if (done) done();

      } else {

        audio.volume =
          Math.max(
            0,
            Math.min(1, value)
          );

      }

    }, 40);

  }


  function enableSound() {

    if (!audio) return;

    soundOn = true;

    reflectSound();

    audio.muted = false;
    audio.volume = 0;

    var playPromise;

    try {

      playPromise = audio.play();

    } catch (e) {

      soundOn = false;
      reflectSound();
      return;

    }


    if (
      playPromise &&
      playPromise.catch
    ) {

      playPromise.catch(function () {

        soundOn = false;
        reflectSound();

      });

    }


    fadeTo(VOLUME);

  }


  function disableSound() {

    if (!audio) return;

    soundOn = false;

    reflectSound();

    fadeTo(0, function () {

      audio.pause();

    });

  }


  if (soundBtn) {

    soundBtn.addEventListener(
      'click',
      function () {

        if (soundOn) {
          disableSound();
        } else {
          enableSound();
        }

      }
    );

  }


  document.addEventListener(
    'visibilitychange',
    function () {

      if (!audio) return;

      if (document.hidden) {

        audio.pause();

      } else if (soundOn) {

        var p = audio.play();

        if (p && p.catch) {
          p.catch(function () {});
        }

      }

    }
  );


  reflectSound();


  /* ==========================================================
     INVERT
     ========================================================== */

  var invertBtn =
    document.getElementById('invertToggle');


  function setInvert(on) {

    document.body.classList.toggle(
      'is-invert',
      on
    );


    if (invertBtn) {

      invertBtn.setAttribute(
        'aria-pressed',
        on ? 'true' : 'false'
      );

    }


    var meta =
      document.querySelector(
        'meta[name="theme-color"]'
      );


    if (meta) {

      meta.setAttribute(
        'content',
        on ? '#f4f4f1' : '#050505'
      );

    }


    if (SK.setShellInvert) {

      SK.setShellInvert(on);

    }


    if (typeof onScroll === 'function') {

      onScroll();

    }


    try {

      localStorage.setItem(
        'manit_invert',
        on ? '1' : '0'
      );

    } catch (e) {}

  }


  if (invertBtn) {

    invertBtn.addEventListener(
      'click',
      function () {

        setInvert(
          !document.body.classList.contains(
            'is-invert'
          )
        );

      }
    );

  }


  try {

    if (
      localStorage.getItem(
        'manit_invert'
      ) === '1'
    ) {

      setInvert(true);

    }

  } catch (e) {}


  /* ==========================================================
     SCROLL ENGINE
     ========================================================== */

  var backdrop =
    document.querySelector('.backdrop');

  var sections =
    [].slice.call(
      document.querySelectorAll('.sec')
    );

  var movers =
    [].slice.call(
      document.querySelectorAll('.el')
    );


  var DEPTH = {

    'el--star-a': 0.12,
    'el--star-b': -0.10,
    'el--dice': 0.05,

    'el--cd-a': 0.11,
    'el--cd-b': -0.09,

    'el--cards': 0.06,

    'el--flower': 0.04

  };


  movers.forEach(function (element) {

    var depth = 0;

    for (var key in DEPTH) {

      if (
        element.classList.contains(key)
      ) {

        depth = DEPTH[key];

      }

    }

    element.__d = depth;

  });


  var ticking = false;


  function onScroll() {

    if (!ticking) {

      ticking = true;

      requestAnimationFrame(frame);

    }

  }


  function frame() {

    ticking = false;

    var vh = window.innerHeight;


    /* ----------------------------------------
       Backdrop
       ---------------------------------------- */

    if (backdrop && sections.length) {

      var mid =
        window.scrollY + vh * .5;

      var current =
        sections[sections.length - 1];


      for (
        var i = 0;
        i < sections.length;
        i++
      ) {

        var section =
          sections[i];

        var top =
          section.offsetTop;

        var bottom =
          top + section.offsetHeight;


        if (
          mid >= top &&
          mid < bottom
        ) {

          current = section;
          break;

        }

      }


      var invert =
        document.body.classList.contains(
          'is-invert'
        );


      backdrop.style.backgroundColor =
        invert
          ? '#f4f4f1'
          : '#050505';

    }


    /* ----------------------------------------
       Decorative parallax
       ---------------------------------------- */

    movers.forEach(function (element) {

      if (!element.__d) return;


      var parent =
        element.parentNode;

      if (!parent) return;


      var rect =
        parent.getBoundingClientRect();


      if (
        rect.bottom < -vh ||
        rect.top > vh * 2
      ) {

        return;

      }


      var p =
        (
          rect.top +
          rect.height / 2 -
          vh / 2
        ) / vh;


      element.style.setProperty(
        '--ty',
        (
          p *
          element.__d *
          vh
        ).toFixed(1) + 'px'
      );

    });

  }


  window.addEventListener(
    'scroll',
    onScroll,
    { passive:true }
  );


  window.addEventListener(
    'resize',
    onScroll,
    { passive:true }
  );


  frame();


  /* ==========================================================
     ELEMENT REVEALS
     ========================================================== */

  if (
    'IntersectionObserver' in window &&
    !reduce
  ) {

    var revealItems =
      [].slice.call(
        document.querySelectorAll(
          '.el, .showreel__heading, .showreel__video, .quest, .about__content, .about__tags, .contact__links'
        )
      );


    revealItems.forEach(function (element) {

      element.classList.add('reveal-item');

    });


    var observer =
      new IntersectionObserver(
        function (entries) {

          entries.forEach(function (entry) {

            if (
              entry.isIntersecting
            ) {

              entry.target.classList.add(
                'is-shown'
              );

              observer.unobserve(
                entry.target
              );

            }

          });

        },
        {
          threshold:0.08,
          rootMargin:'0px 0px -5% 0px'
        }
      );


    revealItems.forEach(function (element) {

      observer.observe(element);

    });

  }


  /* ==========================================================
     SMOOTH NAVIGATION
     ========================================================== */

  document
    .querySelectorAll('[data-nav]')
    .forEach(function (link) {

      link.addEventListener(
        'click',
        function (event) {

          var id =
            link.getAttribute('href');


          if (
            !id ||
            id.charAt(0) !== '#'
          ) {

            return;

          }


          var target =
            document.querySelector(id);


          if (!target) return;


          event.preventDefault();


          target.scrollIntoView({

            behavior:
              reduce
                ? 'auto'
                : 'smooth',

            block:'start'

          });

        }
      );

    });


  /* ==========================================================
     SHOWREEL
     ========================================================== */

  var reel =
    document.getElementById(
      'showreelVideo'
    );


  if (reel) {

    reel.addEventListener(
      'loadeddata',
      function () {

        var placeholder =
          document.querySelector(
            '.showreel__placeholder'
          );


        if (placeholder) {

          placeholder.style.display =
            'none';

        }

      }
    );


    reel.addEventListener(
      'error',
      function () {

        reel.style.display =
          'none';

      }
    );

  }


  /* ==========================================================
     ACTIVE SECTION — small browser title update
     ========================================================== */

  if (
    'IntersectionObserver' in window
  ) {

    var titleObserver =
      new IntersectionObserver(
        function (entries) {

          entries.forEach(function (entry) {

            if (
              entry.isIntersecting
            ) {

              var id =
                entry.target.id;


              var labels = {

                hero:
                  'Manit Singh — Home',

                showreel:
                  'Manit Singh — Showreel',

                work:
                  'Manit Singh — Archive',

                quests:
                  'Manit Singh — Side Quests',

                about:
                  'Manit Singh — About',

                contact:
                  'Manit Singh — Contact'

              };


              if (labels[id]) {

                document.title =
                  labels[id];

              }

            }

          });

        },
        {
          threshold:.5
        }
      );


    sections.forEach(function (section) {

      titleObserver.observe(section);

    });

  }


})();
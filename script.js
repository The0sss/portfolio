/* ==========================================================================
   Артём Бармин — портфолио.
   Логика: липкая шапка, мобильное меню, появление блоков,
   лайтбокс с клавиатурой и свайпами.
   ========================================================================== */

(() => {
  'use strict';

  /* Класс включает анимации появления. Добавляем его из JS, чтобы при
     отключённых скриптах весь контент оставался видимым. */
  document.documentElement.classList.add('js');

  const body = document.body;
  const header = document.getElementById('site-header');
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('nav');

  /* ---------- Шапка при прокрутке ---------- */
  let scrollTicking = false;

  const onScroll = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      scrollTicking = false;
    });
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Мобильное меню ---------- */
  const setMenu = (open) => {
    header.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  };

  if (burger) {
    burger.addEventListener('click', () => {
      setMenu(!header.classList.contains('nav-open'));
    });
  }

  if (nav) {
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('nav-open')) {
      setMenu(false);
      burger.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && header.classList.contains('nav-open')) {
      setMenu(false);
    }
  });

  /* ---------- Появление блоков ---------- */
  const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));

  if ('IntersectionObserver' in window && revealItems.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -6% 0px'
    });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  /* ---------- Лайтбокс ---------- */
  const triggers = Array.from(document.querySelectorAll('[data-lightbox]'));
  const lightbox = document.getElementById('lightbox');

  if (!lightbox || !triggers.length) return;

  const lbImage = lightbox.querySelector('.lightbox__img');
  const lbText = lightbox.querySelector('.lightbox__text');
  const lbCounter = lightbox.querySelector('.lightbox__counter');
  const lbClose = lightbox.querySelector('.lightbox__close');
  const lbPrev = lightbox.querySelector('.lightbox__nav--prev');
  const lbNext = lightbox.querySelector('.lightbox__nav--next');

  let currentIndex = 0;
  let lastFocus = null;

  const total = triggers.length;
  lightbox.classList.toggle('is-single', total < 2);

  const captionFor = (trigger) => {
    const img = trigger.querySelector('img');
    return trigger.dataset.caption || (img ? img.alt : '');
  };

  /* Подгоняем размер под экран: маленькие кадры галерей всё равно
     заметно увеличиваются, большие посты не вылезают за высоту окна. */
  const fitLightboxImage = () => {
    if (!lbImage.naturalWidth) return;

    const maxWidth = Math.min(window.innerWidth * 0.92, 1180);
    const maxHeight = window.innerHeight - (window.innerWidth < 720 ? 170 : 150);
    const scale = Math.min(
      maxWidth / lbImage.naturalWidth,
      maxHeight / lbImage.naturalHeight,
      2.4
    );

    lbImage.style.width = `${Math.round(lbImage.naturalWidth * scale)}px`;
    lbImage.style.height = 'auto';
  };

  lbImage.addEventListener('load', fitLightboxImage);

  window.addEventListener('resize', () => {
    if (lightbox.classList.contains('is-open')) fitLightboxImage();
  });

  const render = (index) => {
    currentIndex = (index + total) % total;
    const trigger = triggers[currentIndex];
    const img = trigger.querySelector('img');

    if (!img) return;

    lbImage.src = img.currentSrc || img.src;
    lbImage.alt = img.alt || '';
    lbText.textContent = captionFor(trigger);
    lbCounter.textContent = `${currentIndex + 1} / ${total}`;

    if (lbImage.complete) fitLightboxImage();
  };

  const lockScroll = () => {
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.paddingRight = scrollbar > 0 ? `${scrollbar}px` : '';
    body.classList.add('lightbox-open');
  };

  const unlockScroll = () => {
    body.classList.remove('lightbox-open');
    body.style.paddingRight = '';
  };

  const open = (index, trigger) => {
    lastFocus = trigger;
    render(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    lockScroll();
    lbClose.focus({ preventScroll: true });
  };

  const close = () => {
    if (!lightbox.classList.contains('is-open')) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    unlockScroll();
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };

  const step = (direction) => render(currentIndex + direction);

  triggers.forEach((trigger, index) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      open(index, trigger);
    });
  });

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', () => step(-1));
  lbNext.addEventListener('click', () => step(1));

  /* Клик вне изображения закрывает просмотр */
  lightbox.addEventListener('click', (event) => {
    if (event.target.closest('.lightbox__img')) return;
    if (event.target.closest('.lightbox__close')) return;
    if (event.target.closest('.lightbox__nav')) return;
    close();
  });

  /* Клавиатура */
  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
      return;
    }

    /* Простой focus-trap внутри диалога */
    if (event.key === 'Tab') {
      const focusable = [lbClose, lbPrev, lbNext].filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  /* Свайпы на мобильных */
  let touchStartX = null;

  lightbox.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 1 || event.target.closest('button')) return;
    touchStartX = event.touches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (event) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(delta) < 55) return;
    step(delta > 0 ? -1 : 1);
  }, { passive: true });
})();

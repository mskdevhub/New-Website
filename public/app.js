/* ============================================================
   NEW WEBSITE — SINGLE SCRIPT
   Merged from the old site JS (loader, navbar, reveal,
   projects, services, skills, resume, contact, switcher).
   Runs directly — all sections are static in index.html.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /*=============== SITE LOADER ===============*/
  const loader = document.getElementById('site-loader');
  const loaderProgress = document.getElementById('loader-progress');
  const loaderBar = document.getElementById('loader-bar');
  const logoWrapper = document.getElementById('loader-logo-wrapper');
  const navLogo = document.querySelector('.nav-logo');

  if (loader && loaderProgress && logoWrapper) {
    let progress = 0;
    let isWindowLoaded = document.readyState === 'complete';

    if (!isWindowLoaded) {
      window.addEventListener('load', () => { isWindowLoaded = true; });
    }

    // Disable scrolling while loading
    document.body.style.overflow = 'hidden';

    const interval = setInterval(() => {
      if (isWindowLoaded && progress >= 75) {
        progress += 5; // Finish faster if loaded
      } else {
        progress += Math.floor(Math.random() * 8) + 2;
      }

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(finishLoading, 200);
      }

      loaderProgress.textContent = `${progress}%`;
      if (loaderBar) loaderBar.style.width = `${progress}%`;
    }, 120);

    function finishLoading() {
      loader.classList.add('loaded');
      document.body.style.overflow = '';
      window.__siteReady = true;

      // Fly the loader logo into the navbar logo position
      if (navLogo && logoWrapper) {
        const navRect = navLogo.getBoundingClientRect();
        const wrapperRect = logoWrapper.getBoundingClientRect();

        const wrapperCenterX = wrapperRect.left + wrapperRect.width / 2;
        const wrapperCenterY = wrapperRect.top + wrapperRect.height / 2;
        const targetX = navRect.left + navRect.width / 2;
        const targetY = navRect.top + navRect.height / 2;

        logoWrapper.style.transform =
          `translate(${targetX - wrapperCenterX}px, ${targetY - wrapperCenterY}px) scale(0.333)`;
        logoWrapper.style.opacity = '0';
      }

      setTimeout(() => { loader.style.display = 'none'; }, 800);
    }
  } else {
    window.__siteReady = true;
  }

  /*=============== MENU (show / hide) ===============*/
  const navMenu = document.getElementById('nav-menu');
  const navToggle = document.getElementById('nav-toggle');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('show-menu');
      navToggle.classList.toggle('animate-toggle');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close menu when a nav link is clicked
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('animate-toggle');
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('show-menu');
      });
    });
  }

  /*=============== CHANGE BACKGROUND HEADER + ACTIVE LINK ===============*/
  const header = document.getElementById('header');
  const sections = document.querySelectorAll('section[id]');

  const scrollHeader = () => {
    if (!header) return;
    window.scrollY >= 20 ? header.classList.add('bg-header')
      : header.classList.remove('bg-header');
  };

  const scrollActive = () => {
    const scrollY = window.pageYOffset;

    sections.forEach((current) => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 58;
      const sectionId = current.getAttribute('id');
      const sectionLink = document.querySelector('.nav-menu a[href*=' + sectionId + ']');

      if (sectionLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          sectionLink.classList.add('active-link');
        } else {
          sectionLink.classList.remove('active-link');
        }
      }
    });
  };

  let isScrolling = false;
  window.addEventListener('scroll', () => {
    if (!isScrolling) {
      window.requestAnimationFrame(() => {
        scrollHeader();
        scrollActive();
        isScrolling = false;
      });
      isScrolling = true;
    }
  });

  /*=============== SCROLL REVEAL ANIMATION ===============*/
  const revealElements = document.querySelectorAll('.reveal');

  if (revealElements.length > 0 && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('reveal-active'));
  }

  /*=============== PROJECTS SWIPER + FILTER ===============*/
  const projectsSlider = document.querySelector('.projects-swiper');
  let projectsSwiper = null;

  if (projectsSlider && typeof Swiper !== 'undefined') {
    projectsSwiper = new Swiper('.projects-swiper', {
      spaceBetween: 24,
      slidesPerView: 1.15,
      grabCursor: true,
      pagination: {
        el: '.projects-swiper .swiper-pagination',
        clickable: true,
      },
      breakpoints: {
        576: { slidesPerView: 1.5, spaceBetween: 24 },
        768: { slidesPerView: 2.2, spaceBetween: 28 },
        1024: { slidesPerView: 3.2, spaceBetween: 32 },
        2560: { slidesPerView: 4.2, spaceBetween: 36 },
      },
    });
  }

  /*--------------- Projects filter (home swiper + full projects page) ---------------
     Home (#projects[data-home-limits]) shows only the newest cards:
       - "All"            -> top N of EACH category (data-home-all, e.g. "game:3,asset:2")
       - category filters -> up to N per category (data-home-limits, e.g. "game:5,asset:5")
     The full /projects/ page has no data attributes, so every card shows there.
  */
  const filterItems = document.querySelectorAll('.work-item');
  const projectCards = document.querySelectorAll('#projects .swiper-slide, #projects .project-card');

  const parseLimits = (str) => {
    const limits = {};
    (str || '').split(',').forEach((pair) => {
      const [cat, n] = pair.split(':');
      if (cat && n) limits[cat.trim()] = parseInt(n, 10);
    });
    return limits;
  };

  const applyProjectFilter = (filterValue) => {
    const projectsSection = document.getElementById('projects');
    const isHome = projectsSection && projectsSection.hasAttribute('data-home-limits');
    const limits = filterValue === 'all'
      ? parseLimits(projectsSection && projectsSection.dataset.homeAll)
      : (isHome ? parseLimits(projectsSection.dataset.homeLimits) : {});
    const counts = {};

    projectCards.forEach((card) => {
      const category = ['game', 'asset'].find((c) => card.classList.contains(c)) || 'other';
      let show = filterValue === 'all' || card.classList.contains(filterValue);

      if (show && limits[category] !== undefined) {
        counts[category] = (counts[category] || 0) + 1;
        show = counts[category] <= limits[category];
      }
      card.style.display = show ? '' : 'none';
    });

    if (projectsSwiper) projectsSwiper.update();
  };

  if (filterItems.length && projectCards.length) {
    filterItems.forEach((item) => {
      item.addEventListener('click', () => {
        filterItems.forEach((i) => i.classList.remove('active-work'));
        item.classList.add('active-work');
        applyProjectFilter(item.getAttribute('data-filter'));
      });
    });

    // Initial view = whichever filter is marked active (All)
    const initialFilter = document.querySelector('.work-item.active-work');
    applyProjectFilter(initialFilter ? initialFilter.getAttribute('data-filter') : 'all');
  }

  /*=============== SERVICES SWIPER ===============*/
  if (document.querySelector('.services-swiper') && typeof Swiper !== 'undefined') {
    new Swiper('.services-swiper', {
      spaceBetween: 24,
      slidesPerView: 1.15,
      grabCursor: true,
      pagination: {
        el: '.services-swiper .swiper-pagination',
        clickable: true,
      },
      breakpoints: {
        576: { slidesPerView: 1.5, spaceBetween: 24 },
        768: { slidesPerView: 2.2, spaceBetween: 28 },
        1024: { slidesPerView: 3.2, spaceBetween: 32 },
        2560: { slidesPerView: 4.2, spaceBetween: 36 },
      },
    });
  }

  /*=============== SKILLS SWIPER ===============*/
  if (document.querySelector('.skills-swiper') && typeof Swiper !== 'undefined') {
    new Swiper('.skills-swiper', {
      spaceBetween: 24,
      slidesPerView: 1.15,
      grabCursor: true,
      pagination: {
        el: '.skills-swiper .swiper-pagination',
        clickable: true,
      },
      breakpoints: {
        576: { slidesPerView: 1.5, spaceBetween: 24 },
        768: { slidesPerView: 2.2, spaceBetween: 28 },
        1024: { slidesPerView: 3.2, spaceBetween: 32 },
        2560: { slidesPerView: 4.2, spaceBetween: 36 },
      },
    });
  }

  /*=============== RESUME ACCORDION ===============*/
  const resumeItems = document.querySelectorAll('.resume-item');

  resumeItems.forEach((item) => {
    const headerBtn = item.querySelector('.resume-header');
    const content = item.querySelector('.resume-content');
    const icon = item.querySelector('.resume-icon i');

    if (headerBtn && content) {
      headerBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('resume-active');

        // Close all other items
        resumeItems.forEach((otherItem) => {
          otherItem.classList.remove('resume-active');
          const otherContent = otherItem.querySelector('.resume-content');
          const otherIcon = otherItem.querySelector('.resume-icon i');
          if (otherContent) otherContent.style.height = '0';
          if (otherIcon) {
            otherIcon.classList.remove('ri-subtract-line');
            otherIcon.classList.add('ri-add-line');
          }
        });

        // Toggle current item
        if (!isOpen) {
          item.classList.add('resume-active');
          content.style.height = content.scrollHeight + 'px';
          if (icon) {
            icon.classList.remove('ri-add-line');
            icon.classList.add('ri-subtract-line');
          }
        }
      });
    }
  });

  /*=============== CONTACT FORM ===============*/
  const contactForm = document.getElementById('contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const message = document.getElementById('message');
      const name = document.getElementById('contact-name')?.value.trim();
      const email = document.getElementById('contact-email')?.value.trim();
      const subject = document.getElementById('contact-subject')?.value.trim();
      const msg = document.getElementById('contact-message')?.value.trim();

      const setMessage = (text, color) => {
        if (message) {
          message.textContent = text;
          message.style.color = color;
        }
      };

      if (!name || !email || !subject || !msg) {
        setMessage('Please fill out all required fields.', 'red');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setMessage('Please enter a valid email address.', 'red');
        return;
      }

      // No backend yet: opens the visitor's email app pre-filled.
      // TODO: swap this for a real endpoint (e.g. fetch('/api/contact', ...))
      // once a backend / EmailJS account is configured.
      const toAddress = (document.getElementById('contact-email-link')?.href || '')
        .replace('mailto:', '') || 'mskdevhub@gmail.com';

      const body = `Name: ${name}\nEmail: ${email}\n\n${msg}`;
      window.location.href =
        `mailto:${toAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      setMessage('Opening your email app... Thank you!', 'var(--first-color)');
      contactForm.reset();
      setTimeout(() => setMessage('', ''), 6000);
    });
  }

  /*=============== STYLE SWITCHER ===============*/
  const styleSwitcher = document.getElementById('style-switcher');
  const switcherToggle = document.getElementById('switcher-toggle');
  const switcherClose = document.getElementById('switcher-close');

  if (switcherToggle && styleSwitcher) {
    switcherToggle.addEventListener('click', () => {
      styleSwitcher.classList.add('show-switcher');
    });
  }

  if (switcherClose && styleSwitcher) {
    switcherClose.addEventListener('click', () => {
      styleSwitcher.classList.remove('show-switcher');
    });
  }

  // Theme colors (hue swatches)
  const colors = document.querySelectorAll('.style-switcher-color');

  colors.forEach((color) => {
    color.addEventListener('click', () => {
      const activeColor = color.style.getPropertyValue('--hue');
      colors.forEach((c) => c.classList.remove('active-color'));
      color.classList.add('active-color');
      document.documentElement.style.setProperty('--hue', activeColor);
    });
  });

  // Light / dark mode
  const applyTheme = (theme) => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
  };

  applyTheme('light');

  document.querySelectorAll('input[name="body-theme"]').forEach((input) => {
    input.addEventListener('change', () => applyTheme(input.value));
  });

  /*=============== PLACEHOLDER LINKS ===============*/
  // Every href="#" is a to-be-edited placeholder — stop them from jumping to top.
  document.querySelectorAll('a[href="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => e.preventDefault());
  });

});

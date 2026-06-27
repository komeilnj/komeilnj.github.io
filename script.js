(() => {
  const root = document.documentElement;
  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');
  const menuButton = document.getElementById('menuButton');
  const sidebarClose = document.getElementById('sidebarClose');
  const sidebarScrim = document.getElementById('sidebarScrim');
  const pageNav = document.querySelector('.page-nav');
  const pageNavScroller = pageNav?.querySelector('div');

  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch {}
    }
  };

  const savedTheme = storage.get('portfolio-theme');
  const systemLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  root.dataset.theme = savedTheme || (systemLight ? 'light' : 'dark');

  themeToggle?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    storage.set('portfolio-theme', root.dataset.theme);
  });

  const closeMenu = () => {
    body.classList.remove('menu-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  };

  menuButton?.addEventListener('click', () => {
    const opening = !body.classList.contains('menu-open');
    body.classList.toggle('menu-open', opening);
    menuButton.setAttribute('aria-expanded', String(opening));
  });
  sidebarClose?.addEventListener('click', closeMenu);
  sidebarScrim?.addEventListener('click', closeMenu);
  document.querySelectorAll('.side-link').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px' });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('visible'));
  }

  const sectionLinks = [...document.querySelectorAll('.page-nav a[href^="#"]')];
  const sections = sectionLinks
    .map(link => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  const navOffset = () => (pageNav?.getBoundingClientRect().height || 0) + 18;

  const centerActiveLink = link => {
    if (!pageNavScroller || !link) return;
    const targetLeft = link.offsetLeft - (pageNavScroller.clientWidth - link.offsetWidth) / 2;
    pageNavScroller.scrollTo({ left: Math.max(0, targetLeft), behavior: 'auto' });
  };

  let activeId = '';
  const setActive = id => {
    if (!id || id === activeId) return;
    activeId = id;
    let activeLink = null;
    sectionLinks.forEach(link => {
      const isActive = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('active', isActive);
      link.setAttribute('aria-current', isActive ? 'location' : 'false');
      if (isActive) activeLink = link;
    });
    centerActiveLink(activeLink);
  };

  const updateActiveSection = () => {
    if (!sections.length) return;
    const marker = window.scrollY + navOffset() + 70;
    let current = sections[0];
    for (const section of sections) {
      if (section.offsetTop <= marker) current = section;
      else break;
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1];
    }
    setActive(current.id);
  };

  let scrollFrame = 0;
  const scheduleActiveUpdate = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      updateActiveSection();
    });
  };

  const openProjectAtTarget = target => {
    const details = target?.matches('details') ? target : target?.querySelector('details.project-accordion');
    if (details) details.open = true;
  };

  const jumpToSection = (target, updateHistory = true) => {
    if (!target) return;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - navOffset());
    window.scrollTo({ top, behavior: 'auto' });
    setActive(target.id);
    if (updateHistory && history.replaceState) {
      history.replaceState(null, '', `#${target.id}`);
    }
  };

  sectionLinks.forEach(link => {
    link.addEventListener('click', event => {
      const target = document.getElementById(link.getAttribute('href').slice(1));
      if (!target) return;
      event.preventDefault();
      jumpToSection(target, true);
    });
  });

  window.addEventListener('scroll', scheduleActiveUpdate, { passive: true });
  window.addEventListener('resize', scheduleActiveUpdate);

  document.querySelectorAll('.project-accordion').forEach(details => {
    details.addEventListener('toggle', () => {
      scheduleActiveUpdate();
      if (!details.open) return;
      const id = details.closest('section[id]')?.id;
      if (id && history.replaceState) history.replaceState(null, '', `#${id}`);
    });
  });

  const initialHash = window.location.hash;
  if (initialHash) {
    const target = document.getElementById(initialHash.slice(1));
    if (target) {
      openProjectAtTarget(target);
      requestAnimationFrame(() => requestAnimationFrame(() => jumpToSection(target, false)));
    }
  } else {
    updateActiveSection();
  }
})();

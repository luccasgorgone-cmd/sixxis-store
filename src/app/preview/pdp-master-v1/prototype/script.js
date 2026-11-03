(() => {
  const images = [
    {
      src: 'assets/sx120-prime-branco-01-frontal-1600-canonical-v3.jpg',
      alt: 'Climatizador Sixxis SX120 Prime Branco, vista frontal'
    },
    {
      src: 'assets/sx120-prime-branco-02-controles-1600-canonical-v3.jpg',
      alt: 'Painel digital e controles oficiais do SX120 Prime'
    },
    {
      src: 'assets/sx120-prime-branco-03-reservatorio-1600-canonical-v3.jpg',
      alt: 'Entrada do reservatório do SX120 Prime'
    }
  ];

  const root = document.documentElement;
  const gallery = document.querySelector('.product-gallery');
  const mainImage = document.querySelector('#main-product-image');
  const currentImage = document.querySelector('#current-image');
  const thumbnails = [...document.querySelectorAll('.thumbnail')];
  const previousButton = document.querySelector('.gallery-prev');
  const nextButton = document.querySelector('.gallery-next');
  const zoomDialog = document.querySelector('.zoom-dialog');
  const zoomImage = document.querySelector('#zoom-image');
  const zoomTrigger = document.querySelector('.zoom-trigger');
  const zoomClose = document.querySelector('.zoom-close');
  const feedback = document.querySelector('.prototype-feedback');
  let index = 0;
  let changeTimer = 0;
  let feedbackTimer = 0;
  let touchStartX = 0;

  root.classList.add('motion');
  gallery.tabIndex = 0;

  function showFeedback(message) {
    window.clearTimeout(feedbackTimer);
    feedback.textContent = message;
    feedback.classList.add('is-visible');
    feedbackTimer = window.setTimeout(() => feedback.classList.remove('is-visible'), 3200);
  }

  function showImage(nextIndex, moveFocus = false) {
    const normalized = (nextIndex + images.length) % images.length;
    if (normalized === index && mainImage.src.endsWith(images[normalized].src)) return;
    index = normalized;
    mainImage.classList.add('is-changing');
    window.clearTimeout(changeTimer);
    changeTimer = window.setTimeout(() => {
      const item = images[index];
      mainImage.src = item.src;
      mainImage.alt = item.alt;
      zoomImage.src = item.src;
      zoomImage.alt = `${item.alt}, ampliada`;
      currentImage.textContent = String(index + 1);
      thumbnails.forEach((button, buttonIndex) => {
        const active = buttonIndex === index;
        button.classList.toggle('is-current', active);
        if (active) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      });
      mainImage.classList.remove('is-changing');
      if (moveFocus) thumbnails[index].focus();
    }, 130);
  }

  previousButton.addEventListener('click', () => showImage(index - 1));
  nextButton.addEventListener('click', () => showImage(index + 1));
  thumbnails.forEach((button) => button.addEventListener('click', () => showImage(Number(button.dataset.index))));
  gallery.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showImage(index - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      showImage(index + 1);
    }
  });
  gallery.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  gallery.addEventListener('touchend', (event) => {
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) < 48) return;
    showImage(delta > 0 ? index - 1 : index + 1);
  }, { passive: true });

  zoomTrigger.addEventListener('click', () => {
    zoomDialog.showModal();
    zoomClose.focus();
  });
  zoomClose.addEventListener('click', () => zoomDialog.close());
  zoomDialog.addEventListener('click', (event) => {
    if (event.target === zoomDialog) zoomDialog.close();
  });

  const voltageOption = document.querySelector('.voltage-option');
  const voltageHelp = document.querySelector('#voltage-help');
  const buyButtons = [...document.querySelectorAll('.purchase-actions button')];
  const mobileBuyBar = document.querySelector('.mobile-buy-bar');
  const mobileBuyButton = mobileBuyBar.querySelector('button');
  let voltageSelected = false;

  function syncVoltage(selected) {
    voltageSelected = selected;
    voltageOption.setAttribute('aria-pressed', String(selected));
    voltageHelp.textContent = selected ? '220V selecionada' : 'Selecione 220V para continuar';
    buyButtons.forEach((button) => { button.disabled = !selected; });
    mobileBuyButton.textContent = selected ? 'Comprar agora' : 'Escolher 220V';
  }

  voltageOption.addEventListener('click', () => syncVoltage(!voltageSelected));
  buyButtons.forEach((button) => button.addEventListener('click', () => {
    showFeedback(button.classList.contains('buy-now')
      ? 'Protótipo aprovado: o checkout real será conectado pelo Jarvis Site.'
      : 'Protótipo aprovado: a integração com o carrinho será feita no site.');
  }));

  mobileBuyButton.addEventListener('click', () => {
    if (!voltageSelected) {
      voltageOption.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => voltageOption.focus(), 420);
      return;
    }
    document.querySelector('.buy-now').click();
  });

  const freightForm = document.querySelector('.freight-form');
  const cepInput = document.querySelector('#cep');
  const cepNote = document.querySelector('#cep-note');
  cepInput.addEventListener('input', () => {
    const digits = cepInput.value.replace(/\D/g, '').slice(0, 8);
    cepInput.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  });
  freightForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const digits = cepInput.value.replace(/\D/g, '');
    if (digits.length !== 8) {
      cepNote.textContent = 'Digite um CEP com 8 números.';
      cepNote.style.color = 'var(--danger)';
      cepInput.focus();
      return;
    }
    cepNote.textContent = 'CEP válido. O cálculo real será conectado ao frete do site.';
    cepNote.style.color = 'var(--accent-dark)';
  });

  const coverageRange = document.querySelector('#coverage-range');
  const coverageValue = document.querySelector('#coverage-value');
  const coverageResult = document.querySelector('#coverage-result');
  function syncCoverage() {
    const value = Number(coverageRange.value);
    coverageValue.value = `${value} m²`;
    const covered = value <= 140;
    coverageResult.classList.toggle('is-covered', covered);
    coverageResult.classList.toggle('is-over', !covered);
    coverageResult.innerHTML = covered
      ? '<strong>Dentro da cobertura indicada.</strong> O SX120 Prime atende ambientes de até 140 m².'
      : '<strong>Acima da cobertura indicada.</strong> Para esta área, compare um modelo de maior capacidade com a equipe Sixxis.';
  }
  coverageRange.addEventListener('input', syncCoverage);
  syncCoverage();

  const menuButton = document.querySelector('.menu-button');
  const mobileNav = document.querySelector('.mobile-nav');
  function closeMenu() {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menu');
    mobileNav.hidden = true;
  }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    if (open) closeMenu();
    else {
      menuButton.setAttribute('aria-expanded', 'true');
      menuButton.setAttribute('aria-label', 'Fechar menu');
      mobileNav.hidden = false;
      mobileNav.querySelector('a').focus();
    }
  });
  mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !mobileNav.hidden) {
      closeMenu();
      menuButton.focus();
    }
  });

  document.querySelector('.search-button').addEventListener('click', () => {
    showFeedback('A busca real da loja será preservada na implementação do Site.');
  });

  const revealElements = [...document.querySelectorAll('[data-reveal]')];
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    revealElements.forEach((element) => observer.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('is-in'));
  }

  const hero = document.querySelector('.product-hero');
  const mobileBarObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => mobileBuyBar.classList.toggle('is-visible', !entry.isIntersecting));
  }, { threshold: 0.05 });
  mobileBarObserver.observe(hero);

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  syncVoltage(false);
})();

/**
 * Crucible — tag + text filters, URL hash, accessibility announcements,
 * back-to-top control. Vanilla JS, no dependencies.
 */
(function () {
  'use strict';

  var filterControls = document.getElementById('filter-controls');
  var noResultsEl = document.getElementById('no-results');
  var searchInput = document.getElementById('article-search');
  var resultsAnnouncement = document.getElementById('filter-results-announcement');
  var backToTopBtn = document.getElementById('back-to-top');

  /** Debounced search timer */
  var searchTimer = null;

  /** @type {string} */
  var currentTag = 'all';

  /** @type {string} */
  var currentSearch = '';

  if (!filterControls) return;

  var buttons = filterControls.querySelectorAll('.filter-btn');

  function getCards() {
    return document.getElementsByClassName('article-card');
  }

  function parseTags(card) {
    var raw = card.getAttribute('data-tags');
    if (!raw) return [];
    return raw.split(/\s+/).map(function (t) {
      return t.toLowerCase();
    });
  }

  /**
   * Concatenate searchable text from a card.
   * @param {HTMLElement} card
   */
  function getSearchBlob(card) {
    var title = card.querySelector('.card-title');
    var cite = card.querySelector('.card-citation');
    var summary = card.querySelector('.card-summary');
    var parts = [];
    if (title) parts.push(title.textContent || '');
    if (cite) parts.push(cite.textContent || '');
    if (summary) parts.push(summary.textContent || '');
    return parts.join(' ').toLowerCase();
  }

  function matchesSearch(card, query) {
    if (!query || !query.trim()) return true;
    var q = query.trim().toLowerCase();
    return getSearchBlob(card).indexOf(q) !== -1;
  }

  function matchesTag(card, tag) {
    if (tag === 'all') return true;
    return parseTags(card).indexOf(tag.toLowerCase()) !== -1;
  }

  function updateAnnouncement(visibleCount, totalCards) {
    if (!resultsAnnouncement) return;
    var parts = [];
    parts.push(visibleCount + ' of ' + totalCards + ' articles visible');
    if (currentSearch.trim()) {
      parts.push('search: “' + currentSearch.trim() + '”');
    }
    if (currentTag !== 'all') {
      parts.push('topic: ' + currentTag);
    }
    resultsAnnouncement.textContent = parts.join(' · ');
  }

  /**
   * Apply tag + search together.
   */
  function applyFilters() {
    var cards = getCards();
    var visibleCount = 0;
    var totalCards = cards.length;

    for (var i = 0; i < cards.length; i++) {
      var card = /** @type {HTMLElement} */ (cards[i]);
      var okTag = matchesTag(card, currentTag);
      var okSearch = matchesSearch(card, currentSearch);
      var show = okTag && okSearch;

      if (show) {
        card.removeAttribute('hidden');
        visibleCount++;
      } else {
        card.setAttribute('hidden', '');
      }
    }

    toggleEmptyGroups();

    if (noResultsEl) {
      if (visibleCount === 0) {
        noResultsEl.removeAttribute('hidden');
      } else {
        noResultsEl.setAttribute('hidden', '');
      }
    }

    updateAnnouncement(visibleCount, totalCards);
    syncLocationHash();
  }

  function toggleEmptyGroups() {
    var groups = document.getElementsByClassName('listing-group');
    for (var g = 0; g < groups.length; g++) {
      var group = /** @type {HTMLElement} */ (groups[g]);
      var groupCards = group.getElementsByClassName('article-card');
      var anyVisible = false;

      for (var c = 0; c < groupCards.length; c++) {
        if (!groupCards[c].hasAttribute('hidden')) {
          anyVisible = true;
          break;
        }
      }

      if (anyVisible) {
        group.removeAttribute('hidden');
      } else {
        group.setAttribute('hidden', '');
      }
    }
  }

  function setActiveButton(activeButton) {
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.remove('active');
      buttons[i].setAttribute('aria-pressed', 'false');
    }
    activeButton.classList.add('active');
    activeButton.setAttribute('aria-pressed', 'true');
  }

  function syncLocationHash() {
    if (!window.history || !window.history.replaceState) return;

    var params = [];
    if (currentTag !== 'all') {
      params.push('filter=' + encodeURIComponent(currentTag));
    }
    if (currentSearch.trim()) {
      params.push('q=' + encodeURIComponent(currentSearch.trim()));
    }

    var hash = params.length ? '#' + params.join('&') : '';
    window.history.replaceState(null, '', window.location.pathname + hash);
  }

  function parseHash() {
    var hash = window.location.hash.slice(1);
    if (!hash) return;

    var parts = hash.split('&');
    for (var i = 0; i < parts.length; i++) {
      var seg = parts[i];
      var eq = seg.indexOf('=');
      if (eq === -1) continue;
      var key = seg.slice(0, eq);
      var val = decodeURIComponent(seg.slice(eq + 1));
      if (key === 'filter') {
        var found = false;
        for (var b = 0; b < buttons.length; b++) {
          var dt = buttons[b].getAttribute('data-tag') || '';
          if (dt.toLowerCase() === val.toLowerCase()) {
            currentTag = dt;
            setActiveButton(buttons[b]);
            found = true;
            break;
          }
        }
        if (!found && buttons.length) {
          currentTag = 'all';
          setActiveButton(buttons[0]);
        }
      }
      if (key === 'q' && searchInput) {
        currentSearch = val;
        searchInput.value = val;
      }
    }
  }

  function onButtonClick(event) {
    var btn = /** @type {HTMLButtonElement} */ (event.currentTarget);
    currentTag = btn.getAttribute('data-tag') || 'all';
    setActiveButton(btn);
    applyFilters();
  }

  function onSearchInput() {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = window.setTimeout(function () {
      currentSearch = searchInput ? searchInput.value : '';
      applyFilters();
    }, 160);
  }

  function onSearchKeydown(event) {
    if (event.key === 'Escape' && searchInput) {
      searchInput.value = '';
      currentSearch = '';
      applyFilters();
      searchInput.focus();
    }
  }

  /* ---- Back to top ---- */
  function initBackToTop() {
    if (!backToTopBtn) return;

    function onScroll() {
      if (window.scrollY > 420) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- Bind ---- */
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].setAttribute(
      'aria-pressed',
      buttons[i].classList.contains('active') ? 'true' : 'false'
    );
    buttons[i].addEventListener('click', onButtonClick);
  }

  filterControls.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      var target = /** @type {HTMLElement} */ (event.target);
      if (target.classList.contains('filter-btn')) {
        event.preventDefault();
        target.click();
      }
    }
  });

  if (searchInput) {
    searchInput.addEventListener('input', onSearchInput);
    searchInput.addEventListener('keydown', onSearchKeydown);
  }

  parseHash();
  applyFilters();
  initBackToTop();

  window.addEventListener('hashchange', function () {
    if (!window.location.hash) {
      currentTag = 'all';
      currentSearch = '';
      if (searchInput) searchInput.value = '';
      if (buttons.length) setActiveButton(buttons[0]);
    }
    parseHash();
    applyFilters();
  });
})();

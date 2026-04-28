/**
 * content-filter.js — Crucible / Inference Foundry Research Journal
 *
 * Vanilla JS tag-based article filter for index.html.
 * Zero dependencies. No frameworks. No build step.
 *
 * How it works:
 *   - Each <article> card on the page carries a data-tags attribute
 *     with space-separated tag names, e.g.:  data-tags="LLM Hardware-Level Math"
 *   - Filter buttons in #filter-controls carry data-tag attributes.
 *   - Clicking a button shows only cards whose data-tags includes the
 *     selected tag, or all cards when the "all" button is active.
 *   - The active button class and the hidden attribute on cards are
 *     managed directly; no class-toggling libraries needed.
 */

(function () {
  'use strict';

  /** @type {HTMLElement|null} */
  var filterControls = document.getElementById('filter-controls');

  /** @type {HTMLElement|null} */
  var noResultsEl = document.getElementById('no-results');

  // Guard: if the filter bar is absent (e.g., article pages), do nothing.
  if (!filterControls) return;

  /** @type {NodeListOf<HTMLButtonElement>} */
  var buttons = filterControls.querySelectorAll('.filter-btn');

  /**
   * All article cards on the page.
   * We query lazily so any cards added dynamically are included.
   * @returns {HTMLCollectionOf<Element>}
   */
  function getCards() {
    return document.getElementsByClassName('article-card');
  }

  /**
   * Parse the space-separated data-tags attribute of a card element
   * into an array of tag strings (lowercase-normalised for comparison).
   *
   * @param {HTMLElement} card
   * @returns {string[]}
   */
  function parseTags(card) {
    var raw = card.getAttribute('data-tags');
    if (!raw) return [];
    return raw.split(/\s+/).map(function (t) { return t.toLowerCase(); });
  }

  /**
   * Apply the given tag filter to all cards.
   * Hides cards that don't match and shows those that do.
   * Also toggles the "no results" message.
   *
   * @param {string} tag — lowercase tag name, or 'all' to show everything
   */
  function applyFilter(tag) {
    var cards = getCards();
    var visibleCount = 0;

    for (var i = 0; i < cards.length; i++) {
      var card = /** @type {HTMLElement} */ (cards[i]);
      var show = (tag === 'all') || parseTags(card).indexOf(tag.toLowerCase()) !== -1;

      if (show) {
        card.removeAttribute('hidden');
        visibleCount++;
      } else {
        card.setAttribute('hidden', '');
      }
    }

    // Show/hide the listing-group headings if all their children are hidden.
    toggleEmptyGroups();

    // Show no-results message when nothing is visible.
    if (noResultsEl) {
      if (visibleCount === 0) {
        noResultsEl.removeAttribute('hidden');
      } else {
        noResultsEl.setAttribute('hidden', '');
      }
    }
  }

  /**
   * Hide a .listing-group entirely if none of its article cards are visible.
   * This avoids orphaned section headings when filtering.
   */
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

  /**
   * Update the active visual state of filter buttons.
   * Only one button should be active at a time.
   *
   * @param {HTMLButtonElement} activeButton
   */
  function setActiveButton(activeButton) {
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.remove('active');
      buttons[i].setAttribute('aria-pressed', 'false');
    }
    activeButton.classList.add('active');
    activeButton.setAttribute('aria-pressed', 'true');
  }

  /**
   * Handle a filter button click.
   * @param {Event} event
   */
  function onButtonClick(event) {
    var btn = /** @type {HTMLButtonElement} */ (event.currentTarget);
    var tag = btn.getAttribute('data-tag') || 'all';

    setActiveButton(btn);
    applyFilter(tag);

    // Update the URL hash so the filter state is bookmarkable / shareable.
    // Use replaceState to avoid polluting browser history with filter clicks.
    // Only the hash fragment is modified — the origin and pathname are unchanged.
    if (window.history && window.history.replaceState) {
      var newHash = tag === 'all' ? '' : '#filter=' + encodeURIComponent(tag);
      window.history.replaceState(null, '', newHash || window.location.pathname);
    }
  }

  /**
   * Read the URL hash on page load and restore the filter state if present.
   * Format: #filter=TagName
   */
  function restoreFilterFromHash() {
    var hash = window.location.hash; // e.g. "#filter=LLM"
    if (!hash) return;

    var match = hash.match(/^#filter=(.+)$/);
    if (!match) return;

    var tag = decodeURIComponent(match[1]);

    // Find the corresponding button and activate it.
    for (var i = 0; i < buttons.length; i++) {
      if ((buttons[i].getAttribute('data-tag') || '').toLowerCase() === tag.toLowerCase()) {
        setActiveButton(buttons[i]);
        applyFilter(tag);
        return;
      }
    }
    // If no matching button found, fall back to showing all.
    applyFilter('all');
  }

  // ── Attach event listeners ──────────────────────────────────────────────
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].setAttribute('aria-pressed', buttons[i].classList.contains('active') ? 'true' : 'false');
    buttons[i].addEventListener('click', onButtonClick);
  }

  // Support keyboard activation (Enter / Space) for accessibility.
  filterControls.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      var target = /** @type {HTMLElement} */ (event.target);
      if (target.classList.contains('filter-btn')) {
        event.preventDefault();
        target.click();
      }
    }
  });

  // Restore filter state from URL hash on initial page load.
  restoreFilterFromHash();

})();

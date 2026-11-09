// Autocomplete for the header search bar.
// After 2+ characters, fetch /api/suggest?q=... and show the matches below the input.
// Pick one with a click, or with the arrow keys and Enter; Escape closes the list.
// Suggestions are added with textContent so recipe text can't inject HTML.
(() => {
  const input = document.getElementById('search-input');
  const list = document.getElementById('search-suggestions');
  if (!input || !list) return;

  const MIN_LENGTH = 2;
  const DELAY_MS = 150;
  let suggestions = [];
  let activeIndex = -1;
  let timer = null;
  let request = null;

  function close() {
    list.hidden = true;
    list.replaceChildren();
    suggestions = [];
    activeIndex = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function setActive(index) {
    const items = list.children;
    if (activeIndex >= 0 && items[activeIndex]) {
      items[activeIndex].classList.remove('active');
      items[activeIndex].setAttribute('aria-selected', 'false');
    }
    activeIndex = index;
    const item = items[activeIndex];
    if (!item) {
      input.removeAttribute('aria-activedescendant');
      return;
    }
    item.classList.add('active');
    item.setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', item.id);
    item.scrollIntoView({ block: 'nearest' });
  }

  function choose(index) {
    input.value = suggestions[index].text;
    close();
    input.form.requestSubmit();
  }

  function render(items) {
    close();
    if (!items.length) return;
    suggestions = items;

    items.forEach((suggestion, index) => {
      const item = document.createElement('li');
      item.id = `search-suggestion-${index}`;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');

      const text = document.createElement('span');
      text.textContent = suggestion.text;
      const type = document.createElement('span');
      type.className = 'suggestion-type';
      type.textContent = suggestion.type;
      item.append(text, type);

      // mousedown would blur the input and close the list before the click lands.
      item.addEventListener('mousedown', (event) => event.preventDefault());
      item.addEventListener('mouseenter', () => setActive(index));
      item.addEventListener('click', () => choose(index));
      list.append(item);
    });

    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  async function loadSuggestions(term) {
    if (request) request.abort();
    request = new AbortController();
    try {
      const response = await fetch(`/api/suggest?q=${encodeURIComponent(term)}`, { signal: request.signal });
      if (!response.ok) return close();
      const items = await response.json();
      // Ignore answers for text the user has already changed.
      if (input.value.trim() !== term || document.activeElement !== input) return;
      render(Array.isArray(items) ? items : []);
    } catch (error) {
      if (error.name !== 'AbortError') close();
    }
  }

  function scheduleLoad() {
    clearTimeout(timer);
    const term = input.value.trim();
    if (term.length < MIN_LENGTH) {
      if (request) request.abort();
      close();
      return;
    }
    timer = setTimeout(() => loadSuggestions(term), DELAY_MS);
  }

  input.addEventListener('input', scheduleLoad);

  input.addEventListener('keydown', (event) => {
    if (list.hidden) {
      if (event.key === 'ArrowDown') scheduleLoad();
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActive((activeIndex + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActive(activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1);
        break;
      case 'Enter':
        // With nothing highlighted, Enter submits what was typed.
        if (activeIndex >= 0) {
          event.preventDefault();
          choose(activeIndex);
        }
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
      default:
        break;
    }
  });

  input.addEventListener('blur', () => {
    clearTimeout(timer);
    close();
  });
})();

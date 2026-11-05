(async function () {
  const cards = document.querySelector('#cards');
  const filters = document.querySelector('#filters');
  const search = document.querySelector('#search');
  const count = document.querySelector('#count');
  const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const validUrl = value => typeof value === 'string' && (/^https:\/\//i.test(value) || /^(?!\/|\\|\.|#)[A-Za-z0-9_-]+\//.test(value));
  const anchor = (label, url) => validUrl(url)
    ? '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + ' ↗</a>'
    : '';

  let data = [];
  let active = 'All';
  try {
    const response = await fetch('catalog.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Could not load catalog');
    const catalog = await response.json();
    // Use one card per work, even if an old publication is listed by two source sites.
    const seen = new Set();
    data = catalog.filter(item => {
      const key = (item.canonicalId || item.title).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (e) {
    cards.textContent = 'Unable to load publications. Please try again.';
    return;
  }

  const groups = ['All', ...new Set(data.map(item => item.area))];

  function documentLinks(item) {
    const links = Array.isArray(item.links) && item.links.length
      ? item.links
      : item.url ? [{ label: 'Read document', url: item.url }] : [];
    const seen = new Set();
    const result = links.filter(x => {
      if (!x || !validUrl(x.url) || seen.has(x.url)) return false;
      seen.add(x.url);
      return true;
    }).map(x => anchor(x.label || 'Read document', x.url));
    if (item.source && !seen.has(item.source)) result.push(anchor('Source', item.source));
    return result.filter(Boolean).join('') || '<span class="no-file">Bibliographic reference only</span>';
  }

  function render() {
    filters.innerHTML = groups.map(x => '<button type="button" data-filter="' + esc(x) + '" class="' + (active === x ? 'active' : '') + '">' + esc(x) + '</button>').join('');
    const q = search.value.trim().toLowerCase();
    const found = data.filter(x => (active === 'All' || x.area === active)
      && (!q || [x.title, x.type, x.area, x.desc].join(' ').toLowerCase().includes(q)));
    count.textContent = found.length + ' ' + (found.length === 1 ? 'publication' : 'publications');
    cards.innerHTML = found.map(x =>
      '<article class="item"><div class="tag">' + esc(x.area) + ' · ' + esc(x.type) + '</div>'
      + '<h2>' + esc(x.title) + '</h2><p>' + esc(x.desc) + '</p>'
      + '<div class="links">' + documentLinks(x) + '</div></article>'
    ).join('') || '<p>No matching publications.</p>';
    filters.querySelectorAll('button').forEach(button => {
      button.onclick = () => { active = button.dataset.filter; render(); };
    });
  }

  search.addEventListener('input', render);
  render();
})();

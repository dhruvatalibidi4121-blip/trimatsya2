(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    store: '<path d="M4 9h16l-1 11H5L4 9z"/><path d="M3 9l2-5h14l2 5"/><path d="M9 20v-6h6v6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    recycle: '<path d="M7 7l3-4 3 5"/><path d="M6 8L3 13l4 2"/><path d="M18 9l3 5-4 3"/><path d="M14 20h-5l-2-4"/><path d="M9 4h5l2 4"/>',
    factory: '<path d="M3 21V9l6 3V9l6 3V9l6 3v9z"/><path d="M7 21v-4h3v4M14 21v-4h3v4"/>',
    truck: '<path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    wallet: '<path d="M4 6h14a2 2 0 0 1 2 2v10H4z"/><path d="M4 6V5a2 2 0 0 1 2-2h11v3"/><circle cx="17" cy="13" r="1"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 4 5.6 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.6-4-9s1.4-6.4 4-9z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    fish: '<path d="M3 12c4-5 9-6 14-2l4-3v10l-4-3c-5 4-10 3-14-2z"/><circle cx="8" cy="12" r="1"/>',
    pin: '<path d="M12 22s7-6.4 7-12a7 7 0 1 0-14 0c0 5.6 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
    rupee: '<path d="M7 4h10M7 8h10M15 4c0 4-3 4-8 4M15 8c0 5-3 7-8 8l8 4"/>',
    leaf: '<path d="M20 4C9 4 4 9 4 16c0 2 1 4 3 4 7 0 13-5 13-16z"/><path d="M5 19c2-5 6-8 11-10"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5M3 17l9 5 9-5"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11l2.5-8H6"/>',
    file: '<path d="M6 2h8l5 5v15H6z"/><path d="M14 2v6h5"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    logout: '<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>',
    camera: '<path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
    edit: '<path d="M12 20h9"/><path d="M4 20l4-1 12-12-3-3L5 16l-1 4z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M2 20c0-3.2 3-5.5 7-5.5s7 2.3 7 5.5"/><path d="M17 5.5a3.2 3.2 0 0 1 0 6.2M18 14.7c2.4.6 4 2.4 4 5.3"/>',
    package: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>',
    thermometer: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v6"/>',
    map: '<path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    phone: '<path d="M6 3h4l2 5-2.5 1.5a15 15 0 0 0 5 5L16 12l5 2v4c0 1.7-1.3 3-3 3A16 16 0 0 1 3 6c0-1.7 1.3-3 3-3z"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2 6"/><path d="M20 4v7h-7"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    spark: '<path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>',
    alert: '<path d="M12 3l10 18H2L12 3z"/><path d="M12 9v5M12 17h.01"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>',
    print: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/>',
    credit: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M5 12H2a10 10 0 0 0 20 0h-3"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    eye: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5h8v2M3 12h18"/>',
    snow: '<path d="M12 2v20M4 7l16 10M20 7L4 17M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4 1-1-4M20 14l-4-1 1 4M4 14l4-1-1 4M20 10l-4 1 1-4"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>'
  };

  const NAV = [
    { id: 'dashboard', key: 'dashboard', icon: 'dashboard' },
    { id: 'marketplace', key: 'fish_marketplace', icon: 'store' },
    { id: 'add-catch', key: 'add_catch', icon: 'plus' },
    { id: 'orders', key: 'my_orders', icon: 'receipt' },
    { id: 'waste', key: 'waste_management', icon: 'recycle' },
    { id: 'processing', key: 'processing_partners', icon: 'factory' },
    { id: 'logistics', key: 'logistics', icon: 'truck' },
    { id: 'payments', key: 'payments', icon: 'wallet' },
    { id: 'analytics', key: 'analytics', icon: 'chart' },
    { id: 'profile', key: 'profile', icon: 'user' },
    { id: 'settings', key: 'settings', icon: 'settings' }
  ];

  const BOTTOM = [
    { id: 'dashboard', key: 'dashboard', icon: 'dashboard' },
    { id: 'marketplace', key: 'marketplace_short', icon: 'store' },
    { id: 'add-catch', key: 'add_catch_short', icon: 'plus' },
    { id: 'orders', key: 'orders_short', icon: 'receipt' },
    { id: 'more', key: 'more', icon: 'more' }
  ];

  const ALIASES = {
    home: 'dashboard',
    about: 'dashboard',
    fishermen: 'add-catch',
    buyers: 'marketplace',
    pricing: 'payments',
    whatsapp: 'settings',
    admin: 'analytics',
    contact: 'settings'
  };

  const ROLE_KEYS = {
    fisherman: 'role_fisherman',
    buyer: 'role_buyer',
    processor: 'role_processor',
    admin: 'role_admin'
  };

  const state = {
    user: null,
    lang: localStorage.getItem('tm_lang') || 'en',
    screen: 'dashboard',
    prices: [],
    integrations: {},
    fresh: [],
    waste: [],
    partners: [],
    mapData: [],
    orders: [],
    payments: [],
    logistics: [],
    wasteRequests: [],
    roleData: null,
    filters: { q: '', species: '', location: '', quality: '', sort: 'new', wasteCategory: '' },
    bulk: new Map(),
    ordersTab: '',
    logisticsTab: 'fresh',
    authRole: 'fisherman',
    pricingSpecies: '',
    pricingQuantity: 10,
    notifications: [],
    readNotifications: new Set(JSON.parse(localStorage.getItem('tm_read_notifications') || '[]')),
    routeToken: 0,
    toastTimer: null,
    map: null
  };

  function t(key) {
    return window.t ? window.t(state.lang, key) : key;
  }

  function translated(key, fallback) {
    const value = window.I18N?.[state.lang]?.[key] || window.I18N?.en?.[key];
    return value || fallback || key;
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function money(value, decimals = 0) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(Number(value || 0));
  }

  function num(value) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(Number(value || 0));
  }

  function dateShort(value) {
    if (!value) return '—';
    const date = new Date(String(value).replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function timeAgo(value) {
    if (!value) return '';
    const date = new Date(String(value).replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return '';
    const diff = Math.max(0, Date.now() - date.getTime());
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t('just_now');
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    return dateShort(value);
  }

  function initials(name) {
    return String(name || 'TM').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  function roleLabel(role) {
    return t(ROLE_KEYS[role] || 'role_buyer');
  }

  function statusKey(status) {
    return String(status || '').toLowerCase().replace(/\s+/g, '_');
  }

  function statusLabel(status) {
    const key = statusKey(status);
    const value = t(key);
    return value === key ? String(status || '—') : value;
  }

  function statusClass(status) {
    const value = String(status || '').toLowerCase();
    if (['available', 'approved', 'paid', 'delivered', 'verified', 'sold'].includes(value)) return 'green';
    if (['in transit', 'picked up', 'confirmed', 'collected'].includes(value)) return 'blue';
    if (['requested', 'pending', 'registered', 'in inspection'].includes(value)) return 'orange';
    if (['cancelled', 'rejected'].includes(value)) return 'red';
    return '';
  }

  function badge(status) {
    return `<span class="badge ${statusClass(status)}">${esc(statusLabel(status))}</span>`;
  }

  function icon(name) {
    return `<span data-icon="${esc(name)}"></span>`;
  }

  function hydrateIcons(root = document) {
    $$('[data-icon]', root).forEach((node) => {
      const name = node.dataset.icon;
      if (ICONS[name] && !node.querySelector('svg')) {
        node.innerHTML = `<svg viewBox="0 0 24 24">${ICONS[name]}</svg>`;
      }
    });
  }

  async function api(url, options = {}) {
    const opts = { credentials: 'same-origin', ...options };
    if (options.body !== undefined) {
      opts.headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      if (typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
    }
    const response = await fetch(url, opts);
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text || 'Unexpected response.' }; }
    if (!response.ok) {
      const error = new Error(data.error || `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function showToast(message, type = '') {
    const node = $('#toast');
    if (!node) return;
    node.textContent = message;
    node.className = `toast show ${type}`;
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => { node.className = 'toast'; }, 3200);
  }

  function applyI18n() {
    $$('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
    $$('[data-i18n-ph]').forEach((node) => { node.placeholder = t(node.dataset.i18nPh); });
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve('');
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function monthKey(value) {
    return String(value || '').slice(0, 7);
  }

  function monthLabel(key) {
    const [year, month] = String(key).split('-').map(Number);
    if (!year || !month) return key;
    return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'short' });
  }

  function lastMonths(count) {
    const rows = [];
    const now = new Date();
    for (let index = count - 1; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      rows.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
    return rows;
  }

  function marketPrice(species) {
    return Number(state.prices.find((price) => price.species === species)?.price_per_kg || 0);
  }

  function listingById(id) {
    return [...state.fresh, ...state.waste].find((listing) => Number(listing.id) === Number(id));
  }

  function filteredFresh() {
    const q = state.filters.q.trim().toLowerCase();
    const rows = state.fresh.filter((listing) => {
      if (listing.status !== 'available') return false;
      if (state.filters.species && listing.species !== state.filters.species) return false;
      if (state.filters.location && !String(listing.location || '').toLowerCase().includes(state.filters.location.toLowerCase())) return false;
      if (state.filters.quality === 'verified' && !listing.verified) return false;
      if (['fresh', 'chilled'].includes(state.filters.quality) && !String(listing.item_condition || '').toLowerCase().includes(state.filters.quality)) return false;
      if (q && ![listing.species, listing.local_name, listing.location, listing.seller_name, listing.description].some((value) => String(value || '').toLowerCase().includes(q))) return false;
      return true;
    });
    const sort = state.filters.sort;
    return rows.sort((a, b) => {
      if (sort === 'price-asc') return Number(a.price_per_kg) - Number(b.price_per_kg);
      if (sort === 'price-desc') return Number(b.price_per_kg) - Number(a.price_per_kg);
      if (sort === 'quantity') return Number(b.quantity_kg) - Number(a.quantity_kg);
      return new Date(String(b.created_at).replace(' ', 'T')) - new Date(String(a.created_at).replace(' ', 'T'));
    });
  }

  function filteredWaste() {
    return state.waste.filter((listing) => {
      if (state.filters.wasteCategory && listing.category !== state.filters.wasteCategory) return false;
      return true;
    });
  }

  function activeOrders() {
    const rows = state.roleData?.orders || state.orders || [];
    return rows.filter((order) => !['Delivered', 'Cancelled'].includes(order.status));
  }

  function activeWasteRequests() {
    return state.wasteRequests.filter((request) => !['Delivered', 'Cancelled', 'Rejected'].includes(request.status));
  }

  function dashboardOrders() {
    if (!state.user) return [];
    if (state.user.role === 'admin') return state.roleData?.orders || state.orders;
    if (state.user.role === 'fisherman') return state.roleData?.orders || state.orders;
    if (state.user.role === 'buyer') return state.roleData?.orders || state.orders;
    return [];
  }

  function wasteRecovered() {
    if (state.user?.role === 'admin') return Number(state.roleData?.stats?.wasteCollected || 0);
    if (state.user?.role === 'processor') return state.wasteRequests.filter((request) => ['Collected', 'Delivered'].includes(request.status)).reduce((sum, request) => sum + Number(request.quantity_kg || 0), 0);
    if (state.user?.role === 'fisherman') return state.wasteRequests.filter((request) => ['Collected', 'Delivered'].includes(request.status)).reduce((sum, request) => sum + Number(request.quantity_kg || 0), 0);
    return state.waste.filter((listing) => listing.status === 'approved').reduce((sum, listing) => sum + Number(listing.quantity_kg || 0), 0);
  }

  function orderRows(orders, limit = 5) {
    if (!orders.length) return `<tr><td colspan="6" class="table-empty">${esc(t('no_orders'))}</td></tr>`;
    return orders.slice(0, limit).map((order) => `
      <tr>
        <td><div class="table-main"><span class="activity-icon">${icon('receipt')}</span><div><strong>#${esc(order.id)}</strong><small>${esc(dateShort(order.created_at))}</small></div></div></td>
        <td>${esc(order.buyer_name || t('buyer'))}</td>
        <td>${esc(order.items || `${num(order.total_quantity)} kg`)}</td>
        <td><strong>${money(order.total_amount)}</strong></td>
        <td>${badge(order.status)}</td>
        <td class="text-right"><button class="btn btn-ghost btn-sm" data-action="view-order" data-id="${esc(order.id)}">${esc(t('view'))}</button></td>
      </tr>
    `).join('');
  }

  function orderTable(orders, limit = 20) {
    return `<div class="table-wrap"><table><thead><tr><th>${esc(t('order_id'))}</th><th>${esc(t('buyer'))}</th><th>${esc(t('items'))}</th><th>${esc(t('amount'))}</th><th>${esc(t('status'))}</th><th></th></tr></thead><tbody>${orderRows(orders, limit)}</tbody></table></div>`;
  }

  function wasteRequestRows(requests, limit = 10) {
    if (!requests.length) return `<tr><td colspan="6" class="table-empty">${esc(t('no_requests'))}</td></tr>`;
    return requests.slice(0, limit).map((request) => `
      <tr>
        <td><div class="table-main">${request.image ? `<img class="table-thumb" src="${esc(request.image)}" alt="">` : ''}<div><strong>${esc(request.category || request.species)}</strong><small>${esc(dateShort(request.created_at))}</small></div></div></td>
        <td>${num(request.quantity_kg)} kg</td>
        <td>${esc(request.processor_name || state.user?.name || '—')}</td>
        <td>${esc(request.scheduled_at || '—')}</td>
        <td>${badge(request.status)}</td>
        <td class="text-right">${canUpdateWaste() ? `<select class="status-select" data-waste-status="${esc(request.id)}">${wasteStatusOptions(request.status)}</select>` : `<span class="small muted">${esc(request.notes || '')}</span>`}</td>
      </tr>
    `).join('');
  }

  function wasteRequestTable(requests, limit = 10) {
    return `<div class="table-wrap"><table><thead><tr><th>${esc(t('material'))}</th><th>${esc(t('quantity'))}</th><th>${esc(t('processor'))}</th><th>${esc(t('scheduled'))}</th><th>${esc(t('status'))}</th><th></th></tr></thead><tbody>${wasteRequestRows(requests, limit)}</tbody></table></div>`;
  }

  function canUpdateWaste() {
    return ['admin', 'processor'].includes(state.user?.role);
  }

  function wasteStatusOptions(current) {
    return ['Requested', 'Confirmed', 'Collected', 'Delivered', 'Cancelled'].map((status) => `<option value="${status}" ${status === current ? 'selected' : ''}>${esc(statusLabel(status))}</option>`).join('');
  }

  function orderStatusOptions(current) {
    return ['Requested', 'Confirmed', 'Picked up', 'In transit', 'Delivered', 'Cancelled'].map((status) => `<option value="${status}" ${status === current ? 'selected' : ''}>${esc(statusLabel(status))}</option>`).join('');
  }

  function canOrder() {
    return ['buyer', 'admin'].includes(state.user?.role);
  }

  function canListCatch() {
    return ['fisherman', 'admin'].includes(state.user?.role);
  }

  function canRequestWaste() {
    return ['processor', 'admin'].includes(state.user?.role);
  }

  async function loadCore() {
    const [me, prices, integrations] = await Promise.all([api('/api/me'), api('/api/market-prices'), api('/api/integrations')]);
    state.user = me.user || null;
    state.prices = prices.prices || [];
    state.integrations = integrations || {};
    if (state.user?.language) {
      state.lang = state.user.language;
      localStorage.setItem('tm_lang', state.lang);
    }
  }

  async function loadFresh() {
    state.fresh = (await api('/api/listings?type=fresh')).listings || [];
  }

  async function loadWaste() {
    try {
      state.waste = (await api('/waste/listings')).listings || [];
    } catch (e) {
      state.waste = (await api('/api/listings?type=waste')).listings || [];
    }
  }

  async function loadPartners() {
    state.partners = (await api('/api/processing-partners')).partners || [];
  }

  async function loadMapData() {
    state.mapData = (await api('/api/map-data')).markers || [];
  }

  async function loadOrders() {
    if (!state.user) return;
    state.orders = (await api('/api/orders')).orders || [];
  }

  async function loadPayments() {
    if (!state.user) return;
    state.payments = (await api('/api/payments')).payments || [];
  }

  async function loadLogistics() {
    if (!state.user) return;
    state.logistics = (await api('/api/logistics')).logistics || [];
  }

  async function loadWasteRequests() {
    if (!state.user) return;
    state.wasteRequests = (await api('/api/waste/requests')).requests || [];
  }

  async function loadRoleData() {
    if (!state.user) {
      state.roleData = null;
      return;
    }
    if (state.user.role === 'admin') state.roleData = await api('/api/dashboard/admin');
    else if (state.user.role === 'fisherman') state.roleData = await api('/api/dashboard/fisherman');
    else if (state.user.role === 'buyer') state.roleData = await api('/api/dashboard/buyer');
    else if (state.user.role === 'processor') state.roleData = await api('/api/dashboard/processor');
    else state.roleData = null;
  }

  async function refreshAll() {
    state.roleData = null;
    state.orders = [];
    state.payments = [];
    state.logistics = [];
    state.wasteRequests = [];
    state.notifications = [];
    await Promise.all([loadCore(), loadFresh(), loadWaste(), loadPartners(), loadMapData()]);
  }

  async function prepareScreen(name) {
    const tasks = [];
    if (['dashboard', 'marketplace', 'add-catch', 'analytics', 'waste', 'processing', 'logistics', 'orders', 'payments', 'profile'].includes(name)) tasks.push(loadPricesOnly());
    if (['dashboard', 'marketplace', 'add-catch', 'analytics'].includes(name)) tasks.push(loadFresh());
    if (['dashboard', 'waste', 'processing', 'analytics'].includes(name)) tasks.push(loadWaste());
    if (['processing', 'waste'].includes(name)) tasks.push(loadPartners());
    if (['logistics', 'processing'].includes(name)) tasks.push(loadMapData());
    if (state.user) {
      if (['dashboard', 'orders', 'analytics', 'profile', 'settings', 'processing', 'payments'].includes(name)) tasks.push(loadRoleData());
      if (['orders', 'analytics'].includes(name)) tasks.push(loadOrders());
      if (['payments', 'analytics'].includes(name)) tasks.push(loadPayments());
      if (['logistics'].includes(name)) tasks.push(loadLogistics());
      if (['dashboard', 'waste', 'processing', 'logistics', 'orders'].includes(name)) tasks.push(loadWasteRequests());
    }
    await Promise.all(tasks);
  }

  async function loadPricesOnly() {
    if (state.prices.length) return;
    state.prices = (await api('/api/market-prices')).prices || [];
  }

  function normalizeScreen(name) {
    if (ALIASES[name]) return ALIASES[name];
    return NAV.some((item) => item.id === name) ? name : 'dashboard';
  }

  function navigate(name) {
    const target = normalizeScreen(name);
    closeSidebar();
    closeNotifications();
    if (state.screen === target && location.hash === `#/${target}`) {
      renderRoute();
      return;
    }
    location.hash = `#/${target}`;
  }

  function renderSideNav() {
    const ordersCount = state.user?.role === 'processor' ? activeWasteRequests().length : activeOrders().length;
    const wasteCount = activeWasteRequests().length;
    $('#sideNav').innerHTML = NAV.map((item) => {
      let count = 0;
      if (item.id === 'orders') count = ordersCount;
      if (item.id === 'waste') count = wasteCount;
      return `<a class="side-link ${state.screen === item.id ? 'active' : ''}" href="#/${item.id}" data-nav="${item.id}">
        ${icon(item.icon)}<span class="side-label">${esc(t(item.key))}</span>${count ? `<span class="side-badge">${count}</span>` : ''}
      </a>`;
    }).join('');
    hydrateIcons($('#sideNav'));
  }

  function renderBottomNav() {
    $('#bottomNav').innerHTML = BOTTOM.map((item) => `<button class="bottom-link ${state.screen === item.id ? 'active' : ''}" data-action="${item.id === 'more' ? 'open-sidebar' : 'navigate'}" ${item.id !== 'more' ? `data-nav="${item.id}"` : ''}>
      ${icon(item.icon)}<span>${esc(t(item.key))}</span>
    </button>`).join('');
    hydrateIcons($('#bottomNav'));
  }

  function renderChrome() {
    renderSideNav();
    renderBottomNav();
    const user = state.user;
    $('#profileAvatar').textContent = user ? initials(user.name) : 'TM';
    $('#profileName').textContent = user ? user.name : t('guest_user');
    $('#profileRole').textContent = user ? roleLabel(user.role) : t('sign_in_prompt');
    $$('#topLanguage, #sidebarLanguage').forEach((select) => { select.value = state.lang; });
    $('#integrationLabel').textContent = state.integrations.whatsapp ? t('whatsapp_connected') : t('platform_online');
    $('#integrationDot').style.background = state.integrations.whatsapp ? '#38d6a1' : '#e5a54b';
    const unread = state.notifications.filter((item) => !state.readNotifications.has(item.id));
    $('#notificationDot').classList.toggle('hidden', !unread.length);
    applyI18n();
  }

  function loadingScreen() {
    return `<div class="loading-screen"><div><div class="spinner"></div>${esc(t('loading'))}</div></div>`;
  }

  async function renderRoute() {
    const raw = location.hash.replace(/^#\/?/, '') || 'dashboard';
    const name = normalizeScreen(raw);
    state.screen = name;
    if (location.hash !== `#/${name}`) history.replaceState(null, '', `#/${name}`);
    if (!state.ordersTab) state.ordersTab = state.user?.role === 'fisherman' ? 'incoming' : state.user?.role === 'processor' ? 'requests' : 'orders';
    const screen = $('#screen');
    screen.innerHTML = loadingScreen();
    const token = ++state.routeToken;
    try {
      await prepareScreen(name);
    } catch (error) {
      if (token === state.routeToken) showToast(error.message, 'error');
    }
    if (token !== state.routeToken) return;
    state.notifications = buildActivities();
    renderChrome();
    screen.innerHTML = (SCREENS[name] || SCREENS.dashboard)();
    hydrateIcons(screen);
    applyI18n();
    renderNotificationPanel();
    if (name === 'logistics') initLogisticsMap();
    screen.scrollTop = 0;
  }

  function buildActivities() {
    const rows = [];
    const push = (item) => { if (item?.title) rows.push(item); };
    const orders = dashboardOrders();
    orders.slice(0, 5).forEach((order) => push({ id: `order-${order.id}`, title: `${t('order')} #${order.id} · ${statusLabel(order.status)}`, detail: `${order.buyer_name || t('buyer')} · ${money(order.total_amount)}`, icon: 'receipt', screen: 'orders', date: order.created_at }));
    (state.roleData?.listings || state.fresh).slice(0, 4).forEach((listing) => push({ id: `listing-${listing.id}`, title: `${listing.species} ${t('listed')}`, detail: `${num(listing.quantity_kg)} kg · ${listing.location}`, icon: 'fish', screen: 'marketplace', date: listing.created_at }));
    (state.roleData?.payments || state.payments).slice(0, 4).forEach((payment) => push({ id: `payment-${payment.id}`, title: `${statusLabel(payment.status)} ${t('payment')}`, detail: `${money(payment.amount)} · ${payment.fisherman_name || t('fisherman')}`, icon: 'wallet', screen: 'payments', date: payment.created_at }));
    state.wasteRequests.slice(0, 4).forEach((request) => push({ id: `waste-${request.id}`, title: `${t('collection')} ${statusLabel(request.status)}`, detail: `${num(request.quantity_kg)} kg ${request.category || ''}`, icon: 'recycle', screen: 'waste', date: request.created_at }));
    state.logistics.slice(0, 4).forEach((shipment) => push({ id: `shipment-${shipment.id}`, title: `${t('shipment')} ${statusLabel(shipment.status)}`, detail: `${shipment.pickup_location} → ${shipment.destination}`, icon: 'truck', screen: 'logistics', date: shipment.created_at }));
    if (!rows.length) {
      state.prices.slice(0, 3).forEach((price) => push({ id: `price-${price.species}`, title: `${t('market_price_updated')} · ${price.species}`, detail: `${money(price.price_per_kg)}${t('per_kg')}`, icon: 'trend', screen: 'marketplace', date: price.updated_at }));
      state.waste.slice(0, 2).forEach((listing) => push({ id: `waste-public-${listing.id}`, title: `${listing.category || listing.species} ${t('available')}`, detail: `${num(listing.quantity_kg)} kg · ${listing.location}`, icon: 'leaf', screen: 'waste', date: listing.created_at }));
    }
    return rows.sort((a, b) => new Date(String(b.date).replace(' ', 'T')) - new Date(String(a.date).replace(' ', 'T'))).slice(0, 8);
  }

  function renderNotificationPanel() {
    const panel = $('#notificationList');
    if (!panel) return;
    const rows = state.notifications;
    panel.innerHTML = rows.length ? rows.map((item) => `<button class="notification-item ${state.readNotifications.has(item.id) ? '' : 'unread'}" data-action="open-notification" data-id="${esc(item.id)}" data-screen="${esc(item.screen)}">
      <span class="activity-icon">${icon(item.icon)}</span>
      <span><strong>${esc(item.title)}</strong><small>${esc(item.detail)} · ${esc(timeAgo(item.date))}</small></span>
    </button>`).join('') : `<div class="notification-empty">${esc(t('no_notifications'))}</div>`;
    hydrateIcons(panel);
    const unread = rows.filter((item) => !state.readNotifications.has(item.id));
    $('#notificationDot').classList.toggle('hidden', !unread.length);
  }

  function saveReadNotifications() {
    localStorage.setItem('tm_read_notifications', JSON.stringify(Array.from(state.readNotifications)));
  }

  function markAllRead() {
    state.notifications.forEach((item) => state.readNotifications.add(item.id));
    saveReadNotifications();
    renderNotificationPanel();
    renderChrome();
  }

  function closeNotifications() {
    $('#notificationPanel').classList.remove('open');
    $('#notificationPanel').setAttribute('aria-hidden', 'true');
  }

  function toggleNotifications() {
    const panel = $('#notificationPanel');
    const open = !panel.classList.contains('open');
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) renderNotificationPanel();
  }

  function openSidebar() {
    $('#sidebar').classList.add('open');
    $('#sidebarBackdrop').classList.add('open');
  }

  function closeSidebar() {
    $('#sidebar').classList.remove('open');
    $('#sidebarBackdrop').classList.remove('open');
  }

  function openModal(content, wide = false) {
    const root = $('#modalRoot');
    root.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${content}</div>`;
    root.classList.add('open');
    root.setAttribute('aria-hidden', 'false');
    hydrateIcons(root);
  }

  function closeModal() {
    const root = $('#modalRoot');
    root.classList.remove('open');
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = '';
  }

  function modalHead(title, subtitle = '') {
    return `<div class="modal-head"><div><h2>${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div><button class="modal-close" data-action="close-modal" aria-label="${esc(t('close'))}">${icon('close')}</button></div>`;
  }

  function openAuth(mode = 'login', role = 'fisherman') {
    state.authRole = role;
    const isRegister = mode === 'register';
    const demos = [
      ['ravi@demo.in', 'fish123', t('role_fisherman')],
      ['buyer@demo.in', 'buyer123', t('role_buyer')],
      ['processor@demo.in', 'process123', t('role_processor')],
      ['admin@trimatsya.in', 'admin123', t('role_admin')]
    ];
    openModal(`${modalHead(isRegister ? t('register_title') : t('login_title'), isRegister ? t('register_subtitle') : t('login_subtitle'))}
      <div class="modal-body">
        <div class="tabs" style="margin-bottom:16px">
          <button class="tab ${!isRegister ? 'active' : ''}" data-action="auth-mode" data-mode="login">${esc(t('login'))}</button>
          <button class="tab ${isRegister ? 'active' : ''}" data-action="auth-mode" data-mode="register" data-role="${esc(state.authRole)}">${esc(t('register'))}</button>
        </div>
        <form id="authForm" class="form-grid">
          <input type="hidden" name="mode" value="${isRegister ? 'register' : 'login'}">
          ${isRegister ? `<label class="field full"><span>${esc(t('full_name'))}</span><input name="name" autocomplete="name" required></label>
          <label class="field"><span>${esc(t('account_type'))}</span><select name="role">${['fisherman', 'buyer', 'processor'].map((item) => `<option value="${item}" ${item === state.authRole ? 'selected' : ''}>${esc(roleLabel(item))}</option>`).join('')}</select></label>
          <label class="field"><span>${esc(t('phone'))}</span><input name="phone" autocomplete="tel" placeholder="+91"></label>
          <label class="field full"><span>${esc(t('location'))}</span><input name="location" autocomplete="address-level2" placeholder="Mangaluru Harbour"></label>` : ''}
          <label class="field ${isRegister ? '' : 'full'}"><span>${esc(t('email'))}</span><input name="email" type="email" autocomplete="email" required></label>
          <label class="field ${isRegister ? '' : 'full'}"><span>${esc(t('password'))}</span><input name="password" type="password" autocomplete="${isRegister ? 'new-password' : 'current-password'}" minlength="6" required></label>
          <input type="hidden" name="language" value="${esc(state.lang)}">
          <div class="full"><div id="authError" class="form-note hidden" style="color:#b43b3b;background:#fff3f3;border-color:#f0cccc"></div></div>
          <div class="full form-actions"><button class="btn btn-primary btn-block" type="submit">${esc(isRegister ? t('create_account') : t('login'))}</button></div>
        </form>
        ${!isRegister ? `<div class="demo-row">${demos.map(([email, password, label]) => `<button class="demo-pill" data-action="demo-login" data-email="${email}" data-password="${password}">${esc(label)}</button>`).join('')}</div>` : ''}
      </div>`);
  }

  function openListingModal(listing) {
    if (!listing) return;
    const isWaste = listing.type === 'waste';
    const canRequest = isWaste && canRequestWaste() && listing.status === 'approved';
    const canBuy = !isWaste && canOrder() && listing.status === 'available';
    openModal(`${modalHead(listing.species, listing.local_name || (isWaste ? listing.category : t('catch_details')))}
      <div class="modal-body">
        <img class="detail-media" src="${esc(listing.image || '/images/fish-market-vizag.jpg')}" alt="${esc(listing.species)}">
        <div class="detail-grid">
          <div class="detail-item"><span>${esc(t('price'))}</span><strong>${money(listing.price_per_kg)}${esc(t('per_kg'))}</strong></div>
          <div class="detail-item"><span>${esc(t('available_qty'))}</span><strong>${num(listing.quantity_kg)} kg</strong></div>
          <div class="detail-item"><span>${esc(t('condition'))}</span><strong>${esc(listing.item_condition)}</strong></div>
          <div class="detail-item"><span>${esc(t('location'))}</span><strong>${esc(listing.location)}</strong></div>
          <div class="detail-item"><span>${esc(t('seller'))}</span><strong>${esc(listing.seller_name || '—')}</strong></div>
          <div class="detail-item"><span>${esc(t('status'))}</span><strong>${badge(listing.status)}</strong></div>
        </div>
        <p class="muted small">${esc(listing.description || t('no_description'))}</p>
      </div>
      <div class="modal-foot">
        <button class="btn" data-action="close-modal">${esc(t('close'))}</button>
        ${canBuy ? `<button class="btn btn-primary" data-action="order-listing" data-id="${esc(listing.id)}">${esc(t('place_order'))}</button>` : ''}
        ${canRequest ? `<button class="btn btn-primary" data-action="request-waste" data-id="${esc(listing.id)}">${esc(t('request_collection'))}</button>` : ''}
      </div>`);
  }

  function orderBreakdown(listing, quantity) {
    const market = marketPrice(listing.species) || Number(listing.price_per_kg);
    const qty = Number(quantity) || 0;
    const fee = market * 0.02 * qty;
    const transport = 4 * qty;
    const total = market * qty;
    return { market, qty, fee, transport, total, payout: total - fee - transport };
  }

  function openOrderModal(listing) {
    if (!state.user) return openAuth('login', 'buyer');
    if (!canOrder()) return showToast(t('buyer_order_note'), 'error');
    if (!listing || listing.type !== 'fresh' || listing.status !== 'available') return showToast(t('listing_unavailable'), 'error');
    openModal(`${modalHead(t('order_fish'), `${listing.species} · ${listing.location}`)}
      <form id="orderForm" class="modal-body">
        <input type="hidden" name="listingId" value="${esc(listing.id)}">
        <input type="hidden" name="species" value="${esc(listing.species)}">
        <div class="form-grid">
          <label class="field"><span>${esc(t('quantity_kg'))}</span><input id="orderQuantity" name="quantity" type="number" min="1" max="${Number(listing.quantity_kg)}" step="1" value="${Math.min(10, Number(listing.quantity_kg))}" required></label>
          <label class="field"><span>${esc(t('delivery_location'))}</span><input name="deliveryLocation" value="${esc(state.user.location || 'Mangaluru')}" required></label>
        </div>
        <div class="card" style="margin-top:14px;box-shadow:none"><div class="card-body"><div class="breakdown" id="orderBreakdown">${orderBreakdownHtml(listing, Math.min(10, Number(listing.quantity_kg)))}</div></div></div>
        <div class="form-actions"><button class="btn" type="button" data-action="close-modal">${esc(t('cancel'))}</button><button class="btn btn-primary" type="submit">${esc(t('place_order'))}</button></div>
      </form>`);
  }

  function orderBreakdownHtml(listing, quantity) {
    const row = orderBreakdown(listing, quantity);
    return `<div class="breakdown-row"><span>${esc(t('market_rate'))} · ${esc(listing.species)}</span><strong>${money(row.market)}${esc(t('per_kg'))}</strong></div>
      <div class="breakdown-row"><span>${esc(t('quantity'))}</span><strong>${num(row.qty)} kg</strong></div>
      <div class="breakdown-row"><span>${esc(t('platform_fee'))} (2%)</span><strong>− ${money(row.fee)}</strong></div>
      <div class="breakdown-row"><span>${esc(t('transport'))} (₹4/kg)</span><strong>− ${money(row.transport)}</strong></div>
      <div class="breakdown-row"><span>${esc(t('fisherman_payout'))}</span><strong>${money(row.payout)}</strong></div>
      <div class="breakdown-row total"><span>${esc(t('total_payable'))}</span><strong>${money(row.total)}</strong></div>`;
  }

  function openWasteRequestModal(listing) {
    if (!state.user) return openAuth('login', 'processor');
    if (!canRequestWaste()) return showToast(t('processor_note'), 'error');
    if (!listing || listing.type !== 'waste' || listing.status !== 'approved') return showToast(t('inspection_note'), 'error');
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    openModal(`${modalHead(t('request_collection'), `${listing.category} · ${listing.location}`)}
      <form id="wasteRequestForm" class="modal-body">
        <input type="hidden" name="listingId" value="${esc(listing.id)}">
        <div class="form-grid">
          <label class="field"><span>${esc(t('quantity_kg'))}</span><input name="quantity" type="number" min="1" max="${Number(listing.quantity_kg)}" step="1" value="${Number(listing.quantity_kg)}" required></label>
          <label class="field"><span>${esc(t('scheduled_date'))}</span><input name="scheduledAt" type="date" value="${tomorrow}" required></label>
          <label class="field full"><span>${esc(t('transporter'))}</span><input name="transporter" value="Green Cycle Logistics"></label>
          <label class="field full"><span>${esc(t('notes'))}</span><textarea name="notes" rows="2" placeholder="${esc(t('collection_notes_hint'))}"></textarea></label>
        </div>
        <div class="form-note" style="margin-top:12px">${icon('shield')}<span>${esc(t('waste_safety_short'))}</span></div>
        <div class="form-actions"><button class="btn" type="button" data-action="close-modal">${esc(t('cancel'))}</button><button class="btn btn-primary" type="submit">${esc(t('send_request'))}</button></div>
      </form>`);
  }

  function openWasteForm() {
    if (!state.user) return openAuth('register', 'fisherman');
    if (!canListCatch()) return showToast(t('fisherman_material_note'), 'error');
    openModal(`${modalHead(t('register_material'), t('waste_form_subtitle'))}
      <form id="wasteForm" class="modal-body">
        <div class="form-grid">
          <label class="field"><span>${esc(t('material_type'))}</span><select name="species"><option>Fish Offcuts</option><option>Processing Residue</option><option>Fish Viscera</option><option>Fish Frames</option><option>Fish Skin &amp; Scales</option></select></label>
          <label class="field"><span>${esc(t('category'))}</span><select name="category"><option>Fishmeal</option><option>Fish Oil</option><option>Organic Fertilizer</option><option>Biomedical Research</option></select></label>
          <label class="field"><span>${esc(t('quantity_kg'))}</span><input name="quantity" type="number" min="1" step="1" required></label>
          <label class="field"><span>${esc(t('expected_price'))}</span><input name="price" type="number" min="0" step="1" value="0"></label>
          <label class="field"><span>${esc(t('location'))}</span><input name="location" value="${esc(state.user.location || 'Mangaluru Harbour')}" required></label>
          <label class="field"><span>${esc(t('photograph'))}</span><input name="image" type="file" accept="image/*"></label>
          <label class="field full"><span>${esc(t('notes'))}</span><textarea name="description" rows="2" placeholder="${esc(t('material_notes_hint'))}"></textarea></label>
        </div>
        <div class="form-note" style="margin-top:12px">${icon('alert')}<span>${esc(t('waste_safety_short'))}</span></div>
        <div class="form-actions"><button class="btn" type="button" data-action="close-modal">${esc(t('cancel'))}</button><button class="btn btn-primary" type="submit">${esc(t('submit_material'))}</button></div>
      </form>`);
  }

  async function openOrderDetail(id) {
    const local = [...state.orders, ...(state.roleData?.orders || [])].find((order) => Number(order.id) === Number(id));
    let order = local;
    let items = [];
    try {
      const result = await api(`/api/orders/${id}`);
      order = result.order;
      items = result.items || [];
    } catch (error) {
      if (!local) return showToast(error.message, 'error');
    }
    if (!order) return;
    const rows = items.map((item) => `<tr><td><div class="table-main"><img class="table-thumb" src="${esc(item.image || '/images/fish-market-vizag.jpg')}" alt=""><div><strong>${esc(item.species)}</strong><small>${esc(item.fisherman_name)}</small></div></div></td><td>${num(item.quantity_kg)} kg</td><td>${money(item.price_per_kg)}</td><td>${money(item.fisherman_payment)}</td></tr>`).join('');
    openModal(`${modalHead(`${t('order')} #${order.id}`, dateShort(order.created_at))}
      <div class="modal-body">
        <div class="invoice-head"><div><h2>${esc(t('invoice_title'))}</h2><small>${esc(order.items || `${num(order.total_quantity)} kg`)}</small></div><div>${badge(order.status)}</div></div>
        <div class="invoice-parties"><div><span>${esc(t('bill_to'))}</span><strong>${esc(order.buyer_name || state.user?.name || '—')}</strong><small>${esc(order.delivery_location)}</small></div><div><span>${esc(t('sold_by'))}</span><strong>TRI-MATSYA</strong><small>Mangaluru, Karnataka</small></div></div>
        ${items.length ? `<div class="table-wrap"><table><thead><tr><th>${esc(t('item'))}</th><th>${esc(t('quantity'))}</th><th>${esc(t('price'))}</th><th>${esc(t('payout'))}</th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}
        <div class="breakdown" style="margin-top:14px">
          <div class="breakdown-row"><span>${esc(t('gross_value'))}</span><strong>${money(order.total_amount)}</strong></div>
          <div class="breakdown-row"><span>${esc(t('platform_fee'))}</span><strong>${money(order.total_amount * 0.02)}</strong></div>
          <div class="breakdown-row"><span>${esc(t('transport'))}</span><strong>${money(order.total_quantity * 4)}</strong></div>
          <div class="breakdown-row total"><span>${esc(t('fisherman_payout'))}</span><strong>${money(order.total_amount - order.total_amount * 0.02 - order.total_quantity * 4)}</strong></div>
        </div>
        <p class="invoice-note">${esc(t('invoice_note'))}</p>
        ${['buyer', 'admin'].includes(state.user?.role) ? `<div class="field" style="margin-top:12px"><span>${esc(t('update_status'))}</span><select id="orderStatusSelect" data-order-status="${esc(order.id)}">${orderStatusOptions(order.status)}</select></div>` : ''}
      </div>
      <div class="modal-foot"><button class="btn" data-action="close-modal">${esc(t('close'))}</button><button class="btn btn-soft" data-action="print-invoice">${icon('print')}${esc(t('print'))}</button></div>`);
  }

  function openPaymentDetail(payment) {
    const gross = Number(payment.amount || 0) + Number(payment.fee_amount || 0) + Number(payment.transport_amount || 0);
    openModal(`${modalHead(t('transaction_breakdown'), `${t('order')} #${payment.order_id}`)}
      <div class="modal-body">
        <div class="detail-grid"><div class="detail-item"><span>${esc(t('date'))}</span><strong>${esc(dateShort(payment.created_at))}</strong></div><div class="detail-item"><span>${esc(t('status'))}</span><strong>${badge(payment.status)}</strong></div><div class="detail-item"><span>${esc(t('fisherman'))}</span><strong>${esc(payment.fisherman_name || '—')}</strong></div><div class="detail-item"><span>${esc(t('quantity'))}</span><strong>${num(payment.quantity_kg)} kg</strong></div></div>
        <div class="breakdown">
          <div class="breakdown-row"><span>${esc(t('gross_value'))}</span><strong>${money(gross)}</strong></div>
          <div class="breakdown-row"><span>${esc(t('platform_fee'))}</span><strong>− ${money(payment.fee_amount)}</strong></div>
          <div class="breakdown-row"><span>${esc(t('transport'))}</span><strong>− ${money(payment.transport_amount)}</strong></div>
          <div class="breakdown-row total"><span>${esc(t('fisherman_payout'))}</span><strong>${money(payment.amount)}</strong></div>
        </div>
        <p class="invoice-note">${esc(t('payment_note'))}</p>
      </div>
      <div class="modal-foot"><button class="btn" data-action="close-modal">${esc(t('close'))}</button></div>`);
  }

  function openBulkOrderModal() {
    if (!state.user) return openAuth('login', 'buyer');
    if (!canOrder()) return showToast(t('buyer_order_note'), 'error');
    const rows = bulkItems();
    if (!rows.length) return showToast(t('bulk_empty'), 'error');
    openModal(`${modalHead(t('bulk_procurement'), `${rows.length} ${t('suppliers_selected')}`)}
      <form id="bulkOrderForm" class="modal-body">
        <div class="table-wrap"><table><thead><tr><th>${esc(t('fish'))}</th><th>${esc(t('quantity'))}</th><th>${esc(t('price'))}</th></tr></thead><tbody>${rows.map(({ listing, quantity }) => `<tr><td>${esc(listing.species)}<small class="muted"> · ${esc(listing.seller_name)}</small></td><td><input class="bulk-qty-input" data-bulk-id="${esc(listing.id)}" type="number" min="1" max="${Number(listing.quantity_kg)}" value="${quantity}" style="width:76px;padding:5px 7px;border:1px solid var(--line);border-radius:7px"></td><td>${money(listing.price_per_kg)}${esc(t('per_kg'))}</td></tr>`).join('')}</tbody></table></div>
        <label class="field" style="margin-top:14px"><span>${esc(t('delivery_location'))}</span><input name="deliveryLocation" value="${esc(state.user.location || 'Mangaluru')}" required></label>
        <div class="breakdown" id="bulkBreakdown" style="margin-top:12px">${bulkBreakdownHtml()}</div>
        <div class="form-actions"><button class="btn" type="button" data-action="close-modal">${esc(t('cancel'))}</button><button class="btn btn-primary" type="submit">${esc(t('place_bulk_order'))}</button></div>
      </form>`);
  }

  function bulkItems() {
    return Array.from(state.bulk.entries()).map(([id, quantity]) => ({ listing: listingById(id), quantity: Number(quantity) })).filter((row) => row.listing);
  }

  function bulkBreakdownHtml() {
    const rows = bulkItems();
    const gross = rows.reduce((sum, row) => sum + Number(row.listing.price_per_kg) * Number(row.quantity), 0);
    const quantity = rows.reduce((sum, row) => sum + Number(row.quantity), 0);
    const fee = gross * 0.02;
    const transport = quantity * 4;
    return `<div class="breakdown-row"><span>${esc(t('gross_value'))}</span><strong>${money(gross)}</strong></div><div class="breakdown-row"><span>${esc(t('platform_fee'))}</span><strong>− ${money(fee)}</strong></div><div class="breakdown-row"><span>${esc(t('transport'))}</span><strong>− ${money(transport)}</strong></div><div class="breakdown-row total"><span>${esc(t('total_payable'))}</span><strong>${money(gross)}</strong></div>`;
  }

  async function handleAuthSubmit(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const errorBox = $('#authError');
    try {
      const result = await api(data.mode === 'register' ? '/api/register' : '/api/login', { method: 'POST', body: data });
      state.user = result.user;
      if (result.user?.language) {
        state.lang = result.user.language;
        localStorage.setItem('tm_lang', state.lang);
      }
      closeModal();
      await refreshAll();
      state.ordersTab = '';
      showToast(data.mode === 'register' ? t('register_success') : t('login_success'));
      navigate('dashboard');
      renderRoute();
    } catch (error) {
      if (errorBox) {
        errorBox.textContent = error.message;
        errorBox.classList.remove('hidden');
      } else {
        showToast(error.message, 'error');
      }
    }
  }

  async function demoLogin(email, password) {
    try {
      const result = await api('/api/login', { method: 'POST', body: { email, password } });
      state.user = result.user;
      if (result.user?.language) {
        state.lang = result.user.language;
        localStorage.setItem('tm_lang', state.lang);
      }
      closeModal();
      await refreshAll();
      state.ordersTab = '';
      showToast(t('login_success'));
      navigate('dashboard');
      renderRoute();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function handleCatchSubmit(form) {
    if (!canListCatch()) return showToast(t('fisherman_only'), 'error');
    const data = Object.fromEntries(new FormData(form).entries());
    const file = form.querySelector('input[name="image"]')?.files?.[0];
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    try {
      const image = await fileToDataUrl(file);
      await api('/api/listings', { method: 'POST', body: { type: 'fresh', species: data.species, quantity: Number(data.quantity), condition: data.condition, location: data.location, price: Number(data.price), description: data.description, image, requestCollection: Boolean(form.requestCollection?.checked) } });
      showToast(t('catch_added'));
      await Promise.all([loadFresh(), loadRoleData()]);
      state.ordersTab = 'listings';
      navigate('orders');
      renderRoute();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function handleOrderSubmit(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    try {
      const result = await api('/api/orders', { method: 'POST', body: { items: [{ listingId: Number(data.listingId), quantity: Number(data.quantity) }], deliveryLocation: data.deliveryLocation } });
      closeModal();
      await Promise.all([loadFresh(), loadRoleData(), loadOrders(), loadPayments()]);
      showToast(`${t('order_created')} #${result.orderId}`);
      navigate('orders');
      renderRoute();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function handleBulkOrderSubmit(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const rows = bulkItems();
    if (!rows.length) return showToast(t('bulk_empty'), 'error');
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    try {
      const result = await api('/api/orders', { method: 'POST', body: { items: rows.map((row) => ({ listingId: Number(row.listing.id), quantity: Number(row.quantity) })), deliveryLocation: data.deliveryLocation } });
      state.bulk.clear();
      closeModal();
      await Promise.all([loadFresh(), loadRoleData(), loadOrders(), loadPayments()]);
      showToast(`${t('order_created')} #${result.orderId}`);
      navigate('orders');
      renderRoute();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function handleWasteSubmit(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const file = form.querySelector('input[name="image"]')?.files?.[0];
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    try {
      const image = await fileToDataUrl(file);
      const payload = {
        material_type: data.species || 'Fish by-product',
        species_name: data.species || '',
        category: (String(data.category || 'fishmeal').toLowerCase().replace(/\s+/g, '_').replace('organic_', '')),
        quantity_kg: Number(data.quantity),
        condition: 'Non-food-grade',
        collection_location: data.location || (state.user?.location || 'Mangaluru'),
        photo_url: image,
        notes: data.description || ''
      };
      try {
        await api('/waste/listings', { method: 'POST', body: payload });
      } catch (e) {
        const msg = String(e && e.message || '').toLowerCase();
        if (msg.includes('cannot post') || msg.includes('not found') || msg.includes('405')) {
          await api('/api/listings', { method: 'POST', body: {
            type: 'waste',
            species: payload.species_name || payload.material_type,
            quantity: payload.quantity_kg,
            price: 0,
            location: payload.collection_location,
            image: payload.photo_url,
            description: payload.notes,
            category: payload.category,
            condition: payload.condition
          } });
        } else {
          throw e;
        }
      }
      closeModal();
      await Promise.all([loadWaste(), loadRoleData(), loadWasteRequests()]);
      showToast(t('material_registered'));
      renderRoute();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function handleWasteRequestSubmit(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    try {
      await api('/api/waste/requests', { method: 'POST', body: { listingId: Number(data.listingId), quantity: Number(data.quantity), scheduledAt: data.scheduledAt, notes: data.notes, transporter: data.transporter } });
      closeModal();
      await Promise.all([loadWaste(), loadWasteRequests(), loadLogistics(), loadRoleData()]);
      showToast(t('waste_requested'));
      navigate('logistics');
      renderRoute();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function handleProfileSubmit(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const result = await api('/api/me', { method: 'PATCH', body: data });
      state.user = result.user;
      state.lang = result.user.language || state.lang;
      localStorage.setItem('tm_lang', state.lang);
      showToast(t('profile_updated'));
      renderRoute();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function handleContactSubmit(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const result = await api('/api/contact', { method: 'POST', body: data });
      form.reset();
      showToast(result.message || t('send_enquiry'));
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function handleWhatsAppSubmit(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    try {
      const result = await api('/api/webhooks/whatsapp', { method: 'POST', body: { phone: data.phone, message: data.message } });
      const box = $('#whatsappResult');
      if (box) {
        box.innerHTML = `${icon('spark')}<span>${esc(result.confirmation || result.status || '')}</span>`;
        hydrateIcons(box);
      }
      await Promise.all([loadFresh(), loadRoleData()]);
      showToast(result.status === 'listing_created' ? t('catch_added') : (result.confirmation || result.status || t('status_updated')));
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function handleAdminPriceSubmit(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      await api('/api/market-prices', { method: 'POST', body: { species: data.species, price: Number(data.price) } });
      state.prices = (await api('/api/market-prices')).prices || [];
      await loadRoleData();
      showToast(t('save_price'));
      renderRoute();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function updateOrderStatus(id, status) {
    try {
      await api(`/api/orders/${id}/status`, { method: 'PATCH', body: { status } });
      await Promise.all([loadRoleData(), loadOrders(), loadPayments(), loadLogistics()]);
      showToast(t('order_status_updated'));
      closeModal();
      renderRoute();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function updateWasteStatus(id, status) {
    try {
      await api(`/api/waste/requests/${id}`, { method: 'PATCH', body: { status } });
      await Promise.all([loadWasteRequests(), loadLogistics(), loadRoleData()]);
      showToast(t('status_updated'));
      renderRoute();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function updateLogisticsStatus(id, status) {
    try {
      await api(`/api/logistics/${id}`, { method: 'PATCH', body: { status } });
      await Promise.all([loadLogistics(), loadRoleData()]);
      showToast(t('status_updated'));
      renderRoute();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function updateUserRole(id, role) {
    try {
      await api(`/api/users/${id}`, { method: 'PATCH', body: { role } });
      await loadRoleData();
      showToast(t('status_updated'));
      renderRoute();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function updateListingApproval(id, approve) {
    const listing = [...(state.roleData?.listings || []), ...state.fresh, ...state.waste].find((row) => Number(row.id) === Number(id));
    try {
      await api(`/api/listings/${id}`, { method: 'PATCH', body: { status: approve ? (listing?.type === 'waste' ? 'approved' : 'available') : 'rejected', verified: approve } });
      await Promise.all([loadFresh(), loadWaste(), loadRoleData()]);
      showToast(t('status_updated'));
      renderRoute();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function markPaid(id) {
    try {
      await api(`/api/payments/${id}`, { method: 'PATCH', body: { status: 'Paid' } });
      await Promise.all([loadPayments(), loadRoleData()]);
      showToast(t('payment_marked'));
      renderRoute();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function markListingSold(id) {
    try {
      await api(`/api/listings/${id}`, { method: 'PATCH', body: { status: 'sold' } });
      await Promise.all([loadFresh(), loadRoleData()]);
      showToast(t('listing_updated'));
      renderRoute();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function deleteListing(id) {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await api(`/api/listings/${id}`, { method: 'DELETE' });
      await Promise.all([loadFresh(), loadWaste(), loadRoleData()]);
      showToast(t('listing_deleted'));
      renderRoute();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  function addBulk(id) {
    if (!state.user) return openAuth('login', 'buyer');
    if (!canOrder()) return showToast(t('buyer_order_note'), 'error');
    const listing = listingById(id);
    if (!listing) return;
    if (!state.bulk.has(String(id))) state.bulk.set(String(id), Math.min(50, Number(listing.quantity_kg)));
    showToast(t('added_to_bulk'));
    if (state.screen === 'marketplace') {
      $('#freshGrid').innerHTML = marketCards();
      $('#bulkPanel').innerHTML = bulkPanel();
      hydrateIcons($('#freshGrid'));
      hydrateIcons($('#bulkPanel'));
    }
  }

  function removeBulk(id) {
    state.bulk.delete(String(id));
    if (state.screen === 'marketplace') {
      $('#freshGrid').innerHTML = marketCards();
      $('#bulkPanel').innerHTML = bulkPanel();
      hydrateIcons($('#freshGrid'));
      hydrateIcons($('#bulkPanel'));
    } else {
      renderRoute();
    }
  }

  function clearBulk() {
    state.bulk.clear();
    renderRoute();
  }

  function setLanguage(lang) {
    state.lang = lang;
    localStorage.setItem('tm_lang', lang);
    if (state.user) api('/api/me', { method: 'PATCH', body: { language: lang } }).then((result) => { state.user = result.user; }).catch(() => {});
    renderChrome();
    renderRoute();
  }

  function pref(key, fallback = true) {
    const value = localStorage.getItem(`tm_pref_${key}`);
    return value === null ? fallback : value === '1';
  }

  function setPref(key, value) {
    localStorage.setItem(`tm_pref_${key}`, value ? '1' : '0');
  }

  function logout() {
    api('/api/logout', { method: 'POST' }).catch(() => {});
    state.user = null;
    state.roleData = null;
    state.orders = [];
    state.payments = [];
    state.logistics = [];
    state.wasteRequests = [];
    state.bulk.clear();
    state.ordersTab = '';
    closeModal();
    showToast(t('logged_out'));
    navigate('dashboard');
    renderRoute();
  }

  function renderSearchSuggestions(query) {
    const box = $('#searchSuggestions');
    const term = query.trim().toLowerCase();
    if (!box) return;
    if (term.length < 2) {
      box.classList.remove('open');
      box.innerHTML = '';
      return;
    }
    const fish = state.fresh.filter((listing) => [listing.species, listing.local_name, listing.location, listing.seller_name].some((value) => String(value || '').toLowerCase().includes(term))).slice(0, 4);
    const partners = state.partners.filter((partner) => [partner.name, partner.location, ...(partner.categories || [])].some((value) => String(value || '').toLowerCase().includes(term))).slice(0, 2);
    const rows = [
      ...fish.map((listing) => `<button class="suggestion" data-action="search-pick" data-q="${esc(listing.species)}" data-screen="marketplace"><img src="${esc(listing.image)}" alt=""><span><strong>${esc(listing.species)}</strong><small>${money(listing.price_per_kg)}${esc(t('per_kg'))} · ${esc(listing.location)}</small></span></button>`),
      ...partners.map((partner) => `<button class="suggestion" data-action="search-pick" data-q="${esc(partner.name)}" data-screen="processing"><span class="activity-icon">${icon('factory')}</span><span><strong>${esc(partner.name)}</strong><small>${esc(partner.location)} · ${esc(t('processing_partner'))}</small></span></button>`)
    ];
    box.innerHTML = rows.length ? rows.join('') : `<div class="suggestion-empty">${esc(t('no_results'))}</div>`;
    box.classList.add('open');
    hydrateIcons(box);
  }

  function initLogisticsMap() {
    const element = $('#logisticsMap');
    if (!element || !window.L) return;
    if (state.map) {
      state.map.remove();
      state.map = null;
    }
    const map = L.map(element, { zoomControl: true, scrollWheelZoom: false }).setView([12.9, 74.86], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
    state.mapData.forEach((marker) => {
      const kind = marker.type || 'collection';
      const html = `<div class="map-marker ${esc(kind)}">${kind === 'fisherman' ? 'F' : kind === 'buyer' ? 'B' : kind === 'processor' ? 'P' : 'C'}</div>`;
      L.marker([marker.lat, marker.lng], { icon: L.divIcon({ className: '', html, iconSize: [30, 30], iconAnchor: [15, 15] }) }).addTo(map).bindPopup(`<strong>${esc(marker.name)}</strong><br>${esc(marker.location)}`);
    });
    setTimeout(() => map.invalidateSize(), 120);
    state.map = map;
  }

  function barChart(series, options = {}) {
    const width = 560;
    const height = 190;
    const pad = { top: 16, right: 10, bottom: 26, left: 34 };
    const values = series.map((item) => Number(item.value || 0));
    const max = Math.max(1, ...values);
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const step = innerW / Math.max(1, series.length);
    const bars = series.map((item, index) => {
      const barH = (Number(item.value || 0) / max) * innerH;
      const x = pad.left + index * step + step * 0.22;
      const y = pad.top + innerH - barH;
      return `<rect class="chart-bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(8, step * 0.56).toFixed(1)}" height="${Math.max(2, barH).toFixed(1)}"></rect><text class="chart-label" x="${(x + step * 0.28).toFixed(1)}" y="${height - 8}" text-anchor="middle">${esc(item.label)}</text>`;
    }).join('');
    const grid = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const y = pad.top + innerH - innerH * ratio;
      return `<line class="chart-grid" x1="${pad.left}" x2="${width - pad.right}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"></line>`;
    }).join('');
    return `<div class="chart"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(options.label || '')}"><defs><linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#10a39c"/><stop offset="100%" stop-color="#7edbd3"/></linearGradient></defs>${grid}${bars}</svg></div>`;
  }

  function lineChart(series) {
    const width = 560;
    const height = 190;
    const pad = { top: 16, right: 12, bottom: 26, left: 34 };
    const values = series.map((item) => Number(item.value || 0));
    const max = Math.max(1, ...values);
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const points = series.map((item, index) => {
      const x = pad.left + (index / Math.max(1, series.length - 1)) * innerW;
      const y = pad.top + innerH - (Number(item.value || 0) / max) * innerH;
      return [x, y];
    });
    const line = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const area = `${line} L${points[points.length - 1]?.[0] || pad.left},${pad.top + innerH} L${points[0]?.[0] || pad.left},${pad.top + innerH} Z`;
    const dots = points.map(([x, y]) => `<circle class="chart-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2"></circle>`).join('');
    const labels = series.map((item, index) => {
      const x = pad.left + (index / Math.max(1, series.length - 1)) * innerW;
      return `<text class="chart-label" x="${x.toFixed(1)}" y="${height - 8}" text-anchor="middle">${esc(item.label)}</text>`;
    }).join('');
    return `<div class="chart"><svg viewBox="0 0 ${width} ${height}" role="img"><defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#10a39c" stop-opacity=".22"/><stop offset="100%" stop-color="#10a39c" stop-opacity="0"/></linearGradient></defs>${[0, 0.25, 0.5, 0.75, 1].map((ratio) => { const y = pad.top + innerH - innerH * ratio; return `<line class="chart-grid" x1="${pad.left}" x2="${width - pad.right}" y1="${y}" y2="${y}"></line>`; }).join('')}<path class="chart-area" d="${area}"></path><path class="chart-line" d="${line}"></path>${dots}${labels}</svg></div>`;
  }

  function donutChart(series) {
    const total = series.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const colors = ['#0b8f8a', '#2477c9', '#d9822b', '#7a67c7', '#0f9f6e', '#d64b4b'];
    let offset = 0;
    const circles = series.map((item, index) => {
      const ratio = total ? Number(item.value || 0) / total : 0;
      const dash = ratio * 251.2;
      const circle = `<circle cx="70" cy="70" r="40" fill="none" stroke="${colors[index % colors.length]}" stroke-width="18" stroke-dasharray="${dash.toFixed(1)} ${(251.2 - dash).toFixed(1)}" stroke-dashoffset="${(-offset).toFixed(1)}" transform="rotate(-90 70 70)"></circle>`;
      offset += dash;
      return circle;
    }).join('');
    const legend = series.map((item, index) => `<div class="donut-legend-row"><span><i style="background:${colors[index % colors.length]}"></i>${esc(item.label)}</span><strong>${num(item.value)}</strong></div>`).join('');
    return `<div class="donut-wrap"><div class="donut"><svg viewBox="0 0 140 140">${circles}<text x="70" y="68" text-anchor="middle" class="donut-total">${num(total)}</text><text x="70" y="82" text-anchor="middle" class="donut-caption">${esc(t('total'))}</text></svg></div><div class="donut-legend">${legend || `<span class="muted small">${esc(t('no_data'))}</span>`}</div></div>`;
  }

  function emptyState(iconName, title, text = '') {
    return `<div class="empty-state"><div><span data-icon="${esc(iconName)}"></span><strong>${esc(title)}</strong><p>${esc(text)}</p></div></div>`;
  }

  function accessCard(title, text, role = 'fisherman', mode = 'login') {
    return `<div class="card access-card"><span class="access-icon">${icon('lock')}</span><h2>${esc(title)}</h2><p>${esc(text)}</p><div class="access-actions"><button class="btn btn-primary" data-action="open-auth" data-mode="${mode}" data-role="${esc(role)}">${esc(mode === 'register' ? t('create_account') : t('login'))}</button><button class="btn" data-action="open-register" data-role="${esc(role)}">${esc(t('register'))}</button></div><div class="demo-row"><button class="demo-pill" data-action="demo-login" data-email="ravi@demo.in" data-password="fish123">${esc(t('role_fisherman'))}</button><button class="demo-pill" data-action="demo-login" data-email="buyer@demo.in" data-password="buyer123">${esc(t('role_buyer'))}</button><button class="demo-pill" data-action="demo-login" data-email="processor@demo.in" data-password="process123">${esc(t('role_processor'))}</button><button class="demo-pill" data-action="demo-login" data-email="admin@trimatsya.in" data-password="admin123">${esc(t('role_admin'))}</button></div></div>`;
  }

  function screenHead(kicker, title, subtitle, actions = '') {
    return `<div class="screen-head"><div>${kicker ? `<span class="eyebrow">${esc(kicker)}</span>` : ''}<h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${actions ? `<div class="screen-actions">${actions}</div>` : ''}</div>`;
  }

  function kpiCard(label, value, foot, iconName, accent = false) {
    return `<article class="kpi-card ${accent ? 'accent' : ''}"><div class="kpi-top"><span class="kpi-icon">${icon(iconName)}</span><span class="kpi-label">${esc(label)}</span></div><div class="kpi-value">${value}</div><div class="kpi-foot">${esc(foot)}</div></article>`;
  }

  function dashboardKpis() {
    const role = state.user?.role;
    const rd = state.roleData || {};
    const admin = rd.stats || {};
    const freshCount = state.fresh.filter((listing) => listing.status === 'available').length;
    if (role === 'admin') {
      const activeOrders = (rd.orders || []).filter((order) => !['Delivered', 'Cancelled'].includes(order.status)).length;
      return [
        kpiCard(t('available_fish_listings'), num(admin.listings || 0), `${num(admin.fishSold || 0)} kg ${t('fishSold') !== 'fishSold' ? t('fishSold') : 'sold'}`, 'store', true),
        kpiCard(t('active_orders'), num(activeOrders), `${num(admin.orders || 0)} ${t('total') || 'total'}`, 'receipt'),
        kpiCard(t('platform_revenue'), money(admin.revenue || 0), `${t('gross_value') || 'Gross'} ${money(admin.grossTradeValue || 0)}`, 'wallet'),
        kpiCard(t('waste_recovered'), `${num(admin.wasteCollected || 0)} kg`, `${num(admin.wasteRequested || 0)} kg requested`, 'recycle')
      ];
    }
    if (role === 'fisherman') {
      const orders = rd.orders || [];
      return [
        kpiCard(t('available_fish_listings'), num(rd.stats?.activeListings || 0), `${num(rd.stats?.totalQuantitySoldKg || 0)} kg sold`, 'fish', true),
        kpiCard(t('active_orders'), num(orders.filter((order) => !['Delivered', 'Cancelled'].includes(order.status)).length), `${num(rd.stats?.collections || 0)} collections`, 'receipt'),
        kpiCard(t('total_earnings'), money(rd.stats?.paid || rd.stats?.expected || 0), `${money(rd.stats?.pendingAmount || 0)} pending`, 'wallet'),
        kpiCard(t('waste_recovered'), `${num(wasteRecovered())} kg`, t('waste_collected'), 'recycle')
      ];
    }
    if (role === 'buyer') {
      return [
        kpiCard(t('available_fish_listings'), num(freshCount), t('verified_listings'), 'store', true),
        kpiCard(t('active_orders'), num(rd.stats?.openOrders || 0), `${num(rd.stats?.orderCount || 0)} ${t('total') || 'total'}`, 'receipt'),
        kpiCard(t('total_spend'), money(rd.stats?.spent || 0), `${num(rd.stats?.totalQuantityKg || 0)} kg procured`, 'wallet'),
        kpiCard(t('waste_recovered'), `${num(wasteRecovered())} kg`, t('waste_collected'), 'recycle')
      ];
    }
    if (role === 'processor') {
      return [
        kpiCard(t('available_materials'), num(rd.stats?.availableMaterials || 0), `${num(rd.stats?.totalRequestedKg || 0)} kg requested`, 'recycle', true),
        kpiCard(t('active_requests'), num(activeWasteRequests().length), t('requests_in_progress'), 'receipt'),
        kpiCard(t('deliveries_done'), num(rd.stats?.deliveries || 0), `${num(rd.stats?.totalDeliveredKg || 0)} kg delivered`, 'truck'),
        kpiCard(t('waste_recovered'), `${num(wasteRecovered())} kg`, t('waste_collected'), 'leaf')
      ];
    }
    return [
      kpiCard(t('available_fish_listings'), num(freshCount), t('verified_listings'), 'store', true),
      kpiCard(t('active_orders'), '0', t('sign_in_for_orders'), 'receipt'),
      kpiCard(t('total_earnings'), money(0), t('sign_in_for_earnings'), 'wallet'),
      kpiCard(t('waste_recovered'), `${num(wasteRecovered())} kg`, t('available_materials'), 'recycle')
    ];
  }

  function monthlySeries(rows, valueFn) {
    const map = {};
    rows.forEach((row) => {
      const key = monthKey(row.created_at || row.order_date);
      if (!key) return;
      map[key] = (map[key] || 0) + Number(valueFn(row) || 0);
    });
    return lastMonths(6).map((key) => ({ label: monthLabel(key), value: map[key] || 0 }));
  }

  function dashboardSeries() {
    const role = state.user?.role;
    if (role === 'admin') {
      return (state.roleData?.charts?.revenue || []).map((row) => ({ label: monthLabel(row.month), value: Number(row.value || 0) }));
    }
    if (role === 'fisherman') return monthlySeries(state.roleData?.payments || state.payments, (row) => row.amount);
    if (role === 'buyer') return monthlySeries(state.roleData?.orders || state.orders, (row) => row.total_amount);
    if (role === 'processor') return monthlySeries(state.wasteRequests, () => 1);
    return [];
  }

  function dashboardChart() {
    const series = dashboardSeries();
    const hasValues = series.some((item) => Number(item.value) > 0);
    if (!hasValues) return emptyState('chart', t('no_data'), t('login_for_analytics'));
    return barChart(series, { label: t('monthly_earnings') });
  }

  function availableFishMini() {
    const rows = state.fresh.filter((listing) => listing.status === 'available').slice(0, 4);
    if (!rows.length) return emptyState('fish', t('no_results'), t('check_back_later'));
    return `<div class="mini-fish-grid">${rows.map((listing) => `<div class="mini-fish"><img src="${esc(listing.image)}" alt="${esc(listing.species)}"><div><strong>${esc(listing.species)}</strong><small>${esc(listing.location)}</small></div><span class="price">${money(listing.price_per_kg)}</span></div>`).join('')}</div>`;
  }

  function priceList(limit = 7) {
    if (!state.prices.length) return emptyState('trend', t('no_data'), '');
    return `<div class="price-list">${state.prices.slice(0, limit).map((price) => `<div class="price-row"><img src="${esc(SPECIES_IMAGE(price.species))}" alt="${esc(price.species)}"><div class="price-name"><strong>${esc(price.species)}</strong><small>${esc(price.local_name || '')}</small></div><span class="price-value">${money(price.price_per_kg)}</span><span class="price-trend"><svg viewBox="0 0 36 16"><path d="M2 12l7-5 6 3 7-7 6 3 6-4"></path></svg></span></div>`).join('')}</div>`;
  }

  function SPECIES_IMAGE(species) {
    const listing = [...state.fresh, ...state.waste].find((row) => row.species === species);
    return listing?.image || '/images/fish-market-vizag.jpg';
  }

  function activityList() {
    if (!state.notifications.length) return emptyState('bell', t('no_activity'), t('activity_hint'));
    return `<div class="activity-list">${state.notifications.slice(0, 5).map((item) => `<div class="activity-row"><span class="activity-icon">${icon(item.icon)}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.detail)}</small></div><span class="activity-time">${esc(timeAgo(item.date))}</span></div>`).join('')}</div>`;
  }

  function renderDashboard() {
    const user = state.user;
    const name = user ? String(user.name).split(' ')[0] : '';
    const title = user ? `${t('welcome_back')}, ${name}` : t('platform_overview');
    const subtitle = user ? t(`dashboard_subtitle_${user.role}`) : t('guest_dashboard_subtitle');
    const actions = user
      ? `<button class="btn btn-primary" data-nav="${user.role === 'processor' ? 'waste' : 'marketplace'}">${icon(user.role === 'processor' ? 'recycle' : 'store')}${esc(user.role === 'processor' ? t('browse_materials') : t('browse_marketplace'))}</button><button class="btn" data-nav="${user.role === 'fisherman' ? 'add-catch' : 'analytics'}">${icon(user.role === 'fisherman' ? 'plus' : 'chart')}${esc(user.role === 'fisherman' ? t('add_your_catch') : t('view_analytics'))}</button>`
      : `<button class="btn btn-primary" data-nav="marketplace">${icon('store')}${esc(t('browse_marketplace'))}</button><button class="btn" data-action="open-auth" data-mode="register" data-role="fisherman">${icon('plus')}${esc(t('join_as_fisherman'))}</button>`;
    const recent = user?.role === 'processor'
      ? `<div class="card"><div class="card-head"><h2>${esc(t('collection_requests'))}</h2><button class="card-link" data-nav="waste">${esc(t('view_all'))}</button></div>${wasteRequestTable(state.wasteRequests, 5)}</div>`
      : `<div class="card"><div class="card-head"><h2>${esc(t('recent_orders'))}</h2><button class="card-link" data-nav="orders">${esc(t('view_all'))}</button></div>${user ? orderTable(dashboardOrders(), 5) : emptyState('receipt', t('login_to_view_orders'), t('login_to_view_orders_text'))}</div>`;
    return `<div class="screen-inner">
      ${screenHead(t('dashboard_kicker'), title, subtitle, actions)}
      <div class="kpi-grid">${dashboardKpis().join('')}</div>
      <div class="dashboard-grid">
        <div class="stack">
          ${recent}
          <div class="card"><div class="card-head"><h2>${esc(t('monthly_earnings'))}</h2><span class="small muted">${esc(t('last_six_months'))}</span></div><div class="card-body">${dashboardChart()}</div></div>
        </div>
        <div class="stack">
          <div class="card"><div class="card-head"><h2>${esc(t('market_price_overview'))}</h2><span class="badge teal">${esc(t('live'))}</span></div><div class="card-body">${priceList(5)}</div></div>
          <div class="card"><div class="card-head"><h2>${esc(t('available_fish'))}</h2><button class="card-link" data-nav="marketplace">${esc(t('view_all'))}</button></div><div class="card-body">${availableFishMini()}</div></div>
          <div class="card"><div class="card-head"><h2>${esc(t('recent_activities'))}</h2></div><div class="card-body">${activityList()}</div></div>
        </div>
      </div>
    </div>`;
  }

  function option(value, label, selected) {
    return `<option value="${esc(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${esc(label)}</option>`;
  }

  function productCard(listing) {
    const owned = state.user?.id === listing.user_id;
    const bulkButton = canOrder() ? `<button class="btn btn-soft btn-sm" data-action="add-bulk" data-id="${esc(listing.id)}">${esc(t('add'))}</button>` : '';
    return `<article class="product-card">
      <div class="product-media">
        <img src="${esc(listing.image)}" alt="${esc(listing.species)}" loading="lazy">
        <span class="product-badge">${listing.verified ? `<span class="badge green">${esc(t('verified'))}</span>` : `<span class="badge orange">${esc(t('in_inspection'))}</span>`}</span>
        <span class="product-price">${money(listing.price_per_kg)}${esc(t('per_kg'))}</span>
      </div>
      <div class="product-body">
        <div class="product-title"><div><h3>${esc(listing.species)}</h3><small>${esc(listing.local_name || listing.item_condition)}</small></div>${owned ? `<span class="badge teal">${esc(t('your_listing'))}</span>` : ''}</div>
        <div class="product-meta"><span>${icon('pin')}${esc(listing.location)}</span><span>${icon('user')}${esc(listing.seller_name)}</span><span>${icon('shield')}${esc(listing.item_condition)}</span></div>
        <div class="product-foot"><span class="product-qty">${num(listing.quantity_kg)} kg ${esc(t('available'))}</span><div class="product-actions"><button class="btn btn-sm" data-action="view-listing" data-id="${esc(listing.id)}">${esc(t('view_details'))}</button>${bulkButton}<button class="btn btn-primary btn-sm" data-action="order-listing" data-id="${esc(listing.id)}">${esc(t('order'))}</button></div></div>
      </div>
    </article>`;
  }

  function marketCards() {
    const rows = filteredFresh();
    return rows.length ? rows.map(productCard).join('') : emptyState('search', t('no_results'), t('adjust_filters'));
  }

  function bulkPanel() {
    if (!state.user || !canOrder()) return '';
    const rows = bulkItems();
    if (!rows.length) return '';
    const quantity = rows.reduce((sum, row) => sum + Number(row.quantity), 0);
    return `<section class="card" style="margin-top:16px"><div class="card-head"><div><h2>${esc(t('bulk_procurement'))}</h2><p>${rows.length} ${esc(t('suppliers_selected'))} · ${num(quantity)} kg</p></div><div class="screen-actions"><button class="btn btn-ghost btn-sm" data-action="clear-bulk">${esc(t('clear_bulk'))}</button><button class="btn btn-primary btn-sm" data-action="place-bulk">${icon('cart')}${esc(t('place_bulk_order'))}</button></div></div><div class="table-wrap"><table><thead><tr><th>${esc(t('fish'))}</th><th>${esc(t('seller'))}</th><th>${esc(t('quantity'))}</th><th>${esc(t('price'))}</th><th></th></tr></thead><tbody>${rows.map(({ listing, quantity: qty }) => `<tr><td><div class="table-main"><img class="table-thumb" src="${esc(listing.image)}" alt=""><strong>${esc(listing.species)}</strong></div></td><td>${esc(listing.seller_name)}</td><td>${num(qty)} kg</td><td>${money(listing.price_per_kg)}${esc(t('per_kg'))}</td><td class="text-right"><button class="btn btn-ghost btn-sm" data-action="remove-bulk" data-id="${esc(listing.id)}">${esc(t('remove'))}</button></td></tr>`).join('')}</tbody></table></div></section>`;
  }

  function renderMarketResults() {
    const count = $('#marketCount');
    if (count) count.textContent = filteredFresh().length;
    const grid = $('#freshGrid');
    if (grid) {
      grid.innerHTML = marketCards();
      hydrateIcons(grid);
    }
  }

  function renderMarketplace() {
    const species = [...new Set(state.fresh.map((listing) => listing.species))].sort();
    const locations = [...new Set(state.fresh.map((listing) => listing.location))].sort();
    const actions = canListCatch() ? `<button class="btn btn-primary" data-nav="add-catch">${icon('plus')}${esc(t('add_catch'))}</button>` : `<button class="btn" data-action="open-auth" data-mode="register" data-role="buyer">${icon('briefcase')}${esc(t('register_business'))}</button>`;
    return `<div class="screen-inner">
      ${screenHead(t('marketplace_kicker'), t('fish_marketplace'), t('marketplace_subtitle'), actions)}
      <div class="filter-bar card">
        <label class="filter-search">${icon('search')}<input id="marketSearch" type="search" value="${esc(state.filters.q)}" placeholder="${esc(t('search_market'))}" aria-label="${esc(t('search'))}"></label>
        <select id="speciesFilter" aria-label="${esc(t('species'))}">${option('', t('all_species'), state.filters.species)}${species.map((item) => option(item, item, state.filters.species)).join('')}</select>
        <select id="locationFilter" aria-label="${esc(t('location'))}">${option('', t('all_locations'), state.filters.location)}${locations.map((item) => option(item, item, state.filters.location)).join('')}</select>
        <select id="qualityFilter" aria-label="${esc(t('quality'))}">${option('', t('all_quality'), state.filters.quality)}${option('verified', t('verified_only'), state.filters.quality)}${option('fresh', t('fresh'), state.filters.quality)}${option('chilled', t('chilled'), state.filters.quality)}</select>
        <select id="sortFilter" aria-label="${esc(t('sort_by'))}">${option('new', t('sort_new'), state.filters.sort)}${option('price-asc', t('sort_price_low'), state.filters.sort)}${option('price-desc', t('sort_price_high'), state.filters.sort)}${option('quantity', t('sort_quantity'), state.filters.sort)}</select>
        <button class="btn btn-soft btn-sm" data-action="clear-filters">${esc(t('clear_filters'))}</button>
      </div>
      <p class="filter-count"><strong id="marketCount">${filteredFresh().length}</strong> ${esc(t('available_listings'))}</p>
      <div class="product-grid" id="freshGrid">${marketCards()}</div>
      <div id="bulkPanel">${bulkPanel()}</div>
    </div>`;
  }

  function renderAddCatch() {
    if (!canListCatch()) {
      return `<div class="screen-inner">${screenHead(t('catch_kicker'), t('add_catch'), t('add_catch_subtitle'))}${accessCard(t('fisherman_only'), t('fisherman_only_text'), 'fisherman', 'register')}</div>`;
    }
    const species = ['Mackerel', 'Sardines', 'Seer Fish', 'Pomfret', 'Prawns', 'Tuna', 'Anchovies'];
    return `<div class="screen-inner">
      ${screenHead(t('catch_kicker'), t('add_catch'), t('add_catch_subtitle'))}
      <div class="dashboard-grid">
        <section class="card form-card">
          <div class="card-head"><div><h2>${esc(t('catch_details'))}</h2><p>${esc(t('catch_form_hint'))}</p></div><span class="badge teal">${esc(t('fresh_only'))}</span></div>
          <form id="catchForm" class="card-body">
            <div class="form-grid">
              <label class="field"><span>${esc(t('species'))}</span><select name="species" id="catchSpecies">${species.map((item) => option(item, translated(`sp_${item.replace(/ /g, '_')}`, item), 'Mackerel')).join('')}</select></label>
              <label class="field"><span>${esc(t('quantity_kg'))}</span><input name="quantity" id="catchQuantity" type="number" min="1" step="1" placeholder="50" required></label>
              <label class="field"><span>${esc(t('condition'))}</span><select name="condition"><option>${esc(t('fresh'))}</option><option>${esc(t('chilled'))}</option><option>${esc(t('ice_packed'))}</option></select></label>
              <label class="field"><span>${esc(t('fishing_location'))}</span><input name="location" value="${esc(state.user.location || 'Mangaluru Harbour')}" required></label>
              <label class="field"><span>${esc(t('expected_price'))}</span><input name="price" id="catchPrice" type="number" min="0" step="1" placeholder="170" required></label>
              <label class="field"><span>${esc(t('photograph'))}</span><div class="file-field"><img id="catchPreview" class="file-preview hidden" alt=""><input name="image" id="catchImage" type="file" accept="image/*"></div></label>
              <label class="field full"><span>${esc(t('notes'))}</span><textarea name="description" rows="3" placeholder="${esc(t('catch_notes_hint'))}"></textarea></label>
            </div>
            <label class="checkline"><input type="checkbox" name="requestCollection" checked><span>${esc(t('request_collection'))}</span></label>
            <div class="form-note" id="catchEstimate">${esc(t('price_estimate_hint'))}</div>
            <div class="form-actions"><button class="btn btn-primary" type="submit">${icon('upload')}${esc(t('submit_catch'))}</button><button class="btn" type="reset">${esc(t('clear'))}</button></div>
          </form>
        </section>
        <div class="stack">
          <section class="card"><div class="card-head"><h2>${esc(t('todays_rates'))}</h2><span class="badge teal">${esc(t('live'))}</span></div><div class="card-body">${priceList(7)}</div></section>
          <section class="card"><div class="card-head"><h2>${esc(t('listing_checklist'))}</h2></div><div class="card-body"><div class="activity-list">${[t('checklist_1'), t('checklist_2'), t('checklist_3'), t('checklist_4')].map((text, index) => `<div class="activity-row"><span class="activity-icon">${icon(index === 0 ? 'camera' : index === 1 ? 'shield' : index === 2 ? 'pin' : 'rupee')}</span><div><strong>${esc(text)}</strong><small>${esc(t('checklist_hint'))}</small></div></div>`).join('')}</div></div></section>
        </div>
      </div>
    </div>`;
  }

  function myListingsTable(listings) {
    if (!listings.length) return emptyState('fish', t('no_listings'), t('add_first_catch'));
    return `<div class="table-wrap"><table><thead><tr><th>${esc(t('fish'))}</th><th>${esc(t('quantity'))}</th><th>${esc(t('price'))}</th><th>${esc(t('status'))}</th><th></th></tr></thead><tbody>${listings.map((listing) => `<tr><td><div class="table-main"><img class="table-thumb" src="${esc(listing.image)}" alt=""><div><strong>${esc(listing.species)}</strong><small>${esc(listing.location)}</small></div></div></td><td>${num(listing.quantity_kg)} kg</td><td>${money(listing.price_per_kg)}${esc(t('per_kg'))}</td><td>${badge(listing.status)}</td><td class="text-right"><button class="btn btn-ghost btn-sm" data-action="mark-sold" data-id="${esc(listing.id)}">${esc(t('mark_sold'))}</button><button class="btn btn-ghost btn-sm" data-action="delete-listing" data-id="${esc(listing.id)}">${esc(t('delete'))}</button></td></tr>`).join('')}</tbody></table></div>`;
  }

  function renderOrders() {
    if (!state.user) return `<div class="screen-inner">${screenHead(t('orders_kicker'), t('my_orders'), t('orders_subtitle'))}${accessCard(t('login_to_view_orders'), t('login_to_view_orders_text'), 'buyer', 'login')}</div>`;
    const role = state.user.role;
    const tabs = role === 'fisherman'
      ? [{ id: 'incoming', label: t('incoming_orders') }, { id: 'listings', label: t('my_listings') }]
      : role === 'buyer'
        ? [{ id: 'orders', label: t('orders') }, { id: 'bulk', label: t('bulk_procurement') }, { id: 'history', label: t('purchase_history') }, { id: 'invoices', label: t('invoices') }]
        : role === 'processor'
          ? [{ id: 'requests', label: t('collection_requests') }, { id: 'materials', label: t('available_materials') }]
          : [{ id: 'orders', label: t('orders') }, { id: 'invoices', label: t('invoices') }];
    if (!tabs.some((tab) => tab.id === state.ordersTab)) state.ordersTab = tabs[0].id;
    let content = '';
    if (role === 'fisherman' && state.ordersTab === 'incoming') content = `<div class="card">${orderTable(dashboardOrders())}</div>`;
    if (role === 'fisherman' && state.ordersTab === 'listings') content = `<div class="card">${myListingsTable(state.roleData?.listings || [])}</div>`;
    if (role === 'buyer' && state.ordersTab === 'orders') content = `<div class="card">${orderTable(state.orders)}</div>`;
    if (role === 'buyer' && state.ordersTab === 'bulk') content = bulkPanel() || emptyState('cart', t('bulk_empty'), t('bulk_empty_hint'));
    if (role === 'buyer' && state.ordersTab === 'history') content = `<div class="card">${orderTable(state.orders.filter((order) => order.status === 'Delivered'))}</div>`;
    if (role === 'buyer' && state.ordersTab === 'invoices') content = `<div class="card">${orderTable(state.orders)}</div>`;
    if (role === 'processor' && state.ordersTab === 'requests') content = `<div class="card">${wasteRequestTable(state.wasteRequests)}</div>`;
    if (role === 'processor' && state.ordersTab === 'materials') content = `<div class="product-grid">${state.waste.filter((listing) => listing.status === 'approved').slice(0, 8).map(wasteCard).join('') || emptyState('recycle', t('no_waste'), '')}</div>`;
    if (role === 'admin' && state.ordersTab === 'orders') content = `<div class="card">${orderTable(state.roleData?.orders || state.orders, 30)}</div>`;
    if (role === 'admin' && state.ordersTab === 'invoices') content = `<div class="card">${orderTable(state.roleData?.orders || state.orders, 30)}</div>`;
    const actions = role === 'fisherman' ? `<button class="btn btn-primary" data-nav="add-catch">${icon('plus')}${esc(t('add_catch'))}</button>` : role === 'buyer' ? `<button class="btn btn-primary" data-nav="marketplace">${icon('store')}${esc(t('browse_fish'))}</button>` : role === 'processor' ? `<button class="btn" data-nav="waste">${icon('recycle')}${esc(t('browse_materials'))}</button>` : `<button class="btn" data-action="refresh">${icon('refresh')}${esc(t('refresh'))}</button>`;
    return `<div class="screen-inner">${screenHead(t('orders_kicker'), t('my_orders'), t('orders_subtitle'), actions)}<div class="tabs" style="margin-bottom:14px">${tabs.map((tab) => `<button class="tab ${state.ordersTab === tab.id ? 'active' : ''}" data-action="orders-tab" data-tab="${tab.id}">${esc(tab.label)}</button>`).join('')}</div>${content}</div>`;
  }

  function wasteCard(listing) {
    const request = state.wasteRequests.find((row) => Number(row.listing_id) === Number(listing.id));
    const partner = request?.processor_name;
    const canRequest = canRequestWaste() && listing.status === 'approved';
    return `<article class="product-card waste-card">
      <div class="product-media"><img src="${esc(listing.image)}" alt="${esc(listing.category || listing.species)}" loading="lazy"><span class="product-badge"><span class="badge ${listing.status === 'approved' ? 'green' : 'orange'}">${esc(statusLabel(listing.status))}</span></span><span class="product-price">${listing.price_per_kg ? `${money(listing.price_per_kg)}${esc(t('per_kg'))}` : t('inspection_pending')}</span></div>
      <div class="product-body">
        <div class="product-title"><div><h3>${esc(listing.category || listing.species)}</h3><small>${esc(listing.species)} · ${esc(t('non_food_grade'))}</small></div></div>
        <div class="product-meta"><span>${icon('layers')}${num(listing.quantity_kg)} kg ${esc(t('available'))}</span><span>${icon('pin')}${esc(listing.location)}</span>${partner ? `<span>${icon('factory')}${esc(partner)}</span>` : `<span>${icon('shield')}${esc(t('awaiting_partner'))}</span>`}</div>
        <div class="product-foot"><span class="product-qty">${esc(listing.seller_name || '')}</span><div class="product-actions"><button class="btn btn-sm" data-action="view-listing" data-id="${esc(listing.id)}">${esc(t('details'))}</button>${canRequest ? `<button class="btn btn-primary btn-sm" data-action="request-waste" data-id="${esc(listing.id)}">${esc(t('request_collection'))}</button>` : ''}</div></div>
      </div>
    </article>`;
  }

  function wasteCategorySummary() {
    const categories = ['Fishmeal', 'Fish Oil', 'Organic Fertilizer', 'Biomedical Research'];
    return `<div class="activity-list">${categories.map((category) => {
      const rows = state.waste.filter((listing) => listing.category === category);
      const total = rows.reduce((sum, listing) => sum + Number(listing.quantity_kg || 0), 0);
      return `<div class="activity-row"><span class="activity-icon">${icon(category === 'Fishmeal' ? 'package' : category === 'Fish Oil' ? 'thermometer' : category === 'Organic Fertilizer' ? 'leaf' : 'shield')}</span><div><strong>${esc(category)}</strong><small>${rows.length} ${esc(t('listings'))} · ${num(total)} kg</small></div><span class="badge ${rows.length ? 'green' : 'outline'}">${rows.length}</span></div>`;
    }).join('')}</div>`;
  }

  function renderWaste() {
    const categories = ['Fishmeal', 'Fish Oil', 'Organic Fertilizer', 'Biomedical Research'];
    const actions = canListCatch() ? `<button class="btn btn-primary" data-action="register-waste">${icon('plus')}${esc(t('register_material'))}</button>` : canRequestWaste() ? `<button class="btn btn-primary" data-nav="marketplace">${icon('store')}${esc(t('browse_marketplace'))}</button>` : `<button class="btn" data-action="open-auth" data-mode="register" data-role="processor">${icon('factory')}${esc(t('register_processor'))}</button>`;
    return `<div class="screen-inner">
      ${screenHead(t('waste_kicker'), t('waste_management'), t('waste_subtitle'), actions)}
      <div class="safety-banner" style="margin-bottom:14px">${icon('shield')}<div><strong>${esc(t('waste_safety_title'))}</strong>${esc(t('waste_safety_short'))}</div></div>
      <div class="tabs" style="margin-bottom:14px">${[{ id: '', label: t('all') }, ...categories.map((item) => ({ id: item, label: item }))].map((tab) => `<button class="tab ${state.filters.wasteCategory === tab.id ? 'active' : ''}" data-action="waste-filter" data-category="${esc(tab.id)}">${esc(tab.label)}</button>`).join('')}</div>
      <div class="waste-layout">
        <div class="waste-category-grid">${filteredWaste().length ? filteredWaste().map(wasteCard).join('') : emptyState('recycle', t('no_waste'), t('waste_empty_hint'))}</div>
        <div class="stack">
          <div class="card"><div class="card-head"><h2>${esc(t('material_categories'))}</h2><span class="badge teal">${esc(t('non_food_grade'))}</span></div><div class="card-body">${wasteCategorySummary()}</div></div>
          ${state.user ? `<div class="card"><div class="card-head"><h2>${esc(t('collection_requests'))}</h2><button class="card-link" data-nav="logistics">${esc(t('track_collection'))}</button></div>${wasteRequestTable(state.wasteRequests, 5)}</div>` : `<div class="card"><div class="card-head"><h2>${esc(t('how_waste_works'))}</h2></div><div class="card-body"><div class="activity-list">${[t('waste_step_1'), t('waste_step_2'), t('waste_step_3')].map((text, index) => `<div class="activity-row"><span class="activity-icon">${icon(['camera', 'shield', 'truck'][index])}</span><div><strong>${esc(text)}</strong><small>${esc(t('waste_step_hint'))}</small></div></div>`).join('')}</div></div></div>`}
        </div>
      </div>
    </div>`;
  }

  function processingPartners() {
    if (state.partners.length) return state.partners;
    return state.mapData.filter((marker) => marker.type === 'processor').map((marker) => ({ id: marker.id, name: marker.name, location: marker.location, categories: [], request_count: 0, delivered_count: 0 }));
  }

  function partnerCard(partner) {
    return `<article class="card partner-card"><div class="partner-head"><span class="partner-logo">${esc(initials(partner.name))}</span><div><h3>${esc(partner.name)}</h3><p>${esc(partner.location || '')}</p></div></div><div class="partner-stats"><div><strong>${num(partner.request_count || 0)}</strong><small>${esc(t('requests'))}</small></div><div><strong>${num(partner.delivered_count || 0)}</strong><small>${esc(t('delivered'))}</small></div></div><div class="partner-tags">${(partner.categories || []).length ? partner.categories.map((category) => `<span class="badge outline">${esc(category)}</span>`).join('') : `<span class="badge outline">${esc(t('approved_materials'))}</span>`}</div><div class="partner-contact">${partner.email ? `<span>${icon('mail')}${esc(partner.email)}</span>` : ''}${partner.phone ? `<span>${icon('phone')}${esc(partner.phone)}</span>` : ''}</div></article>`;
  }

  function renderProcessing() {
    const partners = processingPartners();
    const rd = state.roleData || {};
    const processor = state.user?.role === 'processor';
    const actions = state.user ? `<button class="btn" data-nav="waste">${icon('recycle')}${esc(t('browse_materials'))}</button>` : `<button class="btn btn-primary" data-action="open-auth" data-mode="register" data-role="processor">${icon('factory')}${esc(t('register_processor'))}</button>`;
    return `<div class="screen-inner">
      ${screenHead(t('processing_kicker'), t('processing_partners'), t('processing_subtitle'), actions)}
      ${processor ? `<div class="kpi-grid">${[
        kpiCard(t('available_materials'), num(rd.stats?.availableMaterials || 0), t('approved_materials'), 'recycle', true),
        kpiCard(t('active_requests'), num(activeWasteRequests().length), t('requests_in_progress'), 'receipt'),
        kpiCard(t('deliveries_done'), num(rd.stats?.deliveries || 0), t('completed_deliveries'), 'truck'),
        kpiCard(t('partners'), num(rd.stats?.partners || partners.length), t('authorized_processors'), 'factory')
      ].join('')}</div>` : ''}
      <div class="partner-grid">${partners.length ? partners.map(partnerCard).join('') : emptyState('factory', t('no_partners'), t('partner_note'))}</div>
      <div class="grid-2" style="margin-top:16px">
        <div class="card"><div class="card-head"><h2>${esc(t('available_materials'))}</h2><button class="card-link" data-nav="waste">${esc(t('view_all'))}</button></div><div class="card-body">${state.waste.filter((listing) => listing.status === 'approved').slice(0, 4).map((listing) => `<div class="mini-fish"><img src="${esc(listing.image)}" alt="${esc(listing.category)}"><div><strong>${esc(listing.category)}</strong><small>${num(listing.quantity_kg)} kg · ${esc(listing.location)}</small></div><span class="price">${money(listing.price_per_kg)}</span></div>`).join('') || emptyState('recycle', t('no_waste'), '')}</div></div>
        <div class="card"><div class="card-head"><h2>${esc(t('collection_requests'))}</h2>${state.user ? `<button class="card-link" data-nav="orders">${esc(t('view_all'))}</button>` : ''}</div>${state.user ? wasteRequestTable(state.wasteRequests, 4) : emptyState('lock', t('login_to_view_requests'), t('processor_note'))}</div>
      </div>
    </div>`;
  }

  function logisticsRows() {
    const rows = state.logistics.filter((row) => row.type === state.logisticsTab);
    if (!rows.length) return `<tr><td colspan="7" class="table-empty">${esc(t('no_shipments'))}</td></tr>`;
    return rows.map((row) => `<tr><td><div class="table-main"><span class="activity-icon">${icon(row.type === 'waste' ? 'recycle' : 'truck')}</span><div><strong>#${esc(row.id)}</strong><small>${esc(dateShort(row.created_at))}</small></div></div></td><td>${esc(row.type === 'waste' ? t('fish_waste') : t('fresh_fish'))}</td><td>${esc(row.pickup_location)}</td><td>${esc(row.destination)}</td><td>${esc(row.transporter)}</td><td>${badge(row.status)}</td><td class="text-right">${state.user?.role === 'admin' ? `<select class="status-select" data-logistics-status="${esc(row.id)}">${orderStatusOptions(row.status)}</select>` : `<span class="small muted">${esc(statusLabel(row.status))}</span>`}</td></tr>`).join('');
  }

  function coldStorageCards() {
    const facilities = [
      { name: 'Baikampady Cold Chain', location: 'Baikampady', temperature: '-18°C to 0°C', capacity: '120 MT' },
      { name: 'Mangaluru Harbour Ice Plant', location: 'Mangaluru Harbour', temperature: '-5°C to 2°C', capacity: '45 MT' },
      { name: 'Kulai Aggregation Store', location: 'Kulai', temperature: '0°C to 4°C', capacity: '28 MT' }
    ];
    return `<div class="cold-grid">${facilities.map((facility) => `<div class="cold-card"><strong>${esc(facility.name)}</strong><small>${esc(facility.location)}</small><div class="cold-meta"><span>${icon('snow')} ${esc(facility.temperature)}</span><strong>${esc(facility.capacity)}</strong></div></div>`).join('')}</div>`;
  }

  function renderLogistics() {
    const inTransit = state.logistics.filter((row) => ['Picked up', 'In transit', 'Confirmed'].includes(row.status)).length;
    const delivered = state.logistics.filter((row) => row.status === 'Delivered').length;
    const actions = `<button class="btn" data-action="refresh">${icon('refresh')}${esc(t('refresh'))}</button>`;
    return `<div class="screen-inner">
      ${screenHead(t('logistics_kicker'), t('logistics'), t('logistics_subtitle'), actions)}
      ${state.user ? `<div class="kpi-grid">${[
        kpiCard(t('pickup_requests'), num(state.logistics.filter((row) => row.status === 'Requested').length), t('awaiting_pickup'), 'clock', true),
        kpiCard(t('in_transit'), num(inTransit), t('active_shipments'), 'truck'),
        kpiCard(t('delivered'), num(delivered), t('delivery_confirmation'), 'checkCircle'),
        kpiCard(t('collection_requests'), num(state.wasteRequests.length), t('waste_material'), 'recycle')
      ].join('')}</div>` : ''}
      ${state.user ? `<div class="tabs" style="margin-bottom:14px"><button class="tab ${state.logisticsTab === 'fresh' ? 'active' : ''}" data-action="logistics-tab" data-tab="fresh">${esc(t('fresh_fish'))}</button><button class="tab ${state.logisticsTab === 'waste' ? 'active' : ''}" data-action="logistics-tab" data-tab="waste">${esc(t('fish_waste'))}</button></div><div class="card"><div class="table-wrap"><table><thead><tr><th>${esc(t('shipment'))}</th><th>${esc(t('type'))}</th><th>${esc(t('pickup'))}</th><th>${esc(t('destination'))}</th><th>${esc(t('transporter'))}</th><th>${esc(t('status'))}</th><th></th></tr></thead><tbody>${logisticsRows()}</tbody></table></div></div>` : accessCard(t('login_for_logistics'), t('login_for_logistics_text'), 'buyer', 'login')}
      <div class="dashboard-grid" style="margin-top:16px">
        <div class="card map-card"><div class="card-head"><h2>${esc(t('map_view'))}</h2><span class="badge teal">${esc(t('coastal_network'))}</span></div><div class="map-shell" id="logisticsMap"></div></div>
        <div class="card"><div class="card-head"><h2>${esc(t('cold_storage'))}</h2><span class="badge blue">${esc(t('temperature_controlled'))}</span></div><div class="card-body">${coldStorageCards()}</div></div>
      </div>
      ${state.user ? `<div class="card" style="margin-top:16px"><div class="card-head"><h2>${esc(t('pickup_schedule'))}</h2><span class="small muted">${esc(t('collection_requests'))}</span></div>${wasteRequestTable(state.wasteRequests, 6)}</div>` : ''}
    </div>`;
  }

  function paymentMetrics() {
    const rows = state.payments;
    const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const pending = rows.filter((row) => row.status !== 'Paid').reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const completed = rows.filter((row) => row.status === 'Paid').reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const fees = rows.reduce((sum, row) => sum + Number(row.fee_amount || 0), 0);
    const transport = rows.reduce((sum, row) => sum + Number(row.transport_amount || 0), 0);
    const gross = rows.reduce((sum, row) => sum + Number(row.amount || 0) + Number(row.fee_amount || 0) + Number(row.transport_amount || 0), 0);
    return { total, pending, completed, fees, transport, gross };
  }

  function paymentTable() {
    if (!state.payments.length) return emptyState('wallet', t('no_payments'), t('no_payments_hint'));
    return `<div class="table-wrap"><table><thead><tr><th>${esc(t('date'))}</th><th>${esc(t('order'))}</th><th>${esc(t('fisherman'))}</th><th>${esc(t('quantity'))}</th><th>${esc(t('gross_value'))}</th><th>${esc(t('platform_fee'))}</th><th>${esc(t('transport'))}</th><th>${esc(t('payout'))}</th><th>${esc(t('status'))}</th><th></th></tr></thead><tbody>${state.payments.map((payment) => `<tr><td>${esc(dateShort(payment.created_at))}</td><td>#${esc(payment.order_id)}</td><td>${esc(payment.fisherman_name || '—')}</td><td>${num(payment.quantity_kg)} kg</td><td>${money(Number(payment.amount) + Number(payment.fee_amount) + Number(payment.transport_amount))}</td><td>${money(payment.fee_amount)}</td><td>${money(payment.transport_amount)}</td><td><strong>${money(payment.amount)}</strong></td><td>${badge(payment.status)}</td><td class="text-right"><button class="btn btn-ghost btn-sm" data-action="view-payment" data-id="${esc(payment.id)}">${esc(t('details'))}</button>${state.user?.role === 'admin' && payment.status !== 'Paid' ? `<button class="btn btn-soft btn-sm" data-action="mark-paid" data-id="${esc(payment.id)}">${esc(t('mark_paid'))}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function pricingResultHtml() {
    const species = state.pricingSpecies || state.prices[0]?.species || '';
    const price = state.prices.find((row) => row.species === species);
    const qty = Number(state.pricingQuantity) || 0;
    const market = Number(price?.price_per_kg || 0);
    const gross = market * qty;
    const fee = gross * 0.02;
    const transport = qty * 4;
    const payout = gross - fee - transport;
    return `<div class="breakdown">
      <div class="breakdown-row"><span>${esc(t('market_estimate'))} · ${esc(species || '—')}</span><strong>${money(market)}${esc(t('per_kg'))}</strong></div>
      <div class="breakdown-row"><span>${esc(t('quantity'))}</span><strong>${num(qty)} kg</strong></div>
      <div class="breakdown-row"><span>${esc(t('platform_fee'))} (2%)</span><strong>− ${money(fee)}</strong></div>
      <div class="breakdown-row"><span>${esc(t('transport_charges'))} (₹4/kg)</span><strong>− ${money(transport)}</strong></div>
      <div class="breakdown-row"><span>${esc(t('fisherman_receives'))}</span><strong>${money(payout)}</strong></div>
      <div class="breakdown-row total"><span>${esc(t('buyer_cost'))}</span><strong>${money(gross)}</strong></div>
    </div><p class="invoice-note">${esc(t('no_hidden'))}</p>`;
  }

  function pricingCalculator() {
    if (!state.prices.length) return emptyState('rupee', t('no_data'), '');
    if (!state.pricingSpecies) state.pricingSpecies = state.prices[0].species;
    return `<div class="card" style="margin-top:16px"><div class="card-head"><div><h2>${esc(t('pricing_title'))}</h2><p>${esc(t('pricing_subtitle'))}</p></div><span class="badge teal">${esc(t('transparent'))}</span></div><div class="card-body"><div class="form-grid"><label class="field"><span>${esc(t('select_catch'))}</span><select id="pricingSpecies">${state.prices.map((price) => option(price.species, price.species, state.pricingSpecies)).join('')}</select></label><label class="field"><span>${esc(t('quantity'))}</span><input id="pricingQuantity" type="number" min="1" step="1" value="${esc(state.pricingQuantity)}"></label></div><div id="pricingResult" style="margin-top:14px">${pricingResultHtml()}</div></div></div>`;
  }

  function renderPayments() {
    if (!state.user) return `<div class="screen-inner">${screenHead(t('payments_kicker'), t('payments'), t('payments_subtitle'))}${accessCard(t('login_for_payments'), t('login_for_payments_text'), 'fisherman', 'login')}</div>`;
    const metrics = paymentMetrics();
    const label = state.user.role === 'buyer' ? t('total_spend') : t('total_earnings');
    const series = monthlySeries(state.payments, (row) => row.amount);
    return `<div class="screen-inner">
      ${screenHead(t('payments_kicker'), t('payments'), t('payments_subtitle'), `<button class="btn" data-action="refresh">${icon('refresh')}${esc(t('refresh'))}</button>`)}
      <div class="payment-grid">
        <div class="card payment-summary"><span>${esc(label)}</span><strong>${money(metrics.total)}</strong><small>${esc(t('transparent_breakdown'))}</small></div>
        <div class="card payment-summary"><span>${esc(t('pending_payments'))}</span><strong>${money(metrics.pending)}</strong><small>${esc(t('awaiting_settlement'))}</small></div>
        <div class="card payment-summary"><span>${esc(t('completed_transactions'))}</span><strong>${money(metrics.completed)}</strong><small>${esc(t('settled_payments'))}</small></div>
      </div>
      <div class="grid-2">
        <div class="card"><div class="card-head"><h2>${esc(t('monthly_earnings'))}</h2><span class="small muted">${esc(t('last_six_months'))}</span></div><div class="card-body">${series.some((row) => row.value > 0) ? barChart(series, { label: t('monthly_earnings') }) : emptyState('chart', t('no_data'), '')}</div></div>
        <div class="card"><div class="card-head"><h2>${esc(t('transaction_breakdown'))}</h2><span class="badge teal">${esc(t('transparent'))}</span></div><div class="card-body"><div class="breakdown"><div class="breakdown-row"><span>${esc(t('gross_value'))}</span><strong>${money(metrics.gross)}</strong></div><div class="breakdown-row"><span>${esc(t('platform_fees'))} (2%)</span><strong>− ${money(metrics.fees)}</strong></div><div class="breakdown-row"><span>${esc(t('transportation_charges'))}</span><strong>− ${money(metrics.transport)}</strong></div><div class="breakdown-row"><span>${esc(t('fisherman_payout'))}</span><strong>${money(metrics.total)}</strong></div><div class="breakdown-row total"><span>${esc(t('net_payout'))}</span><strong>${money(metrics.total)}</strong></div></div><p class="invoice-note">${esc(t('payment_note'))}</p></div></div>
      </div>
      <div class="card" style="margin-top:16px"><div class="card-head"><h2>${esc(t('transactions'))}</h2><span class="small muted">${esc(t('latest_transactions'))}</span></div>${paymentTable()}</div>
      ${pricingCalculator()}
    </div>`;
  }

  function speciesSeries() {
    const role = state.user?.role;
    if (role === 'admin') return (state.roleData?.charts?.species || []).map((row) => ({ label: row.name, value: Number(row.value || 0) }));
    if (role === 'processor') {
      const map = {};
      state.wasteRequests.forEach((row) => { map[row.category || row.species] = (map[row.category || row.species] || 0) + Number(row.quantity_kg || 0); });
      return Object.entries(map).map(([label, value]) => ({ label, value }));
    }
    const rows = role === 'fisherman' ? state.roleData?.listings || [] : state.fresh;
    const map = {};
    rows.forEach((row) => { map[row.species] = (map[row.species] || 0) + Number(row.quantity_kg || 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }));
  }

  function statusSeries() {
    const rows = state.user?.role === 'processor' ? state.wasteRequests : (state.roleData?.orders || state.orders || []);
    const map = {};
    rows.forEach((row) => { map[row.status] = (map[row.status] || 0) + 1; });
    return Object.entries(map).map(([label, value]) => ({ label: statusLabel(label), value }));
  }

  function adminUsersTable() {
    const users = state.roleData?.users || [];
    if (!users.length) return emptyState('users', t('no_data'), '');
    return `<div class="table-wrap"><table><thead><tr><th>${esc(t('your_name'))}</th><th>${esc(t('email'))}</th><th>${esc(t('role'))}</th></tr></thead><tbody>${users.slice(0, 12).map((user) => `<tr><td><div class="table-main"><span class="avatar">${esc(initials(user.name))}</span><div><strong>${esc(user.name)}</strong><small>${esc(user.location || '—')}</small></div></div></td><td>${esc(user.email)}</td><td><select class="status-select" data-user-role="${esc(user.id)}">${['fisherman', 'buyer', 'processor', 'admin'].map((role) => option(role, roleLabel(role), user.role)).join('')}</select></td></tr>`).join('')}</tbody></table></div>`;
  }

  function pendingListingsTable() {
    const rows = (state.roleData?.listings || []).filter((listing) => !listing.verified || ['pending', 'registered', 'in inspection'].includes(String(listing.status || '').toLowerCase()));
    if (!rows.length) return emptyState('checkCircle', t('no_data'), '');
    return `<div class="table-wrap"><table><thead><tr><th>${esc(t('fish'))}</th><th>${esc(t('seller'))}</th><th>${esc(t('type'))}</th><th>${esc(t('quantity'))}</th><th>${esc(t('status'))}</th><th></th></tr></thead><tbody>${rows.slice(0, 10).map((listing) => `<tr><td><div class="table-main"><img class="table-thumb" src="${esc(listing.image)}" alt=""><strong>${esc(listing.species)}</strong></div></td><td>${esc(listing.seller_name || '—')}</td><td>${esc(listing.type === 'waste' ? t('fish_waste') : t('fresh_fish'))}</td><td>${num(listing.quantity_kg)} kg</td><td>${badge(listing.status)}</td><td class="text-right"><button class="btn btn-soft btn-sm" data-action="approve-listing" data-id="${esc(listing.id)}">${esc(t('approve'))}</button><button class="btn btn-ghost btn-sm" data-action="reject-listing" data-id="${esc(listing.id)}">${esc(t('reject'))}</button></td></tr>`).join('')}</tbody></table></div>`;
  }

  function adminPriceForm() {
    const first = state.prices[0];
    return `<form id="adminPriceForm" class="card-body"><div class="form-grid"><label class="field"><span>${esc(t('species'))}</span><select name="species">${state.prices.map((price) => option(price.species, price.species, first?.species)).join('')}</select></label><label class="field"><span>${esc(t('market_price_col'))}</span><input name="price" type="number" min="1" step="1" value="${esc(first?.price_per_kg || '')}" required></label></div><div class="form-actions"><button class="btn btn-primary btn-sm" type="submit">${esc(t('save_price'))}</button></div></form>`;
  }

  function adminMessages() {
    const messages = state.roleData?.messages || [];
    if (!messages.length) return emptyState('mail', t('no_data'), '');
    return `<div class="activity-list">${messages.slice(0, 8).map((message) => `<div class="activity-row"><span class="activity-icon">${icon('mail')}</span><div><strong>${esc(message.subject || t('message'))}</strong><small>${esc(message.name)} · ${esc(message.email)}</small><small>${esc(message.message)}</small></div></div>`).join('')}</div>`;
  }

  function adminControls() {
    return `<div class="grid-2" style="margin-top:16px">
      <div class="card"><div class="card-head"><h2>${esc(t('users_tab'))}</h2><span class="badge teal">${num((state.roleData?.users || []).length)}</span></div>${adminUsersTable()}</div>
      <div class="card"><div class="card-head"><h2>${esc(t('inventory_tab'))}</h2><span class="badge orange">${esc(t('pending'))}</span></div>${pendingListingsTable()}</div>
      <div class="card"><div class="card-head"><h2>${esc(t('prices_tab'))}</h2><span class="badge teal">${esc(t('live'))}</span></div>${adminPriceForm()}</div>
      <div class="card"><div class="card-head"><h2>${esc(t('messages_tab'))}</h2><span class="badge blue">${num((state.roleData?.messages || []).length)}</span></div><div class="card-body">${adminMessages()}</div></div>
    </div>`;
  }

  function renderAnalytics() {
    const series = dashboardSeries();
    const species = speciesSeries();
    const statuses = statusSeries();
    const hasSeries = series.some((row) => row.value > 0);
    return `<div class="screen-inner">
      ${screenHead(t('analytics_kicker'), t('analytics'), t('analytics_subtitle'), `<button class="btn" data-action="refresh">${icon('refresh')}${esc(t('refresh'))}</button>`)}
      <div class="kpi-grid">${dashboardKpis().join('')}</div>
      <div class="grid-2">
        <div class="card"><div class="card-head"><h2>${esc(t('monthly_activity'))}</h2><span class="small muted">${esc(t('last_six_months'))}</span></div><div class="card-body">${hasSeries ? barChart(series, { label: t('monthly_activity') }) : emptyState('chart', t('no_data'), t('login_for_analytics'))}</div></div>
        <div class="card"><div class="card-head"><h2>${esc(t('species_mix'))}</h2><span class="badge teal">${esc(t('quantity_kg'))}</span></div><div class="card-body">${species.length ? donutChart(species) : emptyState('fish', t('no_data'), '')}</div></div>
      </div>
      <div class="grid-2" style="margin-top:16px">
        <div class="card"><div class="card-head"><h2>${esc(t('order_status_mix'))}</h2></div><div class="card-body">${statuses.length ? barChart(statuses, { label: t('order_status_mix') }) : emptyState('receipt', t('no_data'), '')}</div></div>
        <div class="card"><div class="card-head"><h2>${esc(t('market_prices'))}</h2><span class="badge teal">${esc(t('live'))}</span></div><div class="card-body">${priceList(7)}</div></div>
      </div>
      ${state.user?.role === 'admin' ? adminControls() : ''}
      ${(() => {
        const st = (state.roleData && state.roleData.stats) || {};
        const rows = state.user?.role === 'admin'
          ? [['Fish sold (kg)', num(st.fishSold || 0)], [t('gross_value') || 'Gross trade', money(st.grossTradeValue || 0)], ['Fisherman payouts', money(st.fishermanPayouts || 0)], [t('platform_revenue') || 'Platform revenue', money(st.revenue || 0)], ['Logistics charges', money(st.logisticsCharges || 0)], ['Waste collected (kg)', num(st.wasteCollected || 0)], ['Waste requested (kg)', num(st.wasteRequested || 0)], ['Completed orders', num(st.completed_orders || 0)]]
          : state.user?.role === 'fisherman'
          ? [['Expected (₹)', money(st.expected || 0)], ['Paid (₹)', money(st.paid || 0)], ['Pending (₹)', money(st.pendingAmount || 0)], ['Quantity sold (kg)', num(st.totalQuantitySoldKg || 0)], [t('orders') || 'Orders', num(st.orderCount || 0)], ['Collections', num(st.collections || 0)]]
          : state.user?.role === 'buyer'
          ? [[t('total_spend') || 'Spent', money(st.spent || 0)], ['Quantity procured (kg)', num(st.totalQuantityKg || 0)], [t('orders') || 'Orders', num(st.orderCount || 0)], ['Open orders', num(st.openOrders || 0)]]
          : state.user?.role === 'processor'
          ? [['Requests', num(st.requests || 0)], ['Requested (kg)', num(st.totalRequestedKg || 0)], ['Delivered (kg)', num(st.totalDeliveredKg || 0)], ['Available materials', num(st.availableMaterials || 0)]]
          : [];
        if (!rows.length) return '';
        return `<div class="card" style="margin-top:16px"><div class="card-head"><h2>Totals & sums (demo)</h2><span class="badge teal">${esc(t('data_note') || 'Demo')}</span></div><div class="card-body"><div class="breakdown">${rows.map(([k,v]) => `<div class="breakdown-row"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div></div></div>`;
      })()}
      <div class="card" style="margin-top:16px"><div class="card-head"><h2>${esc(t('data_note'))}</h2></div><div class="card-body"><p class="muted small" style="margin:0">${esc(t('analytics_note'))}</p></div></div>
    </div>`;
  }

  function profileStats() {
    const rd = state.roleData || {};
    const role = state.user?.role;
    if (role === 'fisherman') return [kpiCard(t('active_listings'), num(rd.stats?.activeListings || 0), `${num(rd.stats?.totalQuantitySoldKg || 0)} kg sold`, 'fish'), kpiCard(t('total_earnings'), money(rd.stats?.paid || 0), `${money(rd.stats?.pendingAmount || 0)} pending`, 'wallet'), kpiCard(t('orders'), num(rd.stats?.orderCount || 0), `${num(rd.stats?.collections || 0)} collections`, 'receipt')].join('');
    if (role === 'buyer') return [kpiCard(t('total_spend'), money(rd.stats?.spent || 0), `${num(rd.stats?.totalQuantityKg || 0)} kg total`, 'wallet'), kpiCard(t('orders'), num(rd.stats?.orderCount || 0), `${num(rd.stats?.openOrders || 0)} open`, 'receipt'), kpiCard(t('suppliers'), num(rd.stats?.suppliers || 0), t('supplier_partners'), 'users')].join('');
    if (role === 'processor') return [kpiCard(t('collection_requests'), num(rd.stats?.requests || 0), `${num(rd.stats?.totalRequestedKg || 0)} kg requested`, 'recycle'), kpiCard(t('deliveries_done'), num(rd.stats?.deliveries || 0), `${num(rd.stats?.totalDeliveredKg || 0)} kg delivered`, 'truck'), kpiCard(t('available_materials'), num(rd.stats?.availableMaterials || 0), t('approved'), 'package')].join('');
    return [kpiCard(t('platform_users'), num((rd.users || []).length), t('total_registered'), 'users'), kpiCard(t('total_orders'), num(rd.stats?.orders || 0), `${money(rd.stats?.grossTradeValue || 0)} ${t('gross_value') || 'gross'}`, 'receipt'), kpiCard(t('platform_revenue'), money(rd.stats?.revenue || 0), `${money(rd.stats?.fishermanPayouts || 0)} payouts`, 'wallet'), kpiCard(t('waste_recovered'), `${num(rd.stats?.wasteCollected || 0)} kg`, `${money(rd.stats?.logisticsCharges || 0)} logistics`, 'recycle')].join('');
  }

  function renderProfile() {
    if (!state.user) return `<div class="screen-inner">${screenHead(t('profile_kicker'), t('profile'), t('profile_subtitle'))}${accessCard(t('login_to_view_profile'), t('login_to_view_profile_text'), 'fisherman', 'login')}</div>`;
    const user = state.user;
    return `<div class="screen-inner">
      ${screenHead(t('profile_kicker'), t('profile'), t('profile_subtitle'))}
      <div class="kpi-grid">${profileStats()}</div>
      <div class="profile-layout">
        <div class="card profile-card"><div class="profile-avatar">${esc(initials(user.name))}</div><h2>${esc(user.name)}</h2><p>${esc(roleLabel(user.role))}</p><div class="profile-meta"><div class="profile-meta-row">${icon('mail')}<span>${esc(t('email'))}</span><strong>${esc(user.email)}</strong></div><div class="profile-meta-row">${icon('phone')}<span>${esc(t('phone'))}</span><strong>${esc(user.phone || '—')}</strong></div><div class="profile-meta-row">${icon('pin')}<span>${esc(t('location'))}</span><strong>${esc(user.location || '—')}</strong></div><div class="profile-meta-row">${icon('calendar')}<span>${esc(t('member_since'))}</span><strong>${esc(dateShort(user.createdAt))}</strong></div></div></div>
        <div class="card"><div class="card-head"><div><h2>${esc(t('edit_profile'))}</h2><p>${esc(t('profile_form_hint'))}</p></div><span class="badge teal">${esc(roleLabel(user.role))}</span></div><form id="profileForm" class="card-body"><div class="form-grid"><label class="field"><span>${esc(t('full_name'))}</span><input name="name" value="${esc(user.name)}" required></label><label class="field"><span>${esc(t('email'))}</span><input value="${esc(user.email)}" disabled></label><label class="field"><span>${esc(t('phone'))}</span><input name="phone" value="${esc(user.phone || '')}"></label><label class="field"><span>${esc(t('location'))}</span><input name="location" value="${esc(user.location || '')}"></label><label class="field"><span>${esc(t('language'))}</span><select name="language">${['en', 'kn', 'ml', 'ta', 'hi'].map((lang) => option(lang, { en: 'English', kn: 'ಕನ್ನಡ', ml: 'മലയാളം', ta: 'தமிழ்', hi: 'हिन्दी' }[lang], state.lang)).join('')}</select></label><label class="field"><span>${esc(t('role'))}</span><input value="${esc(roleLabel(user.role))}" disabled></label></div><div class="form-note" style="margin-top:14px">${icon('lock')}<span>${esc(t('profile_note'))}</span></div><div class="form-actions"><button class="btn btn-primary" type="submit">${esc(t('save_profile'))}</button></div></form></div>
      </div>
    </div>`;
  }

  function whatsappCard() {
    const demoPhone = state.user?.role === 'fisherman' && state.user.phone ? state.user.phone : '+91 94480 10001';
    return `<div class="card"><div class="card-head"><div><h2>${esc(t('whatsapp_title'))}</h2><p>${esc(t('whatsapp_subtitle'))}</p></div><span class="badge ${state.integrations.whatsapp ? 'green' : 'orange'}">${esc(state.integrations.whatsapp ? t('status_connected') : t('status_not_configured'))}</span></div><div class="card-body"><form id="whatsappForm"><div class="form-grid"><label class="field full"><span>${esc(t('phone'))}</span><input name="phone" value="${esc(demoPhone)}" required></label><label class="field full"><span>${esc(t('message'))}</span><textarea name="message" rows="2" required>${esc(t('whatsapp_example'))}</textarea></label></div><div class="form-note" id="whatsappResult" style="margin-top:12px">${icon('spark')}<span>${esc(t('demo_hint'))}</span></div><div class="form-actions"><button class="btn btn-primary btn-sm" type="submit">${icon('phone')}${esc(t('parse_button'))}</button></div></form></div></div>`;
  }

  function contactCard() {
    return `<div class="card"><div class="card-head"><h2>${esc(t('contact_form_title'))}</h2><span class="badge teal">${esc(t('contact_title'))}</span></div><div class="card-body"><form id="contactForm" class="form-grid"><label class="field"><span>${esc(t('your_name'))}</span><input name="name" value="${esc(state.user?.name || '')}" required></label><label class="field"><span>${esc(t('email'))}</span><input name="email" type="email" value="${esc(state.user?.email || '')}" required></label><label class="field full"><span>${esc(t('subject'))}</span><input name="subject" placeholder="${esc(t('partnership'))}"></label><label class="field full"><span>${esc(t('message'))}</span><textarea name="message" rows="3" required></textarea></label><div class="form-actions"><button class="btn btn-primary" type="submit">${esc(t('send_enquiry'))}</button></div></form></div></div>`;
  }

  function renderSettings() {
    const settingsLanguage = `<label class="field"><span>${esc(t('language'))}</span><select id="settingsLanguage">${['en', 'kn', 'ml', 'ta', 'hi'].map((lang) => option(lang, { en: 'English', kn: 'ಕನ್ನಡ', ml: 'മലയാളം', ta: 'தமிழ்', hi: 'हिन्दी' }[lang], state.lang)).join('')}</select></label>`;
    if (!state.user) return `<div class="screen-inner">${screenHead(t('settings_kicker'), t('settings'), t('settings_subtitle'))}<div class="grid-2"><div class="card"><div class="card-head"><h2>${esc(t('language'))}</h2></div><div class="card-body">${settingsLanguage}<p class="small muted">${esc(t('language_note'))}</p></div></div><div class="card"><div class="card-head"><h2>${esc(t('account_actions'))}</h2></div><div class="card-body"><p class="small muted">${esc(t('login_to_manage_settings'))}</p><button class="btn btn-primary" data-action="open-auth" data-mode="login">${esc(t('login'))}</button></div></div></div><div class="grid-2" style="margin-top:16px">${whatsappCard()}${contactCard()}</div></div>`;
    return `<div class="screen-inner">
      ${screenHead(t('settings_kicker'), t('settings'), t('settings_subtitle'))}
      <div class="settings-grid">
        <div class="stack">
          <div class="card"><div class="card-head"><h2>${esc(t('notification_preferences'))}</h2><span class="badge teal">${esc(t('local_preferences'))}</span></div><div class="card-body"><div class="setting-row"><div><strong>${esc(t('order_updates'))}</strong><small>${esc(t('order_updates_hint'))}</small></div><label class="toggle"><input type="checkbox" data-pref="order_updates" ${pref('order_updates') ? 'checked' : ''}><span></span></label></div><div class="setting-row"><div><strong>${esc(t('market_alerts'))}</strong><small>${esc(t('market_alerts_hint'))}</small></div><label class="toggle"><input type="checkbox" data-pref="market_alerts" ${pref('market_alerts') ? 'checked' : ''}><span></span></label></div><div class="setting-row"><div><strong>${esc(t('email_notifications'))}</strong><small>${esc(t('email_notifications_hint'))}</small></div><label class="toggle"><input type="checkbox" data-pref="email_notifications" ${pref('email_notifications', false) ? 'checked' : ''}><span></span></label></div><div class="form-actions"><button class="btn btn-soft" data-action="save-preferences">${esc(t('save_preferences'))}</button></div></div></div>
          <div class="card"><div class="card-head"><h2>${esc(t('language'))}</h2></div><div class="card-body">${settingsLanguage}<p class="small muted">${esc(t('language_note'))}</p></div></div>
          ${whatsappCard()}
          ${contactCard()}
        </div>
        <div class="stack">
          <div class="card"><div class="card-head"><h2>${esc(t('integrations'))}</h2></div><div class="card-body"><div class="integration-row"><span>${icon('phone')}${esc(t('whatsapp_status'))}</span><span class="badge ${state.integrations.whatsapp ? 'green' : 'orange'}">${esc(state.integrations.whatsapp ? t('connected') : t('not_configured'))}</span></div><div class="integration-row"><span>${icon('spark')}${esc(t('n8n_status'))}</span><span class="badge ${state.integrations.n8n ? 'green' : 'orange'}">${esc(state.integrations.n8n ? t('connected') : t('not_configured'))}</span></div><div class="integration-row"><span>${icon('database')}${esc(t('database'))}</span><span class="badge green">${esc(t('operational'))}</span></div><p class="invoice-note">${esc(t('integration_note'))}</p></div></div>
          <div class="card"><div class="card-head"><h2>${esc(t('account_actions'))}</h2></div><div class="card-body"><div class="profile-meta-row">${icon('user')}<span>${esc(t('signed_in_as'))}</span><strong>${esc(state.user.email)}</strong></div><div class="profile-meta-row">${icon('shield')}<span>${esc(t('role'))}</span><strong>${esc(roleLabel(state.user.role))}</strong></div><div class="form-actions"><button class="btn btn-danger" data-action="logout">${icon('logout')}${esc(t('logout'))}</button></div><p class="invoice-note">${esc(t('privacy_note'))}</p></div></div>
        </div>
      </div>
    </div>`;
  }

  const SCREENS = {};
  SCREENS.dashboard = renderDashboard;
  SCREENS.marketplace = renderMarketplace;
  SCREENS['add-catch'] = renderAddCatch;
  SCREENS.orders = renderOrders;
  SCREENS.waste = renderWaste;
  SCREENS.processing = renderProcessing;
  SCREENS.logistics = renderLogistics;
  SCREENS.payments = renderPayments;
  SCREENS.analytics = renderAnalytics;
  SCREENS.profile = renderProfile;
  SCREENS.settings = renderSettings;

  function init() {
    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);
    document.addEventListener('input', handleInput);
    document.addEventListener('change', handleChange);
    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('hashchange', renderRoute);
    loadCore()
      .catch(() => {})
      .finally(() => {
        if (!location.hash) history.replaceState(null, '', '#/dashboard');
        renderRoute();
      });
  }

  async function handleClick(event) {
    const nav = event.target.closest('[data-nav]');
    if (nav) {
      event.preventDefault();
      navigate(nav.dataset.nav);
      return;
    }
    const actionNode = event.target.closest('[data-action]');
    if (!actionNode) {
      if (!event.target.closest('#notificationPanel') && !event.target.closest('#notificationsBtn')) closeNotifications();
      if (!event.target.closest('#searchSuggestions') && !event.target.closest('#topSearchWrap')) $('#searchSuggestions')?.classList.remove('open');
      return;
    }
    const action = actionNode.dataset.action;
    if (action === 'open-sidebar') return openSidebar();
    if (action === 'close-sidebar') return closeSidebar();
    if (action === 'open-auth') return openAuth(actionNode.dataset.mode || 'login', actionNode.dataset.role || 'fisherman');
    if (action === 'open-register') return openAuth('register', actionNode.dataset.role || 'fisherman');
    if (action === 'auth-mode') return openAuth(actionNode.dataset.mode || 'login', actionNode.dataset.role || state.authRole);
    if (action === 'demo-login') return demoLogin(actionNode.dataset.email, actionNode.dataset.password);
    if (action === 'close-modal') return closeModal();
    if (action === 'toggle-notifications') return toggleNotifications();
    if (action === 'mark-read') return markAllRead();
    if (action === 'open-notification') {
      state.readNotifications.add(actionNode.dataset.id);
      saveReadNotifications();
      closeNotifications();
      navigate(actionNode.dataset.screen || 'dashboard');
      return;
    }
    if (action === 'view-listing') return openListingModal(listingById(actionNode.dataset.id));
    if (action === 'order-listing') return openOrderModal(listingById(actionNode.dataset.id));
    if (action === 'request-waste') return openWasteRequestModal(listingById(actionNode.dataset.id));
    if (action === 'view-order') return openOrderDetail(actionNode.dataset.id);
    if (action === 'view-payment') return openPaymentDetail(state.payments.find((payment) => Number(payment.id) === Number(actionNode.dataset.id)) || {});
    if (action === 'register-waste') return openWasteForm();
    if (action === 'add-bulk') return addBulk(actionNode.dataset.id);
    if (action === 'remove-bulk') return removeBulk(actionNode.dataset.id);
    if (action === 'clear-bulk') return clearBulk();
    if (action === 'place-bulk') return openBulkOrderModal();
    if (action === 'mark-sold') return markListingSold(actionNode.dataset.id);
    if (action === 'delete-listing') return deleteListing(actionNode.dataset.id);
    if (action === 'print-invoice') return window.print();
    if (action === 'logout') return logout();
    if (action === 'refresh') return renderRoute();
    if (action === 'open-profile') return navigate('profile');
    if (action === 'mobile-search') {
      $('#topSearchWrap').classList.toggle('mobile-open');
      $('#globalSearch')?.focus();
      return;
    }
    if (action === 'search-pick') {
      state.filters.q = actionNode.dataset.q || '';
      state.filters.species = '';
      state.filters.location = '';
      $('#searchSuggestions')?.classList.remove('open');
      navigate(actionNode.dataset.screen || 'marketplace');
      return;
    }
    if (action === 'orders-tab') {
      state.ordersTab = actionNode.dataset.tab;
      renderRoute();
      return;
    }
    if (action === 'waste-filter') {
      state.filters.wasteCategory = actionNode.dataset.category || '';
      renderRoute();
      return;
    }
    if (action === 'logistics-tab') {
      state.logisticsTab = actionNode.dataset.tab || 'fresh';
      renderRoute();
      return;
    }
    if (action === 'mark-paid') return markPaid(actionNode.dataset.id);
    if (action === 'approve-listing') return updateListingApproval(actionNode.dataset.id, true);
    if (action === 'reject-listing') return updateListingApproval(actionNode.dataset.id, false);
    if (action === 'clear-filters') {
      state.filters = { q: '', species: '', location: '', quality: '', sort: 'new', wasteCategory: '' };
      renderRoute();
      return;
    }
    if (action === 'save-preferences') return showToast(t('preferences_saved'));
    if (action === 'mark-all-read') return markAllRead();
  }

  async function handleSubmit(event) {
    const form = event.target;
    if (!['authForm', 'catchForm', 'orderForm', 'bulkOrderForm', 'wasteForm', 'wasteRequestForm', 'profileForm', 'contactForm', 'whatsappForm', 'adminPriceForm'].includes(form.id)) return;
    event.preventDefault();
    if (form.id === 'authForm') return handleAuthSubmit(form);
    if (form.id === 'catchForm') return handleCatchSubmit(form);
    if (form.id === 'orderForm') return handleOrderSubmit(form);
    if (form.id === 'bulkOrderForm') return handleBulkOrderSubmit(form);
    if (form.id === 'wasteForm') return handleWasteSubmit(form);
    if (form.id === 'wasteRequestForm') return handleWasteRequestSubmit(form);
    if (form.id === 'profileForm') return handleProfileSubmit(form);
    if (form.id === 'contactForm') return handleContactSubmit(form);
    if (form.id === 'whatsappForm') return handleWhatsAppSubmit(form);
    if (form.id === 'adminPriceForm') return handleAdminPriceSubmit(form);
  }

  function handleInput(event) {
    const target = event.target;
    if (target.id === 'globalSearch') {
      renderSearchSuggestions(target.value);
      return;
    }
    if (target.id === 'marketSearch') {
      state.filters.q = target.value;
      renderMarketResults();
      return;
    }
    if (target.id === 'orderQuantity') {
      const form = target.closest('form');
      const listing = listingById(form?.listingId?.value);
      if (listing) $('#orderBreakdown').innerHTML = orderBreakdownHtml(listing, target.value);
      return;
    }
    if (target.classList.contains('bulk-qty-input')) {
      state.bulk.set(String(target.dataset.bulkId), Number(target.value));
      $('#bulkBreakdown').innerHTML = bulkBreakdownHtml();
      return;
    }
    if (target.id === 'pricingQuantity') {
      state.pricingQuantity = target.value;
      const result = $('#pricingResult');
      if (result) result.innerHTML = pricingResultHtml();
      return;
    }
    if (target.id === 'catchPrice' || target.id === 'catchQuantity') {
      const form = target.closest('form');
      const species = form?.species?.value;
      const price = Number(form?.price?.value || 0);
      const qty = Number(form?.quantity?.value || 0);
      const estimate = $('#catchEstimate');
      if (estimate) estimate.textContent = `${species || ''} · ${money(price)}${t('per_kg')} · ${num(qty)} kg · ${money(price * qty)} ${t('expected_value')}`;
      return;
    }
    if (target.type === 'file' && target.name === 'image') {
      const file = target.files?.[0];
      const preview = $('#catchPreview');
      if (file && preview) {
        fileToDataUrl(file).then((src) => { preview.src = src; preview.classList.remove('hidden'); });
      }
    }
  }

  function handleChange(event) {
    const target = event.target;
    if (target.id === 'topLanguage' || target.id === 'sidebarLanguage' || target.id === 'settingsLanguage') {
      setLanguage(target.value);
      return;
    }
    if (target.id === 'pricingSpecies') {
      state.pricingSpecies = target.value;
      const result = $('#pricingResult');
      if (result) result.innerHTML = pricingResultHtml();
      return;
    }
    if (target.dataset.userRole) {
      updateUserRole(target.dataset.userRole, target.value);
      return;
    }
    if (['speciesFilter', 'locationFilter', 'qualityFilter', 'sortFilter'].includes(target.id)) {
      const key = target.id.replace('Filter', '');
      state.filters[key] = target.value;
      renderMarketResults();
      return;
    }
    if (target.dataset.wasteStatus) {
      updateWasteStatus(target.dataset.wasteStatus, target.value);
      return;
    }
    if (target.dataset.logisticsStatus) {
      updateLogisticsStatus(target.dataset.logisticsStatus, target.value);
      return;
    }
    if (target.dataset.orderStatus) {
      updateOrderStatus(target.dataset.orderStatus, target.value);
      return;
    }
    if (target.dataset.pref) {
      setPref(target.dataset.pref, target.checked);
      return;
    }
  }

  function handleKeydown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      $('#topSearchWrap').classList.add('mobile-open');
      $('#globalSearch')?.focus();
    }
    if (event.key === 'Escape') {
      closeModal();
      closeNotifications();
      closeSidebar();
      $('#searchSuggestions')?.classList.remove('open');
    }
    if (event.key === 'Enter' && event.target.id === 'globalSearch') {
      event.preventDefault();
      state.filters.q = event.target.value;
      $('#searchSuggestions')?.classList.remove('open');
      navigate('marketplace');
    }
  }

  init();
})();

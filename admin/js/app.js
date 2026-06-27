/* ============================================================
   EREFT HIKING - Admin Dashboard
   Supabase is the source of truth for website content, images,
   registrations, admin auth, and saved default content.
   localStorage is kept only as a temporary offline fallback.
   ============================================================ */

var supabaseClient = window.ereftSupabaseClient ? window.ereftSupabaseClient() : null;
var ADMIN_SESSION_KEY = 'ereft_admin_session';
var adminSessionToken = null;
var PACKAGE_KEYS = ['nativeDay', 'nativeOvernight', 'foreignerDay', 'foreignerOvernight'];

function createEmptyPackage(currency) {
  return { name:'', sub:'', price:0, currency:currency || 'ETB', features:[] };
}

function createEmptyData() {
  return {
    trips: [],
    galleryCategories: [],
    galleryImages: [],
    packages: {
      nativeDay: createEmptyPackage('ETB'),
      nativeOvernight: createEmptyPackage('ETB'),
      foreignerDay: createEmptyPackage('USD'),
      foreignerOvernight: createEmptyPackage('USD')
    },
    website: {
      name:'',
      tagline:'',
      contactEmail:'',
      contactPhone:'',
      contactPhone2:'',
      meetingPoint:'',
      meetingTime:'',
      departureTime:'',
      instagram:'',
      tiktok:'',
      telegram:'',
      aboutText:'',
      rules:[],
      faq:[]
    },
    registrations: [],
    users: []
  };
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeData(data) {
  var base = createEmptyData();
  var incoming = data && typeof data === 'object' ? data : {};
  var normalized = Object.assign(base, incoming);

  normalized.trips = Array.isArray(incoming.trips) ? incoming.trips : [];
  normalized.galleryCategories = Array.isArray(incoming.galleryCategories) ? incoming.galleryCategories : [];
  normalized.galleryImages = Array.isArray(incoming.galleryImages) ? incoming.galleryImages : [];
  normalized.registrations = Array.isArray(incoming.registrations) ? incoming.registrations : [];
  normalized.users = Array.isArray(incoming.users) ? incoming.users : [];

  normalized.packages = Object.assign({}, base.packages, incoming.packages || {});
  PACKAGE_KEYS.forEach(function(key) {
    var fallback = base.packages[key] || createEmptyPackage('ETB');
    normalized.packages[key] = Object.assign({}, fallback, normalized.packages[key] || {});
    if (!Array.isArray(normalized.packages[key].features)) normalized.packages[key].features = [];
  });

  normalized.website = Object.assign({}, base.website, incoming.website || {});
  if (!Array.isArray(normalized.website.rules)) normalized.website.rules = [];
  if (!Array.isArray(normalized.website.faq)) normalized.website.faq = [];

  return normalized;
}

// ==============================
// PERSISTENCE
// ==============================
function loadData() {
  return createEmptyData();
}

function saveData(options) {
  options = options || {};
  if (!options.skipUndo && state.lastSavedData) {
    state.undoStack.push(JSON.parse(JSON.stringify(state.lastSavedData)));
    if (state.undoStack.length > 10) state.undoStack.shift();
  }

  if (supabaseClient && adminSessionToken) {
    var payload = cloneData();
    delete payload.registrations;
    delete payload.users;
    supabaseClient
      .rpc('admin_save_content', { p_admin_token:adminSessionToken, p_payload:payload })
      .then(function(res) {
        if (res.error) {
          console.error('Supabase save failed:', res.error);
          showToast('Saved locally, but Supabase sync failed', 'error');
        }
      });
  }

  state.lastSavedData = cloneData();
}

function cloneData() {
  return cloneValue(state.data);
}

function dbRegistrationToState(row) {
  return {
    id: row.id,
    hikeId: row.hike_id || '',
    userId: row.user_id || '',
    username: row.username || '',
    fullName: row.full_name,
    phone: row.phone,
    age: row.age,
    participantsCount: cleanPeopleCount(row.participants_count || 1),
    gender: row.gender,
    destination: row.destination,
    package: row.package_name,
    tripDate: row.trip_date || '',
    price: row.price == null ? 0 : Number(row.price),
    currency: row.currency || 'ETB',
    paymentMethod: row.payment_method || 'Not selected',
    senderAccount: row.sender_account || '',
    transactionId: row.transaction_id || '',
    paymentStatus: row.payment_status || 'pending',
    status: row.status || 'pending',
    adminMessage: row.admin_message || '',
    submittedDate: row.submitted_date || (row.created_at || '').slice(0, 10),
    createdAt: row.created_at || '',
    notes: row.notes || ''
  };
}

async function fetchRegistrationsFromSupabase() {
  if (!supabaseClient || !adminSessionToken) return [];
  var regRes = await supabaseClient.rpc('admin_get_registrations', {
    p_admin_token:adminSessionToken
  });

  if (regRes.error) throw regRes.error;
  return (regRes.data || []).map(dbRegistrationToState);
}

async function fetchSiteUsersFromSupabase() {
  if (!supabaseClient || !adminSessionToken) return [];
  var res = await supabaseClient.rpc('admin_get_site_users', {
    p_admin_token:adminSessionToken
  });
  if (res.error) throw res.error;
  return res.data || [];
}

async function refreshDataFromSupabase() {
  if (!supabaseClient || !adminSessionToken) return;

  var contentRes = await supabaseClient.rpc('admin_get_content', {
    p_admin_token:adminSessionToken
  });

  if (contentRes.error) throw contentRes.error;
  if (contentRes.data && Object.keys(contentRes.data).length) {
    state.data = normalizeData(contentRes.data);
  } else if (!state.lastSavedData) {
    state.data = createEmptyData();
  }

  state.data.registrations = await fetchRegistrationsFromSupabase();
  try { state.data.users = await fetchSiteUsersFromSupabase(); } catch(_) {}
  state.adminUserIds = {};
  state.lastSavedData = cloneData();
  render();
}

async function refreshRegistrationsFromSupabase(showMessage) {
  if (!supabaseClient) {
    showToast('Registration refresh needs Supabase connection', 'error');
    return;
  }
  if (state.refreshingRegistrations) return;

  state.refreshingRegistrations = true;
  if (getCurrentPage() === 'registrations') render();

  try {
    state.data.registrations = await fetchRegistrationsFromSupabase();
    state.data.users = await fetchSiteUsersFromSupabase();
    state.lastRegistrationRefresh = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    if (state.viewRegId != null && !state.data.registrations.some(function(r){ return r.id === state.viewRegId; })) {
      state.viewRegId = null;
    }
    if (showMessage) showToast('Registrations refreshed', 'success');
  } catch (err) {
    console.error('Could not refresh registrations:', err);
    if (showMessage) showToast('Could not refresh registrations', 'error');
  } finally {
    state.refreshingRegistrations = false;
    if (getCurrentPage() === 'registrations' || getCurrentPage() === 'overview') render();
  }
}

function paymentStatusForBookingStatus(status) {
  if (status === 'accepted') return 'confirmed';
  if (status === 'rejected') return 'failed';
  return 'submitted';
}

function registrationBadgeClass(status) {
  if (status === 'accepted') return 'badge-success';
  if (status === 'rejected') return 'badge-danger';
  if (status === 'needs_review') return 'badge-info';
  return 'badge-warning';
}

function formatAdminPrice(reg) {
  var amount = Number(reg.price || 0).toLocaleString();
  return reg.currency === 'USD' ? '$' + amount : amount + ' ' + (reg.currency || 'ETB');
}

function updateRegistrationStatus(id, status, message) {
  if (!supabaseClient || !adminSessionToken) return Promise.resolve();
  return supabaseClient
    .rpc('admin_update_registration', {
      p_admin_token:adminSessionToken,
      p_registration_id:id,
      p_status:status || null,
      p_admin_message:message == null ? null : message
    })
    .then(function(res) {
      if (res.error) {
        console.error('Registration status sync failed:', res.error);
        showToast('Status changed locally, but Supabase sync failed', 'error');
      }
    });
}

function undoLastSave() {
  if (!state.undoStack.length) {
    showToast('Nothing to undo', 'error');
    return;
  }

  state.data = state.undoStack.pop();
  saveData({ skipUndo:true });
  showToast('Last saved content change was undone', 'success');
  render();
}

// ==============================
// STATE
// ==============================
var state = {
  user: null,
  sidebarOpen: false,
  loginError: '',
  loginLoading: false,
  data: loadData(),
  undoStack: [],
  lastSavedData: null,
  // UI state
  editingTripIdx: -1,
  tripFormVisible: false,
  editingPackage: null,
  galleryEditId: -1,
  galleryDraft: null,
  addingGalleryItem: false,
  viewRegId: null,
  editingFaqIdx: -1,
  faqFormVisible: false,
  editingPackages: false,
  editingWebsite: false,
  websiteChanged: false,
  refreshingRegistrations: false,
  lastRegistrationRefresh: '',
  regFilterDestination: '',
  regFilterPayment: '',
  regFilterStatus: ''
};

state.lastSavedData = cloneData();

// ==============================
// NAV ITEMS
// ==============================
var NAV_ITEMS = [
  { id:'overview', label:'Overview', icon:'\uD83D\uDCCA' },
  { id:'trips', label:'Trips', icon:'\uD83C\uDFD4\uFE0F' },
  { id:'packages', label:'Packages', icon:'\uD83D\uDCC6' },
  { id:'gallery', label:'Gallery', icon:'\uD83D\uDDBC\uFE0F' },
  { id:'website', label:'Website Content', icon:'\uD83C\uDF10' },
  { id:'registrations', label:'Registrations', icon:'\uD83D\uDCCB' },
  { id:'users', label:'Users', icon:'\uD83D\uDC65' },
  { id:'settings', label:'Settings', icon:'\u2699\uFE0F' }
];

// ==============================
// HELPERS
// ==============================
function esc(s) {
  if (s == null) return '';
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(String(s)));
  return d.innerHTML;
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

function formatDateTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-US', {
    year:'numeric',
    month:'short',
    day:'numeric',
    hour:'2-digit',
    minute:'2-digit'
  });
}

function formatTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
}

function formatPrice(price, currency) {
  if (currency === 'USD') return '$' + Number(price).toLocaleString();
  return Number(price).toLocaleString() + ' ' + currency;
}

function cleanPeopleCount(value) {
  var count = Number(value);
  if (!Number.isFinite(count) || count < 1) return 1;
  return Math.floor(count);
}

function adminImageSrc(src) {
  if (!src) return '';
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  if (src.indexOf('../') === 0 || src.indexOf('/') === 0) return src;
  return '../' + src;
}

function fileSlug(name) {
  return String(name || 'image')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image';
}

function compressImageFile(file, maxWidth, quality) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onerror = reject;
    reader.onload = function() {
      var img = new Image();
      img.onerror = reject;
      img.onload = function() {
        var scale = Math.min(1, maxWidth / img.width);
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function(blob) {
          if (!blob) reject(new Error('Could not compress image'));
          else resolve(blob);
        }, 'image/webp', quality);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadAdminImage(file, folder) {
  if (!file) return '';
  if (!supabaseClient) {
    throw new Error('Supabase is required for image uploads');
  }

  var blob = await compressImageFile(file, 1600, 0.78);
  var path = folder + '/' + Date.now() + '-' + fileSlug(file.name) + '.webp';
  var uploaded = await supabaseClient.storage
    .from('ereft-images')
    .upload(path, blob, { contentType:'image/webp', upsert:false });

  if (uploaded.error) throw uploaded.error;

  var publicUrl = supabaseClient.storage
    .from('ereft-images')
    .getPublicUrl(path);

  return publicUrl.data.publicUrl;
}

function previewSelectedImage(input, previewId) {
  var preview = document.getElementById(previewId);
  var file = input && input.files && input.files[0];
  if (!preview || !file) return;

  var url = URL.createObjectURL(file);
  preview.innerHTML = '<img src="' + esc(url) + '" alt="Selected image preview">';
}

function iconSvg(name) {
  var icons = {
    edit:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    trash:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>',
    eye:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>',
    check:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>',
    x:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    refresh:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 1-15.4 6.36L3 16"/><path d="M3 21v-5h5"/><path d="M3 12A9 9 0 0 1 18.4 5.64L21 8"/><path d="M21 3v5h-5"/></svg>',
    zoom:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6"/><path d="M11 8v6"/></svg>'
  };
  return icons[name] || '';
}

function renderGalleryCategoryControls(item, cats) {
  var isNew = !item.category || item.category === '__new__';
  var options = '<option value="__new__"' + (isNew ? ' selected' : '') + '>+ New destination / place</option>' +
    cats.map(function(c){ return '<option value="' + c.slug + '"' + (item.category === c.slug ? ' selected' : '') + '>' + esc(c.name) + '</option>' }).join('');
  var newFields = isNew
    ? '<input class="form-input" placeholder="New destination name" value="' + esc(item.newCategoryName || item.place || '') + '" onchange="updateGalleryField(\'newCategoryName\',this.value)">' +
      '<input class="form-input" placeholder="Optional slug, e.g. mount-batu" value="' + esc(item.newCategorySlug || '') + '" onchange="updateGalleryField(\'newCategorySlug\',this.value)">'
    : '';

  return '<select class="form-input" onchange="updateGalleryField(\'category\',this.value)">' + options + '</select>' + newFields;
}

async function loadDefaultContent() {
  if (!supabaseClient) {
    throw new Error('Supabase is required for default content');
  }

  var defaults = await supabaseClient
    .from('site_defaults')
    .select('payload')
    .eq('id', 'main')
    .maybeSingle();

  if (defaults.error) throw defaults.error;
  if (!defaults.data || !defaults.data.payload || !Object.keys(defaults.data.payload).length) {
    throw new Error('No default content found');
  }

  return normalizeData(defaults.data.payload);
}

function confirmAction(options) {
  options = options || {};
  var title = options.title || 'Confirm action';
  var message = options.message || '';
  var details = options.details || '';
  var confirmText = options.confirmText || 'Confirm';
  var cancelText = options.cancelText || 'Cancel';
  var tone = options.tone === 'danger' ? 'danger' : 'primary';
  var detailParts = Array.isArray(details) ? details : String(details || '').split(/\n{2,}/);
  var detailHtml = detailParts
    .filter(function(part) { return String(part).trim(); })
    .map(function(part) { return '<p>' + esc(part.trim()) + '</p>'; })
    .join('');

  return new Promise(function(resolve) {
    var existing = document.querySelector('.confirm-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay confirm-overlay';
    overlay.innerHTML =
      '<div class="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">' +
        '<div class="confirm-icon confirm-icon-' + tone + '">' + (tone === 'danger' ? iconSvg('trash') : iconSvg('check')) + '</div>' +
        '<div class="confirm-content">' +
          '<h2 id="confirm-title">' + esc(title) + '</h2>' +
          (message ? '<p class="confirm-message">' + esc(message) + '</p>' : '') +
          (detailHtml ? '<div class="confirm-details">' + detailHtml + '</div>' : '') +
        '</div>' +
        '<div class="confirm-actions">' +
          '<button type="button" class="btn btn-secondary" data-confirm-cancel>' + esc(cancelText) + '</button>' +
          '<button type="button" class="btn btn-' + tone + '" data-confirm-ok>' + esc(confirmText) + '</button>' +
        '</div>' +
      '</div>';

    function close(value) {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      resolve(value);
    }

    function onKey(e) {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter') close(true);
    }

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay || e.target.closest('[data-confirm-cancel]')) close(false);
      if (e.target.closest('[data-confirm-ok]')) close(true);
    });

    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    var cancel = overlay.querySelector('[data-confirm-cancel]');
    if (cancel) cancel.focus();
  });
}

// ==============================
// TOAST
// ==============================
function showToast(msg, type) {
  var old = document.querySelector('.toast');
  if (old) old.remove();
  var el = document.createElement('div');
  el.className = 'toast toast-' + (type || 'success');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function(){ el.remove() }, 3000);
}

// ==============================
// AUTH
// ==============================
function initAuth() {
  state.user = null;
  adminSessionToken = null;
}

function saveAdminSession(payload) {
  var token = payload && (payload.session_token || payload.token);
  var admin = payload && payload.admin;
  if (!token || !admin) return false;
  adminSessionToken = token;
  state.user = {
    id:admin.id,
    username:admin.username,
    name:admin.display_name || admin.username,
    displayName:admin.display_name || admin.username
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
    session_token:adminSessionToken,
    user:state.user
  }));
  return true;
}

function clearAdminSession() {
  adminSessionToken = null;
  state.user = null;
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

async function handleLogin(e) {
  e.preventDefault();
  var u = (document.getElementById('login-user')?.value || '').trim();
  var p = document.getElementById('login-pass')?.value || '';

  state.loginError = '';
  state.loginLoading = true;
  render();

  if (!supabaseClient) {
    state.loginError = 'Supabase is not configured yet.';
    state.loginLoading = false;
    render();
    return;
  }

  try {
    var loginRes = await supabaseClient.rpc('admin_login', { p_username:u, p_password:p });
    if (loginRes.error) throw loginRes.error;
    if (!loginRes.data || !loginRes.data.success) {
      state.loginError = (loginRes.data && loginRes.data.error) || 'Invalid username or password';
      state.loginLoading = false;
      render();
      return;
    }
    if (!saveAdminSession(loginRes.data)) {
      state.loginError = 'Admin SQL setup is incomplete. Run supabase-schema.sql again.';
      state.loginLoading = false;
      render();
      return;
    }

    state.loginLoading = false;
    navigateTo('overview');
    await refreshDataFromSupabase().catch(function(err) {
      console.error('Could not refresh Supabase data:', err);
      showToast('Logged in, but data refresh failed', 'error');
    });
    render();
  } catch (err) {
    state.loginError = 'Login failed: ' + (err.message || 'unknown error');
    state.loginLoading = false;
    render();
  }
}

async function restoreAdminSession() {
  if (!supabaseClient) return;
  try {
    var saved = JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) || 'null');
    if (!saved || !saved.session_token) {
      clearAdminSession();
      render();
      return;
    }

    adminSessionToken = saved.session_token;
    state.user = saved.user || null;

    var current = await supabaseClient.rpc('admin_current', { p_admin_token:adminSessionToken });
    if (current.error || !current.data || !current.data.success) {
      clearAdminSession();
      navigateTo('login');
      render();
      return;
    }
    saveAdminSession({ session_token:adminSessionToken, admin:current.data.admin });
    await refreshDataFromSupabase();
    render();
  } catch (err) {
    console.error('Could not restore admin session:', err);
    clearAdminSession();
    render();
  }
}

function handleLogout() {
  var token = adminSessionToken;
  if (supabaseClient && token) {
    supabaseClient.rpc('admin_logout', { p_admin_token:token }).catch(function() {});
  }
  clearAdminSession();
  navigateTo('login');
  render();
}
// ==============================
// ROUTER
// ==============================
function navigateTo(page) {
  window.location.hash = page === 'login' ? '' : page;
}

function getCurrentPage() {
  var h = window.location.hash.replace(/^#\/?/, '');
  return h || 'overview';
}

// ==============================
// MAIN RENDER
// ==============================
function removeTripFormOverlay() {
  var el = document.getElementById('trip-form-overlay');
  if (el) el.remove();
}

function injectTripForm() {
  removeTripFormOverlay();
  document.body.insertAdjacentHTML('beforeend', renderTripForm());
}

function render() {
  removeTripFormOverlay();
  document.getElementById('app').innerHTML = state.user ? renderDashboard() : renderLogin();
}

// ==============================
// LOGIN
// ==============================
function renderLogin() {
  return '<div class="login-page">' +
    '<div class="login-bg"><div class="login-bg-shapes"><div class="shape shape-1"></div><div class="shape shape-2"></div><div class="shape shape-3"></div></div></div>' +
    '<div class="login-container">' +
      '<div class="login-card">' +
        '<div class="login-header"><div class="login-logo">\u26F0\uFE0F</div><h1 class="login-title">Ereft Hiking</h1><p class="login-subtitle">Admin Dashboard</p></div>' +
        '<form class="login-form" onsubmit="handleLogin(event)">' +
          '<div class="form-group"><label class="form-label">Username</label><div class="input-wrapper"><svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><input id="login-user" type="text" class="form-input" placeholder="admin" autofocus autocomplete="off"></div></div>' +
          '<div class="form-group"><label class="form-label">Password</label><div class="input-wrapper"><svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><input id="login-pass" type="password" class="form-input" placeholder="Enter password"><button type="button" class="input-toggle" onclick="togglePass()" aria-label="Toggle"><svg id="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></div></div>' +
          '<p style="font-size:12px;color:var(--text-muted);margin:-8px 0 16px">Default: username <strong>admin</strong>, password <strong>admin123</strong></p>' +
          (state.loginError ? '<div class="login-error"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><span>' + state.loginError + '</span></div>' : '') +
          '<button type="submit" class="btn btn-primary btn-block"' + (state.loginLoading ? ' disabled' : '') + '>' + (state.loginLoading ? '<span class="spinner"></span> Signing in...' : 'Sign In') + '</button>' +
        '</form>' +
      '</div>' +
    '</div></div>';
}

function togglePass() {
  var inp = document.getElementById('login-pass');
  var icon = document.getElementById('eye-icon');
  if (inp.type === 'password') {
    inp.type = 'text';
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    inp.type = 'password';
    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

// ==============================
// DASHBOARD LAYOUT
// ==============================
function renderDashboard() {
  var page = getCurrentPage();
  state.sidebarOpen = state.sidebarOpen || false;
  return '<div class="layout">' +
    renderSidebar(page) +
    '<div class="main-area">' +
      renderHeader() +
      '<main class="content" id="page-content">' + renderPage(page) + '</main>' +
    '</div>' +
    (state.sidebarOpen ? '<div class="sidebar-overlay show" onclick="closeSidebar()"></div>' : '') +
  '</div>';
}

function renderSidebar(page) {
  var items = NAV_ITEMS.map(function(it) {
    var a = it.id === page ? ' active' : '';
    return '<button class="sidebar-link' + a + '" data-nav="' + it.id + '"><span class="sidebar-link-icon">' + it.icon + '</span><span class="sidebar-link-label">' + it.label + '</span></button>';
  }).join('');
  return '<aside class="sidebar' + (state.sidebarOpen ? ' open' : '') + '">' +
    '<div class="sidebar-brand"><div class="sidebar-brand-icon"><img src="../assets/logo/logo.webp" alt="Ereft Hiking" style="width:36px;height:36px;border-radius:8px"></div><div class="sidebar-brand-text"><span class="sidebar-brand-name">Ereft Hiking</span><span class="sidebar-brand-role">Admin Panel</span></div></div>' +
    '<nav class="sidebar-nav">' + items + '</nav>' +
    '<div class="sidebar-footer"><button class="sidebar-link sidebar-logout" onclick="handleLogout()"><span class="sidebar-link-icon">\uD83D\uDEAA</span><span class="sidebar-link-label">Logout</span></button></div>' +
  '</aside>';
}

function renderHeader() {
  return '<header class="header">' +
    '<button class="header-menu-btn" onclick="toggleSidebar()" aria-label="Menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>' +
    '<div class="header-search"><svg class="header-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" placeholder="Search..." class="header-search-input"></div>' +
    '<div class="header-right">' +
      '<button class="btn btn-sm btn-secondary btn-icon-text" onclick="undoLastSave()" title="Undo last saved content change">' + iconSvg('x') + ' Undo Last Save</button>' +
      '<div class="header-user"><div class="header-avatar">A</div><div class="header-user-info"><span class="header-user-name">' + esc(state.user?.name || 'Admin') + '</span><span class="header-user-role">Administrator</span></div></div>' +
    '</div>' +
  '</header>';
}

function renderPage(page) {
  switch(page) {
    case 'overview': return renderOverview();
    case 'trips': return renderTrips();
    case 'packages': return renderPackages();
    case 'gallery': return renderGallery();
    case 'website': return renderWebsite();
    case 'registrations': return renderRegistrations();
    case 'users': return renderUsers();
    case 'settings': return renderSettings();
    default: return renderOverview();
  }
}

function toggleSidebar() { state.sidebarOpen = !state.sidebarOpen; render(); }
function closeSidebar() { state.sidebarOpen = false; render(); }

// ==============================
// OVERVIEW PAGE
// ==============================
function renderOverview() {
  var d = state.data;
  var totalTrips = d.trips.length;
  var activeTrips = d.trips.filter(function(t){ return t.status === 'active' }).length;
  var totalRegs = d.registrations.length;
  var pendingRegs = d.registrations.filter(function(r){ return r.status === 'pending' }).length;
  var totalImages = d.galleryImages.length;
  var now = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  var totalUsers = d.users.length;
  var stats = [
    { label:'Total Trips', value:totalTrips, icon:'\uD83C\uDFD4\uFE0F', change:activeTrips + ' active', cls:'up' },
    { label:'Active Trips', value:activeTrips, icon:'\u2705', change:Math.round(activeTrips/totalTrips*100)+'%', cls:'up' },
    { label:'Total Registrations', value:totalRegs, icon:'\uD83D\uDCDD', change:pendingRegs + ' pending', cls:pendingRegs > 0 ? 'down' : 'up' },
    { label:'Registered Users', value:totalUsers, icon:'\uD83D\uDC65', change:totalUsers + ' accounts', cls:'up' },
    { label:'Pending', value:pendingRegs, icon:'\u23F3', change:pendingRegs > 0 ? 'Needs review' : 'None', cls:pendingRegs > 0 ? 'down' : 'up' },
    { label:'Gallery Images', value:totalImages, icon:'\uD83D\uDDBC\uFE0F', change:d.galleryCategories.length + ' categories', cls:'up' }
  ];

  var recentHtml = d.registrations.slice(-5).reverse().map(function(r) {
    var cls = r.status === 'pending' ? 'registration' : r.status === 'accepted' ? 'trip' : 'payment';
    return '<div class="activity-item"><div class="activity-dot ' + cls + '"></div><div class="activity-content"><p class="activity-text">' + esc(r.fullName) + ' â€” ' + esc(r.destination) + ' (' + r.status + ')</p><span class="activity-time">' + formatDate(r.submittedDate) + '</span></div></div>';
  }).join('') || '<div class="activity-item"><div class="activity-content"><p class="activity-text text-muted">No registrations yet</p></div></div>';

  var tripCards = d.trips.filter(function(t){ return t.status === 'active' }).slice(0, 4).map(function(t) {
    return '<div class="mini-trip-card"><div class="mini-trip-img" style="background:linear-gradient(135deg,var(--primary-light),var(--bg))"><span>\uD83C\uDFD4\uFE0F</span></div><div class="mini-trip-info"><strong>' + esc(t.name) + '</strong><span>' + esc(t.date) + ' \u2022 ' + t.spotsLeft + ' spots</span></div></div>';
  }).join('');

  return '<div class="page">' +
    '<div class="page-header"><div><h1 class="page-title">Overview</h1><p class="page-subtitle">Your hiking website at a glance</p></div><div class="page-header-date">' + now + '</div></div>' +
    '<div class="stats-grid">' + stats.map(function(s,i){
      return '<div class="stat-card" style="animation-delay:'+(0.05*(i+1))+'s"><div class="stat-card-top"><div class="stat-icon">'+s.icon+'</div><span class="stat-change '+s.cls+'">'+esc(s.change)+'</span></div><div class="stat-value">'+s.value+'</div><div class="stat-label">'+esc(s.label)+'</div></div>';
    }).join('') + '</div>' +
    '<div class="overview-grid">' +
      '<div class="card"><h2 class="card-title">Recent Registrations</h2><div class="activity-list">' + recentHtml + '</div></div>' +
      '<div class="card"><h2 class="card-title">Active Trips</h2><div class="mini-trip-list">' + tripCards + '</div><div class="form-actions" style="margin-top:12px"><button class="btn btn-sm btn-secondary" onclick="navigateTo(\'trips\')">Manage Trips \u2192</button></div></div>' +
    '</div></div>';
}

// ==============================
// TRIPS PAGE
// ==============================
function renderTrips() {
  var d = state.data;
  var listHtml = d.trips.map(function(t, idx) {
    var badge = t.status === 'active' ? 'badge-success' : t.status === 'hidden' ? 'badge-warning' : 'badge-info';
    var img = adminImageSrc(t.image);
    return '<div class="trip-admin-card">' +
      '<div class="trip-admin-img">' +
        (img ? '<img src="' + esc(img) + '" alt="' + esc(t.name || 'Trip') + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' : '') +
        '<div class="mini-img-placeholder"' + (img ? ' style="display:none"' : '') + '>\uD83C\uDFD4\uFE0F</div>' +
      '</div>' +
      '<div class="trip-admin-body">' +
        '<div class="trip-admin-top"><h3>' + esc(t.name) + '</h3><span class="badge ' + badge + '">' + t.status + '</span></div>' +
        '<div class="trip-admin-meta"><span>\uD83D\uDCC5 ' + esc(t.date) + '</span><span>\uD83D\uDCCD ' + esc(t.category) + '</span><span>\uD83D\uDC65 ' + t.spotsLeft + ' spots</span><span>' + esc(t.duration) + '</span></div>' +
        '<p class="trip-admin-desc">' + esc(t.description) + '</p>' +
        '<div class="trip-admin-actions">' +
          '<button class="btn btn-sm btn-primary" onclick="openTripForm(' + idx + ')">Edit</button>' +
          '<button class="btn btn-sm btn-secondary" onclick="toggleTripStatus(' + idx + ')">' + (t.status === 'active' ? 'Hide' : 'Show') + '</button>' +
          '<button class="btn btn-sm btn-danger" onclick="deleteTrip(' + idx + ')">Delete</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('') || '<div class="card"><p class="text-muted">No trips yet. Add your first trip below.</p></div>';

  var formHtml = '';
  if (state.tripFormVisible) formHtml = renderTripForm();

  return '<div class="page">' +
    '<div class="page-header"><div><h1 class="page-title">Trips</h1><p class="page-subtitle">Manage hiking destinations \u2014 add, edit, hide, or delete trips</p></div><div class="page-actions"><button class="btn btn-secondary" onclick="resetTripImagesDefaults()">Reset Images</button><button class="btn btn-primary" onclick="openNewTrip()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add New Trip</button></div></div>' +
    '<div class="trip-admin-list">' + listHtml + '</div>' +
    formHtml +
  '</div>';
}

function openNewTrip() {
  state.editingTripIdx = -1;
  injectTripForm();
}

function openTripForm(idx) {
  state.editingTripIdx = idx;
  injectTripForm();
}

function closeTripForm() {
  state.editingTripIdx = -1;
  removeTripFormOverlay();
}

async function saveTrip(e) {
  e.preventDefault();
  var f = state.data.trips[state.editingTripIdx] || {};
  var form = document.forms['trip-form'];
  if (!form) return;
  var fd = new FormData(form);
  var imagePath = fd.get('image') || f.image || '';
  var imageFile = document.getElementById('trip-image-file')?.files?.[0];

  try {
    if (imageFile) {
      imagePath = await uploadAdminImage(imageFile, 'trips');
    }
  } catch (err) {
    console.error('Trip image upload failed:', err);
    showToast('Trip image upload failed', 'error');
    return;
  }

  var trip = {
    name: fd.get('name') || '',
    duration: fd.get('duration') || '',
    price: fd.get('price') || '',
    image: imagePath,
    description: fd.get('description') || '',
    category: fd.get('category') || '',
    start: fd.get('start') || '',
    date: fd.get('date') || '',
    spotsLeft: parseInt(fd.get('spotsLeft')) || 0,
    status: fd.get('status') || 'active',
    expect: fd.get('expect') ? fd.get('expect').split('\n').filter(Boolean).map(function(s){ return s.trim() }) : []
  };

  if (state.editingTripIdx >= 0 && state.editingTripIdx < state.data.trips.length) {
    state.data.trips[state.editingTripIdx] = trip;
    showToast('Trip updated', 'success');
  } else {
    state.data.trips.push(trip);
    showToast('Trip added', 'success');
  }
  saveData();
  state.editingTripIdx = -1;
  removeTripFormOverlay();
  render();
}

async function deleteTrip(idx) {
  var trip = state.data.trips[idx];
  if (!trip) return;
  var ok = await confirmAction({
    title:'Delete trip?',
    message:'Delete "' + (trip.name || 'this trip') + '" from the website content?',
    details:'This removes the trip from the admin dashboard and the public trip list after saving to Supabase.',
    confirmText:'Delete Trip',
    tone:'danger'
  });
  if (!ok) return;
  state.data.trips.splice(idx, 1);
  saveData();
  showToast('Trip deleted', 'error');
  render();
}

function toggleTripStatus(idx) {
  var t = state.data.trips[idx];
  if (!t) return;
  t.status = t.status === 'active' ? 'hidden' : 'active';
  saveData();
  showToast(t.name + ' is now ' + t.status, 'success');
  render();
}

function renderTripForm() {
  var t = state.editingTripIdx >= 0 && state.editingTripIdx < state.data.trips.length ? state.data.trips[state.editingTripIdx] : {};
  var isEdit = state.editingTripIdx >= 0;
  var img = adminImageSrc(t.image);
  return '<div id="trip-form-overlay" class="modal-overlay" onclick="closeTripForm()"><div class="modal modal-lg" onclick="event.stopPropagation()">' +
    '<div class="modal-header"><h2>' + (isEdit ? 'Edit Trip' : 'New Trip') + '</h2><button type="button" class="modal-close" onclick="closeTripForm()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>' +
    '<form name="trip-form" class="modal-body" onsubmit="saveTrip(event)">' +
      '<div class="form-row-2">' +
        '<div class="form-group"><label class="form-label">Trip Name *</label><input name="name" class="form-input" value="' + esc(t.name || '') + '" required maxlength="80"></div>' +
        '<div class="form-group"><label class="form-label">Duration *</label><input name="duration" class="form-input" value="' + esc(t.duration || '') + '" placeholder="e.g. 1\u20132 days" required maxlength="40"></div>' +
      '</div>' +
      '<div class="form-row-3">' +
        '<div class="form-group"><label class="form-label">Price Display</label><input name="price" class="form-input" value="' + esc(t.price || '') + '" placeholder="Trip price" maxlength="40"></div>' +
        '<div class="form-group"><label class="form-label">Category/Slug</label><input name="category" class="form-input" value="' + esc(t.category || '') + '" placeholder="e.g. langano" required maxlength="40"></div>' +
        '<div class="form-group"><label class="form-label">Spots Left</label><input type="number" name="spotsLeft" class="form-input" value="' + (t.spotsLeft || '') + '" min="0"></div>' +
      '</div>' +
      '<div class="form-row-2">' +
        '<div class="form-group"><label class="form-label">Date</label><input name="date" class="form-input" value="' + esc(t.date || '') + '" placeholder="e.g. Jun 21\u201322" maxlength="60"></div>' +
        '<div class="form-group"><label class="form-label">Meeting Point</label><input name="start" class="form-input" value="' + esc(t.start || '') + '" maxlength="100"></div>' +
      '</div>' +
      '<div class="form-row-2">' +
        '<div class="form-group"><label class="form-label">Trip Image</label>' +
          '<div class="admin-image-preview" id="trip-image-preview">' + (img ? '<img src="' + esc(img) + '" alt="Current trip image">' : '<span>No image selected</span>') + '</div>' +
          '<input name="image" class="form-input" value="' + esc(t.image || '') + '" placeholder="Image URL or uploaded path" maxlength="500">' +
          '<input id="trip-image-file" type="file" class="form-input admin-file-input" accept="image/png,image/jpeg,image/webp" onchange="previewSelectedImage(this,\'trip-image-preview\')">' +
          '<span class="form-hint">Upload compresses to WebP before saving to Supabase Storage.</span>' +
        '</div>' +
        '<div class="form-group"><label class="form-label">Status</label><select name="status" class="form-input"><option value="active"' + (t.status === 'active' ? ' selected' : '') + '>Active</option><option value="hidden"' + (t.status === 'hidden' ? ' selected' : '') + '>Hidden</option><option value="full"' + (t.status === 'full' ? ' selected' : '') + '>Full</option></select></div>' +
      '</div>' +
      '<div class="form-group"><label class="form-label">Short Description *</label><textarea name="description" class="form-input" rows="2" maxlength="300" required>' + esc(t.description || '') + '</textarea><span class="form-hint">Max 300 characters. Shown on the destination card.</span></div>' +
      '<div class="form-group"><label class="form-label">What to Expect (one per line)</label><textarea name="expect" class="form-input" rows="4" placeholder="Line 1&#10;Line 2&#10;Line 3">' + esc((t.expect || []).join('\n')) + '</textarea><span class="form-hint">Each line becomes a bullet point in the trip details modal.</span></div>' +
      '<div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeTripForm()">Cancel</button><button type="submit" class="btn btn-primary">' + (isEdit ? 'Save Trip' : 'Add Trip') + '</button></div>' +
    '</form></div></div>';
}

// ==============================
// PACKAGES PAGE
// ==============================
function renderPackages() {
  var pkgs = state.data.packages;
  var keys = Object.keys(pkgs);
  var labels = { nativeDay:'Native Day Trip', nativeOvernight:'Native Overnight', foreignerDay:'Foreigner Day Trip', foreignerOvernight:'Foreigner Overnight' };
  var editing = state.editingPackages;
  var disabled = editing ? '' : ' disabled';

  var cards = keys.map(function(key) {
    var p = pkgs[key];
    var feats = (p.features || []).map(function(f, fi) {
      return '<div class="pkg-feature-row"><input class="form-input" value="' + esc(f) + '" onchange="updatePackageFeature(\'' + key + '\',' + fi + ',this.value)" maxlength="120"' + disabled + '>' + (editing ? '<button class="btn btn-sm btn-danger" onclick="removePackageFeature(\'' + key + '\',' + fi + ')" style="padding:6px 8px">' + iconSvg('x') + '</button>' : '') + '</div>';
    }).join('');
    return '<div class="card pkg-card ' + (editing ? 'editor-active' : 'editor-locked') + '">' +
      '<div class="pkg-header"><h3>' + esc(labels[key] || key) + '</h3><span class="badge badge-info">' + key + '</span></div>' +
      '<div class="form-row-2">' +
        '<div class="form-group"><label class="form-label">Package Name</label><input class="form-input" value="' + esc(p.name || '') + '" onchange="updatePackageField(\'' + key + '\',\'name\',this.value)" maxlength="80"' + disabled + '></div>' +
        '<div class="form-row-2" style="gap:8px"><div class="form-group"><label class="form-label">Price</label><input type="number" class="form-input" value="' + (p.price || '') + '" onchange="updatePackageField(\'' + key + '\',\'price\',parseFloat(this.value)||0)" min="0"' + disabled + '></div>' +
        '<div class="form-group"><label class="form-label">Currency</label><select class="form-input" onchange="updatePackageField(\'' + key + '\',\'currency\',this.value)"' + disabled + '><option value="ETB"' + (p.currency === 'ETB' ? ' selected' : '') + '>ETB</option><option value="USD"' + (p.currency === 'USD' ? ' selected' : '') + '>USD</option></select></div></div>' +
      '</div>' +
      '<div class="form-group"><label class="form-label">Features ' + (editing ? '<button class="btn btn-sm btn-secondary" onclick="addPackageFeature(\'' + key + '\')" style="margin-left:8px">+ Add</button>' : '') + '</label><div class="pkg-features-list">' + feats + '</div></div>' +
    '</div>';
  }).join('');

  return '<div class="page">' +
    '<div class="page-header"><div><h1 class="page-title">Packages</h1><p class="page-subtitle">Global pricing and features for all 4 package types. Changes affect all trips on the user site.</p></div><div class="page-actions">' + (editing ? '<button class="btn btn-secondary" onclick="cancelPackageEdit()">' + iconSvg('x') + ' Cancel</button><button class="btn btn-primary" onclick="savePackageChanges()">' + iconSvg('check') + ' Save Packages</button>' : '<button class="btn btn-primary" onclick="startPackageEdit()">' + iconSvg('edit') + ' Edit Packages</button>') + '</div></div>' +
    '<div class="packages-grid">' + cards + '</div>' +
  '</div>';
}

function startPackageEdit() { state.editingPackages = true; render(); }

function cancelPackageEdit() {
  state.editingPackages = false;
  discardUnsavedChanges();
}

function updatePackageField(key, field, val) {
  if (state.data.packages[key]) state.data.packages[key][field] = val;
}

function updatePackageFeature(key, idx, val) {
  if (state.data.packages[key] && state.data.packages[key].features) state.data.packages[key].features[idx] = val;
}

function addPackageFeature(key) {
  if (state.data.packages[key]) state.data.packages[key].features.push('');
  render();
}

function removePackageFeature(key, idx) {
  if (state.data.packages[key] && state.data.packages[key].features) state.data.packages[key].features.splice(idx, 1);
  render();
}

function savePackageChanges() {
  saveData();
  state.editingPackages = false;
  showToast('All package changes saved. User site will reflect on refresh.', 'success');
  render();
}

async function discardUnsavedChanges() {
  try {
    state.editingPackages = false;
    state.editingWebsite = false;
    if (supabaseClient) {
      await refreshDataFromSupabase();
    } else {
      state.data = loadData();
      render();
    }
    showToast('Unsaved changes discarded', 'success');
  } catch (err) {
    console.error('Could not discard changes:', err);
    state.data = loadData();
    showToast('Reloaded local saved data', 'success');
    render();
  }
}

async function resetGalleryDefaults() {
  var ok = await confirmAction({
    title:'Reset gallery to saved defaults?',
    message:'Restore gallery categories and images from Supabase defaults?',
    details:'Custom gallery rows in website content will be replaced. Uploaded files in Supabase Storage will stay there; only the website content list changes.',
    confirmText:'Reset Gallery',
    tone:'danger'
  });
  if (!ok) return;

  var defaults;
  try {
    defaults = await loadDefaultContent();
  } catch (err) {
    console.error('Could not load gallery defaults:', err);
    showToast('No Supabase defaults found. Run supabase-defaults-setup.sql first.', 'error');
    return;
  }

  state.data.galleryCategories = cloneValue(defaults.galleryCategories);
  state.data.galleryImages = cloneValue(defaults.galleryImages);
  state.galleryEditId = -1;
  state.galleryDraft = null;
  state.addingGalleryItem = false;
  saveData();
  showToast('Gallery restored to default images', 'success');
  render();
}

async function resetTripImagesDefaults() {
  var ok = await confirmAction({
    title:'Reset trip images?',
    message:'Restore trip images from Supabase defaults for matching trips?',
    details:'Trip text, prices, dates, and registrations will stay unchanged. Only matching trip image paths are replaced.',
    confirmText:'Reset Images',
    tone:'danger'
  });
  if (!ok) return;

  var defaults;
  try {
    defaults = await loadDefaultContent();
  } catch (err) {
    console.error('Could not load trip defaults:', err);
    showToast('No Supabase defaults found. Run supabase-defaults-setup.sql first.', 'error');
    return;
  }

  var defaultsByName = {};
  var defaultsByCategory = {};
  defaults.trips.forEach(function(t) {
    if (t.name) defaultsByName[t.name] = t.image;
    if (t.category) defaultsByCategory[t.category] = t.image;
  });
  state.data.trips.forEach(function(t) {
    if (t.category && defaultsByCategory[t.category]) t.image = defaultsByCategory[t.category];
    else if (defaultsByName[t.name]) t.image = defaultsByName[t.name];
  });
  saveData();
  showToast('Default trip images restored', 'success');
  render();
}

// ==============================
// GALLERY PAGE
// ==============================
function renderGallery() {
  var cats = state.data.galleryCategories;
  var catNames = {};
  cats.forEach(function(c){ catNames[c.slug] = c.name });
  var pendingNewCategoryHtml = '';

  if (state.addingGalleryItem && state.galleryDraft && (!state.galleryDraft.category || state.galleryDraft.category === '__new__')) {
    var pendingImg = adminImageSrc(state.galleryDraft.src);
    pendingNewCategoryHtml = '<div class="gallery-group gallery-group-draft">' +
      '<div class="gallery-group-header"><h2 class="gallery-group-title">New destination</h2><span class="gallery-group-count">Draft</span></div>' +
      '<div class="gallery-grid"><div class="gallery-card"><div class="gallery-edit-form">' +
        '<div class="admin-image-preview" id="gallery-image-preview">' + (pendingImg ? '<img src="' + esc(pendingImg) + '" alt="Gallery preview">' : '<span>No image selected</span>') + '</div>' +
        '<input class="form-input" placeholder="Image path or uploaded URL" value="' + esc(state.galleryDraft.src || '') + '" onchange="updateGalleryField(\'src\',this.value)">' +
        '<input id="gallery-image-file" type="file" class="form-input admin-file-input" accept="image/png,image/jpeg,image/webp" onchange="previewSelectedImage(this,\'gallery-image-preview\')">' +
        '<input class="form-input" placeholder="Place name" value="' + esc(state.galleryDraft.place || '') + '" onchange="updateGalleryField(\'place\',this.value)">' +
        renderGalleryCategoryControls(state.galleryDraft, cats) +
        '<div class="gallery-edit-actions"><button class="btn btn-sm btn-primary" onclick="saveGalleryItem()">' + iconSvg('check') + ' Save</button><button class="btn btn-sm btn-secondary" onclick="cancelGalleryEdit()">' + iconSvg('x') + ' Cancel</button></div>' +
      '</div></div></div>' +
    '</div>';
  }

  var groupsHtml = cats.map(function(cat) {
    var items = state.data.galleryImages.filter(function(g){ return g.category === cat.slug });
    var cards = items.map(function(g, gi) {
      var idx = state.data.galleryImages.indexOf(g);
      var item = state.galleryEditId === idx && state.galleryDraft ? state.galleryDraft : g;
      var img = adminImageSrc(item.src);
      if (state.galleryEditId === idx) {
        return '<div class="gallery-card"><div class="gallery-edit-form">' +
          '<div class="admin-image-preview" id="gallery-image-preview">' + (img ? '<img src="' + esc(img) + '" alt="Gallery preview">' : '<span>No image selected</span>') + '</div>' +
          '<input class="form-input" placeholder="Image path or uploaded URL" value="' + esc(item.src || '') + '" onchange="updateGalleryField(\'src\',this.value)">' +
          '<input id="gallery-image-file" type="file" class="form-input admin-file-input" accept="image/png,image/jpeg,image/webp" onchange="previewSelectedImage(this,\'gallery-image-preview\')">' +
          '<input class="form-input" placeholder="Place name" value="' + esc(item.place || '') + '" onchange="updateGalleryField(\'place\',this.value)">' +
          renderGalleryCategoryControls(item, cats) +
          '<div class="gallery-edit-actions"><button class="btn btn-sm btn-primary" onclick="saveGalleryItem()">' + iconSvg('check') + ' Save</button><button class="btn btn-sm btn-secondary" onclick="cancelGalleryEdit()">' + iconSvg('x') + ' Cancel</button></div>' +
        '</div></div>';
      }
      return '<div class="gallery-card">' +
        '<div class="gallery-img">' +
          (img ? '<img src="' + esc(img) + '" alt="' + esc(g.place || 'Gallery image') + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' : '') +
          '<div class="gallery-img-placeholder"' + (img ? ' style="display:none"' : '') + '><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span style="font-size:11px">' + esc((g.src || '').split('/').pop()) + '</span></div>' +
        '</div>' +
        '<div class="gallery-info"><div class="gallery-title">' + esc(g.place) + '</div><span class="gallery-location">' + esc(catNames[g.category] || g.category) + '</span></div>' +
        '<div class="gallery-actions">' +
          '<button class="btn btn-sm btn-secondary btn-icon-text" onclick="openGalleryEdit(' + idx + ')" title="Edit image">' + iconSvg('edit') + ' Edit</button>' +
          '<button class="btn btn-sm btn-danger btn-icon-text" onclick="deleteGalleryItem(' + idx + ')" title="Delete image">' + iconSvg('trash') + ' Delete</button>' +
        '</div>' +
      '</div>';
    }).join('');

    if (state.addingGalleryItem && state.galleryDraft && state.galleryDraft.category === cat.slug) {
      var draftImg = adminImageSrc(state.galleryDraft.src);
      cards += '<div class="gallery-card"><div class="gallery-edit-form">' +
        '<div class="admin-image-preview" id="gallery-image-preview">' + (draftImg ? '<img src="' + esc(draftImg) + '" alt="Gallery preview">' : '<span>No image selected</span>') + '</div>' +
        '<input class="form-input" placeholder="Image path or uploaded URL" value="' + esc(state.galleryDraft.src || '') + '" onchange="updateGalleryField(\'src\',this.value)">' +
        '<input id="gallery-image-file" type="file" class="form-input admin-file-input" accept="image/png,image/jpeg,image/webp" onchange="previewSelectedImage(this,\'gallery-image-preview\')">' +
        '<input class="form-input" placeholder="Place name" value="' + esc(state.galleryDraft.place || '') + '" onchange="updateGalleryField(\'place\',this.value)">' +
        renderGalleryCategoryControls(state.galleryDraft, cats) +
        '<div class="gallery-edit-actions"><button class="btn btn-sm btn-primary" onclick="saveGalleryItem()">' + iconSvg('check') + ' Save</button><button class="btn btn-sm btn-secondary" onclick="cancelGalleryEdit()">' + iconSvg('x') + ' Cancel</button></div>' +
      '</div></div>';
    }

    return '<div class="gallery-group">' +
      '<div class="gallery-group-header"><h2 class="gallery-group-title">' + esc(cat.name) + '</h2><span class="gallery-group-count">' + items.length + ' images</span><button class="btn btn-sm btn-danger btn-icon-text gallery-delete-section" onclick="deleteGallerySection(\'' + esc(cat.slug) + '\')" title="Delete this whole gallery destination">' + iconSvg('trash') + ' Delete Section</button></div>' +
      (cards ? '<div class="gallery-grid">' + cards + '</div>' : '<p class="text-muted" style="padding:12px">No images in this category.</p>') +
    '</div>';
  }).join('');

  return '<div class="page">' +
    '<div class="page-header"><div><h1 class="page-title">Gallery</h1><p class="page-subtitle">Manage gallery images grouped by destination</p></div><div class="page-actions"><button class="btn btn-secondary" onclick="resetGalleryDefaults()">Reset Defaults</button><button class="btn btn-primary" onclick="addGalleryItem()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Image</button></div></div>' +
    pendingNewCategoryHtml + groupsHtml +
  '</div>';
}

function addGalleryItem() {
  state.galleryDraft = { place:'', category:'__new__', src:'', active:true, newCategoryName:'', newCategorySlug:'' };
  state.galleryEditId = state.data.galleryImages.length;
  state.addingGalleryItem = true;
  render();
}

function openGalleryEdit(idx) {
  state.galleryEditId = idx;
  state.galleryDraft = Object.assign({}, state.data.galleryImages[idx]);
  state.addingGalleryItem = false;
  render();
}

function cancelGalleryEdit() {
  state.galleryEditId = -1;
  state.galleryDraft = null;
  state.addingGalleryItem = false;
  render();
}

function updateGalleryField(field, val) {
  if (!state.galleryDraft) state.galleryDraft = {};
  state.galleryDraft[field] = val;
  if (field === 'category') render();
}

async function saveGalleryItem() {
  var file = document.getElementById('gallery-image-file')?.files?.[0];
  var draft = Object.assign({ place:'', category:'', src:'', active:true }, state.galleryDraft || {});
  try {
    if (file) {
      draft.src = await uploadAdminImage(file, 'gallery');
    }
  } catch (err) {
    console.error('Gallery image upload failed:', err);
    showToast('Gallery image upload failed', 'error');
    return;
  }

  if (!draft.src) {
    showToast('Choose an image or paste an image URL before saving', 'error');
    return;
  }

  var categoryExists = state.data.galleryCategories.some(function(c) { return c.slug === draft.category; });
  if (!draft.category || draft.category === '__new__' || !categoryExists) {
    var categoryName = (draft.newCategoryName || draft.place || '').trim();
    if (!categoryName) {
      showToast('Add a destination name for this gallery image', 'error');
      return;
    }

    var categorySlug = fileSlug(draft.newCategorySlug || categoryName);
    var slugExists = state.data.galleryCategories.some(function(c) { return c.slug === categorySlug; });
    if (!slugExists) {
      state.data.galleryCategories.push({ slug:categorySlug, name:categoryName });
    }
    draft.category = categorySlug;
    if (!draft.place) draft.place = categoryName;
  }

  delete draft.newCategoryName;
  delete draft.newCategorySlug;

  if (state.addingGalleryItem) {
    state.data.galleryImages.push(draft);
  } else if (state.galleryEditId >= 0 && state.data.galleryImages[state.galleryEditId]) {
    state.data.galleryImages[state.galleryEditId] = draft;
  }

  saveData();
  state.galleryEditId = -1;
  state.galleryDraft = null;
  state.addingGalleryItem = false;
  showToast('Gallery image saved', 'success');
  render();
}

async function deleteGalleryItem(idx) {
  var item = state.data.galleryImages[idx];
  if (!item) return;
  var ok = await confirmAction({
    title:'Delete image?',
    message:'Remove this gallery image from website content?',
    details:'The image file in Supabase Storage is not deleted automatically.',
    confirmText:'Delete Image',
    tone:'danger'
  });
  if (!ok) return;
  state.data.galleryImages.splice(idx, 1);
  saveData();
  showToast('Image deleted', 'error');
  render();
}

async function deleteGallerySection(slug) {
  var cat = state.data.galleryCategories.find(function(c) { return c.slug === slug; });
  var count = state.data.galleryImages.filter(function(g) { return g.category === slug; }).length;
  var name = cat ? cat.name : slug;
  var ok = await confirmAction({
    title:'Delete gallery section?',
    message:'Delete the whole "' + name + '" gallery section?',
    details:[
      'This removes the destination from gallery filters and removes all ' + count + ' image(s) under it from website content.',
      'Uploaded files in Supabase Storage will not be deleted automatically.'
    ],
    confirmText:'Delete Section',
    tone:'danger'
  });
  if (!ok) return;

  state.data.galleryImages = state.data.galleryImages.filter(function(g) { return g.category !== slug; });
  state.data.galleryCategories = state.data.galleryCategories.filter(function(c) { return c.slug !== slug; });
  saveData();
  showToast('Gallery section deleted', 'error');
  render();
}

// ==============================
// WEBSITE CONTENT PAGE
// ==============================
function renderWebsite() {
  var w = state.data.website;
  var editing = state.editingWebsite;
  var disabled = editing ? '' : ' disabled';
  var rulesHtml = (w.rules || []).map(function(r, i) {
    return '<div class="web-field-row"><input class="form-input" value="' + esc(r) + '" onchange="updateRule(' + i + ',this.value)" maxlength="200"' + disabled + '>' + (editing ? '<button class="btn btn-sm btn-danger" onclick="removeRule(' + i + ')" style="padding:6px 8px">' + iconSvg('x') + '</button>' : '') + '</div>';
  }).join('');

  var faqHtml = (w.faq || []).map(function(f, i) {
    return '<div class="faq-edit-card"><div class="faq-edit-header"><input class="form-input" value="' + esc(f.q) + '" placeholder="Question" onchange="updateFaqQ(' + i + ',this.value)" maxlength="200"' + disabled + '>' + (editing ? '<button class="btn btn-sm btn-danger" onclick="removeFaq(' + i + ')" style="padding:6px 8px">' + iconSvg('x') + '</button>' : '') + '</div><textarea class="form-input" rows="2" placeholder="Answer" onchange="updateFaqA(' + i + ',this.value)" maxlength="500"' + disabled + '>' + esc(f.a || '') + '</textarea></div>';
  }).join('');

  return '<div class="page">' +
    '<div class="page-header"><div><h1 class="page-title">Website Content</h1><p class="page-subtitle">Edit text content shown on the public website</p></div><div class="page-actions">' + (editing ? '<button class="btn btn-secondary" onclick="cancelWebsiteEdit()">' + iconSvg('x') + ' Cancel</button><button class="btn btn-primary" onclick="saveWebsiteContent()">' + iconSvg('check') + ' Save Content</button>' : '<button class="btn btn-primary" onclick="startWebsiteEdit()">' + iconSvg('edit') + ' Edit Content</button>') + '</div></div>' +
    '<div class="settings-grid ' + (editing ? 'editor-active' : 'editor-locked') + '">' +
      '<div class="card"><h2 class="card-title">Brand & Contact</h2>' +
        '<div class="form-group"><label class="form-label">Website Name</label><input class="form-input" value="' + esc(w.name || '') + '" onchange="updateWeb(\'name\',this.value)" maxlength="60"' + disabled + '></div>' +
        '<div class="form-group"><label class="form-label">Tagline</label><input class="form-input" value="' + esc(w.tagline || '') + '" onchange="updateWeb(\'tagline\',this.value)" maxlength="100"' + disabled + '></div>' +
        '<div class="form-row-2"><div class="form-group"><label class="form-label">Contact Email</label><input class="form-input" value="' + esc(w.contactEmail || '') + '" onchange="updateWeb(\'contactEmail\',this.value)" maxlength="100"' + disabled + '></div>' +
        '<div class="form-group"><label class="form-label">Contact Phone</label><input class="form-input" value="' + esc(w.contactPhone || '') + '" onchange="updateWeb(\'contactPhone\',this.value)" maxlength="30"' + disabled + '></div></div>' +
        '<div class="form-group"><label class="form-label">Phone 2</label><input class="form-input" value="' + esc(w.contactPhone2 || '') + '" onchange="updateWeb(\'contactPhone2\',this.value)" maxlength="30"' + disabled + '></div>' +
      '</div>' +
      '<div class="card"><h2 class="card-title">Meeting Point</h2>' +
        '<div class="form-group"><label class="form-label">Location</label><input class="form-input" value="' + esc(w.meetingPoint || '') + '" onchange="updateWeb(\'meetingPoint\',this.value)" maxlength="200"' + disabled + '></div>' +
        '<div class="form-row-2"><div class="form-group"><label class="form-label">Meeting Time</label><input class="form-input" value="' + esc(w.meetingTime || '') + '" onchange="updateWeb(\'meetingTime\',this.value)" maxlength="20"' + disabled + '></div>' +
        '<div class="form-group"><label class="form-label">Departure Time</label><input class="form-input" value="' + esc(w.departureTime || '') + '" onchange="updateWeb(\'departureTime\',this.value)" maxlength="20"' + disabled + '></div></div>' +
      '</div>' +
      '<div class="card"><h2 class="card-title">Social Links</h2>' +
        '<div class="form-group"><label class="form-label">Instagram URL</label><input class="form-input" value="' + esc(w.instagram || '') + '" onchange="updateWeb(\'instagram\',this.value)" maxlength="300"' + disabled + '></div>' +
        '<div class="form-group"><label class="form-label">TikTok URL</label><input class="form-input" value="' + esc(w.tiktok || '') + '" onchange="updateWeb(\'tiktok\',this.value)" maxlength="300"' + disabled + '></div>' +
        '<div class="form-group"><label class="form-label">Telegram URL</label><input class="form-input" value="' + esc(w.telegram || '') + '" onchange="updateWeb(\'telegram\',this.value)" maxlength="300"' + disabled + '></div>' +
      '</div>' +
      '<div class="card card-full"><h2 class="card-title">About Section</h2>' +
        '<div class="form-group"><label class="form-label">About Text</label><textarea class="form-input" rows="3" onchange="updateWeb(\'aboutText\',this.value)" maxlength="1000"' + disabled + '>' + esc(w.aboutText || '') + '</textarea><span class="form-hint">Max 1000 characters</span></div>' +
      '</div>' +
      '<div class="card"><h2 class="card-title">Rules & Regulations ' + (editing ? '<button class="btn btn-sm btn-secondary" onclick="addRule()" style="margin-left:8px">+ Add Rule</button>' : '') + '</h2><div class="web-fields-list">' + (rulesHtml || '<p class="text-muted">No rules yet</p>') + '</div></div>' +
      '<div class="card card-full"><h2 class="card-title">FAQ ' + (editing ? '<button class="btn btn-sm btn-secondary" onclick="addFaq()" style="margin-left:8px">+ Add Question</button>' : '') + '</h2><div class="faq-list-edit">' + (faqHtml || '<p class="text-muted">No FAQ items yet</p>') + '</div></div>' +
    '</div></div>';
}

function startWebsiteEdit() { state.editingWebsite = true; render(); }

function cancelWebsiteEdit() {
  state.editingWebsite = false;
  discardUnsavedChanges();
}

function updateWeb(field, val) { state.data.website[field] = val; state.websiteChanged = true; }

function addRule() { state.data.website.rules.push(''); render(); }
function removeRule(i) { state.data.website.rules.splice(i, 1); render(); }
function updateRule(i, val) { state.data.website.rules[i] = val; }

function addFaq() { state.data.website.faq.push({ q:'', a:'' }); render(); }
function removeFaq(i) { state.data.website.faq.splice(i, 1); render(); }
function updateFaqQ(i, val) { state.data.website.faq[i].q = val; }
function updateFaqA(i, val) { state.data.website.faq[i].a = val; }

function saveWebsiteContent() {
  saveData();
  state.websiteChanged = false;
  state.editingWebsite = false;
  showToast('Website content saved. User site will reflect on refresh.', 'success');
  render();
}

// ==============================
// REGISTRATIONS PAGE
// ==============================
function renderRegFilters() {
  var regs = state.data.registrations;
  var destinations = {};
  var methods = {};
  regs.forEach(function(r) {
    if (r.destination) destinations[r.destination] = (destinations[r.destination] || 0) + 1;
    if (r.paymentMethod) methods[r.paymentMethod] = (methods[r.paymentMethod] || 0) + 1;
  });
  var destOpts = Object.keys(destinations).sort().map(function(d) {
    var sel = d === state.regFilterDestination ? ' selected' : '';
    return '<option value="' + esc(d) + '"' + sel + '>' + esc(d) + ' (' + destinations[d] + ')</option>';
  }).join('');
  var methodOpts = Object.keys(methods).sort().map(function(m) {
    var sel = m === state.regFilterPayment ? ' selected' : '';
    return '<option value="' + esc(m) + '"' + sel + '>' + esc(m) + ' (' + methods[m] + ')</option>';
  }).join('');
  var statuses = [['','All'],['pending','Pending'],['accepted','Accepted'],['rejected','Rejected'],['needs_review','Needs Review']];
  var statusOpts = statuses.map(function(s) {
    var sel = s[0] === state.regFilterStatus ? ' selected' : '';
    return '<option value="' + s[0] + '"' + sel + '>' + s[1] + '</option>';
  }).join('');

  return '<div class="reg-filters">' +
    '<div class="reg-filter-group"><label>Hike</label><select class="form-input" onchange="state.regFilterDestination=this.value;render()"><option value="">All</option>' + destOpts + '</select></div>' +
    '<div class="reg-filter-group"><label>Payment</label><select class="form-input" onchange="state.regFilterPayment=this.value;render()"><option value="">All</option>' + methodOpts + '</select></div>' +
    '<div class="reg-filter-group"><label>Status</label><select class="form-input" onchange="state.regFilterStatus=this.value;render()"><option value="">All</option>' + statusOpts + '</select></div>' +
    '<button class="btn btn-sm btn-secondary" onclick="state.regFilterDestination=\'\';state.regFilterPayment=\'\';state.regFilterStatus=\'\';render()" title="Clear filters">' + iconSvg('x') + ' Clear</button>' +
  '</div>';
}

function renderRegistrations() {
  var regs = state.data.registrations;
  if (state.regFilterDestination) regs = regs.filter(function(r){ return r.destination === state.regFilterDestination });
  if (state.regFilterPayment) regs = regs.filter(function(r){ return r.paymentMethod === state.regFilterPayment });
  if (state.regFilterStatus) regs = regs.filter(function(r){ return r.status === state.regFilterStatus });

  var pending = regs.filter(function(r){ return r.status === 'pending' }).length;
  var accepted = regs.filter(function(r){ return r.status === 'accepted' }).length;
  var rejected = regs.filter(function(r){ return r.status === 'rejected' }).length;
  var needsReview = regs.filter(function(r){ return r.status === 'needs_review' }).length;
  var refreshIcon = '<span class="' + (state.refreshingRegistrations ? 'spin-icon' : '') + '">' + iconSvg('refresh') + '</span>';
  var refreshText = state.refreshingRegistrations ? 'Refreshing' : 'Refresh';
  var refreshMeta = state.lastRegistrationRefresh ? '<span class="refresh-meta">Last checked ' + esc(state.lastRegistrationRefresh) + '</span>' : '';
  var refreshDisabled = state.refreshingRegistrations ? ' disabled' : '';

  var rows = regs.length === 0
    ? '<tr><td colspan="11" class="table-empty">No matching registrations.</td></tr>'
    : regs.map(function(r) {
        var cls = 'reg-row-' + r.status;
        var badge = registrationBadgeClass(r.status);
        var refId = r.hikeId || (r.id ? r.id.toString().slice(0, 8).toUpperCase() : '-');
        return '<tr class="' + cls + '">' +
          '<td class="td-id">' + esc(refId) + '</td>' +
          '<td class="td-name">' + esc(r.fullName || '-') + '</td>' +
          '<td>' + esc(r.destination || '-') + '</td>' +
          '<td>' + esc(r.package || '-') + '</td>' +
          '<td>' + esc(r.phone || '-') + '</td>' +
          '<td>' + esc(r.participantsCount || 1) + '</td>' +
          '<td class="td-price">' + esc(formatAdminPrice(r)) + '</td>' +
          '<td>' + esc(r.paymentMethod || '-') + '</td>' +
          '<td><span class="badge ' + badge + '">' + esc((r.status || 'pending').replace('_', ' ')) + '</span></td>' +
          '<td>' + formatDate(r.createdAt || r.submittedDate) + '</td>' +
          '<td class="td-actions">' +
            '<button class="btn btn-sm btn-secondary" onclick="viewReg(' + r.id + ')" title="View">' + iconSvg('eye') + '</button>' +
            (r.status !== 'accepted' ? '<button class="btn btn-sm btn-success" onclick="acceptReg(' + r.id + ')" title="Accept">' + iconSvg('check') + '</button>' : '') +
            (r.status !== 'needs_review' ? '<button class="btn btn-sm btn-secondary" onclick="needsReviewReg(' + r.id + ')" title="Review">' + iconSvg('zoom') + '</button>' : '') +
            (r.status !== 'rejected' ? '<button class="btn btn-sm btn-danger" onclick="rejectReg(' + r.id + ')" title="Reject">' + iconSvg('x') + '</button>' : '') +
          '</td></tr>';
      }).join('');

  var modalHtml = '';
  if (state.viewRegId != null) modalHtml = renderRegDetail(state.viewRegId);

  return '<div class="page">' +
    '<div class="page-header"><div><h1 class="page-title">Registrations</h1><p class="page-subtitle">Match payments using Hike ID, transaction ID, sender account, amount, and name.</p></div><div class="page-header-actions"><div class="page-header-badges"><span class="badge badge-warning">Pending: ' + pending + '</span><span class="badge badge-info">Review: ' + needsReview + '</span><span class="badge badge-success">Accepted: ' + accepted + '</span><span class="badge badge-danger">Rejected: ' + rejected + '</span></div><div class="refresh-control"><button class="btn btn-sm btn-primary btn-icon-text" onclick="refreshRegistrationsFromSupabase(true)"' + refreshDisabled + ' title="Check for new registrations">' + refreshIcon + ' ' + refreshText + '</button>' + refreshMeta + '</div></div></div>' +
    renderRegFilters() +
    '<div class="admin-note">Never approve only by name, phone, or sender account. The strongest match is Hike ID + transaction/reference ID + sender account/phone + amount.</div>' +
    '<div class="table-wrapper"><table class="data-table reg-table"><thead><tr><th>ID</th><th>Name</th><th>Destination</th><th>Package</th><th>Phone</th><th>Pax</th><th>Price</th><th>Payment</th><th>Status</th><th>Date</th><th class="th-actions">Actions</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    modalHtml +
  '</div>';
}

function renderUsers() {
  var users = state.data.users || [];
  var rows = users.length === 0
    ? '<tr><td colspan="6" class="table-empty">No users signed up yet.</td></tr>'
    : users.map(function(u) {
        var lastLogin = u.last_login ? formatDateTime(u.last_login) : '-';
        return '<tr>' +
          '<td><strong>' + esc(u.username || '-') + '</strong></td>' +
          '<td>' + esc(u.phone || '-') + '</td>' +
          '<td class="td-userid">' + esc(u.id || '-') + '</td>' +
          '<td>' + formatDate(u.created_at || u.createdAt) + '</td>' +
          '<td>' + lastLogin + '</td>' +
          '<td class="td-actions"><button class="btn btn-sm btn-danger" onclick="deleteUser(' + Number(u.id || 0) + ',\'' + esc(u.username) + '\')" title="Delete user">' + iconSvg('trash') + '</button></td>' +
        '</tr>';
      }).join('');

  return '<div class="page">' +
    '<div class="page-header"><div><h1 class="page-title">Users</h1><p class="page-subtitle">Website accounts created via signup</p></div><div class="page-header-actions"><span class="badge badge-info">Total: ' + users.length + '</span><button class="btn btn-sm btn-primary btn-icon-text" onclick="refreshRegistrationsFromSupabase(true)">' + iconSvg('refresh') + ' Refresh</button></div></div>' +
    '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Username</th><th>Phone</th><th>User ID</th><th>Signed Up</th><th>Last Login</th><th class="th-actions">Actions</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
  '</div>';
}

function acceptReg(id) {
  state.data.registrations = state.data.registrations.map(function(r){
    return r.id === id ? Object.assign({}, r, {
      status:'accepted',
      paymentStatus:'confirmed',
      adminMessage:r.adminMessage || 'Congratulations, your payment has been confirmed. You are accepted for this trip.'
    }) : r;
  });
  var reg = state.data.registrations.find(function(r){ return r.id === id });
  updateRegistrationStatus(id, 'accepted', reg ? reg.adminMessage : null);
  showToast('Registration accepted', 'success');
  render();
}

function needsReviewReg(id) {
  state.data.registrations = state.data.registrations.map(function(r){
    return r.id === id ? Object.assign({}, r, {
      status:'needs_review',
      paymentStatus:'submitted',
      adminMessage:r.adminMessage || 'Your payment needs manual review. Please contact us with your Hike ID.'
    }) : r;
  });
  var reg = state.data.registrations.find(function(r){ return r.id === id });
  updateRegistrationStatus(id, 'needs_review', reg ? reg.adminMessage : null);
  showToast('Marked as needs review', 'success');
  render();
}

async function rejectReg(id) {
  var ok = await confirmAction({
    title:'Reject registration?',
    message:'Mark this registration as rejected?',
    details:'The booking stays in Supabase for admin history, but the user will see it as rejected.',
    confirmText:'Reject',
    tone:'danger'
  });
  if (!ok) return;
  state.data.registrations = state.data.registrations.map(function(r){
    return r.id === id ? Object.assign({}, r, {
      status:'rejected',
      paymentStatus:'failed',
      adminMessage:r.adminMessage || 'Your registration was rejected. Please contact support.'
    }) : r;
  });
  var reg = state.data.registrations.find(function(r){ return r.id === id });
  updateRegistrationStatus(id, 'rejected', reg ? reg.adminMessage : null);
  showToast('Registration rejected', 'error');
  render();
}

function viewReg(id) { state.viewRegId = id; render(); }
function closeViewReg() { state.viewRegId = null; render(); }

function saveRegMessage(id) {
  var input = document.getElementById('admin-message-input');
  var message = input ? input.value.trim() : '';
  state.data.registrations = state.data.registrations.map(function(r){
    return r.id === id ? Object.assign({}, r, { adminMessage:message }) : r;
  });
  var reg = state.data.registrations.find(function(r){ return r.id === id });
  if (supabaseClient && adminSessionToken) {
    supabaseClient
      .rpc('admin_update_registration', {
        p_admin_token:adminSessionToken,
        p_registration_id:id,
        p_status:null,
        p_admin_message:message
      })
      .then(function(res) {
        if (res.error) {
          console.error('Admin message sync failed:', res.error);
          showToast('Message changed locally, but Supabase sync failed', 'error');
        } else {
          showToast('Message saved', 'success');
        }
      });
  } else {
    showToast('Message saved locally', 'success');
  }
  render();
}

function renderRegDetail(id) {
  var r = state.data.registrations.find(function(x){ return x.id === id });
  if (!r) return '';
  var badge = registrationBadgeClass(r.status);
  var notify = r.status === 'pending'
    ? '\u23F3 Waiting for payment confirmation.'
    : r.status === 'accepted'
      ? '\u2705 Congratulations, your payment has been confirmed. You are accepted for this trip.'
      : r.status === 'needs_review'
        ? '\u26A0\uFE0F Your payment needs manual review. Please contact us with your Hike ID.'
        : '\u274C Your registration was rejected. Please contact support.';
  return '<div class="modal-overlay" onclick="closeViewReg()"><div class="modal modal-xl" onclick="event.stopPropagation()">' +
    '<div class="modal-header"><h2>Registration Details</h2><button class="modal-close" onclick="closeViewReg()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>' +
    '<div class="modal-body"><div class="detail-grid reg-detail-grid">' +
      '<div class="detail-item"><span class="detail-label">Hike ID</span><span class="detail-value">' + esc(r.hikeId || '-') + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">Full Name</span><span class="detail-value">' + esc(r.fullName) + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">Username</span><span class="detail-value">' + esc(r.username || '-') + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">Phone</span><span class="detail-value">' + esc(r.phone || '-') + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">Age</span><span class="detail-value">' + (r.age || '-') + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">Gender</span><span class="detail-value">' + esc(r.gender || '-') + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">Number of People</span><span class="detail-value">' + esc(r.participantsCount || 1) + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">Destination</span><span class="detail-value">' + esc(r.destination) + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">Package</span><span class="detail-value">' + esc(r.package) + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">Fixed Price</span><span class="detail-value">' + esc(formatAdminPrice(r)) + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">Currency</span><span class="detail-value">' + esc(r.currency || 'ETB') + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">Payment Method</span><span class="detail-value">' + esc(r.paymentMethod || '-') + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">Sender Account / Phone</span><span class="detail-value">' + esc(r.senderAccount || '-') + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">Transaction ID</span><span class="detail-value">' + esc(r.transactionId || '-') + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">Payment Status</span><span class="detail-value">' + esc(r.paymentStatus || 'pending') + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">Status</span><span class="badge ' + badge + '">' + esc((r.status || 'pending').replace('_', ' ')) + '</span></div>' +
      '<div class="detail-item"><span class="detail-label">Admin Notes</span><span class="detail-value">' + esc(r.notes || 'None') + '</span></div>' +
    '</div>' +
    '<div class="admin-note" style="margin-top:16px">Manual match priority: Hike ID + transaction/reference ID + sender account/phone + amount. If anything looks duplicated or suspicious, mark Needs Review.</div>' +
    '<div class="detail-section"><h3>Message to user</h3><textarea class="form-input" id="admin-message-input" rows="3" placeholder="Optional message shown in user dashboard">' + esc(r.adminMessage || '') + '</textarea><div class="form-actions" style="margin-top:10px"><button class="btn btn-secondary" onclick="saveRegMessage(' + r.id + ')">Save Message</button></div></div>' +
    '<div class="detail-section"><h3>Notification Preview</h3><div class="notification-preview"><div class="notification-icon">' + notify.split(' ')[0] + '</div><div class="notification-text">' + esc(r.adminMessage || notify) + '</div></div></div>' +
    '<div class="modal-actions"><button class="btn btn-success" onclick="acceptReg(' + r.id + ');closeViewReg()">Accept</button><button class="btn btn-secondary" onclick="needsReviewReg(' + r.id + ');closeViewReg()">Needs Review</button><button class="btn btn-danger" onclick="rejectReg(' + r.id + ');closeViewReg()">Reject</button></div>' +
    '</div></div></div>';
}

// ==============================
// SETTINGS PAGE
// ==============================
async function deleteUser(userId, username) {
  var ok = await confirmAction({
    title:'Delete User',
    message:'Permanently delete "' + username + '"?',
    details:'Their public login account will be removed. Existing registrations stay for history, but they will no longer be able to sign in with this account.',
    confirmText:'Delete',
    tone:'danger'
  });
  if (!ok) return;
  if (!supabaseClient || !adminSessionToken) { showToast('Supabase admin session required', 'error'); return; }
  var res = await supabaseClient.rpc('admin_delete_site_user', {
    p_admin_token:adminSessionToken,
    p_user_id:userId
  });
  if (res.error) { showToast(res.error.message || 'Delete failed', 'error'); return; }
  state.data.users = state.data.users.filter(function(u){ return Number(u.id) !== Number(userId) });
  render();
  showToast('User deleted', 'success');
}

function renderSettings() {
  return '<div class="page">' +
    '<div class="page-header"><div><h1 class="page-title">Settings</h1><p class="page-subtitle">Admin profile and account</p></div></div>' +
    '<div class="settings-grid">' +
      '<div class="card"><h2 class="card-title">Admin Profile</h2>' +
        '<div class="form-group"><label class="form-label">Name</label><input class="form-input" id="set-name" value="' + esc(state.user?.name || '') + '"></div>' +
        '<div class="form-group"><label class="form-label">Username</label><input class="form-input" value="' + esc(state.user?.username || '') + '" disabled></div>' +
        '<div class="form-actions"><button class="btn btn-primary" onclick="saveProfile()">Save Profile</button></div>' +
      '</div>' +
      '<div class="card"><h2 class="card-title">Change Password</h2>' +
        '<div class="form-group"><label class="form-label">Current Password</label><input type="password" class="form-input" id="pw-old" placeholder="Enter current"></div>' +
        '<div class="form-group"><label class="form-label">New Password</label><input type="password" class="form-input" id="pw-new" placeholder="Enter new"></div>' +
        '<div class="form-group"><label class="form-label">Confirm</label><input type="password" class="form-input" id="pw-conf" placeholder="Confirm new"></div>' +
        '<div class="form-actions"><button class="btn btn-primary" onclick="changePassword()">Change Password</button></div>' +
      '</div>' +
      '<div class="card"><h2 class="card-title">Add Admin Login</h2>' +
        '<div class="form-group"><label class="form-label">Username</label><input type="text" class="form-input" id="new-admin-user" placeholder="choose a username"></div>' +
        '<div class="form-group"><label class="form-label">Password</label><input type="password" class="form-input" id="new-admin-pass" placeholder="choose a password"></div>' +
        '<div class="form-group"><label class="form-label">Display Name</label><input type="text" class="form-input" id="new-admin-name" placeholder="optional display name"></div>' +
        '<div class="form-actions"><button class="btn btn-primary" onclick="addAdminCred()">Add Admin</button></div>' +
      '</div>' +
    '</div></div>';
}

function addAdminCred() {
  var user = (document.getElementById('new-admin-user')?.value || '').trim();
  var pass = document.getElementById('new-admin-pass')?.value || '';
  var name = (document.getElementById('new-admin-name')?.value || '').trim() || user;
  if (!user || !pass) { showToast('Enter username and password', 'error'); return; }
  if (pass.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
  if (!supabaseClient || !adminSessionToken) { showToast('Supabase admin session required', 'error'); return; }

  supabaseClient.rpc('admin_add_admin', {
    p_admin_token:adminSessionToken,
    p_username:user,
    p_password:pass,
    p_display_name:name
  }).then(function(res) {
    if (res.error) { showToast(res.error.message || 'Could not add admin', 'error'); return; }
    if (!res.data || !res.data.success) {
      showToast((res.data && res.data.error) || 'Could not add admin', 'error');
      return;
    }
    showToast('Admin "' + user + '" added. They can login with that username and password.', 'success');
    document.getElementById('new-admin-user').value = '';
    document.getElementById('new-admin-pass').value = '';
    document.getElementById('new-admin-name').value = '';
  });
}

function saveProfile() {
  var n = document.getElementById('set-name')?.value;
  if (!state.user || !n) return;

  if (!supabaseClient || !adminSessionToken) { showToast('Supabase admin session required', 'error'); return; }

  supabaseClient.rpc('admin_update_profile', {
    p_admin_token:adminSessionToken,
    p_display_name:n
  }).then(function(res) {
    if (res.error || !res.data || !res.data.success) {
      showToast((res.data && res.data.error) || res.error?.message || 'Could not update profile', 'error');
      return;
    }
    saveAdminSession({ session_token:adminSessionToken, admin:res.data.admin });
    showToast('Profile saved', 'success');
    render();
  });
}

function changePassword() {
  var o = document.getElementById('pw-old')?.value;
  var n = document.getElementById('pw-new')?.value;
  var c = document.getElementById('pw-conf')?.value;
  if (!o || !n || !c) { showToast('Fill all fields', 'error'); return; }
  if (n !== c) { showToast('Passwords mismatch', 'error'); return; }
  if (n.length < 6) { showToast('Min 6 characters', 'error'); return; }

  if (!supabaseClient || !adminSessionToken) {
    showToast('Supabase admin session required', 'error');
    return;
  }

  supabaseClient.rpc('admin_change_password', {
    p_admin_token:adminSessionToken,
    p_current_password:o,
    p_new_password:n
  }).then(function(update) {
    if (update.error || !update.data || !update.data.success) {
      showToast((update.data && update.data.error) || update.error?.message || 'Could not change password', 'error');
      return;
    }

    showToast('Password changed', 'success');
    document.getElementById('pw-old').value = '';
    document.getElementById('pw-new').value = '';
    document.getElementById('pw-conf').value = '';
  });
}

async function resetAllData() {
  var ok = await confirmAction({
    title:'Reset all website content?',
    message:'Replace trips, gallery, packages, and website text with Supabase defaults?',
    details:'Registrations are not deleted. Uploaded files in Supabase Storage are not deleted. Current website content will be overwritten after saving.',
    confirmText:'Reset Content',
    tone:'danger'
  });
  if (!ok) return;

  var defaults;
  try {
    defaults = await loadDefaultContent();
  } catch (err) {
    console.error('Could not load defaults:', err);
    showToast('No Supabase defaults found. Run supabase-defaults-setup.sql first.', 'error');
    return;
  }

  var registrations = state.data.registrations || [];
  state.data = normalizeData(defaults);
  state.data.registrations = registrations;
  saveData();
  showToast('Data reset to defaults', 'success');
  render();
}

// ==============================
// EVENT DELEGATION (nav clicks)
// ==============================
document.addEventListener('click', function(e) {
  var nav = e.target.closest('[data-nav]');
  if (nav) { e.preventDefault(); navigateTo(nav.getAttribute('data-nav')); }
});

// ==============================
// HASH CHANGE
// ==============================
window.addEventListener('hashchange', function() { render(); });

// ==============================
// INIT
// ==============================
initAuth();
render();
restoreAdminSession();

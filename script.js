const hikingDestinations = [];
const galleryCategories = [];
const galleryImages = [];
const nativeFeatures = [];
const nativeOvernightFeatures = [];
const foreignerFeatures = [];
const foreignerOvernightFeatures = [];

let selectedDestination = "";
// Populated from saved website content when available.
var sharedPkgData = null;
let selectedPackage = "";
let activePackageView = "native";
let activeGalleryCategory = "all";

const destinationGrid = document.getElementById("destinationGrid");
const pricingGrid = document.getElementById("pricingGrid");
const selectedDestinationLabel = document.getElementById("selectedDestinationLabel");
const galleryFilters = document.getElementById("galleryFilters");
const galleryGrid = document.getElementById("galleryGrid");
const destinationSelect = document.getElementById("destinationSelect");
const packageInput = document.getElementById("packageInput");
const supabaseClient = window.ereftSupabaseClient ? window.ereftSupabaseClient() : null;
var inboxState = loadInboxState();

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPackagePrice(pkg) {
  if (!pkg || pkg.price == null || pkg.price === "") return "";
  var price = Number(pkg.price);
  var amount = Number.isFinite(price) ? price.toLocaleString() : String(pkg.price);
  if (pkg.currency === "USD") return "$" + amount;
  return amount + " " + (pkg.currency || "ETB");
}

function loadInboxState() {
  try {
    var saved = JSON.parse(localStorage.getItem("ereft_registration_inbox") || "null");
    if (saved && !saved.reference_code) {
      saved.reference_code = buildRegistrationReference(saved.lookup_token || saved.id || saved.submitted_date);
      localStorage.setItem("ereft_registration_inbox", JSON.stringify(saved));
    }
    return saved;
  } catch (_) {
    return null;
  }
}

function buildRegistrationReference(seed) {
  var fallback = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  var raw = String(seed || (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : fallback));
  var clean = raw.replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (!clean) clean = fallback.toUpperCase();
  return "ERF-" + clean.slice(-8).padStart(8, "0");
}

function saveInboxState(data) {
  inboxState = data;
  if (data) localStorage.setItem("ereft_registration_inbox", JSON.stringify(data));
  else localStorage.removeItem("ereft_registration_inbox");
  renderInboxButton();
}

function inboxCopy(status) {
  if (status === "accepted") {
    return {
      title:"Registration accepted",
      message:"Your registration has been accepted. Keep your phone available because Ereft Hiking may contact you with payment or meeting details.",
      icon:"A"
    };
  }
  if (status === "rejected") {
    return {
      title:"Registration rejected",
      message:"Your registration was not accepted. Contact Ereft Hiking directly if you need help or want to choose another trip.",
      icon:"R"
    };
  }
  return {
    title:"Registration pending",
    message:"Your registration is being reviewed. Check this inbox later for acceptance or rejection updates.",
    icon:"P"
  };
}

function normalizeInboxRow(row, payload) {
  row = row || {};
  payload = payload || {};
  var rowIdentifier = row.lookup_token || row.id;
  var payloadIdentifier = payload.lookup_token || payload.id;
  var referenceCode = row.reference_code ||
    (rowIdentifier ? buildRegistrationReference(rowIdentifier) : "") ||
    payload.reference_code ||
    buildRegistrationReference(payloadIdentifier);

  return {
    id: row.id || payload.id || Date.now(),
    lookup_token: row.lookup_token || payload.lookup_token || null,
    reference_code: referenceCode,
    status: row.status || payload.status || "pending",
    payment_status: row.payment_status || payload.payment_status || "pending",
    destination: row.destination || payload.destination || "",
    package_name: row.package_name || payload.package_name || "",
    submitted_date: row.submitted_date || new Date().toISOString().slice(0, 10),
    updated_at: row.updated_at || new Date().toISOString()
  };
}

function renderInboxButton() {
  var button = document.getElementById("registrationInboxButton");
  if (!button) return;
  if (!inboxState) {
    button.hidden = true;
    return;
  }

  button.hidden = false;
  button.title = inboxCopy(inboxState.status).title;
  var dot = button.querySelector(".inbox-dot");
  if (dot) dot.className = "inbox-dot " + (inboxState.status || "pending");
}

function renderInboxModal() {
  if (!inboxState) return;
  var copy = inboxCopy(inboxState.status);
  var icon = document.getElementById("inboxStatusIcon");
  if (icon) {
    icon.className = "inbox-status-icon " + (inboxState.status || "pending");
    icon.textContent = copy.icon;
  }
  document.getElementById("inboxStatusTitle").textContent = copy.title;
  document.getElementById("inboxStatusMessage").textContent = copy.message;
  document.getElementById("inboxReference").textContent = inboxState.reference_code || "-";
  document.getElementById("inboxDestination").textContent = inboxState.destination || "-";
  document.getElementById("inboxPackage").textContent = inboxState.package_name || "-";
  document.getElementById("inboxPayment").textContent = inboxState.payment_status || "pending";

  var refreshButton = document.getElementById("inboxRefreshButton");
  var refreshNote = document.getElementById("inboxRefreshNote");
  var canRefresh = !!(supabaseClient && inboxState.lookup_token);
  if (refreshButton) refreshButton.hidden = !canRefresh;
  if (refreshNote) {
    refreshNote.textContent = canRefresh
      ? "Refresh after payment or review to see the latest status."
      : "This inbox is saved on this device. New registrations will update here after review.";
  }
}

function openInboxModal() {
  if (!inboxState) return;
  renderInboxModal();
  openModal("inboxModal");
  refreshInboxStatus(false);
}

async function refreshInboxStatus(showMessage) {
  if (!inboxState) return;
  if (!supabaseClient || !inboxState.lookup_token) {
    renderInboxButton();
    renderInboxModal();
    if (showMessage) showSiteNotice("Your status is saved here. Please check again later.", "info");
    return;
  }

  var result = await supabaseClient.rpc("get_registration_status", {
    p_lookup_token: inboxState.lookup_token
  });

  if (result.error) {
    if (showMessage) showSiteNotice("We could not refresh the status right now. Please try again later.", "error");
    return;
  }

  var row = Array.isArray(result.data) ? result.data[0] : result.data;
  if (row) {
    saveInboxState(Object.assign({}, inboxState, normalizeInboxRow(row, inboxState)));
    renderInboxModal();
    if (showMessage) showSiteNotice("Inbox status refreshed.", "success");
  }
}

function clearInbox() {
  saveInboxState(null);
  closeModals();
  showSiteNotice("Inbox cleared on this device.", "success");
}

function renderSuccessReference() {
  var ref = document.getElementById("successReferenceId");
  if (!ref) return;
  if (!inboxState || !inboxState.reference_code) {
    ref.hidden = true;
    ref.textContent = "";
    return;
  }
  ref.hidden = false;
  ref.textContent = "Reference ID: " + inboxState.reference_code;
}

function findTrip(name) {
  return hikingDestinations.find(trip => trip.name === name) || hikingDestinations[0];
}

function renderDestinations() {
  if (!hikingDestinations.length) {
    destinationGrid.innerHTML = '<div class="empty-state">Trips are not available right now. Please check again soon.</div>';
    return;
  }

  destinationGrid.innerHTML = hikingDestinations.map((trip) => `
    <article class="destination-card fade-up">
      <div class="destination-image">
        ${trip.image ? `<img src="${esc(trip.image)}" alt="${esc(trip.name)} trip photo" loading="lazy" decoding="async">` : ""}
        <span class="duration-badge">${esc(trip.duration || "Trip")}</span>
      </div>
      <div class="destination-body">
        <h3>${esc(trip.name)}</h3>
        <p>${esc(trip.description || "")}</p>
        <div class="card-info-row">
          <span class="card-date">${esc(trip.date || "")}</span>
          <span class="card-spots">${Number(trip.spotsLeft || 0)} spots left</span>
        </div>
        <div class="card-actions">
          <button class="card-details" data-destination="${esc(trip.name)}">View Details</button>
          <button class="card-register" data-destination="${esc(trip.name)}">Packages</button>
        </div>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".card-register").forEach((button) => {
    button.addEventListener("click", () => {
      selectedDestination = button.dataset.destination;
      updateSelectedDestination();
      closeModals();
      scrollToSection("register");
    });
  });

  document.querySelectorAll(".card-details").forEach((button) => {
    button.addEventListener("click", () => openTripDetails(button.dataset.destination));
  });
}

function updateSelectedDestination() {
  if (!selectedDestination && hikingDestinations[0]) selectedDestination = hikingDestinations[0].name;
  selectedDestinationLabel.textContent = selectedDestination || "No destination selected";
  if (destinationSelect) destinationSelect.value = selectedDestination;
}

function renderPackageCards() {
  var nd = sharedPkgData ? sharedPkgData.nativeDay : null;
  var no = sharedPkgData ? sharedPkgData.nativeOvernight : null;
  var fd = sharedPkgData ? sharedPkgData.foreignerDay : null;
  var fo = sharedPkgData ? sharedPkgData.foreignerOvernight : null;

  function card(pkg, features, featured) {
    if (!pkg || !pkg.name) return "";
    var price = formatPackagePrice(pkg);
    var list = (features || []).map(function(item) { return '<li>' + esc(item) + '</li>'; }).join("");
    return '<article class="pricing-card' + (featured ? ' featured' : '') + '">' +
      '<h3>' + esc(pkg.name) + '</h3>' +
      (pkg.sub ? '<p>' + esc(pkg.sub) + '</p>' : '') +
      (price ? '<div class="price">' + esc(price) + ' <small>/ person</small></div>' : '') +
      '<ul class="check-list compact">' + list + '</ul>' +
      '<button class="btn btn-orange full choose-package" data-package="' + esc(pkg.name) + '">Choose Package</button>' +
    '</article>';
  }

  pricingGrid.className = "pricing-grid " + activePackageView;
  pricingGrid.innerHTML = activePackageView === "native"
    ? card(nd, nativeFeatures, true) + card(no, nativeOvernightFeatures, false)
    : card(fd, foreignerFeatures, true) + card(fo, foreignerOvernightFeatures, false);

  if (!pricingGrid.innerHTML) {
    pricingGrid.className = "pricing-grid";
    pricingGrid.innerHTML = '<div class="empty-state">Packages are not available right now. Please check again soon.</div>';
    return;
  }

  document.querySelectorAll(".choose-package").forEach((button) => {
    button.addEventListener("click", () => {
      selectedPackage = button.dataset.package;
      openRegistrationModal();
    });
  });
}

function renderDestinationOptions() {
  destinationSelect.innerHTML = hikingDestinations.map(trip => `<option value="${esc(trip.name)}">${esc(trip.name)}</option>`).join("");
  destinationSelect.value = selectedDestination;
}

function renderGalleryFilters() {
  const buttons = [{ slug: "all", name: "All" }, ...galleryCategories];
  galleryFilters.innerHTML = buttons.map(cat => `
    <button class="filter-btn ${cat.slug === activeGalleryCategory ? "active" : ""}" data-category="${esc(cat.slug)}">${esc(cat.name)}</button>
  `).join("");

  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      activeGalleryCategory = button.dataset.category;
      renderGalleryFilters();
      renderGallery();
    });
  });
}

function thumbPath(src) {
  if (!src) return "";
  if (/^https?:/i.test(src)) return src;
  return src.replace(/\.(jpg|jpeg|png)$/i, ".webp").replace(/\/([^/]+)$/, "/thumb/$1");
}

function renderGallery() {
  const items = activeGalleryCategory === "all"
    ? galleryImages
    : galleryImages.filter(img => img.category === activeGalleryCategory);

  if (!items.length) {
    galleryGrid.innerHTML = '<div class="empty-state">No gallery images are published yet.</div>';
    return;
  }

  galleryGrid.innerHTML = items.map((img) => `
    <button class="gallery-item" data-src="${esc(img.src)}" data-place="${esc(img.place)}">
      <img src="${esc(thumbPath(img.src))}" alt="${esc(img.place)} gallery photo" loading="lazy" decoding="async">
      <span>${esc(img.place)}</span>
    </button>
  `).join("");

  document.querySelectorAll(".gallery-item").forEach((item) => {
    item.addEventListener("click", () => openLightbox(item.dataset.src, item.dataset.place));
  });
}

function openTripDetails(name) {
  const trip = findTrip(name);
  if (!trip) {
    showSiteNotice("No trip is selected yet.", "error");
    return;
  }
  document.getElementById("tripDetailImage").src = trip.image;
  document.getElementById("tripDetailImage").alt = `${trip.name} hiking image`;
  document.getElementById("tripDetailTitle").textContent = trip.name;
  document.getElementById("tripDetailDescription").textContent = trip.description;
  document.getElementById("tripDetailDuration").textContent = trip.duration;
  document.getElementById("tripDetailStart").textContent = trip.start || "Not specified";
  document.getElementById("tripExpectList").innerHTML = (trip.expect || []).map(item => `<li>${esc(item)}</li>`).join("");
  const features = activePackageView === "native" ? nativeFeatures : foreignerFeatures;
  document.getElementById("tripIncludedList").innerHTML = features.map(item => `<li>${esc(item)}</li>`).join("");
  selectedDestination = trip.name;
  updateSelectedDestination();
  openModal("tripDetailsModal");
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModals() {
  document.querySelectorAll(".modal.open").forEach(modal => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  });
  document.body.classList.remove("modal-open");
}

function showSiteNotice(message, type) {
  var old = document.querySelector(".site-notice");
  if (old) old.remove();
  var notice = document.createElement("div");
  var noticeType = type || "success";
  var title = noticeType === "error" ? "Something went wrong" : noticeType === "info" ? "Notice" : "Done";
  var icon = noticeType === "error" ? "!" : noticeType === "info" ? "i" : "✓";
  notice.className = "site-notice site-notice-" + noticeType;
  notice.setAttribute("role", noticeType === "error" ? "alert" : "status");

  var iconEl = document.createElement("span");
  iconEl.className = "site-notice-icon";
  iconEl.textContent = icon;

  var copy = document.createElement("span");
  copy.className = "site-notice-copy";

  var titleEl = document.createElement("strong");
  titleEl.textContent = title;

  var msgEl = document.createElement("span");
  msgEl.textContent = message;

  copy.appendChild(titleEl);
  copy.appendChild(msgEl);
  notice.appendChild(iconEl);
  notice.appendChild(copy);
  document.body.appendChild(notice);
  setTimeout(function() { notice.remove(); }, 3600);
}

function openRegistrationModal() {
  if (!hikingDestinations.length) {
    showSiteNotice("Trips are not available right now. Please check again soon.", "error");
    return;
  }
  if (!selectedPackage) {
    showSiteNotice("Choose a package first.", "error");
    return;
  }
  renderDestinationOptions();
  destinationSelect.value = selectedDestination;
  packageInput.value = selectedPackage;
  openModal("registrationModal");
}

function openLightbox(src, place) {
  const lightbox = document.getElementById("lightbox");
  document.getElementById("lightboxImage").src = src;
  document.getElementById("lightboxCaption").textContent = place;
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.getElementById("lightboxImage").src = "";
}

function scrollToSection(id, updateHash = true) {
  const el = document.getElementById(id);
  if (!el) return;
  const header = document.querySelector(".site-header");
  const headerH = header ? header.offsetHeight : 78;
  const offset = id === "register" ? 50 : 0;
  const top = el.getBoundingClientRect().top + window.scrollY - headerH + offset;
  window.scrollTo({ top, behavior: "smooth" });
  if (updateHash) history.replaceState(null, "", "#" + id);
}

function setupNavigation() {
  document.querySelectorAll(".main-nav a, .mobile-nav-item").forEach(link => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        scrollToSection(href.slice(1));
      }
    });
  });
}

function setupActiveNavOnScroll() {
  const sections = document.querySelectorAll(".section-anchor");
  const navLinks = document.querySelectorAll(".main-nav a");
  const mobileLinks = document.querySelectorAll(".mobile-nav-item");
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === "#" + id));
        mobileLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === "#" + id));
      }
    });
  }, { rootMargin: "-38% 0px -55% 0px", threshold: 0 });

  sections.forEach(section => observer.observe(section));
}

function setupFadeUpAnimations() {
  const els = document.querySelectorAll(".fade-up, .destination-card");
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -55px 0px", threshold: 0.08 });

  els.forEach(el => observer.observe(el));
}

function setupNavSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href === "#" || href === "") return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        scrollToSection(href.slice(1));
      }
    });
  });
}

function setupFormsAndModals() {
  document.querySelectorAll(".signup-open").forEach(btn => btn.addEventListener("click", () => openModal("signupModal")));
  var inboxButton = document.getElementById("registrationInboxButton");
  if (inboxButton) inboxButton.addEventListener("click", openInboxModal);
  document.querySelectorAll("[data-close-modal]").forEach(btn => btn.addEventListener("click", closeModals));
  document.querySelectorAll(".modal").forEach(modal => modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModals();
  }));

  const destinationSelectEl = document.getElementById("destinationSelect");
  destinationSelectEl.addEventListener("change", () => {
    selectedDestination = destinationSelectEl.value;
    updateSelectedDestination();
  });

  document.getElementById("tripRegisterBtn").addEventListener("click", () => {
    closeModals();
    scrollToSection("register");
  });

  document.getElementById("signupForm").addEventListener("submit", (e) => {
    e.preventDefault();
    closeModals();
    openModal("successModal");
  });

  document.getElementById("registrationForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await submitRegistration(e.currentTarget);
  });

  document.querySelectorAll(".toggle-option").forEach(button => {
    button.addEventListener("click", () => {
      activePackageView = button.dataset.packageView;
      document.querySelectorAll(".toggle-option").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      renderPackageCards();
    });
  });

  document.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
  document.getElementById("lightbox").addEventListener("click", (e) => {
    if (e.target.id === "lightbox") closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeModals(); closeLightbox(); }
  });
}

function setupFaqAccordion() {
  document.querySelectorAll(".faq-question").forEach(btn => {
    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".faq-question").forEach(q => q.setAttribute("aria-expanded", "false"));
      if (!isOpen) btn.setAttribute("aria-expanded", "true");
    });
  });
}

function applySharedData(shared) {
  if (!shared) return;

  if (Array.isArray(shared.trips)) {
    hikingDestinations.length = 0;
    shared.trips.forEach(function(t) {
      if (!t.status || t.status === 'active') hikingDestinations.push(t);
    });
  }

  if (Array.isArray(shared.galleryCategories)) {
    galleryCategories.length = 0;
    shared.galleryCategories.forEach(function(c) { galleryCategories.push(c) });
  }

  if (Array.isArray(shared.galleryImages)) {
    galleryImages.length = 0;
    shared.galleryImages.forEach(function(g) {
      if (g.active !== false) galleryImages.push(g);
    });
  }

  if (shared.packages) {
    sharedPkgData = shared.packages;
    var p = shared.packages;
    if (p.nativeDay && p.nativeDay.features) {
      nativeFeatures.length = 0;
      p.nativeDay.features.forEach(function(f) { nativeFeatures.push(f) });
    }
    if (p.nativeOvernight && p.nativeOvernight.features) {
      nativeOvernightFeatures.length = 0;
      p.nativeOvernight.features.forEach(function(f) { nativeOvernightFeatures.push(f) });
    }
    if (p.foreignerDay && p.foreignerDay.features) {
      foreignerFeatures.length = 0;
      p.foreignerDay.features.forEach(function(f) { foreignerFeatures.push(f) });
    }
    if (p.foreignerOvernight && p.foreignerOvernight.features) {
      foreignerOvernightFeatures.length = 0;
      p.foreignerOvernight.features.forEach(function(f) { foreignerOvernightFeatures.push(f) });
    }
  }

  if (shared.website) {
    var w = shared.website;
    var tagline = document.querySelector('.brand-text small');
    if (tagline && w.tagline) tagline.textContent = w.tagline;
    var aboutP = document.querySelector('.main-about p');
    if (aboutP && w.aboutText) aboutP.textContent = w.aboutText;
    var rulesList = document.querySelector('.rules-list');
    if (rulesList && w.rules) {
      rulesList.innerHTML = w.rules.map(function(r) { return '<li>' + esc(r) + '</li>' }).join('');
    }
      var footerContact = document.querySelectorAll('.contact-phone, .footer-links-col a[href^="tel"]');
    if (footerContact.length > 0 && w.contactPhone) {
      footerContact[0].textContent = w.contactPhone;
      footerContact[0].href = 'tel:' + w.contactPhone.replace(/\s+/g, '');
    }
    if (footerContact.length > 1 && w.contactPhone2) {
      footerContact[1].textContent = w.contactPhone2;
      footerContact[1].href = 'tel:' + w.contactPhone2.replace(/\s+/g, '');
    }
  }
}

async function loadSharedData() {
  if (supabaseClient) {
    var response = await supabaseClient
      .from('site_content')
      .select('payload')
      .eq('id', 'main')
      .maybeSingle();

    if (response.error) throw response.error;
    if (response.data && response.data.payload && Object.keys(response.data.payload).length) {
      applySharedData(response.data.payload);
    }
    return;
  }

  var sharedRaw = localStorage.getItem('ereft_hiking_data');
  if (sharedRaw) applySharedData(JSON.parse(sharedRaw));
}

async function submitRegistration(form) {
  if (!destinationSelect.value || !packageInput.value) {
    showSiteNotice("Choose a destination and package before submitting.", "error");
    return;
  }

  var localReferenceCode = buildRegistrationReference();
  var payload = {
    full_name: document.getElementById("fullName").value.trim(),
    age: Number(document.getElementById("age").value),
    phone: document.getElementById("phone").value.trim(),
    gender: document.getElementById("gender").value,
    destination: destinationSelect.value,
    package_name: packageInput.value,
    payment_method: document.getElementById("paymentMethod").value,
    payment_status: "pending",
    status: "pending"
  };

  try {
    var inboxRow = null;
    if (supabaseClient) {
      var rpcResponse = await supabaseClient.rpc('create_registration', {
        p_full_name: payload.full_name,
        p_phone: payload.phone,
        p_age: payload.age,
        p_gender: payload.gender,
        p_destination: payload.destination,
        p_package_name: payload.package_name,
        p_payment_method: payload.payment_method
      });

      if (!rpcResponse.error && rpcResponse.data) {
        inboxRow = Array.isArray(rpcResponse.data) ? rpcResponse.data[0] : rpcResponse.data;
      } else {
        var response = await supabaseClient.from('registrations').insert(payload);
        if (response.error) throw response.error;
        inboxRow = Object.assign({}, payload, {
          id: Date.now(),
          reference_code: localReferenceCode,
          submitted_date: new Date().toISOString().slice(0, 10)
        });
      }
    } else {
      var saved = JSON.parse(localStorage.getItem('ereft_hiking_registrations') || '[]');
      inboxRow = Object.assign({}, payload, {
        id: Date.now(),
        reference_code: localReferenceCode,
        status: "pending",
        payment_status: "pending",
        submittedDate: new Date().toISOString().slice(0, 10)
      });
      saved.push(Object.assign({}, inboxRow, {
        fullName: payload.full_name,
        package: payload.package_name
      }));
      localStorage.setItem('ereft_hiking_registrations', JSON.stringify(saved));
    }

    saveInboxState(normalizeInboxRow(inboxRow, Object.assign({}, payload, {
      reference_code: localReferenceCode
    })));
    closeModals();
    renderSuccessReference();
    openModal("successModal");
    form.reset();
  } catch (error) {
    console.error('Registration failed:', error);
    showSiteNotice('Your registration could not be submitted. Please try again or contact Ereft Hiking directly.', 'error');
  }
}

async function initSite() {
  try {
    await loadSharedData();
  } catch(e) {
    console.warn('Website content load issue:', e);
    showSiteNotice('Some website content could not load. Please refresh the page.', 'error');
  }

  renderDestinations();
  renderPackageCards();
  renderDestinationOptions();
  renderGalleryFilters();
  renderGallery();
  setupNavigation();
  setupFormsAndModals();
  setupActiveNavOnScroll();
  setupFadeUpAnimations();
  setupNavSmoothScroll();
  setupFaqAccordion();
  updateSelectedDestination();
  renderInboxButton();
  refreshInboxStatus(false);
}

initSite();

window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("loadingScreen").classList.add("hidden");
  }, 400);
  if (window.location.hash) {
    setTimeout(() => scrollToSection(window.location.hash.slice(1), false), 60);
  }
});

// Fallback: hide loading after 5s even if load event fails
setTimeout(() => {
  const ls = document.getElementById("loadingScreen");
  if (ls && !ls.classList.contains("hidden")) ls.classList.add("hidden");
}, 5000);

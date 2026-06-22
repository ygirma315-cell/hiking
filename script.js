const hikingDestinations = [
  {
    "name": "Langano",
    "duration": "1–2 days",
    "price": "4,000 ETB",
    "image": "assets/hikings/langano.webp",
    "description": "A relaxing short trip with lake views, photography, games, and group fun.",
    "category": "langano",
    "start": "Addis Ababa",
    "expect": [
      "Lake scenery and relaxed outdoor time",
      "Photography moments and group activities",
      "Easy trip style for friends and first-time hikers",
      "Refreshments and simple travel support"
    ]
  },
  {
    "name": "Wenchi Crater Lake",
    "duration": "1 day",
    "price": "4,000 ETB",
    "image": "assets/hikings/wenchi.webp",
    "description": "Green scenery, crater lake views, fresh air, and peaceful walking routes.",
    "category": "wenchi",
    "start": "Addis Ababa",
    "expect": [
      "Crater lake views and fresh highland air",
      "Peaceful walking routes and nature stops",
      "Group photos in scenic viewpoints",
      "Friendly guide support during the trip"
    ]
  },
  {
    "name": "Abijata Shala",
    "duration": "1–2 days",
    "price": "4,000 ETB",
    "image": "assets/hikings/abijata-shala.webp",
    "description": "Open landscapes, lake scenery, group photos, and a simple outdoor escape.",
    "category": "abijata-shala",
    "start": "Addis Ababa",
    "expect": [
      "Wide lake landscapes and open views",
      "Simple outdoor escape from the city",
      "Group photos and easy nature moments",
      "Organized transport and schedule"
    ]
  },
  {
    "name": "Afar Doho & Benuna Village",
    "duration": "2 days",
    "price": "4,000 ETB",
    "image": "assets/hikings/afar-doho-benuna.webp",
    "description": "Warm cultural experience, lodge moments, local scenery, and guided travel.",
    "category": "afar-doho-benuna",
    "start": "Addis Ababa",
    "expect": [
      "Warm Afar scenery and village experience",
      "Relaxed lodge moments and outdoor views",
      "Cultural stops with respectful guidance",
      "Photography and group travel energy"
    ]
  },
  {
    "name": "Doho Lodge & Harar",
    "duration": "3 days",
    "price": "4,000 ETB",
    "image": "assets/hikings/doho-harar.webp",
    "description": "A mix of lodge relaxation, Harar culture, traditional scenes, and photography.",
    "category": "doho-harar",
    "start": "Addis Ababa",
    "expect": [
      "Lodge relaxation and travel comfort",
      "Harar culture and traditional scenery",
      "Photo-friendly group moments",
      "Guided schedule from start to finish"
    ]
  },
  {
    "name": "Insisaal",
    "duration": "1 day",
    "price": "4,000 ETB",
    "image": "assets/hikings/langano.webp",
    "description": "A scenic day trip with beautiful landscapes and group adventure.",
    "category": "insisaal",
    "start": "Addis Ababa",
    "expect": [
      "Scenic landscapes and nature views",
      "Group hiking and outdoor fun",
      "Photography moments",
      "Guided travel and refreshments"
    ]
  }
];

const galleryCategories = [
  {
    "slug": "afar-doho-benuna",
    "name": "Afar Doho & Benuna Village"
  },
  {
    "slug": "doho-harar",
    "name": "Doho Lodge & Harar"
  },
  {
    "slug": "langano",
    "name": "Langano"
  },
  {
    "slug": "abijata-shala",
    "name": "Abijata Shala"
  },
  {
    "slug": "wenchi",
    "name": "Wenchi Crater Lake"
  }
];

const galleryImages = [
  {
    "place": "Afar Doho & Benuna Village",
    "category": "afar-doho-benuna",
    "src": "assets/gallery/afar-doho-benuna/afar-doho-benuna-01.jpg"
  },
  {
    "place": "Afar Doho & Benuna Village",
    "category": "afar-doho-benuna",
    "src": "assets/gallery/afar-doho-benuna/afar-doho-benuna-02.jpg"
  },
  {
    "place": "Afar Doho & Benuna Village",
    "category": "afar-doho-benuna",
    "src": "assets/gallery/afar-doho-benuna/afar-doho-benuna-03.jpg"
  },
  {
    "place": "Afar Doho & Benuna Village",
    "category": "afar-doho-benuna",
    "src": "assets/gallery/afar-doho-benuna/afar-doho-benuna-04.jpg"
  },
  {
    "place": "Afar Doho & Benuna Village",
    "category": "afar-doho-benuna",
    "src": "assets/gallery/afar-doho-benuna/afar-doho-benuna-05.jpg"
  },
  {
    "place": "Afar Doho & Benuna Village",
    "category": "afar-doho-benuna",
    "src": "assets/gallery/afar-doho-benuna/afar-doho-benuna-06.jpg"
  },
  {
    "place": "Afar Doho & Benuna Village",
    "category": "afar-doho-benuna",
    "src": "assets/gallery/afar-doho-benuna/afar-doho-benuna-07.jpg"
  },
  {
    "place": "Afar Doho & Benuna Village",
    "category": "afar-doho-benuna",
    "src": "assets/gallery/afar-doho-benuna/afar-doho-benuna-08.jpg"
  },
  {
    "place": "Afar Doho & Benuna Village",
    "category": "afar-doho-benuna",
    "src": "assets/gallery/afar-doho-benuna/afar-doho-benuna-09.jpg"
  },
  {
    "place": "Doho Lodge & Harar",
    "category": "doho-harar",
    "src": "assets/gallery/doho-harar/doho-harar-01.jpg"
  },
  {
    "place": "Doho Lodge & Harar",
    "category": "doho-harar",
    "src": "assets/gallery/doho-harar/doho-harar-02.jpg"
  },
  {
    "place": "Doho Lodge & Harar",
    "category": "doho-harar",
    "src": "assets/gallery/doho-harar/doho-harar-03.jpg"
  },
  {
    "place": "Doho Lodge & Harar",
    "category": "doho-harar",
    "src": "assets/gallery/doho-harar/doho-harar-04.jpg"
  },
  {
    "place": "Doho Lodge & Harar",
    "category": "doho-harar",
    "src": "assets/gallery/doho-harar/doho-harar-05.jpg"
  },
  {
    "place": "Doho Lodge & Harar",
    "category": "doho-harar",
    "src": "assets/gallery/doho-harar/doho-harar-06.jpg"
  },
  {
    "place": "Doho Lodge & Harar",
    "category": "doho-harar",
    "src": "assets/gallery/doho-harar/doho-harar-07.jpg"
  },
  {
    "place": "Doho Lodge & Harar",
    "category": "doho-harar",
    "src": "assets/gallery/doho-harar/doho-harar-08.jpg"
  },
  {
    "place": "Doho Lodge & Harar",
    "category": "doho-harar",
    "src": "assets/gallery/doho-harar/doho-harar-09.jpg"
  },
  {
    "place": "Langano",
    "category": "langano",
    "src": "assets/gallery/langano/langano-01.jpg"
  },
  {
    "place": "Langano",
    "category": "langano",
    "src": "assets/gallery/langano/langano-02.jpg"
  },
  {
    "place": "Langano",
    "category": "langano",
    "src": "assets/gallery/langano/langano-03.jpg"
  },
  {
    "place": "Langano",
    "category": "langano",
    "src": "assets/gallery/langano/langano-04.jpg"
  },
  {
    "place": "Abijata Shala",
    "category": "abijata-shala",
    "src": "assets/gallery/abijata-shala/abijata-shala-01.jpg"
  },
  {
    "place": "Abijata Shala",
    "category": "abijata-shala",
    "src": "assets/gallery/abijata-shala/abijata-shala-02.jpg"
  },
  {
    "place": "Wenchi Crater Lake",
    "category": "wenchi",
    "src": "assets/gallery/wenchi/wenchi-01.jpg"
  },
  {
    "place": "Wenchi Crater Lake",
    "category": "wenchi",
    "src": "assets/gallery/wenchi/wenchi-02.jpg"
  },
  {
    "place": "Wenchi Crater Lake",
    "category": "wenchi",
    "src": "assets/gallery/wenchi/wenchi-03.jpg"
  },
  {
    "place": "Wenchi Crater Lake",
    "category": "wenchi",
    "src": "assets/gallery/wenchi/wenchi-04.jpg"
  },
  {
    "place": "Wenchi Crater Lake",
    "category": "wenchi",
    "src": "assets/gallery/wenchi/wenchi-05.jpg"
  },
  {
    "place": "Wenchi Crater Lake",
    "category": "wenchi",
    "src": "assets/gallery/wenchi/wenchi-06.jpg"
  },
  {
    "place": "Wenchi Crater Lake",
    "category": "wenchi",
    "src": "assets/gallery/wenchi/wenchi-07.jpg"
  },
  {
    "place": "Wenchi Crater Lake",
    "category": "wenchi",
    "src": "assets/gallery/wenchi/wenchi-08.jpg"
  },
  {
    "place": "Wenchi Crater Lake",
    "category": "wenchi",
    "src": "assets/gallery/wenchi/wenchi-09.jpg"
  },
  {
    "place": "Wenchi Crater Lake",
    "category": "wenchi",
    "src": "assets/gallery/wenchi/wenchi-10.jpg"
  },
  {
    "place": "Wenchi Crater Lake",
    "category": "wenchi",
    "src": "assets/gallery/wenchi/wenchi-11.jpg"
  },
  {
    "place": "Wenchi Crater Lake",
    "category": "wenchi",
    "src": "assets/gallery/wenchi/wenchi-12.jpg"
  }
];

const nativeFeatures = [
  "ትራንስፖርት ቱሪስት ስታንዳርድ (ኮስተር ባስ)",
  "ቁርስ፣ ምሳ፣ እራት፣ ቁርስ፣ ምሳ",
  "የካምፕ ምሽት (የፍዩል ጥብስ)",
  "የታሸገ ውሃ",
  "ድንሽ (ክፍል)",
  "የፓርክ የመግቢያ ዋጋ",
  "አስጎብኚ",
  "የፓርክ ጠባቂ",
  "ፎቶግራፍ",
  "የተለያዩ ጨዋታዎች እና ሽልማቶች"
];

const foreignerFeatures = [
  "Transport with coaster bus",
  "Meals: breakfast, lunch, dinner",
  "Packed water and potatoes",
  "Park entry fee",
  "Guide and ranger",
  "Photography and games"
];

let selectedDestination = hikingDestinations[0]?.name || "Langano";
let selectedPackage = "Native / Local Package";
let activePackageView = "native";
let activeGalleryCategory = "all";

const destinationGrid = document.getElementById("destinationGrid");
const pricingGrid = document.getElementById("pricingGrid");
const selectedDestinationLabel = document.getElementById("selectedDestinationLabel");
const galleryFilters = document.getElementById("galleryFilters");
const galleryGrid = document.getElementById("galleryGrid");
const destinationSelect = document.getElementById("destinationSelect");
const packageInput = document.getElementById("packageInput");

function findTrip(name) {
  return hikingDestinations.find(trip => trip.name === name) || hikingDestinations[0];
}

function renderDestinations() {
  destinationGrid.innerHTML = hikingDestinations.map((trip) => `
    <article class="destination-card fade-up">
      <div class="destination-image">
        <img src="${trip.image}" alt="${trip.name} trip photo" loading="lazy" decoding="async">
        <span class="duration-badge">${trip.duration}</span>
      </div>
      <div class="destination-body">
        <h3>${trip.name}</h3>
        <p>${trip.description}</p>
        <div class="price-row"><span>Native price</span><strong>${trip.price}</strong></div>
        <div class="card-actions">
          <button class="card-details" data-destination="${trip.name}">View Details</button>
          <button class="card-register" data-destination="${trip.name}">Register</button>
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
  selectedDestinationLabel.textContent = selectedDestination;
  if (destinationSelect) destinationSelect.value = selectedDestination;
}

function renderPackageCards() {
  if (activePackageView === "native") {
    const features = nativeFeatures.map(item => `<li>${item}</li>`).join("");
    pricingGrid.className = "pricing-grid single";
    pricingGrid.innerHTML = `
      <article class="pricing-card featured">
        <h3>የሀገር ውስጥ</h3>
        <p>በኢትዮጵያ ነዋሪ ለሆኑ ደንበኞች የተዘጋጀ።</p>
        <div class="price">4,000 ETB <small>/ ሰው</small></div>
        <ul class="check-list">${features}</ul>
        <button class="btn btn-orange full choose-package" data-package="Native / Local Package">ይምረጡ</button>
      </article>
    `;
  } else {
    const features = foreignerFeatures.map(item => `<li>${item}</li>`).join("");
    pricingGrid.className = "pricing-grid foreigner";
    pricingGrid.innerHTML = `
      <article class="pricing-card featured">
        <h3>Foreigner Day Trip</h3>
        <p>For visitors who want a safe, organized single-day experience.</p>
        <div class="price">$60 <small>/ person</small></div>
        <ul class="check-list">${features}</ul>
        <button class="btn btn-orange full choose-package" data-package="Foreigner Day Trip">Choose Package</button>
      </article>
      <article class="pricing-card">
        <h3>Foreigner Overnight</h3>
        <p>For visitors who want a longer guided trip with overnight planning.</p>
        <div class="price">$120 <small>/ person</small></div>
        <ul class="check-list">${features}</ul>
        <button class="btn btn-orange full choose-package" data-package="Foreigner Overnight">Choose Package</button>
      </article>
    `;
  }

  document.querySelectorAll(".choose-package").forEach((button) => {
    button.addEventListener("click", () => {
      selectedPackage = button.dataset.package;
      openRegistrationModal();
    });
  });
}

function renderDestinationOptions() {
  destinationSelect.innerHTML = hikingDestinations.map(trip => `<option value="${trip.name}">${trip.name}</option>`).join("");
  destinationSelect.value = selectedDestination;
}

function renderGalleryFilters() {
  const buttons = [{ slug: "all", name: "All" }, ...galleryCategories];
  galleryFilters.innerHTML = buttons.map(cat => `
    <button class="filter-btn ${cat.slug === activeGalleryCategory ? "active" : ""}" data-category="${cat.slug}">${cat.name}</button>
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
  return src.replace(/\.(jpg|jpeg|png)$/i, ".webp").replace(/\/([^/]+)$/, "/thumb/$1");
}

function renderGallery() {
  const items = activeGalleryCategory === "all"
    ? galleryImages
    : galleryImages.filter(img => img.category === activeGalleryCategory);

  galleryGrid.innerHTML = items.map((img) => `
    <button class="gallery-item" data-src="${img.src}" data-place="${img.place}">
      <img src="${thumbPath(img.src)}" alt="${img.place} gallery photo" loading="lazy" decoding="async">
      <span>${img.place}</span>
    </button>
  `).join("");

  document.querySelectorAll(".gallery-item").forEach((item) => {
    item.addEventListener("click", () => openLightbox(item.dataset.src, item.dataset.place));
  });
}

function openTripDetails(name) {
  const trip = findTrip(name);
  document.getElementById("tripDetailImage").src = trip.image;
  document.getElementById("tripDetailImage").alt = `${trip.name} hiking image`;
  document.getElementById("tripDetailTitle").textContent = trip.name;
  document.getElementById("tripDetailDescription").textContent = trip.description;
  document.getElementById("tripDetailDuration").textContent = trip.duration;
  document.getElementById("tripDetailStart").textContent = trip.start || "Addis Ababa";
  document.getElementById("tripDetailPrice").textContent = trip.price;
  document.getElementById("tripExpectList").innerHTML = (trip.expect || []).map(item => `<li>${item}</li>`).join("");
  const features = activePackageView === "native" ? nativeFeatures : foreignerFeatures;
  document.getElementById("tripIncludedList").innerHTML = features.map(item => `<li>${item}</li>`).join("");
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

function openRegistrationModal() {
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

  document.getElementById("registrationForm").addEventListener("submit", (e) => {
    e.preventDefault();
    closeModals();
    openModal("successModal");
    e.currentTarget.reset();
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
updateSelectedDestination();

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

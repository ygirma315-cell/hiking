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
const packagePriceInput = document.getElementById("packagePriceInput");
const participantsCountInput = document.getElementById("participantsCount");
const paymentMethodSelect = document.getElementById("paymentMethod");
const otherPaymentWrap = document.getElementById("otherPaymentWrap");
const otherPaymentNameInput = document.getElementById("otherPaymentName");
const paymentReceiverGuide = document.getElementById("paymentReceiverGuide");
const supabaseClient = window.ereftSupabaseClient ? window.ereftSupabaseClient() : null;
const USERNAME_DOMAIN = "ereft.local";
var currentUser = null;
var currentProfile = null;
var userBookings = [];
var dashboardRefreshTimer = null;
var pendingAuthAction = null;
var selectedPackageMeta = null;

const PAYMENT_ACCOUNTS = {
  cbe: {
    label:"Commercial Bank of Ethiopia (CBE)",
    accountName:"Ereft Hiking",
    accountLabel:"CBE account number",
    accountNumber:"1000123456789"
  },
  telebirr: {
    label:"Telebirr",
    accountName:"Ereft Hiking",
    accountLabel:"Telebirr receiving phone",
    accountNumber:"+251911234567"
  },
  boa: {
    label:"Bank of Abyssinia (BOA)",
    accountName:"Ereft Hiking",
    accountLabel:"BOA account number",
    accountNumber:"110012345678"
  },
  awash: {
    label:"Awash Bank",
    accountName:"Ereft Hiking",
    accountLabel:"Awash account number",
    accountNumber:"0134123456789"
  },
  dashen: {
    label:"Dashen Bank",
    accountName:"Ereft Hiking",
    accountLabel:"Dashen account number",
    accountNumber:"780012345678"
  },
  cash: {
    label:"Cash",
    accountName:"Ereft Hiking",
    accountLabel:"Payment location",
    accountNumber:"Confirm with Ereft Hiking before the trip"
  }
};

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

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

function usernameToEmail(username) {
  return normalizeUsername(username) + "@" + USERNAME_DOMAIN;
}

function buildLocalHikeId(seed) {
  var fallback = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  var raw = String(seed || (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : fallback));
  var clean = raw.replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (!clean) clean = fallback.toUpperCase();
  return "HIK-" + clean.slice(-6).padStart(6, "0");
}

function statusCopy(status) {
  if (status === "accepted") {
    return {
      label:"Accepted",
      message:"Congratulations, your payment has been confirmed. You are accepted for this trip."
    };
  }
  if (status === "rejected") {
    return {
      label:"Rejected",
      message:"Your registration was rejected. Please contact support."
    };
  }
  if (status === "needs_review") {
    return {
      label:"Needs Review",
      message:"Your payment needs manual review. Please contact us with your Hike ID."
    };
  }
  return {
    label:"Pending",
    message:"Waiting for payment confirmation."
  };
}

function statusBadgeClass(status) {
  if (status === "accepted") return "status-accepted";
  if (status === "rejected") return "status-rejected";
  if (status === "needs_review") return "status-review";
  return "status-pending";
}

function normalizeBooking(row) {
  row = row || {};
  return {
    id: row.id || Date.now(),
    hike_id: row.hike_id || row.reference_code || buildLocalHikeId(row.id),
    user_id: row.user_id || "",
    username: row.username || "",
    full_name: row.full_name || row.fullName || "",
    phone: row.phone || "",
    participants_count: cleanPeopleCount(row.participants_count || row.participantsCount || 1),
    destination: row.destination || "",
    package_name: row.package_name || row.package || "",
    trip_date: row.trip_date || row.trip_date_text || row.submitted_date || "",
    price: row.price == null ? null : Number(row.price),
    currency: row.currency || "ETB",
    payment_method: row.payment_method || row.paymentMethod || "Not selected",
    sender_account: row.sender_account || "",
    transaction_id: row.transaction_id || "",
    payment_status: row.payment_status || "pending",
    status: row.status || "pending",
    admin_message: row.admin_message || row.notes || "",
    created_at: row.created_at || row.submitted_date || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString()
  };
}

function formatBookingPrice(booking) {
  if (!booking || booking.price == null || Number.isNaN(Number(booking.price))) return "-";
  var amount = Number(booking.price).toLocaleString();
  return booking.currency === "USD" ? "$" + amount : amount + " " + (booking.currency || "ETB");
}

function cleanPeopleCount(value) {
  var count = Number(value);
  if (!Number.isFinite(count) || count < 1) return 1;
  return Math.floor(count);
}

function getPackageByName(name) {
  if (!sharedPkgData) return null;
  var found = null;
  ["nativeDay", "nativeOvernight", "foreignerDay", "foreignerOvernight"].forEach(function(key) {
    if (sharedPkgData[key] && sharedPkgData[key].name === name) found = sharedPkgData[key];
  });
  return found;
}

function paymentAccountFor(value) {
  var raw = String(value || "").trim();
  if (!raw) return null;
  if (PAYMENT_ACCOUNTS[raw]) return PAYMENT_ACCOUNTS[raw];
  var lower = raw.toLowerCase();
  var key = Object.keys(PAYMENT_ACCOUNTS).find(function(id) {
    var item = PAYMENT_ACCOUNTS[id];
    return item.label.toLowerCase() === lower || lower.includes(id) || lower.includes(item.label.toLowerCase());
  });
  return key ? PAYMENT_ACCOUNTS[key] : {
    label:raw,
    accountName:"Ereft Hiking",
    accountLabel:"Receiving account",
    accountNumber:"Confirm with Ereft Hiking before paying"
  };
}

function selectedPaymentLabel() {
  var value = paymentMethodSelect ? paymentMethodSelect.value : "";
  if (value === "other") {
    var otherName = otherPaymentNameInput ? otherPaymentNameInput.value.trim() : "";
    return otherName ? "Other - " + otherName : "Other bank / wallet";
  }
  var account = paymentAccountFor(value);
  return account ? account.label : "";
}

function paymentGuideHtml(account, hikeId) {
  if (!account) return "";
  var hasAccount = !!String(account.accountNumber || "").trim();
  var accountLine = hasAccount
    ? '<div><span>' + esc(account.accountLabel) + '</span><strong>' + esc(account.accountNumber) + '</strong><button class="copy-btn" type="button" data-copy-value="' + esc(account.accountNumber) + '">Copy</button></div>'
    : '<div><span>' + esc(account.accountLabel) + '</span><strong>Account number not added yet</strong></div>';
  var hikeLine = hikeId
    ? '<p>Your Hike ID is <strong>' + esc(hikeId) + '</strong>. Write this exact ID in the payment note/description/reference.</p>'
    : '<p>After booking, copy your Hike ID and write it in the payment note/description/reference.</p>';
  return '<div class="payment-guide-title">' +
      '<span>Pay with</span><strong>' + esc(account.label) + '</strong>' +
    '</div>' +
    '<div class="payment-guide-details">' +
      '<div><span>Account name</span><strong>' + esc(account.accountName || "Ereft Hiking") + '</strong></div>' +
      accountLine +
    '</div>' +
    hikeLine +
    '<p class="payment-guide-note">Demo receiving account for setup. Replace this with the real Ereft Hiking deposit account before launch.</p>' +
    '<p class="payment-guide-note">After paying, enter your sender account/phone and transaction/reference ID so admin can match Hike ID + reference + sender + amount.</p>';
}

function updatePaymentGuide(hikeId) {
  if (!paymentMethodSelect || !paymentReceiverGuide) return;
  var value = paymentMethodSelect.value;
  var account = value === "other"
    ? paymentAccountFor(selectedPaymentLabel())
    : paymentAccountFor(value);

  if (otherPaymentWrap) otherPaymentWrap.hidden = value !== "other";
  paymentReceiverGuide.hidden = !account;
  paymentReceiverGuide.innerHTML = account ? paymentGuideHtml(account, hikeId) : "";
}

function updateAuthUI() {
  var loggedIn = !!currentUser;
  var loginButton = document.getElementById("loginOpenButton");
  var dashboardButton = document.getElementById("dashboardOpenButton");
  var logoutButton = document.getElementById("logoutButton");
  if (loginButton) loginButton.hidden = loggedIn;
  if (dashboardButton) dashboardButton.hidden = true;
  if (logoutButton) logoutButton.hidden = !loggedIn;
}

function switchAuthTab(mode) {
  var signIn = mode !== "signup";
  document.querySelectorAll(".auth-tab").forEach(function(tab) {
    tab.classList.toggle("active", tab.dataset.authTab === (signIn ? "signin" : "signup"));
  });
  document.getElementById("signinForm").hidden = !signIn;
  document.getElementById("signupForm").hidden = signIn;
}

function openAuthModal(mode, afterLoginAction) {
  pendingAuthAction = afterLoginAction || null;
  switchAuthTab(mode || "signin");
  openModal("authModal");
}

async function ensureProfile(user, username, phone) {
  if (!supabaseClient || !user) return null;
  username = normalizeUsername(username || user.user_metadata?.username || (user.email || "").split("@")[0]);
  phone = phone || user.user_metadata?.phone || "";

  var existing = await supabaseClient
    .from("profiles")
    .select("user_id, username, phone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing.data) return existing.data;

  var inserted = await supabaseClient
    .from("profiles")
    .insert({ user_id:user.id, username:username, phone:phone })
    .select("user_id, username, phone")
    .single();

  if (inserted.error) throw inserted.error;
  return inserted.data;
}

async function loadCurrentUser() {
  if (!supabaseClient) {
    updateAuthUI();
    return;
  }

  var sessionRes = await supabaseClient.auth.getSession();
  var user = sessionRes.data && sessionRes.data.session && sessionRes.data.session.user;
  currentUser = user || null;
  if (currentUser) {
    try {
      currentProfile = await ensureProfile(currentUser);
    } catch (error) {
      console.warn("Profile load failed:", error);
      currentProfile = { username:(currentUser.email || "").split("@")[0], phone:"" };
    }
  } else {
    currentProfile = null;
  }
  updateAuthUI();
}

async function handleSignedIn(action) {
  closeModals();
  updateAuthUI();
  if (action === "register") openRegistrationModal();
  if (action === "dashboard") openDashboard();
}

async function signInUser(form) {
  if (!supabaseClient) {
    showSiteNotice("Login is not available right now. Please try again later.", "error");
    return;
  }

  var button = document.getElementById("signinSubmit");
  var username = normalizeUsername(document.getElementById("signinUsername").value);
  var password = document.getElementById("signinPassword").value;
  if (!username || !password) return;

  button.disabled = true;
  button.textContent = "Logging in...";
  try {
    var result = await supabaseClient.auth.signInWithPassword({
      email: usernameToEmail(username),
      password: password
    });
    if (result.error) throw result.error;
    currentUser = result.data.user;
    try {
      currentProfile = await ensureProfile(currentUser, username);
    } catch (profileError) {
      console.warn("Profile setup failed:", profileError);
      currentProfile = { username:username, phone:"" };
    }
    form.reset();
    await handleSignedIn(pendingAuthAction);
    pendingAuthAction = null;
  } catch (error) {
    console.error("Login failed:", error);
    showSiteNotice("Username or password is incorrect.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "Login";
  }
}

async function signUpUser(form) {
  if (!supabaseClient) {
    showSiteNotice("Sign up is not available right now. Please try again later.", "error");
    return;
  }

  var button = document.getElementById("signupSubmit");
  var username = normalizeUsername(document.getElementById("signupUsername").value);
  var phone = document.getElementById("signupPhone").value.trim();
  var password = document.getElementById("signupPassword").value;
  var confirm = document.getElementById("signupConfirmPassword").value;

  if (username.length < 3) {
    showSiteNotice("Username must be at least 3 characters.", "error");
    return;
  }
  if (password.length < 6) {
    showSiteNotice("Password must be at least 6 characters.", "error");
    return;
  }
  if (password !== confirm) {
    showSiteNotice("Passwords do not match.", "error");
    return;
  }

  button.disabled = true;
  button.textContent = "Creating...";
  try {
    var availability = await supabaseClient.rpc("is_username_available", { p_username:username });
    if (!availability.error && availability.data === false) {
      throw new Error("Username already exists.");
    }

    var result = await supabaseClient.auth.signUp({
      email: usernameToEmail(username),
      password: password,
      options: { data:{ username:username, phone:phone } }
    });
    if (result.error) throw result.error;

    var user = result.data.user;
    if (!result.data.session) {
      var login = await supabaseClient.auth.signInWithPassword({
        email: usernameToEmail(username),
        password: password
      });
      if (login.error) throw login.error;
      user = login.data.user;
    }

    currentUser = user;
    try {
      currentProfile = await ensureProfile(currentUser, username, phone);
    } catch (profileError) {
      console.warn("Profile setup failed:", profileError);
      currentProfile = { username:username, phone:phone };
    }
    form.reset();
    await handleSignedIn(pendingAuthAction);
    pendingAuthAction = null;
  } catch (error) {
    console.error("Sign up failed:", error);
    showSiteNotice(error.message === "Username already exists." ? "That username is already taken." : "Could not create account. Please try another username.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "Create Account";
  }
}

async function signOutUser() {
  stopDashboardLiveRefresh();
  userBookings = [];
  if (supabaseClient) await supabaseClient.auth.signOut();
  currentUser = null;
  currentProfile = null;
  updateAuthUI();
  closeModals();
  showSiteNotice("Logged out.", "success");
}

async function loadUserBookings() {
  if (!supabaseClient || !currentUser) {
    userBookings = [];
    return userBookings;
  }

  var response = await supabaseClient
    .from("registrations")
    .select("id,hike_id,user_id,username,full_name,phone,participants_count,destination,package_name,trip_date,price,currency,payment_method,sender_account,transaction_id,payment_status,status,admin_message,created_at,updated_at")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending:false });

  if (response.error) throw response.error;
  userBookings = (response.data || []).map(normalizeBooking);
  return userBookings;
}

function renderDashboard() {
  var list = document.getElementById("dashboardBookings");
  var empty = document.getElementById("dashboardEmpty");
  if (!list || !empty) return;

  if (!userBookings.length) {
    list.innerHTML = "";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  list.innerHTML = userBookings.map(function(booking) {
    var copy = statusCopy(booking.status);
    var price = formatBookingPrice(booking);
    var adminMessage = booking.admin_message || copy.message;
    var paymentAccount = paymentAccountFor(booking.payment_method);
    return '<article class="booking-card">' +
      '<div class="booking-card-top">' +
        '<div><span class="booking-label">Hike ID</span><div class="hike-id-inline"><strong id="hike-' + esc(booking.hike_id) + '">' + esc(booking.hike_id) + '</strong><button class="copy-btn" type="button" data-copy-value="' + esc(booking.hike_id) + '">Copy</button></div></div>' +
        '<span class="status-badge ' + statusBadgeClass(booking.status) + '">' + esc(copy.label) + '</span>' +
      '</div>' +
      '<div class="booking-details">' +
        '<div><span>Trip</span><strong>' + esc(booking.destination || booking.package_name) + '</strong></div>' +
        '<div><span>Package</span><strong>' + esc(booking.package_name || '-') + '</strong></div>' +
        '<div><span>People</span><strong>' + esc(booking.participants_count || 1) + '</strong></div>' +
        '<div><span>Price</span><strong>' + esc(price) + '</strong></div>' +
        '<div><span>Trip Date</span><strong>' + esc(booking.trip_date || 'Not set') + '</strong></div>' +
        '<div><span>Payment Option</span><strong>' + esc(booking.payment_method || '-') + '</strong></div>' +
        '<div><span>Payment Status</span><strong>' + esc(booking.payment_status || 'pending') + '</strong></div>' +
        '<div><span>Your Sender</span><strong>' + esc(booking.sender_account || 'Not submitted yet') + '</strong></div>' +
        '<div><span>Transaction ID</span><strong>' + esc(booking.transaction_id || 'Not submitted yet') + '</strong></div>' +
      '</div>' +
      (paymentAccount ? '<div class="payment-guide-card compact">' + paymentGuideHtml(paymentAccount, booking.hike_id) + '</div>' : '') +
      '<p class="payment-instruction">Your Hike ID is <strong>' + esc(booking.hike_id) + '</strong>. When sending the payment, copy this exact Hike ID and write it in the payment note/description/reference. This helps us confirm your payment faster.</p>' +
      '<p class="payment-warning small">If you pay without writing your Hike ID in the payment note, your confirmation may be delayed. You may need to contact us manually.</p>' +
      '<div class="admin-message"><strong>Status message</strong><span>' + esc(adminMessage) + '</span></div>' +
      '<form class="payment-update-form" data-hike-id="' + esc(booking.hike_id) + '">' +
        '<label>Sender account / phone<input name="sender_account" value="' + esc(booking.sender_account || '') + '" placeholder="Account or phone used to pay"></label>' +
        '<label>Transaction ID / reference<input name="transaction_id" value="' + esc(booking.transaction_id || '') + '" placeholder="Payment reference"></label>' +
        '<button class="btn btn-orange full" type="submit">Submit Payment Details</button>' +
      '</form>' +
    '</article>';
  }).join("");
}

async function openDashboard() {
  if (!currentUser) {
    openAuthModal("signin", "dashboard");
    return;
  }

  openModal("dashboardModal");
  await refreshDashboard(true);
  startDashboardLiveRefresh();
}

async function refreshDashboard(silent) {
  if (!currentUser) return;
  var btn = document.getElementById("dashboardRefreshButton");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Refreshing...";
  }
  try {
    await loadUserBookings();
    renderDashboard();
    if (!silent) showSiteNotice("Dashboard refreshed.", "success");
  } catch (error) {
    console.error("Dashboard refresh failed:", error);
    if (!silent) showSiteNotice("Could not refresh dashboard right now.", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Refresh Dashboard";
    }
  }
}

function startDashboardLiveRefresh() {
  stopDashboardLiveRefresh();
  dashboardRefreshTimer = setInterval(function() {
    var modal = document.getElementById("dashboardModal");
    if (!modal || !modal.classList.contains("open")) {
      stopDashboardLiveRefresh();
      return;
    }
    refreshDashboard(true);
  }, 10000);
}

function stopDashboardLiveRefresh() {
  if (dashboardRefreshTimer) {
    clearInterval(dashboardRefreshTimer);
    dashboardRefreshTimer = null;
  }
}

async function submitPaymentDetails(form) {
  if (!supabaseClient || !currentUser) return;
  var hikeId = form.dataset.hikeId;
  var sender = form.elements.sender_account.value.trim();
  var tx = form.elements.transaction_id.value.trim();
  if (!sender && !tx) {
    showSiteNotice("Add sender account/phone or transaction ID first.", "error");
    return;
  }
  var button = form.querySelector("button");
  button.disabled = true;
  button.textContent = "Saving...";
  try {
    var result = await supabaseClient.rpc("submit_booking_payment", {
      p_hike_id:hikeId,
      p_sender_account:sender,
      p_transaction_id:tx
    });
    if (result.error) throw result.error;
    await refreshDashboard(true);
    showSiteNotice("Payment details submitted.", "success");
  } catch (error) {
    console.error("Payment detail update failed:", error);
    showSiteNotice("Could not submit payment details.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "Submit Payment Details";
  }
}

function renderSuccessBooking(booking) {
  var id = booking && booking.hike_id ? booking.hike_id : "";
  var account = booking ? paymentAccountFor(booking.payment_method) : null;
  var instruction = document.getElementById("successInstruction");
  var wrap = document.getElementById("successHikeIdWrap");
  var idEl = document.getElementById("successHikeId");
  var guide = document.getElementById("successPaymentGuide");
  if (instruction) instruction.textContent = id
    ? "Your Hike ID is " + id + ". When sending the payment, copy this exact Hike ID and write it in the payment note/description/reference. This helps us confirm your payment faster."
    : "Your booking was created. Use your Hike ID when sending payment.";
  if (wrap && idEl) {
    wrap.hidden = !id;
    idEl.textContent = id;
  }
  if (guide) {
    guide.hidden = !account;
    guide.innerHTML = account ? paymentGuideHtml(account, id) : "";
  }
}

function copyText(value) {
  if (!value) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(value).then(function() {
      showSiteNotice("Copied.", "success");
    });
  } else {
    showSiteNotice(value, "info");
  }
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
      selectedPackageMeta = getPackageByName(selectedPackage);
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
  stopDashboardLiveRefresh();
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
  var icon = noticeType === "error" ? "!" : noticeType === "info" ? "i" : "OK";
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
  if (!currentUser) {
    openAuthModal("signin", "register");
    return;
  }
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
  selectedPackageMeta = getPackageByName(selectedPackage);
  if (packagePriceInput) packagePriceInput.value = selectedPackageMeta ? formatPackagePrice(selectedPackageMeta) : "";
  updatePaymentGuide();
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
  document.querySelectorAll(".main-nav a").forEach(link => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        document.querySelector(".main-nav")?.classList.remove("open");
        document.getElementById("menuToggle")?.classList.remove("open");
        document.getElementById("menuToggle")?.setAttribute("aria-expanded", "false");
        scrollToSection(href.slice(1));
      }
    });
  });
}

function setupActiveNavOnScroll() {
  const sections = document.querySelectorAll(".section-anchor");
  const navLinks = document.querySelectorAll(".main-nav a, .mobile-nav-item");
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === "#" + id));
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
  document.getElementById("loginOpenButton").addEventListener("click", () => openAuthModal("signup"));
  document.getElementById("dashboardOpenButton").addEventListener("click", openDashboard);
  document.getElementById("logoutButton").addEventListener("click", signOutUser);
  document.getElementById("dashboardRefreshButton").addEventListener("click", () => refreshDashboard(false));
  document.getElementById("successViewDashboardButton").addEventListener("click", function() {
    closeModals();
    openDashboard();
  });
  if (paymentMethodSelect) paymentMethodSelect.addEventListener("change", () => updatePaymentGuide());
  if (otherPaymentNameInput) otherPaymentNameInput.addEventListener("input", () => updatePaymentGuide());
  document.getElementById("menuToggle").addEventListener("click", function() {
    var nav = document.querySelector(".main-nav");
    var open = nav.classList.toggle("open");
    this.classList.toggle("open", open);
    this.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.querySelectorAll(".auth-tab").forEach(function(tab) {
    tab.addEventListener("click", function() { switchAuthTab(tab.dataset.authTab); });
  });
  document.getElementById("signinForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await signInUser(e.currentTarget);
  });
  document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await signUpUser(e.currentTarget);
  });
  document.getElementById("dashboardBookings").addEventListener("submit", async (e) => {
    var form = e.target.closest(".payment-update-form");
    if (!form) return;
    e.preventDefault();
    await submitPaymentDetails(form);
  });
  document.addEventListener("click", function(e) {
    var copyButton = e.target.closest("[data-copy-target], [data-copy-value]");
    if (!copyButton) return;
    var value = copyButton.dataset.copyValue;
    if (!value && copyButton.dataset.copyTarget) {
      var target = document.getElementById(copyButton.dataset.copyTarget);
      value = target ? target.textContent.trim() : "";
    }
    copyText(value);
  });
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
    function updatePhoneLink(link, phone) {
      if (!link || !phone) return;
      var icon = link.querySelector('svg');
      link.href = 'tel:' + phone.replace(/\s+/g, '');
      link.innerHTML = (icon ? icon.outerHTML : '') + esc(phone);
    }
    if (footerContact.length > 0 && w.contactPhone) {
      updatePhoneLink(footerContact[0], w.contactPhone);
    }
    if (footerContact.length > 1 && w.contactPhone2) {
      updatePhoneLink(footerContact[1], w.contactPhone2);
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
  if (!currentUser) {
    openAuthModal("signin", "register");
    return;
  }
  if (!destinationSelect.value || !packageInput.value) {
    showSiteNotice("Choose a destination and package before submitting.", "error");
    return;
  }

  selectedPackageMeta = getPackageByName(packageInput.value);
  var trip = findTrip(destinationSelect.value);
  var localHikeId = buildLocalHikeId();
  var payload = {
    full_name: document.getElementById("fullName").value.trim(),
    age: Number(document.getElementById("age").value),
    phone: document.getElementById("phone").value.trim(),
    participants_count: cleanPeopleCount(participantsCountInput ? participantsCountInput.value : 1),
    gender: document.getElementById("gender").value,
    destination: destinationSelect.value,
    package_name: packageInput.value,
    trip_date: trip ? trip.date || "" : "",
    price: selectedPackageMeta ? Number(selectedPackageMeta.price || 0) : 0,
    currency: selectedPackageMeta ? selectedPackageMeta.currency || "ETB" : "ETB",
    payment_method: selectedPaymentLabel(),
    sender_account: document.getElementById("senderAccount").value.trim(),
    transaction_id: document.getElementById("transactionId").value.trim(),
    payment_status: "pending",
    status: "pending"
  };
  if (!payload.full_name || !payload.phone || !payload.payment_method) {
    showSiteNotice("Please complete the required booking fields.", "error");
    return;
  }

  var submitButton = document.getElementById("registrationSubmitButton");
  submitButton.disabled = true;
  submitButton.textContent = "Creating Booking...";
  try {
    var booking = null;
    if (supabaseClient) {
      var rpcPayload = {
        p_full_name: payload.full_name,
        p_phone: payload.phone,
        p_age: payload.age,
        p_participants_count: payload.participants_count,
        p_gender: payload.gender,
        p_destination: payload.destination,
        p_package_name: payload.package_name,
        p_trip_date: payload.trip_date,
        p_price: payload.price,
        p_currency: payload.currency,
        p_payment_method: payload.payment_method,
        p_sender_account: payload.sender_account,
        p_transaction_id: payload.transaction_id
      };
      var rpcResponse = await supabaseClient.rpc('create_booking', rpcPayload);

      if (rpcResponse.error && String(rpcResponse.error.message || '').includes('p_participants_count')) {
        delete rpcPayload.p_participants_count;
        rpcResponse = await supabaseClient.rpc('create_booking', rpcPayload);
      }

      if (!rpcResponse.error && rpcResponse.data) {
        booking = normalizeBooking(Array.isArray(rpcResponse.data) ? rpcResponse.data[0] : rpcResponse.data);
      } else {
        throw rpcResponse.error || new Error("Booking could not be created.");
      }
    } else {
      booking = normalizeBooking(Object.assign({}, payload, {
        id: Date.now(),
        hike_id: localHikeId,
        user_id: "local",
        username: currentProfile?.username || "",
        created_at: new Date().toISOString()
      }));
      var saved = JSON.parse(localStorage.getItem('ereft_hiking_bookings') || '[]');
      saved.unshift(booking);
      localStorage.setItem('ereft_hiking_bookings', JSON.stringify(saved));
    }

    userBookings.unshift(booking);
    closeModals();
    renderSuccessBooking(booking);
    openModal("successModal");
    form.reset();
    await refreshDashboard(true).catch(function(){});
  } catch (error) {
    console.error('Booking failed:', error);
    showSiteNotice('Your booking could not be submitted. Please try again or contact Ereft Hiking directly.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Booking";
  }
}

async function initSite() {
  try {
    await loadSharedData();
    await loadCurrentUser();
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

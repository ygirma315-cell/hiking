const hikingDestinations = [];
const galleryCategories = [];
const galleryImages = [];
const nativeFeatures = [];
const nativeOvernightFeatures = [];
const foreignerFeatures = [];
const foreignerOvernightFeatures = [];

let selectedDestination = "";
var tripNotices = [];
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
const phoneInput = document.getElementById("phone");
const phoneHelp = document.getElementById("phoneHelp");
const paymentMethodSelect = document.getElementById("paymentMethod");
const otherPaymentWrap = document.getElementById("otherPaymentWrap");
const otherPaymentNameInput = document.getElementById("otherPaymentName");
const paymentReceiverGuide = document.getElementById("paymentReceiverGuide");
const bookingPaymentSummary = document.getElementById("bookingPaymentSummary");
const senderAccountInput = document.getElementById("senderAccount");
const senderAccountLabel = document.getElementById("senderAccountLabel");
const senderAccountHelp = document.getElementById("senderAccountHelp");
const supabaseClient = window.ereftSupabaseClient ? window.ereftSupabaseClient() : null;
const SITE_SESSION_KEY = "ereft_site_session";
const GOOGLE_AUTH_ACTION_KEY = "ereft_google_pending_action";
const GOOGLE_AUTH_LOGOUT_KEY = "ereft_google_logged_out";
const CARD_CALENDAR_ICON = '<svg class="card-meta-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h2v3h6V2h2v3h3a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3V2Zm13 8H4v10h16V10ZM4 8h16V7H4v1Z"/></svg>';
const CARD_PEOPLE_ICON = '<svg class="card-meta-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 11a3 3 0 1 1 .01 0H8Zm8 0a3 3 0 1 1 .01 0H16ZM4 20v-1.2C4 16.7 5.7 15 7.8 15h.4c2.1 0 3.8 1.7 3.8 3.8V20H4Zm8 0v-1.3c0-1.3-.4-2.5-1.2-3.5.7-.2 1.4-.2 2.2-.2h.2c2.7 0 4.8 2.1 4.8 4.8V20h-6Z"/></svg>';
const CARD_CLOCK_ICON = '<svg class="card-meta-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm1-8.4 3.1 3.1-1.4 1.4L11 12.4V6h2v5.6Z"/></svg>';
const CARD_PIN_ICON = '<svg class="card-meta-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22c-4.4-3.6-7-7.2-7-10.3A7 7 0 0 1 19 10.7C19 13.8 16.4 17.4 12 22Zm0-2.7c3.1-2.8 5-5.5 5-7.6a5 5 0 0 0-10 0c0 2.1 1.9 4.8 5 7.6Zm0-5.3a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"/></svg>';
const CARD_EYE_ICON = '<svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c5.2 0 9.3 5 10 6.1a1.6 1.6 0 0 1 0 1.8C21.3 14 17.2 19 12 19S2.7 14 2 12.9a1.6 1.6 0 0 1 0-1.8C2.7 10 6.8 5 12 5Zm0 2C7.9 7 4.6 10.7 3.9 12c.7 1.3 4 5 8.1 5s7.4-3.7 8.1-5C19.4 10.7 16.1 7 12 7Zm0 2.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6Z"/></svg>';
const CARD_PACKAGE_ICON = '<svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6V5a4 4 0 0 1 8 0v1h2.2A2.8 2.8 0 0 1 21 8.8v8.4a2.8 2.8 0 0 1-2.8 2.8H5.8A2.8 2.8 0 0 1 3 17.2V8.8A2.8 2.8 0 0 1 5.8 6H8Zm2 0h4V5a2 2 0 0 0-4 0v1ZM5.8 8a.8.8 0 0 0-.8.8v8.4c0 .4.4.8.8.8h12.4c.4 0 .8-.4.8-.8V8.8a.8.8 0 0 0-.8-.8H16v2h-2V8h-4v2H8V8H5.8Z"/></svg>';
var currentUser = null;
var currentProfile = null;
var currentSessionToken = null;
var userBookings = [];
var dashboardRefreshTimer = null;
var pendingAuthAction = null;
var selectedPackageMeta = null;
var registrationStep = 1;
var signingOut = false;

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

function formatDisplayId(value) {
  if (value == null || value === "") return "-";
  var raw = String(value).trim();
  return /^\d+$/.test(raw) ? raw.padStart(3, "0") : raw;
}

function formatPriceAmount(price, currency) {
  var numeric = Number(price);
  var amount = Number.isFinite(numeric) ? numeric.toLocaleString() : String(price || 0);
  if (currency === "USD") return "$" + amount;
  return amount + " " + (currency || "ETB");
}

function formatPackagePrice(pkg) {
  if (!pkg || pkg.price == null || pkg.price === "") return "";
  return formatPriceAmount(pkg.price, pkg.currency || "ETB");
}

function getPackageTotalPrice(pkg, count) {
  if (!pkg || pkg.price == null || pkg.price === "") return 0;
  var unit = Number(pkg.price);
  if (!Number.isFinite(unit)) return 0;
  return unit * cleanPeopleCount(count || 1);
}

function formatPackageTotalPrice(pkg, count) {
  if (!pkg) return "";
  var people = cleanPeopleCount(count || 1);
  var total = getPackageTotalPrice(pkg, people);
  var suffix = people === 1 ? " total" : " total (" + people + " people)";
  return formatPriceAmount(total, pkg.currency || "ETB") + suffix;
}

function normalizePackageFeatures(features) {
  var source = Array.isArray(features) ? features : [features];
  var cleaned = [];
  source.forEach(function(item) {
    String(item == null ? "" : item)
      .replace(/\r/g, "\n")
      .split(/\n+|[\u2022\u00b7\u2023]\s*/g)
      .forEach(function(part) {
        var text = part.replace(/^[\s\-\u2022\u00b7\u2023]+/, "").trim();
        if (text) cleaned.push(text);
      });
  });
  return cleaned;
}

function replacePackageFeatures(target, features) {
  target.length = 0;
  normalizePackageFeatures(features).forEach(function(feature) {
    target.push(feature);
  });
}

function updatePackagePriceDisplay() {
  if (!packagePriceInput) return;
  selectedPackageMeta = selectedPackageMeta || getPackageByName(packageInput ? packageInput.value : "");
  packagePriceInput.value = selectedPackageMeta
    ? formatPackageTotalPrice(selectedPackageMeta, participantsCountInput ? participantsCountInput.value : 1)
    : "";
  updateBookingPaymentSummary();
}

function normalizeEthiopianPhone(showNotice) {
  if (!phoneInput) return "";
  var raw = phoneInput.value || "";
  var digits = raw.replace(/\D/g, "");
  if (digits.startsWith("251")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  var trimmed = digits.length > 9;
  if (trimmed) digits = digits.slice(0, 9);
  phoneInput.value = digits;

  if (phoneHelp) {
    phoneHelp.classList.toggle("field-help-error", trimmed || (digits.length > 0 && digits.length < 9));
    if (trimmed) {
      phoneHelp.textContent = "Phone number should be 9 digits after +251. Extra digits were removed.";
    } else if (digits.length === 9) {
      phoneHelp.textContent = "Saved as +251" + digits + ".";
    } else {
      phoneHelp.textContent = "Enter 9 digits after +251. If you type 09..., we remove the 0.";
    }
  }

  if (trimmed && showNotice) {
    showSiteNotice("Phone number should be 9 digits after +251. Extra digits were removed.", "error");
  }
  return digits;
}

function getNormalizedPhoneValue() {
  var digits = normalizeEthiopianPhone(false);
  return digits.length === 9 ? "+251" + digits : "";
}

function updateSenderAccountPrompt() {
  if (!senderAccountLabel || !senderAccountInput || !senderAccountHelp) return;
  var method = paymentMethodSelect ? paymentMethodSelect.value : "";
  if (method === "telebirr") {
    senderAccountLabel.textContent = "Your Telebirr Account Phone";
    senderAccountInput.placeholder = "Example: +2519XXXXXXXX";
    senderAccountHelp.textContent = "Enter the Telebirr phone number you will pay from.";
  } else if (method === "cash") {
    senderAccountLabel.textContent = "Payment Note";
    senderAccountInput.placeholder = "Optional note for cash payment";
    senderAccountHelp.textContent = "For cash, you can leave this empty or write a short note.";
  } else {
    senderAccountLabel.textContent = "Your Transferring Account / Phone";
    senderAccountInput.placeholder = "Account or phone you paid from";
    senderAccountHelp.textContent = "Enter the bank account or phone number you will pay from.";
  }
}

function updateBookingPaymentSummary() {
  if (!bookingPaymentSummary) return;
  var people = cleanPeopleCount(participantsCountInput ? participantsCountInput.value : 1);
  var phoneDigits = phoneInput ? normalizeEthiopianPhone(false) : "";
  var phone = phoneDigits ? "+251" + phoneDigits : "-";
  bookingPaymentSummary.innerHTML =
    '<div><span>Name</span><strong>' + esc(document.getElementById("fullName")?.value.trim() || "-") + '</strong></div>' +
    '<div><span>Phone</span><strong>' + esc(phone) + '</strong></div>' +
    '<div><span>People</span><strong>' + esc(people) + '</strong></div>' +
    '<div><span>Trip</span><strong>' + esc(destinationSelect ? destinationSelect.value || "-" : "-") + '</strong></div>' +
    '<div><span>Package</span><strong>' + esc(packageInput ? packageInput.value || "-" : "-") + '</strong></div>' +
    '<div><span>Total Price</span><strong>' + esc(packagePriceInput ? packagePriceInput.value || "-" : "-") + '</strong></div>';
}

function showRegistrationStep(step) {
  registrationStep = step === 2 ? 2 : 1;
  document.querySelectorAll("[data-registration-step]").forEach(function(panel) {
    panel.hidden = panel.dataset.registrationStep !== String(registrationStep);
  });
  document.querySelectorAll("[data-step-indicator]").forEach(function(indicator) {
    indicator.classList.toggle("active", indicator.dataset.stepIndicator === String(registrationStep));
  });
  if (registrationStep === 2) {
    updateBookingPaymentSummary();
    updatePaymentGuide();
    updateSenderAccountPrompt();
  }
}

function validateRegistrationDetails(showMessages) {
  var fullName = document.getElementById("fullName");
  var gender = document.getElementById("gender");
  var people = participantsCountInput;
  var phone = getNormalizedPhoneValue();
  var missing = !fullName?.value.trim() || !phone || !people?.value || !gender?.value || !destinationSelect?.value || !packageInput?.value;
  if (missing && showMessages) {
    if (!phoneInput?.value || !phone) {
      showSiteNotice("Enter a valid phone number: +251 plus 9 digits.", "error");
      phoneInput?.focus();
    } else {
      showSiteNotice("Please complete the required booking details before continuing.", "error");
    }
  }
  return !missing;
}

function goToPaymentStep() {
  if (!validateRegistrationDetails(true)) return;
  showRegistrationStep(2);
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

function togglePasswordVisibility(inputId, btn) {
  var inp = document.getElementById(inputId);
  if (!inp) return;
  var isPassword = inp.type === 'password';
  inp.type = isPassword ? 'text' : 'password';
  btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  btn.innerHTML = isPassword
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>';
}

function formatDate(d) {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString(); } catch(e) { return String(d).slice(0, 10); }
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
    ? '<span>' + esc(account.accountLabel) + ':</span><strong>' + esc(account.accountNumber) + '</strong><button class="copy-btn" type="button" data-copy-value="' + esc(account.accountNumber) + '">Copy</button>'
    : '<span>' + esc(account.accountLabel) + ':</span><strong>Contact us</strong>';
  var hikeNote = hikeId ? ' Write <strong>' + esc(hikeId) + '</strong> in payment note.' : '';
  return '<div class="payment-guide-compact">' +
    '<span class="pg-label">' + esc(account.label) + '</span>' +
    '<div class="pg-details">' +
      '<span>Name: <b>Ereft Hiking</b></span>' +
      accountLine +
      (hikeNote ? '<span class="pg-hike-note">' + hikeNote + '</span>' : '') +
    '</div></div>';
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
  updateSenderAccountPrompt();
}

function updateAuthUI() {
  var loggedIn = !!currentUser;
  var loginButton = document.getElementById("loginOpenButton");
  var profileDropdown = document.getElementById("profileDropdown");
  var profileName = document.getElementById("profileName");
  var profileUsername = document.getElementById("profileUsername");
  var profileUserId = document.getElementById("profileUserId");
  var profileAvatar = document.getElementById("profileAvatar");

  if (loginButton) loginButton.hidden = loggedIn;
  if (profileDropdown) profileDropdown.hidden = !loggedIn;

  if (loggedIn && currentUser) {
    var name = normalizeUsername(currentUser.username || currentUser.name || "");
    var initial = name ? name.charAt(0).toUpperCase() : "?";
    if (profileName) profileName.textContent = name || "Profile";
    if (profileUsername) profileUsername.textContent = name ? "@" + name : "Signed in";
    if (profileUserId) profileUserId.textContent = "User ID: " + formatDisplayId(currentUser.id);
    if (profileAvatar) profileAvatar.textContent = initial;
  }
}

function showSuccessToast(text) {
  var toast = document.getElementById("successToast");
  var textEl = document.getElementById("successToastText");
  if (!toast) return;
  textEl.textContent = text || "Logged in!";
  toast.hidden = false;
  toast.classList.remove("hide");
  setTimeout(function() {
    toast.classList.add("hide");
    setTimeout(function() { toast.hidden = true; }, 400);
  }, 2500);
}

function toggleProfileMenu(show) {
  var menu = document.getElementById("profileMenu");
  var overlay = document.getElementById("profileOverlay");
  if (!menu) return;
  var isVisible = show !== undefined ? show : menu.hidden;
  menu.hidden = !isVisible;
  if (overlay) overlay.hidden = !isVisible;
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

function readStoredSiteSession() {
  try {
    var saved = JSON.parse(localStorage.getItem(SITE_SESSION_KEY) || "null");
    if (!saved || !saved.session_token) return null;
    if (!saved.user && (saved.id || saved.username)) {
      saved.user = { id:saved.id, username:saved.username, phone:saved.phone || "" };
    }
    if (!saved.user) return null;
    return saved;
  } catch (_) {
    return null;
  }
}

function normalizeSessionUser(user) {
  if (!user) return null;
  var id = user.id || user.user_id || user.userId || "";
  var username = normalizeUsername(user.username || user.name || "");
  if (!id || !username || username === "user") return null;
  return {
    id:id,
    username:username,
    phone:user.phone || ""
  };
}

function saveSiteSession(payload) {
  var token = payload && (payload.session_token || payload.token);
  var user = normalizeSessionUser(payload && payload.user);
  if (!token || !user) return false;
  currentSessionToken = token;
  currentUser = user;
  currentProfile = currentUser;
  localStorage.setItem(SITE_SESSION_KEY, JSON.stringify({
    session_token:currentSessionToken,
    user:currentUser
  }));
  return true;
}

function clearSiteSession() {
  currentUser = null;
  currentProfile = null;
  currentSessionToken = null;
  userBookings = [];
  localStorage.removeItem(SITE_SESSION_KEY);
}

function supabaseProjectRef() {
  try {
    var cfg = window.EREFT_SUPABASE || {};
    return cfg.url ? new URL(cfg.url).hostname.split(".")[0] : "";
  } catch (_) {
    return "";
  }
}

function clearSupabaseAuthStorage() {
  var ref = supabaseProjectRef();
  var prefixes = ref ? ["sb-" + ref + "-auth-token"] : [];

  [localStorage, sessionStorage].forEach(function(storage) {
    try {
      Object.keys(storage).forEach(function(key) {
        var isSupabaseAuthKey = prefixes.some(function(prefix) { return key.indexOf(prefix) === 0; });
        if (isSupabaseAuthKey || key === GOOGLE_AUTH_ACTION_KEY) {
          storage.removeItem(key);
        }
      });
    } catch (_) {}
  });
}

async function loadCurrentUser() {
  var saved = readStoredSiteSession();
  if (!saved) {
    clearSiteSession();
    updateAuthUI();
    return;
  }

  currentSessionToken = saved.session_token;
  currentUser = null;
  currentProfile = null;

  if (supabaseClient && currentSessionToken) {
    try {
      var current = await supabaseClient.rpc("get_current_user", { p_session_token:currentSessionToken });
      var verifiedUser = normalizeSessionUser(current && current.data && current.data.user);
      if (current.error || !current.data || !current.data.success || !verifiedUser) {
        clearSiteSession();
      } else {
        saveSiteSession({
          session_token:currentSessionToken,
          user:verifiedUser
        });
      }
    } catch (error) {
      console.warn("User session check failed:", error);
      clearSiteSession();
    }
  } else {
    clearSiteSession();
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
    var result = await supabaseClient.rpc("user_login", {
      p_username:username,
      p_password:password
    });
    if (result.error) throw result.error;
    if (!result.data || !result.data.success) {
      throw new Error((result.data && result.data.error) || "Username or password is incorrect.");
    }
    if (!saveSiteSession(result.data)) {
      throw new Error("Login setup is incomplete. Please contact Ereft Hiking.");
    }
    form.reset();
    showSuccessToast("Welcome back!");
    await handleSignedIn(pendingAuthAction);
    pendingAuthAction = null;
  } catch (error) {
    console.error("Login failed:", error);
    showSiteNotice(error.message || "Username or password is incorrect.", "error");
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
    var result = await supabaseClient.rpc("user_signup", {
      p_username:username,
      p_password:password,
      p_phone:phone
    });
    if (result.error) throw result.error;
    if (!result.data || !result.data.success) {
      throw new Error((result.data && result.data.error) || "Could not create account.");
    }
    if (!saveSiteSession(result.data)) {
      throw new Error("Sign up setup is incomplete. Please contact Ereft Hiking.");
    }

    form.reset();
    showSuccessToast("Account created!");
    await handleSignedIn(pendingAuthAction);
    pendingAuthAction = null;
  } catch (error) {
    console.error("Sign up failed:", error);
    var msg = error.message || "";
    if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("exists")) {
      showSiteNotice("That username is already taken.", "error");
    } else if (msg.includes("network") || msg.includes("fetch")) {
      showSiteNotice("Network error. Check your connection and try again.", "error");
    } else {
      showSiteNotice(msg || "Could not create account. Please try again.", "error");
    }
  } finally {
    button.disabled = false;
    button.textContent = "Create Account";
  }
}

function getGoogleRedirectUrl() {
  return window.location.href.split("#")[0].split("?")[0];
}

async function startGoogleAuth(mode) {
  if (!supabaseClient || !supabaseClient.auth || !supabaseClient.auth.signInWithOAuth) {
    showSiteNotice("Google login is not fully set up yet. Please contact Ereft Hiking.", "error");
    return;
  }

  var button = document.querySelector('[data-google-auth="' + mode + '"]');
  if (button) {
    button.disabled = true;
    button.classList.add("is-loading");
  }

  try {
    localStorage.removeItem(GOOGLE_AUTH_LOGOUT_KEY);
    sessionStorage.setItem(GOOGLE_AUTH_ACTION_KEY, pendingAuthAction || "");
    var response = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getGoogleRedirectUrl()
      }
    });
    if (response.error) throw response.error;
  } catch (error) {
    console.error("Google auth failed:", error);
    showSiteNotice(error.message || "Google login could not start. Please try again later.", "error");
    if (button) {
      button.disabled = false;
      button.classList.remove("is-loading");
    }
  }
}

async function completeGoogleAuth() {
  if (!supabaseClient || !supabaseClient.auth || currentSessionToken) return;

  try {
    if (localStorage.getItem(GOOGLE_AUTH_LOGOUT_KEY)) {
      await supabaseClient.auth.signOut().catch(function() {});
      clearSupabaseAuthStorage();
      return;
    }

    var sessionResult = await supabaseClient.auth.getSession();
    var session = sessionResult && sessionResult.data && sessionResult.data.session;
    var googleUser = session && session.user;
    if (!googleUser) return;

    var metadata = googleUser.user_metadata || {};
    var result = await supabaseClient.rpc("user_google_login", {
      p_google_id:googleUser.id,
      p_email:googleUser.email || "",
      p_name:metadata.full_name || metadata.name || ""
    });
    if (result.error) throw result.error;
    if (!result.data || !result.data.success) {
      throw new Error((result.data && result.data.error) || "Google login could not finish.");
    }
    if (!saveSiteSession(result.data)) {
      throw new Error("Google login setup is incomplete. Please contact Ereft Hiking.");
    }

    var action = sessionStorage.getItem(GOOGLE_AUTH_ACTION_KEY) || pendingAuthAction;
    sessionStorage.removeItem(GOOGLE_AUTH_ACTION_KEY);
    if (window.location.hash || window.location.search) {
      history.replaceState(null, "", getGoogleRedirectUrl());
    }
    showSuccessToast("Signed in with Google!");
    await handleSignedIn(action);
    pendingAuthAction = null;
  } catch (error) {
    console.error("Google login completion failed:", error);
    var msg = error.message || "Google login could not finish.";
    if (msg.toLowerCase().includes("function") || msg.toLowerCase().includes("user_google_login")) {
      msg = "Google login setup is incomplete. Please contact Ereft Hiking.";
    }
    showSiteNotice(msg, "error");
  }
}

async function signOutUser() {
  if (signingOut) return;
  signingOut = true;
  var logoutButton = document.getElementById("profileLogoutBtn");
  var originalLogoutText = logoutButton ? logoutButton.textContent : "";
  if (logoutButton) {
    logoutButton.disabled = true;
    logoutButton.textContent = "Logging out...";
  }

  stopDashboardLiveRefresh();
  userBookings = [];
  var token = currentSessionToken;
  localStorage.setItem(GOOGLE_AUTH_LOGOUT_KEY, String(Date.now()));
  if (window.location.hash.indexOf("access_token") !== -1 || window.location.search.indexOf("code=") !== -1) {
    history.replaceState(null, "", getGoogleRedirectUrl());
  }
  clearSiteSession();
  clearSupabaseAuthStorage();
  updateAuthUI();
  closeModals();

  try {
    var tasks = [];
    if (supabaseClient && token) {
      tasks.push(supabaseClient.rpc("user_logout", { p_session_token:token }));
    }
    if (supabaseClient && supabaseClient.auth) {
      tasks.push(supabaseClient.auth.signOut());
    }
    await Promise.allSettled(tasks);
    clearSupabaseAuthStorage();
    showSiteNotice("Logged out.", "success");
  } catch (error) {
    console.error("Logout cleanup failed:", error);
    showSiteNotice("Logged out on this device.", "success");
  } finally {
    if (logoutButton) {
      logoutButton.disabled = false;
      logoutButton.textContent = originalLogoutText || "Logout";
    }
    signingOut = false;
  }
}

async function loadUserBookings() {
  if (!supabaseClient || !currentUser || !currentSessionToken) {
    userBookings = [];
    return userBookings;
  }

  var response = await supabaseClient.rpc("get_user_bookings", {
    p_session_token:currentSessionToken
  });

  if (response.error) throw response.error;
  userBookings = (response.data || []).map(normalizeBooking);
  updateInboxBadge();
  return userBookings;
}

function renderDashboard() {
  var tbody = document.getElementById("dashboardBookings");
  var empty = document.getElementById("dashboardEmpty");
  if (!tbody || !empty) return;

  if (!userBookings.length) {
    tbody.innerHTML = "";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  tbody.innerHTML = userBookings.map(function(booking) {
    var copy = statusCopy(booking.status);
    var price = formatBookingPrice(booking);
    var paymentAccount = paymentAccountFor(booking.payment_method);
    var accountLine = paymentAccount ? esc(paymentAccount.accountLabel) + ': ' + esc(paymentAccount.accountNumber) : '-';
    var hasSender = !!booking.sender_account;
    var isRejected = booking.status === 'rejected';

    function tag(emo, label, val) {
      return '<span class="tag"><span class="emo">' + emo + '</span>' + esc(label) + ': <b>' + esc(val) + '</b></span>';
    }

    if (isRejected) {
      return '<tr>' +
        '<td data-label="User ID"><strong class="user-id-cell">' + esc(formatDisplayId(booking.user_id || currentUser.id)) + '</strong></td>' +
        '<td data-label="Hike ID"><div class="hike-id-cell"><strong>' + esc(booking.hike_id) + '</strong><button class="copy-btn-sm" type="button" data-copy-value="' + esc(booking.hike_id) + '" title="Copy Hike ID">Copy</button></div></td>' +
        '<td colspan="9"><div class="rejected-info">' +
          '<span class="rejected-msg">Rejected — make sure you paid to the correct account and wrote your Hike ID in the payment note.</span>' +
          tag('\uD83D\uDCB0', 'Paid from', booking.sender_account || '-') +
          tag('\uD83C\uDFE6', 'Via', booking.payment_method || '-') +
          tag('\uD83C\uDFE5', 'Pay to', accountLine) +
          '<button class="btn btn-sm btn-orange" onclick="togglePayForm(\'' + esc(booking.hike_id) + '\')">Resubmit</button>' +
        '</div>' +
        '<div class="pay-form-wrap" id="pay-form-' + esc(booking.hike_id) + '" hidden>' +
          '<form class="payment-update-form" data-hike-id="' + esc(booking.hike_id) + '">' +
            '<label>Correct account/phone you paid from<input name="sender_account" value="' + esc(booking.sender_account || '') + '" placeholder="e.g. +251912345678"></label>' +
            '<button class="btn btn-orange" type="submit">Confirm</button>' +
            '<button class="btn btn-soft" type="button" onclick="togglePayForm(\'' + esc(booking.hike_id) + '\')">Cancel</button>' +
          '</form></div></td>' +
      '</tr>';
    }

    if (hasSender) {
      return '<tr>' +
        '<td data-label="User ID"><strong class="user-id-cell">' + esc(formatDisplayId(booking.user_id || currentUser.id)) + '</strong></td>' +
        '<td data-label="Hike ID"><div class="hike-id-cell"><strong>' + esc(booking.hike_id) + '</strong><button class="copy-btn-sm" type="button" data-copy-value="' + esc(booking.hike_id) + '" title="Copy Hike ID">Copy</button></div></td>' +
        '<td colspan="9"><div class="submitted-info">' +
          tag('\uD83D\uDC64', 'Name', booking.full_name) +
          tag('\uD83D\uDCDE', 'Phone', booking.phone) +
          tag('\uD83D\uDC65', 'Pax', booking.participants_count || 1) +
          tag('\uD83D\uDCB5', 'Price', price) +
          tag('\uD83D\uDCB0', 'Paid from', booking.sender_account) +
          tag('\uD83C\uDFE6', 'Via', booking.payment_method || '-') +
          tag('\uD83D\uDCC5', 'Registered', formatDate(booking.created_at || booking.submitted_date)) +
          '<span class="status-badge ' + statusBadgeClass(booking.status) + '">' + esc(copy.label) + '</span>' +
        '</div></td>' +
      '</tr>';
    }

    return '<tr>' +
      '<td data-label="User ID"><strong class="user-id-cell">' + esc(formatDisplayId(booking.user_id || currentUser.id)) + '</strong></td>' +
      '<td data-label="Hike ID"><div class="hike-id-cell"><strong>' + esc(booking.hike_id) + '</strong><button class="copy-btn-sm" type="button" data-copy-value="' + esc(booking.hike_id) + '" title="Copy Hike ID">Copy</button></div></td>' +
      '<td colspan="9"><div class="pending-pay-info">' +
        tag('\uD83C\uDFD4\uFE0F', 'Trip', booking.destination || booking.package_name) +
        tag('\uD83D\uDCB5', 'Price', price) +
        tag('\uD83C\uDFE5', 'Pay to', accountLine) +
        '<button class="btn btn-sm btn-orange" onclick="togglePayForm(\'' + esc(booking.hike_id) + '\')">I\'ve Paid</button>' +
      '</div>' +
      '<div class="pay-form-wrap" id="pay-form-' + esc(booking.hike_id) + '" hidden>' +
        '<form class="payment-update-form" data-hike-id="' + esc(booking.hike_id) + '">' +
          '<label>Enter account/phone you paid from<input name="sender_account" value="" placeholder="e.g. +251912345678"></label>' +
          '<button class="btn btn-orange" type="submit">Confirm</button>' +
          '<button class="btn btn-soft" type="button" onclick="togglePayForm(\'' + esc(booking.hike_id) + '\')">Cancel</button>' +
        '</form></div></td>' +
    '</tr>';
  }).join("");
}

function togglePayForm(hikeId) {
  var wrap = document.getElementById('pay-form-' + hikeId);
  if (wrap) wrap.hidden = !wrap.hidden;
}

function renderDashboardCards() {
  var wrap = document.getElementById("dashboardBookings");
  var empty = document.getElementById("dashboardEmpty");
  if (!wrap || !empty) return;
  if (!userBookings.length) {
    wrap.innerHTML = "";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  wrap.innerHTML = userBookings.map(function(booking) {
    var copy = statusCopy(booking.status);
    var price = formatBookingPrice(booking);
    var paymentAccount = paymentAccountFor(booking.payment_method);
    var accountLine = paymentAccount ? paymentAccount.accountLabel + ': ' + paymentAccount.accountNumber : '-';
    var hasSender = !!booking.sender_account;
    var isRejected = booking.status === 'rejected';
    var canUpdatePayment = booking.status !== 'accepted' && (isRejected || !hasSender);

    function item(label, val) {
      return '<div class="booking-detail"><span>' + esc(label) + '</span><strong>' + esc(val || '-') + '</strong></div>';
    }

    var action = canUpdatePayment
      ? '<button class="btn btn-sm btn-orange" onclick="togglePayForm(\'' + esc(booking.hike_id) + '\')">' + (isRejected ? 'Resubmit' : 'I\'ve Paid') + '</button>'
      : '';
    var alert = isRejected ? '<div class="booking-alert">Rejected. Check the payment account and resubmit your payment details.</div>' : '';
    var formLabel = isRejected ? 'Correct account/phone you paid from' : 'Enter account/phone you paid from';
    var formValue = isRejected ? booking.sender_account || '' : '';

    return '<article class="booking-card">' +
      '<div class="booking-card-head">' +
        '<div><span>User ID</span><strong>' + esc(formatDisplayId(booking.user_id || currentUser.id)) + '</strong></div>' +
        '<div><span>Hike ID</span><strong>' + esc(booking.hike_id) + '</strong><button class="copy-btn-sm" type="button" data-copy-value="' + esc(booking.hike_id) + '" title="Copy Hike ID">Copy</button></div>' +
        '<span class="status-badge ' + statusBadgeClass(booking.status) + '">' + esc(copy.label) + '</span>' +
      '</div>' +
      alert +
      '<div class="booking-detail-grid">' +
        item('Name', booking.full_name) +
        item('Phone', booking.phone) +
        item('Trip', booking.destination || booking.package_name) +
        item('Package', booking.package_name) +
        item('People', booking.participants_count || 1) +
        item('Price', price) +
        item('Payment', booking.payment_method || '-') +
        item('Pay to', accountLine) +
        item('Paid from', booking.sender_account || '-') +
        item('Registered', formatDate(booking.created_at || booking.submitted_date)) +
      '</div>' +
      (action ? '<div class="booking-card-actions">' + action + '</div>' : '') +
      '<div class="pay-form-wrap" id="pay-form-' + esc(booking.hike_id) + '" hidden>' +
        '<form class="payment-update-form" data-hike-id="' + esc(booking.hike_id) + '">' +
          '<label>' + esc(formLabel) + '<input name="sender_account" value="' + esc(formValue) + '" placeholder="e.g. +251912345678"></label>' +
          '<button class="btn btn-orange" type="submit">Confirm</button>' +
          '<button class="btn btn-soft" type="button" onclick="togglePayForm(\'' + esc(booking.hike_id) + '\')">Cancel</button>' +
        '</form></div>' +
    '</article>';
  }).join("");
}

function inboxKey() { return 'ereft_inbox_read_' + (currentUser ? currentUser.id : 'anon'); }

function countUnread() {
  var lastRead = localStorage.getItem(inboxKey());
  var ts = lastRead ? new Date(lastRead).getTime() : 0;
  var n = 0;
  (userBookings || []).forEach(function(b) {
    if (b.admin_message && new Date(b.updated_at || b.created_at).getTime() > ts) n++;
  });
  (tripNotices || []).forEach(function(nn) {
    if (nn.created_at && new Date(nn.created_at).getTime() > ts) n++;
  });
  return n;
}

function updateInboxBadge() {
  var badge = document.getElementById('inboxBadge');
  if (!badge) return;
  var n = countUnread();
  badge.hidden = n === 0;
  badge.textContent = n > 9 ? '9+' : n;
}

function renderInbox() {
  var list = document.getElementById('inboxList');
  var empty = document.getElementById('inboxEmpty');
  if (!list || !empty) return;
  var bookingMsgs = userBookings.filter(function(b) { return b.admin_message; });
  var allMsgs = [];
  bookingMsgs.forEach(function(b) {
    var ts = b.updated_at || b.created_at;
    allMsgs.push({
      type:'booking',
      hike_id: b.hike_id,
      message: b.admin_message,
      time: ts ? new Date(ts).toLocaleString() : '',
      sortTime: ts ? new Date(ts).getTime() : 0
    });
  });
  tripNotices.forEach(function(n) {
    allMsgs.push({
      type:'notice',
      trip_name: n.trip_name,
      message: n.message,
      time: n.created_at ? new Date(n.created_at).toLocaleString() : '',
      sortTime: n.created_at ? new Date(n.created_at).getTime() : 0
    });
  });
  if (!allMsgs.length) {
    list.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  allMsgs.sort(function(a, b) { return b.sortTime - a.sortTime; });
  list.innerHTML = allMsgs.map(function(m) {
    var label = m.type === 'notice' ? '<span class="inbox-notice-badge">Notice</span> ' + esc(m.trip_name) : esc(m.hike_id);
    return '<div class="inbox-msg">' +
      '<div class="inbox-msg-head"><strong>' + label + '</strong><span class="inbox-msg-date">' + esc(m.time) + '</span></div>' +
      '<div class="inbox-msg-body">' + esc(m.message) + '</div>' +
    '</div>';
  }).join('');
}

async function fetchTripNotices() {
  if (!supabaseClient || !currentSessionToken) { tripNotices = []; return; }
  try {
    var res = await supabaseClient.rpc('get_trip_notices', { p_session_token: currentSessionToken });
    if (res.error) throw res.error;
    tripNotices = res.data || [];
  } catch(e) {
    console.error('Failed to fetch trip notices:', e);
    tripNotices = [];
  }
}

async function openInbox() {
  if (!currentUser) {
    openAuthModal('signin', 'inbox');
    return;
  }
  openModal('inboxModal');
  await Promise.all([loadUserBookings(), fetchTripNotices()]);
  renderInbox();
  localStorage.setItem(inboxKey(), new Date().toISOString());
  updateInboxBadge();
}

function isStrongPass(p) {
  return p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p) && /[^a-zA-Z0-9]/.test(p);
}

function openUserSettings() {
  if (!currentUser) { openAuthModal("signin"); return; }
  document.getElementById("settingsUsername").value = currentUser.username || "";
  document.getElementById("settingsCurrPass").value = "";
  document.getElementById("settingsNewPass").value = "";
  document.getElementById("settingsConfirmPass").value = "";
  openModal("userSettingsModal");
}

async function saveUserSettings(form) {
  if (!supabaseClient || !currentUser || !currentSessionToken) { showSiteNotice("Please log in first.", "error"); return; }
  var username = document.getElementById("settingsUsername").value.trim();
  var currPass = document.getElementById("settingsCurrPass").value;
  var newPass = document.getElementById("settingsNewPass").value;
  var confirmPass = document.getElementById("settingsConfirmPass").value;
  if (!username || username.length < 3) { showSiteNotice("Username must be at least 3 characters.", "error"); return; }
  if (!currPass) { showSiteNotice("Enter your current password.", "error"); return; }
  if (newPass && newPass !== confirmPass) { showSiteNotice("New passwords do not match.", "error"); return; }
  if (newPass && !isStrongPass(newPass)) { showSiteNotice("New password must be 8+ chars with uppercase, lowercase, digit, and special character.", "error"); return; }

  var btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.textContent = "Saving...";
  try {
    if (username !== currentUser.username) {
      var userRes = await supabaseClient.rpc("user_change_username", {
        p_session_token: currentSessionToken,
        p_new_username: username
      });
      if (userRes.error) throw userRes.error;
      if (!userRes.data || !userRes.data.success) throw new Error((userRes.data && userRes.data.error) || "Could not change username.");
      saveSiteSession({ session_token: currentSessionToken, user: { id: currentUser.id, username: username, phone: currentUser.phone } });
      currentUser.username = username;
      updateAuthUI();
    }
    if (newPass) {
      var passRes = await supabaseClient.rpc("user_change_password", {
        p_session_token: currentSessionToken,
        p_current_password: currPass,
        p_new_password: newPass
      });
      if (passRes.error) throw passRes.error;
      if (!passRes.data || !passRes.data.success) throw new Error((passRes.data && passRes.data.error) || "Could not change password.");
    }
    showSiteNotice("Settings saved.", "success");
    closeModals();
  } catch (err) {
    console.error("Settings save failed:", err);
    showSiteNotice(err.message || "Could not save settings.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Save";
  }
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
    var dashboardWrap = document.getElementById("dashboardBookings");
    var needsInitialRender = !dashboardWrap || dashboardWrap.innerHTML.trim() === "";
    var before = JSON.stringify(userBookings);
    await loadUserBookings();
    var changed = before !== JSON.stringify(userBookings);
    if (!silent || changed || needsInitialRender) renderDashboardCards();
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
  var tx = "";
  if (!sender) {
    showSiteNotice("Add the account or phone you paid from first.", "error");
    return;
  }
  var button = form.querySelector("button");
  button.disabled = true;
  button.textContent = "Saving...";
  try {
    var result = await supabaseClient.rpc("submit_booking_payment", {
      p_session_token:currentSessionToken,
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
    ? 'Your Hike ID is ' + id + '. Write it in the payment note.'
    : 'Booking created. Share your Hike ID when paying.';
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

function reduceLocalTripSeats(destination, count) {
  var people = cleanPeopleCount(count || 1);
  hikingDestinations.forEach(function(trip) {
    if (trip.name === destination) {
      trip.spotsLeft = Math.max(0, Number(trip.spotsLeft || 0) - people);
    }
  });
}

function tripDateLabel(trip) {
  return trip.date || "Coming soon";
}

function tripDurationLabel(trip) {
  return trip.duration || "Trip";
}

function tripLocationLabel(trip) {
  return trip.location || trip.place || trip.category || trip.start || "Ethiopia";
}

function tripSpotsLabel(trip) {
  var spots = Number(trip.spotsLeft || 0);
  return spots === 1 ? "1 Left" : spots + " Left";
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
        <span class="duration-badge">${esc(tripDateLabel(trip))}</span>
      </div>
      <div class="destination-body">
        <div class="destination-content-row">
          <div class="destination-main">
            <h3>${esc(trip.name)}</h3>
            <span class="destination-location">${CARD_PIN_ICON}${esc(tripLocationLabel(trip))}</span>
            <p>${esc(trip.description || "")}</p>
          </div>
          <div class="trip-meta-card" aria-label="Trip quick details">
            <span class="trip-meta-item trip-meta-date">${CARD_CALENDAR_ICON}<span>${esc(tripDateLabel(trip))}</span></span>
            <span class="trip-meta-item trip-meta-duration">${CARD_CLOCK_ICON}<span>${esc(tripDurationLabel(trip))}</span></span>
            <span class="trip-meta-item trip-meta-seats">${CARD_PEOPLE_ICON}<span>${esc(tripSpotsLabel(trip))}</span></span>
          </div>
        </div>
        <div class="card-actions">
          <button class="card-details" data-destination="${esc(trip.name)}">${CARD_EYE_ICON}View Details</button>
          <button class="card-register" data-destination="${esc(trip.name)}">${CARD_PACKAGE_ICON}Packages</button>
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
    var isDay = pkg.name && pkg.name.toLowerCase().indexOf('day') !== -1;
    var typeLabel = isDay ? 'Day Trip' : 'Overnight';
    var typeEmoji = isDay ? '☀️' : '🌙';
    var list = normalizePackageFeatures(features).map(function(item) {
      return '<li><span class="pkg-check"></span><span class="pkg-feat-text">' + esc(item) + '</span><span class="pkg-feat-emoji">' + includedEmoji(item) + '</span></li>';
    }).join("");
    return '<article class="pricing-card' + (featured ? ' featured' : '') + '">' +
      '<div class="pkg-top">' +
        '<h3>' + esc(pkg.name) + '</h3>' +
        '<span class="pkg-badge">' + typeEmoji + ' ' + typeLabel + '</span>' +
      '</div>' +
      (pkg.sub ? '<p class="pkg-sub">' + esc(pkg.sub) + '</p>' : '') +
      '<div class="pkg-price-row">' +
        (price ? '<span class="pkg-price-icon">💵</span><span class="price">' + esc(price) + '</span> <span class="pkg-person">/ person</span>' : '') +
      '</div>' +
      '<ul class="pkg-features">' + list + '</ul>' +
      '<button class="btn btn-orange full choose-package" data-package="' + esc(pkg.name) + '">🎒 Choose Package</button>' +
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

function expectEmoji(text) {
  var t = (text || "").toLowerCase();
  if (t.includes("air") || t.includes("fresh") || t.includes("breeze") || t.includes("አየር")) return "💨";
  if (t.includes("mountain") || t.includes("lake") || t.includes("view") || t.includes("scenery") || t.includes("landscape") || t.includes("ተራራ") || t.includes("ሐይቅ") || t.includes("እይታ")) return "🏞️";
  if (t.includes("nature") || t.includes("trail") || t.includes("forest") || t.includes("tree") || t.includes("plant") || t.includes("ተፈጥሮ") || t.includes("ጫካ") || t.includes("ዛፍ")) return "🌿";
  if (t.includes("coffee") || t.includes("ceremony") || t.includes("ቡና") || t.includes("ፍዩል")) return "☕";
  if (t.includes("photo") || t.includes("camera") || t.includes("picture") || t.includes("instagram") || t.includes("ፎቶ") || t.includes("ስዕል")) return "📸";
  if (t.includes("group") || t.includes("fun") || t.includes("friend") || t.includes("community") || t.includes("team") || t.includes("ቡድን") || t.includes("ወዳጅ")) return "👥";
  if (t.includes("hike") || t.includes("walk") || t.includes("trek") || t.includes("climb") || t.includes("trail") || t.includes("እግር") || t.includes("መራመድ")) return "🚶";
  if (t.includes("culture") || t.includes("local") || t.includes("tradition") || t.includes("heritage") || t.includes("ባህል") || t.includes("ልማድ")) return "🎭";
  if (t.includes("river") || t.includes("waterfall") || t.includes("stream") || t.includes("pond") || t.includes("ወንዝ") || t.includes("ፏፏቴ")) return "🌊";
  if (t.includes("sunset") || t.includes("sunrise") || t.includes("dawn") || t.includes("dusk") || t.includes("ፀሐይ")) return "🌅";
  if (t.includes("bird") || t.includes("animal") || t.includes("wildlife") || t.includes("monkey") || t.includes("አውሬ") || t.includes("ወፍ")) return "🦅";
  if (t.includes("camp") || t.includes("outdoor") || t.includes("camping") || t.includes("ካምፕ")) return "⛺";
  if (t.includes("food") || t.includes("meal") || t.includes("lunch") || t.includes("breakfast") || t.includes("dinner") || t.includes("eat") || t.includes("ምግብ") || t.includes("ቁርስ") || t.includes("ምሳ")) return "🍽️";
  if (t.includes("water") || t.includes("drink") || t.includes("hydrat") || t.includes("ውሃ") || t.includes("መጠጥ")) return "💧";
  if (t.includes("fire") || t.includes("bbq") || t.includes("grill") || t.includes("እሳት") || t.includes("ጥብስ")) return "🔥";
  if (t.includes("swim") || t.includes("swimming") || t.includes("pool") || t.includes("መዋኘት")) return "🏊";
  if (t.includes("game") || t.includes("play") || t.includes("activity") || t.includes("ጨዋታ") || t.includes("መጫወት")) return "🎯";
  if (t.includes("rest") || t.includes("relax") || t.includes("break") || t.includes("ማረፍ") || t.includes("ዕረፍት")) return "😌";
  return "🌄";
}

function includedEmoji(text) {
  var t = (text || "").toLowerCase();
  if (t.includes("ትራንስ") || t.includes("ኮስተር") || t.includes("ባስ") || t.includes("transport") || t.includes("bus") || t.includes("coaster") || t.includes("transp")) return "🚌";
  if (t.includes("አስጎብ") || t.includes("ጀት") || t.includes("ጠባቂ") || t.includes("guide") || t.includes("leader") || t.includes("escort") || t.includes("ranger") || t.includes("security")) return "🧑‍💼";
  if (t.includes("ቁርስ") || t.includes("ምሳ") || t.includes("እራት") || t.includes("ምግብ") || t.includes("ድንሽ") || t.includes("food") || t.includes("meal") || t.includes("lunch") || t.includes("breakfast") || t.includes("dinner") || t.includes("eat") || t.includes("potato")) return "🍽️";
  if (t.includes("ውሃ") || t.includes("ሻይ") || t.includes("ቡና") || t.includes("water") || t.includes("drink") || t.includes("beverage")) return "💧";
  if (t.includes("ካምፕ") || t.includes("ምሽት") || t.includes("ድንኳን") || t.includes("መሳርያ") || t.includes("ቡርድ") || t.includes("ልብስ") || t.includes("camp") || t.includes("tent") || t.includes("camping") || t.includes("sleep") || t.includes("overnight") || t.includes("equipment") || t.includes("gear") || t.includes("blanket") || t.includes("clothes")) return "⛺";
  if (t.includes("ፓርክ") || t.includes("ዋጋ") || t.includes("መግቢያ") || t.includes("ቲኬት") || t.includes("ticket") || t.includes("entrance") || t.includes("entry") || t.includes("fee") || t.includes("park")) return "📋";
  if (t.includes("ፎቶ") || t.includes("photo") || t.includes("camera") || t.includes("picture")) return "📸";
  if (t.includes("ጨዋታ") || t.includes("ሽልማት") || t.includes("ፈን") || t.includes("እሳት") || t.includes("ትብስ") || t.includes("ጥብስ") || t.includes("game") || t.includes("prize") || t.includes("award") || t.includes("fun") || t.includes("play") || t.includes("group") || t.includes("team") || t.includes("fire") || t.includes("bbq") || t.includes("grill")) return "👥";
  if (t.includes("ደስ") || t.includes("enjoy")) return "🎉";
  return "✅";
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
  document.getElementById("tripDetailDuration").textContent = trip.duration || "Trip";
  document.getElementById("tripDetailDate").textContent = trip.date || "Coming soon";
  document.getElementById("tripDetailStart").textContent = trip.start || "Not specified";
  var spots = Number(trip.spotsLeft || 0);
  document.getElementById("tripDetailSpots").textContent = spots === 1 ? "1 Left" : spots + " Left";
  document.getElementById("tripExpectList").innerHTML = (trip.expect || []).map(function(item) {
    return '<li><span>' + esc(item) + '</span><span class="expect-emoji">' + expectEmoji(item) + '</span></li>';
  }).join("");
  const features = activePackageView === "native" ? nativeFeatures : foreignerFeatures;
  document.getElementById("tripIncludedList").innerHTML = normalizePackageFeatures(features).map(function(item) {
    return '<li><span class="incl-check"></span><span class="incl-text">' + esc(item) + '</span><span class="incl-emoji">' + includedEmoji(item) + '</span></li>';
  }).join("");
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
    openAuthModal("signup", "register");
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
  updatePackagePriceDisplay();
  updatePaymentGuide();
  showRegistrationStep(1);
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
  document.getElementById("profileTrigger").addEventListener("click", function(e) {
    e.stopPropagation();
    toggleProfileMenu();
  });
  document.getElementById("profileOverlay").addEventListener("click", function() { toggleProfileMenu(false); });
  document.getElementById("profileInboxBtn").addEventListener("click", function() { toggleProfileMenu(false); openInbox(); });
  document.getElementById("profileDashBtn").addEventListener("click", function() { toggleProfileMenu(false); openDashboard(); });
  document.getElementById("profileSettingsBtn").addEventListener("click", function() { toggleProfileMenu(false); openUserSettings(); });
  document.getElementById("profileLogoutBtn").addEventListener("click", async function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    toggleProfileMenu(false);
    await signOutUser();
  });
  document.getElementById("dashboardRefreshButton").addEventListener("click", () => refreshDashboard(false));
  document.getElementById("successViewDashboardButton").addEventListener("click", function() {
    closeModals();
    openDashboard();
  });
  document.getElementById("registrationNextButton").addEventListener("click", goToPaymentStep);
  document.getElementById("registrationBackButton").addEventListener("click", function() { showRegistrationStep(1); });
  if (paymentMethodSelect) paymentMethodSelect.addEventListener("change", () => updatePaymentGuide());
  if (otherPaymentNameInput) otherPaymentNameInput.addEventListener("input", () => updatePaymentGuide());
  if (participantsCountInput) participantsCountInput.addEventListener("input", updatePackagePriceDisplay);
  if (phoneInput) phoneInput.addEventListener("input", function() { normalizeEthiopianPhone(true); updateBookingPaymentSummary(); });
  ["fullName", "gender"].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("input", updateBookingPaymentSummary);
    if (el) el.addEventListener("change", updateBookingPaymentSummary);
  });
  if (destinationSelect) destinationSelect.addEventListener("change", updateBookingPaymentSummary);
  document.getElementById("menuToggle").addEventListener("click", function() {
    var nav = document.querySelector(".main-nav");
    var open = nav.classList.toggle("open");
    this.classList.toggle("open", open);
    this.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.querySelectorAll(".auth-tab").forEach(function(tab) {
    tab.addEventListener("click", function() { switchAuthTab(tab.dataset.authTab); });
  });
  document.querySelectorAll("[data-google-auth]").forEach(function(button) {
    button.addEventListener("click", function() { startGoogleAuth(button.dataset.googleAuth); });
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
  document.addEventListener("click", function(e) {
    if (e.target.closest("#profileLogoutBtn")) {
      e.preventDefault();
      toggleProfileMenu(false);
      signOutUser();
      return;
    }
    if (!e.target.closest(".profile-dropdown")) toggleProfileMenu(false);
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
  document.getElementById("userSettingsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await saveUserSettings(e.currentTarget);
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
      replacePackageFeatures(nativeFeatures, p.nativeDay.features);
    }
    if (p.nativeOvernight && p.nativeOvernight.features) {
      replacePackageFeatures(nativeOvernightFeatures, p.nativeOvernight.features);
    }
    if (p.foreignerDay && p.foreignerDay.features) {
      replacePackageFeatures(foreignerFeatures, p.foreignerDay.features);
    }
    if (p.foreignerOvernight && p.foreignerOvernight.features) {
      replacePackageFeatures(foreignerOvernightFeatures, p.foreignerOvernight.features);
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
  }
}

async function submitRegistration(form) {
  if (!currentUser) {
    openAuthModal("signup", "register");
    return;
  }
  if (!validateRegistrationDetails(true)) {
    showRegistrationStep(1);
    return;
  }
  if (!destinationSelect.value || !packageInput.value) {
    showSiteNotice("Choose a destination and package before submitting.", "error");
    return;
  }

  selectedPackageMeta = getPackageByName(packageInput.value);
  var trip = findTrip(destinationSelect.value);
  var peopleCount = cleanPeopleCount(participantsCountInput ? participantsCountInput.value : 1);
  var paymentMethod = selectedPaymentLabel();
  var senderAccount = senderAccountInput ? senderAccountInput.value.trim() : "";
  if (!paymentMethod) {
    showRegistrationStep(2);
    showSiteNotice("Choose how you will pay before submitting.", "error");
    paymentMethodSelect?.focus();
    return;
  }
  if (paymentMethodSelect && paymentMethodSelect.value === "other" && !otherPaymentNameInput?.value.trim()) {
    showRegistrationStep(2);
    showSiteNotice("Write the bank or wallet name you will use.", "error");
    otherPaymentNameInput?.focus();
    return;
  }
  if (paymentMethodSelect && paymentMethodSelect.value !== "cash" && !senderAccount) {
    showRegistrationStep(2);
    showSiteNotice("Enter the account or phone number you will pay from.", "error");
    senderAccountInput?.focus();
    return;
  }
  var payload = {
    full_name: document.getElementById("fullName").value.trim(),
    age: parseInt(document.getElementById("age").value) || null,
    phone: getNormalizedPhoneValue(),
    participants_count: peopleCount,
    gender: document.getElementById("gender").value,
    destination: destinationSelect.value,
    package_name: packageInput.value,
    trip_date: trip ? trip.date || "" : "",
    price: getPackageTotalPrice(selectedPackageMeta, peopleCount),
    currency: selectedPackageMeta ? selectedPackageMeta.currency || "ETB" : "ETB",
    payment_method: paymentMethod,
    sender_account: senderAccount,
    transaction_id: "",
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
        p_session_token: currentSessionToken,
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

      if (!rpcResponse.error && rpcResponse.data) {
        booking = normalizeBooking(Array.isArray(rpcResponse.data) ? rpcResponse.data[0] : rpcResponse.data);
      } else {
        throw rpcResponse.error || new Error("Booking could not be created.");
      }
    } else {
      throw new Error("Could not connect to database. Please try again later.");
    }

    userBookings.unshift(booking);
    reduceLocalTripSeats(payload.destination, payload.participants_count);
    renderDestinations();
    closeModals();
    renderSuccessBooking(booking);
    openModal("successModal");
    form.reset();
    showRegistrationStep(1);
    normalizeEthiopianPhone(false);
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
    await completeGoogleAuth();
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

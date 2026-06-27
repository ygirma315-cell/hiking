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
var currentUser = null;
var currentProfile = null;
var currentSessionToken = null;
var userBookings = [];
var dashboardRefreshTimer = null;
var pendingAuthAction = null;
var selectedPackageMeta = null;
var registrationStep = 1;

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
  var profileAvatar = document.getElementById("profileAvatar");

  if (loginButton) loginButton.hidden = loggedIn;
  if (profileDropdown) profileDropdown.hidden = !loggedIn;

  if (loggedIn && currentUser) {
    var name = currentUser.username || "User";
    var initial = name.charAt(0).toUpperCase();
    if (profileName) profileName.textContent = name;
    if (profileUsername) profileUsername.textContent = "@" + name;
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
    if (!saved || !saved.session_token || !saved.user) return null;
    return saved;
  } catch (_) {
    return null;
  }
}

function saveSiteSession(payload) {
  var token = payload && (payload.session_token || payload.token);
  var user = payload && payload.user;
  if (!token || !user) return false;
  currentSessionToken = token;
  currentUser = {
    id:user.id,
    username:user.username,
    phone:user.phone || ""
  };
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
  localStorage.removeItem(SITE_SESSION_KEY);
}

async function loadCurrentUser() {
  var saved = readStoredSiteSession();
  if (!saved) {
    clearSiteSession();
    updateAuthUI();
    return;
  }

  currentSessionToken = saved.session_token;
  currentUser = saved.user;
  currentProfile = saved.user;

  if (supabaseClient && currentSessionToken) {
    try {
      var current = await supabaseClient.rpc("get_current_user", { p_session_token:currentSessionToken });
      if (current.error || !current.data || !current.data.success) {
        clearSiteSession();
      } else {
        saveSiteSession({
          session_token:currentSessionToken,
          user:current.data.user
        });
      }
    } catch (error) {
      console.warn("User session check failed:", error);
    }
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
      throw new Error("Login setup is incomplete. Run the latest Supabase SQL setup.");
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
      throw new Error("Signup setup is incomplete. Run the latest Supabase SQL setup.");
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

async function signOutUser() {
  stopDashboardLiveRefresh();
  userBookings = [];
  var token = currentSessionToken;
  if (supabaseClient && token) {
    supabaseClient.rpc("user_logout", { p_session_token:token }).catch(function() {});
  }
  clearSiteSession();
  updateAuthUI();
  closeModals();
  showSiteNotice("Logged out.", "success");
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
    if (hasSender) {
      return '<tr>' +
        '<td data-label="Hike ID"><div class="hike-id-cell"><strong>' + esc(booking.hike_id) + '</strong><button class="copy-btn-sm" type="button" data-copy-value="' + esc(booking.hike_id) + '" title="Copy Hike ID">Copy</button></div></td>' +
        '<td colspan="9"><div class="submitted-info"><span>Name: <b>' + esc(booking.full_name) + '</b></span><span>Phone: <b>' + esc(booking.phone) + '</b></span><span>Pax: <b>' + esc(booking.participants_count || 1) + '</b></span><span>Price: <b>' + esc(price) + '</b></span><span>Paid from: <b>' + esc(booking.sender_account) + '</b></span><span>Via: <b>' + esc(booking.payment_method || '-') + '</b></span><span class="status-badge ' + statusBadgeClass(booking.status) + '">' + esc(copy.label) + '</span></div></td>' +
      '</tr>';
    }
    return '<tr>' +
      '<td data-label="Hike ID"><div class="hike-id-cell"><strong>' + esc(booking.hike_id) + '</strong><button class="copy-btn-sm" type="button" data-copy-value="' + esc(booking.hike_id) + '" title="Copy Hike ID">Copy</button></div></td>' +
      '<td colspan="9"><div class="pending-pay-info">' +
        '<span>Trip: <b>' + esc(booking.destination || booking.package_name) + '</b></span>' +
        '<span>Price: <b>' + esc(price) + '</b></span>' +
        '<span>Pay to: <b>' + accountLine + '</b></span>' +
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
  document.getElementById("profileDashBtn").addEventListener("click", function() { toggleProfileMenu(false); openDashboard(); });
  document.getElementById("profileLogoutBtn").addEventListener("click", function() { toggleProfileMenu(false); signOutUser(); });
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

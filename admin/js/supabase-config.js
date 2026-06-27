window.EREFT_SUPABASE = {
  url: "https://mrbzlszwtzfeftrsphzj.supabase.co",
  anonKey: "sb_publishable_P6P8Z3JT8u193FGD8MziKg_-YwlcAIB"
};

window.ereftSupabaseClient = function ereftSupabaseClient() {
  var cfg = window.EREFT_SUPABASE || {};
  var ready = cfg.url &&
    cfg.anonKey &&
    !cfg.url.includes("YOUR-PROJECT-REF") &&
    !cfg.anonKey.includes("YOUR-SUPABASE-ANON-KEY") &&
    window.supabase;

  return ready ? window.supabase.createClient(cfg.url, cfg.anonKey) : null;
};

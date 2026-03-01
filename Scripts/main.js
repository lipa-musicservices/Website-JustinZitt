/* ==============================================================================
    __    _ ____            __  ___           _         _____                 _
   / /   (_) __ \____ _    /  |/  /_  _______(_)____   / ___/___  ______   __(_)_______  _____
  / /   / / /_/ / __ `/   / /|_/ / / / / ___/ / ___/   \__ \/ _ \/ ___/ | / / / ___/ _ \/ ___/
 / /___/ / ____/ /_/ /   / /  / / /_/ (__  ) / /__    ___/ /  __/ /   | |/ / / /__/  __(__  )
/_____/_/_/    \__,_/   /_/  /_/\__,_/____/_/\___/   /____/\___/_/    |___/_/\___/\___/____/

   LiPa Music Services – Abteilung Webentwicklung
   © 2026 LiPa Music Services GbR
   https://www.lipamusicservices.com
============================================================================== */
(function(){
  "use strict";

  const STORAGE_COOKIE = "lipa.cookieConsent.v1";

  // -------------------------
  // Helpers
  // -------------------------
  function qs(sel, root=document){ return root.querySelector(sel); }
  function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

  function once(el, key){
    if(!el) return false;
    if(el.dataset[key] === "1") return false;
    el.dataset[key] = "1";
    return true;
  }

  function debounce(fn, ms){
    let t = null;
    return function(){
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  // -------------------------
  // Footer year
  // -------------------------
  function setFooterYear(){
    const year = String(new Date().getFullYear());
    qsa("#YearSlot").forEach(el => { el.textContent = year; });
  }

  // -------------------------
  // Cookie banner
  // Expects:
  //  - #CookieOverlay
  //  - #CookieAccept, #CookieDecline
  // -------------------------
  function initCookie(){
    const overlay = document.getElementById("CookieOverlay");
    if(!overlay || !once(overlay, "bound")) return;

    const accept  = document.getElementById("CookieAccept");
    const decline = document.getElementById("CookieDecline");
    if(!accept || !decline) return;

    function close(){
      overlay.style.display = "none";
      document.body.style.overflow = "";
    }
    function open(){
      overlay.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
    function setConsent(v){
      try{ localStorage.setItem(STORAGE_COOKIE, v); }catch(e){}
      document.documentElement.dataset.consent = v;
    }

    const existing = (() => {
      try{ return localStorage.getItem(STORAGE_COOKIE); }catch(e){ return null; }
    })();

    if(!existing){
      open();
    }else{
      document.documentElement.dataset.consent = existing;
      close();
    }

    accept.addEventListener("click", () => { setConsent("accept"); close(); });
    decline.addEventListener("click", () => { setConsent("decline"); close(); });
  }

  // -------------------------
  // Headbar: switch Desktop <-> Burger based on real width
  // Requires classes:
  //  .Headbar
  //  .Headbar__inner
  //  .Headbar__brand
  //  .Headbar__menu (ul)
  //  .Headbar__lang
  //  .Headbar__burger
  //
  // CSS expectation:
  //  .Headbar.is-mobile .Headbar__nav { display:none; }
  //  .Headbar.is-mobile .Headbar__burger { display:inline-flex; }
  // -------------------------
  function updateHeadbarMode(){
    const headbar = qs(".Headbar");
    if(!headbar) return;

    const inner  = qs(".Headbar__inner", headbar);
    const brand  = qs(".Headbar__brand", headbar);
    const menu   = qs(".Headbar__menu", headbar);
    const lang   = qs(".Headbar__lang", headbar);
    const burger = qs(".Headbar__burger", headbar);

    if(!inner || !brand || !menu || !lang || !burger) return;

    // Force desktop for measurement
    headbar.classList.remove("is-mobile");

    // Measure available vs needed
    const innerW = inner.clientWidth;

    const brandW = brand.getBoundingClientRect().width;
    const menuW  = menu.getBoundingClientRect().width;
    const langW  = lang.getBoundingClientRect().width;

    // Safety margin so it doesn't "just barely" collide
    const safety = 28;

    const needed = brandW + menuW + langW + safety;

    if(needed > innerW){
      headbar.classList.add("is-mobile");
    }else{
      headbar.classList.remove("is-mobile");
    }
  }

  function initHeadbarMode(){
    // bind resize only once
    const html = document.documentElement;
    if(!once(html, "headbarResizeBound")){
      window.addEventListener("resize", debounce(updateHeadbarMode, 60), { passive:true });
    }

    updateHeadbarMode();

    // If fonts load late, re-measure once
    if(document.fonts && document.fonts.ready){
      document.fonts.ready.then(updateHeadbarMode).catch(()=>{});
    }
  }

  // -------------------------
  // Burger toggle
  // Needs:
  //  .Headbar__burger
  //  #MobileMenu  (or .MobileMenu, but you use ID)
  // -------------------------
  function initBurger(){
    const burger = qs(".Headbar__burger");
    const menu   = document.getElementById("MobileMenu");
    const headbar= qs(".Headbar");

    if(!burger || !menu) return;
    if(!once(menu, "burgerBound")) return;

    function open(){
      menu.classList.add("is-open");
      burger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    function close(){
      menu.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
    function toggle(){
      menu.classList.contains("is-open") ? close() : open();
    }

    burger.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");

    burger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    });

    // clicks inside menu do not close
    menu.addEventListener("click", (e) => e.stopPropagation());

    // close on outside click
    document.addEventListener("click", (e) => {
      if(!menu.classList.contains("is-open")) return;
      const inBurger = burger.contains(e.target);
      const inMenu   = menu.contains(e.target);
      const inHead   = headbar ? headbar.contains(e.target) : false;
      if(!inBurger && !inMenu && !inHead) close();
    });

    // close on ESC
    document.addEventListener("keydown", (e) => {
      if(e.key === "Escape" && menu.classList.contains("is-open")) close();
    });

    // close after clicking a link
    qsa("a", menu).forEach(a => a.addEventListener("click", close));

    // IMPORTANT: when switching back to desktop, close menu
    window.addEventListener("resize", debounce(() => {
      updateHeadbarMode();
      const hb = qs(".Headbar");
      if(hb && !hb.classList.contains("is-mobile")) close();
    }, 80), { passive:true });
  }

  // -------------------------
  // Master init
  // Runs after partials are loaded (preferred)
  // plus DOMContentLoaded fallback
  // -------------------------
  function initAll(){
    setFooterYear();
    initCookie();
    initHeadbarMode();
    initBurger();
  }

  document.addEventListener("partials:loaded", initAll);
  document.addEventListener("DOMContentLoaded", initAll);

})();
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

  function resolveUrl(relUrl){
    return new URL(relUrl, document.baseURI).toString();
  }

  async function fetchPartial(relUrl){
    const url = resolveUrl(relUrl);

    const res = await fetch(url, {
      cache: "no-store"
    });

    if(!res.ok){
      throw new Error(`HTTP ${res.status} for ${url}`);
    }

    return await res.text();
  }

  async function runScriptsInside(container){
    const scripts = Array.from(container.querySelectorAll("script"));

    for(const oldScript of scripts){
      const newScript = document.createElement("script");

      for(const attr of oldScript.attributes){
        newScript.setAttribute(attr.name, attr.value);
      }

      if(oldScript.src){
        newScript.src = oldScript.src;

        await new Promise((resolve) => {
          newScript.onload = resolve;
          newScript.onerror = () => {
            console.warn("[includes] external script failed:", newScript.src);
            resolve();
          };

          oldScript.parentNode.replaceChild(newScript, oldScript);
        });
      }else{
        newScript.textContent = oldScript.textContent || "";
        oldScript.parentNode.replaceChild(newScript, oldScript);
      }
    }
  }

  async function inject(slotId, relUrl){
    const slot = document.getElementById(slotId);
    if(!slot) return;

    try{
      const html = await fetchPartial(relUrl);

      const template = document.createElement("template");
      template.innerHTML = html.trim();

      slot.innerHTML = "";
      slot.appendChild(template.content.cloneNode(true));

      await runScriptsInside(slot);

      console.info(`[includes] loaded: ${slotId} <- ${relUrl}`);
    }catch(err){
      console.warn(`[includes] ${slotId} failed:`, err);
      slot.innerHTML = "";
    }
  }

  function initYearSlots(){
    const year = String(new Date().getFullYear());

    document.querySelectorAll("#YearSlot, .YearSlot, [data-current-year]").forEach((el) => {
      el.textContent = year;
    });
  }

  function initHeadbar(){
    const burger =
      document.querySelector(".Burger") ||
      document.querySelector(".LipaHead__burger");

    const panel =
      document.getElementById("MobileMenu") ||
      document.getElementById("LipaMobileMenu") ||
      document.querySelector(".MobileMenu") ||
      document.querySelector(".LipaMobile");

    if(!burger || !panel) return;

    const setOpen = (isOpen) => {
      burger.setAttribute("aria-expanded", String(isOpen));
      panel.classList.toggle("is-open", isOpen);
    };

    if(!burger.dataset.boundBurger){
      burger.addEventListener("click", () => {
        const isOpen = burger.getAttribute("aria-expanded") === "true";
        setOpen(!isOpen);
      });

      burger.dataset.boundBurger = "true";
    }

    if(!document.documentElement.dataset.boundHeadbarEsc){
      document.addEventListener("keydown", (e) => {
        if(e.key === "Escape"){
          setOpen(false);
        }
      });

      document.documentElement.dataset.boundHeadbarEsc = "true";
    }

    if(!document.documentElement.dataset.boundHeadbarOutside){
      document.addEventListener("click", (e) => {
        const isOpen = burger.getAttribute("aria-expanded") === "true";
        if(!isOpen) return;

        const head =
          document.querySelector(".Headbar") ||
          document.querySelector(".LipaHead__bar") ||
          burger.closest("header");

        if(head && head.contains(e.target)) return;
        if(panel.contains(e.target)) return;

        setOpen(false);
      });

      document.documentElement.dataset.boundHeadbarOutside = "true";
    }
  }

  async function loadPartials(){
    await inject("HeadbarSlot", "Partials/headbar.html");
    await inject("FootbarSlot", "Partials/footbar.html");
    await inject("CookieSlot", "Partials/cookies.html");

    initYearSlots();
    initHeadbar();

    document.dispatchEvent(new Event("partials:loaded"));
    console.info("[includes] all partials loaded");
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", loadPartials, { once:true });
  }else{
    loadPartials();
  }
})();
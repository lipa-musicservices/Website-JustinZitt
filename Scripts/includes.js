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

  async function inject(slotId, relUrl){
    const slot = document.getElementById(slotId);
    if(!slot) return;

    // Wichtig: new URL(..., document.baseURI) respektiert /REPO/ Prefix + <base href="./">
    const url = new URL(relUrl, document.baseURI).toString();

    try{
      const res = await fetch(url, { cache: "no-cache" });
      if(!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      slot.innerHTML = await res.text();
    }catch(err){
      console.warn(`[includes] ${slotId} failed:`, err);
      slot.innerHTML = "";
    }
  }

  async function loadPartials(){
    // Deine Struktur: /de/Partials/... (und später /en/Partials/...)
    await Promise.all([
      inject("HeadbarSlot", "Partials/headbar.html"),
      inject("FootbarSlot", "Partials/footbar.html"),
      inject("CookieSlot",  "Partials/cookies.html"),
    ]);

    document.dispatchEvent(new Event("partials:loaded"));
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", loadPartials);
  }else{
    loadPartials();
  }
})();
document.addEventListener("header-loaded", () => {
  const burgerBtn = document.getElementById("burger-btn");
  if (!burgerBtn) return;

  const burgerIcon = burgerBtn.querySelector(".burger-animated-icon");
  const mobileMenu = document.getElementById("header-nav-mobile");
  const mobileParent = document.querySelector(".header-mobile-parent");
  const mobileSubmenu = document.querySelector(".header-mobile-submenu");

  // Toggle menú móvil y animación
  burgerBtn.addEventListener("click", () => {
    const isExpanded = burgerBtn.getAttribute("aria-expanded") === "true";
    const newExpandedState = !isExpanded;

    burgerBtn.setAttribute("aria-expanded", newExpandedState);
    burgerIcon.classList.toggle("open", newExpandedState);
    mobileMenu.classList.toggle("show", newExpandedState);
    document.querySelector('.site-header').classList.toggle('menu-open', newExpandedState);

    if (newExpandedState) {
      mobileMenu.removeAttribute("hidden");
      mobileMenu.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    } else {
      setTimeout(() => {
        if (!mobileMenu.classList.contains("show")) {
          mobileMenu.setAttribute("hidden", "");
        }
      }, 300); // Match CSS transition duration
      mobileMenu.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
  });

  if (mobileParent && mobileSubmenu) {
    mobileParent.addEventListener("click", (e) => {
      e.preventDefault();
      const isExpanded = mobileParent.getAttribute("aria-expanded") === "true";
      const newExpandedState = !isExpanded;

      mobileParent.setAttribute("aria-expanded", newExpandedState);
      mobileParent.classList.toggle("open", newExpandedState);
      mobileSubmenu.classList.toggle("show", newExpandedState);

      if (newExpandedState) {
        mobileSubmenu.removeAttribute("hidden");
      } else {
        mobileSubmenu.setAttribute("hidden", "");
      }
    });
  }
});

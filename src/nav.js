/* Mobile menu toggle, shared across every page's nav. */

export function initMobileNav() {
  const nav = document.getElementById("siteNav");
  const toggle = nav?.querySelector(".nav__menu-toggle");
  if (!nav || !toggle) return;

  const setOpen = (open) => {
    nav.classList.toggle("is-menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => {
    setOpen(!nav.classList.contains("is-menu-open"));
  });

  nav.querySelectorAll(".nav__links a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });
}

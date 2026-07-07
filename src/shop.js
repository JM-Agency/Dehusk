/* Shop page: footer form, mouse-tilt product cards, cursor spotlight, add-to-cart micro-interaction. */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------ Footer form -------------------------------- */

const footerForm = document.querySelector(".footer__form");
footerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const button = footerForm.querySelector("button");
  const input = footerForm.querySelector("input");
  if (!input.checkValidity()) return;
  button.textContent = "Thanks!";
  input.disabled = true;
  button.disabled = true;
});

/* ------------------------------ Tilt + spotlight ---------------------------
 * Each [data-tilt] card rotates gently toward the cursor (max ~6deg) and, if
 * it has a .shop-card__spotlight child, that child's radial-gradient origin
 * tracks the cursor too. Both reset smoothly on mouse leave.
 * ------------------------------------------------------------------------ */

const TILT_MAX_DEG = 6;

document.querySelectorAll("[data-tilt]").forEach((card) => {
  const spotlight = card.querySelector(".shop-card__spotlight");

  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    if (spotlight) {
      spotlight.style.setProperty("--mx", `${px * 100}%`);
      spotlight.style.setProperty("--my", `${py * 100}%`);
    }

    if (!reduceMotion) {
      const rotateY = (px - 0.5) * TILT_MAX_DEG * 2;
      const rotateX = (0.5 - py) * TILT_MAX_DEG * 2;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

/* ------------------------------ Add to cart --------------------------------
 * No real cart/backend on this site — this is a visual confirmation only,
 * matching the same "brief inline feedback" pattern used on the newsletter
 * form elsewhere in the site.
 * ------------------------------------------------------------------------ */

document.querySelectorAll("[data-add]").forEach((button) => {
  const originalLabel = button.textContent;

  button.addEventListener("click", () => {
    if (button.classList.contains("is-added")) return;
    button.textContent = "Added!";
    button.classList.add("is-added");
    setTimeout(() => {
      button.textContent = originalLabel;
      button.classList.remove("is-added");
    }, 1400);
  });
});

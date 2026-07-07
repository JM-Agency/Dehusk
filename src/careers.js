/* Careers page: footer form, hero parallax, mouse-tilt job photos, scroll-reveal. */

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

/* ------------------------------ Hero parallax -------------------------------
 * The banner photo drifts a few pixels opposite the cursor, matching the
 * same subtle depth cue used on the nutrients stage and the shop tilt cards.
 * ------------------------------------------------------------------------ */

const heroBg = document.querySelector("#careersHeroBg img");

if (heroBg && !reduceMotion) {
  const hero = document.getElementById("careersHero");
  const PARALLAX_PX = 18;

  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    heroBg.style.transform = `translate(${-px * PARALLAX_PX}px, ${-py * PARALLAX_PX}px) scale(1.08)`;
  });

  hero.addEventListener("mouseleave", () => {
    heroBg.style.transform = "";
  });
}

/* ------------------------------ Tilt + spotlight ---------------------------
 * Each [data-tilt] job photo tilts gently toward the cursor and lights up
 * its .career-row__spotlight overlay, same technique as the shop cards.
 * ------------------------------------------------------------------------ */

const TILT_MAX_DEG = 4;

document.querySelectorAll("[data-tilt]").forEach((card) => {
  const spotlight = card.querySelector(".career-row__spotlight");

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
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

/* ------------------------------ Scroll reveal ------------------------------ */

const revealEls = document.querySelectorAll("[data-reveal]");

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealEls.forEach((el) => el.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );
  revealEls.forEach((el) => observer.observe(el));
}

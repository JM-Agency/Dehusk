/* Static content page: scroll-expand hero + footer form + scroll-reveal. */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------ Scroll-expand hero --------------------------
 * The van photo is the backdrop; a small centered video "zooms" to fill the
 * viewport as the user scrolls/wheels, while the split "Our / Why" title
 * slides apart. Scrolling is captured (preventDefault) and mapped to a local
 * 0..1 progress value instead of moving the page, so the effect always plays
 * out fully before the rest of the page is allowed to scroll into view.
 * Scrolling up again at the very top collapses it back.
 * ------------------------------------------------------------------------ */

const expandSection = document.getElementById("whyExpand");

if (expandSection && !reduceMotion) {
  const bg = document.getElementById("whyExpandBg");
  const media = document.getElementById("whyExpandMedia");
  const scrim = document.getElementById("whyExpandScrim");
  const video = document.getElementById("whyExpandVideo");
  const word1 = document.getElementById("whyExpandWord1");
  const word2 = document.getElementById("whyExpandWord2");
  const hint = document.getElementById("whyExpandHint");
  const content = document.getElementById("whyContent");

  const MEDIA_MIN_W = 300;
  const MEDIA_MIN_H = 400;

  let progress = 0;
  let fullyExpanded = false;
  let showContent = false;
  let touchStartY = 0;
  let isMobile = window.innerWidth < 768;

  window.addEventListener("resize", () => {
    isMobile = window.innerWidth < 768;
    render();
  });

  function render() {
    const growW = isMobile ? 650 : 1250;
    const growH = isMobile ? 200 : 400;
    const w = MEDIA_MIN_W + progress * growW;
    const h = MEDIA_MIN_H + progress * growH;
    media.style.width = `${w}px`;
    media.style.height = `${h}px`;

    bg.style.opacity = String(1 - progress);
    scrim.style.opacity = String(0.55 - progress * 0.3);

    const textShift = progress * (isMobile ? 18 : 15);
    word1.style.transform = `translateX(-${textShift}vw)`;
    word2.style.transform = `translateX(${textShift}vw)`;

    hint.style.opacity = String(Math.max(0, 1 - progress * 3));

    content.classList.toggle("is-visible", showContent);
  }

  function setProgress(next) {
    progress = Math.min(1, Math.max(0, next));

    if (progress >= 1) {
      fullyExpanded = true;
      showContent = true;
    } else if (progress < 0.75) {
      showContent = false;
    }
    render();
  }

  function onWheel(e) {
    if (fullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
      fullyExpanded = false;
      e.preventDefault();
      return;
    }
    if (!fullyExpanded) {
      e.preventDefault();
      setProgress(progress + e.deltaY * 0.0009);
    }
  }

  function onTouchStart(e) {
    touchStartY = e.touches[0].clientY;
  }

  function onTouchMove(e) {
    if (!touchStartY) return;
    const touchY = e.touches[0].clientY;
    const deltaY = touchStartY - touchY;

    if (fullyExpanded && deltaY < -20 && window.scrollY <= 5) {
      fullyExpanded = false;
      e.preventDefault();
      return;
    }
    if (!fullyExpanded) {
      e.preventDefault();
      const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
      setProgress(progress + deltaY * scrollFactor);
      touchStartY = touchY;
    }
  }

  function onTouchEnd() {
    touchStartY = 0;
  }

  function onScrollLock() {
    if (!fullyExpanded) window.scrollTo(0, 0);
  }

  window.scrollTo(0, 0);
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scroll", onScrollLock, { passive: true });
  window.addEventListener("touchstart", onTouchStart, { passive: false });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd);

  video.play();
  render();
} else if (expandSection) {
  // Reduced motion: skip the scroll-jack entirely, show everything at rest.
  document.getElementById("whyExpandMedia").style.cssText = "width:min(95vw,90rem);height:min(85vh,50rem);";
  document.getElementById("whyExpandBg").style.opacity = "0";
  document.getElementById("whyExpandHint").style.opacity = "0";
  document.getElementById("whyContent").classList.add("is-visible");
  document.getElementById("whyExpandVideo").play();
}

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

/* ------------------------------ Scroll reveal ------------------------------
 * Each [data-reveal] element (image or copy block) fades/slides in once,
 * the first time it crosses ~15% into the viewport. Copy blocks carry a
 * [data-reveal-delay] so they visibly follow the image next to them rather
 * than arriving at the same instant.
 * ------------------------------------------------------------------------ */

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

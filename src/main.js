import * as THREE from "three";
import Swiper from "swiper";
import { Autoplay, EffectCoverflow, Pagination } from "swiper/modules";
import { initMobileNav } from "./nav.js";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

/* --------------------------------------------------------------------------
 * Scroll-scrubbed frame sequence hero, rendered through Three.js.
 * Frames are extracted from Visual/DehuskHeader.mp4 via scripts/extract-frames.mjs
 * (182 frames, 15fps, /public/frames/frame_0001.webp ... frame_0182.webp).
 * Scroll position inside #heroScrub maps directly to a frame index: scrolling
 * down plays forward, scrolling up plays backward, because the frame is
 * always a pure function of scroll progress (no queued/one-way animation).
 * ------------------------------------------------------------------------ */

const FRAME_COUNT = 182;
const FRAME_PATH = (i) => `/frames/frame_${String(i).padStart(4, "0")}.webp`;

const loaderEl = document.getElementById("loader");
const loaderFillEl = document.getElementById("loaderFill");
const heroWrapper = document.getElementById("heroScrub");
const stageEl = heroWrapper.querySelector(".hero-scrub__stage");
const canvas = document.getElementById("scrubCanvas");

/* ---------------------------- Frame preloading --------------------------- */

function preloadFrames(onProgress) {
  const images = new Array(FRAME_COUNT);
  let loaded = 0;

  return new Promise((resolve) => {
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.onload = img.onerror = () => {
        loaded++;
        onProgress(loaded / FRAME_COUNT);
        if (loaded === FRAME_COUNT) resolve(images);
      };
      img.src = FRAME_PATH(i);
      images[i - 1] = img;
    }
  });
}

/* ------------------------------ Three.js setup ---------------------------- */

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// Offscreen 2D canvas used to "cover"-crop each frame before uploading it
// as a WebGL texture, so the video always fills the stage like a CSS
// background-size: cover, regardless of viewport aspect ratio.
const frameCanvas = document.createElement("canvas");
const frameCtx = frameCanvas.getContext("2d");
const texture = new THREE.CanvasTexture(frameCanvas);
texture.colorSpace = THREE.SRGBColorSpace;
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;

const material = new THREE.MeshBasicMaterial({ map: texture });
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
scene.add(quad);

function resizeStage() {
  const w = stageEl.clientWidth;
  const h = stageEl.clientHeight;
  renderer.setSize(w, h, false);
  const dpr = renderer.getPixelRatio();
  frameCanvas.width = Math.round(w * dpr);
  frameCanvas.height = Math.round(h * dpr);
}

function drawFrame(img) {
  if (!img || !img.naturalWidth) return;
  const cw = frameCanvas.width;
  const ch = frameCanvas.height;
  const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;
  frameCtx.clearRect(0, 0, cw, ch);
  frameCtx.drawImage(img, dx, dy, dw, dh);
  texture.needsUpdate = true;
  renderer.render(scene, camera);
}

/* ------------------------------ Scroll scrubbing -------------------------- */

let images = [];
let currentFrame = 0;
let targetFrame = 0;

function scrollProgress() {
  const rect = heroWrapper.getBoundingClientRect();
  const total = heroWrapper.offsetHeight - window.innerHeight;
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, -rect.top / total));
}

const scrollcueEl = document.getElementById("heroScrollcue");

function onScroll() {
  const progress = scrollProgress();
  targetFrame = progress * (FRAME_COUNT - 1);
  updateChapter(progress);
  scrollcueEl.style.opacity = progress > 0.04 ? "0" : "";
}

function tick() {
  currentFrame += (targetFrame - currentFrame) * 0.18;
  if (Math.abs(targetFrame - currentFrame) < 0.02) currentFrame = targetFrame;
  const idx = Math.round(currentFrame);
  drawFrame(images[idx]);
  requestAnimationFrame(tick);
}

/* ------------------------------ Story chapters ----------------------------
 * The hero copy is a function of scroll progress too, timed to what the
 * frame sequence is actually showing: an intact carton, the husk cracking
 * open, the shell breaking apart, then the pour into a fresh coconut.
 * ------------------------------------------------------------------------ */

const chapters = [
  {
    from: 0,
    to: 0.40,
    align: "left",
    headline: "Bold Like Dairy,<br>but Foamier.",
    subtext: "Fortified coconut milk, made for coffee — creamy, foamable, dairy-free.",
    cta: "Shop Now",
  },
  {
    from: 0.40,
    to: 0.56,
    align: "left",
    headline: "Straight from<br>the husk.",
    subtext: "We crack open the shell so the milk inside doesn't have to work for it.",
  },
  {
    from: 0.56,
    to: 0.74,
    align: "right",
    headline: "No shell.<br>No shortcuts.",
    subtext: "Just fortified coconut milk, unlocked.",
  },
  {
    from: 0.74,
    to: 0.90,
    align: "left",
    headline: "Poured into<br>something real.",
    subtext: "From the tree of life to your morning cup.",
  },
  {
    from: 0.90,
    to: 1.01,
    align: "right",
    headline: "This is<br>Dehusk.",
    subtext: "Bold Like Dairy, but Foamier.",
    cta: "Shop Now",
  },
];

const heroContentEl = document.getElementById("heroContent");
const heroPanelEl = document.getElementById("heroPanel");

// Matches the .hero-scrub__panel CSS transition duration (see style.css).
const CHAPTER_FADE_MS = 220;

let activeChapterIndex = 0;
let pendingChapterIndex = null;
let chapterTransitioning = false;

function chapterPanelHTML(chapter) {
  const cta = chapter.cta
    ? `<a class="btn btn--primary" href="shop.html">${chapter.cta}</a>`
    : "";
  return `
    <h1 class="hero-scrub__headline">${chapter.headline}</h1>
    <p class="hero-scrub__subtext">${chapter.subtext}</p>
    ${cta}
  `;
}

// A transition, once started, always runs to completion (fade out -> swap ->
// fade in) instead of being cancelled and restarted. Fast scrolling just
// queues the latest target chapter, which is picked up the instant the
// in-flight transition finishes — so the panel is never left invisible
// indefinitely, only briefly between chapters.
function runChapterTransition(idx) {
  chapterTransitioning = true;
  heroPanelEl.classList.remove("is-visible");

  setTimeout(() => {
    const chapter = chapters[idx];
    activeChapterIndex = idx;
    heroContentEl.dataset.align = chapter.align;
    heroPanelEl.innerHTML = chapterPanelHTML(chapter);

    requestAnimationFrame(() => heroPanelEl.classList.add("is-visible"));

    setTimeout(() => {
      chapterTransitioning = false;
      if (pendingChapterIndex !== null && pendingChapterIndex !== activeChapterIndex) {
        const next = pendingChapterIndex;
        pendingChapterIndex = null;
        runChapterTransition(next);
      } else {
        pendingChapterIndex = null;
      }
    }, CHAPTER_FADE_MS);
  }, CHAPTER_FADE_MS);
}

function updateChapter(progress) {
  const idx = chapters.findIndex((c) => progress >= c.from && progress < c.to);
  const safeIdx = idx === -1 ? chapters.length - 1 : idx;
  if (safeIdx === activeChapterIndex) {
    pendingChapterIndex = null;
    return;
  }
  if (chapterTransitioning) {
    pendingChapterIndex = safeIdx;
    return;
  }
  runChapterTransition(safeIdx);
}

/* ------------------------------ Nutrients stage -----------------------------
 * Hovering a corner callout (Calcium, Riboflavin...) lights up its matching
 * glow on the botanical background via a shared data-hotspot key. The whole
 * stage also drifts a few pixels opposite the cursor for a subtle parallax
 * depth, matching the tilt/spotlight language used on the shop page.
 * ------------------------------------------------------------------------ */

const nutrientsStage = document.getElementById("nutrientsStage");

if (nutrientsStage) {
  const nutrientsReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nutrientsBg = nutrientsStage.querySelector(".nutrients__bg");
  const hotspots = nutrientsStage.querySelectorAll(".nutrients__hotspot");
  const callouts = nutrientsStage.querySelectorAll(".nutrient-callout");

  // Each trail's dash pattern is sized to its own measured length, so the
  // stroke-dashoffset transition draws it end-to-end like a growing thread
  // instead of snapping in (a fixed dasharray rarely matches a curve's
  // actual length, which made the reveal look instantaneous).
  const trailLengths = new WeakMap();
  nutrientsStage.querySelectorAll(".nutrients__trail").forEach((trail) => {
    const length = trail.getTotalLength();
    trailLengths.set(trail, length);
    trail.style.strokeDasharray = `${length}`;
    trail.style.strokeDashoffset = `${length}`;
  });

  callouts.forEach((callout) => {
    const key = callout.dataset.hotspotTarget;
    const hotspot = nutrientsStage.querySelector(`.nutrients__hotspot[data-hotspot="${key}"]`);
    const trail = nutrientsStage.querySelector(`.nutrients__trail[data-trail="${key}"]`);
    const droplet = nutrientsStage.querySelector(`.nutrients__droplet[data-trail="${key}"]`);

    const activate = () => {
      callout.classList.add("is-active");
      hotspot?.classList.add("is-active");
      if (trail) trail.style.strokeDashoffset = "0";
      trail?.classList.add("is-active");
      droplet?.classList.add("is-active");
    };
    const deactivate = () => {
      callout.classList.remove("is-active");
      hotspot?.classList.remove("is-active");
      if (trail) trail.style.strokeDashoffset = `${trailLengths.get(trail)}`;
      trail?.classList.remove("is-active");
      droplet?.classList.remove("is-active");
    };

    callout.addEventListener("mouseenter", activate);
    callout.addEventListener("mouseleave", deactivate);
    callout.addEventListener("focus", activate);
    callout.addEventListener("blur", deactivate);
  });

  if (!nutrientsReduceMotion) {
    const PARALLAX_PX = 14;

    nutrientsStage.addEventListener("mousemove", (e) => {
      const rect = nutrientsStage.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      nutrientsBg.style.transform = `translate(${-px * PARALLAX_PX}px, ${-py * PARALLAX_PX}px) scale(1.06)`;
      hotspots.forEach((hotspot) => {
        hotspot.style.transform = `translate(-50%, -50%) translate(${-px * PARALLAX_PX * 0.6}px, ${-py * PARALLAX_PX * 0.6}px)`;
      });
    });

    nutrientsStage.addEventListener("mouseleave", () => {
      nutrientsBg.style.transform = "";
      hotspots.forEach((hotspot) => { hotspot.style.transform = ""; });
    });
  }
}

/* ---------------------------------- Nav ----------------------------------- */

const navEl = document.getElementById("siteNav");
function onNavScroll() {
  navEl.classList.toggle("is-scrolled", window.scrollY > 40);
}
initMobileNav();

/* --------------------------------- Boot ----------------------------------- */

async function boot() {
  window.addEventListener("resize", resizeStage);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("scroll", onNavScroll, { passive: true });
  resizeStage();
  onNavScroll();

  images = await preloadFrames((p) => {
    loaderFillEl.style.width = `${Math.round(p * 100)}%`;
  });

  onScroll();
  currentFrame = targetFrame;
  drawFrame(images[0]);
  requestAnimationFrame(tick);

  loaderEl.classList.add("is-hidden");
}

boot();

/* ------------------------------ Story video ---------------------------------
 * Boomerang playback instead of a hard loop-cut: the carton rotates forward,
 * then unwinds back to frame zero, so it never visibly "jumps". Browsers
 * don't support real reverse video decoding (negative playbackRate is a
 * no-op almost everywhere), so the reverse leg is a manual rAF scrub of
 * currentTime.
 * ------------------------------------------------------------------------ */

const storyVideo = document.getElementById("storyVideo");
if (storyVideo) {
  let lastTick = 0;

  function reverseStep(now) {
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    const next = storyVideo.currentTime - dt;
    if (next <= 0) {
      storyVideo.currentTime = 0;
      storyVideo.play();
    } else {
      storyVideo.currentTime = next;
      requestAnimationFrame(reverseStep);
    }
  }

  storyVideo.addEventListener("ended", () => {
    lastTick = performance.now();
    requestAnimationFrame(reverseStep);
  });

  storyVideo.play();
}

/* ------------------------------ Flavor carousel ----------------------------
 * Swiper's loop mode silently disables itself when there aren't enough real
 * slides to fill the visible coverflow width ("not enough slides for loop
 * mode" console warning) — with only 4 slides it plays forward once and
 * then just stops on the last one. Swiper's own fix is to duplicate the
 * slides in the DOM, so the 4 flavor images are tripled here before init;
 * the carousel still only ever shows those same 4 photos.
 * ------------------------------------------------------------------------ */

const flavorWrapper = document.querySelector(".flavor-swiper .swiper-wrapper");
const flavorSlides = [...flavorWrapper.children];
flavorSlides.forEach((slide) => flavorWrapper.appendChild(slide.cloneNode(true)));
flavorSlides.forEach((slide) => flavorWrapper.appendChild(slide.cloneNode(true)));

new Swiper(".flavor-swiper", {
  modules: [EffectCoverflow, Autoplay, Pagination],
  effect: "coverflow",
  grabCursor: true,
  centeredSlides: true,
  loop: true,
  slidesPerView: "auto",
  spaceBetween: 32,
  coverflowEffect: {
    rotate: 0,
    stretch: 0,
    depth: 140,
    modifier: 2,
    slideShadows: false,
  },
  autoplay: {
    delay: 2200,
    disableOnInteraction: false,
    pauseOnMouseEnter: false,
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
    dynamicBullets: true,
  },
});

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

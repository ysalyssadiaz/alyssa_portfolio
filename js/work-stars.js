(function () {
  const decor = document.querySelector(".work-decor, .about-decor");
  if (!decor) return;

  const STAR_COUNT = 38;
  const STAR_SRC = "assets/tiny-star.svg";
  const SEPARATION_PADDING = 1.15;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  decor.classList.add("work-decor--pending");

  function getSiteScale() {
    return Math.max(0.75, Math.min(1.333, window.innerWidth / 1920));
  }

  const stars = [];
  let lastTime = 0;
  let decorWidth = 0;
  let decorHeight = 0;

  function remToPx(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
  }

  function createStar() {
    const el = document.createElement("img");
    el.src = STAR_SRC;
    el.alt = "";
    el.className = "work-star";
    el.decoding = "async";

    const star = {
      el,
      sizeRem: 2.75 + Math.random() * 2.75,
      radius: 0,
      anchorX: 0,
      anchorY: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      baseRot: -25 + Math.random() * 50,
      rot: 0,
      opacity: 0.48 + Math.random() * 0.32,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      phaseR: Math.random() * Math.PI * 2,
      speedX: 0.35 + Math.random() * 0.45,
      speedY: 0.3 + Math.random() * 0.5,
      speedR: 0.4 + Math.random() * 0.55,
      ampX: 22 + Math.random() * 22,
      ampY: 24 + Math.random() * 24,
      rotAmp: 50 + Math.random() * 80,
      spin: Math.random() > 0.5 ? 1 : -1,
      targetX: 0,
      targetY: 0,
    };

    el.style.opacity = String(star.opacity);
    stars.push(star);
    return star;
  }

  function updateStarSize(star, scale) {
    star.radius = (star.sizeRem * scale * remToPx(1)) / 2;
    star.el.style.width = `${star.sizeRem * scale}rem`;
  }

  function updateStarMotion(star, t, scale) {
    star.targetX =
      star.anchorX + Math.sin(t * star.speedX + star.phaseX) * star.ampX * scale;
    star.targetY =
      star.anchorY + Math.sin(t * star.speedY + star.phaseY) * star.ampY * scale;
    star.rot =
      star.baseRot +
      Math.sin(t * star.speedR + star.phaseR) * star.rotAmp * star.spin;
  }

  function snapStarsToMotion(t) {
    const scale = getSiteScale();
    stars.forEach((star) => {
      updateStarSize(star, scale);
      updateStarMotion(star, t, scale);
      star.x = star.targetX;
      star.y = star.targetY;
      star.vx = 0;
      star.vy = 0;
      renderStar(star);
    });
  }

  function placeStarsWithoutOverlap() {
    const scale = getSiteScale();
    const placed = [];

    stars.forEach((star) => {
      updateStarSize(star, scale);

      let positioned = false;

      for (let attempt = 0; attempt < 120; attempt++) {
        const x = star.radius + Math.random() * (decorWidth - star.radius * 2);
        const y = star.radius + Math.random() * (decorHeight - star.radius * 2);

        const overlaps = placed.some((other) => {
          const dx = x - other.anchorX;
          const dy = y - other.anchorY;
          const minDist = (star.radius + other.radius) * SEPARATION_PADDING;
          return dx * dx + dy * dy < minDist * minDist;
        });

        if (!overlaps) {
          star.anchorX = x;
          star.anchorY = y;
          placed.push(star);
          positioned = true;
          break;
        }
      }

      if (!positioned) {
        star.anchorX = star.radius + Math.random() * (decorWidth - star.radius * 2);
        star.anchorY = star.radius + Math.random() * (decorHeight - star.radius * 2);
        placed.push(star);
      }
    });
  }

  function measureDecor() {
    decorWidth = decor.clientWidth;
    decorHeight = decor.clientHeight;
  }

  function applyLayout() {
    measureDecor();
    placeStarsWithoutOverlap();
    snapStarsToMotion(lastTime > 0 ? lastTime * 0.001 : 0);
  }

  function renderStar(star) {
    star.el.style.left = `${star.x - star.radius}px`;
    star.el.style.top = `${star.y - star.radius}px`;
    star.el.style.right = "auto";
    star.el.style.transform = `rotate(${star.rot}deg)`;
  }

  function mountStars() {
    const fragment = document.createDocumentFragment();
    stars.forEach((star) => fragment.appendChild(star.el));
    decor.appendChild(fragment);
  }

  function revealStars() {
    decor.classList.remove("work-decor--pending");
  }

  function applySeparation(dt) {
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const a = stars[i];
        const b = stars[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const minDist = (a.radius + b.radius) * SEPARATION_PADDING;

        if (dist < minDist) {
          const overlap = (minDist - dist) / dist;
          const pushX = dx * overlap * 0.5;
          const pushY = dy * overlap * 0.5;

          a.vx -= pushX * 8 * dt;
          a.vy -= pushY * 8 * dt;
          b.vx += pushX * 8 * dt;
          b.vy += pushY * 8 * dt;
        }
      }
    }
  }

  function clampToBounds(star) {
    const minX = star.radius;
    const maxX = decorWidth - star.radius;
    const minY = star.radius;
    const maxY = decorHeight - star.radius;

    if (star.x < minX) {
      star.x = minX;
      star.vx *= -0.3;
    } else if (star.x > maxX) {
      star.x = maxX;
      star.vx *= -0.3;
    }

    if (star.y < minY) {
      star.y = minY;
      star.vy *= -0.3;
    } else if (star.y > maxY) {
      star.y = maxY;
      star.vy *= -0.3;
    }
  }

  function tick(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.032) || 0.016;
    lastTime = time;
    const t = time * 0.001;
    const scale = getSiteScale();
    const spring = 2.8;
    const damping = 0.88;

    stars.forEach((star) => {
      updateStarSize(star, scale);
      updateStarMotion(star, t, scale);

      star.vx += (star.targetX - star.x) * spring * dt;
      star.vy += (star.targetY - star.y) * spring * dt;
    });

    applySeparation(dt);

    stars.forEach((star) => {
      star.vx *= damping;
      star.vy *= damping;
      star.x += star.vx;
      star.y += star.vy;
      clampToBounds(star);
      renderStar(star);
    });

    requestAnimationFrame(tick);
  }

  function startAnimation() {
    lastTime = performance.now();
    requestAnimationFrame(tick);
  }

  function bootstrap(attempt = 0) {
    measureDecor();

    if ((decorWidth < 1 || decorHeight < 1) && attempt < 24) {
      requestAnimationFrame(() => bootstrap(attempt + 1));
      return;
    }

    placeStarsWithoutOverlap();
    snapStarsToMotion(0);
    mountStars();

    requestAnimationFrame(() => {
      revealStars();
      if (!prefersReducedMotion) {
        startAnimation();
      }
    });
  }

  for (let i = 0; i < STAR_COUNT; i++) createStar(i);

  requestAnimationFrame(() => {
    requestAnimationFrame(bootstrap);
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const oldW = decorWidth;
      const oldH = decorHeight;
      const t = lastTime > 0 ? lastTime * 0.001 : 0;

      measureDecor();

      if (oldW > 0 && oldH > 0 && decorWidth > 0 && decorHeight > 0) {
        stars.forEach((star) => {
          star.anchorX = (star.anchorX / oldW) * decorWidth;
          star.anchorY = (star.anchorY / oldH) * decorHeight;
        });
        snapStarsToMotion(t);
      } else {
        applyLayout();
      }
    }, 150);
  });
})();

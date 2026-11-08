const wrap = document.querySelector(".logo-wrap");
const eyes = document.querySelector(".eyes");
const starfield = document.querySelector(".starfield");
const hero = document.querySelector(".hero");

function heroSize() {
  const rect = hero.getBoundingClientRect();
  return { viewW: rect.width, viewH: rect.height };
}

const NATIVE_LOGO_WIDTH = 2912;
const MAX_SHIFT_AT_NATIVE = 30;
const STAR_ASPECT = 101.85 / 107.5;

let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const stars = [];
let lastStarTime = 0;

function eyeCenter() {
  const rect = wrap.getBoundingClientRect();
  return {
    x: rect.left + rect.width * (0.110546 + 0.18101 / 2),
    y: rect.top + rect.height * (0.3638 + (0.18101 * rect.width * (211 / 515)) / rect.height / 2),
    maxShift: (rect.width / NATIVE_LOGO_WIDTH) * MAX_SHIFT_AT_NATIVE,
  };
}

function starCount() {
  const { viewW, viewH } = heroSize();
  const area = viewW * viewH;
  return Math.round(Math.min(16, Math.max(5, area / 110000)));
}

function renderStar(star, rotation) {
  star.el.style.transform = `translate3d(${star.x - star.w / 2}px, ${star.y - star.h / 2}px, 0) rotate(${rotation}deg)`;
}

function createStars() {
  starfield.replaceChildren();
  stars.length = 0;

  const { viewW, viewH } = heroSize();
  const count = starCount();
  const cols = Math.ceil(Math.sqrt(count * (viewW / viewH)));
  const rows = Math.ceil(count / cols);

  for (let i = 0; i < count; i += 1) {
    const size = 48 + Math.random() * 52;
    const w = size;
    const h = size * STAR_ASPECT;
    const r = Math.min(w, h) * 0.42;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellW = viewW / cols;
    const cellH = viewH / rows;
    const x = cellW * (col + 0.22 + Math.random() * 0.56);
    const y = cellH * (row + 0.22 + Math.random() * 0.56);

    const el = document.createElement("img");
    el.className = "star";
    el.src = "Assets/tiny-star.svg";
    el.alt = "";
    el.draggable = false;
    el.style.setProperty("--size", `${size}px`);
    starfield.appendChild(el);

    const star = {
      el,
      x,
      y,
      w,
      h,
      r,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      phase: Math.random() * Math.PI * 2,
      freq: 0.0007 + Math.random() * 0.0006,
      rock: 0.00045 + Math.random() * 0.0004,
      rockAmp: 5 + Math.random() * 7,
    };
    stars.push(star);
    renderStar(star, 0);
  }
}

function pullFromEdges(star, viewW, viewH, dt) {
  const gap = Math.min(
    star.x - star.w / 2,
    viewW - (star.x + star.w / 2),
    star.y - star.h / 2,
    viewH - (star.y + star.h / 2)
  );
  const zone = 42;
  if (gap > zone) return;

  const left = star.x - star.w / 2;
  const right = viewW - (star.x + star.w / 2);
  const top = star.y - star.h / 2;
  const bottom = viewH - (star.y + star.h / 2);
  const closeness = 1 - Math.min(Math.max(gap, 0) / zone, 1);
  const strength = (16 + closeness * 40) * dt;

  if (left <= zone && left <= right) star.vx += strength;
  if (right <= zone && right < left) star.vx -= strength;
  if (top <= zone && top <= bottom) star.vy += strength;
  if (bottom <= zone && bottom < top) star.vy -= strength;
}

function keepOnScreen(star, viewW, viewH) {
  const pad = 16;
  const marginX = star.w / 2 + pad;
  const marginY = star.h / 2 + pad;
  if (star.x < marginX) {
    star.x = marginX;
    star.vx = Math.abs(star.vx) * 0.2 + 16;
  } else if (star.x > viewW - marginX) {
    star.x = viewW - marginX;
    star.vx = -Math.abs(star.vx) * 0.2 - 16;
  }
  if (star.y < marginY) {
    star.y = marginY;
    star.vy = Math.abs(star.vy) * 0.2 + 16;
  } else if (star.y > viewH - marginY) {
    star.y = viewH - marginY;
    star.vy = -Math.abs(star.vy) * 0.2 - 16;
  }
}

function bumpStars() {
  for (let i = 0; i < stars.length; i += 1) {
    for (let j = i + 1; j < stars.length; j += 1) {
      const a = stars[i];
      const b = stars[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.r + b.r;
      if (dist >= minDist || dist < 0.001) continue;

      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;
      const separate = overlap * 0.4;
      a.x -= nx * separate;
      a.y -= ny * separate;
      b.x += nx * separate;
      b.y += ny * separate;

      const closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (closing > 0) {
        const bounce = closing * 0.5;
        a.vx -= nx * bounce;
        a.vy -= ny * bounce;
        b.vx += nx * bounce;
        b.vy += ny * bounce;
      }
    }
  }
}

function keepScattered(dt, viewW, viewH) {
  const comfort = Math.min(220, Math.max(120, Math.hypot(viewW, viewH) / 9));

  for (let i = 0; i < stars.length; i += 1) {
    for (let j = i + 1; j < stars.length; j += 1) {
      const a = stars[i];
      const b = stars[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= comfort || dist < 0.001) continue;

      const push = (1 - dist / comfort) * 22 * dt;
      const nx = dx / dist;
      const ny = dy / dist;
      a.vx -= nx * push;
      a.vy -= ny * push;
      b.vx += nx * push;
      b.vy += ny * push;
    }
  }
}

function updateStars(time) {
  const dt = lastStarTime ? Math.min(0.05, (time - lastStarTime) / 1000) : 0.016;
  lastStarTime = time;

  const { viewW, viewH } = heroSize();

  for (const star of stars) {
    star.vx += Math.cos(time * star.freq + star.phase) * 7 * dt;
    star.vy += Math.sin(time * star.freq * 0.67 + star.phase * 1.3) * 7 * dt;

    pullFromEdges(star, viewW, viewH, dt);

    const damp = Math.exp(-0.5 * dt);
    star.vx *= damp;
    star.vy *= damp;

    const speed = Math.hypot(star.vx, star.vy);
    const maxSpeed = 34;
    if (speed > maxSpeed) {
      star.vx = (star.vx / speed) * maxSpeed;
      star.vy = (star.vy / speed) * maxSpeed;
    }

    star.x += star.vx * dt;
    star.y += star.vy * dt;
  }

  keepScattered(dt, viewW, viewH);
  bumpStars();

  for (const star of stars) {
    keepOnScreen(star, viewW, viewH);
    const rotation = Math.sin(time * star.rock + star.phase) * star.rockAmp;
    renderStar(star, rotation);
  }
}

window.addEventListener("pointermove", (event) => {
  if (reducedMotion) return;

  const { x, y, maxShift } = eyeCenter();
  const dx = event.clientX - x;
  const dy = event.clientY - y;
  const distance = Math.hypot(dx, dy) || 1;
  const magnitude = Math.min(maxShift, distance * 0.12);

  targetX = (dx / distance) * magnitude;
  targetY = (dy / distance) * magnitude;
});

window.addEventListener("pointerleave", () => {
  targetX = 0;
  targetY = 0;
});

window.addEventListener("resize", () => {
  const { viewW, viewH } = heroSize();
  for (const star of stars) keepOnScreen(star, viewW, viewH);
});

const workScroll = document.querySelector(".work-scroll");
const workThumb = document.querySelector(".work-bar-thumb");

function updateWorkBar() {
  if (!workScroll || !workThumb) return;
  const max = workScroll.scrollHeight - workScroll.clientHeight;
  if (max <= 1) {
    workThumb.style.opacity = "0";
    return;
  }
  const track = workThumb.parentElement.clientHeight;
  const thumbH = Math.max(36, track * (workScroll.clientHeight / workScroll.scrollHeight));
  const top = (workScroll.scrollTop / max) * (track - thumbH);
  workThumb.style.opacity = "1";
  workThumb.style.height = `${thumbH}px`;
  workThumb.style.transform = `translateY(${top}px)`;
}

workScroll.addEventListener("scroll", updateWorkBar, { passive: true });
window.addEventListener("resize", updateWorkBar);
window.addEventListener("load", updateWorkBar);
updateWorkBar();

createStars();

function tick(time) {
  const ease = reducedMotion ? 1 : 0.16;
  currentX += (targetX - currentX) * ease;
  currentY += (targetY - currentY) * ease;

  if (Math.abs(currentX) < 0.05 && Math.abs(targetX) < 0.05) currentX = 0;
  if (Math.abs(currentY) < 0.05 && Math.abs(targetY) < 0.05) currentY = 0;

  eyes.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
  if (!reducedMotion) updateStars(time);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

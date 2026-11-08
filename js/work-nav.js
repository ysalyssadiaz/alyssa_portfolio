const nav = document.querySelector(".work-nav");
const prevLink = document.querySelector(".work-nav-prev");
const nextLink = document.querySelector(".work-nav-next");

function fileName(href) {
  const clean = href.split("#")[0].split("?")[0];
  const name = clean.split("/").filter(Boolean).pop() || "";
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

function projectTitle(card) {
  const heading = card.querySelector("h3");
  if (!heading) return fileName(card.getAttribute("href") || "");
  const text = [...heading.childNodes]
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return text || fileName(card.getAttribute("href") || "");
}

async function loadAdjacentWorks() {
  if (!nav || !prevLink || !nextLink) return;

  const response = await fetch("../index.html", { cache: "no-store" });
  if (!response.ok) return;

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const projects = [...doc.querySelectorAll("a.work-card")]
    .map((card) => {
      const href = card.getAttribute("href");
      if (!href) return null;
      return { file: fileName(href), title: projectTitle(card) };
    })
    .filter(Boolean);

  if (projects.length < 2) return;

  const index = projects.findIndex((project) => project.file === fileName(window.location.pathname));
  if (index < 0) return;

  const previous = projects[(index - 1 + projects.length) % projects.length];
  const following = projects[(index + 1) % projects.length];

  prevLink.href = previous.file;
  prevLink.textContent = previous.title;
  prevLink.setAttribute("aria-label", `Previous project: ${previous.title}`);

  nextLink.href = following.file;
  nextLink.textContent = following.title;
  nextLink.setAttribute("aria-label", `Next project: ${following.title}`);

  nav.hidden = false;
}

loadAdjacentWorks();

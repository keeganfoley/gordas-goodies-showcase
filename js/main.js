// Progressive enhancement: navigation and ordering links work without JavaScript.
const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");
function closeMenu(returnFocus = false) {
  links?.classList.remove("is-open");
  toggle?.setAttribute("aria-expanded", "false");
  toggle?.setAttribute("aria-label", "Open menu");
  if (returnFocus) toggle?.focus();
}
if (toggle && links) {
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  links.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && links.classList.contains("is-open"))
      closeMenu(true);
  });
  matchMedia("(min-width: 801px)").addEventListener("change", () =>
    closeMenu(),
  );
}
const galleryLinks = [...document.querySelectorAll(".gallery-grid a")];
const lightbox = document.querySelector(".lightbox");
if (galleryLinks.length && lightbox) {
  let current = 0;
  let opener;
  const img = lightbox.querySelector("img");
  const caption = document.createElement("p");
  caption.className = "lightbox-caption";
  caption.setAttribute("aria-live", "polite");
  lightbox.append(caption);
  function show(index) {
    current = (index + galleryLinks.length) % galleryLinks.length;
    img.src = galleryLinks[current].href;
    img.alt = galleryLinks[current].querySelector("img").alt;
    caption.textContent = `${current + 1} / ${galleryLinks.length} — ${img.alt}`;
  }
  galleryLinks.forEach((link, index) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      opener = link;
      show(index);
      lightbox.showModal();
      document.body.style.overflow = "hidden";
      lightbox.querySelector(".lightbox-close").focus();
    }),
  );
  lightbox
    .querySelector(".lightbox-close")
    .addEventListener("click", () => lightbox.close());
  lightbox
    .querySelector(".lightbox-prev")
    .addEventListener("click", () => show(current - 1));
  lightbox
    .querySelector(".lightbox-next")
    .addEventListener("click", () => show(current + 1));
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener("close", () => {
    document.body.style.overflow = "";
    opener?.focus();
  });
  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      show(current + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
}
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

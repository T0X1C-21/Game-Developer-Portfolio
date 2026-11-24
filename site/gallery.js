const projects = Array.from(document.querySelectorAll('.game'), element => {
  const gallery = element.querySelector('.gameplay-strip');
  return { element, gallery, clips: Array.from(gallery.querySelectorAll('video')) };
});
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let pendingFrame = 0;

function focusScale(distance, range, minimum, maximum) {
  const t = Math.min(1, Math.abs(distance) / Math.max(1, range));
  return (maximum - (maximum - minimum) * t * t * (3 - 2 * t)).toFixed(4);
}

function updateFocus() {
  pendingFrame = 0;
  if (reducedMotion.matches) return;

  const viewportHeight = document.documentElement.clientHeight;
  const scrollLimit = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
  const sizes = [];
  for (const { element, gallery, clips } of projects) {
    const box = element.getBoundingClientRect();
    // Scaling about the centre leaves the centre itself stable.
    const idealScroll = window.scrollY + box.top + box.height / 2 - viewportHeight / 2;
    const focusedAt = Math.max(0, Math.min(scrollLimit, idealScroll));
    sizes.push([element, focusScale(window.scrollY - focusedAt, viewportHeight * 0.7, 0.90, 1.08)]);

    const travel = gallery.scrollWidth - gallery.clientWidth;
    const first = clips[0];
    const last = clips[clips.length - 1];
    // Give the first and last clip full focus at the ends of the scrollbar.
    const firstCenter = first.offsetLeft + first.offsetWidth / 2;
    const lastCenter = last.offsetLeft + last.offsetWidth / 2;
    const progress = travel > 0 ? Math.max(0, Math.min(1, gallery.scrollLeft / travel)) : 0;
    const focusX = firstCenter + progress * (lastCenter - firstCenter);
    for (const clip of clips) {
      const center = clip.offsetLeft + clip.offsetWidth / 2;
      sizes.push([clip, travel > 0 ? focusScale(center - focusX, clip.offsetWidth * 1.1, 0.75, 1) : '1']);
    }
  }
  for (const [element, scale] of sizes) element.style.setProperty('--focus-scale', scale);
}

function scheduleFocus() {
  if (!pendingFrame && !reducedMotion.matches) pendingFrame = requestAnimationFrame(updateFocus);
}

for (const { gallery } of projects) {
  gallery.addEventListener('scroll', scheduleFocus, { passive: true });
  gallery.addEventListener('wheel', event => {
    if (event.ctrlKey || gallery.scrollWidth <= gallery.clientWidth) return;

    // Keep the wheel gesture inside the gallery even after it reaches either end.
    event.preventDefault();
    let distance = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) distance *= 16;
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) distance *= gallery.clientWidth;
    gallery.scrollLeft += distance;
  }, { passive: false });
}
window.addEventListener('scroll', scheduleFocus, { passive: true });
window.addEventListener('resize', scheduleFocus);
window.addEventListener('pageshow', scheduleFocus);
reducedMotion.addEventListener('change', scheduleFocus);
scheduleFocus();

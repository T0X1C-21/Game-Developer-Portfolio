const soundToggle = document.querySelector('.sound-toggle');
const soundFolder = new URL('../assets/interface/', document.currentScript.src);
// Keep one media element so the first permitted playback unlocks every cue.
const player = new Audio();
const mast = document.querySelector('.mast');
const projectsSection = document.getElementById('projects');
function syncNavHeight() {
  document.body.style.setProperty('--nav-height', mast.offsetHeight + 'px');
}
syncNavHeight();
new ResizeObserver(syncNavHeight).observe(mast);

function visibleSection() {
  return projectsSection.getBoundingClientRect().top <= mast.offsetHeight + 2 ? 'projects' : 'about';
}
let previousSection = visibleSection();
let soundEnabled = true;
let playbackReady = false;
let playbackAttempt = 0;

function updateSoundButton() {
  const action = soundEnabled ? 'Mute' : 'Unmute';
  soundToggle.textContent = action;
  soundToggle.setAttribute('aria-label', action + ' sound effects');
}

function play(name) {
  const attempt = ++playbackAttempt;
  const src = new URL(name + '.wav', soundFolder).href;
  if (player.src !== src) player.src = src;
  else player.currentTime = 0;
  player.play().then(() => {
    if (attempt !== playbackAttempt) return;
    playbackReady = true;
  }).catch(error => {
    if (attempt !== playbackAttempt || error.name === 'AbortError') return;
    playbackReady = false;
  });
}

function playCue(name) {
  if (soundEnabled && playbackReady) play(name);
}

function primeSound() {
  if (soundEnabled && !playbackReady) play('ready');
}

updateSoundButton();
soundToggle.hidden = false;
primeSound();

soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  updateSoundButton();
  if (soundEnabled) {
    play('launch');
  } else {
    playbackAttempt++;
    player.pause();
  }
});

document.addEventListener('pointerup', event => {
  if (event.isPrimary && !event.target.closest('a[href], button')) primeSound();
});
document.addEventListener('keydown', event => {
  if (!event.repeat && event.target !== soundToggle) primeSound();
});
document.addEventListener('click', event => {
  const control = event.target.closest('a[href], button');
  if (!control) {
    primeSound();
    return;
  }
  if (control === soundToggle || event.defaultPrevented) return;
  // Start inside the click itself, even when the initial autoplay probe was blocked.
  if (soundEnabled) play('launch');

  // A section-link press already has a chime. Reserve the directional cue for scrolling.
  if (control.matches('a[href^="#"]') && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
    previousSection = control.hash === '#projects' ? 'projects' : 'about';
  }
});

window.addEventListener('scroll', () => {
  const section = visibleSection();
  if (section !== previousSection) {
    previousSection = section;
    playCue(section === 'projects' ? 'step-down' : 'step-up');
  }
}, { passive: true });

for (const gallery of document.querySelectorAll('.gameplay-strip')) {
  const lastIndex = gallery.querySelectorAll('video').length - 1;
  function focusedIndex() {
    const travel = gallery.scrollWidth - gallery.clientWidth;
    return travel > 0 ? Math.round(lastIndex * gallery.scrollLeft / travel) : 0;
  }
  let previousIndex = focusedIndex();
  gallery.addEventListener('scroll', () => {
    const index = focusedIndex();
    if (index !== previousIndex) {
      previousIndex = index;
      playCue('move');
    }
  }, { passive: true });
}

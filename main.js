document.addEventListener('DOMContentLoaded', () => {
    // 1. Intersection Observer for scroll animations
    const cards = document.querySelectorAll('.project-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    cards.forEach(card => {
        card.style.opacity = 0;
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out, border-color 0.3s, box-shadow 0.3s';
        observer.observe(card);
    });

    // 2. Audio System API setup
    let audioCtx;
    let audioEnabled = false;

    const initOverlay = document.getElementById('audio-init-overlay');
    const startBtn = document.getElementById('start-btn');

    startBtn.addEventListener('click', () => {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if(audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        audioEnabled = true;
        initOverlay.style.display = 'none';
        playClickSound(); // Start sound confirming init
    });

    function playHoverSound() {
        if (!audioEnabled || !audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }

    function playClickSound() {
        if (!audioEnabled || !audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }

    // Bind sounds
    const interactives = document.querySelectorAll('.interactive, .close-btn, .interactive-link');
    interactives.forEach(el => {
        el.addEventListener('mouseenter', playHoverSound);
        el.addEventListener('click', playClickSound);
    });

    // 3. Modal Logic
    const modal = document.getElementById('project-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalTags = document.getElementById('modal-tags');
    const modalMediaContainer = document.getElementById('modal-media-container');
    const modalDesc = document.getElementById('modal-desc');
    const modalLink = document.getElementById('modal-link');

    // Convert vertical mouse scroll into horizontal scroll for the media slider
    modalMediaContainer.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
            e.preventDefault();
            modalMediaContainer.scrollLeft += e.deltaY;
        }
    });

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.project-card');
        if (!card) return;

        try {
            const title = card.getAttribute('data-title') || 'Unknown';
            const year = card.getAttribute('data-year') || '';
            const tags = (card.getAttribute('data-tags') || '').split(',');
            const desc = card.getAttribute('data-desc') || '';
            const link = card.getAttribute('data-link') || '#';
            const linkText = card.getAttribute('data-link-text') || 'Link';
            const mediaStr = card.getAttribute('data-media');
            const medias = mediaStr ? mediaStr.split(',') : [];

            modalTitle.innerHTML = title + ' <span style="font-size: 0.6rem; color: #777;">[' + year + ']</span>';
            
            modalTags.innerHTML = '';
            tags.forEach(t => {
                if(!t.trim()) return;
                const sp = document.createElement('span');
                sp.className = 'tag';
                sp.textContent = t.trim();
                modalTags.appendChild(sp);
            });

            modalDesc.textContent = desc;
            modalLink.href = link;
            modalLink.textContent = linkText;

            modalMediaContainer.innerHTML = '';
            medias.forEach(src => {
                if(!src.trim()) return;
                const trimmed = src.trim();
                const isVideo = trimmed.toLowerCase().endsWith('.webm') || trimmed.toLowerCase().endsWith('.mp4');
                if (isVideo) {
                    const vid = document.createElement('video');
                    vid.src = trimmed;
                    vid.autoplay = true;
                    vid.loop = true;
                    vid.muted = true;
                    vid.playsInline = true;
                    vid.setAttribute('playsinline', '');
                    modalMediaContainer.appendChild(vid);
                } else {
                    const img = document.createElement('img');
                    img.src = trimmed;
                    img.alt = title + ' media';
                    modalMediaContainer.appendChild(img);
                }
            });

            modal.style.opacity = '1';
            modal.style.pointerEvents = 'auto';
            modal.classList.add('active');
        } catch (err) {
            alert("Error opening modal: " + err.message);
            console.error(err);
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.opacity = '0';
            modal.style.pointerEvents = 'none';
            modal.classList.remove('active');
        }
    });
});

// script.js — Consolidated & corrected version
// Features:
// - scroll navigation (next/prev + keyboard)
// - background audio play/pause + volume slider + autoplay fallback
// - video autoplay/pause when in view (with overlay fallback)
// - DOM hearts (falling from top)
// - DOM shooting-stars (spawn from random edges, animated via CSS)
// - Canvas animation: floating hearts + golden comets (cover full screen)
// - responsive image/video resizing
// - robust checks (no duplicate blocks, no null errors)

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    // ---- elements ----
    const sections = Array.from(document.querySelectorAll(".section"));
    const nextBtn = document.getElementById("nextBtn");
    const prevBtn = document.getElementById("prevBtn");
    const audio = document.getElementById("bgAudio");
    const audioPlayBtn = document.getElementById("audioPlayBtn");
    const musicToggle = document.getElementById("musicToggle");
    const volumeSlider = document.getElementById("volumeSlider");

    // ---- scroll navigation ----
    let currentIndex = 0;
    let obs = null;

    if (sections.length) {
      obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const idx = sections.indexOf(entry.target);
              if (idx >= 0) currentIndex = idx;
            }
          });
        },
        { threshold: 0.55 }
      );

      sections.forEach((s) => obs.observe(s));
    } else {
      console.warn("No .section elements found.");
    }

    function goTo(index) {
      if (!sections.length) return;
      if (index < 0) index = 0;
      if (index >= sections.length) index = sections.length - 1;
      sections[index].scrollIntoView({ behavior: "smooth" });
      currentIndex = index;
    }

    if (nextBtn) nextBtn.addEventListener("click", () => goTo(currentIndex + 1));
    if (prevBtn) prevBtn.addEventListener("click", () => goTo(currentIndex - 1));

    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") goTo(currentIndex + 1);
      if (e.key === "ArrowUp" || e.key === "PageUp") goTo(currentIndex - 1);
    });

    // ---- background audio controls ----
    if (audio) audio.volume = 0.5;
    let musicPlaying = false;

    function tryAutoplayAudio() {
      if (!audio) return;
      audio
        .play()
        .then(() => {
          musicPlaying = true;
          if (audioPlayBtn) audioPlayBtn.style.display = "none";
          if (musicToggle) musicToggle.textContent = "⏸";
        })
        .catch(() => {
          if (audioPlayBtn) audioPlayBtn.style.display = "inline-block";
        });
    }

    if (audioPlayBtn) {
      audioPlayBtn.addEventListener("click", () => {
        if (!audio) return;
        audio
          .play()
          .then(() => {
            musicPlaying = true;
            audioPlayBtn.style.display = "none";
            if (musicToggle) musicToggle.textContent = "⏸";
          })
          .catch(() => {});
      });
    }

    document.addEventListener("click", tryAutoplayAudio, { once: true, capture: true });
    document.addEventListener("touchstart", tryAutoplayAudio, { once: true, capture: true });

    if (musicToggle) {
      musicToggle.addEventListener("click", () => {
        if (!audio) return;
        if (musicPlaying) {
          audio.pause();
          musicToggle.textContent = "🎵";
        } else {
          audio.play().catch(() => {});
          musicToggle.textContent = "⏸";
        }
        musicPlaying = !musicPlaying;
      });
    }

    if (volumeSlider) {
      const setInitialSlider = () => {
        if (!audio) return;
        const v = typeof audio.volume === "number" ? audio.volume : 0.5;
        volumeSlider.value = String(v);
      };

      setInitialSlider();

      volumeSlider.addEventListener("input", (e) => {
        if (!audio) return;
        const val = parseFloat(e.target.value);
        if (!Number.isNaN(val)) audio.volume = Math.min(1, Math.max(0, val));
      });
    }

    // ---- videos: autoplay/pause with IntersectionObserver ----
    const videos = Array.from(document.querySelectorAll("video.media-video"));
    if (videos.length) {
      const videoIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const v = entry.target;
            const overlay = v.parentElement
              ? v.parentElement.querySelector(".play-overlay")
              : null;

            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              v.play()
                .then(() => {
                  if (overlay) overlay.style.display = "none";
                })
                .catch(() => {
                  if (overlay) overlay.style.display = "block";
                });
            } else {
              if (!v.paused) v.pause();
            }
          });
        },
        { threshold: 0.5 }
      );

      videos.forEach((v) => {
        videoIO.observe(v);

        const overlay = v.parentElement
          ? v.parentElement.querySelector(".play-overlay")
          : null;

        if (overlay) {
          overlay.addEventListener("click", () => {
            v.play()
              .then(() => (overlay.style.display = "none"))
              .catch(() => {});
          });
        }

        v.addEventListener("click", () => {
          if (v.paused) v.play().catch(() => {});
          else v.pause();
        });

        v.addEventListener("play", () => {
          videos.forEach((other) => {
            if (other !== v && !other.paused) other.pause();
          });
        });
      });
    }

    // ================================
    // Dynamic Resize for Videos & Images
    // ================================
    function resizeMedia() {
      const mediaElements = document.querySelectorAll(".media-img, .media-video");
      const screenWidth = window.innerWidth;

      mediaElements.forEach((media) => {
        if (screenWidth < 768) {
          media.style.maxWidth = "85%";
          media.style.maxHeight = "50vh";
        } else if (screenWidth < 1200) {
          media.style.maxWidth = "75%";
          media.style.maxHeight = "55vh";
        } else {
          media.style.maxWidth = "95%";
          media.style.maxHeight = "75vh";
        }
      });
    }

    window.addEventListener("resize", resizeMedia);
    window.addEventListener("DOMContentLoaded", resizeMedia);
  });
})();

/* ============================================
   PURE VISUALS — Stars, Hearts & Shooting Stars
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {

  /* 🌟 Floating Stars & Hearts (DOM elements) */
  function spawnFloating(stars = 50, hearts = 20) {
    const layer = document.createElement("div");
    layer.className = "floating-layer";
    Object.assign(layer.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "2",
      overflow: "visible"
    });
    document.body.appendChild(layer);

    // Smooth animation helper
    function animate(el, dur, dx, dy) {
      el.animate([
        { transform: "translate(0, 0)", opacity: 0.95 },
        { transform: `translate(${dx}px, ${dy}px)`, opacity: 0.1 }
      ], {
        duration: dur,
        iterations: Infinity,
        delay: Math.random() * 2000,
        easing: "ease-in-out"
      });
    }

    // 🌟 Stars (soft gold glow)
    for (let i = 0; i < stars; i++) {
      const s = document.createElement("div");
      s.className = "star";
      Object.assign(s.style, {
        position: "fixed",
        left: Math.random() * 100 + "vw",
        top: Math.random() * 100 + "vh",
        width: 2 + Math.random() * 4 + "px",
        height: 2 + Math.random() * 4 + "px",
        background: "gold",
        borderRadius: "50%",
        boxShadow: "0 0 6px gold"
      });
      animate(s, 9000 + Math.random() * 8000, (Math.random() - 0.5) * 100, -200 - Math.random() * 400);
      layer.appendChild(s);
    }

    // 💖 Hearts
    for (let i = 0; i < hearts; i++) {
      const h = document.createElement("div");
      h.className = "heart";
      Object.assign(h.style, {
        position: "fixed",
        left: Math.random() * 100 + "vw",
        top: Math.random() * 100 + "vh",
        width: 12 + Math.random() * 10 + "px",
        height: 12 + Math.random() * 10 + "px",
        background: "rgba(255, 105, 180, 0.8)",
        transform: "rotate(45deg)",
        borderRadius: "50%",
        boxShadow: "0 0 8px rgba(255, 105, 180, 0.6)"
      });
      animate(h, 11000 + Math.random() * 9000, (Math.random() - 0.5) * 100, -300 - Math.random() * 400);
      layer.appendChild(h);
    }
  }


  /* 🌠 Shooting Stars (Canvas) */
  function shootingStars() {
    const canvas = document.createElement("canvas");
    canvas.id = "shootingStars";
    Object.assign(canvas.style, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "1"
    });
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    class Star {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height / 2;
        this.length = Math.random() * 100 + 50;
        this.speed = Math.random() * 6 + 4;
        this.opacity = Math.random() * 0.6 + 0.4;
      }
      update() {
        this.x += this.speed;
        this.y += this.speed * 0.3;
        if (this.x > canvas.width || this.y > canvas.height) this.reset();
      }
      draw() {
        const grad = ctx.createLinearGradient(this.x, this.y, this.x - this.length, this.y - this.length * 0.5);
        grad.addColorStop(0, `rgba(255,255,255,${this.opacity})`);
        grad.addColorStop(1, "transparent");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.length, this.y - this.length * 0.5);
        ctx.stroke();
      }
    }

    const stars = Array.from({ length: 25 }, () => new Star());

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => { s.update(); s.draw(); });
      requestAnimationFrame(animate);
    }
    animate();
  }

  /* Run all visuals */
  spawnFloating(40, 20);
  shootingStars();
});


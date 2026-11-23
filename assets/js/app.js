/* ============================================================
   ChelV2 Mirror — app.js
   Fetches all data from the main site API and renders the
   Obsidian Noir design identically in static HTML mirrors.
   API: https://chel.qzz.io/api.php  (v2)
   ============================================================ */
(function () {
  'use strict';

  var API  = 'https://chel.qzz.io/api.php';
  var BASE = 'https://chel.qzz.io';

  /* ---- helpers ---- */
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#039;');
  }

  function mediaUrl(path) {
    if (!path) return '';
    if (/^(https?:)?\/\//i.test(path) || /^data:/i.test(path)) return path;
    path = path.replace(/\\/g, '/').replace(/^\/+/, '');
    return BASE + '/' + path;
  }

  function jsonArr(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { var d = JSON.parse(val); return Array.isArray(d) ? d : []; }
    catch (e) { return []; }
  }

  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val || '';
  }

  function setAttr(id, attr, val) {
    var el = document.getElementById(id);
    if (el) el.setAttribute(attr, val || '');
  }

  /* ---- footer year ---- */
  var fyEls = document.querySelectorAll('#footer-year');
  fyEls.forEach(function(el){ el.textContent = new Date().getFullYear(); });

  /* ---- routing ---- */
  var path   = window.location.pathname;
  var params = new URLSearchParams(window.location.search);
  var slug   = params.get('slug');

  if ((path.indexOf('project.html') !== -1 || path.indexOf('/project') !== -1) && slug) {
    loadProjectDetail(slug);
  } else if ((path.indexOf('certif.html') !== -1 || path.indexOf('/certif') !== -1) && slug) {
    loadCertifDetail(slug);
  } else {
    loadHome();
  }

  /* ================================================================
     HOME — full portfolio payload
  ================================================================ */
  function loadHome() {
    fetch(API)
      .then(function(r){ return r.json(); })
      .then(function(json){
        if (json.status !== 'success') return;
        var d = json.data;
        applySettings(d.settings);
        renderSkills(d.skills);
        renderProjects(d.projects, d.categories);
        renderCertificates(d.certificates);
        renderMirrors(d.mirrors);
        renderSocial(d.settings);

        /* stats counters */
        var totalSkills = 0;
        if (d.skills) {
          Object.keys(d.skills).forEach(function(k){ totalSkills += d.skills[k].length; });
        }
        setCounterTarget('stat-projects',   d.projects     ? d.projects.length     : 0, '+');
        setCounterTarget('stat-certs',      d.certificates ? d.certificates.length : 0, '');
        setCounterTarget('stat-skills',     totalSkills,                                 '');

        /* re-run main.js reveals after dynamic content added */
        reactivate();
      })
      .catch(function(e){ console.error('API fetch failed:', e); });
  }

  /* ---- settings ---- */
  function applySettings(s) {
    if (!s) return;

    /* SEO */
    if (s.site_title) {
      document.title = esc(s.site_title) + ' | Portfolio';
      var ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', s.site_title + ' | Portfolio');
    }

    /* Hero */
    var firstName = (s.hero_name || 'Harschel Brilliant Simbolon').split(' ')[0];
    setText('hero-firstname', firstName);
    setText('hero-status',    s.availability_status || 'System Online — Open for Opportunities');
    setText('hero-bio',       s.about_bio || '');
    setText('hero-location',  s.location  || 'Batam, Indonesia');

    /* Hero typewriter words */
    var typeEl = document.getElementById('hero-typewriter');
    if (typeEl && s.hero_roles) {
      try {
        var roles = typeof s.hero_roles === 'string' ? JSON.parse(s.hero_roles) : s.hero_roles;
        if (Array.isArray(roles) && roles.length) {
          typeEl.setAttribute('data-words', JSON.stringify(roles));
        }
      } catch(e){}
    }

    /* Portrait */
    if (s.profile_image) {
      setAttr('hero-portrait', 'src', mediaUrl(s.profile_image));
    }
    setAttr('hero-portrait', 'alt', s.site_title || 'Harschel Brilliant Simbolon');

    /* About */
    var aboutEl = document.getElementById('about-text');
    if (aboutEl && s.about_text) {
      aboutEl.innerHTML = s.about_text
        .split('\n')
        .map(function(l){ return l ? '<p>' + esc(l) + '</p>' : ''; })
        .join('');
    }
    setText('info-location', s.location || 'Batam, Indonesia');
    setText('info-email',    s.email    || '—');
    setText('info-phone',    s.phone    || '—');

    /* Contact section */
    if (s.email) {
      setAttr('contact-email-link', 'href', 'mailto:' + s.email);
      setText('contact-email-text', s.email);
    }
    if (s.whatsapp_link) {
      var waEl = document.getElementById('contact-wa-link');
      if (waEl) {
        waEl.style.display = '';
        waEl.setAttribute('href', 'https://wa.me/' + s.whatsapp_link.replace(/[^0-9]/g, ''));
        setText('contact-wa-text', s.phone || 'WhatsApp');
      }
    }

    /* Footer bio */
    setText('footer-bio', s.about_bio || '');
  }

  /* ---- social row builder ---- */
  function socialHtml(s) {
    var html = '';
    if (s.linkedin_link)  html += '<a class="social-btn" href="' + esc(s.linkedin_link) + '" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg></a>';
    if (s.github_link)    html += '<a class="social-btn" href="' + esc(s.github_link) + '" target="_blank" rel="noopener" aria-label="GitHub"><svg viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg></a>';
    if (s.instagram_link) html += '<a class="social-btn" href="' + esc(s.instagram_link) + '" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>';
    if (s.facebook_link)  html += '<a class="social-btn" href="' + esc(s.facebook_link) + '" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg></a>';
    if (s.whatsapp_link)  html += '<a class="social-btn" href="https://wa.me/' + s.whatsapp_link.replace(/[^0-9]/g,'') + '" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.01 2.014c-5.495 0-9.96 4.465-9.96 9.96 0 1.76.458 3.486 1.33 5l-1.408 5.143 5.258-1.38c1.472.793 3.125 1.21 4.78 1.21h.004c5.495 0 9.957-4.465 9.957-9.96 0-2.665-1.037-5.17-2.92-7.054a9.907 9.907 0 00-7.04-2.919zm0 18.232h-.002c-1.488 0-2.95-.398-4.23-1.15l-.304-.18-3.148.826.84-3.07-.197-.315a8.272 8.272 0 01-1.265-4.385c0-4.57 3.72-8.29 8.297-8.29 2.215 0 4.298.863 5.864 2.428a8.272 8.272 0 012.43 5.87c0 4.568-3.719 8.286-8.286 8.286zm4.545-6.195c-.25-.125-1.473-.727-1.701-.81-.23-.082-.397-.125-.565.125-.166.25-.645.81-.79.975-.145.166-.29.187-.54.062-.25-.125-1.05-.387-1.996-1.23-.736-.658-1.233-1.472-1.378-1.722-.146-.25-.015-.386.11-.51.112-.112.25-.292.375-.438.125-.146.166-.25.25-.417.082-.167.042-.313-.02-.438-.063-.125-.565-1.365-.775-1.87-.204-.492-.41-.425-.565-.433-.146-.007-.313-.007-.478-.007-.167 0-.438.063-.667.313-.23.25-.875.854-.875 2.083 0 1.23.896 2.417 1.021 2.583.125.167 1.761 2.688 4.267 3.771.596.258 1.062.413 1.425.529.596.19 1.14.163 1.57.1.484-.07 1.473-.602 1.681-1.185.208-.583.208-1.083.146-1.185-.062-.102-.23-.165-.478-.29z"/></svg></a>';
    if (s.email)          html += '<a class="social-btn" href="mailto:' + esc(s.email) + '" aria-label="Email"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></a>';
    return html;
  }

  function renderSocial(s) {
    if (!s) return;
    var h = socialHtml(s);
    var sr = document.getElementById('social-row');
    var fs = document.getElementById('footer-social');
    if (sr) sr.innerHTML = h;
    if (fs) fs.innerHTML = h;
  }

  /* ---- skills ---- */
  var catMeta = {
    'Development': ['</>', 'App & Backend Layer'],
    'AI & Data':   ['🤖',  'Intelligence Layer'],
    'Design':      ['🎨',  'Interface Layer'],
    'Hardware':    ['🔧', 'Physical Layer'],
    'Technical':   ['⚙️',  'Ops & Tooling Layer'],
    'Other':       ['🧩',  'Extended Stack']
  };

  function renderSkills(grouped) {
    var container = document.getElementById('skills-container');
    if (!container || !grouped) return;
    var html = '';
    var i = 0;
    Object.keys(grouped).forEach(function(category) {
      i++;
      var skills  = grouped[category];
      var isCloud = category === 'Other';
      var meta    = catMeta[category] || ['·', ''];
      var glyph   = meta[0];
      var sub     = meta[1];
      var count   = skills.length;
      var delay   = (i * 0.07).toFixed(2);

      html += '<div class="skill-card card-lux hud-corner reveal' + (isCloud ? ' skill-card--cloud' : '') + '" style="--d:' + delay + 's;">';
      html += '<div class="skill-card-head"><i>' + esc(glyph) + '</i>';
      html += '<div class="skill-card-heading"><h3>' + esc(category) + '</h3>';
      html += '<span class="skill-card-sub">' + count + ' module' + (count === 1 ? '' : 's') + (sub ? ' · ' + esc(sub) : '') + '</span></div></div>';

      if (isCloud) {
        html += '<div class="chip-cloud">';
        skills.forEach(function(sk) {
          html += '<span class="skill-tag skill-tag--chip">' + (sk.icon ? esc(sk.icon) + ' ' : '') + esc(sk.name) + '</span>';
        });
        html += '</div>';
      } else {
        html += '<div class="skill-tags">';
        skills.forEach(function(sk) {
          var pct = parseInt(sk.percentage, 10) || 0;
          html += '<span class="skill-tag"><span class="skill-tag-name">' + esc(sk.name) + '</span>';
          if (pct > 0) {
            html += '<span class="skill-tag-meter" aria-hidden="true"><span class="skill-fill" data-percent="' + pct + '"></span></span>';
            html += '<b class="skill-tag-pct">' + pct + '%</b>';
          }
          html += '</span>';
        });
        html += '</div>';
      }
      html += '</div>';
    });
    container.innerHTML = html;

    /* animate skill bars */
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        container.querySelectorAll('.skill-fill').forEach(function(el) {
          el.style.width = (el.getAttribute('data-percent') || 0) + '%';
        });
      });
    });
  }

  /* ---- projects ---- */
  function renderProjects(projects, categories) {
    var filterBar = document.getElementById('filter-bar');
    var grid      = document.getElementById('projects-grid');
    if (!grid) return;

    /* filter buttons */
    if (filterBar && categories) {
      var fb = '';
      categories.forEach(function(cat) {
        fb += '<button class="filter-btn" data-filter="' + esc(cat.slug) + '">' + esc(cat.name) + '</button>';
      });
      filterBar.innerHTML = '<button class="filter-btn active" data-filter="all">All Systems</button>' + fb;
    }

    if (!projects) return;
    var html = '';
    projects.forEach(function(p, idx) {
      var gallery = jsonArr(p.gallery);
      var tech    = jsonArr(p.tech_stack);
      var thumb   = p.thumbnail ? mediaUrl(p.thumbnail) : (gallery[0] ? mediaUrl(gallery[0]) : '');
      var video   = p.video_preview ? mediaUrl(p.video_preview) : '';
      var delay   = ((idx % 3) * 0.08).toFixed(2);
      var num     = String(idx + 1).padStart(2, '0');

      html += '<div class="project-card-wrap reveal" data-cat="' + esc(p.category_slug || '') + '" style="--d:' + delay + 's;">';
      html += '<a href="project.html?slug=' + esc(p.slug) + '" class="project-card" data-tilt="4">';
      html += '<div class="project-media">';
      if (video) {
        html += '<video class="project-video" src="' + esc(video) + '"' + (thumb ? ' poster="' + esc(thumb) + '"' : '') + ' autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>';
      } else if (thumb) {
        html += '<img src="' + esc(thumb) + '" alt="' + esc(p.title) + '" loading="lazy">';
      }
      html += '<span class="project-idx">SYS-' + num + '</span>';
      if (p.is_featured) html += '<span class="project-featured">★ Featured</span>';
      html += '</div>';
      html += '<div class="project-body">';
      html += '<span class="project-cat">' + esc(p.category_name || 'Project') + '</span>';
      html += '<h3 class="project-title">' + esc(p.title) + '</h3>';
      html += '<p class="project-desc">' + esc(p.short_desc || '') + '</p>';
      html += '<div class="project-tech">';
      tech.slice(0, 4).forEach(function(t){ html += '<span class="chip">' + esc(t) + '</span>'; });
      if (tech.length > 4) html += '<span class="chip">+' + (tech.length - 4) + '</span>';
      html += '</div></div>';
      html += '<span class="project-open"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M7 7h10v10"/></svg></span>';
      html += '</a></div>';
    });
    grid.innerHTML = html;

    /* project video intersection observer */
    if ('IntersectionObserver' in window) {
      var vIO = new IntersectionObserver(function(entries) {
        entries.forEach(function(en) {
          if (en.isIntersecting) {
            var p2 = en.target.play(); if (p2 && p2.catch) p2.catch(function(){});
          } else { en.target.pause(); }
        });
      }, { threshold: 0.2 });
      grid.querySelectorAll('.project-video').forEach(function(v){ vIO.observe(v); });
    }
  }

  /* ---- certificates ---- */
  function renderCertificates(certs) {
    var scroller = document.getElementById('cert-scroller');
    if (!scroller || !certs) return;
    var html = '';
    certs.forEach(function(cert) {
      var imgs  = jsonArr(cert.file_path);
      var cover = imgs.length ? mediaUrl(imgs[0]) : '';
      html += '<a href="certif.html?slug=' + esc(cert.slug) + '" class="cert-card reveal">';
      html += '<div class="cert-thumb">';
      if (cover) html += '<img src="' + esc(cover) + '" alt="' + esc(cert.title) + '" loading="lazy">';
      html += '</div>';
      html += '<div class="cert-body">';
      html += '<span class="cert-issuer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>' + esc(cert.issuer) + '</span>';
      html += '<h3 class="cert-title">' + esc(cert.title) + '</h3>';
      html += '<span class="cert-date">' + esc(cert.issue_date || '') + '</span>';
      html += '</div></a>';
    });
    scroller.innerHTML = html;
  }

  /* ---- mirrors ---- */
  function renderMirrors(mirrors) {
    var container = document.getElementById('mirrors-container');
    if (!container) return;
    if (!mirrors || !mirrors.length) {
      container.innerHTML = '<span class="mono" style="color:var(--faint);font-size:13px;">No mirror domains configured.</span>';
      return;
    }
    var html = '';
    mirrors.forEach(function(domain) {
      html += '<span class="mirror-pill"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 4 5.7 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.7-4-9s1.5-6.4 4-9z"/></svg>' + esc(domain) + '</span>';
    });
    container.innerHTML = html;
  }

  /* ---- counter helper ---- */
  function setCounterTarget(id, value, suffix) {
    var el = document.getElementById(id);
    if (!el) return;
    el.setAttribute('data-count', value);
    if (suffix) el.setAttribute('data-suffix', suffix);
    /* re-run counter animation */
    var target = parseInt(value, 10) || 0;
    var sfx    = suffix || '';
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) { el.textContent = target + sfx; return; }
    var start = null, dur = 1500;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + sfx;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---- contact form ---- */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var fd    = new FormData(contactForm);
      var msgEl = document.getElementById('form-msg');
      var btn   = contactForm.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Transmitting…'; }

      fetch(BASE + '/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(fd).toString()
      })
      .then(function(r){
        if (msgEl) {
          msgEl.style.display = '';
          if (r.ok) {
            msgEl.className = 'toast toast-success';
            msgEl.textContent = 'Message transmitted successfully!';
            contactForm.reset();
          } else {
            msgEl.className = 'toast toast-error';
            msgEl.textContent = 'Transmission failed. Please try again.';
          }
          setTimeout(function(){
            msgEl.style.opacity = '0'; msgEl.style.transform = 'translateY(-8px)';
            setTimeout(function(){ msgEl.style.display = 'none'; msgEl.style.opacity = ''; msgEl.style.transform = ''; }, 650);
          }, 5200);
        }
      })
      .catch(function(){
        if (msgEl) {
          msgEl.style.display = '';
          msgEl.className = 'toast toast-error';
          msgEl.textContent = 'Network error. Please email directly.';
        }
      })
      .finally(function(){
        if (btn) { btn.disabled = false; btn.innerHTML = 'Transmit Message <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>'; }
      });
    });
  }

  /* ================================================================
     PROJECT DETAIL
  ================================================================ */
  function loadProjectDetail(slug) {
    fetch(API + '?action=project&slug=' + encodeURIComponent(slug))
      .then(function(r){ return r.json(); })
      .then(function(json){
        var loading = document.getElementById('page-loading');
        var content = document.getElementById('project-content');
        if (loading) loading.style.display = 'none';
        if (content) content.style.display = '';

        if (json.status !== 'success' || !json.data) {
          if (content) content.innerHTML = notFoundHtml('Project');
          return;
        }
        var p       = json.data;
        var gallery = jsonArr(p.gallery);
        var tech    = jsonArr(p.tech_stack);
        var docs    = jsonArr(p.documents);

        document.title = esc(p.title) + ' | Portfolio';

        var html = '';

        /* Detail hero */
        html += '<section class="detail-hero"><div class="container">';
        html += '<nav class="breadcrumb reveal"><a href="index.html">Home</a><span class="sep">/</span><a href="index.html#projects">Projects</a><span class="sep">/</span><span style="color:var(--gold);">' + esc(p.title) + '</span></nav>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:36px;align-items:flex-start;margin-top:26px;">';

        html += '<div style="flex:1 1 480px;min-width:0;" class="reveal">';
        html += '<span class="project-cat mono" style="font-size:11px;letter-spacing:.26em;color:var(--cyan);text-transform:uppercase;">' + esc(p.category_name || 'Project') + '</span>';
        html += '<h1 class="detail-title">' + esc(p.title) + '</h1>';
        html += '<p class="lead">' + esc(p.short_desc || '') + '</p>';
        html += '<div class="detail-meta">';
        if (p.created_at) html += '<span class="item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' + esc(fmtDate(p.created_at)) + '</span>';
        if (p.is_featured) html += '<span class="item text-gold"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.26 6.6.57-5 4.36 1.5 6.45L12 16.9 5.99 19.64l1.5-6.45-5-4.36 6.6-.57L12 2z"/></svg>Featured System</span>';
        html += '</div>';
        if (tech.length) {
          html += '<div class="project-tech mt-20">';
          tech.forEach(function(t){ html += '<span class="chip">' + esc(t) + '</span>'; });
          html += '</div>';
        }
        html += '<div class="hero-cta" style="margin-top:30px;">';
        if (p.demo_link) html += '<a href="' + esc(p.demo_link) + '" target="_blank" rel="noopener" class="btn btn-gold btn-shine">Live Demo <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></a>';
        if (p.paper_link) html += '<a href="' + esc(mediaUrl(p.paper_link)) + '" target="_blank" rel="noopener" class="btn btn-ghost"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>Research Paper</a>';
        html += '<a href="index.html#contact" class="btn btn-ghost">Discuss This</a>';
        html += '</div></div>';

        if (p.thumbnail) {
          html += '<div style="flex:1 1 420px;min-width:0;" class="reveal reveal-right"><div class="media-frame" data-tilt="3"><img src="' + esc(mediaUrl(p.thumbnail)) + '" alt="' + esc(p.title) + '"></div></div>';
        }
        html += '</div></div></section>';

        /* Video */
        if (p.video_preview) {
          html += '<section class="section" style="padding-top:20px;"><div class="container"><span class="section-label reveal">System Demonstration</span><div class="media-frame mt-20 reveal"><video src="' + esc(mediaUrl(p.video_preview)) + '" controls playsinline preload="metadata"' + (p.thumbnail ? ' poster="' + esc(mediaUrl(p.thumbnail)) + '"' : '') + '></video></div></div></section>';
        }

        /* Full description */
        if (p.full_description) {
          html += '<section class="section section-alt" style="padding:80px 0;"><div class="container"><span class="section-label reveal">Engineering Deep-Dive</span><div class="glass rich-content mt-20 reveal" style="padding:clamp(26px,4vw,48px);">' + p.full_description + '</div></div></section>';
        }

        /* Gallery */
        if (gallery.length) {
          html += '<section class="section"><div class="container"><span class="section-label reveal">Visual Archive</span><div class="gallery-grid mt-20">';
          gallery.forEach(function(img) {
            html += '<div class="gallery-item reveal" data-lightbox data-full="' + esc(mediaUrl(img)) + '"><img src="' + esc(mediaUrl(img)) + '" alt="' + esc(p.title) + ' gallery" loading="lazy"></div>';
          });
          html += '</div></div></section>';
        }

        /* Documents */
        if (docs.length) {
          html += '<section class="section" style="padding-top:0;"><div class="container"><span class="section-label reveal">Attached Documents</span><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;" class="mt-20">';
          docs.forEach(function(doc) {
            var dpath  = typeof doc === 'object' ? (doc.path  || '') : String(doc);
            var dtitle = typeof doc === 'object' ? (doc.title || window.basename(dpath)) : window.basename(dpath);
            if (!dpath) return;
            var ext = dpath.split('.').pop().toUpperCase();
            html += '<a class="doc-card reveal" href="' + esc(mediaUrl(dpath)) + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/><path stroke-linecap="round" stroke-linejoin="round" d="M14 3v6h6"/></svg><div><b>' + esc(dtitle) + '</b><span>' + ext + ' · Document</span></div></a>';
          });
          html += '</div></div></section>';
        }

        /* Prev / Next */
        html += '<div class="container"><div class="prevnext"><a href="index.html#projects">← Back to Projects</a></div></div>';

        if (content) {
          content.innerHTML = html;
          reactivate();
          initLightbox(content);
        }
      })
      .catch(function(e){
        console.error(e);
        var loading = document.getElementById('page-loading');
        var content = document.getElementById('project-content');
        if (loading) loading.style.display = 'none';
        if (content) { content.style.display = ''; content.innerHTML = errorHtml(); }
      });
  }

  /* ================================================================
     CERTIF DETAIL
  ================================================================ */
  function loadCertifDetail(slug) {
    fetch(API + '?action=certif&slug=' + encodeURIComponent(slug))
      .then(function(r){ return r.json(); })
      .then(function(json){
        var loading = document.getElementById('page-loading');
        var content = document.getElementById('certif-content');
        if (loading) loading.style.display = 'none';
        if (content) content.style.display = '';

        if (json.status !== 'success' || !json.data) {
          if (content) content.innerHTML = notFoundHtml('Certificate');
          return;
        }
        var c      = json.data;
        var images = jsonArr(c.file_path);

        document.title = esc(c.title) + ' | Certificate';

        var html = '';

        /* Detail hero */
        html += '<section class="detail-hero" style="padding-bottom:40px;"><div class="container">';
        html += '<nav class="breadcrumb reveal"><a href="index.html">Home</a><span class="sep">/</span><a href="index.html#certificates">Certificates</a><span class="sep">/</span><span style="color:var(--gold);">' + esc(c.title) + '</span></nav>';
        html += '<div class="reveal" style="margin-top:26px;">';
        html += '<span class="cert-issuer mono" style="font-size:11px;letter-spacing:.26em;color:var(--cyan);text-transform:uppercase;">Issued by ' + esc(c.issuer) + '</span>';
        html += '<h1 class="detail-title">' + esc(c.title) + '</h1>';
        html += '<div class="detail-meta">';
        if (c.issue_date) html += '<span class="item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>Issued ' + esc(c.issue_date) + '</span>';
        html += '<span class="item text-gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>Verified Credential</span>';
        html += '</div>';
        if (c.credential_url) {
          html += '<div class="hero-cta" style="margin-top:26px;"><a href="' + esc(c.credential_url) + '" target="_blank" rel="noopener" class="btn btn-gold btn-shine">Verify Credential <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></a></div>';
        }
        html += '</div></div></section>';

        /* Carousel */
        html += '<section class="section" style="padding-top:0;"><div class="container">';
        if (images.length) {
          html += '<div class="carousel reveal" data-carousel>';
          images.forEach(function(img, i) {
            html += '<div class="carousel-slide' + (i === 0 ? ' active' : '') + '"><img src="' + esc(mediaUrl(img)) + '" alt="' + esc(c.title) + ' — page ' + (i+1) + '"></div>';
          });
          if (images.length > 1) {
            html += '<button class="carousel-btn prev" aria-label="Previous page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg></button>';
            html += '<button class="carousel-btn next" aria-label="Next page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></button>';
          }
          html += '<span class="carousel-count">1 / ' + images.length + '</span>';
          html += '</div>';
        } else {
          html += '<div class="glass" style="padding:60px 30px;text-align:center;"><p class="mono" style="color:var(--faint);letter-spacing:.2em;text-transform:uppercase;font-size:12px;">No scan available for this credential</p></div>';
        }

        /* All pages grid */
        if (images.length > 1) {
          html += '<div class="gallery-grid mt-30">';
          images.forEach(function(img) {
            html += '<div class="gallery-item reveal" data-lightbox data-full="' + esc(mediaUrl(img)) + '"><img src="' + esc(mediaUrl(img)) + '" alt="' + esc(c.title) + '" loading="lazy"></div>';
          });
          html += '</div>';
        }
        html += '</div></section>';

        if (content) {
          content.innerHTML = html;
          reactivate();
          initLightbox(content);
          initCarousel(content);
        }
      })
      .catch(function(e){
        console.error(e);
        var loading = document.getElementById('page-loading');
        var content = document.getElementById('certif-content');
        if (loading) loading.style.display = 'none';
        if (content) { content.style.display = ''; content.innerHTML = errorHtml(); }
      });
  }

  /* ================================================================
     Utilities
  ================================================================ */

  /* Date formatter */
  function fmtDate(str) {
    if (!str) return '';
    var d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  /* Not-found / error HTML */
  function notFoundHtml(type) {
    return '<section class="detail-hero"><div class="container" style="text-align:center;min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;"><h1 class="detail-title">' + type + ' Not Found</h1><a href="index.html" class="btn btn-gold btn-shine mt-20">Return Home</a></div></section>';
  }
  function errorHtml() {
    return '<section class="detail-hero"><div class="container" style="text-align:center;min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;"><h1 class="detail-title">Failed to load data</h1><p class="lead">Could not reach the API. Please try again later.</p><a href="index.html" class="btn btn-gold btn-shine mt-20">Return Home</a></div></section>';
  }

  /* Re-run main.js scroll-reveal and tilt on newly injected DOM */
  function reactivate() {
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        document.querySelectorAll('.reveal:not(.in-view)').forEach(function(el){
          el.classList.add('in-view');
        });
        document.querySelectorAll('.skill-fill').forEach(function(el){
          el.style.width = (el.getAttribute('data-percent') || 0) + '%';
        });
        /* re-run filter bindings after project render */
        var filterBtns   = document.querySelectorAll('.filter-btn');
        var projectCards = document.querySelectorAll('.project-card-wrap');
        if (filterBtns.length && projectCards.length) {
          filterBtns.forEach(function(btn){
            btn.addEventListener('click', function(){
              filterBtns.forEach(function(b){ b.classList.remove('active'); });
              btn.classList.add('active');
              var f = btn.getAttribute('data-filter');
              projectCards.forEach(function(wrap){
                var show = f === 'all' || wrap.getAttribute('data-cat') === f;
                wrap.style.display = show ? '' : 'none';
                if (show) { wrap.classList.remove('in-view'); void wrap.offsetWidth; wrap.classList.add('in-view'); }
              });
            });
          });
        }
        /* tilt on newly injected cards */
        var finePointer  = window.matchMedia('(pointer: fine)').matches;
        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (finePointer && !reduceMotion) {
          document.querySelectorAll('[data-tilt]').forEach(function(card){
            if (card._tiltBound) return;
            card._tiltBound = true;
            var strength = parseFloat(card.getAttribute('data-tilt')) || 8;
            card.addEventListener('mousemove', function(e){
              var r = card.getBoundingClientRect();
              var px = (e.clientX - r.left) / r.width  - 0.5;
              var py = (e.clientY - r.top)  / r.height - 0.5;
              card.style.transform = 'perspective(900px) rotateX(' + (-py * strength) + 'deg) rotateY(' + (px * strength) + 'deg) translateY(-4px)';
            });
            card.addEventListener('mouseleave', function(){ card.style.transform = ''; });
          });
        }
      });
    });
  }

  /* Lightbox init for dynamically injected content */
  function initLightbox(root) {
    var lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    var lbImg = lightbox.querySelector('img');
    (root || document).querySelectorAll('[data-lightbox]').forEach(function(item){
      item.addEventListener('click', function(e){
        e.preventDefault();
        var src = item.getAttribute('data-full') || ((item.querySelector('img') || {}).src);
        if (src && lbImg) {
          lbImg.src = src;
          lightbox.classList.add('open');
          document.body.style.overflow = 'hidden';
        }
      });
    });
  }

  /* Carousel init for dynamically injected content */
  function initCarousel(root) {
    var carousel = (root || document).querySelector('[data-carousel]');
    if (!carousel) return;
    var slides  = carousel.querySelectorAll('.carousel-slide');
    var countEl = carousel.querySelector('.carousel-count');
    var idx = 0;
    function show(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function(s, k){ s.classList.toggle('active', k === idx); });
      if (countEl) countEl.textContent = (idx + 1) + ' / ' + slides.length;
    }
    var prev = carousel.querySelector('.carousel-btn.prev');
    var next = carousel.querySelector('.carousel-btn.next');
    if (prev) prev.addEventListener('click', function(){ show(idx - 1); });
    if (next) next.addEventListener('click', function(){ show(idx + 1); });
    document.addEventListener('keydown', function(e){
      if (e.key === 'ArrowLeft')  show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* basename helper (no path module in browser) */
  window.basename = window.basename || function(p) {
    return p ? p.split(/[\\/]/).pop() : '';
  };

})();

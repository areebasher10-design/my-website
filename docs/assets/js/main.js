(function () {
  "use strict";

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;
  if (reduceMotion) doc.classList.add("no-motion");

  /* ---------- Header state ---------- */
  var header = document.querySelector("[data-header]");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.querySelector("[data-nav]");
  function setNav(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    toggle.querySelector(".nav-toggle-label").textContent = open ? "Close" : "Menu";
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setNav(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setNav(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setNav(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1180) setNav(false);
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Reveal on scroll ---------- */
  document.querySelectorAll("[data-reveal-group]").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.setAttribute("data-reveal", "");
      child.style.setProperty("--stagger", String(i));
    });
  });
  if (!reduceMotion && hasIO) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal-in");
        entry.target.classList.remove("reveal-pending");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      // Content already on screen is never hidden, so nothing flashes or waits.
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      el.classList.add("reveal-pending");
      revealObserver.observe(el);
    });
  }

  /* ---------- One-time "in view" animations (data branches, wholesale flow) ---------- */
  function animateOnView(selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (reduceMotion || !hasIO) return;
      el.classList.add("will-animate");
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          el.classList.add("is-visible");
          io.disconnect();
        });
      }, { threshold: 0.3 });
      io.observe(el);
    });
  }
  animateOnView("[data-branches]");
  animateOnView("[data-wflow]");

  /* ---------- Hero sequence ---------- */
  var hero = document.querySelector("[data-hero-anim]");
  if (hero) initHero(hero);

  function initHero(root) {
    var svg = root.querySelector("[data-ha-svg]");
    var dots = root.querySelectorAll("[data-ha-steps] li");
    var label = root.querySelector("[data-ha-label]");
    var btn = root.querySelector("[data-ha-toggle]");
    if (!svg || reduceMotion) return; // static, fully composed illustration

    var labels = [
      "From property prospect to qualified conversation",
      "1 · Property record selected",
      "2 · VA calling interface activates",
      "3 · Conversation in progress",
      "4 · Qualification fields noted",
      "5 · Prospect entered in CRM",
      "6 · Follow-up organized"
    ];
    var durations = [900, 1500, 1500, 2600, 2400, 1900, 3400];
    var stage = 0;
    var timer = null;
    var userPaused = false;
    var inView = true;

    svg.classList.add("is-animated");

    function render() {
      for (var i = 1; i <= 6; i++) svg.classList.toggle("st" + i, i <= stage);
      dots.forEach(function (d, i) {
        d.classList.toggle("is-current", i === stage - 1);
        d.classList.toggle("is-done", i < stage - 1);
      });
      if (label) label.textContent = labels[stage];
    }

    function next() {
      if (stage === 6) {
        svg.classList.add("is-resetting");
        stage = 0;
        render();
        timer = setTimeout(function () {
          svg.classList.remove("is-resetting");
          schedule();
        }, 450);
        return;
      }
      stage += 1;
      render();
      schedule();
    }

    function schedule() {
      clearTimeout(timer);
      if (userPaused || !inView || document.hidden) return;
      timer = setTimeout(next, durations[stage]);
    }

    function stop() { clearTimeout(timer); timer = null; }

    if (btn) {
      btn.addEventListener("click", function () {
        userPaused = !userPaused;
        btn.setAttribute("aria-pressed", String(userPaused));
        btn.textContent = userPaused ? "Play animation" : "Pause animation";
        svg.style.setProperty("--play", userPaused ? "paused" : "running");
        svg.classList.toggle("is-paused", userPaused);
        if (userPaused) stop(); else schedule();
      });
    }

    if (hasIO) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) schedule(); else stop();
      }, { threshold: 0.15 }).observe(root);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else schedule();
    });

    render();
    schedule();
  }

  /* ---------- Schedule demo ---------- */
  document.querySelectorAll("[data-schedule]").forEach(function (el) {
    var readout = el.querySelector("[data-schedule-readout]");
    el.addEventListener("change", function (e) {
      if (!e.target.matches('input[type="radio"]')) return;
      var hours = e.target.value;
      el.setAttribute("data-hours", hours);
      if (readout) readout.textContent = "Previewing a " + hours + "-hour daily calling schedule.";
    });
  });

  /* ---------- Workflow scroll highlight ---------- */
  document.querySelectorAll("[data-workflow]").forEach(function (wf) {
    var steps = wf.querySelectorAll("[data-workflow-step]");
    var rail = wf.querySelectorAll("[data-workflow-rail] li");
    function activate(index) {
      steps.forEach(function (s, i) { s.classList.toggle("is-active", i === index); });
      rail.forEach(function (r, i) {
        r.classList.toggle("is-active", i === index);
        r.classList.toggle("is-done", i < index);
      });
    }
    activate(0);
    if (!hasIO) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) activate(Array.prototype.indexOf.call(steps, entry.target));
      });
    }, { rootMargin: "-42% 0px -48% 0px", threshold: 0 });
    steps.forEach(function (s) { io.observe(s); });
  });

  /* ---------- Tabs (contact page) ---------- */
  var tablist = document.querySelector("[data-tabs]");
  if (tablist) initTabs(tablist);

  function initTabs(list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });

    function select(index, opts) {
      tabs.forEach(function (t, i) {
        var on = i === index;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
      if (opts && opts.focus) tabs[index].focus();
      if (opts && opts.scroll) list.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        select(i);
        if (history.replaceState) history.replaceState(null, "", "#" + panels[i].id);
      });
      tab.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % tabs.length;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") n = 0;
        if (e.key === "End") n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(n, { focus: true }); }
      });
    });

    function fromHash(scroll) {
      var id = (location.hash || "").slice(1);
      var idx = panels.findIndex(function (p) { return p.id === id; });
      if (idx > -1) select(idx, { scroll: scroll });
      return idx;
    }
    if (fromHash(true) === -1) select(0);
    window.addEventListener("hashchange", function () { fromHash(true); });
  }

  /* ---------- Forms ---------- */
  var endpoints = (window.PLP_CONFIG && window.PLP_CONFIG.formEndpoints) || {};

  document.querySelectorAll("form[data-form]").forEach(function (form) {
    var key = form.getAttribute("data-form");
    var endpoint = (endpoints[key] || "").trim();
    var status = form.querySelector("[data-form-status]");
    var submit = form.querySelector('[type="submit"]');

    if (!endpoint) {
      var setup = document.createElement("div");
      setup.className = "notice notice-gold";
      setup.setAttribute("data-setup-notice", "");
      setup.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>' +
        "<p><strong>Setup required:</strong> online delivery for this form has not been connected yet, so it cannot send submissions. Site owner: add the form endpoint in <code>assets/js/config.js</code> (see README).</p>";
      form.insertBefore(setup, form.firstChild);
    }

    function fieldError(input, message) {
      var wrap = input.closest(".field");
      var err = wrap && wrap.querySelector(".field-error");
      var targets = input.type === "radio" || input.type === "checkbox"
        ? form.querySelectorAll('[name="' + input.name + '"]') : [input];
      Array.prototype.forEach.call(targets, function (t) {
        if (message) t.setAttribute("aria-invalid", "true"); else t.removeAttribute("aria-invalid");
      });
      if (err) err.textContent = message || "";
    }

    function validate() {
      var firstInvalid = null;
      var seen = {};
      form.querySelectorAll("input, select, textarea").forEach(function (input) {
        if (input.closest(".hp-field") || input.type === "hidden" || input.type === "submit") return;
        if (input.type === "radio") {
          if (seen[input.name]) return;
          seen[input.name] = true;
        }
        var msg = "";
        if (input.required) {
          var empty = input.type === "radio"
            ? !form.querySelector('[name="' + input.name + '"]:checked')
            : !String(input.value).trim();
          if (empty) msg = input.getAttribute("data-required-msg") || "This field is required.";
        }
        if (!msg && input.type === "email" && input.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) {
          msg = "Enter a valid email address, like name@example.com.";
        }
        fieldError(input, msg);
        if (msg && !firstInvalid) firstInvalid = input;
      });
      return firstInvalid;
    }

    form.addEventListener("input", function (e) {
      if (e.target.getAttribute("aria-invalid") === "true") fieldError(e.target, "");
    });
    form.addEventListener("change", function (e) {
      if (e.target.getAttribute("aria-invalid") === "true") fieldError(e.target, "");
    });

    function showStatus(type, html) {
      status.innerHTML = '<div class="notice notice-' + type + '" tabindex="-1">' + html + "</div>";
      var box = status.firstChild;
      box.focus({ preventScroll: true });
      box.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.innerHTML = "";

      var invalid = validate();
      if (invalid) {
        showStatus("error", "<p>Please check the highlighted fields and try again.</p>");
        invalid.focus();
        return;
      }

      // Spam trap: real visitors never see or fill this field.
      var hp = form.querySelector(".hp-field input");
      if (hp && hp.value) return;

      if (!endpoint) {
        showStatus("error", "<p><strong>Not sent.</strong> This form is not connected to a delivery service yet, so your information was not submitted. Please try again later.</p>");
        return;
      }

      submit.setAttribute("aria-busy", "true");
      submit.disabled = true;
      var original = submit.textContent;
      submit.textContent = "Sending…";

      var data = new FormData(form);
      data.append("_form", key);

      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          form.reset();
          showStatus("success", "<p><strong>Thank you — your inquiry was sent.</strong> We will review it and respond using the contact details you provided.</p>");
        })
        .catch(function () {
          showStatus("error", "<p><strong>Not sent.</strong> Something went wrong while submitting the form. Your details are still in the form — please try again in a moment.</p>");
        })
        .then(function () {
          submit.removeAttribute("aria-busy");
          submit.disabled = false;
          submit.textContent = original;
        });
    });
  });
})();

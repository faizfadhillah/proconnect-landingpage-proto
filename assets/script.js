// ProConnect — shared client script

(function () {
  'use strict';

  // ===== Mobile navigation drawer =====
  function initMobileNav() {
    const toggleBtn = document.getElementById('navToggle');
    const drawer = document.getElementById('mobileDrawer');
    const backdrop = document.getElementById('mobileBackdrop');
    const closeBtn = document.getElementById('navClose');
    if (!toggleBtn || !drawer || !backdrop) return;

    const open = () => {
      drawer.classList.add('open');
      backdrop.classList.add('open');
      document.body.classList.add('no-scroll');
      toggleBtn.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
      drawer.classList.remove('open');
      backdrop.classList.remove('open');
      document.body.classList.remove('no-scroll');
      toggleBtn.setAttribute('aria-expanded', 'false');
    };

    toggleBtn.addEventListener('click', open);
    backdrop.addEventListener('click', close);
    if (closeBtn) closeBtn.addEventListener('click', close);
    // Close when a nav link is clicked (for same-page anchors)
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    // ESC closes
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  // ===== Mobile submenu (Features accordion) =====
  function initMobileSubmenu() {
    document.querySelectorAll('.mobile-sub-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const target = btn.nextElementSibling;
        if (!target || !target.classList.contains('mobile-sub')) return;
        btn.classList.toggle('open');
        target.classList.toggle('open');
      });
    });
  }

  // ===== Highlight active nav link based on current page =====
  function initActiveNav() {
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const page = path === '' ? 'index.html' : path;
    document.querySelectorAll('[data-nav-link]').forEach(link => {
      const target = link.getAttribute('data-nav-link');
      if (target === page) link.classList.add('active');
    });
  }

  // ===== Pricing calculator (only on pricing page) =====
  function initPricingCalc() {
    const slider = document.getElementById('employeeSlider');
    const employeeCount = document.getElementById('employeeCount');
    const totalPrice = document.getElementById('totalPrice');
    const pricePerEmp = document.getElementById('pricePerEmp');
    const annualToggle = document.getElementById('annualToggle');
    if (!slider || !totalPrice) return;

    const BASE_PRICE = 350000; // Rp per employee / month
    const ANNUAL_DISCOUNT = 0.18; // 18% off annually

    function format(n) {
      return 'Rp ' + n.toLocaleString('id-ID');
    }
    function update() {
      const count = parseInt(slider.value, 10);
      const isAnnual = annualToggle && annualToggle.checked;
      const unit = isAnnual ? Math.round(BASE_PRICE * (1 - ANNUAL_DISCOUNT)) : BASE_PRICE;
      const total = unit * count;
      employeeCount.textContent = count + (count === 1 ? ' employee' : ' employees');
      totalPrice.textContent = format(total);
      if (pricePerEmp) pricePerEmp.textContent = format(unit) + ' / employee / month';
    }
    slider.addEventListener('input', update);
    if (annualToggle) annualToggle.addEventListener('change', update);
    update();
  }

  // ===== Contact / Demo form =====
  function initDemoForm() {
    const form = document.getElementById('demoForm');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.textContent = 'Sent! We\u2019ll be in touch \u2713'; btn.disabled = true; btn.classList.add('opacity-60'); }
    });
  }

  // ===== Init on DOM ready =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initMobileNav();
      initMobileSubmenu();
      initActiveNav();
      initPricingCalc();
      initDemoForm();
    });
  } else {
    initMobileNav();
    initMobileSubmenu();
    initActiveNav();
    initPricingCalc();
    initDemoForm();
  }
})();

// Extract ASIN from current page
function getASIN() {
  const url = window.location.href;
  const match = url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/\/product\/([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : null;
}

// Extract price from page
function getPrice() {
  const selectors = ['.a-price .a-offscreen', '#priceblock_ourprice', '#priceblock_dealprice', '.a-price-whole'];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const price = parseFloat(el.textContent.replace(/[^0-9.]/g, ''));
      if (price > 0) return price;
    }
  }
  return 0;
}

// Extract BSR
function getBSR() {
  const text = document.body.innerText;
  const match = text.match(/Best Sellers Rank.*?#([\d,]+)/i);
  return match ? parseInt(match[1].replace(/,/g, '')) : 0;
}

// Extract title
function getTitle() {
  const el = document.getElementById('productTitle');
  return el ? el.textContent.trim() : '';
}

const asin = getASIN();
if (asin) {
  // Create floating button
  const btn = document.createElement('button');
  btn.className = 'ast-btn';
  btn.innerHTML = '🛒';
  btn.title = 'Amazon Seller Toolkit';
  document.body.appendChild(btn);

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'ast-overlay';
  overlay.innerHTML = `
    <div class="ast-header">
      <h3>🛒 Seller Toolkit</h3>
      <button class="ast-close">&times;</button>
    </div>
    <div class="ast-body" id="ast-body">
      <div style="text-align:center;padding:20px;color:#6b7280;">Loading...</div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Toggle
  btn.addEventListener('click', () => {
    overlay.classList.toggle('show');
    if (overlay.classList.contains('show')) loadData();
  });

  overlay.querySelector('.ast-close').addEventListener('click', () => {
    overlay.classList.remove('show');
  });

  function loadData() {
    const price = getPrice();
    const bsr = getBSR();
    const title = getTitle();

    // Quick BSR estimate
    let monthlySales = 0;
    if (bsr > 0) {
      monthlySales = Math.round(250000 / Math.pow(bsr, 0.80));
    }

    const body = document.getElementById('ast-body');
    body.innerHTML = `
      <div style="font-size:12px;font-weight:700;color:#FF9900;margin-bottom:8px;">${asin}</div>
      ${title ? `<div style="font-size:11px;color:#6b7280;margin-bottom:10px;">${title.substring(0, 80)}...</div>` : ''}

      <div class="ast-stat"><span class="ast-stat-label">ASIN</span><span class="ast-stat-value" style="color:#FF9900;">${asin}</span></div>
      ${price > 0 ? `<div class="ast-stat"><span class="ast-stat-label">Price</span><span class="ast-stat-value" style="color:#22c55e;">$${price}</span></div>` : ''}
      ${bsr > 0 ? `<div class="ast-stat"><span class="ast-stat-label">BSR</span><span class="ast-stat-value">#${bsr.toLocaleString()}</span></div>` : ''}
      ${monthlySales > 0 ? `<div class="ast-stat"><span class="ast-stat-label">Est. Monthly Sales</span><span class="ast-stat-value" style="color:#22c55e;">${monthlySales.toLocaleString()}</span></div>` : ''}
      ${monthlySales > 0 && price > 0 ? `<div class="ast-stat"><span class="ast-stat-label">Est. Revenue/mo</span><span class="ast-stat-value" style="color:#FF9900;">$${(monthlySales * price).toLocaleString()}</span></div>` : ''}

      <div style="margin-top:12px;">
        <a href="https://palians.com/amazon-seller-toolkit/listing-score" target="_blank"
          style="display:block;text-align:center;padding:8px;background:#FF9900;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:12px;margin-bottom:6px;">
          Full Analysis →
        </a>
        <a href="https://palians.com/amazon-seller-toolkit/competitor" target="_blank"
          style="display:block;text-align:center;padding:8px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:12px;">
          Track Competitor →
        </a>
      </div>
    `;
  }
}

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.content').forEach(c => c.style.display = 'none');
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).style.display = 'block';
  });
});

// Load settings
chrome.storage.local.get(['apiUrl', 'authToken'], (data) => {
  if (data.apiUrl) document.getElementById('apiUrl').value = data.apiUrl;
  if (data.authToken) document.getElementById('authToken').value = data.authToken;
  document.getElementById('statusBadge').textContent = data.authToken ? '● Connected' : '● Not Connected';
  document.getElementById('statusBadge').style.background = data.authToken ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)';
});

// Save settings
document.getElementById('saveSettings').addEventListener('click', () => {
  const apiUrl = document.getElementById('apiUrl').value;
  const authToken = document.getElementById('authToken').value;
  chrome.storage.local.set({ apiUrl, authToken }, () => {
    document.getElementById('settingsMsg').innerHTML = '<div class="alert alert-success">Settings saved</div>';
    document.getElementById('statusBadge').textContent = authToken ? '● Connected' : '● Not Connected';
    document.getElementById('statusBadge').style.background = authToken ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)';
    setTimeout(() => { document.getElementById('settingsMsg').innerHTML = ''; }, 2000);
  });
});

// API helper
async function apiCall(endpoint, method = 'GET', body = null) {
  const data = await new Promise(r => chrome.storage.local.get(['apiUrl', 'authToken'], r));
  const baseUrl = data.apiUrl || 'https://palians.com/amazon-seller-toolkit/api';
  const headers = { 'Content-Type': 'application/json' };
  if (data.authToken) headers['Authorization'] = `Bearer ${data.authToken}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${baseUrl}${endpoint}`, options);
  return res.json();
}

// Extract ASIN from URL or text
function extractASIN(input) {
  const match = input.match(/(?:dp|product)\/([A-Z0-9]{10})/i) || input.match(/^([A-Z0-9]{10})$/i);
  return match ? match[1].toUpperCase() : null;
}

// ASIN Lookup
document.getElementById('lookupBtn').addEventListener('click', async () => {
  const input = document.getElementById('asinInput').value.trim();
  const asin = extractASIN(input);
  if (!asin) {
    document.getElementById('lookupResult').innerHTML = '<div class="alert alert-error">Invalid ASIN or URL</div>';
    return;
  }

  const btn = document.getElementById('lookupBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loader"></span>';
  document.getElementById('lookupResult').innerHTML = '';

  try {
    const res = await apiCall(`/listing-score/analyze`, 'POST', { asin, countryCode: 'US' });
    if (res.success) {
      const d = res;
      document.getElementById('lookupResult').innerHTML = `
        <div class="card">
          <div class="card-title">📦 ${d.productTitle || asin}</div>
          <div class="grid-3">
            <div class="big-number"><div class="value orange">${d.overallScore || 0}</div><div class="label">Score</div></div>
            <div class="big-number"><div class="value ${d.overallScore >= 70 ? 'green' : 'red'}">${d.grade || 'N/A'}</div><div class="label">Grade</div></div>
            <div class="big-number"><div class="value">${d.totalIssues || 0}</div><div class="label">Issues</div></div>
          </div>
          ${d.categories ? d.categories.map(c => `
            <div class="stat-row">
              <span class="stat-label">${c.name}</span>
              <span class="stat-value ${c.score >= 70 ? 'green' : c.score >= 50 ? 'orange' : 'red'}">${c.score}/${c.maxScore}</span>
            </div>
          `).join('') : ''}
        </div>
      `;
    } else {
      document.getElementById('lookupResult').innerHTML = `<div class="alert alert-error">${res.message || 'Lookup failed'}</div>`;
    }
  } catch (err) {
    document.getElementById('lookupResult').innerHTML = `<div class="alert alert-error">API error: ${err.message}</div>`;
  }
  btn.disabled = false;
  btn.textContent = 'Search';
});

// Profit Calculator (offline)
document.getElementById('calcProfitBtn').addEventListener('click', () => {
  const sell = parseFloat(document.getElementById('sellPrice').value) || 0;
  const cost = parseFloat(document.getElementById('costPrice').value) || 0;
  const fbaPercent = parseFloat(document.getElementById('fbaFee').value) || 15;
  const shipping = parseFloat(document.getElementById('shipping').value) || 0;

  const fba = sell * (fbaPercent / 100);
  const totalCost = cost + fba + shipping;
  const profit = sell - totalCost;
  const margin = sell > 0 ? ((profit / sell) * 100).toFixed(1) : 0;
  const roi = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(1) : 0;

  document.getElementById('profitResult').innerHTML = `
    <div class="card">
      <div class="grid-3">
        <div class="big-number"><div class="value ${profit >= 0 ? 'green' : 'red'}">$${profit.toFixed(2)}</div><div class="label">Net Profit</div></div>
        <div class="big-number"><div class="value ${margin >= 20 ? 'green' : 'orange'}">${margin}%</div><div class="label">Margin</div></div>
        <div class="big-number"><div class="value">${roi}%</div><div class="label">ROI</div></div>
      </div>
      <div class="stat-row"><span class="stat-label">Sell Price</span><span class="stat-value">$${sell.toFixed(2)}</span></div>
      <div class="stat-row"><span class="stat-label">Cost Price</span><span class="stat-value red">$${cost.toFixed(2)}</span></div>
      <div class="stat-row"><span class="stat-label">FBA Fee (${fbaPercent}%)</span><span class="stat-value red">$${fba.toFixed(2)}</span></div>
      <div class="stat-row"><span class="stat-label">Shipping</span><span class="stat-value red">$${shipping.toFixed(2)}</span></div>
      <div class="stat-row" style="border-top:2px solid #e5e7eb;font-weight:700;"><span>Total Cost</span><span class="stat-value red">$${totalCost.toFixed(2)}</span></div>
    </div>
  `;
});

// BSR Estimator (offline formula)
document.getElementById('bsrBtn').addEventListener('click', () => {
  const bsr = parseInt(document.getElementById('bsrInput').value) || 0;
  const category = document.getElementById('bsrCategory').value;
  const price = parseFloat(document.getElementById('bsrPrice').value) || 0;

  if (bsr <= 0) {
    document.getElementById('bsrResult').innerHTML = '<div class="alert alert-error">Enter valid BSR</div>';
    return;
  }

  const curves = {
    'All Departments': { base: 250000, exp: 0.80 },
    'Electronics': { base: 120000, exp: 0.78 },
    'Home & Kitchen': { base: 170000, exp: 0.80 },
    'Clothing': { base: 180000, exp: 0.79 },
    'Health & Household': { base: 150000, exp: 0.79 },
    'Sports & Outdoors': { base: 130000, exp: 0.78 },
    'Beauty & Personal Care': { base: 140000, exp: 0.78 },
    'Toys & Games': { base: 160000, exp: 0.80 },
    'Books': { base: 200000, exp: 0.82 },
  };

  const curve = curves[category] || curves['All Departments'];
  const monthly = Math.round(curve.base / Math.pow(bsr, curve.exp));
  const daily = (monthly / 30).toFixed(1);
  const revenue = price > 0 ? (monthly * price).toLocaleString() : 'N/A';

  let velocity = 'Low'; let vColor = 'red';
  if (monthly >= 1000) { velocity = 'Very High'; vColor = 'green'; }
  else if (monthly >= 500) { velocity = 'High'; vColor = 'green'; }
  else if (monthly >= 100) { velocity = 'Medium'; vColor = 'orange'; }

  document.getElementById('bsrResult').innerHTML = `
    <div class="card">
      <div class="grid-3">
        <div class="big-number"><div class="value">${daily}</div><div class="label">Daily Sales</div></div>
        <div class="big-number"><div class="value green">${monthly.toLocaleString()}</div><div class="label">Monthly</div></div>
        <div class="big-number"><div class="value orange">$${revenue}</div><div class="label">Revenue/mo</div></div>
      </div>
      <div class="stat-row"><span class="stat-label">BSR Rank</span><span class="stat-value">#${bsr.toLocaleString()}</span></div>
      <div class="stat-row"><span class="stat-label">Category</span><span class="stat-value">${category}</span></div>
      <div class="stat-row"><span class="stat-label">Sales Velocity</span><span class="stat-value ${vColor}">${velocity}</span></div>
      <div class="stat-row"><span class="stat-label">Est. Range</span><span class="stat-value">${Math.round(monthly * 0.85)}-${Math.round(monthly * 1.15)}/mo</span></div>
    </div>
  `;
});

// Auto-detect ASIN from current tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0] && tabs[0].url) {
    const asin = extractASIN(tabs[0].url);
    if (asin) {
      document.getElementById('asinInput').value = asin;
      document.getElementById('autoDetect').style.display = 'block';
      document.getElementById('autoDetectContent').innerHTML = `
        <div style="font-size:13px;">ASIN: <strong style="color:#FF9900;">${asin}</strong></div>
        <button class="btn btn-primary" style="margin-top:8px;" onclick="document.getElementById('lookupBtn').click()">Analyze This Product</button>
      `;
    }
  }
});

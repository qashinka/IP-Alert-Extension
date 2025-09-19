document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    ip: document.getElementById('ip'),
    company: document.getElementById('company'),
    country: document.getElementById('country'),
    is_vpn: document.getElementById('is_vpn'),
    is_proxy: document.getElementById('is_proxy'),
    is_tor: document.getElementById('is_tor'),
    refreshButton: document.getElementById('refresh-button'),
    loader: document.getElementById('loader'),
  };

  function setBooleanValue(element, value) {
    if (element) {
      const text = typeof value === 'boolean' ? (value ? 'True' : 'False') : 'N/A';
      element.textContent = text;
      element.classList.remove('true-value', 'false-value');
      if (typeof value === 'boolean') {
        element.classList.add(value ? 'true-value' : 'false-value');
      }
    }
  }

  function updatePopup(data) {
    elements.refreshButton.style.display = 'block';
    elements.loader.style.display = 'none';

    if (data && data.ip) {
      elements.ip.textContent = data.ip;
      elements.company.textContent = data.company?.name ?? 'N/A';
      elements.country.textContent = data.location?.country ?? 'N/A';
      setBooleanValue(elements.is_vpn, data.is_vpn);
      setBooleanValue(elements.is_proxy, data.is_proxy);
      setBooleanValue(elements.is_tor, data.is_tor);
    }
  }

  function initializeDisplay() {
    elements.ip.textContent = '読み込み中...';
    elements.company.textContent = '...';
    elements.country.textContent = '...';
    elements.is_vpn.textContent = '...';
    elements.is_proxy.textContent = '...';
    elements.is_tor.textContent = '...';
    elements.is_vpn.classList.remove('true-value', 'false-value');
    elements.is_proxy.classList.remove('true-value', 'false-value');
    elements.is_tor.classList.remove('true-value', 'false-value');
  }

  function triggerRefresh() {
    initializeDisplay();
    elements.refreshButton.style.display = 'none';
    elements.loader.style.display = 'block';

    chrome.runtime.sendMessage({ command: "refresh" }, (response) => {
      if (response && response.status === 'error') {
        console.error("Refresh failed:", response.error);
        elements.ip.textContent = '更新エラー';
        elements.refreshButton.style.display = 'block';
        elements.loader.style.display = 'none';
      }
    });
  }

  elements.refreshButton.addEventListener('click', triggerRefresh);

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.ipData) {
      updatePopup(changes.ipData.newValue);
    }
  });

  triggerRefresh();
});

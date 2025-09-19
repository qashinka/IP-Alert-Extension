const API_URL = 'https://api.ipapi.is/';
const SAFE_COLOR = '#2ecc71';
const DANGER_COLOR = '#e74c3c';
const UNKNOWN_COLOR = '#95a5a6';

async function fetchAndUpdate() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    chrome.storage.local.set({ ipData: data });
    updateIcon(data.is_vpn, data.is_proxy, data.is_tor);
  } catch (error) {
    console.error('API request failed:', error);
    chrome.storage.local.remove('ipData');
    updateIcon();
    throw error;
  }
}

function updateIcon(is_vpn, is_proxy, is_tor) {
  const canvas = new OffscreenCanvas(48, 48);
  const ctx = canvas.getContext('2d');

  const vpnColor = typeof is_vpn === 'boolean' ? (is_vpn ? DANGER_COLOR : SAFE_COLOR) : UNKNOWN_COLOR;
  const proxyColor = typeof is_proxy === 'boolean' ? (is_proxy ? DANGER_COLOR : SAFE_COLOR) : UNKNOWN_COLOR;
  const torColor = typeof is_tor === 'boolean' ? (is_tor ? DANGER_COLOR : SAFE_COLOR) : UNKNOWN_COLOR;
  
  ctx.fillStyle = vpnColor;
  ctx.fillRect(0, 0, 16, 48);

  ctx.fillStyle = proxyColor;
  ctx.fillRect(16, 0, 16, 48);

  ctx.fillStyle = torColor;
  ctx.fillRect(32, 0, 16, 48);

  const imageData = ctx.getImageData(0, 0, 48, 48);
  chrome.action.setIcon({ imageData: imageData });
}

chrome.runtime.onInstalled.addListener(() => {
  fetchAndUpdate();
  chrome.alarms.create('update-ip-info', {
    delayInMinutes: 3/2,
    periodInMinutes: 3/2,
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'update-ip-info') {
    fetchAndUpdate();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "refresh") {
    (async () => {
      try {
        await fetchAndUpdate();
        sendResponse({ status: "success" });
      } catch (e) {
        sendResponse({ status: "error", error: e.message });
      }
    })();
    return true;
  }
});

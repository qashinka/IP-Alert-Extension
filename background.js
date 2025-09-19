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

  const vpnColor = typeof is_vpn === 'boolean' ? (is_vpn ? SAFE_COLOR : DANGER_COLOR) : UNKNOWN_COLOR;
  const proxyColor = typeof is_proxy === 'boolean' ? (is_proxy ? SAFE_COLOR : DANGER_COLOR) : UNKNOWN_COLOR;
  const torColor = typeof is_tor === 'boolean' ? (is_tor ? SAFE_COLOR : DANGER_COLOR) : UNKNOWN_COLOR;
  
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
  chrome.alarms.clearAll();
  fetchAndUpdate();
  chrome.alarms.create('main-cycle', {
    delayInMinutes: 0.5,
    periodInMinutes: 0.5,
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'main-cycle') {
    await fetchAndUpdate();
    chrome.storage.local.set({ burstCount: 1 });
    chrome.alarms.create('burst-update', {
      delayInMinutes: 10 / 60,
      periodInMinutes: 10 / 60,
    });
  } else if (alarm.name === 'burst-update') {
    const { burstCount = 1 } = await chrome.storage.local.get('burstCount');
    if (burstCount < 2) {
      await fetchAndUpdate();
      chrome.storage.local.set({ burstCount: burstCount + 1 });
    } else {
      await fetchAndUpdate();
      chrome.storage.local.remove('burstCount');
      chrome.alarms.clear('burst-update');
    }
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

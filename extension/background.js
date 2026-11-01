import { refresh } from './status.js';

const ALARM = 'playtrace-refresh';

// Le serveur sonde Steam chaque minute : relire plus souvent n'apporterait rien.
function start() {
  chrome.action.setBadgeBackgroundColor({ color: '#7c3aed' });
  chrome.action.setBadgeTextColor?.({ color: '#ffffff' });
  chrome.alarms.create(ALARM, { periodInMinutes: 1 });
  return refresh();
}

chrome.runtime.onInstalled.addListener(start);
chrome.runtime.onStartup.addListener(start);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) refresh();
});

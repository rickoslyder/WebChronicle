// Track max scroll depth
let maxScrollPercent = 0;
import { debounce } from '../lib/utils.js';

function updateScrollDepth() {
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  if (scrollHeight === 0) {
    maxScrollPercent = 100; // Fully scrolled if no scrollbar (or content fits)
    return;
  }
  const currentScroll = window.scrollY;
  maxScrollPercent = Math.max(maxScrollPercent, Math.round((currentScroll / scrollHeight) * 100));
}
window.addEventListener('scroll', debounce(updateScrollDepth, 200), { passive: true });

// Listen for requests from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REQUEST_SCROLL_DATA') {
    updateScrollDepth(); // Ensure scroll percentage is up-to-date
    // Respond with the current max scroll percentage
    sendResponse({ maxScrollPercent });
    // Return true to indicate async response (or potential async in future)
    return true;
  }
});

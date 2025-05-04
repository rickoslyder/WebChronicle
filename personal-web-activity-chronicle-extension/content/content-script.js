// Track max scroll depth
let maxScrollPercent = 0;
function updateScroll() {
  const scrollY = window.scrollY || window.pageYOffset;
  const totalHeight = document.body.scrollHeight - window.innerHeight;
  if (totalHeight > 0) {
    const percent = Math.round((scrollY / totalHeight) * 100);
    if (percent > maxScrollPercent) maxScrollPercent = percent;
  }
}
window.addEventListener('scroll', updateScroll);

// Listen for scrape requests from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REQUEST_SCRAPE') {
    updateScroll(); // Ensure scroll percentage is up-to-date
    const textContent = window.scrapeVisibleText();
    // Respond directly with the scraped data
    sendResponse({
      textContent,
      maxScrollPercent
    });
    // Return true to indicate async response (although sendResponse is sync here, it's good practice)
    return true;
  }
});

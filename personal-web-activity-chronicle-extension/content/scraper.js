const DEFAULT_TRUNCATION_LENGTH = 10000;

function scrapeVisibleText() {
  let text = document.body.innerText || '';

  // --- Preprocessing to remove dynamic content ---
  // Replace 'Save progress XX%' with a placeholder
  text = text.replace(/Save progress \d+%?/gi, 'Save progress [removed percentage]');
  // Replace common time patterns (e.g., HH:MM)
  text = text.replace(/\d{1,2}:\d{2}/g, '[removed time]');
  // Add more regex replacements here for other patterns as needed
  // -----------------------------------------------

  text = text.replace(/\s+/g, ' ').trim();
  if (text.length > DEFAULT_TRUNCATION_LENGTH) {
    text = text.slice(0, DEFAULT_TRUNCATION_LENGTH);
  }
  return text;
}

// Expose function for content-script
window.scrapeVisibleText = scrapeVisibleText;

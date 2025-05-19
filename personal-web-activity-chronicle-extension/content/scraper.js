import { Readability } from '@mozilla/readability';

const DEFAULT_TRUNCATION_LENGTH = 10000;
const MIN_TEXT_LENGTH = 25;

// Helper function for preprocessing and truncation
function preprocessAndTruncate(text) {
  if (!text) return '';

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

// Function to check if the current page is a Twitter status page
function isTwitterStatusPage(url) {
  return url.includes('twitter.com') || url.includes('x.com');
}

// Function to get the page text content
function getPageTextContent(isTwitterStatusPage) {
  let extractedText = '';

  if (isTwitterStatusPage) {
    // Attempt Readability on specific tweet pages
    console.log('[Scraper] Attempting Readability for Twitter status:', document.location.href);
    const documentClone = document.cloneNode(true);
    const reader = new Readability(documentClone);
    const article = reader.parse();
    if (article && article.textContent) {
      extractedText = article.textContent;
      console.log('[Scraper] Readability successful for Twitter status.');
    } else {
      console.log('[Scraper] Readability failed for Twitter status, falling back to innerText.');
      extractedText = document.body.innerText || '';
    }
  } else {
    // Default: Attempt Readability for other pages (likely articles)
    console.log('[Scraper] Attempting Readability for generic page:', document.location.href);
    const documentClone = document.cloneNode(true);
    const reader = new Readability(documentClone);
    const article = reader.parse();

    if (article && article.textContent) {
      extractedText = article.textContent;
      console.log('[Scraper] Readability successful for generic page.');
    } else {
      console.log('[Scraper] Readability failed for generic page, falling back to innerText.');
      extractedText = document.body.innerText || '';
    }
  }
  return preprocessAndTruncate(extractedText);
}

// IIFE to execute script and return a promise
(async () => { // This IIFE's returned promise is what executeScript awaits
  const sendMessagePromise = (messagePayload) => {
    return new Promise((resolveMessagePromise) => {
      chrome.runtime.sendMessage(messagePayload, () => {
        if (chrome.runtime.lastError) {
          // Log the error but still resolve, so the main script flow continues.
          // The success/failure of sendMessage itself doesn't mean the scraper script failed overall.
          console.warn(`[Scraper] sendMessage failed for ${messagePayload.type}: ${chrome.runtime.lastError.message}`);
          resolveMessagePromise(false); // Indicate sendMessage had an issue
        } else {
          resolveMessagePromise(true); // Indicate sendMessage was okay
        }
      });
    });
  };

  try {
    const currentUrl = document.location.href;
    let finalText;

    if (isTwitterStatusPage(currentUrl)) {
      console.log('[Scraper] Twitter/X status page detected, delaying scrape:', currentUrl);
      // Promisify setTimeout for await
      await new Promise(resolveDelay => setTimeout(resolveDelay, 1000));

      finalText = getPageTextContent(true); // Pass true for special handling
      console.log(`[Scraper] Final text length (Twitter delayed): ${finalText?.length ?? 0}`);
      await sendMessagePromise({ type: 'SCRAPER_RESULT', textContent: finalText || '', source: 'scraper.js-twitter' });
      return true; // Resolve the main IIFE promise with true
    } else {
      finalText = getPageTextContent(false);
      console.log(`[Scraper] Final text length (generic): ${finalText?.length ?? 0}`);
      await sendMessagePromise({ type: 'SCRAPER_RESULT', textContent: finalText || '', source: 'scraper.js-generic' });
      return true; // Resolve the main IIFE promise with true
    }
  } catch (error) {
    console.error('[Scraper] Error in main scraper logic:', error.toString());
    // Attempt to send error info, but this might also fail if the error is fundamental
    await sendMessagePromise({ type: 'SCRAPER_ERROR', error: error.message, source: 'scraper.js-catch' });
    return false; // Resolve the main IIFE promise with false to indicate script failure
  }
})();

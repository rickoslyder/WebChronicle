import puppeteer from '@cloudflare/puppeteer';
import { Env } from './types';

export async function browserScreenshotHandler(request: Request, env: Env): Promise<Response> {
  console.log('[Browser Screenshot Handler] Received request');
  
  try {
    const { url } = await request.json();
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Launch browser
    const browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to URL
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Take screenshot
    const screenshot = await page.screenshot({ 
      type: 'jpeg',
      quality: 85,
      fullPage: false 
    });
    
    await browser.close();
    
    // Generate unique key for R2
    const screenshotKey = `screenshots/${Date.now()}-${crypto.randomUUID()}.jpg`;
    
    // Store in R2
    await env.ACTIVITY_SUMMARIES_BUCKET.put(screenshotKey, screenshot, {
      httpMetadata: {
        contentType: 'image/jpeg'
      },
      customMetadata: {
        url,
        capturedAt: new Date().toISOString()
      }
    });
    
    return new Response(JSON.stringify({ 
      success: true,
      screenshotKey,
      url 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[Browser Screenshot Handler] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to capture screenshot',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function browserExtractHandler(request: Request, env: Env): Promise<Response> {
  console.log('[Browser Extract Handler] Received request');
  
  try {
    const { url, selectors = {} } = await request.json();
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Launch browser
    const browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();
    
    // Navigate to URL
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Extract content
    const extractedData = await page.evaluate((selectors) => {
      const data: any = {};
      
      // Get page metadata
      data.title = document.title;
      data.description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      
      // Get main content
      const article = document.querySelector('article') || document.querySelector('main') || document.body;
      data.textContent = article?.innerText || '';
      
      // Extract custom selectors
      for (const [key, selector] of Object.entries(selectors)) {
        const elements = document.querySelectorAll(selector as string);
        if (elements.length === 1) {
          data[key] = elements[0].textContent?.trim();
        } else if (elements.length > 1) {
          data[key] = Array.from(elements).map(el => el.textContent?.trim());
        }
      }
      
      // Get structured data
      const ldJsonScripts = document.querySelectorAll('script[type="application/ld+json"]');
      data.structuredData = Array.from(ldJsonScripts).map(script => {
        try {
          return JSON.parse(script.textContent || '');
        } catch {
          return null;
        }
      }).filter(Boolean);
      
      return data;
    }, selectors);
    
    // Get full HTML
    const html = await page.content();
    
    await browser.close();
    
    return new Response(JSON.stringify({ 
      success: true,
      url,
      extractedData,
      htmlLength: html.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[Browser Extract Handler] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to extract content',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function browserPdfHandler(request: Request, env: Env): Promise<Response> {
  console.log('[Browser PDF Handler] Received request');
  
  try {
    const { url } = await request.json();
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Launch browser
    const browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();
    
    // Navigate to URL
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    await browser.close();
    
    // Generate unique key for R2
    const pdfKey = `pdfs/${Date.now()}-${crypto.randomUUID()}.pdf`;
    
    // Store in R2
    await env.ACTIVITY_SUMMARIES_BUCKET.put(pdfKey, pdf, {
      httpMetadata: {
        contentType: 'application/pdf'
      },
      customMetadata: {
        url,
        generatedAt: new Date().toISOString()
      }
    });
    
    return new Response(JSON.stringify({ 
      success: true,
      pdfKey,
      url 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[Browser PDF Handler] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate PDF',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
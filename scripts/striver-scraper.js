const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🚀 Launching Striver A2Z DSA Sheet Scraper...');
  
  const browser = await puppeteer.launch({ 
    headless: false,  // Visible browser so you can see it working
    defaultViewport: { width: 1400, height: 900 },
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Set a realistic user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log('📄 Navigating to Striver\'s A2Z DSA Sheet...');
  
  await page.goto('https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2', {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  console.log('👀 Page loaded. Waiting for content to render...');
  
  // Wait for the main content to be visible
  await page.waitForSelector('body', { timeout: 30000 });
  
  // Wait a bit for dynamic content
  await new Promise(r => setTimeout(r, 5000));

  console.log('🔓 Expanding all accordions...');

  // Try to expand all accordions/collapsibles
  await page.evaluate(async () => {
    // Method 1: Click all details/summary elements
    const detailsElements = document.querySelectorAll('details');
    for (const detail of detailsElements) {
      detail.open = true;
      await new Promise(r => setTimeout(r, 100));
    }
    
    // Method 2: Click all summary elements
    const summaryElements = document.querySelectorAll('summary');
    for (const summary of summaryElements) {
      summary.click();
      await new Promise(r => setTimeout(r, 100));
    }
    
    // Method 3: Click accordion buttons (various class patterns)
    const accordionButtons = document.querySelectorAll('[class*="accordion"], [class*="collapse"], [class*="expand"], [role="button"]');
    for (const btn of accordionButtons) {
      try {
        btn.click();
        await new Promise(r => setTimeout(r, 50));
      } catch (e) {}
    }
  });

  // Wait for expanded content to load
  await new Promise(r => setTimeout(r, 3000));

  console.log('⛏️ Scraping problem links...');

  // Extract all problem data
  const data = await page.evaluate(() => {
    const problems = [];
    const processedUrls = new Set();
    
    // Get all links on the page
    const links = document.querySelectorAll('a');
    
    links.forEach(link => {
      const href = link.href;
      const text = link.innerText.trim();
      
      // Check if this is a LeetCode or CodingNinjas problem link
      const isLeetCode = href.includes('leetcode.com/problems');
      const isCodingNinjas = href.includes('codingninjas.com') || href.includes('naukri.com/code360');
      const isGFG = href.includes('geeksforgeeks.org/problems');
      
      if ((isLeetCode || isCodingNinjas || isGFG) && !processedUrls.has(href)) {
        processedUrls.add(href);
        
        // Determine platform
        let platform = 'Unknown';
        if (isLeetCode) platform = 'LeetCode';
        else if (isCodingNinjas) platform = 'CodingNinjas';
        else if (isGFG) platform = 'GeeksForGeeks';
        
        // Extract problem slug from URL
        let slug = '';
        if (isLeetCode) {
          const match = href.match(/leetcode\.com\/problems\/([^\/\?]+)/);
          if (match) slug = match[1];
        } else if (isGFG) {
          const match = href.match(/geeksforgeeks\.org\/problems\/([^\/\?]+)/);
          if (match) slug = match[1];
        }
        
        // Try to find the parent topic/step
        let topic = 'General';
        let step = '';
        let parent = link.parentElement;
        
        // Traverse up the DOM to find topic context
        for (let i = 0; i < 20 && parent; i++) {
          // Look for step indicators
          const stepMatch = parent.innerText.match(/Step\s*(\d+)/i);
          if (stepMatch && !step) {
            step = `Step ${stepMatch[1]}`;
          }
          
          // Look for headers
          const headers = parent.querySelectorAll('h1, h2, h3, h4, h5, summary');
          for (const header of headers) {
            const headerText = header.innerText.trim();
            if (headerText && headerText.length < 100 && headerText !== text) {
              if (!topic || topic === 'General') {
                topic = headerText.split('\n')[0].trim();
              }
            }
          }
          
          parent = parent.parentElement;
        }
        
        // Clean up title
        let title = text.replace(/\n/g, ' ').trim();
        if (!title || title.length < 2) {
          // Try to get title from URL slug
          title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
        
        problems.push({
          title: title,
          slug: slug,
          url: href,
          platform: platform,
          topic: topic.replace(/\n/g, ' ').trim(),
          step: step,
        });
      }
    });
    
    return problems;
  });

  console.log(`✅ Scraped ${data.length} problems!`);

  // Sort by step if available
  data.sort((a, b) => {
    const stepA = parseInt(a.step.replace(/\D/g, '')) || 999;
    const stepB = parseInt(b.step.replace(/\D/g, '')) || 999;
    return stepA - stepB;
  });

  // Save to JSON file
  const outputPath = path.join(__dirname, '..', 'striver_a2z.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`💾 Saved ${data.length} problems to ${outputPath}`);

  // Also create a summary
  const summary = {
    totalProblems: data.length,
    byPlatform: {},
    byStep: {},
    scrapedAt: new Date().toISOString(),
  };

  data.forEach(p => {
    summary.byPlatform[p.platform] = (summary.byPlatform[p.platform] || 0) + 1;
    if (p.step) {
      summary.byStep[p.step] = (summary.byStep[p.step] || 0) + 1;
    }
  });

  console.log('\n📊 Summary:');
  console.log('  By Platform:', summary.byPlatform);
  console.log('  By Step:', summary.byStep);

  // Wait a bit before closing
  console.log('\n⏳ Keeping browser open for 5 seconds to review...');
  await new Promise(r => setTimeout(r, 5000));

  await browser.close();
  console.log('🎉 Scraping complete!');
})();

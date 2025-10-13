import { chromium } from 'playwright';

async function scrapeJobDescription(url) {
    let browser = null;
    try {
        console.log(`Scraping URL: ${url}`);
        browser = await chromium.launch({ headless: false });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        });
        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        let jobDescriptionText;

        // Check if the URL is for an Indeed job posting
        if (url.includes('indeed.com')) {
            console.log('Indeed URL detected.');
            // Use the specific selector for Indeed's job description element
            const jobDescriptionElement = page.locator('#jobDescriptionText');
            // Wait for the selector to ensure the element is loaded
            //await jobDescriptionElement.waitFor({ state: 'visible', timeout: 5000 });
            jobDescriptionText = await jobDescriptionElement.innerText();
        } else {
            console.log('Generic URL. Scraping all body text.');
            // Fallback to the generic way for any other site
            jobDescriptionText = await page.evaluate(() => document.body.innerText);
        }

        console.log('Successfully scraped page content.');
        return jobDescriptionText;
    } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

export { scrapeJobDescription };
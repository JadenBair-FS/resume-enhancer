// server/scraper.js
import { chromium } from 'playwright';

async function scrapeJobDescription(url) {
    let browser = null;
    try {
        console.log(`Scraping URL: ${url}`);
        browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        //generic way to get all the text on the page.. may need to fix this based on type of site user is scraping.
        const bodyText = await page.evaluate(() => document.body.innerText);

        console.log('Successfully scraped page content.');
        return bodyText;
    } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

export default { scrapeJobDescription };
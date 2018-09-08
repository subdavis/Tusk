const puppeteer = require('puppeteer');
const should = require('should');

const pathToExtension = require('path').join(__dirname, '../..', 'demo-chrome');

describe('chrome browser, user acceptance test', async function() {
    this.timeout(20000);
    let browser;

    before(async () => {
        browser = await puppeteer.launch({
            headless: false,
            args: [
                `--disable-extensions-except=${pathToExtension}`,
                `--load-extension=${pathToExtension}`
            ]
        });
    });

    after(async () => {
        await browser.close();
    });

    describe('options page', async function() {
        this.timeout(10000);
        let page;

        before(async () => {
            page = await browser.newPage();
            await page.goto("chrome-extension://fmhmiaejopepamlcjkncpgpdjichnecm/options.html");
        });

        after(async () => {
            await page.close();
        });

        it('should have the correct title', async () => {
            (await page.title()).should.equal("Tusk");
        });

        it('should have one nav element', async () => {
            (await page.$$("nav")).length.should.be.exactly(1);
        });

    });
});
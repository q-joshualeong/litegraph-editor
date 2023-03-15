jest.setTimeout(60000)

describe('Basic e2e tests', () => {
    beforeAll( async () => {
        await page.goto('http://localhost:8000');
        // await page.goto('https://www.google.com');
        // await jestPuppeteer.debug();
        await page.waitForSelector("#graph");
    } );

    it('Should toggle the theme when the button is clicked', async () => {
        const toggleButton = await page.$('button[onclick="toggleTheme()"]');
        await toggleButton.click();
        const classList = await page.evaluate(() => {
            const body = document.body;
            return Object.values(body.classList);
        });
        expect(classList.includes('light-theme')).toBe(true);
    });

});
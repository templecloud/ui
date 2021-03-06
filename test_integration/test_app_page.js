const assert = require('assert');
const randomstring = require('randomstring');

const AppDetails = require('./lib/app_details.js');
const AppPage = require('./lib/app_page.js');
const Config = require('./lib/config.js');
const FnDetails = require('./lib/fn_details.js');
const HomePage = require('./lib/homepage.js');

/*
 * This test uses the Mocha testing framework with Selenium to test
 * the functionality of the App Details page (/app/$appId)
 */
(async function test_app_page() {
  let config = new Config();
  let fn_url = config.get('fn_url');

  // Use a random App name so it's less likely to conflict
  // with an app that already exists on the Fn server
  let appName = randomstring.generate({
    length: 30,
    charset: 'alphabetic'
  });
  let appDetails = new AppDetails(appName);

  let fnName = 'myFn';
  let fnImage = 'fndemouser/myFn';

  try {

    describe('Test Fn UI app page', async function() {
      this.timeout(50000);

      // Before running the tests, create an app that we can test against
      let appUrl;
      before(async () => {
        let homepage = new HomePage();
        await homepage.visit(fn_url);
        await homepage.createApp(appDetails);
        await homepage.visitApp(appName);

        appUrl = await homepage.getCurrentUrl();
        await homepage.quit();
      });

      // Clean up after the tests have completed
      after(async () => {
        let homepage = new HomePage();
        await homepage.visit(fn_url);
        await homepage.deleteApp(appName);
        await homepage.quit();
      });

      let appPage;
      beforeEach(async () => {
        appPage = new AppPage();
        await appPage.visit(appUrl);
      });

      afterEach(async () => {
        await appPage.quit();
      });

      it('can load interface', async () => {
        assert.ok(await appPage.loadedCorrectly());
      });

      it('can create a function', async () => {
        let fnDetails = new FnDetails(fnName, fnImage);
        await appPage.createFn(fnDetails);
      });

      it('can edit a function', async () => {
        let newFnImage = fnImage + '2';
        let fnDetails = new FnDetails(fnName, newFnImage);
        await appPage.editFn(fnDetails);
        assert.equal(await appPage.getFnImage(fnDetails.name), newFnImage);
      });

      it('should disallow large memory allocation', async () => {
        let fnDetails = new FnDetails(fnName, null, Number.MAX_SAFE_INTEGER);
        await appPage.editFn(fnDetails);

        let errorText = await appPage.getError();
        assert.ok(errorText.includes('out of range'));
      });

      it('can delete a function', async () => {
        await appPage.deleteFn(fnName);
      });
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(new Error(err.message));
  }
})();

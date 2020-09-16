const puppeteer = require("puppeteer");

async function register(data) {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      // args: [
      //   "--disable-features=IsolateOrigins,site-per-process",
      //   "--disable-web-security",
      //   "--no-sandbox",
      //   "--disable-setuid-sandbox",
      // ],
    });
    const page = await browser.newPage();

    // Open the webpage
    await page.goto(
      `https://www.mijndomein.nl/domeinnaam-checken?domeinnaam=${data.domain}&ga=nieuw`,
      {
        timeout: 0,
      }
    );

    // Click the cookiee button
    await Promise.all([
      page.waitForNavigation({ timeout: 0 }),
      page.click("#dd_popup_container_side_acceptButton"),
    ]);
    await page.waitFor(4000);

    // Click the add to cart button
    const addToCartBtn = await page.$("a.outlined");
    addToCartBtn.click();
    await page.waitFor(2000);

    // Click the Next Button
    const nextButton = await page.$("a.wide");
    await Promise.all([
      page.waitForNavigation({ timeout: 0 }),
      nextButton.click(),
    ]);
    await page.waitFor(5000);

    // Close the model
    const modalCloseBtn = await page.$("a.md-modal__btn--close");
    if (modalCloseBtn) {
      modalCloseBtn.click();
    }
    await page.waitFor(5000);

    // Click Add to cart button
    await page.evaluateHandle(() => {
      const btns = document.querySelectorAll("button");
      return btns[8].click();
    });
    await page.waitFor(4000);

    // Click the Next Button
    const nextButtonPage2 = await page.$("a.wide");
    await Promise.all([
      page.waitForNavigation({ timeout: 0 }),
      nextButtonPage2.click(),
    ]);

    console.log("Puppeteer is running....");

    // Login
    await page.type("#_username", data.username);
    await page.type("#_password", data.password);
    await page.waitFor(2000);

    // Click the login button
    await Promise.all([
      page.waitForNavigation({ timeout: 0 }),
      page.click("button.btn-login"),
    ]);

    // Select the Credit card method
    await page.click("#payment_method_type_payment_method_CC");

    // Fill in the credit card form
    await page.type("#adyen-encrypted-form-holder-name", data.name);
    await page.type("#adyen-encrypted-form-number", data.creditcard);
    await page.type("#adyen-encrypted-form-expiry-month", data.cardMonth);
    await page.type("#adyen-encrypted-form-expiry-year", data.cardYear);
    await page.type("#adyen-encrypted-form-cvc", data.cardCVC);

    // Agree to Terms and conditions and click the pay button
    await page.evaluateHandle(() => {
      const btns = document.querySelector("#payment_method_type_mandate");
      const payBtn = document.querySelector("button.wide");
      btns.click();
      return payBtn.click();
    });

    // Wait for navigation
    await page.waitForNavigation({ timeout: 0 });
    await page.waitFor(10000);

    await page.waitForSelector(
      "#global > div > div > div > div > div > h2 > font > font"
    );

    // Confirm if the payment succeed
    const message = await page.$(
      "#global > div > div > div > div > div > h2 > font > font"
    );

    let value = await page.evaluate((el) => el.textContent, message);

    console.log(value);

    // Take the screen shot
    await page.screenshot({ path: `confirm_payment.png` });

    // If payment failed throw an error
    if (value == "Payment has faile" || value == "De betaling is mislukt") {
      throw new Error(
        "Error proccessing your payment make sure you provide correct information"
      );
    }

    // Close the browser
    await browser.close();

    return {
      payment_succeed: true,
      img: `${__dirname}/public/confirm_payment.png`,
    };
  } catch (error) {
    console.log("Some error occured during the registration procees");
    console.error(error);
    return {
      payment_succeed: false,
    };
  }
}

module.exports = register;

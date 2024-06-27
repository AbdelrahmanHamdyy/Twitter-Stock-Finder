const { Builder, By, Key, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
require("dotenv").config();

const { TWITTER_USERNAME, TWITTER_PASSWORD } = process.env;

// Twitter accounts to scrape
const twitterAccounts = [
  "https://twitter.com/Mr_Derivatives",
  "https://twitter.com/warrior_0719",
  "https://twitter.com/ChartingProdigy",
  "https://twitter.com/allstarcharts",
  "https://twitter.com/yuriymatso",
  "https://twitter.com/TriggerTrades",
  "https://twitter.com/AdamMancini4",
  "https://twitter.com/CordovaTrades",
  "https://twitter.com/Barchart",
  "https://twitter.com/RoyLMattox",
];

const stockSymbol = "AMZN";
const interval = 15 * 60000;

const screen = {
  width: 1280,
  height: 960,
};

let driver;

// Setup the Selenium WebDriver with Chrome
const setupDriver = async () => {
  driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(
      new chrome.Options().addArguments("--start-maximized").windowSize(screen)
    )
    .build();
};

const login = async () => {
  await driver.get("https://x.com/i/flow/login");

  const username = await driver.wait(
    until.elementLocated(By.css('input[autocomplete="username"]')),
    10000
  );
  await username.sendKeys(TWITTER_USERNAME, Key.ENTER);

  const password = await driver.wait(
    until.elementLocated(By.css('input[autocomplete="current-password"]')),
    10000
  );
  await password.sendKeys(TWITTER_PASSWORD, Key.ENTER);

  await driver.sleep(5000);
};

const scrapeTwitterAccount = async (url) => {
  try {
    // Navigate to the Twitter page
    await driver.get(url);

    // Scroll down and collect tweets
    let tweets = [];
    let lastHeight = await driver.executeScript(
      "return document.body.scrollHeight"
    );
    while (true) {
      let newTweets = await driver.findElements(
        By.xpath('//article[@data-testid="tweet"]')
      );
      for (let tweet of newTweets) {
        let tweetText = await tweet
          .findElement(By.xpath('.//div[@data-testid="tweetText"]'))
          .getText();

        if (!tweets.includes(tweetText)) {
          tweets.push(tweetText);
        }
      }
      await driver.executeScript(
        "window.scrollTo(0, document.body.scrollHeight / 2);"
      );
      await driver.sleep(3000); // Adjust sleep time as needed
      let newHeight = await driver.executeScript(
        "return document.body.scrollHeight"
      );
      if (newHeight === lastHeight || tweets.length > 10) {
        break;
      }
      lastHeight = newHeight;
    }
    console.log(tweets.length);
    console.log(tweets);
    const regex = new RegExp(`\\$${stockSymbol}`, "gi");
    const matches = tweets.join(" ").match(regex);
    return matches ? matches.length : 0;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return 0;
  }
};

const scrapeAllAccounts = async () => {
  let totalCount = 0;

  for (const account of twitterAccounts) {
    const count = await scrapeTwitterAccount(account);
    console.log(`'${account}' mentioned '${stockSymbol}' ${count} times.`);
    totalCount += count;
  }

  console.log(
    `\n'${stockSymbol}' was mentioned '${totalCount}' times in the last '${
      interval / 60000
    }' minutes.`
  );
};

// Start the scraping process
(async () => {
  await setupDriver();
  await login();
  await scrapeAllAccounts();
  setInterval(async () => {
    await scrapeAllAccounts();
  }, interval);
})();

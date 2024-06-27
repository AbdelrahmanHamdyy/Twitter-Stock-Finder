const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

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

const stockSymbol = "Warrior";
const interval = 15 * 60000;

const screen = {
  width: 640,
  height: 480,
};

const scrapeTwitterAccount = async (url) => {
  let driver;
  try {
    // Setup the Selenium WebDriver with Chrome
    driver = new Builder()
      .forBrowser("chrome")
      .setChromeOptions(
        new chrome.Options().addArguments("--headless").windowSize(screen)
      )
      .build();

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
        tweets.push(tweetText);
      }
      await driver.executeScript(
        "window.scrollTo(0, document.body.scrollHeight);"
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

    const regex = new RegExp(stockSymbol, "gi");
    const matches = tweets.join(" ").match(regex);
    return matches ? matches.length : 0;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return 0;
  } finally {
    if (driver) {
      await driver.quit();
    }
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

const startScraping = () => {
  scrapeAllAccounts();
  setInterval(scrapeAllAccounts, interval);
};

startScraping();

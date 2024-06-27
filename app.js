// Include the required modules
const { Builder, By, Key, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
// Load environment variables from .env file
require("dotenv").config();

// Get Twitter login credentials from environment variables
const { TWITTER_USERNAME, TWITTER_PASSWORD } = process.env;

// List of Twitter accounts to scrape
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

const MAX_TWEETS = 10; // Maximum number of tweets to scrape
const stockSymbol = "AMZN"; // The stock symbol to search for in tweets
const interval = 15 * 60000; // Time interval for scraping in milliseconds

// Set screen width and height for the browser window
const screen = {
  width: 1280,
  height: 960,
};

// Initialize the WebDriver variable
let driver;

// Function to setup the Selenium WebDriver with Chrome
const setupDriver = async () => {
  // Create a new WebDriver with Chrome and set the options
  driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(
      new chrome.Options().addArguments("--start-maximized").windowSize(screen)
    )
    .build();
};

// Function used to log in to Twitter
const login = async () => {
  // Navigate to Twitter login page
  await driver.get("https://x.com/i/flow/login");

  // Wait for the username page to load until the username input field is located by CSS selector
  const username = await driver.wait(
    until.elementLocated(By.css('input[autocomplete="username"]')),
    10000
  );
  // Enter username and submit
  await username.sendKeys(TWITTER_USERNAME, Key.ENTER);

  // Wait for the password page to load by waiting for the password input field to be located
  const password = await driver.wait(
    until.elementLocated(By.css('input[autocomplete="current-password"]')),
    10000
  );
  // Enter password and submit
  await password.sendKeys(TWITTER_PASSWORD, Key.ENTER);

  // Give some time for login to complete and home page to load
  await driver.sleep(5000);
};

// Function to scrape tweets from a given Twitter account URL
const scrapeTwitterAccount = async (url) => {
  try {
    // Navigate to the Twitter account page
    await driver.get(url);

    // Initialize an array to store tweets
    let tweets = [];
    // Get the initial height of the page
    let lastHeight = await driver.executeScript(
      "return document.body.scrollHeight"
    );
    // Infinite loop until the break condition is met
    while (true) {
      // Find all tweet elements by xpath that have the data-testid attribute set to "tweet"
      let newTweets = await driver.findElements(
        By.xpath('//article[@data-testid="tweet"]')
      );

      // Loop through each tweet element
      for (let tweet of newTweets) {
        // Find the tweet text element within the tweet element by xpath
        let tweetText = await tweet
          .findElement(By.xpath('.//div[@data-testid="tweetText"]'))
          .getText(); // Get tweet text

        // Check if the tweet text is not already in the array
        if (!tweets.includes(tweetText)) {
          // Tweet is new and no duplicates found
          tweets.push(tweetText); // Add unique tweet to the array
        }
      }

      // Scroll down the page by half of the current height so that we don't skip tweets
      await driver.executeScript(
        "window.scrollTo(0, document.body.scrollHeight / 2);"
      );
      // Wait for new tweets to load
      await driver.sleep(3000);

      // Get the new height of the page after scrolling
      let newHeight = await driver.executeScript(
        "return document.body.scrollHeight"
      );
      // If the height hasn't changed, this means that there are no more tweets to load
      if (newHeight === lastHeight || tweets.length > MAX_TWEETS) {
        break; // Break the loop if no new tweets are loaded or more than MAX_TWEETS tweets are collected
      }
      // Update the last height to the new height
      lastHeight = newHeight;
    }

    // Create a regular expression to match the stock symbol in tweets
    // The g flag is used to match all occurrences in the tweet text
    // The i flag is used for case-insensitive matching
    const regex = new RegExp(`\\$${stockSymbol}`, "gi");
    // Join all tweets into a single string and match the regular expression
    const matches = tweets.join(" ").match(regex);
    // Return the number of matches found in the tweets
    return matches ? matches.length : 0;
  } catch (error) {
    // Log any errors that occur
    console.error(`Error scraping ${url}:`, error);
    return 0;
  }
};

// Function to scrape all specified Twitter accounts
const scrapeAllAccounts = async () => {
  // Initialize the total count of mentions
  let totalCount = 0;

  // Loop through each Twitter account
  for (const account of twitterAccounts) {
    // Scrape each account for the stock symbol and get the count
    const count = await scrapeTwitterAccount(account);
    console.log(`'${account}' mentioned '${stockSymbol}' ${count} times.`);
    // Add the number of mentions to the total count
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
  await setupDriver(); // Setup the WebDriver
  await login(); // Log in to Twitter
  await scrapeAllAccounts(); // Scrape all accounts

  setInterval(async () => {
    await scrapeAllAccounts(); // Scrape all accounts at regular intervals
  }, interval);
})();

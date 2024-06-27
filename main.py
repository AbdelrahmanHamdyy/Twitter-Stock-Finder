import re
import time
from playwright.sync_api import sync_playwright
from collections import defaultdict

SCROLL_COUNT = 5

# Function to scrape a Twitter profile page
def scrape_twitter_profile(page, url: str, ticker: str) -> int:
    """
    Scrape the Twitter profile page for a specific stock ticker mention.
    """
    # Go to the Twitter profile page
    page.goto(url)
    
    # Scroll down multiple times to load more tweets
    for _ in range(SCROLL_COUNT):
        page.evaluate("window.scrollTo(0, document.body.scrollHeight);")
        # Wait for the page to load
        page.wait_for_timeout(2000)

    page.query_selector_all("[data-testid='tweetText']")

    # Extract the page content
    content = page.content()
    
    # Use regular expression to find all occurrences of the stock ticker
    mentions = re.findall(fr'\${ticker}', content, re.IGNORECASE)
    
    return len(mentions)

def main(twitter_accounts, ticker, interval):
    """
    Main function to scrape multiple Twitter accounts at defined intervals.
    """
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()
        
        mentions_count = defaultdict(int)
        
        while True:
            for account in twitter_accounts:
                try:
                    mentions_count[account] += scrape_twitter_profile(page, account, ticker)
                    print(f"'{ticker}' was mentioned {mentions_count[account]} times on {account}.")
                except Exception as e:
                    print(f"Error scraping {account}: {e}")
                    
            total_mentions = sum(mentions_count.values())
            print(f"'{ticker}' was mentioned {total_mentions} times in the last {interval} minutes.")
            
            # Wait for the specified interval before the next scraping session
            time.sleep(interval * 60)

if __name__ == "__main__":
    # List of Twitter accounts to scrape
    twitter_accounts = [
        "https://twitter.com/Mr_Derivatives",
        "https://twitter.com/warrior_0719",
        "https://twitter.com/ChartingProdigy",
        "https://twitter.com/allstarcharts",
        "https://twitter.com/yuriymatso",
        "https://twitter.com/TriggerTrades",
        "https://twitter.com/AdamMancini4",
        "https://twitter.com/CordovaTrades",
        "https://twitter.com/Barchart",
        "https://twitter.com/RoyLMattox"
    ]

    # Ticker symbol to look for
    ticker = "NVDA"

    # Time interval for scraping in minutes
    interval = 15

    # Run the scraper
    main(twitter_accounts, ticker, interval)
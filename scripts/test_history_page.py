"""
Playwright test for History Page
"""

from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:8000"

def test_history():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        
        print("Navigating to http://127.0.0.1:8000/history")
        page.goto(f"{BASE_URL}/history")
        page.wait_for_timeout(1000)
        
        rows = page.locator("#historyTableBody tr")
        row_count = rows.count()
        print(f"History Table Row Count: {row_count}")
        
        # Check first row task text
        if row_count > 0:
            first_task = rows.first.locator("td").first.text_content()
            print(f"First History Record Task: {first_task}")
            
        print("Console logs:")
        for log in console_logs:
            print(" ", log)
            
        browser.close()
        return row_count > 0

if __name__ == "__main__":
    success = test_history()
    print("History test success:", success)

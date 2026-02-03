from playwright.sync_api import Page, expect, sync_playwright

def verify_triage_a11y(page: Page):
    # 1. Arrange: Go to a triage page
    page.goto("http://localhost:5173/triage/hypothermia.ink.json")

    # Wait for the content to load
    # "Interactive Triage" text is in the header
    page.get_by_text("Interactive Triage").wait_for(timeout=10000)

    # 2. Assert: Check for Back button accessibility
    back_button = page.get_by_label("Go back")
    expect(back_button).to_be_visible()

    # 3. Assert: Check for Reload button accessibility
    reload_button = page.get_by_label("Restart triage")
    expect(reload_button).to_be_visible()

    # 4. Screenshot
    page.screenshot(path="/home/jules/verification/triage_a11y.png")

    print("Successfully verified ARIA labels on Triage Screen.")

def verify_triage_error(page: Page):
    # Check error state
    page.goto("http://localhost:5173/triage/non_existent_story")

    # Wait for error message
    error_alert = page.get_by_role("alert")
    expect(error_alert).to_be_visible(timeout=10000)
    expect(error_alert).to_contain_text("Error")

    page.screenshot(path="/home/jules/verification/triage_error.png")
    print("Successfully verified role='alert' on error state.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Verifying Triage Accessibility...")
            verify_triage_a11y(page)
            verify_triage_error(page)
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="/home/jules/verification/failure.png")
        finally:
            browser.close()

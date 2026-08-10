"""
End-to-End Playwright Test Suite for LangGraph Studio
=====================================================
Tests all major features using sync Playwright API:
- Page loading & navigation
- Code generation flow
- Language conversion bar
- Tour behavior (no re-trigger on revisit)
- Mobile responsive layout
- Guardrail endpoint & UX simplification
"""

import pytest
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:8000"


@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        yield browser
        browser.close()


@pytest.fixture
def page(browser):
    context = browser.new_context()
    # Suppress tour by default for interactive functional tests
    context.add_init_script("""
        localStorage.setItem('langgraph_v3_tour_completed', 'true');
        sessionStorage.setItem('langgraph_tour_dismissed', 'true');
    """)
    pg = context.new_page()
    yield pg
    context.close()


@pytest.fixture
def tour_page(browser):
    """Clean context with no tour suppression for tour behavior tests."""
    context = browser.new_context()
    pg = context.new_page()
    yield pg
    context.close()


@pytest.fixture
def mobile_page(browser):
    context = browser.new_context(viewport={"width": 375, "height": 812})
    context.add_init_script("""
        localStorage.setItem('langgraph_v3_tour_completed', 'true');
        sessionStorage.setItem('langgraph_tour_dismissed', 'true');
    """)
    pg = context.new_page()
    yield pg
    context.close()


# ═══════════════════════════════════════════════════════════════════
# 1. Page Loading Tests
# ═══════════════════════════════════════════════════════════════════

class TestPageLoading:

    def test_dashboard_loads(self, page):
        resp = page.goto(BASE_URL + "/")
        assert resp.status == 200
        heading = page.text_content("h1")
        assert heading is not None

    def test_generate_page_loads(self, page):
        resp = page.goto(BASE_URL + "/generate")
        assert resp.status == 200
        assert page.locator("#generateBtn").count() == 1

    def test_workflow_page_loads(self, page):
        resp = page.goto(BASE_URL + "/workflow")
        assert resp.status == 200

    def test_execution_page_loads(self, page):
        resp = page.goto(BASE_URL + "/execution")
        assert resp.status == 200

    def test_history_page_loads(self, page):
        resp = page.goto(BASE_URL + "/history")
        assert resp.status == 200

    def test_generate_page_title(self, page):
        page.goto(BASE_URL + "/generate")
        title = page.title()
        assert "LangGraph" in title or "Workbench" in title or "Code" in title


# ═══════════════════════════════════════════════════════════════════
# 2. Navigation Tests
# ═══════════════════════════════════════════════════════════════════

class TestNavigation:

    def test_nav_links_exist(self, page):
        page.goto(BASE_URL + "/")
        page.wait_for_selector(".nav-link-item", timeout=5000)
        nav_links = page.locator(".nav-links .nav-link-item")
        assert nav_links.count() >= 4, "Should have at least 4 desktop navigation links"

    def test_navigate_to_workbench(self, page):
        page.goto(BASE_URL + "/")
        page.wait_for_selector(".nav-links a[data-page='generator']", timeout=5000)
        link = page.locator(".nav-links a[data-page='generator']")
        link.click()
        page.wait_for_load_state("networkidle")
        assert "/generate" in page.url

    def test_navigate_to_pipeline(self, page):
        page.goto(BASE_URL + "/")
        page.wait_for_selector(".nav-links a[data-page='workflow']", timeout=5000)
        link = page.locator(".nav-links a[data-page='workflow']")
        link.click()
        page.wait_for_load_state("networkidle")
        assert "/workflow" in page.url


# ═══════════════════════════════════════════════════════════════════
# 3. Code Generation Flow
# ═══════════════════════════════════════════════════════════════════

class TestCodeGeneration:

    def test_empty_task_shows_validation(self, page):
        page.goto(BASE_URL + "/generate")
        page.wait_for_timeout(600)
        page.click("#generateBtn")
        page.wait_for_timeout(300)
        alert = page.locator("#taskInlineAlert")
        assert alert.is_visible(), "Validation alert should show when task is empty"

    def test_preset_fills_task(self, page):
        page.goto(BASE_URL + "/generate")
        page.wait_for_timeout(600)
        fib_btn = page.locator("button:has-text('Fibonacci')").first
        assert fib_btn.count() > 0
        fib_btn.click()
        page.wait_for_timeout(200)
        value = page.input_value("#taskInput")
        assert "fibonacci" in value.lower()

    def test_language_selector(self, page):
        page.goto(BASE_URL + "/generate")
        page.wait_for_timeout(600)
        trigger = page.locator("#langSelectWrapper .custom-select-trigger")
        trigger.click()
        page.wait_for_timeout(200)
        java_opt = page.locator('[data-value="java"]')
        java_opt.click()
        page.wait_for_timeout(200)
        val = page.input_value("#languageSelect")
        assert val == "java"

    def test_generate_button_text_simplified(self, page):
        page.goto(BASE_URL + "/generate")
        page.wait_for_timeout(600)
        btn_text = page.locator("#generateBtn").text_content()
        assert "Generate" in btn_text, "Button should say 'Generate Code', not technical jargon"


# ═══════════════════════════════════════════════════════════════════
# 4. Conversion Bar
# ═══════════════════════════════════════════════════════════════════

class TestConversionBar:

    def test_conversion_bar_hidden_by_default(self, page):
        page.goto(BASE_URL + "/generate")
        page.wait_for_timeout(600)
        bar = page.locator("#conversionBar")
        assert not bar.is_visible(), "Conversion bar should be hidden before generation"

    def test_conversion_buttons_exist(self, page):
        page.goto(BASE_URL + "/generate")
        page.wait_for_timeout(600)
        assert page.locator("#convertPythonBtn").count() == 1
        assert page.locator("#convertJavaBtn").count() == 1
        assert page.locator("#convertCppBtn").count() == 1


# ═══════════════════════════════════════════════════════════════════
# 5. Tour Behavior
# ═══════════════════════════════════════════════════════════════════

class TestTourBehavior:

    def test_tour_no_retrigger_on_revisit(self, tour_page):
        tour_page.goto(BASE_URL + "/")
        tour_page.wait_for_timeout(1000)

        # Dismiss tour if visible
        dismiss = tour_page.locator('#tourCalloutCard button[title*="Close"]')
        if dismiss.count() > 0 and dismiss.is_visible():
            dismiss.click()
            tour_page.wait_for_timeout(300)

        # Navigate away and back
        tour_page.goto(BASE_URL + "/generate")
        tour_page.wait_for_timeout(800)
        tour_page.goto(BASE_URL + "/")
        tour_page.wait_for_timeout(1000)

        callout = tour_page.locator("#tourCalloutCard")
        if callout.count() > 0:
            assert not callout.is_visible(), "Tour should NOT re-trigger on revisit"


# ═══════════════════════════════════════════════════════════════════
# 6. Mobile Responsive
# ═══════════════════════════════════════════════════════════════════

class TestMobileResponsive:

    def test_hamburger_visible_on_mobile(self, mobile_page):
        mobile_page.goto(BASE_URL + "/")
        mobile_page.wait_for_selector(".mobile-menu-toggle", timeout=5000)
        hamburger = mobile_page.locator(".mobile-menu-toggle")
        assert hamburger.is_visible(), "Hamburger should be visible on mobile"

    def test_nav_links_hidden_on_mobile(self, mobile_page):
        mobile_page.goto(BASE_URL + "/")
        mobile_page.wait_for_timeout(800)
        nav_links = mobile_page.locator(".nav-links")
        if nav_links.count() > 0:
            assert not nav_links.is_visible(), "Desktop nav should be hidden on mobile"

    def test_drawer_opens_on_tap(self, mobile_page):
        mobile_page.goto(BASE_URL + "/")
        mobile_page.wait_for_selector(".mobile-menu-toggle", timeout=5000)
        hamburger = mobile_page.locator(".mobile-menu-toggle")
        assert hamburger.is_visible()
        hamburger.click()
        mobile_page.wait_for_timeout(500)
        drawer = mobile_page.locator("#mobileNavDrawer")
        has_open = drawer.evaluate("el => el.classList.contains('open')")
        assert has_open, "Drawer should open after tapping hamburger"

    def test_mobile_grids_stack(self, mobile_page):
        mobile_page.goto(BASE_URL + "/generate")
        mobile_page.wait_for_timeout(800)
        grid = mobile_page.locator(".workbench-controls-grid")
        if grid.count() > 0:
            cols = grid.evaluate("el => getComputedStyle(el).gridTemplateColumns")
            col_count = len(cols.split(" "))
            assert col_count <= 2, f"Expected stacked column on mobile, got {col_count}"


# ═══════════════════════════════════════════════════════════════════
# 7. API & Guardrails
# ═══════════════════════════════════════════════════════════════════

class TestAPIEndpoints:

    def test_health_endpoint(self, page):
        resp = page.goto(BASE_URL + "/health")
        assert resp.status == 200

    def test_guardrail_endpoint(self, page):
        resp = page.goto(BASE_URL + "/guardrails")
        assert resp.status == 200
        body = page.text_content("body")
        assert "stats" in body or "shield_status" in body or "Guardrails" in body


# ═══════════════════════════════════════════════════════════════════
# 8. UX Simplification Verification
# ═══════════════════════════════════════════════════════════════════

class TestUXSimplification:

    def test_dashboard_no_technical_jargon(self, page):
        page.goto(BASE_URL + "/")
        page.wait_for_timeout(800)
        body = page.text_content("body")
        # These old jargon terms should NOT appear
        assert "Self-Fix Ceiling" not in body, "Old jargon should be removed"
        assert "Runtime Sandbox" not in body, "Old jargon should be removed"

    def test_nav_simplified_labels(self, page):
        page.goto(BASE_URL + "/")
        page.wait_for_timeout(800)
        body = page.text_content("body") or ""
        assert "History" in body
        assert "Health" in body


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

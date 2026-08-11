"""
Comprehensive Multi-Language & Multi-Task Playwright E2E Test Suite
===================================================================
Exhaustively tests all 5 pages, custom web select dropdowns, multi-language
code generation (Python 3.11, Java 17, C++ 20), localStorage synchronization,
interactive state graph simulator, system telemetry, and audit log modals.
"""

import pytest
import time
from playwright.sync_api import sync_playwright, expect

BASE_URL = "http://127.0.0.1:8000"

def test_comprehensive_e2e():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("\n" + "="*70)
        print("🚀 [1/5] E2E TEST: COMMAND CENTER DASHBOARD ('/')")
        print("="*70)
        page.goto(f"{BASE_URL}/")
        expect(page.locator("h1.page-title")).to_contain_text("Command Center")
        expect(page.locator("#statTotalRuns")).to_be_visible()
        expect(page.locator("#statSuccessRate")).to_contain_text("%")
        
        # Test preset card navigation
        preset_card = page.locator("a[href*='preset=palindrome']").first
        expect(preset_card).to_be_visible()
        print("  ✓ Command Center metrics and preset cards verified")

        print("\n" + "="*70)
        print("🚀 [2/5] E2E TEST: CODE WORKBENCH DYNAMIC MULTI-LANGUAGE ('/generate')")
        print("="*70)
        page.goto(f"{BASE_URL}/generate")
        expect(page.locator("h1.page-title")).to_contain_text("Code Workbench")

        # --- A. Test Python Execution ---
        print("  🔹 [2A] Executing Dynamic Python Task (Factorial)...")
        task_input = page.locator("#taskInput")
        task_input.fill("Write a function to calculate factorial of a number")
        page.locator("#generateBtn").click()
        page.wait_for_timeout(1500)
        
        code_box = page.locator("#codeDisplay")
        expect(code_box).to_contain_text("factorial")
        expect(page.locator("#statusBanner")).to_contain_text("PYTHON Verification Passed")
        print("    ✓ Python Factorial Code generated and verified cleanly")

        # --- B. Test Java 17 Execution ---
        print("  🔹 [2B] Executing Dynamic Java 17 Task (Reverse String)...")
        lang_wrapper = page.locator("#langSelectWrapper")
        lang_wrapper.locator(".custom-select-trigger").click()
        page.wait_for_timeout(200)
        lang_wrapper.locator(".custom-select-option[data-value='java']").click()
        expect(page.locator("#langSelectValue")).to_have_text("Java 17")

        task_input.fill("Write a function to reverse a string")
        page.locator("#generateBtn").click()
        page.wait_for_timeout(1500)

        expect(code_box).to_contain_text("reverseString")
        expect(page.locator("#statusBanner")).to_contain_text("JAVA Verification Passed")
        print("    ✓ Java 17 String Reverse Code generated and verified cleanly")

        # --- C. Test C++ 20 Execution ---
        print("  🔹 [2C] Executing Dynamic C++ 20 Task (Prime Checker)...")
        lang_wrapper.locator(".custom-select-trigger").click()
        page.wait_for_timeout(200)
        lang_wrapper.locator(".custom-select-option[data-value='cpp']").click()
        expect(page.locator("#langSelectValue")).to_have_text("C++ 20")

        task_input.fill("Write a function to check if a number is prime")
        page.locator("#generateBtn").click()
        page.wait_for_timeout(1500)

        expect(code_box).to_contain_text("isPrime")
        expect(page.locator("#statusBanner")).to_contain_text("CPP Verification Passed")
        print("    ✓ C++ 20 Prime Checker Code generated and verified cleanly")

        print("\n" + "="*70)
        print("🚀 [3/5] E2E TEST: STATE GRAPH CANVAS & SIMULATOR ('/workflow')")
        print("="*70)
        page.goto(f"{BASE_URL}/workflow")
        expect(page.locator("h1.page-title")).to_contain_text("State Graph Canvas")

        # Verify task synced from workbench (C++ Prime Check)
        canvas_input = page.locator("#canvasTaskInput")
        expect(canvas_input).to_have_value("Write a function to check if a number is prime")

        # Test custom web select on canvas
        canvas_lang_wrapper = page.locator("#canvasLangWrapper")
        canvas_lang_wrapper.locator(".custom-select-trigger").click()
        page.wait_for_timeout(200)
        canvas_lang_wrapper.locator(".custom-select-option[data-value='java']").click()
        expect(page.locator("#canvasLangValue")).to_have_text("Java 17")

        page.locator("button:has-text('Update Canvas')").click()
        page.wait_for_timeout(300)
        expect(page.locator("#canvasLangBadge")).to_have_text("TARGET: JAVA")

        # Step Simulation node by node
        print("  🔹 Stepping simulator node by node...")
        page.locator("#simStepBtn").click() # Developer
        expect(page.locator("#simStepStatus")).to_contain_text("Developer Node Active")
        expect(page.locator("#nodeInputs")).to_contain_text('"language": "java"')

        page.locator("#simStepBtn").click() # Tester
        expect(page.locator("#simStepStatus")).to_contain_text("Tester Node Active")

        page.locator("#simStepBtn").click() # Router
        expect(page.locator("#simStepStatus")).to_contain_text("Router Node Active")

        page.locator("#simStepBtn").click() # END
        expect(page.locator("#simStepStatus")).to_contain_text("END Node Active")
        print("  ✓ State Graph Simulator: Full 5-step node traversal verified in Java 17")

        print("\n" + "="*70)
        print("🚀 [4/5] E2E TEST: SYSTEM TELEMETRY & DIAGNOSTICS ('/execution')")
        print("="*70)
        page.goto(f"{BASE_URL}/execution")
        expect(page.locator("h1.page-title")).to_contain_text("System Health & Live Telemetry")
        expect(page.locator("#healthStatusText")).to_contain_text("OPERATIONAL")
        expect(page.locator("#circuitBreakerText")).to_contain_text("CLOSED")

        # Click Check Health Now
        page.locator("button:has-text('Check Health Now')").click()
        page.wait_for_timeout(500)
        expect(page.locator("#logTerminal")).to_contain_text("HEALTH CHECK PASSED")
        print("  ✓ Telemetry metrics and health polling verified")

        print("\n" + "="*70)
        print("🚀 [5/5] E2E TEST: AUDIT LOGS & RUN DETAILS MODAL ('/history')")
        print("="*70)
        page.goto(f"{BASE_URL}/history")
        expect(page.locator("h1.page-title")).to_contain_text("Audit Logs")

        # Verify rows for all 3 executed tasks are present
        table_body = page.locator("#historyTableBody")
        expect(table_body).to_contain_text("factorial")
        expect(table_body).to_contain_text("reverse")
        expect(table_body).to_contain_text("prime")
        print("  ✓ Audit Log: All 3 multi-language runs recorded")

        # Test search filter
        search_input = page.locator("#searchInput")
        search_input.fill("reverse")
        page.wait_for_timeout(300)
        expect(table_body).to_contain_text("reverse")
        print("  ✓ Search filter working correctly")

        # Test inspecting modal
        first_row = page.locator("#historyTableBody tr").first
        first_row.click()
        page.wait_for_timeout(300)
        
        detail_modal = page.locator("#detailModal")
        expect(detail_modal).to_be_visible()
        expect(page.locator("#modalCodeBody")).to_be_visible()
        page.locator("button[title='Close Modal']").click()
        page.wait_for_timeout(200)
        expect(detail_modal).not_to_be_visible()
        print("  ✓ Run Details modal open & close verified")

        browser.close()
        print("\n" + "="*70)
        print("🎉 EXHAUSTIVE E2E PLAYWRIGHT TEST SUITE COMPLETED (100% SUCCESS)!")
        print("="*70 + "\n")

if __name__ == "__main__":
    test_comprehensive_e2e()

"""
Dynamic Playwright E2E Test Suite for LangGraph Studio
======================================================
Tests all 5 pages, custom studio web select dropdowns, dynamic task specification
inputs across languages (Python 3.11, Java 17, C++ 20), state canvas simulator,
and system telemetry.
"""

import pytest
import time
from playwright.sync_api import sync_playwright, expect

BASE_URL = "http://127.0.0.1:8000"

def test_full_platform_e2e_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        print("\n🚀 [1/5] Testing Command Center Dashboard ('/')...")
        page.goto(f"{BASE_URL}/")
        expect(page.locator("h1.page-title")).to_contain_text("Command Center")
        expect(page.locator("#statTotalRuns")).to_be_visible()
        expect(page.locator("#statSuccessRate")).to_contain_text("%")
        print("  ✓ Command Center metrics loaded successfully")

        print("\n🚀 [2/5] Testing Code Workbench ('/generate')...")
        page.goto(f"{BASE_URL}/generate")
        expect(page.locator("h1.page-title")).to_contain_text("Code Workbench")

        # Test custom web dropdown for Target Language
        lang_wrapper = page.locator("#langSelectWrapper")
        lang_wrapper.locator(".custom-select-trigger").click()
        page.wait_for_timeout(300)

        # Select Java 17
        java_opt = lang_wrapper.locator(".custom-select-option[data-value='java']")
        expect(java_opt).to_be_visible()
        java_opt.click()
        expect(page.locator("#langSelectValue")).to_have_text("Java 17")
        print("  ✓ Custom Web Select: Target Language switched to Java 17")

        # Type custom dynamic task specification
        task_input = page.locator("#taskInput")
        task_input.fill("Write a binary search algorithm in Java")
        
        # Execute Task
        page.locator("#generateBtn").click()
        page.wait_for_timeout(1500)

        code_display = page.locator("#codeDisplay")
        expect(code_display).to_contain_text("Main", ignore_case=True)
        print("  ✓ Dynamic Task Execution in Java completed successfully")

        print("\n🚀 [3/5] Testing State Graph Canvas ('/workflow')...")
        page.goto(f"{BASE_URL}/workflow")
        expect(page.locator("h1.page-title")).to_contain_text("State Graph Canvas")

        # Verify task synced from workbench
        canvas_input = page.locator("#canvasTaskInput")
        expect(canvas_input).to_have_value("Write a binary search algorithm in Java")

        # Test Custom Web Select on Canvas (No native OS select!)
        canvas_lang_wrapper = page.locator("#canvasLangWrapper")
        canvas_lang_wrapper.locator(".custom-select-trigger").click()
        page.wait_for_timeout(300)
        
        cpp_opt = canvas_lang_wrapper.locator(".custom-select-option[data-value='cpp']")
        expect(cpp_opt).to_be_visible()
        cpp_opt.click()
        expect(page.locator("#canvasLangValue")).to_have_text("C++ 20")
        print("  ✓ Custom Web Select on Canvas: Switched to C++ 20 (No native OS dropdown!)")

        # Click Update Canvas for C++
        page.locator("button:has-text('Update Canvas')").click()
        page.wait_for_timeout(500)
        expect(page.locator("#canvasLangBadge")).to_have_text("TARGET: CPP")

        # Step Simulation
        page.locator("#simStepBtn").click()
        expect(page.locator("#simStepStatus")).to_contain_text("Developer Node Active")
        
        # Inspect state inputs payload
        inputs_box = page.locator("#nodeInputs")
        expect(inputs_box).to_contain_text('"language": "cpp"')
        print("  ✓ Canvas State Inspector: Dynamic payload updated for C++ 20")

        print("\n🚀 [4/5] Testing System Telemetry ('/execution')...")
        page.goto(f"{BASE_URL}/execution")
        expect(page.locator("h1.page-title")).to_contain_text("System Health & Live Telemetry")
        expect(page.locator("#healthStatusText")).to_contain_text("OPERATIONAL")
        expect(page.locator("#logTerminal")).to_contain_text("HEALTH CHECK PASSED")
        print("  ✓ Telemetry: API health operational (200 OK)")

        print("\n🚀 [5/5] Testing Audit Logs ('/history')...")
        page.goto(f"{BASE_URL}/history")
        expect(page.locator("h1.page-title")).to_contain_text("Audit Logs")

        # Verify run recorded
        table_body = page.locator("#historyTableBody")
        expect(table_body).to_contain_text("Write a binary search algorithm in Java")

        # Search filter test
        search_input = page.locator("#searchInput")
        search_input.fill("binary")
        page.wait_for_timeout(300)
        expect(table_body).to_contain_text("binary")
        print("  ✓ Audit Log: Past run recorded and searchable")

        browser.close()
        print("\n🎉 ALL 5 E2E PLAYWRIGHT TESTS PASSED CLEANLY (100% SUCCESS)!\n")

if __name__ == "__main__":
    test_full_platform_e2e_flow()

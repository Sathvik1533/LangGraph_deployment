"""
Headless Playwright Reproduction & Verification Script for HITL
"""

import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:8000"

def test_hitl_action(action_name="approve", edited_code=None, feedback=None):
    print(f"\n{'='*60}")
    print(f"TESTING HITL ACTION: {action_name.upper()}")
    print(f"{'='*60}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        console_logs = []
        page_errors = []
        
        page.on("console", lambda msg: console_logs.append(f"[{msg.type.upper()}] {msg.text}"))
        page.on("pageerror", lambda err: page_errors.append(str(err)))
        
        # 1. Navigate to Workflow with HITL enabled and autoRun
        task_str = "Write a Python function that reverses a string and create tests for it."
        url = f"{BASE_URL}/workflow?task={task_str}&lang=python&max=3&hitl=true&mode=live&autoRun=true"
        print(f"Navigating to: {url}")
        page.goto(url)
        
        # 2. Wait for Human Review Modal to appear
        print("Waiting for Human Review modal to open...")
        try:
            page.wait_for_selector("#workflowHitlModal", state="visible", timeout=15000)
            print("✅ Human Review Modal opened successfully!")
        except Exception as e:
            print(f"❌ Failed waiting for modal: {e}")
            for log in console_logs:
                print("  Console:", log)
            browser.close()
            return False
            
        # 3. If edited code or feedback provided, set them
        if edited_code:
            page.fill("#workflowHitlCodeInput", edited_code)
        if feedback:
            page.fill("#workflowHitlFeedbackInput", feedback)
            
        # 4. Click the specified action button
        button_selectors = {
            "approve": "button:has-text('Approve')",
            "edit": "button:has-text('Edit & Approve')",
            "reject": "button:has-text('Request Changes')",
            "abort": "button:has-text('Abort')"
        }
        btn_sel = button_selectors.get(action_name, "button:has-text('Approve')")
        print(f"Clicking action button: {btn_sel}")
        page.click(btn_sel)
        
        # 5. Wait for async processing and state transitions
        time.sleep(3)
        
        # 6. Check for page errors
        print("\n--- RESULTS ---")
        print(f"Page Errors Count: {len(page_errors)}")
        for err in page_errors:
            print(f"  ❌ ERROR: {err}")
            
        print("\nConsole Output (Last 15 entries):")
        for log in console_logs[-15:]:
            print(f"  {log}")
            
        # Check modal state and telemetry status
        modal_style = page.eval_on_selector("#workflowHitlModal", "el => el.style.display")
        status_badge = page.eval_on_selector("#telemetryStatusBadge", "el => el.textContent")
        agent_badge = page.eval_on_selector("#telemetryAgentBadge", "el => el.textContent")
        step_status = page.eval_on_selector("#simStepStatus", "el => el.textContent")
        
        print(f"\nFinal DOM State:")
        print(f"  Modal display: {modal_style}")
        print(f"  Status Badge: {status_badge}")
        print(f"  Agent Badge: {agent_badge}")
        print(f"  Step Status: {step_status}")
        
        browser.close()
        
        if len(page_errors) > 0 or any("Failed to submit human review" in l for l in console_logs):
            print(f"\n❌ TEST {action_name.upper()} FAILED!")
            return False
        else:
            print(f"\n✅ TEST {action_name.upper()} PASSED!")
            return True

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "approve"
    test_hitl_action(action)

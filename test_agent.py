"""
Quick Test Script for the Agent with Self-Correction
=====================================================
Run this to verify the self-correction loop works.

V2: Tests the new conditional routing and state reducers

Usage: python test_agent.py
"""

import sys
from agent import agent
from langchain_core.messages import HumanMessage


def test_agent(task: str, expect_failure: bool = False):
    """
    Test the agent with a task.
    
    Args:
        task: Coding task description
        expect_failure: If True, expect the agent to need self-correction
    """
    print(f"\n{'='*60}")
    print(f"Testing Task: {task}")
    if expect_failure:
        print("(This task might intentionally trigger a self-correction loop)")
    print(f"{'='*60}\n")
    
    # Create initial state
    initial_state = {
        "messages": [HumanMessage(content=task)],
        "code": None,
        "report": None,
        "execution_success": False,
        "iterations": 0
    }
    
    try:
        # Run the agent with checkpointer configuration
        print("🤖 Running agent workflow with self-correction enabled...\n")
        config = {"configurable": {"thread_id": f"test_thread_{abs(hash(task)) % 10000}"}}
        result = agent.invoke(initial_state, config)
        
        # Display results
        print("✅ FINAL CODE:")
        print("-" * 60)
        print(result["code"])
        print("-" * 60)
        
        print(f"\n📊 EXECUTION STATUS:")
        print("-" * 60)
        print(f"Success: {'✅ Yes' if result['execution_success'] else '❌ No'}")
        print(f"Iterations: {result['iterations']}")
        print("-" * 60)
        
        print("\n📄 FINAL REPORT:")
        print("-" * 60)
        print(result["report"])
        print("-" * 60)
        
        print("\n💬 MESSAGE HISTORY:")
        print("-" * 60)
        for i, msg in enumerate(result["messages"], 1):
            msg_type = type(msg).__name__
            content = msg.content[:100] + "..." if len(msg.content) > 100 else msg.content
            print(f"{i}. [{msg_type}] {content}")
        print("-" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    # Test cases including ones that might need self-correction
    test_tasks = [
        ("Write a function to calculate fibonacci numbers", False),
        ("Create a function that checks if a string is a palindrome", False),
        # This one might trigger self-correction if the LLM makes an error:
        ("Write a function to divide two numbers with proper error handling", True),
    ]
    
    # Allow command line task
    if len(sys.argv) > 1:
        custom_task = " ".join(sys.argv[1:])
        test_tasks = [(custom_task, False)]
    
    success_count = 0
    for task, expect_failure in test_tasks:
        if test_agent(task, expect_failure):
            success_count += 1
        print("\n")
    
    print(f"\n{'='*60}")
    print(f"Results: {success_count}/{len(test_tasks)} tests completed")
    print(f"{'='*60}")
    print("\n💡 Note: The agent will self-correct up to 3 times if code fails!")
    print("   Watch for 🔄 retry messages in the output.\n")

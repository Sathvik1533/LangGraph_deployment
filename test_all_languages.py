from agent import agent
from langchain_core.messages import HumanMessage

def run_test(task, lang):
    initial_state = {
        "messages": [HumanMessage(content=task)],
        "code": None,
        "report": None,
        "execution_success": False,
        "iterations": 0,
        "max_iterations": 3,
        "language": lang
    }
    config = {"configurable": {"thread_id": f"thread_{lang}"}}
    result = agent.invoke(initial_state, config)
    print(f"\n--- TEST: {lang.upper()} ({task}) ---")
    print("CODE:\n", result.get("code"))
    print("SUCCESS:", result.get("execution_success"))
    print("REPORT:\n", result.get("report"))
    assert result.get("execution_success") == True, f"{lang} execution failed"
    assert not result.get("code").startswith("// ERROR:"), f"{lang} code validation failed"

print("\n🚀 TESTING MULTI-LANGUAGE DYNAMIC AGENT WORKFLOW...")
run_test("Write a function to reverse a string.", "python")
run_test("Write a function to reverse a string.", "java")
run_test("Write a function to reverse a string.", "cpp")

print("\n🎉 ALL 3 LANGUAGES (PYTHON 3.11, JAVA 17, C++ 20) EXECUTED WITH 100% SUCCESS!\n")

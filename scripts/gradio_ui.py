"""
Gradio UI for LangGraph Agent
==============================
Simple web interface for the coding agent.

Usage:
1. Install: pip install gradio
2. Start API: uvicorn app:app (in another terminal)
3. Run: python gradio_ui.py
"""

import gradio as gr
import requests
import os


# API Configuration
API_URL = os.environ.get("API_URL", "http://localhost:8000")


def generate_code(task: str):
    """
    Call the agent API and return results.
    
    Args:
        task: Coding task description
        
    Returns:
        tuple: (generated_code, test_report)
    """
    if not task.strip():
        return "❌ Please enter a task", ""
    
    try:
        # Call the API
        response = requests.post(
            f"{API_URL}/agent/invoke",
            json={"input": {"task": task}},
            timeout=60  # 60 second timeout
        )
        
        response.raise_for_status()
        data = response.json()
        
        # Extract results
        code = data["output"]["code"]
        report = data["output"]["report"]
        
        return code, report
        
    except requests.exceptions.Timeout:
        return "⏱️ Request timed out. Try a simpler task.", ""
    except requests.exceptions.ConnectionError:
        return f"❌ Cannot connect to API at {API_URL}. Is the server running?", ""
    except Exception as e:
        return f"❌ Error: {str(e)}", ""


# Example tasks
examples = [
    ["Write a function to calculate the factorial of a number"],
    ["Create a function that reverses a string"],
    ["Write a function to check if a number is prime"],
    ["Create a function that finds the longest word in a sentence"],
    ["Write a function to calculate the fibonacci sequence up to n terms"]
]


# Create Gradio interface
with gr.Blocks(title="LangGraph Code Generator", theme=gr.themes.Soft()) as demo:
    gr.Markdown(
        """
        # 🤖 LangGraph Code Generator
        
        **AI-powered coding assistant** that writes and tests Python code for you.
        
        Enter a task description and get working code with test execution results!
        """
    )
    
    with gr.Row():
        with gr.Column():
            task_input = gr.Textbox(
                label="📝 Coding Task",
                placeholder="e.g., Write a function to calculate fibonacci numbers",
                lines=3
            )
            
            submit_btn = gr.Button("✨ Generate Code", variant="primary", size="lg")
            
            gr.Markdown("### 💡 Example Tasks")
            gr.Examples(
                examples=examples,
                inputs=task_input,
                label=None
            )
    
    with gr.Row():
        with gr.Column():
            code_output = gr.Code(
                label="🐍 Generated Code",
                language="python",
                lines=15
            )
        
        with gr.Column():
            report_output = gr.Textbox(
                label="📊 Test Report",
                lines=15
            )
    
    # Wire up the button
    submit_btn.click(
        fn=generate_code,
        inputs=task_input,
        outputs=[code_output, report_output]
    )
    
    gr.Markdown(
        """
        ---
        ### ℹ️ How it works
        
        1. **Developer Agent** writes Python code based on your task
        2. **Tester Agent** creates test scenarios and executes the code
        3. You get working code + validation results!
        
        **Tech Stack**: LangGraph + FastAPI + Groq (llama-3.3-70b-versatile)
        """
    )


if __name__ == "__main__":
    print("🚀 Starting Gradio UI...")
    print(f"📡 API URL: {API_URL}")
    print("\n⚠️  Make sure the FastAPI server is running:")
    print("   uvicorn app:app --reload\n")
    
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False  # Set to True to get a public URL
    )

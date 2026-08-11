from agent import (
    DemoLLM,
    sanitize_professional_code,
    generate_artifact_filename,
    validate_code_output,
    developer_node as run_developer_node,
    tester_node as run_tester_node,
    CrewState
)
from langchain_core.messages import HumanMessage, AIMessage


class TestArtifactFilenameGenerator:
    """Test dynamic task-derived artifact filenames."""

    def test_java_linked_list_filename(self):
        fn = generate_artifact_filename("Create a Java program to implement a linked list", "java")
        assert fn == "LinkedList.java"

    def test_python_email_validator_filename(self):
        fn = generate_artifact_filename("Validate an email address in Python", "python")
        assert fn == "EmailValidator.py"

    def test_cpp_stack_filename(self):
        fn = generate_artifact_filename("Implement a generic stack in C++", "cpp")
        assert fn == "Stack.cpp"

    def test_java_binary_search_tree_filename(self):
        fn = generate_artifact_filename("Implement a Binary Search Tree in Java", "java")
        assert fn == "BinarySearchTree.java"

    def test_typescript_todo_service_filename(self):
        fn = generate_artifact_filename("Create a todo service in typescript", "typescript")
        assert fn == "TodoService.ts"

    def test_no_generic_filenames(self):
        generic_names = ["solution.txt", "generated_code.txt", "answer.md", "code.py", "solution.py"]
        for task in ["Linked List", "Email Validator", "Binary Search Tree", "Stack", "Fibonacci"]:
            for lang in ["java", "python", "cpp"]:
                fn = generate_artifact_filename(task, lang)
                assert fn not in generic_names
                assert not fn.endswith(".txt")
                assert not fn.endswith(".md")


class TestSanitizeProfessionalCode:
    """Test bulletproof removal of markdown fences, headers, and conversation."""

    def test_strip_markdown_code_fences(self):
        dirty_input = """```java
public class LinkedList {
    private Node head;
}
```"""
        clean = sanitize_professional_code(dirty_input, "java")
        assert "```" not in clean
        assert clean == "public class LinkedList {\n    private Node head;\n}"

    def test_strip_chat_preamble_and_postamble(self):
        dirty_input = """Here is the complete Java implementation for your linked list:

```java
public class LinkedList {
    private Node head;
}
```

Hope this helps! Let me know if you have any further questions.
### Complexity Analysis:
Time Complexity: O(n)"""
        clean = sanitize_professional_code(dirty_input, "java")
        assert "Here is the" not in clean
        assert "Hope this helps" not in clean
        assert "Complexity Analysis" not in clean
        assert "```" not in clean
        assert clean == "public class LinkedList {\n    private Node head;\n}"

    def test_strip_markdown_headers(self):
        dirty_input = """# Java Solution
## Implementation
public class LinkedList {
    private Node head;
}"""
        clean = sanitize_professional_code(dirty_input, "java")
        assert "# Java Solution" not in clean
        assert "## Implementation" not in clean
        assert clean == "public class LinkedList {\n    private Node head;\n}"


class TestCodeOutputValidation:
    """Test validator rejects broken/non-compilable code and chat output."""

    def test_validate_clean_python(self):
        code = "def add(a: int, b: int) -> int:\n    return a + b\n"
        is_valid, err = validate_code_output(code, "python")
        assert is_valid is True
        assert err is None

    def test_validate_broken_python_syntax(self):
        code = "def broken(\n    return 42"
        is_valid, err = validate_code_output(code, "python")
        assert is_valid is False
        assert "syntax error" in err.lower()

    def test_validate_clean_java(self):
        code = """public class LinkedList {
    private Node head;
    private static class Node {
        int data;
        Node next;
        Node(int data) { this.data = data; }
    }
}"""
        is_valid, err = validate_code_output(code, "java")
        assert is_valid is True
        assert err is None

    def test_validate_unbalanced_braces_java(self):
        code = "public class LinkedList { private Node head;"
        is_valid, err = validate_code_output(code, "java")
        assert is_valid is False
        assert "unbalanced" in err.lower()

    def test_validate_missing_class_java(self):
        code = "int x = 10; System.out.println(x);"
        is_valid, err = validate_code_output(code, "java")
        assert is_valid is False
        assert "missing class" in err.lower()

    def test_validate_rejects_markdown_fences(self):
        code = "```python\ndef add(a, b): return a + b\n```"
        is_valid, err = validate_code_output(code, "python")
        assert is_valid is False
        assert "markdown code fences" in err.lower()


class TestDemoLLMProfessionalCode:
    """Test DemoLLM generates clean, professional, compilable source code."""

    def test_java_linked_list_generation(self):
        llm = DemoLLM()
        response = llm.invoke([
            HumanMessage(content="Create a Java program to implement a linked list")
        ])
        code = response.content
        assert "```" not in code
        assert "#" not in code
        assert "public class LinkedList" in code
        assert "private Node head;" in code
        assert "private static class Node" in code
        assert "public void insert" in code
        assert "public boolean delete" in code
        assert "public void display" in code
        
        # Validate through compiler validator
        is_valid, err = validate_code_output(code, "java")
        assert is_valid is True, f"Java validation failed: {err}"

    def test_python_email_validator_generation(self):
        llm = DemoLLM()
        response = llm.invoke([
            HumanMessage(content="Validate an email address in Python")
        ])
        code = response.content
        assert "```" not in code
        assert "def validate_email" in code
        assert "re.compile" in code
        
        # Test compilation
        compile(code, "<string>", "exec")
        is_valid, err = validate_code_output(code, "python")
        assert is_valid is True

    def test_cpp_linked_list_generation(self):
        llm = DemoLLM()
        response = llm.invoke([
            HumanMessage(content="Implement a linked list in C++")
        ])
        code = response.content
        assert "```" not in code
        assert "#include <iostream>" in code
        assert "class LinkedList" in code
        assert "int main()" in code
        
        is_valid, err = validate_code_output(code, "cpp")
        assert is_valid is True


class TestTesterNodeRejection:
    """Test tester_node rejects broken code and provides actionable feedback."""

    def test_tester_node_rejects_uncompilable_code(self):
        broken_state: CrewState = {
            "messages": [HumanMessage(content="Create a Java linked list")],
            "code": "public class BrokenList { void test() { if (x > 0) }",
            "report": None,
            "execution_success": False,
            "iterations": 1,
            "max_iterations": 3,
            "language": "java"
        }
        result = run_tester_node(broken_state)
        assert result["execution_success"] is False
        assert "COMPILATION / SYNTAX ERROR" in result["report"]
        assert "Unbalanced curly braces" in result["report"]

    def test_tester_node_passes_valid_code(self):
        llm = DemoLLM()
        gen = llm.invoke([HumanMessage(content="Create a Java program to implement a linked list")])
        valid_state: CrewState = {
            "messages": [HumanMessage(content="Create a Java program to implement a linked list")],
            "code": gen.content,
            "report": None,
            "execution_success": False,
            "iterations": 1,
            "max_iterations": 3,
            "language": "java"
        }
        result = run_tester_node(valid_state)
        assert result["execution_success"] is True
        assert "All test scenarios evaluated successfully" in result["report"]

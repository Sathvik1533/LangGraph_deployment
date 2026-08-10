#!/usr/bin/env python3
"""
Setup Verification Script
=========================
Run this FIRST to check if everything is ready to go!

Usage: python verify_setup.py
"""

import sys
import os
from pathlib import Path


def print_header(text):
    """Print a nice header"""
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")


def print_success(text):
    """Print success message"""
    print(f"✅ {text}")


def print_error(text):
    """Print error message"""
    print(f"❌ {text}")


def print_warning(text):
    """Print warning message"""
    print(f"⚠️  {text}")


def check_python_version():
    """Check if Python version is 3.9+"""
    print_header("Checking Python Version")
    
    version = sys.version_info
    version_str = f"{version.major}.{version.minor}.{version.micro}"
    
    print(f"Python version: {version_str}")
    
    if version.major >= 3 and version.minor >= 9:
        print_success(f"Python {version_str} is compatible")
        return True
    else:
        print_error(f"Python {version_str} is too old. Need Python 3.9+")
        print("   Install from: https://www.python.org/downloads/")
        return False


def check_files_exist():
    """Check if all necessary files exist"""
    print_header("Checking Project Files")
    
    required_files = [
        "agent.py",
        "app.py",
        "requirements.txt",
        ".env",
    ]
    
    all_exist = True
    for file in required_files:
        if Path(file).exists():
            print_success(f"Found: {file}")
        else:
            print_error(f"Missing: {file}")
            all_exist = False
    
    return all_exist


def check_env_file():
    """Check if .env has GROQ_API_KEY"""
    print_header("Checking Environment Variables")
    
    if not Path(".env").exists():
        print_error(".env file not found")
        print("   Create it with: echo 'GROQ_API_KEY=your_key_here' > .env")
        return False
    
    with open(".env", "r") as f:
        content = f.read()
    
    if "GROQ_API_KEY" in content and "gsk_" in content:
        print_success("GROQ_API_KEY found in .env")
        # Don't print the actual key for security
        key_line = [line for line in content.split("\n") if "GROQ_API_KEY" in line][0]
        masked_key = key_line[:25] + "..." if len(key_line) > 25 else key_line
        print(f"   {masked_key}")
        return True
    else:
        print_error("GROQ_API_KEY not found or invalid in .env")
        print("   Format should be: GROQ_API_KEY=gsk_...")
        return False


def check_dependencies():
    """Check if required packages are installed"""
    print_header("Checking Dependencies")
    
    required_packages = [
        ("fastapi", "FastAPI"),
        ("uvicorn", "Uvicorn"),
        ("langchain_groq", "LangChain Groq"),
        ("langgraph", "LangGraph"),
        ("pydantic", "Pydantic"),
    ]
    
    missing = []
    for package, display_name in required_packages:
        try:
            __import__(package)
            print_success(f"{display_name} installed")
        except ImportError:
            print_error(f"{display_name} NOT installed")
            missing.append(package)
    
    if missing:
        print(f"\n⚠️  Missing packages. Install with:")
        print(f"   pip install -r requirements.txt")
        return False
    
    return True


def check_import_agent():
    """Try to import the agent module"""
    print_header("Testing Agent Import")
    
    try:
        sys.path.insert(0, os.getcwd())
        from agent import agent, CrewState
        print_success("Agent module imports successfully")
        return True
    except Exception as e:
        print_error(f"Cannot import agent: {e}")
        print("   Make sure you're in the project root directory")
        print(f"   Current directory: {os.getcwd()}")
        return False


def print_next_steps(all_checks_passed):
    """Print what to do next"""
    print_header("Next Steps")
    
    if all_checks_passed:
        print("🎉 All checks passed! You're ready to go!\n")
        print("Quick start:")
        print("  1. Test the agent:")
        print("     python test_agent.py\n")
        print("  2. Start the API:")
        print("     uvicorn app:app --reload\n")
        print("  3. Open documentation:")
        print("     open START_HERE.md\n")
    else:
        print("⚠️  Some checks failed. Fix the issues above and run this script again.\n")
        print("Common fixes:")
        print("  • Install dependencies:")
        print("    pip install -r requirements.txt\n")
        print("  • Set API key:")
        print("    echo 'GROQ_API_KEY=your_key_here' > .env\n")
        print("  • Make sure you're in project root:")
        print("    cd /Users/k.sathvik/LangGraph_deployment\n")


def main():
    """Run all checks"""
    print("\n" + "🔍 LangGraph Project Setup Verification")
    
    checks = [
        ("Python Version", check_python_version),
        ("Project Files", check_files_exist),
        ("Environment Variables", check_env_file),
        ("Dependencies", check_dependencies),
        ("Agent Import", check_import_agent),
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print_error(f"Check failed with error: {e}")
            results.append((name, False))
    
    # Summary
    print_header("Summary")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print(f"\n{passed}/{total} checks passed")
    
    all_passed = all(result for _, result in results)
    print_next_steps(all_passed)
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())

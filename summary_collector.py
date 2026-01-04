import os
import glob
import xml.etree.ElementTree as ET
import json
import time

def main():
    import sys
    # Force UTF-8 encoding for stdout to handle emojis
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except AttributeError:
            pass # Python < 3.7 or other environments
            
    backend_tests = [] # List of (file, name, status)
    frontend_tests = []
    backend_passed = 0
    backend_failed = 0
    frontend_passed = 0
    frontend_failed = 0
    
    start_time = time.time()
    
    # 1. Parse Backend Config (JUnit XML)
    backend_results_path = os.path.join("logs", "backend-results.xml")
    if os.path.exists(backend_results_path):
        try:
            tree = ET.parse(backend_results_path)
            root = tree.getroot()
            
            for testcase in root.findall(".//testcase"):
                name = testcase.get("name")
                classname = testcase.get("classname", "unknown")
                # pytest classname often includes the file path or module
                failure = testcase.find("failure")
                error = testcase.find("error")
                skipped = testcase.find("skipped")
                
                status = "passed"
                if failure is not None or error is not None:
                    status = "failed"
                elif skipped is not None:
                    status = "skipped"
                
                backend_tests.append((classname, name, status))
                
                if status == "passed": backend_passed += 1
                elif status == "failed": backend_failed += 1

        except Exception as e:
            print(f"Error reading backend results: {e}")
    
    # 2. Parse Frontend Config (Vitest JSON)
    frontend_results_path = os.path.join("logs", "frontend-results.json")
    if os.path.exists(frontend_results_path):
        try:
            with open(frontend_results_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            if 'testResults' in data:
                for test_file_result in data['testResults']:
                    file_path = test_file_result.get('name', 'unknown')
                    # Get relative path for cleaner output
                    rel_path = os.path.relpath(file_path, os.getcwd()) if os.path.isabs(file_path) else file_path
                    
                    for assertion in test_file_result.get('assertionResults', []):
                        title = assertion.get('title') or assertion.get('fullName')
                        status = assertion.get('status')
                        
                        frontend_tests.append((rel_path, title, status))
                        
                        if status == 'passed':
                            frontend_passed += 1
                        elif status == 'failed':
                            frontend_failed += 1
                                 
        except Exception as e:
            print(f"Error reading frontend results: {e}")
            
    # Summary Output
    total_passed = backend_passed + frontend_passed
    total_failed = backend_failed + frontend_failed
    duration = time.time() - start_time
    
    if total_failed == 0:
        print("\n✅ ALL TESTS PASSED")
    
    # If not "all passed" OR user wants visibility (Documentation mode)
    # We show the details now as requested.
    
    def print_section(title, tests):
        if not tests:
            return
        print(f"\n--- {title} ---")
        
        # Grouping logic
        if len(tests) > 10:
            groups = {}
            for file, name, status in tests:
                if file not in groups: groups[file] = []
                groups[file].append((name, status))
            
            for file, items in groups.items():
                print(f"  [{file}]")
                for name, status in items:
                    icon = "✅" if status == "passed" else "❌" if status == "failed" else "⏭️"
                    print(f"    {icon} {name}")
        else:
            for file, name, status in tests:
                icon = "✅" if status == "passed" else "❌" if status == "failed" else "⏭️"
                print(f"  {icon} {name}")

    print_section("Backend Tests", backend_tests)
    print_section("Frontend Tests", frontend_tests)

    if total_failed > 0:
        print("\n" + "="*40)
        print("          TEST SUMMARY")
        print("="*40)
        print(f"{'Type':<15} | {'Passed':<10} | {'Failed':<10}")
        print("-" * 40)
        print(f"{'Backend':<15} | {backend_passed:<10} | {backend_failed:<10}")
        print(f"{'Frontend':<15} | {frontend_passed:<10} | {frontend_failed:<10}")
        print("-" * 40)
        print(f"{'Total':<15} | {total_passed:<10} | {total_failed:<10}")
        print("="*40)
        
        # Details for failures (Short Summary)
        if backend_failed > 0 and os.path.exists(backend_results_path):
            print("\nBackend Failure Details:")
            try:
                tree = ET.parse(backend_results_path)
                for testcase in tree.findall(".//testcase"):
                    failure = testcase.find("failure")
                    if failure is not None:
                        name = testcase.get("name")
                        msg = failure.get("message", "Unknown error").split('\n')[0]
                        print(f" ❌ {name}: {msg}")
            except:
                pass

        if frontend_failed > 0 and os.path.exists(frontend_results_path):
            print("\nFrontend Failure Details:")
            try:
                with open(frontend_results_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                if 'testResults' in data:
                     for test_result in data['testResults']:
                        for assertion in test_result.get('assertionResults', []):
                            if assertion['status'] == 'failed':
                                title = assertion.get('title')
                                msgs = assertion.get('failureMessages', [])
                                short_msg = msgs[0].split('\n')[0] if msgs else "Unknown error"
                                print(f" ❌ {title}: {short_msg}")
            except:
                pass
    
    print(f"\nDuration: {duration:.2f}s")

if __name__ == "__main__":
    main()

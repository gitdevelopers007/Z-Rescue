import unittest
import sys
import os
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def run_all_tests():
    print("=" * 70)
    print("  Z-RESCUE | AUTOMATED TEST SUITE EXECUTION")
    print("  IBM Z Datathon 2026 | Team: UNI MIND | Event: SSF2026")
    print("=" * 70)
    
    loader = unittest.TestLoader()
    suite = loader.discover("backend/tests", pattern="test_*.py")
    
    runner = unittest.TextTestRunner(verbosity=2)
    start_time = time.time()
    result = runner.run(suite)
    duration = time.time() - start_time
    
    print("=" * 70)
    print(f"Total Tests Run: {result.testsRun}")
    print(f"Passed: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Execution Duration: {duration:.2f} seconds")
    print("=" * 70)
    
    if result.wasSuccessful():
        print(">>> ALL 25 BACKEND TESTS PASSED SUCCESSFULLY! <<<")
        return 0
    else:
        print(">>> SOME TESTS FAILED <<<")
        return 1

if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)

#!/bin/bash
# Run both backend and frontend test suites

cd "$(dirname "$0")/.." || exit 1
bash sh-scripts/run_backend_tests.sh
bash sh-scripts/run_frontend_tests.sh
echo "All tests complete."

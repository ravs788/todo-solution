#!/bin/bash
# Start the React frontend development server

cd "$(dirname "$0")/.." || exit 1
cd todo-frontend || exit 1
npm start

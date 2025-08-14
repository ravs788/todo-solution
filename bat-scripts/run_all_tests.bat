@echo off
call "%~dp0run_backend_tests.bat"
call "%~dp0run_frontend_tests.bat"
echo All tests complete.

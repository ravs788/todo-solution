@echo off
REM Change to the parent directory of this script (project root)
cd /d "%~dp0.."
cd todo-backend
REM By default, this will use application.properties with SQL Server config.
REM If you use a specific Spring profile (e.g., 'sqlserver'), set it below:
REM mvn spring-boot:run -Dspring-boot.run.profiles=sqlserver
REM Require path to native SQL Server JDBC auth DLL for Integrated Security
if "%MSSQL_JDBC_AUTH_DLL_DIR%"=="" (
  echo.
  echo ERROR: MSSQL_JDBC_AUTH_DLL_DIR is not set.
  echo Please set it to the folder containing mssql-jdbc_auth-12.10.1.x64.dll
  echo Example:
  echo     set MSSQL_JDBC_AUTH_DLL_DIR=C:\path\to\sqljdbc_12.10\enu\auth\x64
  echo Then re-run: bat-scripts\run_backend_sqlserver.bat
  exit /b 1
)

set "JVM_ARGS=-Djava.library.path=%MSSQL_JDBC_AUTH_DLL_DIR%"

echo Using java.library.path=%MSSQL_JDBC_AUTH_DLL_DIR%
mvn spring-boot:run -Dspring-boot.run.jvmArguments="%JVM_ARGS%"

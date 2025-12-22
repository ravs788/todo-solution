param(
  [int[]]$Ports = @(8081, 3000)
)

$ErrorActionPreference = 'SilentlyContinue'

function Kill-Port {
  param([int]$Port)

  $conns = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
  if (-not $conns) {
    Write-Output ("No process listening on port {0}" -f $Port)
    return
  }

  $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($pid in $pids) {
    try {
      Stop-Process -Id $pid -Force -ErrorAction Stop
      Write-Output ("Killed PID {0} on port {1}" -f $pid, $Port)
    } catch {
      Write-Output ("Failed to kill PID {0} on port {1}: {2}" -f $pid, $Port, $_.Exception.Message)
    }
  }
}

foreach ($p in $Ports) {
  Kill-Port -Port $p
}

Start-Sleep -Milliseconds 300

$still = @()
foreach ($p in $Ports) {
  if (Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue) {
    $still += $p
  }
}

if ($still.Count -gt 0) {
  Write-Output ("Ports still in use: {0}" -f ($still -join ', '))
  exit 1
} else {
  Write-Output "Requested ports are now free."
  exit 0
}

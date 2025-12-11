# Windows Port Cleanup Commands

This document contains useful PowerShell commands for managing Node.js development servers on Windows.

## Kill Process by Port Number

When Next.js or other Node.js dev servers don't shut down properly, you can force-kill them by port:

### Single Port
```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### Multiple Ports
```powershell
Get-NetTCPConnection -LocalPort 3000,3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

## Find Process Using Port

To find which process is using a specific port:

```powershell
Get-NetTCPConnection -LocalPort 3000 | Select-Object LocalPort,OwningProcess,State
```

## Alternative: Using netstat

```cmd
netstat -ano | findstr :3000
```

Then kill the process by PID:
```cmd
taskkill /F /PID <process_id>
```

## Common Use Cases

### Next.js Dev Server Cleanup
```powershell
# Kill all Next.js dev servers on common ports
Get-NetTCPConnection -LocalPort 3000,3001,3002 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### Backend API Cleanup
```powershell
# Kill backend API servers
Get-NetTCPConnection -LocalPort 5000,5001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

## Notes

- The `-ErrorAction SilentlyContinue` flag prevents errors if no process is using the port
- Use `-Force` with caution as it doesn't allow processes to clean up gracefully
- On production environments, prefer graceful shutdowns over force-killing processes

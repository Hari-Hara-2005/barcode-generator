import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SystemPrinter {
  name: string;
  isDefault: boolean;
  port: string;
  driver: string;
  status: string;
  isOnline: boolean;
  isRealPCPrinter: boolean;
}

export async function GET() {
  try {
    const isWindows = process.platform === 'win32';
    const printers: SystemPrinter[] = [];
    let detectedPorts: { name: string; status: string }[] = [];

    if (isWindows) {
      try {
        // Query installed Windows printers via PowerShell CIM
        const psCommand = `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Printer | Select-Object Name, Default, PortName, DriverName, PrinterStatus, Shared, Local | ConvertTo-Json -Compress"`;
        const { stdout } = await execAsync(psCommand, { timeout: 6000 });
        
        if (stdout && stdout.trim()) {
          const raw = JSON.parse(stdout.trim());
          const list = Array.isArray(raw) ? raw : [raw];
          for (const item of list) {
            if (item && item.Name) {
              printers.push({
                name: String(item.Name),
                isDefault: Boolean(item.Default),
                port: item.PortName ? String(item.PortName) : 'Default',
                driver: item.DriverName ? String(item.DriverName) : 'Standard',
                status: item.PrinterStatus === 3 || item.PrinterStatus === 1 ? 'Ready' : 'Online',
                isOnline: true,
                isRealPCPrinter: true,
              });
            }
          }
        }
      } catch (err) {
        console.warn('Could not query Win32_Printer:', err);
      }

      // Query connected hardware ports (COM, USB ports, Printer Queues)
      try {
        const pnpCommand = `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-PnpDevice -Class 'Ports','Printer' -Status OK | Select-Object FriendlyName, Status | ConvertTo-Json -Compress"`;
        const { stdout: pnpOut } = await execAsync(pnpCommand, { timeout: 5000 });
        if (pnpOut && pnpOut.trim()) {
          const pnpRaw = JSON.parse(pnpOut.trim());
          const pnpList = Array.isArray(pnpRaw) ? pnpRaw : [pnpRaw];
          for (const dev of pnpList) {
            if (dev && dev.FriendlyName) {
              detectedPorts.push({
                name: String(dev.FriendlyName),
                status: String(dev.Status || 'OK'),
              });
            }
          }
        }
      } catch {
        // Ignored
      }
    }

    // Default printer helper
    const defaultPrinter = printers.find((p) => p.isDefault)?.name || printers[0]?.name || null;

    return NextResponse.json({
      success: true,
      systemPrinters: printers,
      detectedPorts,
      defaultPrinter,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to query system printers',
        systemPrinters: [],
      },
      { status: 500 }
    );
  }
}

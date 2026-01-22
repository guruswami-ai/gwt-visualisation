import React, { useState } from 'react';
import { X, Copy, Terminal, Check } from 'lucide-react';

interface TelemetrySetupProps {
  onClose: () => void;
}

const TelemetrySetup: React.FC<TelemetrySetupProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);

  const scriptContent = `const http = require('http');
const os = require('os');
const { exec } = require('child_process');

const PORT = 3333;

// Helper to get real stats (Mac/Linux compatible)
const getStats = () => {
  return new Promise((resolve) => {
    // Basic OS stats
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const usedMemGB = parseFloat(((totalMem - freeMem) / (1024 ** 3)).toFixed(1));
    
    // CPU Load (1 min avg)
    const load = os.loadavg()[0]; 
    const cpuUsage = Math.round((load / os.cpus().length) * 100);

    // Mock Temp (Requires sudo/sensors usually, simulating based on load for safety)
    const temp = 40 + (cpuUsage * 0.5);

    // If running on Apple Silicon, you might use 'powermetrics' via exec for real power/temp
    // For now, we return standard Node OS metrics formatted for the dashboard
    
    const nodes = [
      { 
        id: 'n1', 
        name: 'muladhara', 
        status: 'active', 
        runtime: 'RUNNING', 
        generation: 10, 
        cpuUsage: Math.min(100, cpuUsage * 10), // Scaling up for visibility
        memoryUsage: usedMemGB, 
        temperature: Math.round(temp) 
      }
      // Add other nodes here if you have a cluster mesh
    ];
    
    resolve(nodes);
  });
};

const server = http.createServer(async (req, res) => {
  // CORS headers for browser access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/stats') {
    const data = await getStats();
    res.writeHead(200);
    res.end(JSON.stringify(data));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(\`⚡ Muladhara Telemetry Bridge running at http://localhost:\${PORT}\`);
  console.log('   Ready to connect to Universal Entropy Simulator...');
});`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded border border-indigo-500/20">
              <Terminal className="text-indigo-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-mono">Local Telemetry Bridge</h2>
              <p className="text-xs text-slate-500 font-mono">Connect Muladhara Hardware</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-300">1. Install Node.js</h3>
            <p className="text-sm text-slate-400">Ensure Node.js is installed on Muladhara. Then create a file named <code className="text-indigo-400">bridge.js</code>.</p>
          </div>

          <div className="relative group">
            <div className="absolute right-2 top-2">
               <button 
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-all border border-slate-600"
               >
                 {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                 {copied ? 'Copied!' : 'Copy Code'}
               </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto text-xs font-mono text-indigo-300/90 leading-relaxed">
              {scriptContent}
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-300">2. Run the Bridge</h3>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-sm text-emerald-400">
              $ node bridge.js
            </div>
          </div>

          <div className="space-y-2">
             <h3 className="text-sm font-bold text-slate-300">3. Connect</h3>
             <p className="text-sm text-slate-400">Toggle "Local Bridge" in the dashboard below.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TelemetrySetup;
import re

with open('app.py', 'r', encoding='utf-8') as f:
    app_code = f.read()

# 1. Add api/logs endpoint
logs_endpoint = '''
@app.route('/api/logs', methods=['GET'])
def get_logs():
    try:
        with open('logs/system.log', 'r', encoding='utf-8') as f:
            lines = f.readlines()
            return jsonify({"logs": lines[-30:]})
    except Exception as e:
        return jsonify({"logs": [f"System Booting..."]})
        
'''
if '/api/logs' not in app_code:
    app_code = app_code.replace('@app.route(\'/get_staff_list\', methods=[\'GET\'])', logs_endpoint + '\n@app.route(\'/get_staff_list\', methods=[\'GET\'])')

# 2. Modify the HTML to add a black Log window
# I will find the 'NEW AUTHORIZATION' block, and right after it or below the video feed?
# The video feed is in lg:col-span-8. We can split that into 2 rows, or add it below.
# Best place: Below the video feed.
# Change: flex flex-col h-[calc(100vh-8rem)]
# To: flex flex-col h-[calc(100vh-8rem)]
# And add a log window inside the col-span-8.

new_html = '''                <h3 class="font-mono text-sm tracking-widest"><i class="fa-solid fa-satellite-dish mr-2 text-blue-500"></i>LIVE_FEED</h3>
                  <span class="text-xs bg-red-900/50 text-red-500 border border-red-800 px-2 py-1 rounded font-bold"><i class="fa-solid fa-circle text-[8px] align-middle mr-1"></i>REC</span>
              </div>
              <div class="bg-[#050505] h-[60%] border-x border-slate-800 overflow-hidden relative shadow-2xl flex items-center justify-center p-2">
                  <img src="/video_feed" alt="Camera Signal Dropped" class="w-full h-full object-contain rounded-lg">
              </div>
              <div class="bg-black border border-slate-800 rounded-b-xl flex-1 flex flex-col">
                  <div class="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center text-slate-400">
                      <h3 class="font-mono text-xs tracking-widest"><i class="fa-solid fa-terminal mr-2 text-emerald-500"></i>SYSTEM_LOGS</h3>
                      <i class="fa-solid fa-microchip animate-pulse text-emerald-500"></i>
                  </div>
                  <div id="live_logs" class="p-3 overflow-y-auto font-mono text-[10px] text-emerald-500 flex-1 whitespace-pre-wrap tracking-wide leading-relaxed"></div>
              </div>
              '''
              
app_code = re.sub(r'              <h3 class="font-mono text-sm tracking-widest"><i class="fa-solid fa-satellite-dish mr-2 text-blue-500"></i>LIVE_FEED</h3>\s*<span class="text-xs bg-red-900\/50 text-red-500 border border-red-800 px-2 py-1 rounded font-bold"><i class="fa-solid fa-circle text-\[8px\] align-middle mr-1"></i>REC</span>\s*</div>\s*<div class="bg-\[#050505\] flex-1 border-x border-b border-slate-800 rounded-b-xl overflow-hidden relative shadow-2xl flex items-center justify-center p-2">\s*<img src="/video_feed" alt="Camera Signal Dropped" class="w-full h-full object-contain rounded-lg">\s*</div>', new_html, app_code)

# 3. Add javascript to fetch logs
js_fetch_logs = '''
        async function fetchLogs() {
            try {
                const r = await fetch('/api/logs');
                const d = await r.json();
                const logDiv = document.getElementById('live_logs');
                if(d.logs && logDiv) {
                    logDiv.innerHTML = d.logs.join('').replace(/INFO/g, '<span class="text-blue-400 font-bold">INFO</span>').replace(/ERROR/g, '<span class="text-red-500 font-bold">ERROR</span>').replace(/WARNING/g, '<span class="text-yellow-500 font-bold">WARNING</span>');
                    logDiv.scrollTop = logDiv.scrollHeight;
                }
            } catch(e){}
        }
        setInterval(fetchLogs, 1000);
        fetchStaff();
'''
app_code = app_code.replace('fetchStaff();\n        document.getElementById(\'enrollForm\').onsubmit', js_fetch_logs + '\n        document.getElementById(\'enrollForm\').onsubmit')

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(app_code)
print("UI Logs Implemented.")

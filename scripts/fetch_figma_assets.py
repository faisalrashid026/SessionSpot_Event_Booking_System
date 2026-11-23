"""Download only asset URLs returned by Figma design context; never used at runtime."""
from pathlib import Path
import json,subprocess,concurrent.futures
root=Path(__file__).resolve().parents[1];dest=root/'assets/figma';dest.mkdir(parents=True,exist_ok=True)
assets=json.loads((root/'qa/figma/asset-downloads.json').read_text())
def fetch(pair):
 name,url=pair
 subprocess.run(['curl','--fail','--location','--silent','--show-error','--max-time','45',url,'--output',str(dest/name)],check=True)
 return name
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for name in pool.map(fetch,assets.items()):print(name)

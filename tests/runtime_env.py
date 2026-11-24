"""Fail closed: HTTP acceptance suites may only use an explicit isolated test app."""
from pathlib import Path
import json, os, re, subprocess

if not os.environ.get('SESSIONSPOT_APP_ROOT') or not os.environ.get('SESSIONSPOT_TEST_URL'):
    raise SystemExit('Set SESSIONSPOT_APP_ROOT and SESSIONSPOT_TEST_URL for a fresh isolated verification extraction. Instructor/developer databases must not be used for automated fixtures.')
ROOT = Path(os.environ['SESSIONSPOT_APP_ROOT']).resolve()
BASE = os.environ['SESSIONSPOT_TEST_URL'].rstrip('/')
PHP = str(Path(os.environ.get('XAMPP_ROOT','/Applications/XAMPP/xamppfiles'))/'bin/php')
config = ROOT/'server/config.local.php'
if not config.is_file():
    raise SystemExit('Initialize the isolated test application before running acceptance tests.')
metadata = json.loads(subprocess.check_output([PHP,'-r',"$c=require $argv[1]; echo json_encode(['dsn'=>$c['dsn'],'base'=>$c['base_url']]);",str(config)],text=True))
database = re.search(r'dbname=([^;]+)',metadata['dsn']).group(1)
if not re.fullmatch(r'sessionspot_(?:verify|test)_[A-Za-z0-9_]+',database) or metadata['base'].rstrip('/') != BASE or 'unix_socket='+str(ROOT/'.local/mysql.sock')+';' not in metadata['dsn']:
    raise SystemExit('Refusing to run destructive fixture operations outside a matching isolated sessionspot_verify_* or sessionspot_test_* database.')
REPORT = Path(os.environ.get('SESSIONSPOT_REPORT_DIR',str(ROOT/'.local/test-results')))
REPORT.mkdir(parents=True,exist_ok=True,mode=0o700)

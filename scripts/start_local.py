"""Run isolated XAMPP Apache/PHP and MariaDB without resetting any database.

Fresh instances accept --port/--database/--base-path. Existing configurations are
reused, including after the isolated MariaDB is restarted during verification.
"""
from pathlib import Path
import argparse, getpass, json, os, re, secrets, subprocess, time
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
XAMPP = Path(os.environ.get('XAMPP_ROOT', '/Applications/XAMPP/xamppfiles'))
LOCAL = ROOT / '.local'
LOCAL.mkdir(mode=0o700, exist_ok=True)
(LOCAL / '.htaccess').write_text('Require all denied\n')

def run(args, **kwargs):
    return subprocess.run([str(a) for a in args], check=True, **kwargs)

def sql(statement):
    return run([XAMPP/'bin/mysql', '--no-defaults', '--socket='+str(LOCAL/'mysql.sock'), '-u', 'root'], input=statement, text=True, capture_output=True)

def process_running(file):
    try:
        os.kill(int(file.read_text().strip()), 0)
        return True
    except (FileNotFoundError, ValueError, ProcessLookupError):
        return False
    except PermissionError:
        return True

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--port', type=int)
parser.add_argument('--database')
parser.add_argument('--base-path')
args = parser.parse_args()
config = ROOT/'server/config.local.php'
existing = None
if config.exists():
    code = "$c=require $argv[1]; echo json_encode(['dsn'=>$c['dsn'],'base'=>$c['base_url']]);"
    existing = json.loads(subprocess.check_output([str(XAMPP/'bin/php'), '-r', code, str(config)], text=True))
    url = urlsplit(existing['base'])
    defaults = {'port': url.port or 80, 'database': re.search(r'dbname=([^;]+)', existing['dsn']).group(1), 'base_path': url.path.rstrip('/')}
else:
    defaults = {'port': 8080, 'database': 'sessionspot_instructor', 'base_path': '/Faisal/projecPart2'}
options = {key: getattr(args, key) if getattr(args, key) is not None else value for key, value in defaults.items()}
if existing and options != defaults:
    raise SystemExit('Existing configuration differs. Refusing to change its database or URL. Use a fresh extraction for a separate instance.')
if not 1024 <= options['port'] <= 65535 or not re.fullmatch(r'[A-Za-z0-9_]{1,64}', options['database']) or not re.fullmatch(r'(?:/[A-Za-z0-9_-]+)+', options['base_path']):
    raise SystemExit('Use an unprivileged port, a simple database identifier and a URL path such as /SessionSpot.')
base = f"http://localhost:{options['port']}{options['base_path']}"

if not (LOCAL/'mysql/mysql').exists():
    run([XAMPP/'bin/mysql_install_db', '--no-defaults', '--basedir='+str(XAMPP), '--datadir='+str(LOCAL/'mysql'), '--auth-root-authentication-method=normal', '--skip-test-db'], stdout=subprocess.DEVNULL)
if not process_running(LOCAL/'mysql.pid'):
    for name in ['mysql.sock', 'mysql.pid']:
        (LOCAL/name).unlink(missing_ok=True)
    with (LOCAL/'mysql-launch.log').open('ab') as log:
        subprocess.Popen([str(XAMPP/'sbin/mysqld'), '--no-defaults', '--basedir='+str(XAMPP), '--datadir='+str(LOCAL/'mysql'), '--socket='+str(LOCAL/'mysql.sock'), '--pid-file='+str(LOCAL/'mysql.pid'), '--skip-networking', '--log-error='+str(LOCAL/'mysql.log')], stdout=log, stderr=log, start_new_session=True)
for _ in range(100):
    try:
        sql('SELECT 1;')
        break
    except subprocess.CalledProcessError:
        time.sleep(.1)
else:
    raise SystemExit('MariaDB did not become available. Inspect .local/mysql.log; do not delete its database directory.')

if not existing:
    database = options['database']
    password = secrets.token_hex(32)
    username = 'ss_'+secrets.token_hex(8)
    sql(f"CREATE DATABASE IF NOT EXISTS `{database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER '{username}'@'localhost' IDENTIFIED BY '{password}'; GRANT SELECT,INSERT,UPDATE,DELETE ON `{database}`.* TO '{username}'@'localhost';")
    sql(f'USE `{database}`;\n'+(ROOT/'schema.sql').read_text())
    values = {'dsn':f'mysql:unix_socket={LOCAL / "mysql.sock"};dbname={database};charset=utf8mb4', 'db_user':username, 'db_password':password, 'base_url':base, 'mail_enabled':False, 'mail_from':'', 'support_email':''}
    writer = "file_put_contents($argv[1], \"<?php\\nreturn \".var_export(json_decode(stream_get_contents(STDIN),true),true).\";\\n\"); chmod($argv[1],0600);"
    run([XAMPP/'bin/php', '-r', writer, config], input=json.dumps(values), text=True, capture_output=True)

modules = ['unixd','authz_core','authz_host','dir','mime','log_config','headers','alias']
text = f'ServerRoot "{XAMPP}"\nServerName localhost\nListen 127.0.0.1:{options["port"]}\nPidFile "{LOCAL / "apache.pid"}"\n'
text += '\n'.join(f'LoadModule {m}_module modules/mod_{m}.so' for m in modules)+'\nLoadModule php_module modules/libphp.so\n'
text += f'User {getpass.getuser()}\nGroup staff\nDocumentRoot "{ROOT}"\nErrorLog "{LOCAL / "apache-error.log"}"\nLogLevel warn\n'
text += f'TypesConfig "{XAMPP / "etc/mime.types"}"\nDirectoryIndex index.html\nAddType application/x-httpd-php .php\n'
text += f'Alias {options["base_path"]} "{ROOT}"\n<Directory "{ROOT}">\nRequire all granted\nAllowOverride All\nOptions -Indexes\n</Directory>\n'
for folder in ['.git','.local','server','storage','tests','scripts','qa','checkpoints','submission','backups','design-reference']:
    text += f'<Directory "{ROOT / folder}">\nRequire all denied\n</Directory>\n'
text += f'php_admin_flag display_errors Off\nphp_admin_value error_log "{LOCAL / "php-error.log"}"\nphp_admin_value session.save_path "{LOCAL}"\n'
conf = LOCAL/'httpd.conf'
conf.write_text(text)
run([XAMPP/'bin/httpd','-f',conf,'-t'], capture_output=True)
if not process_running(LOCAL/'apache.pid'):
    (LOCAL/'apache.pid').unlink(missing_ok=True)
    try:
        run([XAMPP/'bin/httpd','-f',conf,'-k','start'])
    except subprocess.CalledProcessError:
        raise SystemExit(f'Apache could not start. Check port {options["port"]} and .local/apache-error.log; do not stop an unrelated service.')
print(f'XAMPP Apache/PHP + MariaDB ready: {base}/index.html')

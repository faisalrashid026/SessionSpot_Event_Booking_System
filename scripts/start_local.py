"""Start isolated XAMPP Apache/PHP and MariaDB without changing Part 1 or system services.
Local config/database/logs live in .local and server/config.local.php, excluded from packages.
"""
from pathlib import Path
import os, subprocess, time, secrets, json, getpass
ROOT=Path(__file__).resolve().parents[1]
XAMPP=Path('/Applications/XAMPP/xamppfiles')
LOCAL=ROOT/'.local'
LOCAL.mkdir(mode=0o700,exist_ok=True)
(LOCAL/'.htaccess').write_text('Require all denied\n')
def run(args, **kw): return subprocess.run([str(a) for a in args],check=True,**kw)
def sql(statement): return run([XAMPP/'bin/mysql','--no-defaults','--socket='+str(LOCAL/'mysql.sock'),'-u','root'],input=statement,text=True,capture_output=True)
if not (LOCAL/'mysql/mysql').exists():
    run([XAMPP/'bin/mysql_install_db','--no-defaults','--basedir='+str(XAMPP),'--datadir='+str(LOCAL/'mysql'),'--auth-root-authentication-method=normal','--skip-test-db'],stdout=subprocess.DEVNULL)
if not (LOCAL/'mysql.sock').exists():
    with (LOCAL/'mysql-launch.log').open('ab') as log:
        subprocess.Popen([str(XAMPP/'sbin/mysqld'),'--no-defaults','--basedir='+str(XAMPP),'--datadir='+str(LOCAL/'mysql'),'--socket='+str(LOCAL/'mysql.sock'),'--pid-file='+str(LOCAL/'mysql.pid'),'--skip-networking','--log-error='+str(LOCAL/'mysql.log')],stdout=log,stderr=log,start_new_session=True)
for _ in range(100):
    try: sql('SELECT 1;'); break
    except subprocess.CalledProcessError: time.sleep(.1)
else: raise SystemExit('MariaDB failed; inspect .local/mysql.log')
config=ROOT/'server/config.local.php'
if not config.exists():
    password=secrets.token_hex(32)
    sql("CREATE DATABASE IF NOT EXISTS sessionspot_v1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER IF NOT EXISTS 'sessionspot_app'@'localhost' IDENTIFIED BY '"+password+"'; ALTER USER 'sessionspot_app'@'localhost' IDENTIFIED BY '"+password+"'; GRANT SELECT,INSERT,UPDATE,DELETE ON sessionspot_v1.* TO 'sessionspot_app'@'localhost';")
    sql('USE sessionspot_v1;\n'+(ROOT/'schema.sql').read_text())
    config.write_text("<?php\nreturn "+"['dsn'=>"+repr('mysql:unix_socket='+str(LOCAL/'mysql.sock')+';dbname=sessionspot_v1;charset=utf8mb4')+",'db_user'=>'sessionspot_app','db_password'=>"+repr(password)+",'base_url'=>'http://localhost:8080/Faisal/projecPart2','mail_enabled'=>false,'mail_from'=>'','support_email'=>''];\n")
    config.chmod(0o600)
conf=LOCAL/'httpd.conf'
modules=['unixd','authz_core','authz_host','dir','mime','log_config','headers']
text='ServerRoot "'+str(XAMPP)+'"\nServerName localhost\nListen 127.0.0.1:8080\nPidFile "'+str(LOCAL/'apache.pid')+'"\n'
text+='\n'.join('LoadModule '+m+'_module modules/mod_'+m+'.so' for m in modules)+'\nLoadModule php_module modules/libphp.so\n'
text+='User '+getpass.getuser()+'\nGroup staff\nDocumentRoot "'+str(ROOT)+'"\nErrorLog "'+str(LOCAL/'apache-error.log')+'"\nLogLevel warn\n'
text+='TypesConfig "'+str(XAMPP/'etc/mime.types')+'"\nDirectoryIndex index.html\nAddType application/x-httpd-php .php\n'
text+='Alias /Faisal/projecPart2 "'+str(ROOT)+'"\n<Directory "'+str(ROOT)+'">\nRequire all granted\nAllowOverride All\nOptions -Indexes\n</Directory>\n'
for d in ['.local','server','storage','tests','scripts','qa','checkpoints','submission','backups','design-reference']:
    text+='<Directory "'+str(ROOT/d)+'">\nRequire all denied\n</Directory>\n'
text+='php_admin_flag display_errors Off\nphp_admin_value error_log "'+str(LOCAL/'php-error.log')+'"\nphp_admin_value session.save_path "'+str(LOCAL)+'"\n'
conf.write_text(text)
if not (LOCAL/'apache.pid').exists(): run([XAMPP/'bin/httpd','-f',conf,'-k','start'])
print('XAMPP Apache/PHP + MariaDB ready: http://localhost:8080/Faisal/projecPart2/index.html')

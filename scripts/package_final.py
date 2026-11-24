"""Create an allowlisted clean staging tree, then build/verify a new final ZIP.

Never zips the development directory indiscriminately and never overwrites a ZIP.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
from zipfile import ZipFile, ZIP_DEFLATED
import argparse, hashlib, json, re, shutil, subprocess, tempfile

ROOT = Path(__file__).resolve().parents[1]
PAGES = {n+'.html' for n in 'index event reserve confirmation my-bookings login register forgot-password reset-password profile dashboard create-event attendees admin help'.split()}
DOCS = ['README.md','DATABASE_SETUP.md','INSTRUCTOR_TESTING_GUIDE.md','TEST_REPORT.md']
TESTS = ['backend_api.py','stability_v1.py','runtime_env.py','static_audit.py','exports.test.mjs','v1_exports.test.mjs']

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def inventory():
    files = [ROOT/name for name in PAGES | set(DOCS) | {'.htaccess','.gitignore','schema.sql'}]
    for folder in ['css','js','assets','api']:
        files += [p for p in (ROOT/folder).rglob('*') if p.is_file() and not p.name.startswith('.')]
    files += [p for p in (ROOT/'server').glob('*.php') if p.name!='config.local.php']
    files += [ROOT/p for p in ['server/.htaccess','storage/.htaccess','storage/posters/.htaccess','storage/posters/.gitkeep','scripts/start_local.py','scripts/manage.php','scripts/seed_samples.php','scripts/package_final.py']]
    files += [ROOT/'tests'/name for name in TESTS]
    assert all(p.is_file() and not p.is_symlink() for p in files)
    return {p.relative_to(ROOT).as_posix(): p for p in files}

class References(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs=[]; self.ids=set()
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'): self.ids.add(a['id'])
        self.refs += [a[k] for k in ['href','src','action'] if a.get(k)]

def validate(root):
    assert {p.name for p in root.glob('*.html')}==PAGES
    assert {p.name for p in root.glob('*.md')}==set(DOCS)
    parsed={}
    for p in root.glob('*.html'):
        parser=References(); parser.feed(p.read_text()); parsed[p.resolve()]=parser
    checked=0
    def resolve(source,ref):
        nonlocal checked
        u=urlsplit(ref)
        if u.scheme or u.netloc: return
        assert not u.path.startswith('/'),(source,ref)
        target=(source.parent/unquote(u.path)).resolve() if u.path else source.resolve()
        assert target.is_relative_to(root.resolve()) and target.is_file(),(source,ref)
        if u.fragment and target in parsed: assert unquote(u.fragment) in parsed[target].ids,(source,ref)
        checked+=1
    for p,parser in parsed.items():
        for ref in parser.refs: resolve(p,ref)
    for p in root.glob('css/*.css'):
        for ref in re.findall(r'url\([\s\'"]*([^\)\'"\s]+)',p.read_text()): resolve(p,ref)
    for p in root.glob('js/*.js'):
        for ref in re.findall(r'from\s+[\'"]([^\'"]+)',p.read_text()): resolve(p,ref)
    assert not (root/'js/data.js').exists(), 'Legacy local-state authentication is not an application module.'
    php=Path('/Applications/XAMPP/xamppfiles/bin/php')
    if php.exists():
        for p in [*root.glob('server/*.php'),*root.glob('api/*.php'),*root.glob('scripts/*.php')]:
            subprocess.run([str(php),'-l',str(p)],check=True,capture_output=True)
    return checked

def hashes(root, names):
    return {name:sha(root/name) for name in sorted(names)}

def runtime_hash(values):
    runtime={k:v for k,v in values.items() if k.endswith('.html') or k.startswith(('css/','js/','assets/','api/','server/','scripts/')) or k=='schema.sql'}
    return hashlib.sha256(json.dumps(runtime,sort_keys=True).encode()).hexdigest()

def stage(target):
    target=target.resolve()
    if target==ROOT or target in ROOT.parents: raise ValueError('Staging must not replace the project or an ancestor.')
    if target.exists() and any(target.iterdir()): raise FileExistsError('Use an empty staging directory.')
    target.mkdir(parents=True,exist_ok=True)
    for name,source in inventory().items():
        destination=target/name; destination.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(source,destination)
    return {'staged':str(target),'files':len(inventory()),'references':validate(target)}

def build(target,output):
    expected=inventory(); names=set(expected)
    actual={p.relative_to(target).as_posix() for p in target.rglob('*') if p.is_file()}
    assert actual <= names|{'SUBMISSION_MANIFEST.json'} and names <= actual,'Staging contains missing/unapproved files.'
    assert not any(p.is_symlink() for p in target.rglob('*'))
    for name,source in expected.items(): assert sha(target/name)==sha(source),name
    refs=validate(target); values=hashes(target,names)
    manifest={'project':'SessionSpot V1 Final · COMP 3540 · Team G13','sha256':values,'runtimeSha256':runtime_hash(values),'excluded':'Git/history, prior releases, archives, local config, database/session/log files, private user uploads, historical fixtures and generated QA artifacts.'}
    (target/'SUBMISSION_MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
    output.parent.mkdir(parents=True,exist_ok=True)
    with ZipFile(output,'x',ZIP_DEFLATED) as z:
        for name in sorted(names|{'SUBMISSION_MANIFEST.json'}): z.write(target/name,'SessionSpot/'+name)
    extraction=Path(tempfile.mkdtemp(prefix='ssv1-final-',dir='/private/tmp'))
    with ZipFile(output) as z:
        assert z.testzip() is None
        entries=z.namelist(); assert len(entries)==len(set(entries))==len(names)+1
        assert all(n.startswith('SessionSpot/') and '..' not in Path(n).parts for n in entries)
        z.extractall(extraction)
    extracted=extraction/'Renamed SessionSpot';(extraction/'SessionSpot').rename(extracted)
    for name,h in values.items(): assert sha(extracted/name)==h,name
    validate(extracted)
    report={'pass':True,'zip':str(output),'sha256':sha(output),'files':len(entries),'bytes':output.stat().st_size,'htmlPages':15,'rootMarkdown':DOCS,'resolvedReferences':refs,'runtimeSha256':runtime_hash(values),'extractedDirectory':str(extracted),'checks':['clean allowlisted staging','source/stage hashes','no overwrite','safe unique entries','ZIP CRC','extracted file hashes','15-page dependency audit','PHP syntax','exactly four main Markdown files','no local secrets/database/QA/user uploads']}
    output.with_name(output.stem+'-verification.json').write_text(json.dumps(report,indent=2)+'\n')
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['stage','build'])
    parser.add_argument('--stage-dir',type=Path,required=True)
    parser.add_argument('--output',type=Path,default=ROOT/'submission/SessionSpot-V1-Fullstack-Final.zip')
    args=parser.parse_args()
    result=stage(args.stage_dir) if args.action=='stage' else build(args.stage_dir.resolve(),args.output.resolve())
    print(json.dumps(result,indent=2))

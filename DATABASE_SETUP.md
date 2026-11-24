# SessionSpot V1 — Database and XAMPP setup

## Requirements

PHP 8+ with PDO MySQL, Fileinfo, GD, Mbstring, JSON and sessions; MySQL/MariaDB with InnoDB and utf8mb4; Apache 2.4 with PHP, authz and headers support. This release was verified with XAMPP PHP 8.2.4, MariaDB 10.4.28 and Apache 2.4.56. JavaScript modules require HTTP, not `file://` or a Python static server. Node is optional for tests, not application execution.

## Standard XAMPP installation

1. Extract into your htdocs folder, for example `htdocs/SessionSpot`. Start Apache and MySQL using the XAMPP manager.
2. Create a **new dedicated database** (for example `sessionspot_instructor`) using phpMyAdmin or the MySQL CLI. Do not reuse/reset an unrelated database. Import `schema.sql`; it creates ten InnoDB tables and contains no users, passwords, bookings or fixture data.
3. Create a unique application database user with SELECT, INSERT, UPDATE and DELETE on only that database. Use a new random password; do not configure the web application as database root.
4. Copy `server/config.example.php` to `server/config.local.php`. Set the DSN (host/port/database or private Unix socket), limited database username/password and exact base URL. A standard local folder might use `http://localhost/SessionSpot`; include a nonstandard Apache port when necessary. Do not copy the developer's local credentials.
5. Make the local configuration readable only by its owner/Apache group as required. Make `storage/posters/` writable by Apache, without world-writable permissions. On standard Mac XAMPP the web user is normally `daemon`; the optional isolated launcher runs as the current user.
6. Enable `.htaccess` overrides and authz/headers modules. Directory listings and direct access to private configuration/storage/Git/tests/backups are denied. Keep the supplied root and storage protection files. User images are served through the PHP authorization endpoint, not as executable uploads.
7. Open your base URL plus `/api/index.php?action=bootstrap`. JSON with `ok: true` proves PHP/PDO/schema availability. Then open `/index.html` and register an account. A 503 is a real service/configuration error; there is no mock fallback.

No actual private password is supplied in this document or ZIP. Local config, databases, sessions, logs and user uploads are excluded from Git and releases.

## Optional isolated Mac XAMPP launcher

From a fresh extraction:

```sh
python3 scripts/start_local.py
```

It invokes XAMPP's supported `mysql_install_db`, `mysqld`, `mysql` and `httpd` binaries. The first start creates an isolated `.local/mysql` data directory, an empty instructor database and a random limited database credential. Apache binds loopback port 8080; MariaDB uses a private socket with TCP disabled. The default printed URL is `http://localhost:8080/Faisal/projecPart2/index.html`. Existing configuration/database contents are reused on subsequent starts, including after a service restart.

For a **separate fresh verification extraction**, with no local configuration yet:

```sh
python3 scripts/start_local.py --port 8081 --database sessionspot_verify_final --base-path /SessionSpot
```

This creates an independent data directory/database and serves that extraction at `http://localhost:8081/SessionSpot/index.html`. Existing instances reject conflicting URL/database options rather than silently changing them. `XAMPP_ROOT` may point to another Mac XAMPP installation; other operating systems can use the standard setup above.

## Empty versus optional educational samples

Empty is the default: no test identities, admin password or reservations are seeded. After registering an owner, a trusted local operator may run:

```sh
/Applications/XAMPP/xamppfiles/bin/php scripts/seed_samples.php --owner=owner@example.com
```

Enter the actual owner email, then confirm `SEED`. Two published events are labeled **Sample — ...**, described as educational examples rather than real third-party events, dated 14/21 days ahead in Vancouver time, with coherent free/CAD 12.50 ticket categories and capacities. No bookings or new accounts are created. Repeating the command leaves existing matching samples unchanged. Omit it to keep the database empty.

The developer's old acceptance data is preserved in its original development database. The active instructor preview uses a separate clean database; no genuine or test source records were deleted. Automated suites require a separate `sessionspot_verify_*`/`sessionspot_test_*` database and refuse the instructor database.

## Administrator provisioning and recovery

From a trusted terminal in the project folder:

```sh
/Applications/XAMPP/xamppfiles/bin/php scripts/manage.php create-admin
```

Use your installed PHP executable on other systems. Enter name, email and a new hidden password. There is no public Admin signup, default admin credential or browser role-switching shortcut. The private `--json-stdin` option is available to a trusted harness/password-manager pipe; never put real credentials into tracked files or command-line arguments. Admins sign in through the normal login page. Self-suspension/demotion and removal of the last active admin are rejected.

Without mail delivery, a trusted local operator can use:

```sh
/Applications/XAMPP/xamppfiles/bin/php scripts/manage.php reset-password
```

This privately changes the credential and revokes existing sessions. Alternatively `issue-reset` produces an operator-only single-use link expiring in 30 minutes; deliver it privately, never publish it. Web reset tokens are stored only as hashes and carried in URL fragments, not password query parameters.

## Email, security and common errors

Outbound mail is unconfigured by default. Configure/test PHP `mail()` or its relay, then set `mail_enabled`, a valid `mail_from` and `support_email` in the local config. Delivery failures are reported as errors. Actual outbound delivery is not certified by the local tests.

- Port conflict: inspect `lsof -nP -iTCP:8080 -sTCP:LISTEN` (or your selected port); do not stop an unrelated service. Use a fresh extraction with another port or configure standard XAMPP deliberately.
- Apache syntax: `/Applications/XAMPP/xamppfiles/bin/httpd -f "$PWD/.local/httpd.conf" -t`.
- Logs: `.local/apache-error.log`, `.local/php-error.log`, `.local/mysql.log`. Do not delete the database directory to fix startup.
- PDO access denied/unknown database: verify DSN, limited credentials and schema import. A private-socket instance intentionally has no port-3306 listener.
- Wrong base URL/CSRF failure: use the exact configured host/port/path, keep cookies enabled and reload the form.
- Poster failure: check GD/Fileinfo, the 1 MB/20-million-pixel limits and Apache's write permission on protected storage.

Use HTTPS outside loopback development. Session cookies are HttpOnly/SameSite; secure-cookie behavior follows HTTPS. Accounts are checked against database status/version and sessions expire/regenerate. Production operations still require backups, monitoring and proper host permissions; local acceptance tests are not a production penetration-test certification.

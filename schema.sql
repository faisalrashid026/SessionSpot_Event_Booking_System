-- Import into a dedicated database; no accounts, passwords or sample bookings are seeded.
SET NAMES utf8mb4;
CREATE TABLE IF NOT EXISTS users (
 id CHAR(32) PRIMARY KEY, name VARCHAR(80) NOT NULL, email VARCHAR(254) NOT NULL,
 password_hash VARCHAR(255) NOT NULL, role ENUM('User','Admin') NOT NULL DEFAULT 'User',
 status ENUM('Active','Suspended') NOT NULL DEFAULT 'Active', intent ENUM('Attendee','Organizer') NOT NULL DEFAULT 'Attendee',
 session_version INT UNSIGNED NOT NULL DEFAULT 1, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS organizations (
 id CHAR(32) PRIMARY KEY, owner_id CHAR(32) NOT NULL, name VARCHAR(120) NOT NULL,
 category VARCHAR(80) NOT NULL, website VARCHAR(500) NOT NULL DEFAULT '', description TEXT NOT NULL,
 status ENUM('Active','Suspended') NOT NULL DEFAULT 'Active', verified TINYINT(1) NOT NULL DEFAULT 0,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, KEY (owner_id),
 FOREIGN KEY (owner_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS events (
 id CHAR(32) PRIMARY KEY, owner_id CHAR(32) NOT NULL, organization_id CHAR(32) NULL,
 title VARCHAR(140) NOT NULL, description TEXT NOT NULL, category VARCHAR(80) NOT NULL,
 venue VARCHAR(160) NOT NULL, location VARCHAR(160) NOT NULL, event_date DATE NOT NULL,
 start_time TIME NOT NULL, end_time TIME NOT NULL, starts_at DATETIME NOT NULL, ends_at DATETIME NOT NULL,
 status ENUM('Draft','Published','Archived') NOT NULL DEFAULT 'Draft', before_archive ENUM('Draft','Published') NULL,
 poster_file VARCHAR(80) NULL, poster_mime VARCHAR(40) NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 KEY (owner_id), KEY (organization_id), KEY (status,starts_at),
 FOREIGN KEY (owner_id) REFERENCES users(id), FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS ticket_types (
 id CHAR(32) PRIMARY KEY, event_id CHAR(32) NOT NULL, client_key VARCHAR(80) NOT NULL,
 name VARCHAR(80) NOT NULL, description VARCHAR(160) NOT NULL DEFAULT '', price_cents INT UNSIGNED NOT NULL,
 capacity INT UNSIGNED NOT NULL, sold INT UNSIGNED NOT NULL DEFAULT 0,
 UNIQUE KEY (event_id,client_key), UNIQUE KEY (event_id,name), KEY (event_id),
 CONSTRAINT capacity_valid CHECK (capacity >= sold AND capacity > 0),
 FOREIGN KEY (event_id) REFERENCES events(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS bookings (
 id CHAR(32) PRIMARY KEY, reference VARCHAR(32) NOT NULL, user_id CHAR(32) NOT NULL, event_id CHAR(32) NOT NULL,
 attendee_name VARCHAR(80) NOT NULL, attendee_email VARCHAR(254) NOT NULL,
 status ENUM('Confirmed','Cancelled') NOT NULL DEFAULT 'Confirmed',
 payment_status ENUM('DueAtVenue','Free') NOT NULL, total_cents INT UNSIGNED NOT NULL,
 idempotency_key VARCHAR(100) NOT NULL, request_hash CHAR(64) NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, cancelled_at DATETIME NULL,
 UNIQUE KEY (reference), UNIQUE KEY (user_id,idempotency_key), KEY (event_id,status), KEY (user_id,created_at),
 FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (event_id) REFERENCES events(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS booking_items (
 booking_id CHAR(32) NOT NULL, ticket_type_id CHAR(32) NOT NULL, quantity INT UNSIGNED NOT NULL,
 unit_price_cents INT UNSIGNED NOT NULL, ticket_name VARCHAR(80) NOT NULL,
 PRIMARY KEY (booking_id,ticket_type_id), CHECK (quantity > 0),
 FOREIGN KEY (booking_id) REFERENCES bookings(id), FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS password_resets (
 token_hash CHAR(64) PRIMARY KEY, user_id CHAR(32) NOT NULL, expires_at DATETIME NOT NULL,
 used_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 KEY (user_id), FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS saved_events (
 user_id CHAR(32) NOT NULL, event_id CHAR(32) NOT NULL, PRIMARY KEY(user_id,event_id),
 FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (event_id) REFERENCES events(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS audit_log (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, actor_id CHAR(32) NULL, action VARCHAR(80) NOT NULL,
 target_id VARCHAR(80) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 KEY (actor_id,created_at), FOREIGN KEY (actor_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS rate_limits (
 bucket CHAR(64) PRIMARY KEY, attempts INT UNSIGNED NOT NULL DEFAULT 0, resets_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

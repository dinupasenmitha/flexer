-- FLEXER production schema: MySQL 8.0+ / MariaDB 10.6+
-- Prices are whole LKR amounts. Payment slips are deliberately not represented.

CREATE TABLE IF NOT EXISTS collections (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  range_key ENUM('budget', 'premium', 'branded') NOT NULL UNIQUE,
  description TEXT NULL,
  position SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  description TEXT NULL,
  position SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  collection_id BIGINT UNSIGNED NULL,
  category_id BIGINT UNSIGNED NULL,
  sku VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE,
  product_type ENUM('sunglasses', 'optical', 'accessory') NOT NULL,
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  price_lkr INT UNSIGNED NOT NULL,
  compare_at_price_lkr INT UNSIGNED NULL,
  short_description VARCHAR(500) NULL,
  description TEXT NULL,
  materials TEXT NULL,
  lens_specifications TEXT NULL,
  dimensions_json JSON NULL,
  inclusions_json JSON NULL,
  care_instructions TEXT NULL,
  warranty_months SMALLINT UNSIGNED NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  seo_title VARCHAR(180) NULL,
  seo_description VARCHAR(320) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_collection FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_products_status_type (status, product_type),
  INDEX idx_products_collection (collection_id),
  INDEX idx_products_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_variants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  color_name VARCHAR(100) NOT NULL,
  color_hex CHAR(7) NULL,
  price_lkr INT UNSIGNED NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  position SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_variants_product_active (product_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  variant_id BIGINT UNSIGNED NULL,
  path VARCHAR(255) NOT NULL,
  alt_text VARCHAR(255) NOT NULL,
  width SMALLINT UNSIGNED NULL,
  height SMALLINT UNSIGNED NULL,
  position SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_images_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
  INDEX idx_images_product_position (product_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(254) NULL UNIQUE,
  phone VARCHAR(32) NOT NULL,
  whatsapp_number VARCHAR(32) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customers_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_ref VARCHAR(32) NOT NULL UNIQUE,
  customer_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_method ENUM('bank_transfer', 'cod', 'koko') NOT NULL,
  payment_status ENUM('pending', 'awaiting_transfer', 'due_on_delivery', 'paid', 'koko_pending', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  recipient_name VARCHAR(160) NOT NULL,
  recipient_phone VARCHAR(32) NOT NULL,
  recipient_whatsapp VARCHAR(32) NOT NULL,
  email VARCHAR(254) NULL,
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255) NULL,
  city VARCHAR(120) NOT NULL,
  district VARCHAR(80) NOT NULL,
  postal_code VARCHAR(24) NULL,
  customer_note TEXT NULL,
  internal_note TEXT NULL,
  subtotal_lkr INT UNSIGNED NOT NULL,
  delivery_fee_lkr INT UNSIGNED NOT NULL DEFAULT 0,
  discount_lkr INT UNSIGNED NOT NULL DEFAULT 0,
  total_lkr INT UNSIGNED NOT NULL,
  whatsapp_opened_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_orders_status_created (status, created_at),
  INDEX idx_orders_payment_created (payment_status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  variant_id BIGINT UNSIGNED NULL,
  product_sku VARCHAR(100) NOT NULL,
  variant_sku VARCHAR(100) NULL,
  product_name VARCHAR(180) NOT NULL,
  color_name VARCHAR(100) NULL,
  image_path VARCHAR(255) NULL,
  unit_price_lkr INT UNSIGNED NOT NULL,
  quantity SMALLINT UNSIGNED NOT NULL,
  line_total_lkr INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT fk_order_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS testimonials (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  quote_text TEXT NOT NULL,
  product_label VARCHAR(180) NULL,
  rating TINYINT UNSIGNED NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  position SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faqs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question VARCHAR(500) NOT NULL,
  answer TEXT NOT NULL,
  page_key VARCHAR(80) NOT NULL DEFAULT 'home',
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  position SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  source VARCHAR(80) NOT NULL DEFAULT 'website',
  ip_hash CHAR(64) NULL,
  confirmed_at DATETIME NULL,
  unsubscribed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(120) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description VARCHAR(500) NOT NULL,
  is_secret TINYINT(1) NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner', 'manager', 'editor') NOT NULL DEFAULT 'editor',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_user_id BIGINT UNSIGNED NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(80) NOT NULL,
  action VARCHAR(120) NOT NULL,
  metadata_json JSON NULL,
  ip_hash CHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_admin FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_audit_entity (entity_type, entity_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

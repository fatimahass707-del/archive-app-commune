-- ============================================================
-- قاعدة بيانات نظام الأرشفة الإلكترونية للجماعة
-- ============================================================

CREATE DATABASE IF NOT EXISTS archive_jamaa
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE archive_jamaa;

-- جدول المستخدمين (الموظفين)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'agent') NOT NULL DEFAULT 'agent',
  department VARCHAR(150) DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول أصناف الوثائق (حالة مدنية، صفقات، عقارات...)
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  name_en VARCHAR(120) DEFAULT NULL,
  name_fr VARCHAR(120) DEFAULT NULL,
  description VARCHAR(255) DEFAULT NULL,
  description_en VARCHAR(255) DEFAULT NULL,
  description_fr VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الوثائق (مع دعم الحذف المؤقت Soft Delete)
CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  department VARCHAR(150) DEFAULT NULL,
  doc_year YEAR NOT NULL,
  description TEXT,
  file_path VARCHAR(500) DEFAULT NULL,
  file_original_name VARCHAR(255) DEFAULT NULL,
  status ENUM('active', 'archived') NOT NULL DEFAULT 'active',
  uploaded_by INT NOT NULL,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_title (title),
  INDEX idx_year (doc_year),
  INDEX idx_status (status),
  INDEX idx_deleted (deleted_at),
  FULLTEXT INDEX ft_title_desc (title, description)
);

-- جدول نسخ الوثائق (للنسخ السابقة)
CREATE TABLE IF NOT EXISTS document_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_original_name VARCHAR(255) NOT NULL,
  uploaded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- أصناف افتراضية شائعة فالجماعات
INSERT INTO categories (name, name_en, name_fr, description, description_en, description_fr) VALUES
  ('الحالة المدنية', 'Civil Status', 'État Civil', 'عقود الازدياد، الزواج، الوفاة', 'Birth, marriage, and death certificates', 'Actes de naissance, de mariage et de décès'),
  ('رخص البناء والتعمير', 'Building & Urban Planning Permits', 'Permis de Construire et Urbanisme', 'طلبات ورخص البناء', 'Building permit applications', 'Demandes de permis de construire'),
  ('الصفقات العمومية', 'Public Procurement', 'Marchés Publics', 'دفاتر التحملات والصفقات', 'Tender specifications and contracts', 'Cahiers des charges et marchés'),
  ('المراسلات الإدارية', 'Administrative Correspondence', 'Correspondance Administrative', 'المراسلات الواردة والصادرة', 'Incoming and outgoing correspondence', 'Courrier entrant et sortant'),
  ('الميزانية والمحاسبة', 'Budget and Accounting', 'Budget et Comptabilité', 'الوثائق المالية والمحاسبية', 'Financial and accounting documents', 'Documents financiers et comptables'),
  ('الموارد البشرية', 'Human Resources', 'Ressources Humaines', 'ملفات الموظفين والقرارات', 'Employee files and decisions', 'Dossiers du personnel et décisions')
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  name_en = VALUES(name_en),
  name_fr = VALUES(name_fr),
  description = VALUES(description),
  description_en = VALUES(description_en),
  description_fr = VALUES(description_fr);

-- جدول سجل التتبع والنشاط (Audit Logs)
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  action ENUM('create', 'update', 'delete', 'login') NOT NULL,
  table_name VARCHAR(50) DEFAULT NULL,
  record_id VARCHAR(50) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_created (created_at),
  INDEX idx_action (action),
  INDEX idx_user (user_id)
);

-- جدول أعضاء ومسؤولي مساحات الأصناف (Category Spaces)
CREATE TABLE IF NOT EXISTS category_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  user_id INT NOT NULL,
  role_in_space ENUM('member', 'lead') NOT NULL DEFAULT 'member',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_category_user (category_id, user_id),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- جدول رموز التجديد (Refresh Tokens)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
);

-- مستخدم admin افتراضي لأول تشغيل
-- الإيميل: admin@jamaa.ma  |  الكلمة السرية: Admin@1234
INSERT INTO users (full_name, email, password_hash, role, department) VALUES
  ('المدير العام', 'admin@jamaa.ma', '$2b$10$D23JndhEM0nLRfXt4m2xZO8cYD8.nKFlGG9JCBW8QjEtRkg6qkUCm', 'admin', 'الإدارة العامة')
ON DUPLICATE KEY UPDATE email = email;

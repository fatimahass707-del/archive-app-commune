-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: archive_jamaa
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(150) DEFAULT NULL,
  `action` enum('create','update','delete','login') NOT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `table_name` varchar(50) DEFAULT NULL,
  `record_id` varchar(50) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (1,1,'المدير العام','','قام بالولوج إلى النظام','2026-08-18 23:17:58',NULL,NULL,NULL),(2,1,'المدير العام','','قام بالولوج إلى النظام','2026-08-19 08:14:00',NULL,NULL,NULL),(3,1,NULL,'login',NULL,'2026-08-19 10:58:27','users','1','سجل الدخول بنجاح إلى النظام (المدير العام)'),(4,1,NULL,'login',NULL,'2026-08-19 10:59:59','users','1','سجل الدخول بنجاح إلى النظام (المدير العام)'),(5,1,NULL,'login',NULL,'2026-08-19 11:14:00','users','1','سجل الدخول بنجاح إلى النظام (المدير العام)'),(6,1,NULL,'update',NULL,'2026-08-19 11:17:06','documents','1','استرجع الوثيقة رقم DOC-2026-000001 (عقد ازدياد) من سلة المحذوفات'),(7,1,NULL,'delete',NULL,'2026-08-19 11:17:14','documents','1','نقل الوثيقة رقم DOC-2026-000001 (عقد ازدياد) لسلة المحذوفات'),(8,1,NULL,'login',NULL,'2026-08-19 11:25:53','users','1','سجل الدخول بنجاح إلى النظام (المدير العام)'),(9,1,NULL,'delete',NULL,'2026-08-19 11:35:06','documents','1','حذف الوثيقة نهائياً رقم DOC-2026-000001 (عقد ازدياد)'),(10,1,NULL,'create',NULL,'2026-08-19 11:35:31','documents','5','أضاف وثيقة رقم DOC-2026-000001 بعنوان \"عقد ازدياد\"'),(11,1,NULL,'delete',NULL,'2026-08-19 11:35:46','documents','5','نقل الوثيقة رقم DOC-2026-000001 (عقد ازدياد) لسلة المحذوفات'),(12,1,NULL,'delete',NULL,'2026-08-19 11:35:50','documents','5','حذف الوثيقة نهائياً رقم DOC-2026-000001 (عقد ازدياد)'),(13,1,NULL,'create',NULL,'2026-08-19 11:36:32','users','2','أنشأ مستخدماً جديداً: mohamed (mohamed@jamaa.ma) بدور agent'),(14,1,NULL,'update',NULL,'2026-08-19 11:36:52','تعيين موظف في مساحة','تم تعيين الموظف mohamed في مساحة \"الحالة المدنية\" ',NULL),(15,2,NULL,'login',NULL,'2026-08-19 11:37:15','users','2','سجل الدخول بنجاح إلى النظام (mohamed)'),(16,2,NULL,'create',NULL,'2026-08-19 11:38:43','documents','6','أضاف وثيقة رقم DOC-2026-000001 بعنوان \"hduhdujs\"'),(17,1,NULL,'login',NULL,'2026-08-19 12:17:17','users','1','سجل الدخول بنجاح إلى النظام (المدير العام)'),(18,1,NULL,'login',NULL,'2026-08-19 18:41:29','users','1','سجل الدخول بنجاح إلى النظام (المدير العام)'),(19,1,NULL,'delete',NULL,'2026-08-19 18:43:08','documents','6','نقل الوثيقة رقم DOC-2026-000001 (hduhdujs) لسلة المحذوفات'),(20,1,NULL,'update',NULL,'2026-08-19 18:43:18','documents','6','استرجع الوثيقة رقم DOC-2026-000001 (hduhdujs) من سلة المحذوفات'),(21,1,NULL,'login',NULL,'2026-08-19 21:21:11','users','1','سجل الدخول بنجاح إلى النظام (المدير العام)'),(22,2,NULL,'login',NULL,'2026-08-20 17:08:54','users','2','سجل الدخول بنجاح إلى النظام (mohamed)'),(23,1,NULL,'login',NULL,'2026-08-24 09:47:49','users','1','سجل الدخول بنجاح إلى النظام (المدير العام)'),(24,1,NULL,'delete',NULL,'2026-08-24 09:47:56','documents','6','نقل الوثيقة رقم DOC-2026-000001 (hduhdujs) لسلة المحذوفات'),(25,2,NULL,'login',NULL,'2026-08-24 09:50:26','users','2','سجل الدخول بنجاح إلى النظام (mohamed)'),(26,2,NULL,'login',NULL,'2026-08-24 09:57:52','users','2','سجل الدخول بنجاح إلى النظام (mohamed)'),(27,1,NULL,'login',NULL,'2026-08-24 10:12:35','users','1','سجل الدخول بنجاح إلى النظام (المدير العام)'),(28,1,NULL,'create',NULL,'2026-08-24 10:13:20','users','3','أنشأ مستخدماً جديداً: fatima. (fatima@jamaa.ma) بدور agent'),(29,1,NULL,'update',NULL,'2026-08-24 10:13:27','تعيين موظف في مساحة','تم تعيين الموظف fatima. في مساحة \"الحالة المدنية\" ',NULL),(30,3,NULL,'login',NULL,'2026-08-24 10:13:46','users','3','سجل الدخول بنجاح إلى النظام (fatima.)'),(31,2,NULL,'login',NULL,'2026-08-24 10:21:36','users','2','سجل الدخول بنجاح إلى النظام (mohamed)'),(32,2,NULL,'login',NULL,'2026-08-24 10:46:12','users','2','سجل الدخول بنجاح إلى النظام (mohamed)'),(33,2,NULL,'login',NULL,'2026-08-24 11:09:07','users','2','سجل الدخول بنجاح إلى النظام (mohamed)');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'الحالة المدنية','عقود الازدياد، الزواج، الوفاة','2026-08-18 23:15:35'),(2,'رخص البناء والتعمير','طلبات ورخص البناء','2026-08-18 23:15:35'),(3,'الصفقات العمومية','دفاتر التحملات والصفقات','2026-08-18 23:15:35'),(4,'الموارد البشرية','ملفات الموظفين والقرارات','2026-08-18 23:15:35'),(5,'المراسلات الإدارية','المراسلات الواردة والصادرة','2026-08-18 23:15:35'),(6,'الميزانية والمحاسبة','الوثائق المالية والمحاسبية','2026-08-18 23:15:35');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_members`
--

DROP TABLE IF EXISTS `category_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role_in_space` enum('member','lead') NOT NULL DEFAULT 'member',
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_category_user` (`category_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `category_members_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `category_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_members`
--

LOCK TABLES `category_members` WRITE;
/*!40000 ALTER TABLE `category_members` DISABLE KEYS */;
INSERT INTO `category_members` VALUES (1,1,2,'lead','2026-08-19 11:36:52'),(2,1,3,'member','2026-08-24 10:13:27');
/*!40000 ALTER TABLE `category_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_versions`
--

DROP TABLE IF EXISTS `document_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_versions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `document_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_original_name` varchar(255) NOT NULL,
  `uploaded_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `document_id` (`document_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `document_versions_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `document_versions_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_versions`
--

LOCK TABLES `document_versions` WRITE;
/*!40000 ALTER TABLE `document_versions` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_versions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reference_code` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `category_id` int(11) NOT NULL,
  `department` varchar(150) DEFAULT NULL,
  `doc_year` year(4) NOT NULL,
  `description` text DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_original_name` varchar(255) DEFAULT NULL,
  `status` enum('active','archived') NOT NULL DEFAULT 'active',
  `uploaded_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference_code` (`reference_code`),
  KEY `category_id` (`category_id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_title` (`title`),
  KEY `idx_year` (`doc_year`),
  KEY `idx_status` (`status`),
  KEY `idx_deleted` (`deleted_at`),
  FULLTEXT KEY `ft_title_desc` (`title`,`description`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (6,'DOC-2026-000001','hduhdujs',1,'مصلحة الحالة المدنية',2026,NULL,'/uploads/1787139523893-794764302.pdf','TP4.pdf','active',2,'2026-08-19 11:38:43','2026-08-24 09:47:56','2026-08-24 09:47:56');
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (14,1,'$2a$10$1.35.eewwBvpN93ZAjRsrueVOhLhkHwsPch.jcrHpZQLSCqhmTTGq','2026-08-31 11:12:35','2026-08-24 10:12:35'),(15,3,'$2a$10$vG9Zzo5bRxXoLuidt1Cp7.lnUMAOIhbAPlRDJwYk21P0sLdQe9ff6','2026-08-31 11:13:46','2026-08-24 10:13:46'),(18,2,'$2a$10$WEV3HyFbolU0x8sGxC/6S.7ZvYd0CXAz7FHXsX/8lw0/HkpyEKCiu','2026-08-31 12:09:07','2026-08-24 11:09:07');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','agent') NOT NULL DEFAULT 'agent',
  `department` varchar(150) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'المدير العام','admin@jamaa.ma','$2b$10$D23JndhEM0nLRfXt4m2xZO8cYD8.nKFlGG9JCBW8QjEtRkg6qkUCm','admin','الإدارة العامة',1,'2026-08-18 23:15:35'),(2,'mohamed','mohamed@jamaa.ma','$2a$10$cXhZchHbQExdZTnWAgZkbuSznzd69oYmsZnGVe1Ap3fDHoJz6Joh6','agent','مصلحة الحالة المدنية',1,'2026-08-19 11:36:32'),(3,'fatima.','fatima@jamaa.ma','$2a$10$eWKXtozZaEHDiIiKOF7ES.vZCfv1Mc1tCmNZzCvv075ZfJHW31QYi','agent','مصلحة الحالة المدنية',1,'2026-08-24 10:13:20');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-27 11:10:39

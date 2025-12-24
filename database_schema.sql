-- ========================================
-- ERP MAIN SYSTEM - DATABASE SCHEMA
-- Multi-Business ERP with Soft Deletes
-- ========================================

-- Create Database
CREATE DATABASE IF NOT EXISTS erp_main_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE erp_main_db;

-- ========================================
-- CORE AUDIT TRAIL (Common for all tables)
-- ========================================

-- Diamond Business Module
CREATE TABLE diamond_expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    expense_date DATETIME NOT NULL,
    expense_type ENUM('expense', 'income', 'transfer') NOT NULL DEFAULT 'expense',
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    status ENUM('Completed', 'Pending', 'Cancelled') DEFAULT 'Completed',
    
    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Indexes
    INDEX idx_diamond_expense_date (expense_date),
    INDEX idx_diamond_expense_category (category),
    INDEX idx_diamond_expense_type (expense_type),
    INDEX idx_diamond_expense_active (is_active)
) ENGINE=InnoDB;

-- ========================================
-- TEXTILE BUSINESS MODULE
-- ========================================

-- Textile Vendors
CREATE TABLE textile_vendors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vendor_name VARCHAR(200) NOT NULL,
    vendor_type ENUM('Grey Purchase', 'Dyeing', 'Finishing', 'Other') NOT NULL DEFAULT 'Grey Purchase',
    contact_info TEXT,
    address TEXT,
    
    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Indexes
    INDEX idx_vendor_name (vendor_name),
    INDEX idx_vendor_type (vendor_type),
    INDEX idx_vendor_active (is_active)
) ENGINE=InnoDB;

-- Textile Bills (Purchase Orders)
CREATE TABLE textile_bills (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vendor_id BIGINT,
    bill_number VARCHAR(100) NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE,
    credit_days INT DEFAULT 30,
    
    -- Financial Data
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    gst_included BOOLEAN DEFAULT FALSE,
    gst_rate DECIMAL(5,2) DEFAULT 0.00,
    gst_amount DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    balance_amount DECIMAL(15,2) DEFAULT 0.00,
    
    -- Status
    status ENUM('Unpaid', 'Partial', 'Paid', 'Overdue') DEFAULT 'Unpaid',
    
    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Foreign Keys
    FOREIGN KEY (vendor_id) REFERENCES textile_vendors(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_bill_number (bill_number),
    INDEX idx_bill_date (bill_date),
    INDEX idx_bill_vendor (vendor_id),
    INDEX idx_bill_status (status),
    INDEX idx_bill_due_date (due_date),
    INDEX idx_bill_active (is_active)
) ENGINE=InnoDB;

-- Textile Bill Items
CREATE TABLE textile_bill_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    
    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Foreign Keys
    FOREIGN KEY (bill_id) REFERENCES textile_bills(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_bill_item_bill (bill_id),
    INDEX idx_bill_item_name (item_name)
) ENGINE=InnoDB;

-- Textile Stock Management
CREATE TABLE textile_stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stock_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    vendor_id BIGINT,
    transaction_type ENUM('Purchase', 'Sale', 'Adjustment', 'Transfer') NOT NULL,
    reference_id BIGINT,
    
    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Foreign Keys
    FOREIGN KEY (vendor_id) REFERENCES textile_vendors(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_stock_name (stock_name),
    INDEX idx_stock_type (transaction_type),
    INDEX idx_stock_vendor (vendor_id),
    INDEX idx_stock_active (is_active)
) ENGINE=InnoDB;

-- Textile Sales
CREATE TABLE textile_sales (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(200) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    sale_date DATE NOT NULL,
    
    -- Financial Data
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    gst_included BOOLEAN DEFAULT FALSE,
    gst_rate DECIMAL(5,2) DEFAULT 0.00,
    gst_amount DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Status
    payment_status ENUM('Paid', 'Partial', 'Unpaid') DEFAULT 'Paid',
    
    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Indexes
    INDEX idx_sale_customer (customer_name),
    INDEX idx_sale_invoice (invoice_number),
    INDEX idx_sale_date (sale_date),
    INDEX idx_sale_active (is_active)
) ENGINE=InnoDB;

-- Textile Sale Items
CREATE TABLE textile_sale_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sale_id BIGINT NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    
    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Foreign Keys
    FOREIGN KEY (sale_id) REFERENCES textile_sales(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_sale_item_sale (sale_id),
    INDEX idx_sale_item_name (item_name)
) ENGINE=InnoDB;

-- Textile Item History (for price tracking)
CREATE TABLE textile_item_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(200) NOT NULL,
    last_price DECIMAL(10,2) NOT NULL,
    vendor_id BIGINT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_item_history_name (item_name)
) ENGINE=InnoDB;

-- Textile Expenses
CREATE TABLE textile_expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_mode ENUM('Cash', 'Bank', 'UPI', 'Cheque') DEFAULT 'Cash',
    
    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Indexes
    INDEX idx_expense_category (category),
    INDEX idx_expense_date (expense_date),
    INDEX idx_expense_mode (payment_mode),
    INDEX idx_expense_active (is_active)
) ENGINE=InnoDB;

-- Textile Cash Management
CREATE TABLE textile_cash_in_hand (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cash_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_cash_updated (last_updated)
) ENGINE=InnoDB;

-- ========================================
-- SAAS BUSINESS MODULE
-- ========================================

-- SaaS Leads Management
CREATE TABLE saas_leads (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(200),
    source VARCHAR(100),
    service VARCHAR(200),
    notes TEXT,
    score INT DEFAULT 50,
    status ENUM('New', 'Qualified', 'Negotiation', 'Converted', 'Lost') DEFAULT 'New',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    assigned_to VARCHAR(100),
    
    -- Dates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_contact DATETIME,
    next_follow_up DATE,
    
    -- Conversion
    converted_to BIGINT,
    
    -- Audit Trail
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Indexes
    INDEX idx_lead_name (name),
    INDEX idx_lead_email (email),
    INDEX idx_lead_status (status),
    INDEX idx_lead_company (company),
    INDEX idx_lead_source (source),
    INDEX idx_lead_service (service),
    INDEX idx_lead_score (score),
    INDEX idx_lead_priority (priority),
    INDEX idx_lead_assigned (assigned_to),
    INDEX idx_lead_follow_up (next_follow_up),
    INDEX idx_lead_active (is_active)
) ENGINE=InnoDB;

-- SaaS Lead Activities
CREATE TABLE saas_lead_activities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    activity_type ENUM('call', 'email', 'sms', 'note', 'status_change', 'followup') NOT NULL,
    description TEXT NOT NULL,
    notes TEXT,
    outcome VARCHAR(200),
    user_name VARCHAR(100) DEFAULT 'Current User',
    activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (lead_id) REFERENCES saas_leads(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_activity_lead (lead_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_activity_date (activity_date),
    INDEX idx_activity_user (user_name)
) ENGINE=InnoDB;

-- SaaS Deal Management
CREATE TABLE saas_deals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lead_id BIGINT,
    client_name VARCHAR(200) NOT NULL,
    client_email VARCHAR(200),
    company VARCHAR(200),
    deal_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    service VARCHAR(200),
    stage ENUM('Prospecting', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost') DEFAULT 'Prospecting',
    probability INT DEFAULT 10,
    expected_close_date DATE,
    notes TEXT,
    
    -- Dates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Audit Trail
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Foreign Keys
    FOREIGN KEY (lead_id) REFERENCES saas_leads(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_deal_client (client_name),
    INDEX idx_deal_email (client_email),
    INDEX idx_deal_company (company),
    INDEX idx_deal_stage (stage),
    INDEX idx_deal_service (service),
    INDEX idx_deal_value (deal_value),
    INDEX idx_deal_close_date (expected_close_date),
    INDEX idx_deal_active (is_active)
) ENGINE=InnoDB;

-- SaaS Deal Activities
CREATE TABLE saas_deal_activities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    deal_id BIGINT NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    from_stage VARCHAR(50),
    to_stage VARCHAR(50),
    notes TEXT,
    activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (deal_id) REFERENCES saas_deals(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_deal_activity_deal (deal_id),
    INDEX idx_deal_activity_type (activity_type),
    INDEX idx_deal_activity_date (activity_date)
) ENGINE=InnoDB;

-- SaaS Clients
CREATE TABLE saas_clients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    company VARCHAR(200),
    deal_id BIGINT,
    service VARCHAR(200),
    status ENUM('Active', 'Inactive', 'Suspended', 'Cancelled') DEFAULT 'Active',
    
    -- Dates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Audit Trail
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Foreign Keys
    FOREIGN KEY (deal_id) REFERENCES saas_deals(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_client_name (name),
    INDEX idx_client_email (email),
    INDEX idx_client_company (company),
    INDEX idx_client_status (status),
    INDEX idx_client_service (service),
    INDEX idx_client_active (is_active)
) ENGINE=InnoDB;

-- SaaS Subscriptions
CREATE TABLE saas_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT,
    client_name VARCHAR(200) NOT NULL,
    service VARCHAR(200) NOT NULL,
    monthly_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_contract_value DECIMAL(15,2) DEFAULT 0.00,
    billing_cycle ENUM('Monthly', 'Quarterly', 'Annual') DEFAULT 'Monthly',
    status ENUM('Active', 'Inactive', 'Cancelled', 'Suspended') DEFAULT 'Active',
    start_date DATE NOT NULL,
    next_billing_date DATE,
    last_billing_date DATE,
    
    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Foreign Keys
    FOREIGN KEY (client_id) REFERENCES saas_clients(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_subscription_client (client_name),
    INDEX idx_subscription_service (service),
    INDEX idx_subscription_status (status),
    INDEX idx_subscription_billing (next_billing_date),
    INDEX idx_subscription_active (is_active)
) ENGINE=InnoDB;

-- SaaS Subscription Billing History
CREATE TABLE saas_billing_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    subscription_id BIGINT NOT NULL,
    billing_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    notes TEXT,
    
    -- Foreign Keys
    FOREIGN KEY (subscription_id) REFERENCES saas_subscriptions(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_billing_subscription (subscription_id),
    INDEX idx_billing_date (billing_date),
    INDEX idx_billing_status (status)
) ENGINE=InnoDB;

-- SaaS Revenue
CREATE TABLE saas_revenue (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    source VARCHAR(100) NOT NULL,
    client_name VARCHAR(200),
    service VARCHAR(200),
    subscription_id BIGINT,
    revenue_date DATE NOT NULL,
    notes TEXT,
    revenue_type ENUM('contract', 'subscription', 'one_time', 'other') DEFAULT 'other',
    status ENUM('pending', 'confirmed', 'failed', 'refunded') DEFAULT 'confirmed',
    
    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Foreign Keys
    FOREIGN KEY (subscription_id) REFERENCES saas_subscriptions(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_revenue_source (source),
    INDEX idx_revenue_client (client_name),
    INDEX idx_revenue_service (service),
    INDEX idx_revenue_date (revenue_date),
    INDEX idx_revenue_type (revenue_type),
    INDEX idx_revenue_status (status),
    INDEX idx_revenue_active (is_active)
) ENGINE=InnoDB;

-- SaaS Goals
CREATE TABLE saas_goals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    goal_type VARCHAR(100) NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    current_amount DECIMAL(15,2) DEFAULT 0.00,
    goal_month INT NOT NULL,
    goal_year INT NOT NULL,
    description TEXT,
    
    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Indexes
    INDEX idx_goal_type (goal_type),
    INDEX idx_goal_period (goal_month, goal_year),
    INDEX idx_goal_active (is_active)
) ENGINE=InnoDB;

-- SaaS Expenses
CREATE TABLE saas_expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    expense_date DATE NOT NULL,
    vendor VARCHAR(200),
    
    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Indexes
    INDEX idx_saas_expense_category (category),
    INDEX idx_saas_expense_date (expense_date),
    INDEX idx_saas_expense_vendor (vendor),
    INDEX idx_saas_expense_active (is_active)
) ENGINE=InnoDB;

-- ========================================
-- SYSTEM CONFIGURATION & AUDIT
-- ========================================

-- System Settings
CREATE TABLE system_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB;

-- Audit Log for all changes
CREATE TABLE audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id BIGINT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'SOFT_RESTORE') NOT NULL,
    old_values JSON,
    new_values JSON,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_audit_table (table_name),
    INDEX idx_audit_record (record_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_changed_at (changed_at),
    INDEX idx_audit_changed_by (changed_by)
) ENGINE=InnoDB;

-- ========================================
-- INITIAL DATA SETUP
-- ========================================

-- Insert initial cash in hand record for textile
INSERT INTO textile_cash_in_hand (cash_amount) VALUES (0.00);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('system_version', '2.0.0', 'string', 'Current system version'),
('db_version', '2.0.0', 'string', 'Database schema version'),
('backup_enabled', 'true', 'boolean', 'Automatic backup enabled'),
('max_file_size', '10485760', 'number', 'Maximum file upload size in bytes'),
('session_timeout', '3600', 'number', 'Session timeout in seconds');

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- Active textile bills view
CREATE VIEW v_active_textile_bills AS
SELECT 
    b.id,
    b.bill_number,
    b.bill_date,
    b.due_date,
    v.vendor_name,
    b.total_amount,
    b.paid_amount,
    b.balance_amount,
    b.status,
    b.created_at
FROM textile_bills b
LEFT JOIN textile_vendors v ON b.vendor_id = v.id
WHERE b.is_active = TRUE AND b.deleted_at IS NULL;

-- Active SaaS leads view
CREATE VIEW v_active_saas_leads AS
SELECT 
    l.id,
    l.name,
    l.email,
    l.company,
    l.status,
    l.score,
    l.priority,
    l.source,
    l.service,
    l.next_follow_up,
    l.created_at
FROM saas_leads l
WHERE l.is_active = TRUE AND l.deleted_at IS NULL;

-- Revenue summary view
CREATE VIEW v_monthly_revenue_summary AS
SELECT 
    DATE_FORMAT(revenue_date, '%Y-%m') as month_year,
    SUM(amount) as total_revenue,
    COUNT(*) as transaction_count,
    AVG(amount) as avg_transaction
FROM saas_revenue 
WHERE is_active = TRUE AND deleted_at IS NULL
GROUP BY DATE_FORMAT(revenue_date, '%Y-%m')
ORDER BY month_year DESC;

-- ========================================
-- TRIGGERS FOR AUDIT TRAIL
-- ========================================

DELIMITER $$

-- Audit trigger for textile_bills
CREATE TRIGGER tr_textile_bills_audit_insert
AFTER INSERT ON textile_bills
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, record_id, action, new_values, changed_at)
    VALUES ('textile_bills', NEW.id, 'INSERT', JSON_OBJECT(
        'bill_number', NEW.bill_number,
        'total_amount', NEW.total_amount,
        'status', NEW.status
    ), NOW());
END$$

CREATE TRIGGER tr_textile_bills_audit_update
AFTER UPDATE ON textile_bills
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, changed_at)
    VALUES ('textile_bills', NEW.id, 'UPDATE', 
        JSON_OBJECT('status', OLD.status, 'total_amount', OLD.total_amount),
        JSON_OBJECT('status', NEW.status, 'total_amount', NEW.total_amount),
        NOW());
END$$

-- Audit trigger for saas_leads
CREATE TRIGGER tr_saas_leads_audit_insert
AFTER INSERT ON saas_leads
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, record_id, action, new_values, changed_at)
    VALUES ('saas_leads', NEW.id, 'INSERT', JSON_OBJECT(
        'name', NEW.name,
        'email', NEW.email,
        'status', NEW.status
    ), NOW());
END$$

DELIMITER ;

-- ========================================
-- FINAL SETUP COMPLETE
-- ========================================

-- Show completion message
SELECT 'Database schema created successfully!' as message;

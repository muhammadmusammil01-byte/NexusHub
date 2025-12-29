-- NexusHub Database Schema
-- Multi-tenant project incubation platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with multi-tenant support
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('SysAdmin', 'CenterAdmin', 'Mentor', 'Student')),
    center_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Training Centers table
CREATE TABLE centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    license_number VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table for marketplace
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    technology_stack TEXT[],
    price DECIMAL(10, 2) NOT NULL,
    center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    thumbnail_url TEXT,
    demo_video_url TEXT,
    watermark_text TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Content (protected)
CREATE TABLE project_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    content_hash VARCHAR(255),
    encrypted_content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Escrow Transactions
CREATE TABLE escrow_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    buyer_id UUID REFERENCES users(id),
    seller_center_id UUID REFERENCES centers(id),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'held', 'released', 'refunded', 'disputed')),
    payment_method VARCHAR(50),
    transaction_ref VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP,
    notes TEXT
);

-- Smart QR Certificates
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES escrow_transactions(id),
    student_id UUID REFERENCES users(id),
    center_id UUID REFERENCES centers(id),
    project_id UUID REFERENCES projects(id),
    certificate_code VARCHAR(255) UNIQUE NOT NULL,
    qr_data TEXT NOT NULL,
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT TRUE,
    certificate_url TEXT,
    metadata JSONB
);

-- Virtual Lab Sessions
CREATE TABLE lab_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID REFERENCES users(id),
    student_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    session_code VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- Lab Session Code Snapshots
CREATE TABLE code_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES lab_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    code_content TEXT,
    language VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Debugger Logs
CREATE TABLE debug_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES lab_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    error_message TEXT,
    code_snippet TEXT,
    ai_suggestion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content Protection Logs (anti-theft tracking)
CREATE TABLE content_protection_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_center ON users(center_id);
CREATE INDEX idx_projects_center ON projects(center_id);
CREATE INDEX idx_projects_published ON projects(is_published);
CREATE INDEX idx_escrow_status ON escrow_transactions(status);
CREATE INDEX idx_escrow_buyer ON escrow_transactions(buyer_id);
CREATE INDEX idx_certificates_code ON certificates(certificate_code);
CREATE INDEX idx_lab_sessions_status ON lab_sessions(status);
CREATE INDEX idx_lab_sessions_mentor ON lab_sessions(mentor_id);
CREATE INDEX idx_lab_sessions_student ON lab_sessions(student_id);

-- Add foreign key for user center
ALTER TABLE users ADD CONSTRAINT fk_user_center FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE SET NULL;

-- Insert default system admin (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('admin@nexushub.com', '$2b$10$7QXZ9YxKxN5KxX7XxXxXxOqGZ7XxXxXxXxXxXxXxXxXxXxXxXxXxX', 'System Administrator', 'SysAdmin');

-- Sample training center
INSERT INTO centers (name, description, contact_email, is_verified)
VALUES ('Demo Training Center', 'A demonstration training center for testing', 'demo@center.com', TRUE);

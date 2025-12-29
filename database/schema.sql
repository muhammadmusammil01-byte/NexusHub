-- NexusHub Database Schema
-- Multi-tenant project incubation platform with RBAC

-- Drop existing tables if they exist
DROP TABLE IF EXISTS escrow_transactions CASCADE;
DROP TABLE IF EXISTS certifications CASCADE;
DROP TABLE IF EXISTS project_enrollments CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS lab_sessions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS centers CASCADE;

-- Create centers table for multi-tenancy
CREATE TABLE centers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_email VARCHAR(255) UNIQUE NOT NULL,
    contact_phone VARCHAR(20),
    license_number VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    center_id INTEGER REFERENCES centers(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create roles table for RBAC
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert the four main roles
INSERT INTO roles (role_name, description) VALUES
    ('SysAdmin', 'System Administrator with full platform access'),
    ('CenterAdmin', 'Training Center Administrator managing center operations'),
    ('Mentor', 'Project mentor providing guidance and support'),
    ('Student', 'Student purchasing and working on projects');

-- Create user_roles junction table for many-to-many relationship
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- Create projects table for marketplace
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    center_id INTEGER NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    difficulty_level VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    duration_weeks INTEGER,
    technologies TEXT[],
    preview_image_url VARCHAR(500),
    demo_video_url VARCHAR(500),
    is_published BOOLEAN DEFAULT false,
    watermark_text VARCHAR(255),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create project_enrollments table
CREATE TABLE project_enrollments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'enrolled',
    progress_percentage INTEGER DEFAULT 0,
    UNIQUE(project_id, student_id)
);

-- Create escrow_transactions table for payment handling
CREATE TABLE escrow_transactions (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER NOT NULL REFERENCES project_enrollments(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    center_id INTEGER NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'held',
    payment_method VARCHAR(50),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    release_date TIMESTAMP,
    released_by INTEGER REFERENCES users(id),
    notes TEXT,
    CONSTRAINT valid_status CHECK (status IN ('held', 'released', 'refunded', 'cancelled'))
);

-- Create certifications table for Smart QR certificates
CREATE TABLE certifications (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER NOT NULL REFERENCES project_enrollments(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    center_id INTEGER NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    qr_code_data TEXT NOT NULL,
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    issued_by INTEGER REFERENCES users(id),
    verification_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lab_sessions table for Virtual Lab
CREATE TABLE lab_sessions (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER NOT NULL REFERENCES project_enrollments(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    code_snapshot TEXT,
    ai_interactions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_center ON users(center_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_projects_center ON projects(center_id);
CREATE INDEX idx_projects_published ON projects(is_published);
CREATE INDEX idx_enrollments_student ON project_enrollments(student_id);
CREATE INDEX idx_enrollments_project ON project_enrollments(project_id);
CREATE INDEX idx_escrow_status ON escrow_transactions(status);
CREATE INDEX idx_escrow_student ON escrow_transactions(student_id);
CREATE INDEX idx_certifications_student ON certifications(student_id);
CREATE INDEX idx_lab_sessions_active ON lab_sessions(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_centers_updated_at BEFORE UPDATE ON centers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments to tables
COMMENT ON TABLE escrow_transactions IS 'Stores payment transactions held in escrow until Smart QR Certificate is issued';
COMMENT ON TABLE user_roles IS 'Junction table for RBAC with SysAdmin, CenterAdmin, Mentor, Student roles';
COMMENT ON TABLE certifications IS 'Smart QR certificates issued upon project completion';
COMMENT ON TABLE lab_sessions IS 'Virtual Lab sessions with real-time code mirroring';

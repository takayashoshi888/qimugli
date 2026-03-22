DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STAFF',
    teamId TEXT,
    avatar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS sites;
CREATE TABLE sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS teams;
CREATE TABLE teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    leaderId TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS records;
CREATE TABLE records (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    userName TEXT NOT NULL,
    date TEXT NOT NULL,
    dayOfWeek TEXT NOT NULL,
    siteId TEXT NOT NULL,
    siteName TEXT NOT NULL,
    headCount INTEGER NOT NULL,
    parking INTEGER NOT NULL DEFAULT 0,
    transport INTEGER NOT NULL DEFAULT 0,
    highway INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'submitted',
    teamId TEXT,
    teamName TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Seed Data
INSERT INTO users (id, name, username, password, role, avatar) VALUES 
('u1', '管理员', 'admin', 'admin123', 'ADMIN', 'https://picsum.photos/200/200?random=1');
INSERT INTO users (id, name, username, password, role, teamId, avatar) VALUES 
('u2', '张伟', 'zhangwei', '123', 'STAFF', 't1', 'https://picsum.photos/200/200?random=2');
INSERT INTO users (id, name, username, password, role, teamId, avatar) VALUES 
('u3', '李娜', 'lina', '123', 'STAFF', 't1', 'https://picsum.photos/200/200?random=3');
INSERT INTO users (id, name, username, password, role, teamId, avatar) VALUES 
('u4', '王强', 'wangqiang', '123', 'STAFF', 't2', 'https://picsum.photos/200/200?random=4');

INSERT INTO sites (id, name, address, status) VALUES 
('s1', '滨江中心一期', '滨江路88号', 'active'),
('s2', '科技园北区改造', '科技大道102号', 'active'),
('s3', '老城维修项目', '解放路33号', 'pending');

INSERT INTO teams (id, name, leaderId) VALUES 
('t1', '安装一队', 'u2'),
('t2', '土建二队', 'u4');

INSERT INTO records (id, userId, userName, date, dayOfWeek, siteId, siteName, headCount, parking, transport, highway, status) VALUES 
('r1', 'u2', '张伟', '2023-10-23', '星期一', 's1', '滨江中心一期', 4, 2000, 5000, 0, 'approved'),
('r2', 'u2', '张伟', '2023-10-24', '星期二', 's1', '滨江中心一期', 4, 2000, 5000, 0, 'approved'),
('r3', 'u3', '李娜', '2023-10-23', '星期一', 's2', '科技园北区改造', 2, 0, 3000, 1500, 'approved'),
('r4', 'u4', '王强', '2023-10-25', '星期三', 's2', '科技园北区改造', 6, 5000, 10000, 4000, 'submitted');

-- =============================================================
-- Super Admin seed - PRODUCCIÓN
-- Email   : info@tamarindoparkfoundation.com
-- Password: Test123$  ← CAMBIAR AL PRIMER LOGIN
-- =============================================================

-- 1. Insertar Person (solo si no existe)
INSERT INTO person (first_name, second_name, first_lastname, second_lastname, email, phone_primary, created_at, updated_at)
SELECT 'Tamarindo', '', 'Park', 'Foundation', 'info@tamarindoparkfoundation.com', '+506 6461 2741', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM person WHERE email = 'info@tamarindoparkfoundation.com'
);

-- 2. Insertar User activo y verificado (solo si no existe)
INSERT INTO users (password, status, isEmailVerified, failedLoginAttempts, person_id, createdAt, updatedAt)
SELECT
    '$2b$10$.Ae6a4DeM.1itoLnOzsedO1Hei/eb0INks0jb1Cg0uxOnTl9gKnV2',
    1,     -- status: activo
    1,     -- isEmailVerified: verificado
    0,     -- failedLoginAttempts
    p.id_person,
    NOW(),
    NOW()
FROM person p
WHERE p.email = 'info@tamarindoparkfoundation.com'
AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.person_id = p.id_person
);

-- 3. Asignar rol super_admin (solo si no existe)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id_user, r.id_role
FROM users u
JOIN person p ON p.id_person = u.person_id
JOIN role r   ON r.name = 'super_admin'
WHERE p.email = 'info@tamarindoparkfoundation.com'
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = u.id_user AND ur.role_id = r.id_role
);

-- Verificar resultado
SELECT
    p.first_name, p.first_lastname, p.second_lastname,
    p.email, p.phone_primary,
    u.status, u.isEmailVerified,
    r.name AS role
FROM person p
JOIN users u       ON u.person_id = p.id_person
JOIN user_roles ur ON ur.user_id  = u.id_user
JOIN role r        ON r.id_role   = ur.role_id
WHERE p.email = 'info@tamarindoparkfoundation.com';

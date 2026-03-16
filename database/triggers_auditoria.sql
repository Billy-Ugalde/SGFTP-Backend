-- ================================================================
--  TRIGGERS DE AUDITORÍA — SGTPF  (script completo y corregido)
--  Tabla destino: audit_log
-- ================================================================
--
--  Ejecutar COMPLETO cada vez que se reinicie la base de datos.
--  TypeORM con synchronize:true puede eliminar triggers al recrear
--  tablas, por lo que puede ser necesario volver a correrlo.
--
--  TABLAS CUBIERTAS:
--    users, user_roles, entrepreneurs, entrepreneurships,
--    fair, fair_enrollment,
--    project, activity, activity_enrollment,
--    volunteers, news, content_blocks,
--    subscriber, donation, newsletter_campaigns
-- ================================================================
USE data_prueba;
DELIMITER $$

-- ════════════════════════════════════════════════════════════════
--  USUARIOS
--  Nota: la columna email NO está en users, viene de person
-- ════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_users_insert$$
CREATE TRIGGER trg_users_insert
AFTER INSERT ON users FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'INSERT', 'users', CAST(NEW.id_user AS CHAR),
        NULL,
        JSON_OBJECT('id_user', NEW.id_user, 'status', NEW.status),
        'SYSTEM'
    );
END$$

DROP TRIGGER IF EXISTS trg_users_update$$
CREATE TRIGGER trg_users_update
AFTER UPDATE ON users FOR EACH ROW
BEGIN
    IF OLD.password <> NEW.password THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            COALESCE(@audit_user_id, NEW.id_user), @audit_user_email,
            'PASSWORD_CHANGE', 'users', CAST(NEW.id_user AS CHAR),
            NULL, NULL, 'SYSTEM'
        );

    ELSEIF OLD.reset_token IS NULL AND NEW.reset_token IS NOT NULL THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'PASSWORD_RESET', 'users', CAST(NEW.id_user AS CHAR),
            NULL, NULL, 'SYSTEM'
        );

    ELSEIF OLD.isEmailVerified = 0 AND NEW.isEmailVerified = 1 THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            NEW.id_user, @audit_user_email,
            'STATUS_CHANGE', 'users', CAST(NEW.id_user AS CHAR),
            JSON_OBJECT('status', OLD.status, 'isEmailVerified', OLD.isEmailVerified),
            JSON_OBJECT('status', NEW.status, 'isEmailVerified', NEW.isEmailVerified),
            'SYSTEM'
        );

    ELSEIF OLD.status <> NEW.status THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'STATUS_CHANGE', 'users', CAST(NEW.id_user AS CHAR),
            JSON_OBJECT('status', OLD.status),
            JSON_OBJECT('status', NEW.status),
            'SYSTEM'
        );
    END IF;
END$$

-- ════════════════════════════════════════════════════════════════
--  ROLES DE USUARIO
-- ════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_user_roles_insert$$
CREATE TRIGGER trg_user_roles_insert
AFTER INSERT ON user_roles FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'ROLE_ASSIGNED', 'users', CAST(NEW.user_id AS CHAR),
        NULL,
        JSON_OBJECT('user_id', NEW.user_id, 'role_id', NEW.role_id),
        'SYSTEM'
    );
END$$

DROP TRIGGER IF EXISTS trg_user_roles_delete$$
CREATE TRIGGER trg_user_roles_delete
AFTER DELETE ON user_roles FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'ROLE_REMOVED', 'users', CAST(OLD.user_id AS CHAR),
        JSON_OBJECT('user_id', OLD.user_id, 'role_id', OLD.role_id),
        NULL,
        'SYSTEM'
    );
END$$

-- ════════════════════════════════════════════════════════════════
--  EMPRENDEDORES
-- ════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_entrepreneurs_insert$$
CREATE TRIGGER trg_entrepreneurs_insert
AFTER INSERT ON entrepreneurs FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'INSERT', 'entrepreneurs', CAST(NEW.id_entrepreneur AS CHAR),
        NULL,
        JSON_OBJECT('id_entrepreneur', NEW.id_entrepreneur, 'status', NEW.status, 'is_active', NEW.is_active),
        'SYSTEM'
    );
END$$

DROP TRIGGER IF EXISTS trg_entrepreneurs_update$$
CREATE TRIGGER trg_entrepreneurs_update
AFTER UPDATE ON entrepreneurs FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'STATUS_CHANGE',
            'entrepreneurs', CAST(NEW.id_entrepreneur AS CHAR),
            JSON_OBJECT('status', OLD.status, 'is_active', OLD.is_active),
            JSON_OBJECT('status', NEW.status, 'is_active', NEW.is_active),
            'SYSTEM'
        );

    ELSEIF OLD.is_active <> NEW.is_active THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'STATUS_CHANGE', 'entrepreneurs', CAST(NEW.id_entrepreneur AS CHAR),
            JSON_OBJECT('is_active', OLD.is_active),
            JSON_OBJECT('is_active', NEW.is_active),
            'SYSTEM'
        );

    ELSE
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'UPDATE', 'entrepreneurs', CAST(NEW.id_entrepreneur AS CHAR),
            JSON_OBJECT('experience', OLD.experience, 'facebook_url', OLD.facebook_url, 'instagram_url', OLD.instagram_url),
            JSON_OBJECT('experience', NEW.experience, 'facebook_url', NEW.facebook_url, 'instagram_url', NEW.instagram_url),
            'SYSTEM'
        );
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_entrepreneurs_delete$$
CREATE TRIGGER trg_entrepreneurs_delete
AFTER DELETE ON entrepreneurs FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'DELETE', 'entrepreneurs', CAST(OLD.id_entrepreneur AS CHAR),
        JSON_OBJECT('id_entrepreneur', OLD.id_entrepreneur, 'status', OLD.status),
        NULL,
        'SYSTEM'
    );
END$$

-- ════════════════════════════════════════════════════════════════
--  EMPRENDIMIENTOS
-- ════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_entrepreneurships_update$$
CREATE TRIGGER trg_entrepreneurships_update
AFTER UPDATE ON entrepreneurships FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'UPDATE', 'entrepreneurships', CAST(NEW.id_entrepreneurship AS CHAR),
        JSON_OBJECT('name', OLD.name, 'description', OLD.description, 'category', OLD.category, 'location', OLD.location),
        JSON_OBJECT('name', NEW.name, 'description', NEW.description, 'category', NEW.category, 'location', NEW.location),
        'SYSTEM'
    );
END$$

-- ════════════════════════════════════════════════════════════════
--  FERIAS  (tabla: fair — sin 's')
-- ════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_fairs_insert$$
CREATE TRIGGER trg_fairs_insert
AFTER INSERT ON fair FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'INSERT', 'fair', CAST(NEW.id_fair AS CHAR),
        NULL,
        JSON_OBJECT('name', NEW.name, 'location', NEW.location, 'date', NEW.date, 'stand_capacity', NEW.stand_capacity, 'typeFair', NEW.typeFair),
        'SYSTEM'
    );
END$$

DROP TRIGGER IF EXISTS trg_fairs_update$$
CREATE TRIGGER trg_fairs_update
AFTER UPDATE ON fair FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'STATUS_CHANGE', 'fair', CAST(NEW.id_fair AS CHAR),
            JSON_OBJECT('status', OLD.status),
            JSON_OBJECT('status', NEW.status),
            'SYSTEM'
        );

    ELSEIF OLD.archived <> NEW.archived THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'STATUS_CHANGE', 'fair', CAST(NEW.id_fair AS CHAR),
            JSON_OBJECT('archived', OLD.archived),
            JSON_OBJECT('archived', NEW.archived),
            'SYSTEM'
        );

    ELSE
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'UPDATE', 'fair', CAST(NEW.id_fair AS CHAR),
            JSON_OBJECT('name', OLD.name, 'location', OLD.location, 'date', OLD.date, 'stand_capacity', OLD.stand_capacity),
            JSON_OBJECT('name', NEW.name, 'location', NEW.location, 'date', NEW.date, 'stand_capacity', NEW.stand_capacity),
            'SYSTEM'
        );
    END IF;
END$$

-- ════════════════════════════════════════════════════════════════
--  INSCRIPCIONES A FERIAS
-- ════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_fair_enrollment_insert$$
CREATE TRIGGER trg_fair_enrollment_insert
AFTER INSERT ON fair_enrollment FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'INSERT', 'fair_enrollment', CAST(NEW.id_enrrolment_fair AS CHAR),
        NULL,
        JSON_OBJECT('id_fair', NEW.id_fair, 'id_entreprenuer', NEW.id_entreprenuer, 'status', NEW.status),
        'SYSTEM'
    );
END$$

DROP TRIGGER IF EXISTS trg_fair_enrollment_update$$
CREATE TRIGGER trg_fair_enrollment_update
AFTER UPDATE ON fair_enrollment FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'STATUS_CHANGE',
            'fair_enrollment', CAST(NEW.id_enrrolment_fair AS CHAR),
            JSON_OBJECT('status', OLD.status),
            JSON_OBJECT('status', NEW.status, 'id_stand', NEW.id_stand),
            'SYSTEM'
        );
    END IF;
END$$

-- ════════════════════════════════════════════════════════════════
--  PROYECTOS
-- ════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_project_insert$$
CREATE TRIGGER trg_project_insert
AFTER INSERT ON project FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'INSERT', 'project', CAST(NEW.Id_project AS CHAR),
        NULL,
        JSON_OBJECT('Name', NEW.Name, 'Status', NEW.Status, 'Active', NEW.Active, 'Location', NEW.Location),
        'SYSTEM'
    );
END$$

DROP TRIGGER IF EXISTS trg_project_update$$
CREATE TRIGGER trg_project_update
AFTER UPDATE ON project FOR EACH ROW
BEGIN
    IF OLD.Status <> NEW.Status THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'STATUS_CHANGE', 'project', CAST(NEW.Id_project AS CHAR),
            JSON_OBJECT('Status', OLD.Status, 'Active', OLD.Active),
            JSON_OBJECT('Status', NEW.Status, 'Active', NEW.Active),
            'SYSTEM'
        );

    ELSEIF OLD.Active <> NEW.Active THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'STATUS_CHANGE', 'project', CAST(NEW.Id_project AS CHAR),
            JSON_OBJECT('Active', OLD.Active),
            JSON_OBJECT('Active', NEW.Active),
            'SYSTEM'
        );

    ELSE
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'UPDATE', 'project', CAST(NEW.Id_project AS CHAR),
            JSON_OBJECT('Name', OLD.Name, 'Description', OLD.Description, 'Location', OLD.Location, 'Aim', OLD.Aim),
            JSON_OBJECT('Name', NEW.Name, 'Description', NEW.Description, 'Location', NEW.Location, 'Aim', NEW.Aim),
            'SYSTEM'
        );
    END IF;
END$$

-- ════════════════════════════════════════════════════════════════
--  ACTIVIDADES
-- ════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_activity_insert$$
CREATE TRIGGER trg_activity_insert
AFTER INSERT ON activity FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'INSERT', 'activity', CAST(NEW.Id_activity AS CHAR),
        NULL,
        JSON_OBJECT('Name', NEW.Name, 'Status_activity', NEW.Status_activity, 'Spaces', NEW.Spaces, 'Id_project', NEW.Id_project),
        'SYSTEM'
    );
END$$

DROP TRIGGER IF EXISTS trg_activity_update$$
CREATE TRIGGER trg_activity_update
AFTER UPDATE ON activity FOR EACH ROW
BEGIN
    IF OLD.Status_activity <> NEW.Status_activity THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'STATUS_CHANGE', 'activity', CAST(NEW.Id_activity AS CHAR),
            JSON_OBJECT('Status_activity', OLD.Status_activity),
            JSON_OBJECT('Status_activity', NEW.Status_activity),
            'SYSTEM'
        );

    ELSEIF OLD.Active <> NEW.Active THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'STATUS_CHANGE', 'activity', CAST(NEW.Id_activity AS CHAR),
            JSON_OBJECT('Active', OLD.Active),
            JSON_OBJECT('Active', NEW.Active),
            'SYSTEM'
        );

    ELSEIF OLD.OpenForRegistration <> NEW.OpenForRegistration THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'STATUS_CHANGE', 'activity', CAST(NEW.Id_activity AS CHAR),
            JSON_OBJECT('OpenForRegistration', OLD.OpenForRegistration),
            JSON_OBJECT('OpenForRegistration', NEW.OpenForRegistration),
            'SYSTEM'
        );

    ELSE
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'UPDATE', 'activity', CAST(NEW.Id_activity AS CHAR),
            JSON_OBJECT('Name', OLD.Name, 'Description', OLD.Description, 'Spaces', OLD.Spaces, 'Location', OLD.Location),
            JSON_OBJECT('Name', NEW.Name, 'Description', NEW.Description, 'Spaces', NEW.Spaces, 'Location', NEW.Location),
            'SYSTEM'
        );
    END IF;
END$$

-- ════════════════════════════════════════════════════════════════
--  INSCRIPCIONES A ACTIVIDADES
-- ════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_activity_enrollment_insert$$
CREATE TRIGGER trg_activity_enrollment_insert
AFTER INSERT ON activity_enrollment FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'INSERT', 'activity_enrollment', CAST(NEW.id_enrollment_activity AS CHAR),
        NULL,
        JSON_OBJECT('id_volunteer', NEW.id_volunteer, 'id_activity', NEW.id_activity, 'status', NEW.status),
        'SYSTEM'
    );
END$$

DROP TRIGGER IF EXISTS trg_activity_enrollment_update$$
CREATE TRIGGER trg_activity_enrollment_update
AFTER UPDATE ON activity_enrollment FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'STATUS_CHANGE', 'activity_enrollment', CAST(NEW.id_enrollment_activity AS CHAR),
            JSON_OBJECT('status', OLD.status),
            JSON_OBJECT('status', NEW.status, 'attendance_date', NEW.attendance_date),
            'SYSTEM'
        );
    END IF;
END$$

-- ════════════════════════════════════════════════════════════════
--  VOLUNTARIOS
-- ════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_volunteers_insert$$
CREATE TRIGGER trg_volunteers_insert
AFTER INSERT ON volunteers FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'INSERT', 'volunteers', CAST(NEW.id_volunteer AS CHAR),
        NULL,
        JSON_OBJECT('id_volunteer', NEW.id_volunteer, 'is_active', NEW.is_active),
        'SYSTEM'
    );
END$$

DROP TRIGGER IF EXISTS trg_volunteers_update$$
CREATE TRIGGER trg_volunteers_update
AFTER UPDATE ON volunteers FOR EACH ROW
BEGIN
    IF OLD.is_active <> NEW.is_active THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'STATUS_CHANGE', 'volunteers', CAST(NEW.id_volunteer AS CHAR),
            JSON_OBJECT('is_active', OLD.is_active),
            JSON_OBJECT('is_active', NEW.is_active),
            'SYSTEM'
        );
    END IF;
END$$

-- ════════════════════════════════════════════════════════════════
--  NOTICIAS
-- ════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_news_insert$$
CREATE TRIGGER trg_news_insert
AFTER INSERT ON news FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'INSERT', 'news', CAST(NEW.id_news AS CHAR),
        NULL,
        JSON_OBJECT('title', NEW.title, 'status', NEW.status, 'author', NEW.author),
        'SYSTEM'
    );
END$$

DROP TRIGGER IF EXISTS trg_news_update$$
CREATE TRIGGER trg_news_update
AFTER UPDATE ON news FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'STATUS_CHANGE', 'news', CAST(NEW.id_news AS CHAR),
            JSON_OBJECT('status', OLD.status),
            JSON_OBJECT('status', NEW.status),
            'SYSTEM'
        );
    ELSE
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'UPDATE', 'news', CAST(NEW.id_news AS CHAR),
            JSON_OBJECT('title', OLD.title, 'author', OLD.author, 'status', OLD.status),
            JSON_OBJECT('title', NEW.title, 'author', NEW.author, 'status', NEW.status),
            'SYSTEM'
        );
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_news_delete$$
CREATE TRIGGER trg_news_delete
AFTER DELETE ON news FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'DELETE', 'news', CAST(OLD.id_news AS CHAR),
        JSON_OBJECT('title', OLD.title, 'status', OLD.status, 'author', OLD.author),
        NULL,
        'SYSTEM'
    );
END$$

-- ════════════════════════════════════════════════════════════════
--  BLOQUES DE CONTENIDO
-- ════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_content_blocks_update$$
CREATE TRIGGER trg_content_blocks_update
AFTER UPDATE ON content_blocks FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'UPDATE', 'content_blocks', CAST(NEW.id AS CHAR),
        JSON_OBJECT('text_content', OLD.text_content, 'image_url', OLD.image_url),
        JSON_OBJECT('text_content', NEW.text_content, 'image_url', NEW.image_url),
        'SYSTEM'
    );
END$$

DROP TRIGGER IF EXISTS trg_content_blocks_delete$$
CREATE TRIGGER trg_content_blocks_delete
AFTER DELETE ON content_blocks FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'DELETE', 'content_blocks', CAST(OLD.id AS CHAR),
        JSON_OBJECT('page', OLD.page, 'section', OLD.section, 'block_key', OLD.block_key, 'text_content', OLD.text_content),
        NULL,
        'SYSTEM'
    );
END$$

-- ════════════════════════════════════════════════════════════════
--  SUSCRIPTORES  (tabla: subscriber — singular)
-- ════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_subscribers_insert$$
CREATE TRIGGER trg_subscribers_insert
AFTER INSERT ON subscriber FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'INSERT', 'subscriber', CAST(NEW.id AS CHAR),
        NULL,
        JSON_OBJECT('email', NEW.email),
        'SYSTEM'
    );
END$$

DROP TRIGGER IF EXISTS trg_subscribers_delete$$
CREATE TRIGGER trg_subscribers_delete
AFTER DELETE ON subscriber FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'DELETE', 'subscriber', CAST(OLD.id AS CHAR),
        JSON_OBJECT('email', OLD.email),
        NULL,
        'SYSTEM'
    );
END$$

-- ════════════════════════════════════════════════════════════════
--  DONACIONES
-- ════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_donation_insert$$
CREATE TRIGGER trg_donation_insert
AFTER INSERT ON donation FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'INSERT', 'donation', CAST(NEW.idDonation AS CHAR),
        NULL,
        JSON_OBJECT('donationType', NEW.donationType, 'donationDetails', NEW.donationDetails, 'status', NEW.status, 'idDonor', NEW.idDonor),
        'SYSTEM'
    );
END$$

DROP TRIGGER IF EXISTS trg_donation_update$$
CREATE TRIGGER trg_donation_update
AFTER UPDATE ON donation FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'STATUS_CHANGE', 'donation', CAST(NEW.idDonation AS CHAR),
            JSON_OBJECT('status', OLD.status),
            JSON_OBJECT('status', NEW.status),
            'SYSTEM'
        );
    ELSE
        INSERT INTO audit_log
            (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
        VALUES (
            @audit_user_id, @audit_user_email,
            'UPDATE', 'donation', CAST(NEW.idDonation AS CHAR),
            JSON_OBJECT('donationType', OLD.donationType, 'donationDetails', OLD.donationDetails, 'status', OLD.status),
            JSON_OBJECT('donationType', NEW.donationType, 'donationDetails', NEW.donationDetails, 'status', NEW.status),
            'SYSTEM'
        );
    END IF;
END$$

-- ════════════════════════════════════════════════════════════════
--  CAMPAÑAS DE NEWSLETTER
-- ════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_newsletter_campaigns_insert$$
CREATE TRIGGER trg_newsletter_campaigns_insert
AFTER INSERT ON newsletter_campaigns FOR EACH ROW
BEGIN
    INSERT INTO audit_log
        (user_id, user_email, action, entity, entity_id, old_value, new_value, source)
    VALUES (
        @audit_user_id, @audit_user_email,
        'INSERT', 'newsletter_campaigns', CAST(NEW.id AS CHAR),
        NULL,
        JSON_OBJECT('subject', NEW.subject, 'language', NEW.language, 'status', NEW.status,
                    'totalRecipients', NEW.totalRecipients, 'successfulSends', NEW.successfulSends, 'failedSends', NEW.failedSends),
        'SYSTEM'
    );
END$$

DELIMITER ;

-- ================================================================
--  VERIFICAR — debe mostrar 28 triggers
-- ================================================================
SHOW TRIGGERS;

export enum AuditAction {
    INSERT           = 'INSERT',
    UPDATE           = 'UPDATE',
    DELETE           = 'DELETE',
    ROLE_ASSIGNED    = 'ROLE_ASSIGNED',
    ROLE_REMOVED     = 'ROLE_REMOVED',
    STATUS_CHANGE    = 'STATUS_CHANGE',
    EXPORT           = 'EXPORT',
    PASSWORD_CHANGE  = 'PASSWORD_CHANGE',
    PASSWORD_RESET   = 'PASSWORD_RESET',
}

export enum AuditSource {
    HTTP_REQUEST = 'HTTP_REQUEST',
    SYSTEM       = 'SYSTEM',
}

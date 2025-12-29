/**
 * Role-Based Access Control (RBAC) Middleware
 */

/**
 * Authorize users based on roles
 * @param {Array} allowedRoles - Array of role names that are allowed
 */
function authorizeRoles(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.roles) {
            return res.status(403).json({ 
                error: 'Access denied. No role information.' 
            });
        }

        const userRoles = req.user.roles;
        const hasPermission = allowedRoles.some(role => userRoles.includes(role));

        if (!hasPermission) {
            return res.status(403).json({ 
                error: 'Access denied. Insufficient permissions.',
                required: allowedRoles,
                current: userRoles
            });
        }

        next();
    };
}

/**
 * Check if user has specific role
 */
function hasRole(user, roleName) {
    return user.roles && user.roles.includes(roleName);
}

/**
 * Check if user is System Admin
 */
function isSysAdmin(req, res, next) {
    if (!hasRole(req.user, 'SysAdmin')) {
        return res.status(403).json({ 
            error: 'Access denied. System Admin only.' 
        });
    }
    next();
}

/**
 * Check if user is Center Admin
 */
function isCenterAdmin(req, res, next) {
    if (!hasRole(req.user, 'CenterAdmin')) {
        return res.status(403).json({ 
            error: 'Access denied. Center Admin only.' 
        });
    }
    next();
}

/**
 * Check if user is Mentor
 */
function isMentor(req, res, next) {
    if (!hasRole(req.user, 'Mentor')) {
        return res.status(403).json({ 
            error: 'Access denied. Mentor only.' 
        });
    }
    next();
}

/**
 * Check if user is Student
 */
function isStudent(req, res, next) {
    if (!hasRole(req.user, 'Student')) {
        return res.status(403).json({ 
            error: 'Access denied. Student only.' 
        });
    }
    next();
}

module.exports = {
    authorizeRoles,
    hasRole,
    isSysAdmin,
    isCenterAdmin,
    isMentor,
    isStudent
};

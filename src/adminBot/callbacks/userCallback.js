const config = require('../../config/config');

class UserCallback {
    static async handleVerification(ctx) {
        const { id: userId } = ctx.from;
        const adminId = config.adminId;
        if (userId != adminId) {
            throw new Error('userIsNotAdminError');
        }
    }
}

module.exports = UserCallback;

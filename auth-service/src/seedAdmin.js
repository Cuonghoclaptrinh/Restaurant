
const bcrypt = require('bcryptjs');
const User = require('./models/user');

async function seedAdmin() {
    try {
        // Kiểm tra đã có ADMIN chưa
        const adminExists = await User.findOne({ where: { role: 'ADMIN' } });

        if (!adminExists) {
            console.log('No admin found → creating default admin...');

            const hashed = await bcrypt.hash('admin123', 10);

            await User.create({
                email: 'admin@system.com',
                password: hashed,
                name: 'Default Admin',
                role: 'ADMIN',
            });

            console.log('Default admin created: admin@system.com / admin123');
        } else {
            console.log('Admin already exists → skip seeding.');
        }
    } catch (err) {
        console.error('Error seeding admin:', err.message);
    }
}

module.exports = seedAdmin;

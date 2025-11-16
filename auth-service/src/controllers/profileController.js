const User = require('../models/user');
const UserProfile = require('../models/userProfile');

exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id; // từ middleware protect
        const user = await User.findByPk(userId, {
            attributes: ['id', 'email', 'name', 'role'],
            include: [{ model: UserProfile, as: 'profile' }],
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.upsertMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, phone, address, city, country } = req.body;

        let profile = await UserProfile.findOne({ where: { userId } });

        if (!profile) {
            profile = await UserProfile.create({
                userId,
                fullName,
                phone,
                address,
                city,
                country,
            });
        } else {
            await profile.update({ fullName, phone, address, city, country });
        }

        res.json(profile);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

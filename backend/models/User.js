import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Name is required' }
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: { msg: 'Please provide a valid email' }
        },
        set(value) {
            this.setDataValue('email', value.toLowerCase().trim());
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: {
                args: [6, 255],
                msg: 'Password must be at least 6 characters'
            }
        }
    },
    role: {
        type: DataTypes.ENUM('admin', 'vendor', 'reader'),
        defaultValue: 'reader'
    },
    profilePicture: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isPhoneVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    currentPlanName: {
        type: DataTypes.STRING,
        defaultValue: 'Basic'
    },
    emailVerificationOTP: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phoneVerificationOTP: {
        type: DataTypes.STRING,
        allowNull: true
    },
    otpExpiry: {
        type: DataTypes.DATE,
        allowNull: true
    },
    otpAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lockUntil: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    isBlocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // Vendor Details (JSON field)
    vendorDetails: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null
    },
    // Reader Preferences (JSON field)
    readerPreferences: {
        type: DataTypes.JSON,
        allowNull: true
    },
    institutionId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    sessionToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lastActiveAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastLoginIp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lastUserAgent: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // PIN Authentication
    pin: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pinAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    pinLockUntil: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // OTP Bombing Protection Fields
    lastOtpRequestAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    otpRequestCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'users',
    timestamps: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Instance method to compare password
User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to remove sensitive data
User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    delete values.pin;
    delete values.refreshToken;
    delete values.emailVerificationOTP;
    delete values.otpExpiry;
    delete values.sessionToken;
    return values;
};

// Instance method to compare PIN
User.prototype.comparePin = async function (candidatePin) {
    if (!this.pin) return false;
    return await bcrypt.compare(candidatePin, this.pin);
};

// Static method to hash a PIN
User.hashPin = async function (pin) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(pin, salt);
};

export default User;

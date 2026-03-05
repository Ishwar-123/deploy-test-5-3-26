const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('users', 'lastOtpRequestAt', {
            type: DataTypes.DATE,
            allowNull: true
        });
        await queryInterface.addColumn('users', 'otpRequestCount', {
            type: DataTypes.INTEGER,
            defaultValue: 0
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('users', 'lastOtpRequestAt');
        await queryInterface.removeColumn('users', 'otpRequestCount');
    }
};

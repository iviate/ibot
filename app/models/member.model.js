
module.exports = (sequelize, Sequelize, DataTypes) => {
    const Member = sequelize.define("member", {
        username: {
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING
        },
        mobile: {
            type: DataTypes.STRING
        },
        betall: {
            type: DataTypes.FLOAT
        },
        rolling: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0
        },
        withdraw: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0
        },
        bank_name: {
            type: DataTypes.STRING
        },
        account_number: {
            type: DataTypes.STRING
        },
        account_name: {
            type: DataTypes.STRING
        },
        latest_rolling: {
            type: DataTypes.DATE,
            allowNull: true
        },
        left_turn: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0
        },
    })
    return Member;
};
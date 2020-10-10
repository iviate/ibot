
module.exports = (sequelize, Sequelize, DataTypes) => {
    const Member = sequelize.define("mock_user_transactions", {
        user_id: {
            type: DataTypes.INTEGER
        },
        bet: {
            type: DataTypes.TEXT
        },
        bet_credit_chip_amount: {
            type: DataTypes.FLOAT
        },
        sum_paid_credit_amount: {
            type: DataTypes.FLOAT
        },
        bet_time: {
            type: DataTypes.DATE,
            defaultValue: 0.0
        }
    })
    return Member;
};
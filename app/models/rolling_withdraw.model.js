module.exports = (sequelize, Sequelize, DataTypes) => {
    const Member = sequelize.define("rolling_withdraw", {
        username: {
            type: DataTypes.STRING
        },
        amount: {
            type: DataTypes.INTEGER
        },
        updated_by: {
            type: DataTypes.STRING
        },
        status: {
            type: DataTypes.INTEGER // 1 pending, 2 aprroved, 3 completed
        },
        account_number: {
            type: DataTypes.STRING
        },
        bank_name: {
            type: DataTypes.STRING
        },
        account_name: {
            type: DataTypes.STRING
        }

    })
    return Member;
};
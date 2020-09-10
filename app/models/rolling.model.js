module.exports = (sequelize, Sequelize, DataTypes) => {
    const Member = sequelize.define("rolling", {
        username: {
            type: DataTypes.STRING
        },
        startdate: {
            type: DataTypes.DATE
        },
        enddate: {
            type: DataTypes.DATE
        },
        betall: {
            type: DataTypes.FLOAT
        },
        bet_rolling: {
            type: DataTypes.FLOAT
        },
        bet_left: {
            type: DataTypes.FLOAT
        },
        base_rolling_percent: {
            type: DataTypes.FLOAT
        },
        optional: {
            type: DataTypes.TEXT
        },
        rolling_amount: {
            type: DataTypes.FLOAT
        },

    })
    return Member;
};
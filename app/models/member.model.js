
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
        }
    })
    return Member;
};
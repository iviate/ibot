
module.exports = (sequelize, Sequelize, DataTypes) => {
    const MemberRecord = sequelize.define("member_record", {
        username: {
            type: DataTypes.STRING
        },
        all_point_casino: {
            type: DataTypes.FLOAT
        },
        all_point_gaming: {
            type: DataTypes.FLOAT
        },
        all_point_sports: {
            type: DataTypes.FLOAT
        },
        betall: {
            type: DataTypes.FLOAT
        },
        betcredit: {
            type: DataTypes.FLOAT
        },
        withdraw: {
            type: DataTypes.FLOAT
        },
        withdraw_times: {
            type: DataTypes.INTEGER
        },
        deposit: {
            type: DataTypes.FLOAT
        },
        deposit_times: {
            type: DataTypes.INTEGER
        },
        settlement: {
            type: DataTypes.FLOAT
        }
            

    })
    return Member;
};

module.exports = (sequelize, Sequelize, DataTypes) => {
    const MemberRecord = sequelize.define("member_record", {
        username: {
            type: DataTypes.STRING
        },
        all_point_casino: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        all_point_gaming: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        all_point_sports: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        previous_betall:{
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        betall: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        betcredit: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        withdraw: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        withdraw_times: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        deposit: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        deposit_times: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        settlement: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        }
            

    })
    return MemberRecord;
};
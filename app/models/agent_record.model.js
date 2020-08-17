
module.exports = (sequelize, Sequelize, DataTypes) => {
    const AgentRecord = sequelize.define("agent_record", {
        username: {
            type: DataTypes.STRING
        },
        af_betcredit: {
            type: DataTypes.FLOAT
        },
        af_betcredit_casino: {
            type: DataTypes.FLOAT
        },
        af_betcredit_gaming: {
            type: DataTypes.FLOAT
        },
        af_betcredit_sport: {
            type: DataTypes.FLOAT
        },
        downlines_count: {
            type: DataTypes.INTEGER
        }
    })
    return AgentRecord;
};
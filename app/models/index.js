const dbConfig = require("../../config/db.config.js");

const Sequelize = require("sequelize");
const { DataTypes } = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("./user.model.js")(sequelize, Sequelize, DataTypes);
db.bot = require("./bot.model.js")(sequelize, Sequelize, DataTypes);

db.user.hasMany(db.bot, { as: "bots" });
db.bot.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user",
});


module.exports = db;
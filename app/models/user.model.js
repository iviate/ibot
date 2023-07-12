
module.exports = (sequelize, Sequelize, DataTypes) => {
    const User = sequelize.define("user", {
      username: {
        type: DataTypes.STRING
      },
      password: {
        type: DataTypes.STRING
      },
      last_login: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      token: {
        type: DataTypes.STRING,
        allowNull: true
      },
      is_remember:{
        type: DataTypes.BOOLEAN,
        defdefaultValueault: false
      },
      agent: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tel: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      line: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      truthbet_token: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      truthbet_token_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      betworld_token: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      betworld_token_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      profit_wallet: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      is_mock: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      mock_wallet: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      real_pwd: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      
    });
  
    return User;
  };
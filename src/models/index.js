const User = require('./User');
const RefreshToken = require('./RefreshToken');
const Trip = require('./Trip');
const TripMember = require('./TripMember');


// 1. User <-> RefreshToken (One-to-Many)
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refresh_tokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

// 2. User <-> Trip (Lead relationship - One-to-Many)
User.hasMany(Trip, { foreignKey: 'lead_id', as: 'led_trips' });
Trip.belongsTo(User, { foreignKey: 'lead_id', as: 'lead' });

// 3. Trip <-> TripMember (One-to-Many)
Trip.hasMany(TripMember, { foreignKey: 'trip_id', as: 'members' });
TripMember.belongsTo(Trip, { foreignKey: 'trip_id' });

// 4. User <-> TripMember (One-to-Many)
User.hasMany(TripMember, { foreignKey: 'user_id' });
TripMember.belongsTo(User, { foreignKey: 'user_id' });

// 5. User <-> Trip (Many-to-Many via TripMember)
User.belongsToMany(Trip, { through: TripMember, foreignKey: 'user_id', as: 'joined_trips' });
Trip.belongsToMany(User, { through: TripMember, foreignKey: 'trip_id', as: 'participants' });

module.exports = {
  User,
  RefreshToken,
  Trip,
  TripMember,
};

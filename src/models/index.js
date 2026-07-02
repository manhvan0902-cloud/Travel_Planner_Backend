const User = require('./User');
const RefreshToken = require('./RefreshToken');
const Trip = require('./Trip');
const TripMember = require('./TripMember');
const Notification = require('./Notification');
const OtpCode = require('./OtpCode');
const ItineraryDay = require('./ItineraryDay');
const ItineraryItem = require('./ItineraryItem');
const Memorie = require('./Memorie');

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

// 6. User <-> Notification (One-to-Many)
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

// 7. User <-> OtpCode (One-to-Many)
User.hasMany(OtpCode, { foreignKey: 'user_id', as: 'otp_codes' });
OtpCode.belongsTo(User, { foreignKey: 'user_id' });

// 8. Trip <-> ItineraryDay (One-to-Many)
Trip.hasMany(ItineraryDay, { foreignKey: 'trip_id', as: 'itinerary_days' });
ItineraryDay.belongsTo(Trip, { foreignKey: 'trip_id' });

// 9. ItineraryDay <-> ItineraryItem (One-to-Many)
ItineraryDay.hasMany(ItineraryItem, { foreignKey: 'day_id', as: 'items' });
ItineraryItem.belongsTo(ItineraryDay, { foreignKey: 'day_id' });

// 10. Trip <-> ItineraryItem (One-to-Many - fast queries)
Trip.hasMany(ItineraryItem, { foreignKey: 'trip_id', as: 'all_itinerary_items' });
ItineraryItem.belongsTo(Trip, { foreignKey: 'trip_id' });

// 11. User <-> ItineraryItem (One-to-Many - created_by)
User.hasMany(ItineraryItem, { foreignKey: 'created_by_id', as: 'created_items' });
ItineraryItem.belongsTo(User, { foreignKey: 'created_by_id', as: 'creator' });

// 12. Trip <-> Memorie (One-to-Many)
Trip.hasMany(Memorie, { foreignKey: 'trip_id', as: 'memories' });
Memorie.belongsTo(Trip, { foreignKey: 'trip_id' });

// 13. User <-> Memorie (One-to-Many - uploader)
User.hasMany(Memorie, { foreignKey: 'uploaded_by_id', as: 'uploaded_memories' });
Memorie.belongsTo(User, { foreignKey: 'uploaded_by_id', as: 'uploader' });

module.exports = {
  User,
  RefreshToken,
  Trip,
  TripMember,
  Notification,
  OtpCode,
  ItineraryDay,
  ItineraryItem,
  Memorie,
};

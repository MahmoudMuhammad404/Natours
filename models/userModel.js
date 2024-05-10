const crypto = require('crypto'); // it's a built-in node module
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'please provide your email'],
    unique: true,
    lowercase: true, // to convert email into lowercase
    validate: [validator.isEmail, 'please provide a valid email'],
  },
  photo: { type: String, default: 'default.jpg' },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'please provide password'],
    minlength: 8,
    select: false, // if you want to get all user you must hide the password
  },
  passwordConfirm: {
    type: String,
    required: [true, 'please confirm your password'],
    validate: {
      // THIS ONLY WORKS ON CREATE AND SAVE!!! (NOT UPDATE)
      validator: function (el) {
        return el === this.password;
      },
      message: 'password are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // this referes to current document 'current user'
  // only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12 (default value of the cost is 10)
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirmation field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// QUERY MIDDLEWARE : runs before the query actully executed
// next is a function that should be called to pass control to the next middleware or the actual query execution.
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// CHECK IF THE PASSWORD THAT PASSES IN THE BODY IS === TO THE PASSWORD IN DB 'LOGIN'
//USING AN INSTANCE METHOD :- instance method is available on all documents
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

/*
USING AN INSTANCE METHOD :- TO CHECK IF USER CHANGED PASSWORD AFTER THE TOKEN WAS ISSUED
we will pass the JWT timestamp.So basically, that timestamp which says when the token was issued.
*/
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
    // the token was issued at time 100 , but then we change the password at time 200 (we change the password after the token was issued)
  }
  // FALSE MEANS NOT CHANGED
  return false;
};

//USING AN INSTANCE METHOD :- TO Generate the random reset token
// this is the token that we send it to the user to be able to reset password
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex'); // 32 is the size of character  and convert this number to hexadecimal string

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // expires after 10 miniutes in milliseconds
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;

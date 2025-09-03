const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { put, get } = require('../services/dynamodb');
const { success, created, badRequest, unauthorized, serverError } = require('../utils/response');
const { logError } = require('../utils/logger');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
    .message('Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character')
    .required(),
  name: Joi.string().min(2).max(50).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports.register = async (event) => {
  try {
    const { email, password, name } = JSON.parse(event.body);
    
    const { error } = registerSchema.validate({ email, password, name });
    if (error) {
      return badRequest(error.details[0].message, event);
    }

    const existingUser = await get({ id: email, type: 'user' });
    if (existingUser) {
      return badRequest('User already exists', event);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    const user = {
      id: email,
      type: 'user',
      userId,
      name,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    await put(user);

    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return created({
      token,
      user: {
        userId,
        email,
        name,
      },
    }, event);
  } catch (error) {
    logError('auth.register', error, { action: 'user_registration' });
    return serverError('Internal server error', event);
  }
};

module.exports.login = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);
    
    const { error } = loginSchema.validate({ email, password });
    if (error) {
      return badRequest(error.details[0].message, event);
    }

    const user = await get({ id: email, type: 'user' });
    if (!user) {
      return unauthorized('Invalid credentials', event);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return unauthorized('Invalid credentials', event);
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return success({
      token,
      user: {
        userId: user.userId,
        email: user.id,
        name: user.name,
      },
    }, event);
  } catch (error) {
    logError('auth.login', error, { action: 'user_login' });
    return serverError('Internal server error', event);
  }
};
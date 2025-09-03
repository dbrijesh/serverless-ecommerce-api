const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { put, get } = require('../services/dynamodb');
const { success, created, badRequest, unauthorized, serverError } = require('../utils/response');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().required(),
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
      return badRequest(error.details[0].message);
    }

    const existingUser = await get({ id: email, type: 'user' });
    if (existingUser) {
      return badRequest('User already exists');
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
    });
  } catch (error) {
    console.error('Register error:', error);
    return serverError('Internal server error');
  }
};

module.exports.login = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);
    
    const { error } = loginSchema.validate({ email, password });
    if (error) {
      return badRequest(error.details[0].message);
    }

    const user = await get({ id: email, type: 'user' });
    if (!user) {
      return unauthorized('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return unauthorized('Invalid credentials');
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
    });
  } catch (error) {
    console.error('Login error:', error);
    return serverError('Internal server error');
  }
};
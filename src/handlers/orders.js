const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const { put, get, scan } = require('../services/dynamodb');
const { success, created, badRequest, unauthorized, notFound, serverError } = require('../utils/response');

const orderItemSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  price: Joi.number().positive().required(),
});

const orderSchema = Joi.object({
  items: Joi.array().items(orderItemSchema).min(1).required(),
  shippingAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().required(),
  }).required(),
});

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports.create = async (event) => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return unauthorized('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) {
      return unauthorized('Invalid token');
    }

    const orderData = JSON.parse(event.body);
    
    const { error } = orderSchema.validate(orderData);
    if (error) {
      return badRequest(error.details[0].message);
    }

    const orderId = uuidv4();
    const totalAmount = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const order = {
      id: orderId,
      type: 'order',
      userId: decoded.userId,
      userEmail: decoded.email,
      items: orderData.items,
      shippingAddress: orderData.shippingAddress,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await put(order);

    return created(order);
  } catch (error) {
    console.error('Create order error:', error);
    return serverError('Internal server error');
  }
};

module.exports.getAll = async (event) => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return unauthorized('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) {
      return unauthorized('Invalid token');
    }

    const orders = await scan('#type = :type AND userId = :userId', {
      ':type': 'order',
      ':userId': decoded.userId,
    });

    return success(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    return serverError('Internal server error');
  }
};

module.exports.getById = async (event) => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return unauthorized('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded) {
      return unauthorized('Invalid token');
    }

    const { id } = event.pathParameters;
    
    const order = await get({ id, type: 'order' });
    if (!order) {
      return notFound('Order not found');
    }

    if (order.userId !== decoded.userId) {
      return unauthorized('Access denied');
    }

    return success(order);
  } catch (error) {
    console.error('Get order error:', error);
    return serverError('Internal server error');
  }
};
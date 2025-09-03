const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { put, get, update, remove, scan } = require('../services/dynamodb');
const { success, created, badRequest, notFound, serverError } = require('../utils/response');
const { authenticateToken } = require('../utils/auth');

const productSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string(),
  price: Joi.number().positive().required(),
  category: Joi.string().required(),
  stock: Joi.number().integer().min(0).required(),
  imageUrl: Joi.string().uri(),
});

const updateProductSchema = Joi.object({
  name: Joi.string(),
  description: Joi.string(),
  price: Joi.number().positive(),
  category: Joi.string(),
  stock: Joi.number().integer().min(0),
  imageUrl: Joi.string().uri(),
});

module.exports.create = async (event) => {
  try {
    // Authentication check
    const authResult = authenticateToken(event);
    if (!authResult.isValid) {
      return authResult.response;
    }

    const productData = JSON.parse(event.body);
    
    const { error } = productSchema.validate(productData);
    if (error) {
      return badRequest(error.details[0].message);
    }

    const productId = uuidv4();
    const product = {
      id: productId,
      type: 'product',
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await put(product);

    return created(product);
  } catch (error) {
    console.error('Create product error:', error);
    return serverError('Internal server error');
  }
};

module.exports.getAll = async (event) => {
  try {
    const products = await scan('#type = :type', {
      ':type': 'product',
    });

    return success(products);
  } catch (error) {
    console.error('Get products error:', error);
    return serverError('Internal server error');
  }
};

module.exports.getById = async (event) => {
  try {
    const { id } = event.pathParameters;
    
    const product = await get({ id, type: 'product' });
    if (!product) {
      return notFound('Product not found');
    }

    return success(product);
  } catch (error) {
    console.error('Get product error:', error);
    return serverError('Internal server error');
  }
};

module.exports.update = async (event) => {
  try {
    // Authentication check
    const authResult = authenticateToken(event);
    if (!authResult.isValid) {
      return authResult.response;
    }

    const { id } = event.pathParameters;
    const updateData = JSON.parse(event.body);
    
    const { error } = updateProductSchema.validate(updateData);
    if (error) {
      return badRequest(error.details[0].message);
    }

    const existingProduct = await get({ id, type: 'product' });
    if (!existingProduct) {
      return notFound('Product not found');
    }

    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    Object.keys(updateData).forEach((key, index) => {
      const attributeName = `#attr${index}`;
      const attributeValue = `:val${index}`;
      
      updateExpressions.push(`${attributeName} = ${attributeValue}`);
      expressionAttributeNames[attributeName] = key;
      expressionAttributeValues[attributeValue] = updateData[key];
    });

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const updateExpression = `SET ${updateExpressions.join(', ')}`;

    const updatedProduct = await update(
      { id, type: 'product' },
      updateExpression,
      expressionAttributeValues,
      expressionAttributeNames
    );

    return success(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    return serverError('Internal server error');
  }
};

module.exports.delete = async (event) => {
  try {
    // Authentication check
    const authResult = authenticateToken(event);
    if (!authResult.isValid) {
      return authResult.response;
    }

    const { id } = event.pathParameters;
    
    const existingProduct = await get({ id, type: 'product' });
    if (!existingProduct) {
      return notFound('Product not found');
    }

    await remove({ id, type: 'product' });

    return success({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return serverError('Internal server error');
  }
};
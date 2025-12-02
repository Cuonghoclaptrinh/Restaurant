const { trace, context } = require('@opentelemetry/api');
const tracer = trace.getTracer('order-service');

const models = require('../models');
const { Cart, CartItem, MenuItem, Order, OrderItem } = models;

// Kiểm tra models đã được load chưa
if (!Cart || !CartItem || !MenuItem) {
  console.error('Models not loaded properly:', {
    Cart: !!Cart,
    CartItem: !!CartItem,
    MenuItem: !!MenuItem
  });
  throw new Error('Models not initialized. Cart, CartItem, or MenuItem is undefined.');
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80';

const cartInclude = [
  {
    model: CartItem,
    as: 'items',
    include: [
      {
        association: 'menuItem'
      }
    ]
  }
];

const loadCart = async (cart) => {
  if (!cart) return null;
  return cart.reload({ include: cartInclude });
};

const findOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ where: { userId, status: 'active' }, include: cartInclude });
  if (!cart) {
    cart = await Cart.create({ userId, status: 'active' });
    cart = await Cart.findOne({ where: { id: cart.id }, include: cartInclude });
  }
  return cart;
};

const formatCart = (cart) => {
  if (!cart) return null;
  const plain = cart.get({ plain: true });
  plain.items = (plain.items || [])
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((item) => ({
      ...item,
      price: typeof item.price === 'number' ? item.price : item.menuItem?.price || 0,
      menuItem: item.menuItem || {
        name: `Món #${item.menuItemId}`,
        description: 'Đang cập nhật',
        category: 'menu',
        imageUrl: FALLBACK_IMAGE,
        price: item.price
      }
    }));
  return plain;
};

module.exports = {
  async ensureCartForUser(req, res) {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const cart = await findOrCreateCart(userId);
      res.status(201).json(formatCart(cart));
    } catch (error) {
      console.error('ensureCartForUser error:', error);
      res.status(500).json({ error: 'Failed to ensure cart', message: error.message });
    }
  },

  async getCartByUser(req, res) {
    try {
      // Kiểm tra lại models trước khi sử dụng
      if (!Cart || typeof Cart.findOne !== 'function') {
        console.error('Cart model is not properly loaded');
        return res.status(500).json({
          error: 'Failed to get cart',
          message: 'Cart model not initialized'
        });
      }

      const userId = req.user.id;
      const cart = await findOrCreateCart(userId);
      res.json(formatCart(cart));
    } catch (error) {
      console.error('getCartByUser error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        error: 'Failed to get cart',
        message: error.message,
        details: error.original?.message || error.message
      });
    }
  },

  async addItem(req, res) {
    try {
      const userId = req.user.id;
      const { menuItemId, quantity = 1, price } = req.body;

      if (!menuItemId || quantity < 1) {
        return res.status(400).json({ error: 'menuItemId and quantity are required' });
      }

      const menuItem = await MenuItem.findByPk(menuItemId);
      if (!menuItem) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      const cart = await findOrCreateCart(userId);
      const unitPrice = typeof price === 'number' ? price : menuItem.price;

      let item = await CartItem.findOne({ where: { cartId: cart.id, menuItemId } });
      if (item) {
        item.quantity += quantity;
        item.price = unitPrice;
        await item.save();
      } else {
        await CartItem.create({
          cartId: cart.id,
          menuItemId,
          quantity,
          price: unitPrice
        });
      }

      const freshCart = await loadCart(cart);
      res.status(201).json(formatCart(freshCart));
    } catch (error) {
      console.error('addItem error:', error);
      res.status(500).json({
        error: 'Failed to add item to cart',
        message: error.message,
        details: error.original?.message || error.message
      });
    }
  },

  async updateItem(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const userId = req.user.id;

      const item = await CartItem.findOne({
        where: { id },
        include: [{ model: Cart, as: 'cart' }]
      });

      if (!item || item.cart.userId !== userId) {
        return res.status(404).json({ error: 'Item not found' });
      }

      if (!quantity || quantity < 1) {
        await item.destroy();
      } else {
        item.quantity = quantity;
        await item.save();
      }

      const cart = await findOrCreateCart(userId);
      res.json(formatCart(cart));
    } catch (error) {
      console.error('updateItem error:', error);
      res.status(500).json({ error: 'Failed to update item', message: error.message });
    }
  },

  async deleteItem(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const item = await CartItem.findOne({
        where: { id },
        include: [{ model: Cart, as: 'cart' }]
      });
      if (!item || item.cart.userId !== userId) {
        return res.status(404).json({ error: 'Item not found' });
      }

      await item.destroy();

      const cart = await findOrCreateCart(userId);
      res.json(formatCart(cart));
    } catch (error) {
      console.error('deleteItem error:', error);
      res.status(500).json({ error: 'Failed to delete item', message: error.message });
    }
  },

  async updateDetails(req, res) {
    try {
      const userId = req.user.id;
      const cart = await findOrCreateCart(userId);

      const allowedFields = ['customerName', 'customerPhone', 'deliveryAddress', 'deliveryNote', 'orderType'];
      allowedFields.forEach((field) => {
        if (field in req.body) {
          cart[field] = req.body[field];
        }
      });

      await cart.save();
      const freshCart = await loadCart(cart);
      res.json(formatCart(freshCart));
    } catch (error) {
      console.error('updateDetails error:', error);
      res.status(500).json({ error: 'Failed to update cart details', message: error.message });
    }
  },

  async checkoutFromCart(req, res) {
    // Span mẹ cho toàn bộ flow checkout
    const span = tracer.startSpan('checkoutFromCart', {
      attributes: {
        'app.feature': 'checkout',
        'span.kind': 'internal'
      }
    });

    try {
      const userId = req.user.id;
      const { customerName, customerPhone, deliveryAddress, deliveryNote, orderType } = req.body;

      span.setAttribute('user.id', userId);
      span.setAttribute('order.requested_type', orderType || 'not_provided');

      // Tạo context để các span con là child của checkoutFromCart
      const spanCtx = trace.setSpan(context.active(), span);

      // 🔹 Sub-span 1: load cart
      const loadCartSpan = tracer.startSpan('checkout.loadCart', undefined, spanCtx);

      const cart = await Cart.findOne({
        where: { userId, status: 'active' },
        include: cartInclude
      });

      loadCartSpan.setAttribute('cart.found', !!cart);
      loadCartSpan.end();

      if (!cart || !cart.items || cart.items.length === 0) {
        span.setAttribute('cart.empty', true);
        span.setStatus({ code: 1, message: 'Cart empty' });
        return res.status(400).json({ error: 'Cart empty' });
      }

      span.setAttribute('cart.items_count', cart.items.length);

      // 🔹 Sub-span 2: create order record
      const createOrderSpan = tracer.startSpan('checkout.createOrder', undefined, spanCtx);
      const order = await Order.create({
        orderType: orderType || cart.orderType || 'delivery',
        customerName: customerName || cart.customerName,
        customerPhone: customerPhone || cart.customerPhone,
        deliveryAddress: deliveryAddress || cart.deliveryAddress,
        deliveryNote: deliveryNote || cart.deliveryNote,
        status: 'pending'
      });
      createOrderSpan.setAttribute('order.id', order.id);
      createOrderSpan.end();

      const itemsSpan = tracer.startSpan('checkout.createOrderItems', undefined, spanCtx);
      for (const it of cart.items) {
        await OrderItem.create({
          orderId: order.id,
          menuItemId: it.menuItemId,
          quantity: it.quantity,
          price: it.price
        });
      }
      itemsSpan.setAttribute('order.items_count', cart.items.length);
      itemsSpan.end();

      const clearCartSpan = tracer.startSpan('checkout.clearCart', undefined, spanCtx);
      await CartItem.destroy({ where: { cartId: cart.id } });
      cart.status = 'converted';
      await cart.save();
      clearCartSpan.end();

      span.setStatus({ code: 0 });

      res.json({ message: 'Order created', orderId: order.id });
    } catch (error) {
      console.error('checkoutFromCart error:', error);
      span.recordException(error);
      span.setStatus({ code: 1, message: error.message });
      res.status(500).json({ error: 'Failed to checkout cart', message: error.message });
    } finally {
      span.end();
    }
  }
};
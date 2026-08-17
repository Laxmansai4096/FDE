/**
 * AURA PERFUMERY - Relational Order Management System (OMS) (server/orders.js)
 */

const { FRAGRANCE_CATALOG } = require('./db');

class OrderManagementSystem {
  constructor() {
    // Relational Database Orders Table initialized with active customer orders
    this.orders = [
      {
        orderId: "ORD-8821",
        productId: "perfume_001",
        productName: "Royal Oud & Mysore Sandalwood",
        size: "100ml",
        quantity: 1,
        totalPrice: 245,
        priceInRupees: "₹18,500",
        status: "SHIPPED",
        carrier: "DHL Express India",
        trackingNumber: "TRK-IN-9982142",
        orderDate: "2026-08-15T10:30:00Z",
        estimatedDelivery: "2026-08-18T18:00:00Z"
      },
      {
        orderId: "ORD-9430",
        productId: "perfume_003",
        productName: "Royal Kashmir Saffron & Amber",
        size: "100ml",
        quantity: 1,
        totalPrice: 280,
        priceInRupees: "₹21,000",
        status: "PROCESSING",
        carrier: "FedEx Express India",
        trackingNumber: "TRK-IN-4410293",
        orderDate: "2026-08-16T14:15:00Z",
        estimatedDelivery: "2026-08-19T14:00:00Z"
      }
    ];
  }

  // 1. Check Order Tracking Status
  checkOrderStatus(orderId) {
    const cleanId = String(orderId).trim().toUpperCase();
    const order = this.orders.find(o => o.orderId === cleanId);

    if (!order) {
      return {
        found: false,
        message: `Order '${cleanId}' not found in Order Management System. Please check your order ID.`
      };
    }

    return {
      found: true,
      orderId: order.orderId,
      productName: order.productName,
      status: order.status,
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      message: `[Customer Support Assistant] Order **${order.orderId}** for **${order.productName}** is currently **${order.status}**. Carrier: ${order.carrier}. Tracking Code: \`${order.trackingNumber}\`. Estimated Delivery: ${new Date(order.estimatedDelivery).toLocaleDateString('en-IN')}.`
    };
  }

  // 2. Place New Order
  placeOrder(productQuery, size = "100ml", quantity = 1) {
    const lowerQuery = String(productQuery).toLowerCase();
    
    // Find matching catalog product
    const product = FRAGRANCE_CATALOG.find(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      lowerQuery.includes(p.name.toLowerCase()) ||
      p.id === productQuery
    ) || FRAGRANCE_CATALOG[0]; // Default to Royal Oud & Mysore Sandalwood

    if (!product.inStock || product.stockCount < quantity) {
      return {
        success: false,
        message: `Product '${product.name}' is currently out of stock in our atelier inventory.`
      };
    }

    // Deduct Stock from Catalog
    product.stockCount -= quantity;
    if (product.stockCount <= 0) {
      product.inStock = false;
    }

    const newOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const trackingNum = `TRK-AURA-${Math.floor(100000 + Math.random() * 900000)}`;
    const totalPrice = product.price * quantity;
    const rupeeTotal = `₹${(18500 * quantity).toLocaleString('en-IN')}`;

    const newOrder = {
      orderId: newOrderId,
      productId: product.id,
      productName: product.name,
      size,
      quantity,
      totalPrice,
      priceInRupees: rupeeTotal,
      status: "PROCESSING",
      carrier: "DHL Express India",
      trackingNumber: trackingNum,
      orderDate: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    };

    this.orders.unshift(newOrder);

    return {
      success: true,
      order: newOrder,
      message: `🎉 Order **${newOrderId}** placed successfully! Item: **${product.name}** (${size}). Total: $${totalPrice} (${rupeeTotal}). Carrier: DHL Express India (\`${trackingNum}\`). Inventory remaining: ${product.stockCount} units.`
    };
  }

  // 3. Cancel Order
  cancelOrder(orderId) {
    const cleanId = String(orderId).trim().toUpperCase();
    const order = this.orders.find(o => o.orderId === cleanId);

    if (!order) {
      return {
        success: false,
        message: `Order '${cleanId}' not found.`
      };
    }

    if (order.status === "SHIPPED" || order.status === "DELIVERED") {
      return {
        success: false,
        status: order.status,
        message: `Order **${order.orderId}** has already been **${order.status}** via ${order.carrier} (Tracking: \`${order.trackingNumber}\`). Under policy, shipped orders cannot be cancelled online. Please contact customer care for returns.`
      };
    }

    if (order.status === "CANCELLED") {
      return {
        success: false,
        status: "CANCELLED",
        message: `Order **${order.orderId}** is already cancelled.`
      };
    }

    // Update state to CANCELLED
    order.status = "CANCELLED";

    // Restore Stock to Catalog
    const product = FRAGRANCE_CATALOG.find(p => p.id === order.productId || p.name === order.productName);
    if (product) {
      product.stockCount += order.quantity;
      product.inStock = true;
    }

    return {
      success: true,
      orderId: order.orderId,
      message: `Order **${order.orderId}** for **${order.productName}** has been updated to **CANCELLED**. A full refund of ${order.priceInRupees || '$' + order.totalPrice} has been issued to your payment method. Atelier inventory has been restored (+${order.quantity} unit).`
    };
  }

  getAllOrders() {
    return this.orders;
  }
}

const orderEngine = new OrderManagementSystem();
module.exports = orderEngine;

/**
 * AURA PERFUMERY - Relational Order Management System (OMS) (server/orders.js)
 */

const { FRAGRANCE_CATALOG, findMatchingProduct } = require('./db');

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

  // 1. Check Order Tracking Status & Estimated Delivery Date
  checkOrderStatus(orderId) {
    const cleanId = String(orderId).trim().toUpperCase();
    const order = this.orders.find(o => o.orderId === cleanId);

    if (!order) {
      return {
        found: false,
        message: `Order **'${cleanId}'** was not found in our Order Management System. Please verify your Order ID (for example: **ORD-8821** or **ORD-9430**).`
      };
    }

    const deliveryDateObj = new Date(order.estimatedDelivery);
    const formattedDelivery = deliveryDateObj.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return {
      found: true,
      orderId: order.orderId,
      productName: order.productName,
      status: order.status,
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      formattedDeliveryDate: formattedDelivery,
      message: `📦 **Order Status & Estimated Delivery for ${order.orderId}**\n\n` +
               `• **Product**: ${order.productName} (${order.size})\n` +
               `• **Current Status**: **${order.status}**\n` +
               `• 🚚 **Shipping Carrier**: ${order.carrier}\n` +
               `• 🏷️ **Tracking Code**: \`${order.trackingNumber}\`\n` +
               `• 📅 **Estimated Delivery Date**: **${formattedDelivery}**\n\n` +
               `Your package is currently in transit with ${order.carrier} and scheduled for delivery on time.`
    };
  }

  // 2. Place New Order with Clear Delivery Breakdown
  placeOrder(productQuery, size = "100ml", quantity = 1) {
    // Find matching catalog product with high token precision
    const product = findMatchingProduct(productQuery) || FRAGRANCE_CATALOG[0];

    if (!product.inStock || product.stockCount < quantity) {
      return {
        success: false,
        message: `Product **'${product.name}'** is currently out of stock in our atelier inventory.`
      };
    }

    // Deduct Stock from Catalog
    product.stockCount -= quantity;
    if (product.stockCount <= 0) {
      product.inStock = false;
    }

    const newOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const trackingNum = `TRK-AURA-${Math.floor(100000 + Math.random() * 900000)}`;
    const unitPriceRupees = product.priceInRupees ? parseInt(product.priceInRupees.replace(/[^\d]/g, '')) : 18500;
    const totalPrice = product.price * quantity;
    const rupeeTotal = `₹${(unitPriceRupees * quantity).toLocaleString('en-IN')}`;

    const estDeliveryDateObj = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const formattedDelivery = estDeliveryDateObj.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

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
      estimatedDelivery: estDeliveryDateObj.toISOString()
    };

    this.orders.unshift(newOrder);

    return {
      success: true,
      order: newOrder,
      formattedDeliveryDate: formattedDelivery,
      message: `🎉 **Order Placed Successfully!**\n\n` +
               `• **Order ID**: **${newOrderId}**\n` +
               `• **Product**: ${product.name} (${size} x ${quantity})\n` +
               `• **Total Amount**: **${rupeeTotal}** ($${totalPrice} USD)\n` +
               `• 🚚 **Shipping Carrier**: DHL Express India (Tracking Code: \`${trackingNum}\`)\n` +
               `• 📅 **Estimated Delivery Date**: **${formattedDelivery}**\n` +
               `• 📦 **Remaining Atelier Inventory**: ${product.stockCount} units\n\n` +
               `Thank you for choosing AURA Perfumery! You can track your shipment anytime by asking *"Track order ${newOrderId}"*.`
    };
  }


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

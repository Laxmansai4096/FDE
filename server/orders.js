/**
 * AURA PERFUMERY - Relational Order Management & Customer Support Engine
 * 
 * FDE Concept: In real-world enterprise retail AI systems, AI assistants don't just recommend products;
 * they interface directly with ERP / E-Commerce Order Management Systems (OMS) to:
 * 1. Place Orders (allocating SQL stock, generating Order IDs & tracking numbers).
 * 2. Track Order Status (checking logistics carriers like DHL/FedEx).
 * 3. Cancel Orders (enforcing business policies like cancellation windows & restocking stock).
 */

const { FRAGRANCE_CATALOG } = require('./db');

// Mock Relational Orders Database Table
const ORDERS_DATABASE = [
  {
    orderId: "ORD-8821",
    customerEmail: "[REDACTED_EMAIL]",
    productId: "perfume_001",
    productName: "L'Ombre du Bois",
    quantity: 1,
    size: "100ml",
    totalPrice: 245,
    status: "SHIPPED",
    carrier: "DHL Express France",
    trackingNumber: "TRK-FR-9982142",
    estimatedDelivery: "2026-08-19",
    createdAt: "2026-08-16T14:30:00Z"
  },
  {
    orderId: "ORD-9430",
    customerEmail: "[REDACTED_EMAIL]",
    productId: "perfume_003",
    productName: "Velours d'Ambre",
    quantity: 1,
    size: "100ml",
    totalPrice: 280,
    status: "PROCESSING",
    carrier: "FedEx International",
    trackingNumber: "TRK-FX-3392810",
    estimatedDelivery: "2026-08-21",
    createdAt: "2026-08-17T08:15:00Z"
  }
];

class OrderManagementEngine {
  // 1. Place New Order (Integrates with Relational Inventory)
  placeOrder(productId, size = "100ml", quantity = 1) {
    const product = FRAGRANCE_CATALOG.find(p => p.id === productId || p.name.toLowerCase().includes(productId.toLowerCase()));
    
    if (!product) {
      return { success: false, message: `Product '${productId}' not found in catalog.` };
    }

    if (!product.inStock || product.stockCount < quantity) {
      return { success: false, message: `Product '${product.name}' is currently out of stock or insufficient inventory.` };
    }

    // Deduct stock count from relational catalog
    product.stockCount -= quantity;
    if (product.stockCount <= 0) product.inStock = false;

    const newOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTracking = `TRK-AURA-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder = {
      orderId: newOrderId,
      customerEmail: "[REDACTED_EMAIL]",
      productId: product.id,
      productName: product.name,
      quantity,
      size,
      totalPrice: product.price * quantity,
      status: "PROCESSING",
      carrier: "DHL Express Luxury Atelier",
      trackingNumber: newTracking,
      estimatedDelivery: "Delivery in 2-3 Business Days",
      createdAt: new Date().toISOString()
    };

    ORDERS_DATABASE.unshift(newOrder);

    return {
      success: true,
      message: `Order ${newOrderId} placed successfully!`,
      order: newOrder
    };
  }

  // 2. Query Order Status
  checkOrderStatus(orderId) {
    const cleanId = orderId.toUpperCase().trim();
    const order = ORDERS_DATABASE.find(o => o.orderId === cleanId);

    if (!order) {
      return {
        success: false,
        message: `Order '${orderId}' not found in Order Management System. Please verify Order ID format (e.g. ORD-8821).`
      };
    }

    return {
      success: true,
      orderId: order.orderId,
      productName: order.productName,
      status: order.status,
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      totalPrice: `$${order.totalPrice}`
    };
  }

  // 3. Cancel Existing Order
  cancelOrder(orderId) {
    const cleanId = orderId.toUpperCase().trim();
    const order = ORDERS_DATABASE.find(o => o.orderId === cleanId);

    if (!order) {
      return { success: false, message: `Order '${orderId}' not found.` };
    }

    if (order.status === "SHIPPED" || order.status === "DELIVERED") {
      return {
        success: false,
        message: `Order ${orderId} cannot be cancelled because it is already '${order.status}'. Carrier tracking: ${order.trackingNumber}. Please initiate a return upon delivery.`
      };
    }

    if (order.status === "CANCELLED") {
      return { success: false, message: `Order ${orderId} is already cancelled.` };
    }

    // Update status & restore relational stock
    order.status = "CANCELLED";
    const product = FRAGRANCE_CATALOG.find(p => p.id === order.productId);
    if (product) {
      product.stockCount += order.quantity;
      product.inStock = true;
    }

    return {
      success: true,
      message: `Order ${orderId} has been successfully cancelled. Refund processed to original payment method. Relational inventory restored.`,
      order
    };
  }

  // List all orders
  getAllOrders() {
    return ORDERS_DATABASE;
  }
}

const orderEngine = new OrderManagementEngine();
module.exports = orderEngine;

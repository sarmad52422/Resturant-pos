"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRoles = exports.permissions = void 0;
exports.permissions = [
    'order.create',
    'order.send_to_kitchen',
    'order.void',
    'order.refund',
    'order.discount.large',
    'order.edit.completed',
    'stock.adjust',
    'ledger.delete',
    'shift.close.other',
    'settings.update',
    'user.manage',
    'report.view.profit',
];
exports.defaultRoles = [
    'Admin',
    'Manager',
    'Cashier',
    'Waiter',
    'Chef',
    'Delivery Rider',
    'Accountant',
];

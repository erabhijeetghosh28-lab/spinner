# 👑 Super Admin Guide

## Overview
The **Super Admin** is the owner of the platform. You have full control over all Tenants (businesses), Subscription Plans, and Global Configurations.

**Login URL**: `/admin/login`
**Default Credentials** (if seeded from local .env): `offer@admin.com` / `admin123`
**Fallback Credentials** (if no env vars): `super@admin.com` / `admin123`

## 1. Dashboard Overview
Upon logging in, you will see the **Super Admin Dashboard**, which provides a high-level view of the platform's health:
*   Total Active Tenants
*   Total Revenue (Monthly)
*   System Health Status

## 2. Managing Tenants (Businesses)
Navigate to the **Tenants** section to onboard new clients.
*   **Create Tenant**: Click "Add Tenant".
    *   **Name**: Business Name.
    *   **Slug**: Unique URL identifier (e.g., `burger-king` -> `app.com?tenant=burger-king`).
    *   **Phone**: Contact number for the business owner.
    *   **Plan**: Assign a subscription plan (Basic/Pro).
    *   **WhatsApp Config**: You can override the global WhatsApp credentials for specific tenants if they want to use their own API account.
*   **Manage Access**: You can reset the Tenant Admin's password directly from the "Edit Tenant" modal.

## 3. Subscription Plans
Navigate to **Plans** to define what you sell.
*   **Create Plan**: Define limits for Spins, Campaigns, and features (e.g., Custom Templates).
*   **Edit Plan**: Update pricing or limits. Changes apply to all tenants on that plan.

## 4. Global Settings
*   **WhatsApp API**: Configure the default CloudWAPI credentials used by the entire platform. If a tenant doesn't have their own config, they use this one.

## 5. Security
*   **Change Password**: Click your profile icon in the top right to change your Super Admin password.

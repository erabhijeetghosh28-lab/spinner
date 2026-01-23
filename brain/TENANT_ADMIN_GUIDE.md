# 🏢 Tenant Admin Guide

## Overview
As a **Tenant Admin**, you manage your own business's campaigns. You can create spin wheels, decide the prizes, and customize the look and feel to match your brand.

**Login URL**: `/admin/login` (Same URL, system detects your role)
**Default Credentials**: `admin@default.com` / `tenant123`

## 1. Dashboard Overview
Your dashboard shows real-time stats for your campaigns:
*   Total Spins (Today/All Time)
*   Active Campaigns
*   Recent Winners List

## 2. Managing Campaigns
A **Campaign** is a single "Spin & Win" event.
*   **Create Campaign**:
    *   **Name**: Internal name (e.g., "Deepavali Sale").
    *   **Theme**: Choose a visual style (Classic / Modern / Neon). You can see a preview of the wheel.
    *   **Logo**: Enter a URL for your brand logo to appear in the center of the wheel.
    *   **Spin Limits**: Define how many times a user can spin (e.g., once every 24 hours).
    *   **Referrals**: NEW! Set `Referrals Required` > 0 to force users to invite friends before they can spin.

## 3. Configuring Prizes
For each campaign, you define the segments on the wheel.
*   **Probability**: The chance (in %) of landing on this prize.
*   **Stock Limit**: Total number of times this prize can be won (e.g., only 5 "Jackpot" winners).
*   **Daily Limit**: Max wins per day.
*   **Coupon Code**: The code sent to the winner via WhatsApp (e.g., `SAVE50`).

## 4. Referrals
Your customers can invite friends!
*   **Link**: A unique link is generated for every user.
*   **Visibility**: The link is shown on their dashboard immediately after login.
*   **Bonus**: If you enabled referral requirements, users *must* share to unlock the wheel.

## 5. Security
*   **Change Password**: Click your profile icon in the top right to change your login password.

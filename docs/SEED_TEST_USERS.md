# Seed data & test users

After running **`npm run seed`** in the `backend` folder, you can use these accounts to test the app.

**Password for all users:** `password123`

## Users

| Username       | Role    | Assigned homes   | Use for |
|----------------|--------|-------------------|--------|
| **admin**      | Admin  | (all)             | Full access, all homes |
| **alice.smith**| Admin  | Home A, Home B    | Admin with specific homes |
| **bob.johnson**| Manager| **Home B only**   | **Live Power test** – should see only Home B, its rooms and devices |
| **sarah.manager** | Manager | Home A, Home C | Manager with two homes |
| **charlie.brown** | User  | Home A            | Regular user |

## Homes & devices (after seed)

- **Home A:** Room 1 (Fridge, TV, AC), Room 2 (Lighting, Laptop), Room 3 (Washing Machine – Offline)
- **Home B:** Room 1 (Fridge, TV, Router – Warning), Room 2 (AC, Lighting), Kitchen (Fridge, Microwave)
- **Home C:** Room 1 (Smart Plug, TV), Room 2 (Fridge, AC)

Each device has sensor readings (power, voltage, current) for the last 48 hours so Live Power and the hierarchy show real numbers.

## How to test Live Power (manager view)

1. Run seed: `cd backend && npm run seed`
2. Start backend and frontend.
3. Log in as **bob.johnson** / **password123**.
4. Open **Live Power** (manager section).
5. You should see:
   - KPIs and chart for **Home B only**.
   - **“Live monitoring by home, room & device”**: one house **Home B** with rooms (Room 1, Room 2, Kitchen) and devices (Fridge, TV, Router, AC, Lighting, Microwave) with power, voltage, current.
   - **“Your homes”**: only Home B.
   - **System Status**: only “Home B Sensors”.

If you see **“Could not load device list. Try refreshing.”** the hierarchy API request failed (e.g. backend not running or wrong URL). If you see **“No homes assigned to you”** the logged-in user has no buildings assigned in User Management.

# POS Online - Backend

The core API for the POS Online system, built with NestJS and Prisma.

## 🚀 Key Features

- **Order Processing**: Transactional order creation with stock deduction.
- **Advanced FIFO Points**: Point earning and redemption logic using First-In-First-Out expiration tracking.
- **Dynamic App Settings**: Global configuration system for point rules and payment IDs.
- **Authentication**: JWT-based security with Role-Based Access Control (RBAC).
- **Prisma ORM**: Type-safe database interactions with PostgreSQL.

## 🛠 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Validation**: [Class-validator](https://github.com/typestack/class-validator)

## 🛠 Development

1. Install dependencies:

   ```bash
   bun install
   ```

2. Setup Database:
   Update your `.env` with `DATABASE_URL` then run:

   ```bash
   bunx prisma db push
   ```

3. Run the development server:

   ```bash
   bun run start:dev
   ```

4. The API runs on [http://localhost:3002](http://localhost:3002)

## 📁 Key Modules

- `src/orders`: Handles order logic, price calculations (inclusive VAT), and point earning/redemptions.
- `src/members`: Manages member profiles and initial sign-up bonus points.
- `src/settings`: Stores and manages global application configuration.
- `src/products`: Inventory and category management.

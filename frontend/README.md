# POS Online - Frontend

The frontend of the POS Online system, built with Next.js 15 and React.

## 🚀 Key Features

- **Storefront POS Interface**: Classic and intuitive checkout flow with real-time calculations.
- **Advanced Membership System**: Supports point redemption with FIFO logic and dynamic point calculation.
- **Admin Settings**: A dedicated UI to manage global application settings (Points rules, PromptPay IDs, etc.).
- **Product Management**: Upload images, manage categories, and generate SKUs.
- **Sales Analytics**: Interactive charts (Recharts) for monitoring business performance.
- **Multilingual & Dark Mode**: Full internationalization (TH/EN) and theme switching support.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **QR Code**: [promptpay-qr](https://github.com/dtinth/promptpay-qr)

## 🛠 Development

1. Install dependencies:

   ```bash
   bun install
   ```

2. Run the development server:

   ```bash
   bun run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## 📁 Structure

- `src/app`: Page routes and layouts.
- `src/components`: Reusable UI components (POS, Dashboard, etc.).
- `src/stores`: Zustand state management (Cart, Products, Settings, etc.).
- `src/lib`: Utility functions and API configuration.

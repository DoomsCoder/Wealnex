# Wealnex - AI Powered Financial Management

Wealnex is a comprehensive financial management platform that leverages AI to help you track expenses, gain insights, and manage your wealth effectively. Built with Next.js 15, it integrates seamlessly with your bank accounts via Setu Account Aggregator and provides intelligent analysis of your financial health.

## Key Features

- **💰 Financial Dashboard**: Real-time overview of your income, expenses, and net worth.
- **🤖 AI Insights**: Powered by Google Gemini, get personalized insights into your spending habits and financial advice.
- **🏦 Bank Integration**: Securely link your bank accounts using Setu Account Aggregator (AA) for automatic transaction syncing.
- **🧾 Smart Receipt Scanning**: Scan receipt images to automatically extract transaction details using AI.
- **📊 Interactive Charts**: Visual breakdown of your monthly spendings and category-wise distribution.
- **📝 Transaction Management**: Search, filter, and manage your transactions with ease.
- **📅 Budgeting & Alerts**: Set monthly budgets and get email alerts via Resend when you're close to exceeding them.
- **💎 Subscription Plans**: Upgrade to Pro for unlimited insights and advanced features (integrated with Razorpay).
- **🌓 Global Dark Mode**: Fully responsive interface with light and dark mode support.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: JavaScript / React 19
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Styling**: Tailwind CSS
- **AI**: [Google Gemini](https://ai.google.dev/) (Generative AI)
- **Payments**: [Razorpay](https://razorpay.com/)
- **Bank Aggregation**: [Setu AA](https://setu.co/)
- **Email**: [Resend](https://resend.com/) with React Email
- **Security**: [Arcjet](https://arcjet.com/) for rate limiting and bot protection
- **Background Jobs**: [Inngest](https://www.inngest.com/)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/wealnex.git
   cd wealnex
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add the following keys:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host:port/dbname?schema=public"

   # Authentication (Clerk)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

   # Google Gemini AI
   GEMINI_API_KEY=AIzaSy...

   # Resend Email
   RESEND_API_KEY=re_...

   # Razorpay Payments
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...

   # Arcjet Security
   ARCJET_KEY=aj_...

   # Setu Account Aggregator
   SETU_SERVICE_URL=... # Your AWS Proxy URL if using proxy
   SETU_CLIENT_ID=...
   SETU_CLIENT_SECRET=...
   SETU_PRODUCT_ID=...
   SETU_ENV=sandbox # or production
   SETU_USE_DIRECT=true # Set to true for local dev, false for proxy
   
   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Initialize Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint.
- `npx prisma studio`: Opens the Prisma Studio to view database records.
- `npx inngest-cli dev`: Starts the Inngest local development server.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

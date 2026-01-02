# WealthDash

WealthDash is a high-performance, mobile-responsive financial management platform built with React and Supabase. It provides a full-lifecycle solution for personal finance, ranging from secure authentication and real-time transaction tracking to advanced comparative analytics and professional PDF reporting.

---

## Core Features and Functionality

### 1. Authentication and Security

* **Secure Onboarding:** User registration and login powered by Supabase Auth (JWT-based).
* **Session Management:** Persistent login sessions with secure token handling and one-touch logout.
* **Protected Routes:** Frontend routing ensures that financial data is accessible only to authenticated owners.

### 2. Dashboard and Account Management

* **Real-Time Liquidity:** A live view of total net worth aggregated across all linked accounts.
* **Flexible Account Tracking:** Support for Bank, Cash, and Credit Card accounts with specialized logic for credit limits and debt utilization bars.
* **Full CRUD for Accounts:** Ability to create, edit balances, or delete entire accounts directly from the dashboard.

### 3. Transaction Management

* **Comprehensive Logging:** Record Income, Expenses, and Transfers with granular metadata (categories, descriptions, emojis).
* **Transaction Detail Modal:** Deep-dive into specific transaction details including necessity tags and notes.
* **Relational Integrity:** Transactions are linked via explicit foreign keys to accounts, ensuring that deleting a transaction correctly restores the associated account balance.

### 4. Advanced Analytics

* **Multi-Timeframe Filtering:** Toggle between Week, Month, or Year views with dynamic date pickers.
* **Visual Spending Breakdown:** Vertical bar charts for category comparisons and pie charts for spending sources (Card vs. Bank).
* **Period Comparison:** A side-by-side bar chart comparison tool to analyze performance between two different months.

### 5. Professional Reporting

* **On-Demand PDF Export:** Generate professional financial statements directly in the browser using `jsPDF`.
* **Automated Summaries:** Automatic calculation of total income and expenses for the filtered period included in the report header.

---

## Technical Stack

* **Frontend:** React 18, Tailwind CSS, Lucide React.
* **State & Logic:** `useMemo` for heavy data transformation, `localStorage` for UI preferences.
* **Visualization:** Recharts (SVG-based).
* **Backend:** Supabase (PostgreSQL) with Real-time capabilities.
* **Documentation/PDF:** jsPDF & AutoTable.

---

## Database Schema Setup

To ensure all analytics features function correctly, the following PostgreSQL structure is required in your Supabase SQL editor:

```sql
-- Accounts Table
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  type text NOT NULL, -- 'Bank', 'Cash', or 'Credit Card'
  balance numeric DEFAULT 0,
  credit_limit numeric DEFAULT 0
);

-- Transactions Table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  date date NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL, -- 'Income', 'Expense', 'Transfer'
  category text,
  description text,
  emoji text,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES accounts(id)
);

```

---

## Getting Started

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/wealthdash.git
cd wealthdash

```


2. **Install dependencies:**
```bash
npm install

```


3. **Environment Variables:**
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

```


4. **Run Development Server:**
```bash
npm run dev

```



---

## Contributing & Collaboration

We welcome contributions! To make the process collaborative and organized, please follow these steps:

### Raising a Pull Request (PR)

1. **Fork the Project:** Create your own copy of the repository.
2. **Create a Feature Branch:** `git checkout -b feature/AmazingFeature`.
3. **Commit Your Changes:** `git commit -m 'Add some AmazingFeature'`.
4. **Push to the Branch:** `git push origin feature/AmazingFeature`.
5. **Open a PR:** Describe your changes in detail, including screenshots of UI changes if applicable.

### Areas for Contribution

* **Mobile Optimizations:** Improving the "No-Scrollbar" experience on smaller devices.
* **New Charts:** Adding "Savings Rate" or "Burn Rate" visualizations.
* **Budgeting:** Implementing a feature to set monthly limits per category.
* **Localization:** Adding support for multiple currencies and languages.

---

## Support

If you encounter any issues or have questions, please open an **Issue** on the GitHub repository.

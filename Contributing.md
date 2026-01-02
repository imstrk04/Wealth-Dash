# Contributing to WealthDash

First off, thank you for considering contributing to WealthDash! It’s people like you that make it a great tool for everyone.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and professional environment for all contributors.

## How Can I Contribute?

### 1. Reporting Bugs

* Check the "Issues" tab to see if the bug has already been reported.
* If not, open a new issue. Include a clear title, steps to reproduce the bug, and the expected behavior.

### 2. Suggesting Enhancements

* Open an issue with the tag `enhancement`.
* Explain why this feature would be useful and how it should work.

### 3. Pull Requests

1. **Fork the repo** and create your branch from `main`.
2. **Install dependencies** using `npm install`.
3. **Link your Supabase instance** using a `.env` file (never commit this file!).
4. If you've added code that should be tested, add tests.
5. Ensure your code follows the **Coding Standards** below.
6. Issue a Pull Request to the `main` branch.

---

## Coding Standards

### React Components

* **Functional Components:** Use functional components with hooks exclusively.
* **Prop Destructuring:** Destructure props in the function signature.
* **Cleanup:** Always include cleanup functions in `useEffect` if you are using subscriptions or timers.

### Styling

* **Tailwind CSS:** Use Tailwind for all styling. Avoid custom CSS files unless absolutely necessary.
* **Dark Mode:** Always use the `dark:` prefix to ensure the UI remains consistent for dark mode users.

### Database Logic (Supabase)

* **Explicit Joins:** When fetching transactions joined with accounts, use explicit foreign key naming:
```javascript
.select('*, accounts:accounts!transactions_account_id_fkey(name, type)')

```


* **Error Handling:** Always check for `error` returned from Supabase calls and log it clearly.

### Naming Conventions

* **Components:** PascalCase (e.g., `AddTransaction.jsx`).
* **Functions/Variables:** camelCase (e.g., `fetchData`).
* **Constants:** UPPER_SNAKE_CASE (e.g., `EMOJI_LIST`).

---

## Deployment Logic

WealthDash is designed to be deployed on Vercel. Ensure that any new environment variables are documented in the README so other collaborators can update their local `.env` files.

--
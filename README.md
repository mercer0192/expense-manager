# Expense Manager

Expense Manager is a personal project I’m building while learning backend and frontend development. It lets me record expenses, organize them by month, and see how the totals look in different currencies.

## What it does

- Create, edit, and delete expenses.
- Filter and sort expenses, and view totals and the largest expense for a selected period.
- Add and manage currencies with rates based on MYR.
- Convert expense amounts for display in the currency selected on the dashboard.
- Cache currency rates in Redis, with MySQL as the fallback when Redis is unavailable.

The amount entered for an expense stays saved in its original currency. Changing the dashboard currency changes how the amount is displayed; it doesn’t overwrite the saved amount.

Currency rates are managed in the app. The daily noon job refreshes Redis from the rates in MySQL; it does not fetch live exchange rates.

## Built with

- **Backend:** Java 21, Spring Boot, Spring Data JPA, Liquibase, MySQL, Redis
- **Frontend:** React, Vite

## Run locally

You’ll need Java 21, Maven, Node.js/npm, MySQL, and Docker Desktop.

### 1. Create the MySQL database

Create a database named `wallace_dev`:

```sql
CREATE DATABASE wallace_dev;
```

The backend reads the database username and password from `DB_USERNAME` and `DB_PASSWORD`. Set those environment variables locally before starting the backend; don’t put your database password in this repository.

For example, in PowerShell:

```powershell
$env:DB_NAME = "wallace_dev"
$env:DB_USERNAME = "your_mysql_username"
$env:DB_PASSWORD = "your_mysql_password"
```

`DB_NAME` is optional; it defaults to `wallace_dev`. If you use a different name, create that database in MySQL and set `DB_NAME` to the same value. Liquibase creates and updates the tables when the backend starts.

### 2. Start Redis

Start Docker Desktop and wait for it to finish starting. The first time, create and start the Redis container:

```powershell
docker run -d --name expense-redis -p 6379:6379 redis:latest
```

On later runs, start the existing container instead:

```powershell
docker start expense-redis
```

### 3. Start the backend

In a terminal, from the repository root:

```powershell
cd backend
mvn spring-boot:run
```

The API runs at `http://localhost:8080`.

### 4. Start the frontend

Open a second terminal from the repository root:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open the local URL Vite prints, usually `http://localhost:5173`. The frontend proxies `/api` requests to the backend.

If you use Command Prompt instead of PowerShell, you can use `npm` rather than `npm.cmd`.

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/expenses` | List expenses; optionally pass `?currency=USD` to convert for display |
| `POST` | `/api/expenses` | Create an expense |
| `GET` | `/api/expenses/get/{id}` | Get one expense |
| `PUT` | `/api/expenses/update/{id}` | Update an expense |
| `DELETE` | `/api/expenses/delete/{id}` | Delete an expense |
| `GET`, `POST` | `/api/currencies` | List or create currencies |
| `GET` | `/api/currencies/get/{id}` | Get one currency |
| `PUT` | `/api/currencies/update/{id}` | Update a currency |
| `DELETE` | `/api/currencies/delete/{id}` | Delete a currency |

The base currency is MYR. A rate means how many MYR one unit of that currency is worth. For example, a USD rate of `4.45` means `1 USD = 4.45 MYR`.

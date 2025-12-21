# PostgreSQL Setup for VentVault

## Step 1: Find Your PostgreSQL Password

Your PostgreSQL password was set during installation. If you don't remember it:

### Option A: Reset PostgreSQL Password (Windows)

1. Open Command Prompt as Administrator
2. Run:
```cmd
psql -U postgres
```
3. If it asks for password and you don't know it, you'll need to reset it.

### Option B: Use pgAdmin

1. Open pgAdmin (installed with PostgreSQL)
2. Connect to your local server
3. Right-click on "postgres" user → Properties → Definition
4. Set a new password

## Step 2: Update .env File

Edit `backend/.env` and replace this line:

```env
DATABASE_URL=postgresql+asyncpg://postgres:your_postgres_password@localhost:5432/ventvault
```

With your actual password:

```env
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/ventvault
```

**Example:**
If your password is `mypass123`, use:
```env
DATABASE_URL=postgresql+asyncpg://postgres:mypass123@localhost:5432/ventvault
```

## Step 3: Verify Database Exists

The database `ventvault` has already been created. Verify with:

```powershell
psql -U postgres -c "\l" | findstr ventvault
```

## Step 4: Install Python Dependencies

```powershell
cd backend
pip install -r requirements.txt
```

## Step 5: Initialize Database Tables

```powershell
python scripts/init_db.py
```

This will create all the tables needed for VentVault.

## Step 6: Start Backend

```powershell
uvicorn app.main:app --reload
```

## Troubleshooting

### "password authentication failed"
- Your password in `.env` doesn't match PostgreSQL
- Update the password in `.env` file

### "database does not exist"
- Run: `psql -U postgres -c "CREATE DATABASE ventvault;"`

### "asyncpg not installed"
- Run: `pip install asyncpg`

### Connection refused
- Make sure PostgreSQL service is running
- Check Windows Services for "postgresql-x64-17"

## Quick Test Connection

Test your connection string:

```powershell
python -c "from app.config import get_settings; print(get_settings().database_url)"
```

This should print your database URL (with password visible, so be careful).

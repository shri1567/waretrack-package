# Windows Installation Guide

This is a complete step-by-step guide assuming nothing is installed on your Windows laptop yet. Total time: 25–35 minutes.

## What you'll install

| Tool | Why | Approx. install size |
|---|---|---|
| **MySQL Community Server 8.0** | The database itself | ~250 MB |
| **MySQL Workbench** | Visual GUI for querying / inspecting the DB | ~200 MB |
| **Node.js 20 LTS** | Runs the backend and frontend | ~80 MB |
| **Git** | Clone/manage the repository | ~100 MB |
| **VS Code** | Edit the code | ~100 MB |

---

## Step 1 — Install MySQL Community Server + Workbench (10 min)

1. Download the **MySQL Installer for Windows** from:
   **https://dev.mysql.com/downloads/installer/**

   Pick **"Windows (x86, 32-bit), MSI Installer"** — get the larger one (~450 MB), it includes everything offline.

2. Run the installer. When the **Setup Type** screen appears, choose **"Developer Default"** — this installs Server + Workbench + Shell + sample data, exactly what you need.

3. Click through. On the **High Availability** step, leave **Standalone MySQL Server** selected.

4. **Type and Networking** step: leave port at **3306**, leave defaults.

5. **Authentication Method**: pick **"Use Strong Password Encryption"** (default).

6. **Accounts and Roles**: set a **root password** — write it down somewhere. You'll need it once for setup. You can leave it short for local development (`root` is fine).

7. **Windows Service**: leave defaults. Service name `MySQL80`, **start at system startup**.

8. Finish the wizard. MySQL is now running as a Windows service.

**Verify:** Open Command Prompt, run:
```cmd
mysql -u root -p
```
Enter your password. If you see `mysql>`, you're good. Type `exit;` to leave.

> **If `mysql` isn't found:** add `C:\Program Files\MySQL\MySQL Server 8.0\bin` to your PATH:
> Win+R → `sysdm.cpl` → Advanced tab → Environment Variables → System variables → Path → Edit → New → paste the path → OK → restart Command Prompt.

---

## Step 2 — Install Node.js 20 LTS (3 min)

1. Download from **https://nodejs.org/** — pick the LTS button (currently 20.x).
2. Run the installer, accept all defaults. Make sure **"Automatically install necessary tools"** stays checked.
3. **Verify:** open a new Command Prompt:
   ```cmd
   node --version
   npm --version
   ```
   Both should print versions.

---

## Step 3 — Install Git (3 min)

1. Download from **https://git-scm.com/download/win** — the installer should auto-detect 64-bit.
2. Run the installer, accept all defaults. **Important:** on the "Adjusting your PATH environment" screen, select **"Git from the command line and also from 3rd-party software"**.
3. **Verify:** in a new Command Prompt:
   ```cmd
   git --version
   ```

---

## Step 4 — Install VS Code (3 min)

1. Download from **https://code.visualstudio.com/**.
2. Run installer, accept defaults. Tick **"Add to PATH"** if asked.
3. (Optional but recommended) After installing, open VS Code, press `Ctrl+Shift+X` to open Extensions, and install:
   - **ESLint** (for React)
   - **MySQL** by Jun Han (lets you run SQL files directly inside VS Code)
   - **Tailwind CSS IntelliSense**

---

## Step 5 — Get the WareTrack code (2 min)

Option A — clone from GitHub (after you push it):
```cmd
cd C:\Users\LENOVO\Documents
git clone https://github.com/YOUR_USERNAME/waretrack.git
cd waretrack
```

Option B — unzip the zip file I sent you:
1. Right-click `waretrack.zip` → Extract All → choose `C:\Users\LENOVO\Documents\waretrack`
2. Open Command Prompt and `cd C:\Users\LENOVO\Documents\waretrack`

---

## Step 6 — Run the one-command setup (5 min)

From the `waretrack` folder, double-click `setup.bat`. It will:
1. Prompt for your MySQL root password
2. Load all 6 SQL files into MySQL
3. Install backend npm packages (~250 MB)
4. Install frontend npm packages (~150 MB)

If you'd rather run things by hand:

```cmd
:: Load the database
mysql -u root -p < database\01_schema.sql
mysql -u root -p < database\02_functions.sql
mysql -u root -p < database\03_triggers.sql
mysql -u root -p < database\04_procedures.sql
mysql -u root -p < database\05_seed_data.sql

:: Install backend
cd backend
copy .env.example .env
:: Open .env in Notepad and set DB_PASSWORD=yourpassword
notepad .env
npm install
cd ..

:: Install frontend
cd frontend
npm install
cd ..
```

---

## Step 7 — Start the application (1 min)

Open **two** Command Prompt windows (or two terminals in VS Code).

**Window 1 — Backend:**
```cmd
cd C:\Users\LENOVO\Documents\waretrack\backend
npm run dev
```

You should see:
```
[DB] Connected to waretrack_db @ localhost:3306
  WareTrack API running on http://localhost:4000
```

**Window 2 — Frontend:**
```cmd
cd C:\Users\LENOVO\Documents\waretrack\frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in NNN ms
  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser. You should see the WareTrack Dashboard.

---

## Troubleshooting

**"ERROR 1045 (28000): Access denied for user 'root'"**
→ Your password is wrong. Re-run `setup.bat` or open `backend\.env` in Notepad and fix `DB_PASSWORD=`.

**"Can't connect to MySQL server on 'localhost' (10061)"**
→ MySQL service isn't running. Win+R → `services.msc` → find **MySQL80** → right-click → Start.

**"npm ERR! code EPERM"**
→ Run Command Prompt as Administrator and re-run `npm install`.

**Frontend shows blank page**
→ Open browser DevTools (F12) → Console tab. If you see "Network Error", the backend isn't running. Check Window 1.

**Backend can't reach the database after Windows restart**
→ The MySQL service may not have started. Win+R → `services.msc` → start **MySQL80**.

**Port 4000 / 5173 already in use**
→ Another process is using them. Find and kill it: `netstat -ano | findstr :4000` then `taskkill /PID <PID> /F`. Or change the port in `backend\.env` (and the corresponding `VITE_API_BASE` in `frontend\.env`).

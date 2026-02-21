 Copy local MongoDB to Atlas (mongodump / mongorestore)

Use this to copy your **local** `powermonitoring` database to **MongoDB Atlas** so the hosted app uses the same data.

---

## 1. Prerequisites

- **MongoDB Database Tools** installed (includes `mongodump` and `mongorestore`).
  - Download: https://www.mongodb.com/try/download/database-tools  
  - Choose **Windows x64**, install, and add the `bin` folder to your PATH.
- **Local MongoDB** running with your data (e.g. you already ran `npm run seed` in the backend).
- **Atlas connection string** (see step 3).

---

## 2. Get your Atlas connection string

1. Go to https://cloud.mongodb.com and sign in.
2. Open your project and cluster (e.g. **Cluster 0**).
3. Click **Connect** → **Connect your application** → copy the URI.
4. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your Atlas database user.  
   If the password has special characters (e.g. `#`, `@`, `%`), encode them (e.g. `%23` for `#`).
6. Add the database name before the `?` so the restore goes to the right DB:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/powermonitoring?retryWrites=true&w=majority
   ```
   Use this as your **ATLAS_URI** in the steps below.

---

## 3. Dump from local MongoDB

Open a terminal (PowerShell or Command Prompt) and run:

```powershell
cd "c:\Users\highe\Desktop\Current Project\auca power confiance\Web"
```

Create a folder for the dump (e.g. `dump`) and dump only the `powermonitoring` database:

```powershell
mongodump --uri="mongodb://localhost:27017/powermonitoring" --out=./dump
```

- If local MongoDB uses a different port or host, change the URI (e.g. `mongodb://localhost:27017/powermonitoring`).
- You should see a folder: `dump\powermonitoring` with `.bson` and `.metadata.json` files.

---

## 4. Restore into Atlas

Use the **same** Atlas URI you prepared in step 2 (with database name in the path). Replace the placeholder below with your real URI.

**PowerShell (one line):**

```powershell
mongorestore --uri="mongodb+srv://USER:PASSWORD@YOUR_CLUSTER.mongodb.net/powermonitoring?retryWrites=true&w=majority" --db=powermonitoring ./dump/powermonitoring
```

**If your password has special characters**, set the URI in a variable first so you can quote it properly:

```powershell
$ATLAS_URI = "mongodb+srv://USER:PASSWORD@YOUR_CLUSTER.mongodb.net/powermonitoring?retryWrites=true&w=majority"
mongorestore --uri=$ATLAS_URI --db=powermonitoring .\dump\powermonitoring
```

- `--db=powermonitoring` is the database name on Atlas (will be created if it doesn’t exist).
- `./dump/powermonitoring` (or `.\dump\powermonitoring`) is the folder created by `mongodump`.

When it finishes, you should see messages like “done” for each collection.

---

## 5. Clean up (optional)

Remove the local dump folder so you don’t commit it:

```powershell
Remove-Item -Recurse -Force .\dump
```

Add `dump/` to `.gitignore` if you run this often:

```
dump/
```

---

## 6. Use Atlas in your hosted app

- In **Render** (backend): set **MONGODB_URI** to the same Atlas URI (with `powermonitoring` in the path).
- Redeploy the backend so it uses Atlas instead of local MongoDB.

---

## Troubleshooting

| Problem | What to do |
|--------|------------|
| `mongodump` / `mongorestore` not found | Install MongoDB Database Tools and add their `bin` to PATH. |
| Local connection refused | Start local MongoDB (e.g. run `mongod` or start as a service). |
| Atlas authentication failed | Check username/password; URL-encode special characters in the password. |
| Atlas network error | In Atlas: Network Access → add `0.0.0.0/0` (or your IP) so the machine running `mongorestore` can reach Atlas. |
| “collection already exists” | Restore will overwrite by default. To drop the DB first: `mongorestore ... --drop` (use only if you want to replace everything in `powermonitoring`). |

---

## Quick reference (replace YOUR_ATLAS_URI)

```powershell
# 1. Dump local
mongodump --uri="mongodb://localhost:27017/powermonitoring" --out=./dump

# 2. Restore to Atlas
mongorestore --uri="YOUR_ATLAS_URI" --db=powermonitoring ./dump/powermonitoring

# 3. Delete dump folder
Remove-Item -Recurse -Force .\dump
```

---

## Your setup (backup on Desktop → Atlas test cluster)

**Step 1 – Dump local** (output to Desktop backup folder):

```powershell
& "C:\Program Files\MongoDB\Tools\100\bin\mongodump.exe" `
  --uri="mongodb://localhost:27017/powermonitoring" `
  --out="C:\Users\highe\Desktop\powermonitoring-backup"
```

This creates `C:\Users\highe\Desktop\powermonitoring-backup\powermonitoring` with the data.

**Step 2 – Restore to Atlas** (cluster: test.3ajondn.mongodb.net):

```powershell
& "C:\Program Files\MongoDB\Tools\100\bin\mongorestore.exe" `
  --uri="mongodb+srv://USERNAME:PASSWORD_ENCODED@test.3ajondn.mongodb.net/?retryWrites=true&w=majority&appName=test" `
  --db=powermonitoring `
  "C:\Users\highe\Desktop\powermonitoring-backup\powermonitoring"
```

- Replace `USERNAME` with your Atlas user (e.g. `monchel`).
- Replace `PASSWORD_ENCODED` with your password; if it contains `@`, use `%40` (e.g. `M%40nchel1236` for `M@nchel1236`).

So yes: use the full path to `mongorestore.exe`, your Atlas URI with encoded password, `--db=powermonitoring`, and the path to the **folder that contains the collection files** (the `powermonitoring` folder inside your backup).

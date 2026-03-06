# ⚔️ D&D 5e Virtual Tabletop

A comprehensive browser-based Dungeons & Dragons 5th Edition platform with full SRD rules, character creation, combat tracking, battle maps, dice rolling, and DM tools.

---

## 🚀 Deploy to GitHub Pages (Step by Step)

### Prerequisites
- A [GitHub account](https://github.com)
- [Git](https://git-scm.com/downloads) installed on your computer
- [Node.js](https://nodejs.org/) installed (version 18+, download the LTS version)

### Step 1 — Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `dnd5e-vtt` (or whatever you like)
3. Set it to **Public**
4. **Do NOT** check "Add a README" (we already have one)
5. Click **Create repository**

### Step 2 — Upload This Project

Open a terminal/command prompt in **this folder** and run these commands one by one:

```bash
git init
git add .
git commit -m "Initial commit - D&D 5e VTT"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dnd5e-vtt.git
git push -u origin main
```

> ⚠️ Replace `YOUR_USERNAME` with your actual GitHub username!

### Step 3 — Enable GitHub Pages

1. Go to your repo on GitHub
2. Click **Settings** (top menu bar)
3. Click **Pages** (left sidebar)
4. Under **Source**, select **GitHub Actions**
5. That's it! The workflow will auto-deploy.

### Step 4 — Wait & Visit

1. Click the **Actions** tab on your repo to watch the build
2. Wait 1-2 minutes for it to finish (green checkmark)
3. Your site is live at:

```
https://YOUR_USERNAME.github.io/dnd5e-vtt/
```

---

## ⚠️ If Your Repo Name Is Different

If you named your repo something other than `dnd5e-vtt`, you must update the base path:

1. Open `vite.config.js`
2. Change the `base` value to match your repo name:
   ```js
   base: '/your-repo-name/',
   ```
3. Commit and push the change

---

## 💻 Run Locally (for Development)

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## 📦 What's Included

| Feature | Description |
|---------|-------------|
| **Character Creator** | All SRD races, classes, backgrounds, 4 stat methods |
| **Character Sheet** | Clickable stats, skills, saves — auto-rolls with modifiers |
| **Combat Tracker** | Initiative, turn order, HP tracking, action economy |
| **Battle Map** | 20×14 grid, drag tokens, fog of war |
| **Dice Roller** | All dice types, advantage/disadvantage, animated results |
| **Spell Reference** | 33+ SRD spells with search and filters |
| **Monster Manual** | 14 SRD monsters CR 1/8 to CR 21 |
| **DM Tools** | NPC/tavern/dungeon generators, loot tables, encounter builder |
| **Campaign Select** | 12 official campaigns + custom |
| **Chat Log** | Shared message and dice log |

---

## 📜 License

Game content follows the D&D 5e System Reference Document (SRD) under the Open Game License (OGL v1.0a).
This project is not affiliated with or endorsed by Wizards of the Coast.

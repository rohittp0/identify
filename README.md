# 🕵️‍♂️ Identify - Telegram Bot Chat Locator

![Identify Cover](https://img.shields.io/badge/Identify-🕵️‍♂️-blue?style=for-the-badge&logo=telegram)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)

Welcome to **Identify**, the slickest, most covert way to see exactly where your Telegram bot is hanging out. 

Ever lose track of which group chats your bot was invited to? Or maybe you just want to grab a Chat ID without jumping through flaming API hoops? **Identify** has your back.

## ✨ Features

- **Sleek, Dark UI:** Because real hackers work in the dark. Built with a beautiful glassmorphic aesthetic.
- **Instant Discovery:** Pop in your bot token, and we'll instantly tell you who your bot is, and start polling the matrix (Telegram's `getUpdates` API) to find out every chat it's a part of.
- **Live Updating:** The dashboard constantly listens for new chats. Add the bot to a new group, and watch it pop up on the screen like magic! 🎩✨
- **One-Click Copy:** See a Chat ID? Click it. Boom. It's in your clipboard. No more manual highlighting.
- **Client-Side Only:** Your bot token stays in **your** browser's local storage. We don't save it, we don't send it anywhere except straight to Telegram. 

## 🚀 How to Use (The Fun Way)

1. **Fire it up:** Open the app.
2. **The Secret Key:** Paste your super-secret Telegram Bot token (the one from the legendary [@BotFather](https://t.me/BotFather)) into the glowing input box.
3. **Connect:** Hit the "Connect Bot" button.
4. **Be Amazed:** Watch as Identify reveals your bot's true name and begins scanning the ether for chat affiliations.
5. **Action:** Send a message to your bot or add it to a group, and watch the table populate instantly!

## 🛠️ Tech Stack

- **React:** For that buttery smooth component magic.
- **Vite:** Because waiting for builds is so 2019.
- **React Router:** Handling the navigation (with query params so GitHub Pages doesn't cry).
- **Lucide React:** Beautiful, crisp icons.
- **Vanilla CSS:** Pure, unadulterated style variables and glass effects. No bloated frameworks here!

## 💻 Running it Locally

Want to mess around with the code? Excellent.

```bash
# Clone the repository (you know the drill)
git clone <your-repo-url>
cd identify

# Install the shiny dependencies
npm install

# Start the dev server and put on your hacker shades 😎
npm run dev
```

## 🚀 Deployment

This app is locked, loaded, and ready for **GitHub Pages**.

We even included a handy-dandy GitHub Action (`.github/workflows/deploy.yml`) that will automatically build and deploy your app every time you push to `main`. 

> **Pro Tip:** We use query params (e.g., `?bot=YourBotName`) for the dashboard route. This is a neat trick to make sure GitHub Pages doesn't throw a 404 when you hit refresh! 🧠

---

*Built with ❤️ and way too much dark mode by [Your Name/Handle].*

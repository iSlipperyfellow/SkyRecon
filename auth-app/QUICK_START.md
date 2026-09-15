# Quick Reference - Auth App

## ⚡ Common Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build locally

# Docker
docker-compose up --build    # Start all services
docker-compose down          # Stop services
docker build -t auth-app .   # Build image

# Git
git add .
git commit -m "message"
git push origin main
```

## 🔑 Firebase Setup (2 minutes)

1. Go to console.firebase.google.com
2. Create project → Enable Email/Password auth
3. Copy config from Project Settings
4. Create `.env.local`:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```
5. Done! ✅

## 🎨 Customize Colors

Edit `tailwind.config.js`:

```js
colors: {
  primary: {
    500: '#7c3aed',  // Change this
    600: '#6d28d9',
  },
  secondary: {
    500: '#0284c7',  // Change this
    600: '#0369a1',
  },
  accent: '#10b981'  // Change this
}
```

## 📱 File Locations

| Purpose | Location |
|---------|----------|
| Pages | `src/pages/*.jsx` |
| Components | `src/components/*/*.jsx` |
| Auth Logic | `src/services/authService.js` |
| Auth State | `src/context/AuthContext.jsx` |
| Theme State | `src/context/ThemeContext.jsx` |
| Routes | `src/routes/index.jsx` |
| Styles | `src/styles/globals.css` |
| Config | `vite.config.js`, `tailwind.config.js` |

## 🚀 Deploy (Choose One)

### Vercel (Easiest)
```bash
git push origin main
# Visit vercel.com → New Project → Select repo → Deploy
```

### Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

### Docker
```bash
docker-compose up --build
# Runs on http://localhost
```

### AWS/Netlify
- Connect GitHub repo
- Set build: `npm run build`
- Set output: `dist`
- Add env vars
- Deploy ✅

## 🧪 Test Checklist

- [ ] Signup with email works
- [ ] Login with email works
- [ ] Forgot password sends email
- [ ] Reset password works
- [ ] Dashboard shows after login
- [ ] Theme toggle works
- [ ] Theme persists on refresh
- [ ] Protected routes block non-auth users
- [ ] Mobile view is responsive
- [ ] All animations smooth

## 🐛 Quick Fixes

### App won't start
```bash
rm -rf node_modules
npm install
npm run dev
```

### Firebase not working
- Check .env.local has all keys
- Check Firebase Console → Email/Password is enabled
- Check Firebase Console → Users tab for sign-ups

### Build fails
```bash
npm run build -- --force
```

### Docker issues
```bash
docker-compose logs -f
# Check error message and fix
```

## 📖 Documentation

| File | Purpose |
|------|---------|
| README.md | Features, setup, deployment guides |
| SETUP_GUIDE.md | Detailed installation & troubleshooting |
| DELIVERY_SUMMARY.md | What's included |
| .env.example | Environment variables template |

## 🎯 Project Structure

```
auth-app/
├── src/
│   ├── pages/           ← Add new pages here
│   ├── components/      ← Add new components here
│   ├── services/        ← API/Firebase logic
│   ├── context/         ← State management
│   ├── hooks/           ← Custom hooks
│   ├── routes/          ← Route definitions
│   └── styles/          ← Global styles
├── package.json         ← Dependencies
├── vite.config.js       ← Build config
├── tailwind.config.js   ← Theme config
├── .env.local          ← Your Firebase keys (DON'T commit)
└── .env.example        ← Template (commit this)
```

## 💾 Key Features

✨ Authentication
- Email/Password signup & login
- Forgot password flow
- Password reset
- Remember me option

🎨 UI
- Light/Dark theme
- Beautiful animations
- Glass morphism design
- Responsive layout

🔐 Security
- Protected routes
- Firebase authentication
- Password validation
- Secure context patterns

## 🆘 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Module not found" | Run `npm install` again |
| Firebase not working | Check .env.local has all keys |
| Dark mode not saving | Clear localStorage |
| Build fails | Run `npm run build -- --force` |
| Port 5173 in use | Change port in vite.config.js |
| Docker won't start | Run `docker-compose logs` to see error |

## 📚 Resources

- React docs: https://react.dev
- Vite docs: https://vitejs.dev
- Tailwind CSS: https://tailwindcss.com
- Firebase: https://firebase.google.com/docs
- Framer Motion: https://www.framer.com/motion/

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com)
- [Vercel Deploy](https://vercel.com)
- [GitHub](https://github.com)
- [npm Registry](https://www.npmjs.com)
- [Stack Overflow](https://stackoverflow.com)

## 💡 Pro Tips

1. Use Chrome DevTools → Application → LocalStorage to debug theme
2. Check Firebase Console → Logs for authentication errors
3. Use browser console (F12) to see JavaScript errors
4. Add `?debug=true` to URL for debug output
5. Test on mobile with `npm run dev` then open from phone IP

## 📞 Get Help

1. **Read docs first** - Most answers are in README.md
2. **Check console** - F12 → Console tab
3. **Check Firebase** - Console → Logs
4. **Stack Overflow** - Search your error message
5. **Create issue** - Document the problem clearly

---

**Everything you need to know in one page!** 🎯

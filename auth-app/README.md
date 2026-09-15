# Premium Authentication Web Application

A modern, feature-rich authentication system built with React, Vite, and Firebase. Beautiful UI with light/dark theme support, smooth animations, and complete auth flows.

## ✨ Features

- ✅ **Modern UI** - Glass morphism design with Framer Motion animations
- ✅ **Authentication** - Complete login, signup, forgot password, and reset flows
- ✅ **Theme Support** - Light/dark mode with localStorage persistence
- ✅ **Firebase Integration** - Built-in Firebase authentication
- ✅ **Protected Routes** - Route guards for authenticated pages
- ✅ **Animations** - Smooth Framer Motion transitions throughout
- ✅ **Responsive Design** - Mobile-first, works on all devices
- ✅ **Password Strength** - Real-time password strength indicator
- ✅ **Professional Dashboard** - User dashboard with stats and activity
- ✅ **Settings Page** - Theme preferences and account management
- ✅ **Profile Page** - View and manage user information

## 🎨 Brand Colors

- **Primary** - Deep Purple: `#7c3aed`
- **Secondary** - Electric Blue: `#0284c7`
- **Accent** - Neon Green: `#10b981`

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Firebase account (for authentication)

### Installation

1. **Clone/Extract the project**
```bash
cd auth-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Email/Password authentication
   - Copy your Firebase config

4. **Configure environment variables**
   - Copy `.env.example` to `.env.local`
   - Add your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Development

```bash
# Start development server
npm run dev
```

Server runs on `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
auth-app/
├── src/
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   │   ├── LoginForm.jsx
│   │   │   ├── SignupForm.jsx
│   │   │   ├── PasswordInput.jsx
│   │   │   └── PasswordStrength.jsx
│   │   ├── common/            # Shared components
│   │   │   ├── ThemeToggle.jsx
│   │   │   └── LoadingScreen.jsx
│   │   └── dashboard/         # Dashboard components
│   │       ├── DashboardNav.jsx
│   │       └── ProfileCard.jsx
│   ├── context/               # React Context
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── hooks/                 # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useTheme.js
│   │   └── usePasswordStrength.js
│   ├── pages/                 # Page components
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Profile.jsx
│   │   ├── Settings.jsx
│   │   └── NotFound.jsx
│   ├── routes/                # Routing setup
│   │   ├── ProtectedRoute.jsx
│   │   └── index.jsx
│   ├── services/              # External services
│   │   ├── firebase.js
│   │   └── authService.js
│   ├── styles/
│   │   └── globals.css
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── .env.example
└── README.md
```

## 🔐 Firebase Setup

### Step-by-step Firebase Configuration

1. **Create Firebase Project**
   - Visit [Firebase Console](https://console.firebase.google.com)
   - Click "Create a project"
   - Follow the setup wizard

2. **Enable Authentication**
   - Go to "Authentication" in the left sidebar
   - Click "Get started"
   - Select "Email/Password" provider
   - Enable it

3. **Get Your Credentials**
   - Go to Project Settings (gear icon)
   - Click "Your apps"
   - Select your web app or create one
   - Copy the Firebase config

4. **Add to .env.local**
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyD...
   VITE_FIREBASE_AUTH_DOMAIN=yourapp.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=yourapp-12345
   VITE_FIREBASE_STORAGE_BUCKET=yourapp.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/auth-app.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository
   - Add environment variables from `.env.local`
   - Click "Deploy"

### Deploy to Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Build the project**
   ```bash
   npm run build
   ```

3. **Initialize Firebase Hosting**
   ```bash
   firebase init hosting
   ```
   - Select "Use an existing project"
   - Choose your project
   - Select "dist" as public directory
   - Configure as single-page app: Yes

4. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

## 📱 User Guide

### Creating an Account

1. Click "Sign Up" on the landing page
2. Enter your name, email, and password
3. Password must be at least 6 characters
4. Click "Create Account"
5. You're automatically logged in and redirected to the dashboard

### Logging In

1. Click "Log In" on the landing page
2. Enter your email and password
3. Optionally check "Remember me" to stay logged in
4. Click "Sign In"

### Resetting Password

1. On the login page, click "Forgot password?"
2. Enter your email address
3. Firebase will send a password reset link
4. Check your email and click the link
5. Enter your new password
6. You can now log in with your new password

### Changing Theme

1. Click the sun/moon icon in the top right corner
2. The app will switch between light and dark mode
3. Your preference is saved automatically

### Accessing Your Profile

1. After logging in, click your name in the top navigation
2. You'll see your profile information
3. Click "Change Password" to update your security

## 🔧 Troubleshooting

### "Module not found" errors

**Solution:** Make sure all files are in the correct directories and imports match the file structure.

### Firebase authentication not working

**Solution:** 
- Check that `.env.local` has correct Firebase credentials
- Verify that Email/Password authentication is enabled in Firebase
- Make sure the domain is in Firebase's authorized domains list

### Dark mode not persisting

**Solution:** 
- Clear browser cache and localStorage
- Check browser console for errors
- Ensure localStorage is not disabled

### Build fails with TypeScript errors

**Solution:**
```bash
npm run build -- --force
```

## 📚 Technologies Used

- **React** 18.3.1 - UI library
- **Vite** 5.2.0 - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** 3.4.1 - Styling
- **Framer Motion** 11.0.8 - Animations
- **Firebase** 10.8.0 - Authentication
- **React Router** 6.28.0 - Routing
- **Lucide Icons** - UI icons
- **Sonner** - Notifications

## 📄 Environment Variables

```
VITE_FIREBASE_API_KEY          - Firebase API key
VITE_FIREBASE_AUTH_DOMAIN      - Firebase auth domain
VITE_FIREBASE_PROJECT_ID       - Firebase project ID
VITE_FIREBASE_STORAGE_BUCKET   - Firebase storage bucket
VITE_FIREBASE_MESSAGING_SENDER_ID - Firebase sender ID
VITE_FIREBASE_APP_ID           - Firebase app ID
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

MIT License - feel free to use this project for any purpose

## 💡 Tips & Tricks

### Customize Colors

Edit `tailwind.config.js` to change brand colors:

```js
colors: {
  primary: {
    50: '#fdf2f8',
    500: '#7c3aed',  // Deep Purple
    600: '#6d28d9',
    700: '#5b21b6',
  },
  secondary: {
    500: '#0284c7',  // Electric Blue
    600: '#0369a1',
  },
  accent: '#10b981'  // Neon Green
}
```

### Add More Pages

1. Create new component in `src/pages/`
2. Add route to `src/routes/index.jsx`
3. Import and add to routes array

### Customize Animations

Edit `src/styles/globals.css` to modify Framer Motion animations:

```css
@keyframes gradient-shift {
  0%, 100% { ... }
  50% { ... }
}
```

## 🐛 Reporting Issues

Found a bug? Create an issue with:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

## 🚀 Roadmap

- [ ] Two-factor authentication
- [ ] Social login (Google, GitHub)
- [ ] Profile picture upload
- [ ] Email notifications
- [ ] Account recovery codes
- [ ] Session management
- [ ] Activity log

---

**Ready to use?** Run `npm install` → Update `.env.local` → `npm run dev` → Start building! 🎉

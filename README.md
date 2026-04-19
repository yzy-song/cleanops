# ChimeraLens AI

**Transform your photos into stunning, stylized portraits with a single click. ChimeraLens is a full-stack AI face-swapping application that allows you to blend your face with artistic templates.**

![ChimeraLens Demo](https://res.cloudinary.com/deaxv6w30/image/upload/v1758833446/Gemini_Generated_Image_n1rtbpn1rtbpn1rt_hyaw8k.png)

## ✨ Features

- **🎨 AI-Powered Face Swapping**: Upload your photo, choose a style from our curated templates, and let the AI work its magic
- **👥 Guest & Registered Users**: Try the app without an account. Sign up to save your creations and manage your profile
- **🔐 Social & Email Login**: Quick and easy authentication using Google or traditional email and password
- **💳 Credit System**: Start with free credits and purchase more through our secure Stripe integration
- **🖼️ Personal Gallery**: All your creations are saved in a personal, paginated gallery where you can view, download, or delete them
- **🎯 Intelligent Face Detection**: Automatically detects faces in your uploaded photos. If multiple faces are found, you can select which one to use
- **⚡ Image Optimization**: Images are compressed and optimized for speed and quality before being sent to the AI model
- **📱 Responsive Design**: A beautiful and intuitive interface that works seamlessly on both desktop and mobile devices

## 🛠️ Tech Stack

- **Monorepo**: pnpm Workspaces, Turborepo
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, React Query, Zustand
- **Backend**: NestJS, TypeScript, PostgreSQL, Prisma
- **AI**: Replicate API
- **Image Storage**: Cloudinary
- **Authentication**: JWT, Firebase Authentication
- **Payments**: Stripe
- **Deployment**: Vercel (Frontend), Render (Backend)

## 📦 Project Structure

```
chimeralens/
├── apps/
│   ├── api/         # NestJS backend API
│   └── web/         # Next.js frontend application
├── packages/
│   ├── db/          # Shared database package (Prisma schema & client)
│   └── ui/          # Shared UI components
└── turbo.json       # Turborepo configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm
- PostgreSQL database

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/chimeralens.git
   cd chimeralens
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` file in `apps/api/` and a `.env.local` file in `apps/web/` based on the example files:

   ```bash
   # apps/api/.env
   DATABASE_URL="postgresql://postgres:abc%40123456@localhost:5432/db-cleanops?schema=public"
   JWT_SECRET="your-jwt-secret"
   REPLICATE_API_TOKEN="your-replicate-token"
   CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
   CLOUDINARY_API_KEY="your-cloudinary-key"
   CLOUDINARY_API_SECRET="your-cloudinary-secret"
   STRIPE_SECRET_KEY="your-stripe-secret"
   STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
   FIREBASE_PROJECT_ID="your-firebase-project"
   ```

   ```bash
   # apps/web/.env.local
   NEXT_PUBLIC_API_URL="http://localhost:3000"
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
   NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
   ```

4. **Set up the database**

   ```bash
   pnpm -F @chimeralens/db db:push
   ```

5. **Start development servers**

   ```bash
   pnpm dev
   ```

   - Frontend: http://localhost:3001
   - Backend: http://localhost:3000

## 💡 Core Concepts

### Monorepo Architecture

The project uses pnpm Workspaces and Turborepo for efficient development and deployment across multiple packages.

### Authentication System

- **Guest Mode**: Device fingerprinting allows instant access without registration
- **Registered Users**: JWT-based authentication with email/password or Google OAuth
- **Session Management**: Secure token-based authentication with automatic refresh

### AI Integration

- **Face Detection**: Client-side MediaPipe for pre-processing and face selection
- **Image Processing**: Automatic cropping and optimization before AI processing
- **Asynchronous Generation**: Polling mechanism for handling long-running AI tasks

### Payment System

- **Credit-based Model**: Users purchase credits to generate images
- **Stripe Integration**: Secure checkout with webhook-based credit fulfillment
- **Guest Credits**: Free trial credits for first-time users

## 🔧 Development Scripts

```bash
# Development
pnpm dev              # Start all services in development mode
pnpm dev:api          # Start only the backend API
pnpm dev:web          # Start only the frontend

# Building
pnpm build            # Build all packages
pnpm build:api        # Build only the backend
pnpm build:web        # Build only the frontend

# Database
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Prisma Studio
pnpm db:generate      # Generate Prisma Client

# Linting & Testing
pnpm lint             # Lint all packages
```

## 🌟 What Makes This Project Special

- **Production-Ready**: Complete with authentication, payments, and error handling
- **Modern Stack**: Built with the latest tools and best practices
- **Scalable Architecture**: Monorepo structure allows for easy expansion
- **User Experience**: Seamless flow from guest to paid user
- **Performance**: Optimized images and efficient AI processing

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the ISC License - see the package.json file for details.

## 🔮 Future Improvements

- [ ] More AI models and style options
- [ ] Batch processing for multiple images
- [ ] Social sharing features
- [ ] Mobile app development
- [ ] Advanced editing tools
- [ ] Subscription-based pricing

---

**Built with ❤️ using modern web technologies**

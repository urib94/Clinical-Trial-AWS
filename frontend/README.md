# Clinical Trial Platform - Physician Admin Portal

A comprehensive Next.js 14 application providing physicians with an intuitive interface for managing clinical trials, patients, and questionnaires. Built with a focus on accessibility, security, and user experience for medical professionals.

## 🏥 Features

### Core Functionality
- **Dashboard**: Real-time statistics, patient activity monitoring, and quick actions
- **Questionnaire Builder**: Drag-and-drop interface for creating dynamic questionnaires
- **Patient Management**: Secure patient roster with invitation system and progress tracking
- **Analytics & Reporting**: Comprehensive data insights with export capabilities
- **Authentication**: JWT-based auth with MFA support and session management

### Technical Highlights
- **Next.js 14** with App Router and Server Components
- **TypeScript** for type safety and better developer experience
- **React Query** for efficient data fetching and caching
- **React DnD** for intuitive drag-and-drop questionnaire building
- **Chart.js** for data visualization and analytics
- **Tailwind CSS** with custom healthcare design system
- **Mobile-first responsive design** (≥360px viewport support)
- **WCAG 2.1 AA accessibility compliance**

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm 8+
- Backend API server running on `http://localhost:3001`

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Login page: http://localhost:3000/auth/login

## 📱 Application Structure

### Page Routes
```
/auth/login                    - Physician login
/physician/dashboard           - Main dashboard
/physician/questionnaires      - Questionnaire management
/physician/questionnaires/new  - Questionnaire builder
/physician/patients            - Patient roster
/physician/analytics           - Data insights & reports
```

### Key Components

#### Dashboard (`/src/components/physician/Dashboard.tsx`)
- Real-time patient statistics
- Recent activity feed
- Quick action shortcuts
- Performance metrics with customizable timeframes

#### Questionnaire Builder (`/src/components/physician/QuestionnaireBuilder.tsx`)
- Drag-and-drop question creation
- 9 question types (text, number, date, radio, checkbox, etc.)
- Real-time preview mode
- Form validation and settings

#### Patient Management (`/src/components/physician/PatientManagement.tsx`)
- Patient roster with search and filtering
- Status tracking and completion rates
- Secure invitation system
- Progress visualization

#### Analytics Dashboard (`/src/components/physician/AnalyticsDashboard.tsx`)
- Interactive charts and graphs
- Performance metrics by questionnaire
- Data export in multiple formats
- Time-based analysis

### Architecture

#### Authentication System
- JWT token management with automatic refresh
- MFA support for enhanced security
- Role-based access control
- Secure session handling

#### API Integration
- Centralized API client with error handling
- Request/response interceptors
- Automatic retry logic
- Loading state management

#### State Management
- React Context for global app state
- React Query for server state
- Local state for UI interactions
- Persistent user preferences

## 🎨 Design System

### Healthcare-Focused UI
- **Primary Blue**: #2563eb (Medical trust and reliability)
- **Secondary Teal**: #0d9488 (Healthcare accent)
- **Success Green**: #22c55e (Positive outcomes)
- **Warning Orange**: #f59e0b (Attention needed)
- **Error Red**: #ef4444 (Critical alerts)

### Accessibility Features
- **WCAG 2.1 AA compliant** with semantic HTML
- **Dynamic Type support** (100% to 200% scaling)
- **Keyboard navigation** for all functionality
- **Screen reader optimization** with proper ARIA labels
- **High contrast mode** support
- **Touch targets** ≥44px for mobile accessibility

### Responsive Design
- **Mobile-first** approach starting at 360px
- **Breakpoints**: 360px → 768px → 1024px → 1920px
- **Progressive enhancement** for larger screens
- **Touch-friendly** interactions on mobile

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run test         # Run Jest unit tests
npm run test:watch   # Run tests in watch mode
npm run e2e          # Run Playwright E2E tests
```

## 🔒 Security Features

### HIPAA Compliance
- **No PHI in browser storage** or client-side logs
- **Encrypted data transmission** with HTTPS
- **Session timeout** with automatic logout
- **Audit logging** for all user interactions
- **Secure token storage** using httpOnly cookies

### Authentication Security
- **JWT tokens** with short expiration times
- **Refresh token rotation** for enhanced security
- **MFA support** with TOTP/SMS options
- **Rate limiting** on authentication endpoints
- **CSRF protection** on all forms

## 📊 Performance Optimizations

### Core Web Vitals
- **Code splitting** by route and feature
- **Image optimization** with Next.js Image component
- **Bundle analysis** and tree shaking
- **Service worker** for caching strategies
- **Target Lighthouse score**: ≥90 on mobile

### Data Management
- **React Query** for efficient caching
- **Optimistic updates** for better UX
- **Background data syncing**
- **Pagination** for large datasets
- **Debounced search** inputs

## 🌐 Browser Support

### Desktop
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile
- iOS Safari 14+
- Chrome Android 90+
- Samsung Internet 14+

## 📈 Future Enhancements

### Planned Features
- **Real-time notifications** with WebSocket integration
- **Advanced analytics** with predictive insights
- **Mobile PWA** with offline questionnaire support
- **Voice commands** for hands-free data entry
- **EMR/EHR integration** APIs

### Accessibility Improvements
- **Voice navigation** for motor-impaired users
- **Eye tracking** integration support
- **Cognitive accessibility** simplified modes
- **Enhanced screen reader** support with medical terminology

## 🤝 Contributing

1. Follow the established code style and patterns
2. Ensure all tests pass before submitting
3. Add tests for new functionality
4. Update documentation as needed
5. Verify accessibility compliance

## 📄 License

This project is proprietary software developed for clinical trial management. All rights reserved.

---

**Note**: This frontend application requires the backend API server to be running for full functionality. See `README-BACKEND.md` for backend setup instructions.
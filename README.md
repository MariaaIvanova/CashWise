# CashWise

A comprehensive mobile application for financial education and management, built with React Native and Expo.

## Overview

FinanceApp is a modern mobile application designed to help users learn about financial management, make informed financial decisions, and track their financial progress. The app combines educational content with practical tools for financial planning and management.

## Features

### 1. Financial Education
- Interactive lessons on various financial topics
- Investment basics and strategies
- Understanding credit and loans
- Financial personality assessment
- Health insurance and pension planning
- Saving and financial planning

### 2. Financial Personality Test
- Personalized assessment of financial behavior
- Customized recommendations based on personality type
- Tips for improving financial habits
- Categories include:
  - Impulsive spender
  - Balanced realist
  - And more...

### 3. Interactive Learning
- Video lessons
- Interactive quizzes
- Visual elements (tables, graphs, icons)
- Progress tracking
- Practical examples and case studies

### 4. Technical Features
- Cross-platform (iOS and Android) support
- Offline capability
- Real-time data synchronization
- Secure authentication
- Push notifications

## Tech Stack

- **Frontend Framework**: React Native with Expo
- **Backend & Database**: Supabase
- **Authentication**: Supabase Auth
- **State Management**: React Context
- **UI Components**: React Native Paper
- **Additional Libraries**:
  - React Navigation for routing
  - Expo AV for media handling
  - React Native Calendars
  - Lottie for animations
  - EmailJS for email functionality

## Getting Started

### Prerequisites
- Node.js (LTS version)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Studio (for Android development)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd FinanceApp
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure environment variables:
Create a `.env` file in the root directory with the following variables:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_EMAILJS_SERVICE_ID=your_emailjs_service_id
EXPO_PUBLIC_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
EXPO_PUBLIC_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

4. Start the development server:
```bash
npm start
# or
yarn start
```

5. Run on your preferred platform:
```bash
# For iOS
npm run ios
# For Android
npm run android
# For web
npm run web
```

## Project Structure

```
FinanceApp/
├── assets/              # Static assets (images, icons)
├── components/          # Reusable React components
├── screens/            # Screen components
├── services/           # API and service integrations
├── types/              # TypeScript type definitions
├── lib/                # Utility functions and helpers
├── supabase/           # Database migrations and schemas
├── App.tsx             # Main application component
├── AppNavigator.tsx    # Navigation configuration
└── ThemeContext.tsx    # Theme management
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the 0BSD License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- Expo team for the amazing framework
- Supabase for the backend infrastructure
- All contributors who have helped shape this project

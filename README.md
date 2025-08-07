# Virtual Workspace Platform

A comprehensive virtual workspace platform that combines video conferencing, focus management, and AI-powered meeting assistance. Create and join virtual rooms for different purposes, participate in video/audio calls, track productivity with focus timers, and receive AI-generated meeting summaries.



## Features

### 🎥 Video Conferencing
- **Real-time Communication**: High-quality video and audio calls using WebRTC
- **Multiple Room Types**: Support for focus sessions, casual meetings, and structured meetings
- **Smart Controls**: Mute/unmute, video on/off, and speaking indicators
- **Flexible Participants**: Up to 12 participants per room with dynamic join/leave

### ⏱️ Focus Management
- **Productivity Timers**: Built-in Pomodoro and custom focus session timers
- **Quality Tracking**: Rate your focus sessions and track productivity over time
- **Session Notes**: Add notes and insights to your focus sessions
- **Progress Analytics**: View your focus session history and improvement patterns

### 🤖 AI-Powered Meeting Assistant
- **Automatic Summaries**: AI-generated meeting summaries from conversations
- **Action Items**: Extract and organize action items automatically
- **Key Decisions**: Identify and document important decisions made
- **Smart Insights**: Get productivity recommendations and break suggestions

### 🎵 Ambient Environment
- **Background Sounds**: Choose from rain, forest, fire, and other ambient sounds
- **Focus Enhancement**: Scientifically-backed audio environments for better concentration
- **Customizable Settings**: Adjust volume and sound preferences per room

## Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **shadcn/ui** components built on Radix UI primitives
- **Tailwind CSS** for responsive styling and theming
- **Framer Motion** for smooth animations

### Backend
- **Node.js** with Express.js framework
- **TypeScript** for full-stack type safety
- **WebSocket** for real-time communication and signaling
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** for production data storage
- **Passport.js** for authentication

### External Services
- **OpenAI GPT-4o** for meeting summaries and AI insights
- **Neon Database** for serverless PostgreSQL hosting
- **WebRTC** for peer-to-peer video/audio streaming

## Quick Start

### Prerequisites
- Node.js 20+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd virtual-workspace-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env` file with the following:
   ```env
   # Database (optional for development)
   DATABASE_URL=your_postgresql_connection_string
   
   # OpenAI API for AI features
   OPENAI_API_KEY=your_openai_api_key
   
   # Server configuration
   PORT=5000
   NODE_ENV=development
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5000` to access the platform

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and configurations
├── server/                 # Backend Express application
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Data storage abstraction
│   └── services/           # Business logic services
├── shared/                 # Shared TypeScript schemas
│   └── schema.ts           # Database and API type definitions
└── screenshots/            # Application screenshots
```

## Database Schema

The application uses a PostgreSQL database with the following main entities:

- **Users**: User profiles with authentication
- **Rooms**: Virtual meeting/focus rooms with different types
- **Room Participants**: Active participants in rooms
- **Focus Sessions**: Individual productivity tracking sessions
- **Meeting Notes**: AI-generated summaries and insights

## API Endpoints

### Rooms
- `GET /api/rooms/public` - Get all public rooms
- `GET /api/rooms/user/:userId` - Get user's rooms
- `POST /api/rooms` - Create a new room
- `GET /api/rooms/:id` - Get room details
- `DELETE /api/rooms/:id` - Delete a room

### Focus Sessions
- `GET /api/focus-sessions/:userId` - Get user's focus sessions
- `POST /api/focus-sessions` - Create a new focus session
- `PATCH /api/focus-sessions/:id` - Update focus session

### Meeting Notes
- `GET /api/meeting-notes/:roomId` - Get room's meeting notes
- `POST /api/meeting-notes` - Create meeting notes

## Real-time Features

The platform uses WebSockets for real-time communication:

- **Room Updates**: Live participant join/leave notifications
- **Video Signaling**: WebRTC signaling for video call establishment
- **Focus Status**: Real-time focus session updates
- **Chat Messages**: Instant messaging within rooms

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

### Development Storage

By default, the application uses in-memory storage for development. To use a PostgreSQL database, set the `DATABASE_URL` environment variable.

### Adding New Features

1. **Database Changes**: Update `shared/schema.ts` with new tables or columns
2. **API Routes**: Add new endpoints in `server/routes.ts`
3. **Frontend Components**: Create components in `client/src/components/`
4. **Storage Interface**: Update `server/storage.ts` for new data operations

## Deployment

The application is designed to run on Replit with automatic deployment:

1. **Build Process**: Runs `npm run build` to create production assets
2. **Server Start**: Uses `npm run start` to serve the application
3. **Environment**: Automatically detects production environment
4. **Port Configuration**: Uses the `PORT` environment variable

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `replit.md`
- Review the project architecture details

---

Built with ❤️ using modern web technologies for seamless virtual collaboration.

# Virtual Workspace Platform

A comprehensive virtual workspace platform that combines video conferencing, focus management, and AI-powered meeting assistance. Create and join virtual rooms for different purposes, participate in video/audio calls, track productivity with focus timers, and receive AI-generated meeting summaries.

## Features

### 🎥 Video Conferencing
- High-quality peer-to-peer video and audio calls
- Real-time participant management
- Mute/unmute audio and video controls
- WebRTC-based communication for low latency

### ⏰ Focus Management
- Dedicated focus sessions with customizable timers
- Productivity tracking and insights
- Focus quality rating and note-taking
- Break reminders and ambient sound integration

### 🤖 AI-Powered Meeting Assistant
- Automatic meeting summaries generation
- Action items extraction from conversations
- Key decisions tracking
- Participant insights and recommendations

### 🏠 Smart Room System
- **Focus Rooms**: Dedicated spaces for deep work and concentration
- **Casual Rooms**: Informal spaces for team bonding and casual conversations
- **Meeting Rooms**: Structured environments for formal meetings and presentations
- Public/private room options
- Customizable ambient sounds (rain, forest, fire, etc.)

## Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **shadcn/ui** components built on Radix UI for accessibility
- **Tailwind CSS** for responsive styling
- **TanStack Query** for server state management
- **Wouter** for lightweight routing
- **Framer Motion** for smooth animations

### Backend
- **Node.js** with Express.js framework
- **TypeScript** for full-stack type safety
- **WebSocket** server for real-time communication
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** database (Neon serverless)

### External Services
- **OpenAI GPT-4o** for AI-powered meeting assistance
- **WebRTC** for peer-to-peer video/audio communication
- **Neon Database** for serverless PostgreSQL hosting

## Quick Start

### Prerequisites
- Node.js 20 or higher
- PostgreSQL database (or use the included Neon setup)
- OpenAI API key (optional, for AI features)

### Installation

1. **Clone and install dependencies:**
   ```bash
   yarn install
   ```

2. **Set up environment variables:**
   Create a `.env` file with:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   OPENAI_API_KEY=your_openai_api_key
   PORT=5000
   ```

3. **Run database migrations:**
   ```bash
   npm run db:push
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/        # shadcn/ui components
│   │   │   ├── video-conference.tsx
│   │   │   ├── focus-timer.tsx
│   │   │   ├── ai-notes.tsx
│   │   │   └── ...
│   │   ├── pages/         # Route components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
├── server/                 # Backend Express application
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Data storage interface
│   ├── vite.ts           # Vite integration
│   └── services/         # Business logic services
├── shared/                # Shared types and schemas
│   └── schema.ts         # Database schema and types
└── ...
```

## API Endpoints

### Rooms
- `GET /api/rooms/public` - Get all public rooms
- `GET /api/rooms/user/:userId` - Get user's rooms
- `POST /api/rooms` - Create a new room
- `POST /api/rooms/:id/join` - Join a room
- `POST /api/rooms/:id/leave` - Leave a room

### Focus Sessions
- `GET /api/focus/sessions/:userId` - Get user's focus sessions
- `POST /api/focus/sessions` - Start a focus session
- `PUT /api/focus/sessions/:id` - End a focus session

### Meeting Notes
- `GET /api/meetings/:roomId/notes` - Get meeting notes
- `POST /api/meetings/notes` - Generate AI meeting summary

## Development

### Database Schema
The application uses a PostgreSQL database with the following main entities:
- **Users**: User profiles and authentication
- **Rooms**: Virtual workspace rooms with different types
- **Room Participants**: Active participants in rooms
- **Focus Sessions**: Individual focus tracking sessions
- **Meeting Notes**: AI-generated meeting summaries and insights

### Real-time Features
- WebSocket connections for live updates
- WebRTC peer-to-peer communication
- Real-time participant status updates
- Live focus session synchronization

### Security Features
- Client/server separation for secure API access
- Environment variable configuration
- Type-safe database operations
- Input validation with Zod schemas

## Building for Production

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm start
   ```

## Deployment

The application is configured for deployment on Replit with:
- Automatic dependency installation
- Environment variable management
- Port configuration (defaults to 5000)
- Production build optimization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions or support, please open an issue in the repository or contact the development team.
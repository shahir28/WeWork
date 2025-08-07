# Virtual Workspace Platform

## Overview

This is a comprehensive virtual workspace platform that combines video conferencing, focus management, and AI-powered meeting assistance. The application enables users to create and join virtual rooms for different purposes (focus sessions, casual meetings, or structured meetings), participate in video/audio calls, track productivity with focus timers, and receive AI-generated meeting summaries and insights.

The platform is built as a full-stack application with real-time communication capabilities, featuring a modern React frontend with shadcn/ui components and a Node.js/Express backend with WebSocket support for real-time features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client application is built with React and TypeScript, using Vite as the build tool. The architecture follows a component-based design with:

- **UI Framework**: shadcn/ui components built on Radix UI primitives for accessibility and customization
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live updates and WebRTC for peer-to-peer video/audio

### Backend Architecture
The server is built with Express.js and follows a modular approach:

- **Web Framework**: Express.js with TypeScript for type safety
- **Real-time Features**: WebSocket server for instant messaging and signaling
- **Storage Layer**: Abstracted storage interface supporting both in-memory and database implementations
- **API Design**: RESTful endpoints for CRUD operations with WebSocket events for real-time updates

### Data Storage Solutions
The application uses a flexible storage architecture:

- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configurable via DATABASE_URL)
- **Schema Design**: Normalized tables for users, rooms, participants, focus sessions, and meeting notes
- **Development**: In-memory storage implementation for development and testing

### Authentication and Authorization
Currently implements a simplified authentication system:

- **User Management**: Basic user profiles with usernames and passwords
- **Session Handling**: Mock authentication for development (user-1 hardcoded)
- **Room Access**: Public/private room distinction with participant management

### External Service Integrations

#### OpenAI Integration
- **Meeting Summaries**: Automatic generation of meeting summaries from transcripts
- **Focus Insights**: AI-powered productivity recommendations and break suggestions
- **Ambient Sound Suggestions**: Contextual audio environment recommendations
- **Model**: Uses GPT-4o for natural language processing tasks

#### Neon Database
- **Serverless PostgreSQL**: Production database hosting via @neondatabase/serverless
- **Connection Pooling**: Optimized for serverless environments
- **Migration Support**: Drizzle-kit for schema migrations

#### WebRTC Infrastructure
- **STUN Servers**: Google's public STUN servers for NAT traversal
- **Peer-to-peer Communication**: Direct browser-to-browser audio/video streaming
- **Signaling**: WebSocket-based signaling server for connection establishment

### Key Architectural Patterns

#### Real-time Communication
The platform implements a hybrid approach combining WebSockets for signaling and control messages with WebRTC for media streaming. This ensures low-latency communication while maintaining scalability.

#### Component Architecture
The frontend uses a modular component structure with separation of concerns between UI components, business logic hooks, and data fetching utilities. Each major feature (video conference, focus timer, AI notes) is encapsulated in its own component hierarchy.

#### Storage Abstraction
The backend implements a storage interface pattern that allows switching between different storage backends (in-memory for development, PostgreSQL for production) without changing business logic.

#### Responsive Design
The application implements a mobile-first responsive design using Tailwind CSS breakpoints and React hooks for device detection, ensuring usability across desktop and mobile devices.
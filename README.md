# LeadVibes CRM

> Multi-tenant CRM platform with gamification and AI assistant for real estate brokers.

![LeadVibes](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.13+-green.svg)
![React](https://img.shields.io/badge/react-19.0-blue.svg)
![MongoDB](https://img.shields.io/badge/mongodb-8.0-green.svg)

---

## Overview

LeadVibes is a comprehensive CRM platform designed specifically for real estate agencies. It combines lead management, gamification, and AI-powered assistance to help brokers close more deals.

### Key Features

- 🏢 **Multi-tenant**: Isolated data per real estate agency
- 🎯 **Lead Pipeline**: Track leads from initial contact to closed sale
- 🏆 **Gamification**: Points system and leaderboards to motivate teams
- 🤖 **AI Assistant**: Chat interface for sales coaching and lead analysis
- 📊 **Dashboard**: Real-time statistics and performance metrics
- 📝 **Activity Tracking**: Log all broker interactions with leads
- 📜 **Sales Scripts**: Repository of customizable sales scripts

---

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/softvibeslab/leadvibes.git
cd leadvibes

# Start all services
docker compose up -d

# Access the application
open http://localhost:3001
```

This will start:
- **Frontend** on port `3001`
- **Backend API** on port `8001`
- **MongoDB** on port `27018`

### Manual Setup

See [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) for detailed installation instructions.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/GETTING_STARTED.md) | Installation and first-time setup |
| [Architecture](docs/ARCHITECTURE.md) | System design and technical overview |
| [API Reference](docs/API_REFERENCE.md) | Complete REST API documentation |
| [Development](docs/DEVELOPMENT.md) | Developer guide and contribution |

---

## Technology Stack

### Backend
- **Python 3.13+** with FastAPI framework
- **MongoDB 8** for data persistence (via Motor async driver)
- **JWT** for authentication
- **LiteLLM** for AI/LLM integration
- **Pydantic v2** for data validation

### Frontend
- **React 19** for UI
- **TailwindCSS** for styling
- **Radix UI** for component primitives
- **React Router** for navigation
- **Axios** for HTTP client

### DevOps
- **Docker** for containerization
- **Docker Compose** for orchestration

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/me` - Get current user

### Leads
- `GET /api/leads` - List leads with filters
- `GET /api/leads/{id}` - Get lead details
- `POST /api/leads` - Create new lead
- `PUT /api/leads/{id}` - Update lead
- `POST /api/leads/{id}/analyze` - AI lead analysis
- `POST /api/leads/{id}/generate-script` - Generate sales script

### Activities
- `POST /api/activities` - Log activity + earn points
- `GET /api/activities` - List activities

### Dashboard
- `GET /api/dashboard/stats` - Current user statistics
- `GET /api/dashboard/leaderboard` - Monthly rankings
- `GET /api/dashboard/recent-activity` - Recent team activity

### Gamification
- `GET /api/gamification/rules` - List point rules
- `POST /api/gamification/rules` - Create new rule (admin/manager)
- `GET /api/gamification/points` - Point ledger history

### AI Chat
- `POST /api/chat` - Send message to AI assistant
- `GET /api/chat/history` - Get conversation history

### Scripts
- `GET /api/scripts` - List sales scripts
- `POST /api/scripts` - Create new script
- `GET /api/scripts/{id}` - Get script details

---

## Project Structure

```
leadvibes/
├── backend/                # Python FastAPI backend
│   ├── server.py          # Main application
│   ├── models.py          # Pydantic models
│   ├── auth.py            # Authentication
│   ├── ai_service.py      # AI integration
│   └── seed_data.py       # Demo data
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # Context providers
│   │   └── lib/           # Utilities
│   └── package.json
├── docs/                   # Documentation
├── tests/                  # Integration tests
├── docker-compose.yml      # Docker orchestration
├── Dockerfile.backend      # Backend container
└── Dockerfile.frontend     # Frontend container
```

---

## Development

### Prerequisites
- Python 3.13+
- Node.js 20 LTS
- MongoDB 8
- Docker & Docker Compose (optional)

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload
```

### Frontend Development

```bash
cd frontend
yarn install
yarn start
```

### Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
yarn test

# Integration tests
pytest backend_test.py
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed development guide.

---

## Docker Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild after changes
docker compose up -d --build backend

# Enter container shell
docker exec -it leadvibes-backend bash
```

---

## Configuration

### Environment Variables

**Backend** (.env):
```bash
MONGO_URL=mongodb://mongodb:27017/leadvibes
DB_NAME=leadvibes
JWT_SECRET_KEY=your-secret-key
CORS_ORIGINS=*
```

**Frontend**:
```bash
REACT_APP_API_URL=http://localhost:8001
```

---

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to the repository.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is proprietary software.

Copyright © 2026 SoftVibes Lab. All rights reserved.

---

## Support

- 📖 [Documentation](https://github.com/softvibeslab/leadvibes/wiki)
- 🐛 [Issue Tracker](https://github.com/softvibeslab/leadvibes/issues)
- 💬 [Discussions](https://github.com/softvibeslab/leadvibes/discussions)

---

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Email campaign integration
- [ ] Calendar integration
- [ ] WhatsApp Business API integration
- [ ] Multi-language support
- [ ] White-label customization

---

**Version:** 1.0.0
**Last Updated:** March 2026

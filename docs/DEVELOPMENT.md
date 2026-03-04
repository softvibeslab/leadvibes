# LeadVibes - Development Guide

> Guide for developers contributing to LeadVibes CRM.

---

## Table of Contents

1. [Local Development Setup](#1-local-development-setup)
2. [Project Structure](#2-project-structure)
3. [Backend Development](#3-backend-development)
4. [Frontend Development](#4-frontend-development)
5. [Testing](#5-testing)
6. [Code Style](#6-code-style)
7. [Git Workflow](#7-git-workflow)

---

## 1. Local Development Setup

### Prerequisites

- Python 3.13+
- Node.js 20 LTS
- MongoDB 8 (or Docker)
- Git

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Start development server
yarn start

# Runs on http://localhost:3000
```

### Using Docker (Recommended)

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

---

## 2. Project Structure

```
leadvibes/
├── backend/                    # FastAPI Python backend
│   ├── server.py              # Main application entry point
│   ├── models.py              # Pydantic data models
│   ├── auth.py                # Authentication logic
│   ├── ai_service.py          # AI/LLM integration
│   ├── seed_data.py           # Demo data generator
│   ├── requirements.txt       # Python dependencies
│   └── tests/                 # Backend tests
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   └── ui/           # Radix UI components
│   │   ├── context/          # React Context providers
│   │   ├── lib/              # Utilities
│   │   └── index.js          # Entry point
│   ├── package.json
│   ├── craco.config.js       # Build configuration
│   └── tailwind.config.js    # Styling configuration
├── docs/                      # Documentation
├── tests/                     # Integration tests
├── docker-compose.yml         # Docker orchestration
├── Dockerfile.backend         # Backend container
├── Dockerfile.frontend        # Frontend container
└── README.md
```

---

## 3. Backend Development

### Adding a New API Endpoint

1. **Define the Pydantic model** in `models.py`:

```python
class MyResourceCreate(BaseModel):
    name: str
    value: int

class MyResource(MyResourceCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_uuid)
    tenant_id: str
    created_at: datetime = Field(default_factory=now_utc)
```

2. **Add the route** in `server.py`:

```python
@api_router.post("/myresource", response_model=dict)
async def create_my_resource(
    data: MyResourceCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new resource"""
    resource_id = str(uuid.uuid4())
    resource_doc = {
        "id": resource_id,
        "tenant_id": current_user["tenant_id"],
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.myresources.insert_one(resource_doc)
    return {"message": "Resource created", "id": resource_id}
```

3. **Test the endpoint**:

```bash
curl -X POST http://localhost:8001/api/myresource \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "value": 42}'
```

### Database Operations

```python
# Insert
await db.collection.insert_one(document)

# Find one
doc = await db.collection.find_one({"id": item_id}, {"_id": 0})

# Find many
docs = await db.collection.find({"tenant_id": tenant_id}).to_list(100)

# Update
result = await db.collection.update_one(
    {"id": item_id},
    {"$set": {"field": "new_value"}}
)

# Delete
result = await db.collection.delete_one({"id": item_id})

# Count
count = await db.collection.count_documents({"status": "active"})
```

### Authentication

All protected endpoints must include:

```python
from auth import get_current_user, require_role

# Current user (any authenticated user)
async def my_endpoint(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    tenant_id = current_user["tenant_id"]
    # ...

# Role-based access
async def admin_endpoint(
    current_user: dict = Depends(require_role(["admin"]))
):
    # Only admin can access
    ...
```

### Error Handling

```python
from fastapi import HTTPException

# Return error
raise HTTPException(
    status_code=404,
    detail="Resource not found"
)

# Custom error messages
raise HTTPException(
    status_code=400,
    detail="Email ya registrado"
)
```

---

## 4. Frontend Development

### Creating a New Component

```jsx
// src/components/MyComponent.jsx
import React from 'react';

export function MyComponent({ prop1, prop2 }) {
  return (
    <div className="p-4 border rounded">
      <h2>{prop1}</h2>
      <p>{prop2}</p>
    </div>
  );
}
```

### Using Authentication Context

```jsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, token, logout } = useAuth();

  return (
    <div>
      <p>Welcome, {user.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Making API Calls

```jsx
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

async function fetchData(token) {
  try {
    const response = await axios.get(`${API_URL}/leads`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}
```

### Styling with TailwindCSS

```jsx
// Common Tailwind patterns
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-semibold text-gray-900">Title</h2>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Action
  </button>
</div>

// Dark mode support
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
```

### Radix UI Components

LeadVibes uses Radix UI primitives. Examples:

```jsx
// Dialog
import { AlertDialog, AlertDialogAction, AlertDialogCancel }
  from '@/components/ui/alert-dialog';

<AlertDialog>
  <AlertDialogTrigger>Open</AlertDialogTrigger>
  <AlertDialogContent>
    {/* Content */}
  </AlertDialogContent>
</AlertDialog>

// Dropdown Menu
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger>Open</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Option 1</DropdownMenuItem>
    <DropdownMenuItem>Option 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 5. Testing

### Backend Tests (pytest)

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest test_leads.py

# Run with debug output
pytest -v -s
```

### Frontend Tests

```bash
cd frontend

# Run tests
yarn test

# Run with coverage
yarn test --coverage --watchAll=false
```

### Integration Tests

```bash
# Run from project root
pytest backend_test.py
```

---

## 6. Code Style

### Python (Backend)

**Linting:**
```bash
# Check code
ruff check backend/

# Auto-fix
ruff check --fix backend/

# Type checking
mypy backend/
```

**Formatting:**
```bash
# Format code
black backend/
isort backend/
```

**Style Guide:**
- Follow PEP 8
- Use type hints for all functions
- Max line length: 100
- Use async/await for I/O operations
- Document public APIs with docstrings

### JavaScript (Frontend)

**Linting:**
```bash
# Check code
cd frontend
yarn lint

# Auto-fix
yarn lint --fix
```

**Formatting:**
```bash
# Format code (Prettier is built-in with CRACO)
yarn format  # if configured
```

**Style Guide:**
- Use ES6+ features
- Prefer const over let
- Use arrow functions for callbacks
- Component names: PascalCase
- File names: PascalCase for components, camelCase for utilities

---

## 7. Git Workflow

### Branch Naming

```
feature/       New features
fix/           Bug fixes
refactor/      Code refactoring
docs/          Documentation changes
test/          Test updates
```

### Commit Messages

Follow Conventional Commits:

```
feat: add lead analysis with AI

Add new endpoint POST /api/leads/{id}/analyze that uses
LiteLLM to analyze lead intent and suggest next actions.

Closes #123
```

```
fix: resolve tenant isolation bug

Fixed issue where users could see leads from other tenants.
Added tenant_id check in get_leads endpoint.

Fixes #456
```

### Pull Request Process

1. Create feature branch
2. Make changes and test locally
3. Commit with conventional commits
4. Push to GitHub
5. Create pull request
6. Request review from team
7. Address feedback
8. Merge when approved

### Before Committing

```bash
# Backend
cd backend
pytest
ruff check .
black .
mypy .

# Frontend
cd frontend
yarn lint
yarn test
```

---

## Environment Variables

### Backend (.env)

```bash
# MongoDB
MONGO_URL=mongodb://localhost:27017/leadvibes
DB_NAME=leadvibes

# Authentication
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# AI/LLM (Optional - uses defaults if not set)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Frontend (.env)

```bash
REACT_APP_API_URL=http://localhost:8001
```

---

## Debugging

### Backend Debugging

```bash
# Run with verbose logging
uvicorn server:app --reload --log-level debug

# Use Python debugger
import pdb; pdb.set_trace()

# Or ipdb (better UI)
import ipdb; ipdb.set_trace()
```

### Frontend Debugging

```bash
# Start with debug output
yarn start --verbose

# Use browser debugger
# Add debugger; statement in code
```

### Docker Logs

```bash
# Follow logs
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend

# Specific container
docker logs leadvibes-backend -f
```

---

## Performance Tips

### Backend

- Use MongoDB indexes for frequently queried fields
- Implement pagination for large result sets
- Cache expensive operations (e.g., AI responses)
- Use async/await for all I/O operations
- Optimize N+1 queries with aggregation pipelines

### Frontend

- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Lazy load routes with React.lazy()
- Optimize re-renders with useMemo/useCallback
- Use Web Workers for CPU-intensive tasks

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives)

---

**Last Updated:** 2026-03-04

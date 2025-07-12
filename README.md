# README.md
# Public Notepad Backend

A decentralized backend API for the Public Notepad platform where users can submit ideas that get minted as NFTs on the Base blockchain.

## Features

- 🔐 Wallet-based authentication
- 💡 Idea submission and management
- 🌐 IPFS integration for metadata storage
- 🔗 Social interactions (likes, comments, follows)
- 📊 Real-time notifications
- 🔍 Advanced search and filtering
- 📈 Analytics and reporting

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd public-notepad-backend
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup database:**
   ```bash
   npm run db:setup
   npm run db:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route handlers
├── middleware/     # Express middleware
├── models/         # Data models
├── routes/         # Route definitions
├── services/       # Business logic
└── utils/          # Utility functions
```

## API Documentation

See `docs/api.md` for detailed API documentation.

## Database

PostgreSQL database with comprehensive schema including:
- Users and authentication
- Ideas and metadata
- Social interactions
- Notifications
- Analytics

See `docs/database.md` for schema details.

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Deployment

See `docs/deployment.md` for deployment instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
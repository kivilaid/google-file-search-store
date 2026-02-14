# Google File Search Store

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

> **The missing link for Gemini File Search.** A robust TypeScript library, CLI, and Web Dashboard to manage your Google GenAI File Search Stores effortlessly.

## 🚀 Features

- 📦 **Complete Store Management**: Create, list, delete, and inspect File Search Stores.
- 📄 **Document Handling**: Upload, import, and manage documents with ease.
- 🔍 **Powerful Querying**: Search across your documents using Gemini's semantic capabilities.
- 💻 **CLI Tool**: Full-featured command-line interface (`gfss`) for quick operations.
- 🌐 **Web Dashboard**: A beautiful Next.js interface to visualize and manage your stores.
- 🛡️ **Type-Safe**: Built with TypeScript for a robust development experience.

## 🏗️ Architecture

This project is a monorepo-style package containing three main components:

1.  **Core Library**: A TypeScript wrapper around `@google/genai` for file search operations.
2.  **CLI (`gfss`)**: A command-line tool for scripting and quick management.
3.  **Web Dashboard**: A Next.js application for a visual management interface.

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- A Google Cloud Project with the Gemini API enabled
- An API Key from [Google AI Studio](https://aistudio.google.com/)

### Installation

```bash
npm install google-file-search-store
```

### Setup

Create a `.env` file in your project root:

```env
GEMINI_API_KEY=your_api_key_here
```

## 💻 CLI Usage

The package includes a CLI tool `gfss`. You can run it using `npx`:

```bash
npx gfss --help
```

### Common Commands

**Manage Stores**
```bash
# List all stores
npx gfss store list

# Create a new store
npx gfss store create "My Knowledge Base"

# Delete a store
npx gfss store delete <store-id>
```

**Manage Documents**
```bash
# Upload a file to a store
npx gfss doc upload <store-id> ./path/to/document.pdf

# List documents in a store
npx gfss doc list <store-id>
```

**Query**
```bash
# Search within a store
npx gfss query <store-id> "What is the summary of the Q3 report?"
```

## 📚 Library Usage

Import the client and start building your RAG applications.

```typescript
import { FileSearchStoreClient } from 'google-file-search-store';

const client = new FileSearchStoreClient({
  apiKey: process.env.GEMINI_API_KEY, // Optional if set in env
});

async function main() {
  // 1. Create a Store
  const store = await client.createStore({
    displayName: 'Engineering Docs',
  });
  console.log(`Store created: ${store.name}`);

  // 2. Upload a Document
  const doc = await client.uploadDocument({
    storeName: store.name,
    filePath: './specs.pdf',
    mimeType: 'application/pdf',
  });
  console.log(`Document uploaded: ${doc.name}`);

  // 3. Query the Store
  const results = await client.query({
    storeName: store.name,
    query: 'How do we handle retry logic?',
  });

  console.log('Answer:', results.text);
}

main();
```

## 🌐 Web Dashboard

A built-in Next.js dashboard allows you to manage everything visually.

1.  Navigate to the `web/` directory.
2.  Install dependencies: `npm install`
3.  Run the dev server: `npm run dev`
4.  Open [http://localhost:3000](http://localhost:3000)

*(Note: Ensure your `.env` is configured in the `web/` directory as well)*

## 📖 API Reference

### `FileSearchStoreClient`

The main entry point for the library.

- **`createStore(options)`**: Create a new file store.
- **`listStores(options)`**: List all available stores.
- **`getStore(name)`**: Get details of a specific store.
- **`deleteStore(name)`**: Delete a store.
- **`uploadDocument(options)`**: Upload a local file to a store.
- **`importDocument(options)`**: Import a file from a URL/URI.
- **`listDocuments(options)`**: List files in a store.
- **`query(options)`**: Perform a semantic search query.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'Add some amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

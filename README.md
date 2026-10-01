# Folio Document Intelligence Workspace

A Next.js document processing application that uploads files, extracts text with Azure AI Document Intelligence, stores the results in Azure SQL, and provides AI-powered summaries using Azure AI Foundry/OpenAI-compatible models.

This project is designed as a small internal workspace for reviewing, searching, and summarizing documents such as PDFs, images, Office files, and HTML pages.

## Overview

The application follows a simple flow:

1. A user uploads a supported document from the dashboard.
2. The server validates the file type and calls Azure AI Document Intelligence for OCR and document analysis.
3. The extracted text is saved in an Azure SQL database along with the file metadata.
4. The user can browse the library, search extracted text, and open individual document records.
5. A summary can be generated for a document using an Azure AI Foundry model.

## Features

- Drag-and-drop document upload from the dashboard
- Support for PDF, images, Office documents, and HTML files
- Azure AI Document Intelligence OCR extraction
- Searchable document library using file names and OCR text preview
- Per-document detail page with extracted text and summary panel
- AI-generated summary via Azure OpenAI-compatible model in Azure AI Foundry
- Responsive, modern UI built with Next.js and React
- Storage of OCR text and metadata in Azure SQL

## Tech Stack

- Next.js 16 App Router
- React 19
- Azure AI Document Intelligence
- Azure AI Foundry / OpenAI Responses API
- Azure SQL Database
- mssql driver for SQL connectivity

## Project Structure

```text
azure-document-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/
│   │   │   │   └── route.js
│   │   │   └── documents/
│   │   │       ├── route.js
│   │   │       └── [id]/
│   │   │           ├── route.js
│   │   │           └── summarize/
│   │   │               └── route.js
│   │   ├── components/
│   │   │   └── workspace-sidebar.js
│   │   ├── documents/
│   │   │   └── [id]/
│   │   │       └── page.js
│   │   ├── globals.css
│   │   ├── layout.js
│   │   └── page.js
│   └── lib/
│       ├── db.js
│       └── document-intelligence.js
├── .env.local  # create this locally for Azure settings
├── package.json
├── next.config.mjs
├── jsconfig.json
├── eslint.config.mjs
├── README.md
└── public/
```

## Prerequisites

Before running the app, make sure you have:

- Node.js 18+ or 20+ recommended
- npm
- An Azure subscription
- An Azure AI Document Intelligence resource
- An Azure SQL Database instance
- An Azure AI Foundry project and a deployed model compatible with the OpenAI Responses API

## Required Environment Variables

Create a `.env.local` file in the project root (do not commit it) with values like the following:

```bash
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://<your-resource-name>.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=<your-document-intelligence-key>

AZURE_SQL_SERVER=<your-server-name>.database.windows.net
AZURE_SQL_DATABASE=<your-database-name>
AZURE_SQL_USER=<database-user>
AZURE_SQL_PASSWORD=<database-password>

AZURE_FOUNDRY_PROJECT_ENDPOINT=https://<your-foundry-resource>.services.ai.azure.com/api/projects/<project-name>
AZURE_FOUNDRY_API_KEY=<your-foundry-api-key>
AZURE_FOUNDRY_MODEL=<your-model-name>
```

Notes:

- `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` should be the resource endpoint for your Document Intelligence instance.
- `AZURE_FOUNDRY_PROJECT_ENDPOINT` should point to the Azure AI Foundry project endpoint.
- `AZURE_FOUNDRY_MODEL` should be a valid model deployment name exposed by your Azure AI Foundry project.
- Keep this file private and do not commit it to source control.

## Azure SQL Table Setup

This project expects a `documents` table in Azure SQL. Create it before first use:

```sql
CREATE TABLE documents (
  id INT IDENTITY(1,1) PRIMARY KEY,
  filename NVARCHAR(255) NOT NULL,
  content_type NVARCHAR(255) NULL,
  ocr_text NVARCHAR(MAX) NULL,
  summary NVARCHAR(MAX) NULL,
  created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

If the table is missing, the application will fail when trying to insert or fetch document records.

## Installation

Install dependencies:

```bash
npm install
```

## Running the App Locally

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## How the App Works

### 1. Upload and analyze

The dashboard allows the user to select a file and send it to the backend route at `/api/analyze`.

That route:

- checks the file type
- maps the extension to a supported content type
- reads the binary file content
- sends the file to Azure AI Document Intelligence
- reads the OCR output
- stores the record in SQL

### 2. Library browsing

The home page fetches documents from `/api/documents` and displays them in a searchable library.

The UI supports:

- file-type filters
- text-based search across filenames and OCR preview
- sorting by most recent timestamp

### 3. Detail view

Each document has its own page at `/documents/[id]`.

The document details page:

- fetches the full record from SQL
- displays the document name, metadata, and extraction stats
- shows the OCR text and supports inline search
- lets the user generate an AI summary with the Foundry model

### 4. Summary generation

When the user clicks the summary action, the app calls `/api/documents/[id]/summarize`.

That endpoint:

- loads the document from SQL
- retrieves the OCR text
- sends it to the configured Azure AI model
- saves the generated summary back into the `summary` column

## API Routes

### `POST /api/analyze`
Uploads a file and stores the OCR result.

Parameters:

- `file`: uploaded document

Response:

- `id`: inserted document ID
- `filename`
- `text`: OCR result

### `GET /api/documents`
Returns all document records with a preview of OCR text.

### `GET /api/documents/[id]`
Returns a single document record including OCR text.

### `POST /api/documents/[id]/summarize`
Generates and stores a summary for a document.

## Supported File Types

The app currently accepts:

- PDF
- JPEG / JPG
- PNG
- BMP
- TIFF / TIF
- HEIC / HEIF
- DOCX
- XLSX
- PPTX
- HTML / HTM

## Development Notes

- The app uses the App Router pattern in Next.js, with server routes under `src/app/api`.
- The database connection is centralized in `src/lib/db.js`.
- Document intelligence client setup is centralized in `src/lib/document-intelligence.js`.
- `@azure-rest/ai-document-intelligence` is used for OCR analysis.
- `openai` is used to call Azure AI Foundry using the project endpoint and API key.

## Production Build

To build the app for production:

```bash
npm run build
```

To start the production server:

```bash
npm run start
```

## Deployment Considerations

This project is ready to be deployed to a hosted Next.js environment such as Vercel, Azure App Service, or another Node.js-compatible platform.

When deploying, make sure to configure all required environment variables in the hosting environment. Azure SQL and Azure AI resources should also be reachable from the deployment environment.

## Troubleshooting

### Missing Azure environment variables

If the app throws errors related to missing configuration, verify that your `.env.local` file includes all required values.

### SQL connection errors

Check:

- the Azure SQL server name and database name
- the username and password
- firewall/network rules for Azure SQL
- whether the Azure SQL login has permission to access the target database

### Unsupported file type

Only the explicitly supported file types are accepted. Confirm the uploaded file extension matches a listed format.

### No readable text detected

Some documents may not contain extractable text or may require a different processing model. Verify the file is valid and readable.

### Summary generation fails

Check that:

- `AZURE_FOUNDRY_PROJECT_ENDPOINT` is valid
- `AZURE_FOUNDRY_API_KEY` is correct
- `AZURE_FOUNDRY_MODEL` is deployed and available in the project
- the document contains OCR text before summary generation

## License

This project is provided as a sample Azure document intelligence workspace for learning and experimentation.

## Contributing

This repository is intended for personal or demonstration use. If you want to extend it, common improvements include:

- adding document deletion and editing workflows
- supporting bulk uploads
- adding user authentication
- storing document categories and tags
- adding more robust document extraction and validation

## Summary

This app demonstrates how to combine Azure AI services with a modern web application to create a searchable document intelligence workspace. It is a practical example of OCR, structured storage, and AI-assisted summarization built around a simple user experience.

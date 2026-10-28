# Enterprise IT Support Agentic RAG Copilot

An intelligent, self-correcting Agentic Retrieval-Augmented Generation (RAG) copilot designed for Enterprise IT Support. Built using **LangGraph**, **LangChain**, **Pinecone**, **Groq**, and **Tavily**.

## Features

- **Document Ingestion & Indexing**: Scrapes and chunks enterprise IT documentation into dense embeddings stored in Pinecone vector database.
- **Agentic Workflow with LangGraph**:
  - Semantic router to determine whether a query needs vector retrieval, live web search, or direct resolution.
  - Document relevance grading to filter out noise and hallucinations.
  - Live IT search fallback using Tavily Search API.
  - Ultra-fast reasoning powered by Groq LLMs.

## Prerequisites

- Python 3.10+
- [Groq API Key](https://console.groq.com/)
- [Pinecone API Key](https://www.pinecone.io/)
- [Tavily API Key](https://tavily.com/)

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/PRAJWAL4103/Enterprise-IT-Support-Agentic-RAG-Copilot.git
   cd Enterprise-IT-Support-Agentic-RAG-Copilot
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**:
   Copy `.env.example` to `.env` and fill in your API credentials:
   ```bash
   cp .env.example .env
   ```

4. **Run the Notebook**:
   Launch Jupyter or open `Agentic_RAG.ipynb` in VS Code to run the agentic workflow.

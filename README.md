# 🦙 ChatLlama — Local AI Chatbot

[svg](https://github.com/Aarya-Musale/ChatLlama#-chatllama--local-ai-chatbot)

A locally hosted AI chatbot web application built with **Flask and Ollama**, powered by the **Llama 3.2** language model. ChatLlama provides a ChatGPT-style conversational interface with real-time streaming responses, persistent chat history, document-based question answering, Markdown rendering, code formatting, and a responsive user interface — while keeping AI processing local through Ollama.

## 🚀 Project Overview / Description

[svg](https://github.com/Aarya-Musale/ChatLlama#-project-overview--description)

* **What the project does:** ChatLlama is an interactive local AI chatbot built using Flask and Ollama. It connects a web-based conversational interface to the locally running `llama3.2:latest` model and provides real-time AI responses through streamed output. Users can create multiple conversations, search previous chats, rename or delete conversations, regenerate responses, stop ongoing generations, and interact with uploaded documents.

* **The problem it solves:** Many AI chatbot applications depend on external APIs and transmit user conversations or documents to cloud-based services. ChatLlama provides a local alternative where the language model runs through Ollama on the user's own machine. This allows users to experiment with generative AI, conversational applications, and document-based question answering without requiring a cloud AI API.

* **Primary use case:** Designed as an educational and portfolio project for exploring **Generative AI, Large Language Models, Flask web development, Ollama integration, streaming responses, conversational memory, and document-based AI applications**.

* **Local AI Processing:** ChatLlama uses Ollama to run the Llama 3.2 model locally, allowing the chatbot to generate responses without depending on an external hosted LLM API.

## ✨ Key Features

[svg](https://github.com/Aarya-Musale/ChatLlama#-key-features)

* **🤖 Local AI Chatbot:** Conversational AI powered by the locally running `llama3.2:latest` model through Ollama.

* **⚡ Real-Time Streaming Responses:** AI responses are streamed progressively to the browser instead of waiting for the complete response before displaying it.

* **💬 Persistent Chat History:** Conversations are stored locally in `chats.json`, allowing users to access previous conversations from the sidebar.

* **🔎 Chat Search:** Search through saved conversations using the sidebar search interface.

* **✏️ Chat Management:** Users can create new conversations, rename existing chats, delete individual conversations, or delete all saved conversations.

* **🔄 Regenerate Response:** Allows users to regenerate the most recent assistant response when they want an alternative answer.

* **⏹️ Stop Generation:** Users can stop an ongoing AI response using the stop button in the chat input area.

* **📄 Document Upload:** Supports uploading **PDF, DOCX, and TXT** documents for document-based conversations.

* **📚 Document Question Answering:** Uploaded document text is provided to the Llama 3.2 model as conversational context so users can ask questions about the document.

* **📝 Markdown Support:** AI responses support Markdown formatting including headings, lists, links, bold text, and other common Markdown elements.

* **💻 Code Block Formatting:** Code responses are displayed in formatted code blocks with language identification and a copy button.

* **📋 Copy Response:** Users can copy generated code or AI responses directly from the interface.

* **👍 Response Actions:** The interface provides response interaction controls such as copy, regenerate, and feedback actions.

* **📱 Responsive Interface:** The application adapts to desktop, tablet, and mobile screen sizes.

* **🎨 ChatGPT-Style UI:** A clean white chat interface with a dark sidebar, recent conversations, document upload support, and a modern message layout.

* **🔒 Local-First Architecture:** ChatLlama is designed around local AI inference through Ollama rather than requiring a hosted AI API key.

## 📸 Application Preview

[svg](https://github.com/Aarya-Musale/ChatLlama#-application-preview)

Here is a look at the ChatLlama conversational interface, chat history, document upload functionality, and real-time AI response generation.

### 💬 Chat Interface

![ChatLlama Chat Interface](assets/chat_interface.png)

### 📄 Document Question Answering

![ChatLlama Document Chat](assets/document_chat.png)

### 📚 Recent Chat History

![ChatLlama Chat History](assets/chat_history.png)

> **Note:** Place your screenshots inside the `assets/` folder using the filenames shown above, or update the image paths according to your actual screenshot filenames.

## 🛠 Tech Stack & Dependencies

[svg](https://github.com/Aarya-Musale/ChatLlama#-tech-stack--dependencies)

* **Programming Language:** Python

* **Web Framework:** Flask

* **Large Language Model:** Llama 3.2

* **Local LLM Runtime:** Ollama

* **Frontend:** HTML5, CSS3, JavaScript

* **Template Engine:** Jinja2

* **Document Processing:** PyMuPDF (`fitz`) for PDF files and `python-docx` for DOCX files

* **AI Communication:** Ollama Python library

* **Chat Storage:** Local JSON-based persistence using `chats.json`

* **Markdown Rendering:** Marked.js

* **Backend Streaming:** Flask streaming responses with Ollama's streaming API

## 📂 Project Structure

[svg](https://github.com/Aarya-Musale/ChatLlama#-project-structure)

```text
ChatLlama/
│
├── assets/
│   ├── chat_interface.png
│   ├── document_chat.png
│   └── chat_history.png
│
├── static/
│   ├── script.js
│   └── style.css
│
├── templates/
│   └── index.html
│
├── uploads/
│   └── .gitkeep
│
├── app.py
├── requirements.txt
├── .gitignore
├── README.md
└── chats.json
```

### 📌 Important Files

* `app.py` — Main Flask backend responsible for routing, chat persistence, Ollama communication, document processing, response streaming, chat management, and generation control.

* `templates/index.html` — Main HTML interface for the ChatLlama application.

* `static/style.css` — Complete styling for the responsive ChatLlama interface, sidebar, messages, code blocks, document preview, input area, and mobile layout.

* `static/script.js` — Frontend JavaScript responsible for chat interaction, API communication, response streaming, chat history, document upload, regeneration, search, deletion, and UI interactions.

* `requirements.txt` — Python dependencies required to run the application.

* `uploads/` — Temporary document processing directory for uploaded PDF, DOCX, and TXT files.

* `chats.json` — Local conversation persistence file generated by the application.

> **Note:** `chats.json`, uploaded documents, virtual environments, and other local/generated files should be excluded from GitHub using `.gitignore`.

## 📥 Installation & Setup Guide

[svg](https://github.com/Aarya-Musale/ChatLlama#-installation--setup-guide)

### Step 1: Clone the repository

Clone the ChatLlama repository to your local machine using Git:

```bash
git clone https://github.com/Aarya-Musale/ChatLlama.git
cd ChatLlama
```

### Step 2: Install Ollama

Download and install Ollama for your operating system.

After installation, verify that Ollama is available:

```bash
ollama --version
```

### Step 3: Download the Llama 3.2 model

Pull the model used by ChatLlama:

```bash
ollama pull llama3.2:latest
```

Verify that the model is available:

```bash
ollama list
```

You should see:

```text
llama3.2:latest
```

### Step 4: Set up a Python virtual environment

Create a virtual environment:

#### Windows

```powershell
python -m venv venv
venv\Scripts\activate
```

#### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 5: Install Python dependencies

Install the required packages:

```bash
pip install -r requirements.txt
```

### Step 6: Verify the project structure

Make sure the project contains:

```text
ChatLlama/
├── app.py
├── requirements.txt
├── templates/
│   └── index.html
├── static/
│   ├── style.css
│   └── script.js
└── uploads/
```

## ▶️ How to Run / Usage

[svg](https://github.com/Aarya-Musale/ChatLlama#%EF%B8%8F-how-to-run--usage)

Follow these steps to launch ChatLlama locally.

### Step 1: Navigate to the project directory

Open your terminal and navigate to the ChatLlama project folder:

```bash
cd ChatLlama
```

### Step 2: Activate the virtual environment

#### Windows

```powershell
venv\Scripts\activate
```

#### macOS / Linux

```bash
source venv/bin/activate
```

### Step 3: Start Ollama

Make sure Ollama is running on your system.

Verify the model:

```bash
ollama list
```

### Step 4: Launch the Flask application

Run:

```bash
python app.py
```

The Flask development server will start locally, typically at:

```text
http://127.0.0.1:5000/
```

### Step 5: Open ChatLlama

Open your browser and navigate to:

```text
http://127.0.0.1:5000/
```

### Step 6: Start chatting

Enter a question in the ChatLlama input box and click the send button.

The application sends the conversation to the locally running Llama 3.2 model through Ollama and streams the generated response back to the browser.

### Step 7: Use document-based conversations

Click the **📎 Attach** button and upload a supported document:

```text
PDF
DOCX
TXT
```

After uploading the document, ask questions related to its contents.

## 🧠 AI & Chat Processing Details

[svg](https://github.com/Aarya-Musale/ChatLlama#-ai--chat-processing-details)

ChatLlama uses a local conversational architecture where Flask acts as the application backend and Ollama provides access to the Llama 3.2 language model.

### 🔹 Basic Chat Flow

```text
User
  │
  ▼
ChatLlama Web Interface
  │
  ▼
JavaScript Fetch API
  │
  ▼
Flask Backend
  │
  ▼
Ollama
  │
  ▼
Llama 3.2
  │
  ▼
Streaming AI Response
  │
  ▼
ChatLlama Interface
```

### 🔹 Conversation Memory

Chat messages are stored in a local JSON file:

```text
chats.json
```

Each conversation contains information such as:

* Chat ID
* Chat title
* Creation time
* Last updated time
* User messages
* Assistant responses
* Uploaded document information when applicable

Previous messages are supplied to the Llama 3.2 model as conversation context.

### 🔹 Streaming Response

Instead of waiting for the entire response, ChatLlama uses Ollama's streaming functionality:

```python
chat(
    model="llama3.2:latest",
    messages=messages,
    stream=True
)
```

The generated content is progressively sent to the browser, creating a real-time conversational experience.

## 📄 Document Processing

[svg](https://github.com/Aarya-Musale/ChatLlama#-document-processing)

ChatLlama currently supports three document formats:

* **PDF:** Text extracted using PyMuPDF.
* **DOCX:** Text extracted using `python-docx`.
* **TXT:** Text extracted directly using Python file handling.

The extracted document content is supplied as contextual information to the Llama 3.2 model.

### Document Processing Flow

```text
Uploaded Document
       │
       ▼
File Validation
       │
       ▼
PDF / DOCX / TXT Detection
       │
       ▼
Text Extraction
       │
       ▼
Document Context
       │
       ▼
Llama 3.2
       │
       ▼
Answer Based on Document
```

The current implementation provides **document-context question answering**. A future version will extend this into a full Retrieval-Augmented Generation (RAG) pipeline using document chunking, embeddings, vector storage, and semantic retrieval.

## 🔐 Security & Data Handling

[svg](https://github.com/Aarya-Musale/ChatLlama#-security--data-handling)

* ChatLlama is designed for local development and educational use.
* The application does not require an external LLM API key.
* Chat history is stored locally in `chats.json`.
* Uploaded documents are processed locally.
* Uploaded documents are temporarily stored during processing and removed after extraction.
* The project limits uploaded document size to protect local resources.
* Sensitive files and generated application data should be excluded from Git using `.gitignore`.

## 🔮 Future Enhancements

[svg](https://github.com/Aarya-Musale/ChatLlama#-future-enhancements)

The next development phase will extend ChatLlama from a document-context chatbot into a more advanced AI application.

Planned improvements include:

* **True Retrieval-Augmented Generation (RAG)**
* **Document chunking**
* **Text embeddings**
* **Vector database integration**
* **Semantic similarity search**
* **Retrieval of the most relevant document sections**
* **Source citations for document answers**
* **AI-generated conversation titles**
* **Improved chat persistence**
* **Better handling of interrupted/partial responses**
* **Conversation export**
* **Multiple local model support**
* **Model selection interface**
* **Chat settings**
* **Document collection management**
* **Improved response feedback persistence**

## ⚙️ Current Limitations

[svg](https://github.com/Aarya-Musale/ChatLlama#-current-limitations)

* The current document-question-answering implementation sends extracted document context directly to the language model rather than using a dedicated vector database.
* Very large documents may require additional chunking and retrieval techniques.
* Chat persistence currently uses a local JSON file and is intended primarily for local development.
* The application currently depends on Ollama being installed and the required model being available locally.
* The current implementation is not intended as a production multi-user deployment.

## 📊 Application Workflow

[svg](https://github.com/Aarya-Musale/ChatLlama#-application-workflow)

```text
                    ┌──────────────────────┐
                    │        User          │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   ChatLlama UI       │
                    │ HTML + CSS + JS      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Flask Backend     │
                    │   Python Server      │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
       ┌──────────────────┐        ┌──────────────────┐
       │ Chat Persistence  │        │ Document Parser  │
       │   chats.json      │        │ PDF/DOCX/TXT     │
       └──────────────────┘        └────────┬─────────┘
                                            │
                                            ▼
                                  ┌──────────────────┐
                                  │ Document Context │
                                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │     Ollama       │
                                  │    Llama 3.2     │
                                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ Streaming Answer │
                                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │   ChatLlama UI   │
                                  └──────────────────┘
```

## ⚖️ License

[svg](https://github.com/Aarya-Musale/ChatLlama#%EF%B8%8F-license)

This project is developed for educational, learning, experimentation, and professional portfolio purposes.

## 👤 Author / Acknowledgments

[svg](https://github.com/Aarya-Musale/ChatLlama#-author--acknowledgments)

**Aarya Musale**

Built with ❤️ using **Python, Flask, Ollama, and Llama 3.2**.

This project was developed as a hands-on exploration of **Generative AI, Large Language Models, local AI inference, Flask web development, conversational applications, and document-based question answering**.
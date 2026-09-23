from flask import Flask, render_template, request, jsonify, Response, stream_with_context
from ollama import chat
from werkzeug.utils import secure_filename

from datetime import datetime
from docx import Document

import fitz
import json
import os
import uuid
import threading


# ============================================================
# APP CONFIGURATION
# ============================================================

app = Flask(__name__)

MODEL_NAME = "llama3.2:latest"

CHAT_FILE = "chats.json"
UPLOAD_FOLDER = "uploads"

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

MAX_FILE_SIZE = 10 * 1024 * 1024          # 10 MB
MAX_DOCUMENT_CHARACTERS = 50000


os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ============================================================
# GENERATION CONTROL
# ============================================================

# Stores stop events for currently running chats.
generation_events = {}

generation_lock = threading.Lock()


def create_generation_event(chat_id):
    """
    Create a stop event for a chat.
    """

    event = threading.Event()

    with generation_lock:
        generation_events[chat_id] = event

    return event


def get_generation_event(chat_id):
    """
    Get the current generation event for a chat.
    """

    with generation_lock:
        return generation_events.get(chat_id)


def remove_generation_event(chat_id):
    """
    Remove generation event after generation finishes.
    """

    with generation_lock:
        generation_events.pop(chat_id, None)


# ============================================================
# TIME
# ============================================================

def current_time():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# ============================================================
# CHAT STORAGE
# ============================================================

def load_chats():

    if not os.path.exists(CHAT_FILE):
        return {}

    try:

        with open(CHAT_FILE, "r", encoding="utf-8") as file:

            data = json.load(file)

            if isinstance(data, dict):
                return data

            return {}

    except (json.JSONDecodeError, OSError):

        return {}


def save_chats():

    try:

        # Write to temporary file first.
        # This reduces the chance of corrupting chats.json.

        temp_file = CHAT_FILE + ".tmp"

        with open(temp_file, "w", encoding="utf-8") as file:

            json.dump(
                chats,
                file,
                indent=2,
                ensure_ascii=False
            )

        os.replace(temp_file, CHAT_FILE)

    except OSError as error:

        print(f"Could not save chats: {error}")


chats = load_chats()


# ============================================================
# DOCUMENT EXTRACTION
# ============================================================

def extract_pdf_text(file_path):

    text = ""

    document = fitz.open(file_path)

    try:

        for page in document:

            text += page.get_text()
            text += "\n"

    finally:

        document.close()

    return text


def extract_docx_text(file_path):

    document = Document(file_path)

    paragraphs = []

    for paragraph in document.paragraphs:

        content = paragraph.text.strip()

        if content:
            paragraphs.append(content)

    return "\n".join(paragraphs)


def extract_txt_text(file_path):

    with open(
        file_path,
        "r",
        encoding="utf-8",
        errors="ignore"
    ) as file:

        return file.read()


def extract_document_text(file_path, filename):

    extension = os.path.splitext(filename)[1].lower()

    if extension == ".pdf":

        return extract_pdf_text(file_path)

    elif extension == ".docx":

        return extract_docx_text(file_path)

    elif extension == ".txt":

        return extract_txt_text(file_path)

    return ""


# ============================================================
# DOCUMENT PROMPT
# ============================================================

def create_document_prompt(document_text):

    return (

        "You are ChatLlama, a helpful AI assistant. "

        "The user has uploaded a document. "

        "Use the document below as the primary source "

        "when answering questions about it.\n\n"

        "Important instructions:\n"

        "1. Answer using the document when possible.\n"

        "2. Do not invent information that is not present.\n"

        "3. If the requested information is not available "
        "in the document, clearly say so.\n"

        "4. You may explain or summarize the document "
        "in a helpful way.\n\n"

        "DOCUMENT CONTENT:\n"

        "--------------------------------------------------\n"

        + document_text +

        "\n--------------------------------------------------"

    )


# ============================================================
# BUILD OLLAMA MESSAGES
# ============================================================

def build_ollama_messages(chat_data):

    ollama_messages = []

    document_text = chat_data.get(
        "document_text",
        ""
    )

    if document_text:

        ollama_messages.append({

            "role": "system",

            "content": create_document_prompt(
                document_text
            )

        })

    for message in chat_data.get(
        "messages",
        []
    ):

        role = message.get("role")

        content = message.get(
            "content",
            ""
        )

        if role in ["user", "assistant"]:

            ollama_messages.append({

                "role": role,

                "content": content

            })

    return ollama_messages


# ============================================================
# HOME
# ============================================================

@app.route("/")
def index():

    return render_template("index.html")


# ============================================================
# GET ALL CHATS
# ============================================================

@app.route("/chats", methods=["GET"])
def get_chats():

    chat_list = []

    for chat_id, chat_data in chats.items():

        messages = chat_data.get(
            "messages",
            []
        )

        chat_list.append({

            "id": chat_id,

            "title": chat_data.get(
                "title",
                "New Chat"
            ),

            "created_at": chat_data.get(
                "created_at",
                ""
            ),

            "updated_at": chat_data.get(
                "updated_at",
                ""
            ),

            "message_count": len(messages),

            "document_name": chat_data.get(
                "document_name",
                ""
            )

        })

    chat_list.sort(
        key=lambda item: item.get(
            "updated_at",
            ""
        ),
        reverse=True
    )

    return jsonify(chat_list)


# ============================================================
# GET SINGLE CHAT
# ============================================================

@app.route("/chat/<chat_id>", methods=["GET"])
def get_chat(chat_id):

    if chat_id not in chats:

        return jsonify({
            "error": "Chat not found."
        }), 404

    return jsonify(
        chats[chat_id]
    )


# ============================================================
# DOCUMENT UPLOAD
# ============================================================

@app.route("/upload", methods=["POST"])
def upload_document():

    uploaded_file = request.files.get(
        "file"
    )

    if not uploaded_file:

        return jsonify({
            "error": "No file selected."
        }), 400

    if not uploaded_file.filename:

        return jsonify({
            "error": "No file selected."
        }), 400

    original_filename = uploaded_file.filename

    safe_filename = secure_filename(
        original_filename
    )

    extension = os.path.splitext(
        safe_filename
    )[1].lower()

    if extension not in ALLOWED_EXTENSIONS:

        return jsonify({
            "error":
            "Unsupported file type. "
            "Please upload PDF, DOCX or TXT."
        }), 400

    uploaded_file.seek(
        0,
        os.SEEK_END
    )

    file_size = uploaded_file.tell()

    uploaded_file.seek(0)

    if file_size > MAX_FILE_SIZE:

        return jsonify({
            "error":
            "File is too large. "
            "Maximum size is 10 MB."
        }), 400

    document_id = str(
        uuid.uuid4()
    )

    saved_filename = (
        document_id
        + "_"
        + safe_filename
    )

    file_path = os.path.join(
        UPLOAD_FOLDER,
        saved_filename
    )

    try:

        uploaded_file.save(
            file_path
        )

        document_text = extract_document_text(
            file_path,
            safe_filename
        )

    except Exception as error:

        if os.path.exists(file_path):

            os.remove(file_path)

        return jsonify({
            "error":
            f"Could not read the document: {error}"
        }), 500

    finally:

        if os.path.exists(file_path):

            try:
                os.remove(file_path)
            except OSError:
                pass

    document_text = document_text.strip()

    if not document_text:

        return jsonify({
            "error":
            "The document does not contain readable text."
        }), 400

    document_text = document_text[
        :MAX_DOCUMENT_CHARACTERS
    ]

    return jsonify({

        "success": True,

        "document_id": document_id,

        "filename": safe_filename,

        "text": document_text,

        "message":
        "Document uploaded successfully."

    })


# ============================================================
# SEND MESSAGE
# ============================================================

@app.route("/send", methods=["POST"])
def send_message():

    data = request.get_json(
        silent=True
    ) or {}

    user_message = data.get(
        "message",
        ""
    ).strip()

    chat_id = data.get(
        "chat_id"
    )

    document_text = data.get(
        "document_text",
        ""
    )

    document_name = data.get(
        "document_name",
        ""
    )

    if not user_message:

        return jsonify({
            "error":
            "Message cannot be empty."
        }), 400

    # --------------------------------------------------------
    # CREATE NEW CHAT
    # --------------------------------------------------------

    if not chat_id or chat_id not in chats:

        chat_id = str(
            uuid.uuid4()
        )

        timestamp = current_time()

        chats[chat_id] = {

            "title":
            user_message[:40],

            "created_at":
            timestamp,

            "updated_at":
            timestamp,

            "messages": [],

            "document_name":
            document_name,

            "document_text":
            document_text

        }

    # --------------------------------------------------------
    # SAVE DOCUMENT
    # --------------------------------------------------------

    if document_text:

        chats[chat_id][
            "document_text"
        ] = document_text

        chats[chat_id][
            "document_name"
        ] = document_name

    # --------------------------------------------------------
    # SAVE USER MESSAGE
    # --------------------------------------------------------

    chats[chat_id][
        "messages"
    ].append({

        "role": "user",

        "content": user_message

    })

    chats[chat_id][
        "updated_at"
    ] = current_time()

    save_chats()

    # --------------------------------------------------------
    # BUILD OLLAMA REQUEST
    # --------------------------------------------------------

    ollama_messages = build_ollama_messages(
        chats[chat_id]
    )

    # --------------------------------------------------------
    # CREATE STOP EVENT
    # --------------------------------------------------------

    stop_event = create_generation_event(
        chat_id
    )

    def generate():

        assistant_response = ""

        stopped = False

        try:

            print(
                f"Sending message to Ollama: "
                f"{user_message}"
            )

            response = chat(

                model=MODEL_NAME,

                messages=ollama_messages,

                stream=True

            )

            for chunk in response:

                # Check whether user clicked STOP.

                if stop_event.is_set():

                    stopped = True

                    print(
                        f"Generation stopped: "
                        f"{chat_id}"
                    )

                    break

                try:

                    content = (
                        chunk.message.content
                    )

                except AttributeError:

                    content = ""

                if content:

                    assistant_response += content

                    yield content

            # ------------------------------------------------
            # SAVE PARTIAL / COMPLETE RESPONSE
            # ------------------------------------------------

            if assistant_response.strip():

                if stopped:

                    assistant_response += (
                        "\n\n⏹️ *Generation stopped.*"
                    )

                chats[chat_id][
                    "messages"
                ].append({

                    "role": "assistant",

                    "content":
                    assistant_response

                })

                chats[chat_id][
                    "updated_at"
                ] = current_time()

                save_chats()

        except Exception as error:

            print(
                f"Ollama error: {error}"
            )

            yield (
                "\n\n⚠️ **Ollama Error:** "
                + str(error)
            )

        finally:

            remove_generation_event(
                chat_id
            )

    response = Response(

        stream_with_context(
            generate()
        ),

        mimetype="text/plain"

    )

    response.headers[
        "X-Chat-ID"
    ] = chat_id

    response.headers[
        "Cache-Control"
    ] = "no-cache"

    response.headers[
        "X-Accel-Buffering"
    ] = "no"

    return response


# ============================================================
# STOP GENERATION
# ============================================================

@app.route("/stop", methods=["POST"])
def stop_generation():

    data = request.get_json(
        silent=True
    ) or {}

    chat_id = data.get(
        "chat_id"
    )

    if not chat_id:

        return jsonify({
            "error":
            "Chat ID is required."
        }), 400

    event = get_generation_event(
        chat_id
    )

    if not event:

        return jsonify({

            "success": False,

            "message":
            "No active generation found."

        })

    event.set()

    return jsonify({

        "success": True,

        "message":
        "Generation stop requested."

    })


# ============================================================
# REGENERATE
# ============================================================

@app.route("/regenerate", methods=["POST"])
def regenerate():

    data = request.get_json(
        silent=True
    ) or {}

    chat_id = data.get(
        "chat_id"
    )

    if not chat_id or chat_id not in chats:

        return jsonify({
            "error":
            "Chat not found."
        }), 404

    messages = chats[chat_id].get(
        "messages",
        []
    )

    if not messages:

        return jsonify({
            "error":
            "No messages available."
        }), 400

    old_assistant = None

    if messages[-1].get(
        "role"
    ) == "assistant":

        old_assistant = messages.pop()

    if (
        not messages
        or messages[-1].get("role")
        != "user"
    ):

        if old_assistant:

            messages.append(
                old_assistant
            )

        return jsonify({
            "error":
            "No user message found."
        }), 400

    ollama_messages = build_ollama_messages(
        chats[chat_id]
    )

    save_chats()

    stop_event = create_generation_event(
        chat_id
    )

    def generate():

        assistant_response = ""

        stopped = False

        try:

            response = chat(

                model=MODEL_NAME,

                messages=ollama_messages,

                stream=True

            )

            for chunk in response:

                if stop_event.is_set():

                    stopped = True

                    break

                try:

                    content = (
                        chunk.message.content
                    )

                except AttributeError:

                    content = ""

                if content:

                    assistant_response += content

                    yield content

            if assistant_response.strip():

                if stopped:

                    assistant_response += (
                        "\n\n⏹️ *Generation stopped.*"
                    )

                chats[chat_id][
                    "messages"
                ].append({

                    "role": "assistant",

                    "content":
                    assistant_response

                })

                chats[chat_id][
                    "updated_at"
                ] = current_time()

                save_chats()

        except Exception as error:

            print(
                f"Regenerate error: {error}"
            )

            if old_assistant:

                chats[chat_id][
                    "messages"
                ].append(
                    old_assistant
                )

                save_chats()

            yield (
                "\n\n⚠️ **Ollama Error:** "
                + str(error)
            )

        finally:

            remove_generation_event(
                chat_id
            )

    response = Response(

        stream_with_context(
            generate()
        ),

        mimetype="text/plain"

    )

    response.headers[
        "X-Chat-ID"
    ] = chat_id

    response.headers[
        "Cache-Control"
    ] = "no-cache"

    response.headers[
        "X-Accel-Buffering"
    ] = "no"

    return response


# ============================================================
# RENAME CHAT
# ============================================================

@app.route(
    "/rename/<chat_id>",
    methods=["POST", "PUT"]
)
def rename_chat(chat_id):

    if chat_id not in chats:

        return jsonify({
            "error":
            "Chat not found."
        }), 404

    data = request.get_json(
        silent=True
    ) or {}

    new_title = data.get(
        "title",
        ""
    ).strip()

    if not new_title:

        return jsonify({
            "error":
            "Title cannot be empty."
        }), 400

    chats[chat_id][
        "title"
    ] = new_title[:80]

    chats[chat_id][
        "updated_at"
    ] = current_time()

    save_chats()

    return jsonify({
        "success": True
    })


# ============================================================
# DELETE CHAT
# ============================================================

@app.route(
    "/delete/<chat_id>",
    methods=["DELETE"]
)
def delete_chat(chat_id):

    if chat_id not in chats:

        return jsonify({
            "error":
            "Chat not found."
        }), 404

    # Stop generation if this chat is active.

    event = get_generation_event(
        chat_id
    )

    if event:

        event.set()

    del chats[chat_id]

    save_chats()

    remove_generation_event(
        chat_id
    )

    return jsonify({
        "success": True
    })


# ============================================================
# DELETE ALL CHATS
# ============================================================

@app.route(
    "/delete-all",
    methods=["DELETE"]
)
def delete_all_chats():

    # Stop all active generations.

    with generation_lock:

        for event in generation_events.values():

            event.set()

        generation_events.clear()

    chats.clear()

    save_chats()

    return jsonify({
        "success": True
    })


# ============================================================
# RUN APPLICATION
# ============================================================

if __name__ == "__main__":

    print("=" * 60)

    print("ChatLlama starting...")

    print(
        f"Model: {MODEL_NAME}"
    )

    print(
        "URL: http://127.0.0.1:5000"
    )

    print("=" * 60)

    app.run(

        host="127.0.0.1",

        port=5000,

        debug=True

    )
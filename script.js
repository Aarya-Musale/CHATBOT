// ============================================================
// CHATLLAMA - PHASE 1 FRONTEND
// ============================================================

let currentChatId = null;
let isGenerating = false;
let allChats = [];
let pendingDocument = null;


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    loadChats();
    setupEnterKey();
    updateSearchClearButton();

});


// ============================================================
// LOAD CHATS
// ============================================================

async function loadChats() {

    try {

        const response =
            await fetch("/chats");

        if (!response.ok) {
            throw new Error("Could not load chats.");
        }

        allChats =
            await response.json();

        renderChatHistory(allChats);

        if (currentChatId) {
            highlightCurrentChat();
        }

    } catch (error) {

        console.error(
            "Load chats error:",
            error
        );

        document.getElementById(
            "chatHistory"
        ).innerHTML = `
            <div class="chat-empty-state">
                <div class="empty-chat-icon">⚠️</div>
                <strong>Could not load chats</strong>
                <span>Please refresh the page and try again.</span>
            </div>
        `;
    }
}


// ============================================================
// RENDER CHAT HISTORY
// ============================================================

function renderChatHistory(
    chatList = allChats,
    isSearchResult = false
) {

    const history =
        document.getElementById(
            "chatHistory"
        );

    history.innerHTML = "";

    if (
        !chatList ||
        chatList.length === 0
    ) {

        const searchInput =
            document.getElementById(
                "chatSearch"
            );

        const hasSearch =
            searchInput &&
            searchInput.value.trim() !== "";

        const emptyState =
            document.createElement(
                "div"
            );

        emptyState.className =
            "chat-empty-state";

        if (
            hasSearch ||
            isSearchResult
        ) {

            emptyState.innerHTML = `
                <div class="empty-chat-icon">
                    🔍
                </div>

                <strong>
                    No matching chats
                </strong>

                <span>
                    Try a different search term.
                </span>
            `;

        } else {

            emptyState.innerHTML = `
                <div class="empty-chat-icon">
                    💬
                </div>

                <strong>
                    No recent chats
                </strong>

                <span>
                    Start a new conversation to see it here.
                </span>
            `;
        }

        history.appendChild(
            emptyState
        );

        updateChatCount(0);

        return;
    }

    chatList.forEach(
        chat => {

            history.appendChild(
                createChatItem(chat)
            );

        }
    );

    updateChatCount(
        chatList.length
    );

    highlightCurrentChat();
}


// ============================================================
// CREATE CHAT ITEM
// ============================================================

function createChatItem(chat) {

    const item =
        document.createElement(
            "div"
        );

    item.className =
        "chat-item";

    item.dataset.chatId =
        chat.id;


    // Main clickable area
    const main =
        document.createElement(
            "div"
        );

    main.className =
        "chat-item-main";

    main.onclick =
        () => loadChat(chat.id);


    // Icon
    const icon =
        document.createElement(
            "span"
        );

    icon.className =
        "chat-icon";

    icon.textContent =
        chat.document_name
            ? "📄"
            : "💬";


    // Content
    const content =
        document.createElement(
            "div"
        );

    content.className =
        "chat-item-content";


    // Title
    const title =
        document.createElement(
            "span"
        );

    title.className =
        "chat-title";

    title.textContent =
        chat.title ||
        "New Chat";


    content.appendChild(
        title
    );


    main.appendChild(
        icon
    );

    main.appendChild(
        content
    );


    // Three-dot button
    const menuButton =
        document.createElement(
            "button"
        );

    menuButton.className =
        "chat-menu-button";

    menuButton.type =
        "button";

    menuButton.textContent =
        "⋮";

    menuButton.title =
        "Chat options";


    menuButton.onclick =
        event => {

            event.stopPropagation();

            showChatMenu(
                chat.id,
                menuButton
            );
        };


    item.appendChild(
        main
    );

    item.appendChild(
        menuButton
    );


    return item;
}


// ============================================================
// CHAT MENU
// ============================================================

function showChatMenu(
    chatId,
    button
) {

    closeAllDropdowns();


    const dropdown =
        document.createElement(
            "div"
        );

    dropdown.className =
        "chat-dropdown";


    // Rename
    const renameButton =
        document.createElement(
            "button"
        );

    renameButton.type =
        "button";

    renameButton.innerHTML =
        "✏️ Rename";


    renameButton.onclick =
        () => {

            renameChat(chatId);

            dropdown.remove();
        };


    // Delete
    const deleteButton =
        document.createElement(
            "button"
        );

    deleteButton.type =
        "button";

    deleteButton.innerHTML =
        "🗑️ Delete";


    deleteButton.onclick =
        () => {

            deleteChat(chatId);

            dropdown.remove();
        };


    dropdown.appendChild(
        renameButton
    );

    dropdown.appendChild(
        deleteButton
    );


    button.parentElement.appendChild(
        dropdown
    );
}


// ============================================================
// CLOSE DROPDOWNS
// ============================================================

function closeAllDropdowns() {

    document
        .querySelectorAll(
            ".chat-dropdown"
        )
        .forEach(
            element => element.remove()
        );
}


// ============================================================
// LOAD SINGLE CHAT
// ============================================================

async function loadChat(chatId) {

    if (isGenerating) {

        showToast(
            "Please wait until the current response finishes.",
            "warning"
        );

        return;
    }


    try {

        const response =
            await fetch(
                `/chat/${chatId}`
            );


        if (!response.ok) {

            throw new Error(
                "Could not load chat."
            );
        }


        const chat =
            await response.json();


        currentChatId =
            chatId;


        pendingDocument =
            null;


        const messages =
            document.getElementById(
                "messages"
            );


        messages.innerHTML =
            "";


        if (chat.document_name) {

            showDocumentPreview(
                chat.document_name,
                "Attached to this chat"
            );

        } else {

            hideDocumentPreview();
        }


        if (
            chat.messages &&
            chat.messages.length > 0
        ) {

            chat.messages.forEach(
                message => {

                    addMessage(
                        message.role,
                        message.content
                    );

                }
            );

        } else {

            showWelcomeScreen();
        }


        renderChatHistory(
            allChats
        );

        highlightCurrentChat();

        scrollToBottom();

        closeSidebar();


    } catch (error) {

        console.error(
            "Load chat error:",
            error
        );


        showToast(
            "Could not load this chat.",
            "error"
        );
    }
}


// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage() {

    if (isGenerating) {
        return;
    }


    const input =
        document.getElementById(
            "messageInput"
        );


    const message =
        input.value.trim();


    if (!message) {
        return;
    }


    const welcome =
        document.getElementById(
            "welcomeScreen"
        );


    if (welcome) {
        welcome.remove();
    }


    input.value =
        "";

    autoResize(input);


    addMessage(
        "user",
        message
    );


    const assistantMessage =
        addMessage(
            "assistant",
            ""
        );


    showTypingIndicator(
        assistantMessage
    );


    setGeneratingState(
        true
    );


    try {

        const payload = {

            message:
                message,

            chat_id:
                currentChatId,

            document_text:
                pendingDocument
                    ? pendingDocument.text
                    : "",

            document_name:
                pendingDocument
                    ? pendingDocument.name
                    : ""

        };


        const response =
            await fetch(
                "/send",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        if (!response.ok) {

            let errorMessage =
                "Unable to send message.";


            try {

                const errorData =
                    await response.json();

                errorMessage =
                    errorData.error ||
                    errorMessage;

            } catch (_) {}


            throw new Error(
                errorMessage
            );
        }


        const returnedChatId =
            response.headers.get(
                "X-Chat-ID"
            );


        if (returnedChatId) {

            currentChatId =
                returnedChatId;
        }


        if (pendingDocument) {

            pendingDocument =
                null;

            hideDocumentPreview();
        }


        await streamResponse(
            response,
            assistantMessage
        );


        await loadChats();

        highlightCurrentChat();


    } catch (error) {

        console.error(
            "Send message error:",
            error
        );


        showAssistantError(
            assistantMessage,
            error.message
        );


    } finally {

        setGeneratingState(
            false
        );
    }
}


// ============================================================
// STREAM RESPONSE
// ============================================================

async function streamResponse(
    response,
    assistantMessage
) {

    removeTypingIndicator(
        assistantMessage
    );


    if (!response.body) {

        throw new Error(
            "No response stream received."
        );
    }


    const reader =
        response.body.getReader();


    const decoder =
        new TextDecoder(
            "utf-8"
        );


    let fullText =
        "";


    while (true) {

        const {
            value,
            done
        } =
            await reader.read();


        if (done) {
            break;
        }


        const chunk =
            decoder.decode(
                value,
                {
                    stream: true
                }
            );


        fullText +=
            chunk;


        assistantMessage.innerHTML =
            formatMessage(
                fullText
            );


        enhanceCodeBlocks(
            assistantMessage
        );


        scrollToBottom();
    }


    assistantMessage.innerHTML =
        formatMessage(
            fullText
        );


    enhanceCodeBlocks(
        assistantMessage
    );


    addResponseButtons(
        assistantMessage,
        fullText
    );


    scrollToBottom();
}


// ============================================================
// ADD MESSAGE
// ============================================================

function addMessage(
    role,
    content
) {

    const messages =
        document.getElementById(
            "messages"
        );


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        `message-wrapper ${role}`;


    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "message-avatar";


    avatar.textContent =
        role === "user"
            ? "👤"
            : "🦙";


    const message =
        document.createElement(
            "div"
        );


    message.className =
        "message";


    if (content) {

        message.innerHTML =
            formatMessage(
                content
            );
    }


    wrapper.appendChild(
        avatar
    );

    wrapper.appendChild(
        message
    );


    messages.appendChild(
        wrapper
    );


    if (
        role === "assistant" &&
        content
    ) {

        enhanceCodeBlocks(
            message
        );

        addResponseButtons(
            message,
            content
        );
    }


    scrollToBottom();


    return message;
}


// ============================================================
// MARKDOWN
// ============================================================

function formatMessage(text) {

    if (!text) {
        return "";
    }


    if (
        typeof marked !==
        "undefined"
    ) {

        try {

            return marked.parse(
                text,
                {
                    breaks: true,
                    gfm: true
                }
            );

        } catch (error) {

            console.error(
                "Markdown error:",
                error
            );
        }
    }


    return escapeHTML(
        text
    ).replace(
        /\n/g,
        "<br>"
    );
}


// ============================================================
// CODE BLOCKS
// ============================================================

function enhanceCodeBlocks(
    container
) {

    const blocks =
        container.querySelectorAll(
            "pre"
        );


    blocks.forEach(
        pre => {

            if (
                pre.parentElement &&
                pre.parentElement.classList.contains(
                    "code-wrapper"
                )
            ) {
                return;
            }


            const code =
                pre.querySelector(
                    "code"
                );


            if (!code) {
                return;
            }


            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "code-wrapper";


            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "code-header";


            const language =
                document.createElement(
                    "span"
                );


            language.textContent =
                getCodeLanguage(
                    code
                );


            const copy =
                document.createElement(
                    "button"
                );


            copy.type =
                "button";

            copy.textContent =
                "Copy";


            copy.onclick =
                async () => {

                    const success =
                        await copyText(
                            code.innerText
                        );


                    copy.textContent =
                        success
                            ? "✓ Copied!"
                            : "Copy";


                    setTimeout(
                        () => {

                            copy.textContent =
                                "Copy";

                        },
                        1500
                    );
                };


            header.appendChild(
                language
            );

            header.appendChild(
                copy
            );


            pre.parentNode.insertBefore(
                wrapper,
                pre
            );


            wrapper.appendChild(
                header
            );

            wrapper.appendChild(
                pre
            );
        }
    );
}


// ============================================================
// CODE LANGUAGE
// ============================================================

function getCodeLanguage(code) {

    const className =
        code.className ||
        "";


    const match =
        className.match(
            /language-(\w+)/
        );


    return match
        ? match[1].toUpperCase()
        : "CODE";
}


// ============================================================
// RESPONSE BUTTONS
// ============================================================

function addResponseButtons(
    messageElement,
    text
) {

    if (
        messageElement.querySelector(
            ".response-actions"
        )
    ) {
        return;
    }


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "response-actions";


    const copyButton =
        document.createElement(
            "button"
        );


    copyButton.type =
        "button";

    copyButton.innerHTML =
        "📋 Copy";


    copyButton.onclick =
        async () => {

            const success =
                await copyText(
                    text
                );


            copyButton.innerHTML =
                success
                    ? "✓ Copied"
                    : "📋 Copy";


            setTimeout(
                () => {

                    copyButton.innerHTML =
                        "📋 Copy";

                },
                1500
            );
        };


    const likeButton =
        document.createElement(
            "button"
        );


    likeButton.type =
        "button";

    likeButton.innerHTML =
        "👍";

    likeButton.title =
        "Good response";


    const dislikeButton =
        document.createElement(
            "button"
        );


    dislikeButton.type =
        "button";

    dislikeButton.innerHTML =
        "👎";

    dislikeButton.title =
        "Bad response";


    likeButton.onclick =
        () => {

            likeButton.classList.toggle(
                "selected"
            );

            dislikeButton.classList.remove(
                "selected"
            );

            showToast(
                "Thanks for your feedback!",
                "success"
            );
        };


    dislikeButton.onclick =
        () => {

            dislikeButton.classList.toggle(
                "selected"
            );

            likeButton.classList.remove(
                "selected"
            );

            showToast(
                "Thanks for your feedback!",
                "success"
            );
        };


    const regenerateButton =
        document.createElement(
            "button"
        );


    regenerateButton.type =
        "button";

    regenerateButton.innerHTML =
        "↻ Regenerate";


    regenerateButton.onclick =
        () => regenerateResponse();


    actions.appendChild(
        copyButton
    );

    actions.appendChild(
        likeButton
    );

    actions.appendChild(
        dislikeButton
    );

    actions.appendChild(
        regenerateButton
    );


    messageElement.appendChild(
        actions
    );
}


// ============================================================
// COPY TEXT
// ============================================================

async function copyText(text) {

    try {

        await navigator.clipboard.writeText(
            text
        );

        return true;

    } catch (error) {

        try {

            const textarea =
                document.createElement(
                    "textarea"
                );


            textarea.value =
                text;


            document.body.appendChild(
                textarea
            );


            textarea.select();


            document.execCommand(
                "copy"
            );


            textarea.remove();


            return true;

        } catch (fallbackError) {

            console.error(
                "Copy failed:",
                fallbackError
            );

            return false;
        }
    }
}


// ============================================================
// STOP GENERATION
// ============================================================

async function stopGeneration() {

    if (
        !isGenerating ||
        !currentChatId
    ) {
        return;
    }


    try {

        const response =
            await fetch(
                "/stop",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            chat_id:
                                currentChatId
                        })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Could not stop generation."
            );
        }


        showToast(
            "Generation stopped.",
            "info"
        );


    } catch (error) {

        console.error(
            "Stop error:",
            error
        );


        showToast(
            "Could not stop generation.",
            "error"
        );
    }
}


// ============================================================
// REGENERATE
// ============================================================

async function regenerateResponse() {

    if (
        isGenerating ||
        !currentChatId
    ) {
        return;
    }


    const messages =
        document.getElementById(
            "messages"
        );


    const assistantWrappers =
        messages.querySelectorAll(
            ".message-wrapper.assistant"
        );


    const lastAssistant =
        assistantWrappers[
            assistantWrappers.length - 1
        ];


    if (!lastAssistant) {
        return;
    }


    const assistantMessage =
        lastAssistant.querySelector(
            ".message"
        );


    if (!assistantMessage) {
        return;
    }


    assistantMessage.innerHTML =
        "";


    showTypingIndicator(
        assistantMessage
    );


    setGeneratingState(
        true
    );


    try {

        const response =
            await fetch(
                "/regenerate",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            chat_id:
                                currentChatId
                        })
                }
            );


        if (!response.ok) {

            let error =
                "Could not regenerate response.";


            try {

                const data =
                    await response.json();


                error =
                    data.error ||
                    error;

            } catch (_) {}


            throw new Error(
                error
            );
        }


        await streamResponse(
            response,
            assistantMessage
        );


        await loadChats();


    } catch (error) {

        console.error(
            "Regenerate error:",
            error
        );


        showAssistantError(
            assistantMessage,
            error.message
        );


    } finally {

        setGeneratingState(
            false
        );
    }
}


// ============================================================
// TYPING INDICATOR
// ============================================================

function showTypingIndicator(
    element
) {

    element.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
}


function removeTypingIndicator(
    element
) {

    const typing =
        element.querySelector(
            ".typing-indicator"
        );


    if (typing) {
        typing.remove();
    }
}


// ============================================================
// ASSISTANT ERROR
// ============================================================

function showAssistantError(
    element,
    message
) {

    element.innerHTML =
        `<div class="error-message">
            ⚠️ ${escapeHTML(message)}
        </div>`;
}


// ============================================================
// NEW CHAT
// ============================================================

function newChat() {

    if (isGenerating) {
        return;
    }


    currentChatId =
        null;


    pendingDocument =
        null;


    hideDocumentPreview();


    const messages =
        document.getElementById(
            "messages"
        );


    messages.innerHTML = `

        <div
            class="welcome-screen"
            id="welcomeScreen"
        >

            <div class="welcome-icon">
                🦙
            </div>

            <h2>
                How can I help you today?
            </h2>

            <p>
                Ask me anything. I'm powered by
                <strong>Llama 3.2</strong>
                and running locally on your computer.
            </p>

            <div class="suggestions">

                <button
                    class="suggestion-card"
                    onclick="useSuggestion('Explain Python functions with examples')"
                >
                    <span class="suggestion-icon">
                        🐍
                    </span>

                    <div>
                        <strong>
                            Learn Python
                        </strong>

                        <small>
                            Explain functions with examples
                        </small>
                    </div>
                </button>


                <button
                    class="suggestion-card"
                    onclick="useSuggestion('Give me some machine learning project ideas')"
                >
                    <span class="suggestion-icon">
                        🤖
                    </span>

                    <div>
                        <strong>
                            Machine Learning
                        </strong>

                        <small>
                            Get project ideas
                        </small>
                    </div>
                </button>


                <button
                    class="suggestion-card"
                    onclick="useSuggestion('Write a Python program to find the second largest number in a list')"
                >
                    <span class="suggestion-icon">
                        💻
                    </span>

                    <div>
                        <strong>
                            Coding Help
                        </strong>

                        <small>
                            Solve a Python problem
                        </small>
                    </div>
                </button>


                <button
                    class="suggestion-card"
                    onclick="useSuggestion('What are the most important topics to prepare for an AI Engineer interview?')"
                >
                    <span class="suggestion-icon">
                        🎯
                    </span>

                    <div>
                        <strong>
                            Interview Prep
                        </strong>

                        <small>
                            Prepare for AI interviews
                        </small>
                    </div>
                </button>

            </div>

        </div>
    `;


    const input =
        document.getElementById(
            "messageInput"
        );


    input.value =
        "";

    autoResize(input);

    renderChatHistory(
        allChats
    );

    input.focus();

    closeSidebar();
}


// ============================================================
// DELETE CHAT
// ============================================================

async function deleteChat(chatId) {

    if (
        !confirm(
            "Delete this chat?"
        )
    ) {
        return;
    }


    try {

        const response =
            await fetch(
                `/delete/${chatId}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Could not delete chat."
            );
        }


        if (
            currentChatId === chatId
        ) {

            newChat();
        }


        await loadChats();


        showToast(
            "Chat deleted.",
            "success"
        );


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        showToast(
            "Could not delete chat.",
            "error"
        );
    }
}


// ============================================================
// DELETE ALL CHATS
// ============================================================

async function deleteAllChats() {

    if (
        allChats.length === 0
    ) {
        return;
    }


    if (
        !confirm(
            "Delete all chats? This cannot be undone."
        )
    ) {
        return;
    }


    try {

        const response =
            await fetch(
                "/delete-all",
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Could not delete chats."
            );
        }


        currentChatId =
            null;

        allChats =
            [];


        newChat();


        await loadChats();


        showToast(
            "All chats deleted.",
            "success"
        );


    } catch (error) {

        console.error(
            "Delete all error:",
            error
        );


        showToast(
            "Could not delete all chats.",
            "error"
        );
    }
}


// ============================================================
// RENAME CHAT
// ============================================================

async function renameChat(chatId) {

    const chat =
        allChats.find(
            item =>
                item.id === chatId
        );


    if (!chat) {
        return;
    }


    const newTitle =
        prompt(
            "Enter new chat name:",
            chat.title
        );


    if (newTitle === null) {
        return;
    }


    const title =
        newTitle.trim();


    if (!title) {

        showToast(
            "Chat name cannot be empty.",
            "warning"
        );

        return;
    }


    try {

        const response =
            await fetch(
                `/rename/${chatId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            title:
                                title
                        })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Could not rename chat."
            );
        }


        await loadChats();


        showToast(
            "Chat renamed.",
            "success"
        );


    } catch (error) {

        console.error(
            "Rename error:",
            error
        );


        showToast(
            "Could not rename chat.",
            "error"
        );
    }
}


// ============================================================
// SEARCH CHATS
// ============================================================

function searchChats() {

    const searchInput =
        document.getElementById(
            "chatSearch"
        );


    const search =
        searchInput.value
            .toLowerCase()
            .trim();


    updateSearchClearButton();


    if (!search) {

        renderChatHistory(
            allChats
        );

        return;
    }


    const filtered =
        allChats.filter(
            chat => {

                const title =
                    (
                        chat.title ||
                        ""
                    )
                    .toLowerCase();


                const documentName =
                    (
                        chat.document_name ||
                        ""
                    )
                    .toLowerCase();


                return (
                    title.includes(search) ||
                    documentName.includes(search)
                );
            }
        );


    renderChatHistory(
        filtered,
        true
    );
}


// ============================================================
// SEARCH CLEAR BUTTON
// ============================================================

function updateSearchClearButton() {

    const input =
        document.getElementById(
            "chatSearch"
        );


    const container =
        document.querySelector(
            ".search-container"
        );


    if (!input || !container) {
        return;
    }


    let clearButton =
        container.querySelector(
            ".search-clear"
        );


    if (!clearButton) {

        clearButton =
            document.createElement(
                "button"
            );

        clearButton.className =
            "search-clear";

        clearButton.type =
            "button";

        clearButton.innerHTML =
            "×";

        clearButton.title =
            "Clear search";

        clearButton.onclick =
            clearChatSearch;

        container.appendChild(
            clearButton
        );
    }


    clearButton.style.display =
        input.value.trim()
            ? "flex"
            : "none";
}


// ============================================================
// CLEAR SEARCH
// ============================================================

function clearChatSearch() {

    const input =
        document.getElementById(
            "chatSearch"
        );


    if (!input) {
        return;
    }


    input.value =
        "";


    updateSearchClearButton();


    renderChatHistory(
        allChats
    );


    input.focus();
}


// ============================================================
// CHAT COUNT
// ============================================================

function updateChatCount(
    count
) {

    const title =
        document.querySelector(
            ".recent-title span"
        );


    if (!title) {
        return;
    }


    title.textContent =
        count > 0
            ? `Recent Chats (${count})`
            : "Recent Chats";
}


// ============================================================
// SUGGESTIONS
// ============================================================

function useSuggestion(text) {

    const input =
        document.getElementById(
            "messageInput"
        );


    input.value =
        text;


    autoResize(input);

    input.focus();

    sendMessage();
}


// ============================================================
// AUTO RESIZE INPUT
// ============================================================

function autoResize(textarea) {

    textarea.style.height =
        "auto";


    textarea.style.height =
        Math.min(
            textarea.scrollHeight,
            150
        ) + "px";
}


// ============================================================
// ENTER KEY
// ============================================================

function setupEnterKey() {

    const input =
        document.getElementById(
            "messageInput"
        );


    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );
}


// ============================================================
// GENERATING STATE
// ============================================================

function setGeneratingState(
    generating
) {

    isGenerating =
        generating;


    const button =
        document.getElementById(
            "sendButton"
        );


    const icon =
        document.getElementById(
            "sendIcon"
        );


    if (generating) {

        button.disabled =
            false;

        button.classList.add(
            "stop-mode"
        );

        button.title =
            "Stop generating";

        icon.textContent =
            "■";

        button.onclick =
            stopGeneration;


    } else {

        button.disabled =
            false;

        button.classList.remove(
            "stop-mode"
        );

        button.title =
            "Send message";

        icon.textContent =
            "➤";

        button.onclick =
            sendMessage;
    }
}


// ============================================================
// HIGHLIGHT CURRENT CHAT
// ============================================================

function highlightCurrentChat() {

    document
        .querySelectorAll(
            ".chat-item"
        )
        .forEach(
            item => {

                item.classList.toggle(
                    "active",
                    item.dataset.chatId ===
                        currentChatId
                );
            }
        );
}


// ============================================================
// WELCOME SCREEN
// ============================================================

function showWelcomeScreen() {

    const messages =
        document.getElementById(
            "messages"
        );


    messages.innerHTML = `

        <div
            class="welcome-screen"
            id="welcomeScreen"
        >

            <div class="welcome-icon">
                🦙
            </div>

            <h2>
                How can I help you today?
            </h2>

            <p>
                Start a new conversation with ChatLlama.
            </p>

        </div>
    `;
}


// ============================================================
// SCROLL
// ============================================================

function scrollToBottom() {

    const messages =
        document.getElementById(
            "messages"
        );


    setTimeout(
        () => {

            messages.scrollTop =
                messages.scrollHeight;

        },
        10
    );
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;
}


// ============================================================
// DOCUMENT UPLOAD
// ============================================================

async function uploadDocument(
    input
) {

    const file =
        input.files[0];


    if (!file) {
        return;
    }


    const allowedTypes = [
        ".pdf",
        ".docx",
        ".txt"
    ];


    const extension =
        "." +
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    if (
        !allowedTypes.includes(
            extension
        )
    ) {

        showToast(
            "Please upload a PDF, DOCX or TXT file.",
            "warning"
        );


        input.value =
            "";

        return;
    }


    showDocumentPreview(
        file.name,
        "Uploading..."
    );


    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    try {

        const response =
            await fetch(
                "/upload",
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Upload failed."
            );
        }


        pendingDocument = {

            name:
                data.filename,

            text:
                data.text

        };


        showDocumentPreview(
            data.filename,
            "Ready for questions"
        );


        showToast(
            "Document uploaded successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Upload error:",
            error
        );


        hideDocumentPreview();


        showToast(
            error.message,
            "error"
        );
    }


    input.value =
        "";
}


// ============================================================
// DOCUMENT PREVIEW
// ============================================================

function showDocumentPreview(
    filename,
    status
) {

    const preview =
        document.getElementById(
            "documentPreview"
        );


    const name =
        document.getElementById(
            "documentName"
        );


    const statusElement =
        document.getElementById(
            "documentStatus"
        );


    name.textContent =
        filename;


    statusElement.textContent =
        status;


    preview.style.display =
        "flex";
}


function hideDocumentPreview() {

    const preview =
        document.getElementById(
            "documentPreview"
        );


    preview.style.display =
        "none";
}


function removeDocument() {

    pendingDocument =
        null;


    hideDocumentPreview();


    showToast(
        "Document removed.",
        "info"
    );
}


// ============================================================
// MOBILE SIDEBAR
// ============================================================

function toggleSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    sidebar.classList.toggle(
        "open"
    );
}


function closeSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    sidebar.classList.remove(
        "open"
    );
}


// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

function showToast(
    message,
    type = "info"
) {

    let container =
        document.getElementById(
            "toastContainer"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );


        container.id =
            "toastContainer";


        document.body.appendChild(
            container
        );
    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast toast-${type}`;


    const icons = {

        success: "✓",

        error: "⚠️",

        warning: "⚠️",

        info: "ℹ️"

    };


    toast.innerHTML = `
        <span>${icons[type] || "ℹ️"}</span>
        <span>${escapeHTML(message)}</span>
    `;


    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.classList.add(
                "toast-hide"
            );


            setTimeout(
                () => {

                    toast.remove();

                },
                300
            );

        },
        2500
    );
}


// ============================================================
// CLOSE DROPDOWNS
// ============================================================

document.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(
                ".chat-menu-button"
            ) &&
            !event.target.closest(
                ".chat-dropdown"
            )
        ) {

            closeAllDropdowns();
        }
    }
);


// ============================================================
// CLOSE MOBILE SIDEBAR WITH ESCAPE
// ============================================================

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            closeSidebar();

            closeAllDropdowns();
        }
    }
);


// ============================================================
// CLOSE MOBILE SIDEBAR OUTSIDE CLICK
// ============================================================

document.addEventListener(
    "click",
    event => {

        const sidebar =
            document.getElementById(
                "sidebar"
            );

        const menuButton =
            document.querySelector(
                ".mobile-menu-btn"
            );


        if (!sidebar) {
            return;
        }


        if (
            window.innerWidth <= 800 &&
            sidebar.classList.contains("open") &&
            !sidebar.contains(event.target) &&
            (
                !menuButton ||
                !menuButton.contains(event.target)
            )
        ) {

            closeSidebar();
        }
    }
)
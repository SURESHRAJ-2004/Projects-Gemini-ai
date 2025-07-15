const chatsContainer = document.querySelector(".chats-container");
const container = document.querySelector(".container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const themeToggle = document.querySelector("#theme-toggle-btn");

// API configuration
const API_KEY = "AIzaSyBbtFC3m2bw5BzTS4n-m7RzRKXe9Ita0zM";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Global variables
let typingInterval, controller;
const chatHistory = []; // Stores full history for Gemini API

// Utility function to create a chat message element
const createMsgElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// Scrolls  bottom
const scrollToBottom = () => {
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
};

// typing effect 
const typingEffect = (text, textElement, botMsgDiv) => {
    textElement.textContent = "";
    const words = text.split(" ");
    let wordIndex = 0;

    typingInterval = setInterval(() => {
        if (wordIndex < words.length) {
            textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
            scrollToBottom();
        } else {
            clearInterval(typingInterval);
            botMsgDiv.classList.remove("loading");
            document.body.classList.remove("bot-responding");
        }
    }, 40); // Typing speed
};

// Sends user's message to Gemini API and gets bot response\

const generateResponse = async (botMsgDiv, userMessage) => {
    const textElement = botMsgDiv.querySelector(".message-text");
    controller = new AbortController(); // For aborting requests

    // Add user message to chat history
    chatHistory.push({
        role: "user",
        parts: [{ text: userMessage }]
    });

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: chatHistory }),
            signal: controller.signal
        });

        const data = await response.json();

        // Handle errors or missing data

        if (!response.ok || !data.candidates || !data.candidates[0].content.parts[0]) {
            throw new Error(data.error?.message || "Invalid API response.");
        }

        // Extract and format bot reply
        const responseText = data.candidates[0].content.parts[0].text
            .replace(/\*\*([^*]+)\*\*/g, "$1") 
            .trim();

        typingEffect(responseText, textElement, botMsgDiv); // Animate bot response

        // Add bot response to chat history

        chatHistory.push({
            role: "model",
            parts: [{ text: responseText }]
        });

        console.log(chatHistory); 
    } catch (error) {
        textElement.style.color = "#d62939";
        textElement.textContent = error.name === "AbortError" ? "Response generation stopped." : error.message;
        botMsgDiv.classList.remove("loading");
        document.body.classList.remove("bot-responding");
    }
};

// Handles the form submission (user sends message)

const handleFormSubmit = (e) => {
    e.preventDefault();

    const userMessage = promptInput.value.trim();
    if (!userMessage || document.body.classList.contains("bot-responding")) return;

    // Clear input and show user message
    promptInput.value = "";
    document.body.classList.add("bot-responding", "chats-active");

    const userMsgDiv = createMsgElement(`<p class="message-text">${userMessage}</p>`, "user-message");
    chatsContainer.appendChild(userMsgDiv);
    scrollToBottom();

    //bot "thinking..." message
    setTimeout(() => {
        const botMsgHTML = `<img src="gemini-chatbot-logo.svg" class="avatar"><p class="message-text">Just a sec....</p>`;
        const botMsgDiv = createMsgElement(botMsgHTML, "bot-message", "loading");
        chatsContainer.appendChild(botMsgDiv);
        scrollToBottom();

        generateResponse(botMsgDiv, userMessage); // Generate bot response
    }, 600);
};

// Stop bot response

document.querySelector("#stop-response-btn").addEventListener("click", () => {
    controller?.abort(); // Abort fetch request
    clearInterval(typingInterval);
    chatsContainer.querySelector(".bot-message.loading")?.classList.remove("loading");
    document.body.classList.remove("bot-responding");
});

// Clear chat 

document.querySelector("#delete-chats-btn").addEventListener("click", () => {
    chatHistory.length = 0;
    chatsContainer.innerHTML = "";
    document.body.classList.remove("bot-responding", "chats-active");
});

// Show/hide bottom control panel based on user interaction

document.addEventListener("click", ({ target }) => {
    const wrapper = document.querySelector(".prompt-wrapper");
    const shouldHide = target.classList.contains("prompt-input") ||
        (wrapper.classList.contains("hide-controls") && target.id === "stop-response-btn");
    wrapper.classList.toggle("hide-controls", shouldHide);
});

//click events on suggestion prompts

document.querySelectorAll(".suggestions-item").forEach(item => {
    item.addEventListener("click", () => {
        promptInput.value = item.querySelector(".text").textContent;
        promptForm.dispatchEvent(new Event("submit")); 
    });
});

//  dark/light mode

document.addEventListener("DOMContentLoaded", () => {
    if (!themeToggle) return;

    const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
    document.body.classList.toggle("light-theme", isLightTheme);
    themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";

    themeToggle.addEventListener("click", () => {
        const isLightTheme = document.body.classList.toggle("light-theme");
        localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");
        themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";
    });
});

// Submit event listener for main chat form
promptForm.addEventListener("submit", handleFormSubmit);

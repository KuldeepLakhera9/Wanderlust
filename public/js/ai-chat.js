// Client-side Script for AI Travel Assistant Widget
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("aiWidgetToggle");
  const closeBtn = document.getElementById("aiChatClose");
  const chatDrawer = document.getElementById("aiChatDrawer");
  const chatStream = document.getElementById("aiChatStream");
  const chatForm = document.getElementById("aiChatForm");
  const chatInput = document.getElementById("aiChatInput");
  const quickChips = document.querySelectorAll(".chip-btn");

  if (!toggleBtn || !chatDrawer || !chatStream || !chatForm) return;

  // Toggle chat drawer visibility
  toggleBtn.addEventListener("click", () => {
    chatDrawer.classList.toggle("d-none");
    if (!chatDrawer.classList.contains("d-none")) {
      chatInput?.focus();
    }
  });

  closeBtn?.addEventListener("click", () => {
    chatDrawer.classList.add("d-none");
  });

  // Quick prompt chip click handler
  quickChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const promptText = chip.getAttribute("data-prompt");
      if (promptText) {
        sendMessage(promptText);
      }
    });
  });

  // Form submit handler
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const userText = chatInput.value.trim();
    if (!userText) return;
    chatInput.value = "";
    sendMessage(userText);
  });

  async function sendMessage(text) {
    // Render user message bubble
    appendMessage(text, "user");

    // Render typing indicator
    const typingIndicator = appendTypingIndicator();
    scrollToBottom();

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      typingIndicator.remove();

      if (data.reply) {
        appendBotResponse(data.reply, data.listings || []);
      } else {
        appendMessage("I couldn't process that request right now. Please try again!", "bot");
      }
    } catch (err) {
      typingIndicator.remove();
      appendMessage("Network error connecting to AI Assistant. Please check your connection.", "bot");
    }

    scrollToBottom();
  }

  function appendMessage(text, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `ai-msg ${sender}-msg mb-3`;

    if (sender === "user") {
      msgDiv.innerHTML = `
        <div class="msg-content p-3 rounded-4 bg-danger text-white shadow-sm ms-auto" style="max-width: 85%; font-size: 0.9rem;">
          ${escapeHtml(text)}
        </div>
      `;
    } else {
      msgDiv.innerHTML = `
        <div class="msg-content p-3 rounded-4 bg-white border shadow-sm" style="max-width: 90%; font-size: 0.9rem;">
          ${formatMarkdown(text)}
        </div>
      `;
    }

    chatStream.appendChild(msgDiv);
    return msgDiv;
  }

  function appendBotResponse(replyText, listings) {
    const msgDiv = document.createElement("div");
    msgDiv.className = "ai-msg bot-msg mb-3";

    let listingsHtml = "";
    if (listings && listings.length > 0) {
      listingsHtml = `
        <div class="row row-cols-1 g-2 mt-2">
          ${listings.map((l) => `
            <div class="col">
              <div class="card border rounded-3 p-2 d-flex flex-row align-items-center gap-2 bg-light">
                <img src="${l.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;" alt="${l.title}">
                <div class="flex-grow-1 min-w-0">
                  <div class="fw-bold text-truncate small">${l.title}</div>
                  <div class="text-muted fs-8">${l.location}, ${l.country}</div>
                  <div class="fw-bold text-danger fs-8">₹${l.price ? l.price.toLocaleString("en-IN") : 0} / night</div>
                </div>
                <a href="/listings/${l.id}" class="btn btn-sm btn-dark rounded-pill px-2 py-1 fs-8">View</a>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }

    msgDiv.innerHTML = `
      <div class="msg-content p-3 rounded-4 bg-white border shadow-sm" style="max-width: 90%; font-size: 0.9rem;">
        <div>${formatMarkdown(replyText)}</div>
        ${listingsHtml}
      </div>
    `;

    chatStream.appendChild(msgDiv);
  }

  function appendTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.className = "ai-msg bot-msg mb-3";
    typingDiv.innerHTML = `
      <div class="msg-content p-3 rounded-4 bg-white border shadow-sm text-muted small d-flex align-items-center gap-2">
        <i class="fa-solid fa-wand-magic-sparkles text-danger"></i> Thinking...
      </div>
    `;
    chatStream.appendChild(typingDiv);
    return typingDiv;
  }

  function scrollToBottom() {
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function formatMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n\n/g, "<br><br>")
      .replace(/\n/g, "<br>");
  }
});

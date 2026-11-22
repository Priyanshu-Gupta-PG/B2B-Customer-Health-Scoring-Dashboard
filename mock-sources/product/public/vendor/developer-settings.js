/**
 * Shared Developer Settings panel for mock data websites.
 * API details stay hidden until opened, then masked like passwords with reveal + copy.
 */
(function (global) {
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(area);
      }
    });
  }

  function escapeAttr(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function buildPanel(config) {
    const fields = config.fields || [];
    const fieldHtml = fields
      .map(function (field, index) {
        const safe = escapeAttr(field.value);
        return `
          <div class="dev-field" data-field-index="${index}">
            <label class="dev-label" for="dev-input-${index}">${escapeAttr(field.label)}</label>
            <div class="dev-row">
              <input
                id="dev-input-${index}"
                class="dev-input"
                type="password"
                readonly
                value="${safe}"
                data-secret="${safe}"
                autocomplete="off"
                spellcheck="false"
              />
              <button type="button" class="dev-btn" data-action="toggle" data-index="${index}" aria-pressed="false">
                Reveal
              </button>
              <button type="button" class="dev-btn" data-action="copy" data-index="${index}">
                Copy
              </button>
            </div>
            <p class="dev-hint" data-hint-index="${index}" hidden></p>
          </div>`;
      })
      .join("");

    return `
      <div class="dev-settings" id="developerSettings" hidden>
        <div class="dev-card" role="dialog" aria-modal="true" aria-labelledby="devSettingsTitle">
          <div class="dev-card-head">
            <div>
              <h2 id="devSettingsTitle">Developer Settings</h2>
              <p class="dev-sub">API details are private. Reveal only when you need to wire the dashboard.</p>
            </div>
            <button type="button" class="dev-btn" data-action="close" aria-label="Close developer settings">Close</button>
          </div>
          <div class="dev-fields">
            ${fieldHtml}
          </div>
        </div>
      </div>`;
  }

  function wirePanel(root, fields) {
    function setHint(index, message) {
      const hint = root.querySelector(`[data-hint-index="${index}"]`);
      if (!hint) return;
      hint.hidden = !message;
      hint.textContent = message || "";
    }

    root.addEventListener("click", function (event) {
      const btn = event.target.closest("[data-action]");
      if (!btn || !root.contains(btn)) return;
      const action = btn.getAttribute("data-action");

      if (action === "close") {
        root.hidden = true;
        return;
      }

      const index = Number(btn.getAttribute("data-index"));
      const input = root.querySelector(`#dev-input-${index}`);
      if (!input) return;
      const secret = fields[index] ? fields[index].value : input.dataset.secret || input.value;

      if (action === "toggle") {
        const revealing = input.type === "password";
        input.type = revealing ? "text" : "password";
        btn.textContent = revealing ? "Hide" : "Reveal";
        btn.setAttribute("aria-pressed", revealing ? "true" : "false");
        setHint(index, "");
        return;
      }

      if (action === "copy") {
        copyText(secret)
          .then(function () {
            const previous = btn.textContent;
            btn.textContent = "Copied";
            setHint(index, "Copied — paste into your dashboard env or client.");
            setTimeout(function () {
              btn.textContent = previous;
            }, 1400);
          })
          .catch(function () {
            setHint(index, "Copy failed — reveal and select the value manually.");
          });
      }
    });
  }

  function mountDeveloperSettings(config) {
    const openBtn = document.getElementById("openDeveloperSettings");
    if (!openBtn) {
      console.error("Developer Settings button #openDeveloperSettings not found");
      return;
    }

    let panel = document.getElementById("developerSettings");
    if (!panel) {
      const wrap = document.createElement("div");
      wrap.innerHTML = buildPanel(config);
      document.body.appendChild(wrap.firstElementChild);
      panel = document.getElementById("developerSettings");
    }

    wirePanel(panel, config.fields || []);

    openBtn.addEventListener("click", function (event) {
      event.preventDefault();
      panel.hidden = false;
    });

    panel.addEventListener("click", function (event) {
      if (event.target === panel) panel.hidden = true;
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !panel.hidden) panel.hidden = true;
    });
  }

  global.mountDeveloperSettings = mountDeveloperSettings;
})(window);

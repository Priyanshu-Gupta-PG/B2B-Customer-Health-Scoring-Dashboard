(function () {
  const ENDPOINT = "/mock/product/usage";
  const LABEL = "Regenerate usage";

  function els() {
    return {
      rows: document.getElementById("rows"),
      stamp: document.getElementById("stamp"),
      count: document.getElementById("count"),
      status: document.getElementById("status"),
      button: document.getElementById("refresh"),
      tablePanel: document.getElementById("tablePanel"),
    };
  }

  function setStatus(message, kind) {
    const { status } = els();
    if (!status) return;
    status.textContent = message;
    status.dataset.kind = kind || "";
  }

  async function regenerate() {
    const { rows, stamp, count, button, tablePanel } = els();
    if (!rows || !stamp || !button) {
      console.error("Signal Meter: missing DOM nodes");
      return;
    }
    if (button.dataset.busy === "1") return;

    button.dataset.busy = "1";
    button.disabled = true;
    button.textContent = "Regenerating…";
    setStatus("Requesting fresh product usage…", "busy");

    try {
      const res = await fetch(`${ENDPOINT}?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!Array.isArray(json.data)) throw new Error("Response missing data[]");

      stamp.textContent = `Generated ${new Date(json.generated_at).toLocaleString()}`;
      if (count) count.textContent = `${json.data.length} tenants`;
      rows.innerHTML = json.data
        .map(
          (row) => `
        <tr>
          <td>${row.company_name}</td>
          <td>${row.domain}</td>
          <td class="num ${row.active_logins_30d >= 40 ? "good" : ""}">${row.active_logins_30d}</td>
          <td class="num">${row.unique_users_7d}</td>
          <td>${row.last_seen_hours_ago}h ago</td>
        </tr>`,
        )
        .join("");

      if (tablePanel) {
        tablePanel.classList.remove("flash");
        void tablePanel.offsetWidth;
        tablePanel.classList.add("flash");
      }
      setStatus("Usage regenerated.", "ok");
    } catch (err) {
      console.error(err);
      setStatus(`Could not refresh usage: ${err.message}`, "err");
    } finally {
      button.dataset.busy = "0";
      button.disabled = false;
      button.textContent = LABEL;
    }
  }

  window.regenerate = regenerate;

  function boot() {
    const { button } = els();
    if (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        regenerate();
      });
    }
    regenerate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

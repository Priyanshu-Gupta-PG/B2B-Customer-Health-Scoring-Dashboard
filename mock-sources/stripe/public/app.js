(function () {
  const ENDPOINT = "/mock/stripe/invoices";
  const LABEL = "Fetch new invoices";

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
      console.error("Ledger Wire: missing DOM nodes");
      return;
    }
    if (button.dataset.busy === "1") return;

    button.dataset.busy = "1";
    button.disabled = true;
    button.textContent = "Fetching…";
    setStatus("Requesting a fresh invoice snapshot…", "busy");

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
      if (count) count.textContent = `${json.data.length} customers`;
      rows.innerHTML = json.data
        .map(
          (row) => `
        <tr>
          <td>${row.company_name}</td>
          <td>${row.domain}</td>
          <td class="num ${row.overdue_invoices > 0 ? "warn" : ""}">${row.overdue_invoices}</td>
          <td class="num">${row.open_invoices}</td>
          <td>${row.latest_status}</td>
        </tr>`,
        )
        .join("");

      if (tablePanel) {
        tablePanel.classList.remove("flash");
        void tablePanel.offsetWidth;
        tablePanel.classList.add("flash");
      }
      setStatus("Invoices regenerated.", "ok");
    } catch (err) {
      console.error(err);
      setStatus(`Could not refresh invoices: ${err.message}`, "err");
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
    if (typeof window.mountDeveloperSettings === "function") {
      const origin = window.location.origin;
      window.mountDeveloperSettings({
        fields: [
          { label: "Endpoint URL", value: `${origin}${ENDPOINT}` },
          { label: "HTTP method", value: "POST" },
          {
            label: "Request body",
            value: '{"accounts":[{"id":"<account-id>","domain":"<domain>","company_name":"<name>"}]}',
          },
          { label: "Score metric", value: "overdue_invoices → overdue_invoice" },
          { label: "Env var for dashboard", value: `STRIPE_MOCK_URL=${origin}` },
        ],
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

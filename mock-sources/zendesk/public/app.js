const rows = document.getElementById("rows");
const stamp = document.getElementById("stamp");
const count = document.getElementById("count");

async function load() {
  const res = await fetch("/mock/zendesk/tickets", { cache: "no-store" });
  const json = await res.json();
  stamp.textContent = `Generated ${new Date(json.generated_at).toLocaleString()}`;
  count.textContent = `${json.data.length} orgs`;
  rows.innerHTML = json.data
    .map(
      (row) => `
      <tr>
        <td>${row.company_name}</td>
        <td>${row.domain}</td>
        <td class="num ${row.open_tickets >= 6 ? "hot" : ""}">${row.open_tickets}</td>
        <td class="num">${row.pending_tickets}</td>
        <td>${row.highest_priority}</td>
      </tr>`,
    )
    .join("");
}

document.getElementById("refresh").addEventListener("click", load);
load();
setInterval(load, 12_000);

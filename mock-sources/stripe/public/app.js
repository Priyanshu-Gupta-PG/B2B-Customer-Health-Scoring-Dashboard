const rows = document.getElementById("rows");
const stamp = document.getElementById("stamp");
const count = document.getElementById("count");

async function load() {
  const res = await fetch("/mock/stripe/invoices", { cache: "no-store" });
  const json = await res.json();
  stamp.textContent = `Generated ${new Date(json.generated_at).toLocaleString()}`;
  count.textContent = `${json.data.length} customers`;
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
}

document.getElementById("refresh").addEventListener("click", load);
load();
setInterval(load, 12_000);

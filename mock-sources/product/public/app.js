const rows = document.getElementById("rows");
const stamp = document.getElementById("stamp");
const count = document.getElementById("count");

async function load() {
  const res = await fetch("/mock/product/usage", { cache: "no-store" });
  const json = await res.json();
  stamp.textContent = `Generated ${new Date(json.generated_at).toLocaleString()}`;
  count.textContent = `${json.data.length} tenants`;
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
}

document.getElementById("refresh").addEventListener("click", load);
load();
setInterval(load, 12_000);

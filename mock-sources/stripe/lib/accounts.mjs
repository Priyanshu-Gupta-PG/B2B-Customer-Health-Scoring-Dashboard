/** Demo catalog shown on each mock website when no account list is posted. */
export const DEMO_ACCOUNTS = [
  { id: "demo-acme", domain: "acmecorp.com", company_name: "Acme Corp" },
  { id: "demo-northwind", domain: "northwindlabs.com", company_name: "Northwind Labs" },
  { id: "demo-globex", domain: "globexsystems.com", company_name: "Globex Systems" },
  { id: "demo-initech", domain: "initechtechnologies.com", company_name: "Initech Technologies" },
  { id: "demo-umbrella", domain: "umbrelladigital.com", company_name: "Umbrella Digital" },
  { id: "demo-stark", domain: "starkindustries.com", company_name: "Stark Industries" },
  { id: "demo-wayne", domain: "wayneenterprises.com", company_name: "Wayne Enterprises" },
  { id: "demo-hooli", domain: "hoolisoftware.com", company_name: "Hooli Software" },
  { id: "demo-piedpiper", domain: "piedpipercloud.com", company_name: "Pied Piper Cloud" },
  { id: "demo-aperture", domain: "aperturesystems.com", company_name: "Aperture Systems" },
  { id: "demo-tyrell", domain: "tyrellrobotics.com", company_name: "Tyrell Robotics" },
  { id: "demo-wonka", domain: "wonkatechnologies.com", company_name: "Wonka Technologies" },
];

export function normalizeAccounts(body) {
  const list = Array.isArray(body?.accounts) ? body.accounts : [];
  const cleaned = list
    .map((a) => ({
      id: String(a.id ?? a.account_id ?? "").trim(),
      domain: String(a.domain ?? "").trim().toLowerCase(),
      company_name: String(a.company_name ?? a.companyName ?? a.domain ?? "Unknown").trim(),
    }))
    .filter((a) => a.id || a.domain);
  return cleaned.length > 0 ? cleaned : DEMO_ACCOUNTS;
}

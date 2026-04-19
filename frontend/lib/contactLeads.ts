const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api`;

export type ContactLeadPayload = {
  name: string;
  email: string;
  phone?: string;
  message: string;
  source: string;
  pagePath?: string;
};

export async function submitContactLead(payload: ContactLeadPayload) {
  const res = await fetch(`${API_BASE_URL}/contact-leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((data as { message?: string }).message || "Failed to submit your message.");
  }

  return data;
}

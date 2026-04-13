import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | FurrCircle",
  description:
    "Learn how FurrCircle collects, uses, stores, and protects personal and pet-related information.",
};

const sections = [
  {
    title: "Information We Collect",
    points: [
      "Account details such as your name, email address, phone number, city, and profile information.",
      "Pet details you choose to add, including health records, vaccination history, medical notes, and images.",
      "Usage information such as pages visited, actions taken in the app, device details, and diagnostic data.",
      "Location-related data when you allow it, so we can help personalize features such as nearby services and city-based discovery.",
    ],
  },
  {
    title: "How We Use Information",
    points: [
      "To provide your FurrCircle account, pet health tracking, reminders, community access, and related services.",
      "To personalize content, improve search and discovery, and connect users with relevant veterinarians or pet services.",
      "To maintain platform safety, prevent abuse, troubleshoot issues, and improve performance.",
      "To send service-related notifications, updates, reminders, and important account messages.",
    ],
  },
  {
    title: "How We Share Information",
    points: [
      "With service providers who help us operate hosting, storage, analytics, notifications, and infrastructure.",
      "With veterinarians, partners, or other users only when required for the feature you use or when you choose to share information.",
      "When required by law, legal process, or to protect rights, safety, and platform integrity.",
      "In connection with a merger, acquisition, or asset transfer, subject to standard privacy protections.",
    ],
  },
  {
    title: "Data Storage and Security",
    points: [
      "We use technical and organizational safeguards to protect personal and pet-related information.",
      "No internet-based service can guarantee absolute security, but we work to reduce risk and protect stored data responsibly.",
      "You are responsible for maintaining the confidentiality of your account credentials.",
    ],
  },
  {
    title: "Your Choices",
    points: [
      "You can update profile and pet information from within your account.",
      "You may disable certain permissions, such as location access, through your device settings.",
      "You can contact us to request access, correction, or deletion of your data, subject to applicable law and legitimate retention needs.",
    ],
  },
  {
    title: "Children's Privacy",
    points: [
      "FurrCircle is not intended for use by children without appropriate supervision or authorization where required by law.",
      "If you believe personal information was submitted improperly, contact us so we can review and take appropriate action.",
    ],
  },
  {
    title: "Policy Updates",
    points: [
      "We may update this Privacy Policy from time to time to reflect changes in our services, legal requirements, or data practices.",
      "When changes are material, we may provide additional notice through the website, app, or email.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="flex-1 bg-white">
      <section className="mx-auto max-w-4xl px-6 py-20 sm:px-8 lg:px-10">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.08em] text-primary">
          Privacy Policy
        </p>
        <h1 className="max-w-3xl text-4xl leading-tight text-[#1A1A1A] sm:text-5xl">
          Your information matters here.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-[#5F5F5F] sm:text-lg">
          This Privacy Policy explains how FurrCircle collects, uses, stores,
          and shares personal information, pet-related information, and service
          usage data when you use our website, mobile apps, and related
          services.
        </p>
        <p className="mt-4 text-sm text-[#7A7A7A]">
          Effective date: April 14, 2026
        </p>
      </section>

      <section className="border-t border-[#EEE8E3] bg-[#FCFAF8]">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:px-8 lg:px-10">
          <div className="space-y-12">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl text-[#1A1A1A] sm:text-3xl">
                  {section.title}
                </h2>
                <ul className="mt-5 space-y-4 text-base leading-8 text-[#5F5F5F]">
                  {section.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section className="mt-14 border-t border-[#EEE1D6] pt-10">
            <h2 className="text-2xl text-[#1A1A1A] sm:text-3xl">Contact Us</h2>
            <p className="mt-5 text-base leading-8 text-[#5F5F5F]">
              If you have questions about this Privacy Policy or how your data
              is handled, contact us at{" "}
              <a
                href="mailto:privacy@furrcircle.com"
                className="text-primary underline underline-offset-4"
              >
                privacy@furrcircle.com
              </a>
              .
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

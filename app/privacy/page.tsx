import { Header, Footer } from "@/components/ui";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy Notice" };
export default function Privacy() {
  const contact = process.env.PRIVACY_CONTACT_EMAIL || "support@griparc.site";
  return (
    <>
      <Header simple />
      <main id="main" className="container legal">
        <span className="eyebrow">LAST UPDATED OCTOBER 14, 2026</span>
        <h1>
          Your journey.
          <br />
          Your information.
        </h1>
        <p>
          GripArc is an upcoming iOS app. This website is a market research and
          early-access experiment for adults 18 and older.
        </p>
        <h2>What this website stores</h2>
        <p>
          Your assessment answers, plan preference, campaign attribution, and a
          random tab identifier are stored in your browser’s session storage.
          They normally disappear when the tab session ends. No account or
          advertising cookie is required.
        </p>
        <p>
          If you join early access, we store your email, goal, experience level,
          confirmed adult status, email consent and its date, marketing variant,
          campaign attribution, optional plan preference, and your assessment
          answers if completed. We do not collect payment details, weight,
          medical history, or date of birth.
        </p>
        <h2>How we use it</h2>
        <p>
          We use registrations to understand demand and communicate about
          launch. Choosing a plan records stated interest only. It does not
          create a subscription. Your data is not sold or used for targeted
          advertising.
        </p>
        <h2>Privacy-conscious measurement</h2>
        <p>
          First-party analytics record funnel steps, a random tab identifier,
          marketing variant, broad goal and experience categories, plan
          preference, and campaign parameters. Email addresses, exact fitness
          answers, and equipment details are excluded. We honor browser Do Not
          Track and Global Privacy Control signals. Basic abuse protection uses
          a keyed, daily-rotating IP digest rather than saving raw IP addresses
          in our database. Hosting providers may maintain their own security
          logs.
        </p>
        <h2>Providers and retention</h2>
        <p>
          The site is designed for Vercel hosting and uses Supabase for data
          storage. Only server-side code can write to the database. Anonymous
          event data is retained for up to 90 days through the configured
          cleanup job. Early-access details are retained during the validation
          and launch period, or until you request removal. If the project does
          not proceed, the list will be deleted.
        </p>
        <h2>Your choices</h2>
        <p>
          Joining requires your explicit permission to receive launch-related
          emails. Every launch email must include a way to unsubscribe or
          request access, correction, or deletion. Reply to any GripArc launch
          email to make a privacy request. There are currently no marketing
          emails sent automatically by this website.
        </p>
        {contact && (
          <p>
            For privacy requests, access, correction, deletion, or withdrawal of
            email consent, contact{" "}
            <a href={`mailto:${contact}`} className="green">
              {contact}
            </a>
            .
          </p>
        )}
        <h2>Adults only</h2>
        <p>
          This experiment is intended for US adults aged 18 and over. Please do
          not submit information if you are under 18.
        </p>
      </main>
      <Footer />
    </>
  );
}

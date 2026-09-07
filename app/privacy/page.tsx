import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

function retentionDays() {
  const configured = Number(process.env.VOTE_RETENTION_DAYS || 90);
  if (!Number.isFinite(configured)) return 90;
  return Math.min(365, Math.max(1, Math.floor(configured)));
}

export default function PrivacyPolicy() {
  const days = retentionDays();
  const contactEmail = process.env.PRIVACY_CONTACT_EMAIL;

  return (
    <main className="min-h-screen bg-background px-3 py-8 text-foreground sm:px-8 sm:py-12">
      <article className="mx-auto max-w-3xl rounded-[24px] border border-white/10 bg-[#111113] p-5 shadow-2xl shadow-black/30 sm:rounded-[30px] sm:p-10">
        <Link
          className="mb-8 inline-flex items-center gap-2 text-sm text-amber-300 hover:text-amber-200"
          href="/campaigns/running-shoes"
        >
          <ArrowLeft size={16} /> Back to campaigns
        </Link>

        <div className="mb-8 flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300">
            <ShieldCheck size={22} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-emerald-300">
              Pickwise
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Privacy policy
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Last updated: 8 September 2026
            </p>
          </div>
        </div>

        <div className="privacy-copy space-y-8 text-sm leading-7 text-zinc-300">
          <section>
            <h2>Who operates this service</h2>
            <p>
              The operator of this Pickwise deployment is responsible for the
              processing described in this policy. Privacy and deletion requests
              can be sent to{' '}
              {contactEmail ? (
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              ) : (
                <strong>
                  the privacy contact published by the site operator
                </strong>
              )}
              .
            </p>
            {!contactEmail && (
              <p className="privacy-warning">
                Deployment notice: configure <code>PRIVACY_CONTACT_EMAIL</code>{' '}
                so visitors receive a working contact address.
              </p>
            )}
          </section>

          <section>
            <h2>Information collected</h2>
            <ul>
              <li>
                Your campaign, selected feature, chosen product, and vote
                timestamps.
              </li>
              <li>
                A random identifier stored in your browser under{' '}
                <code>pickwise_device_id</code>.
              </li>
              <li>
                A browser-generated fingerprint derived from that random
                identifier, browser and platform information, language, screen
                dimensions and colour depth, time zone, processor concurrency,
                and touch capability.
              </li>
              <li>
                Browser user-agent, language, platform, viewport size, and time
                zone sent with a vote.
              </li>
              <li>
                A keyed HMAC-SHA-256 visitor identifier produced by the server
                from the browser fingerprint.
              </li>
            </ul>
            <p>
              The raw browser fingerprint is not stored in the voting database.
              The application does not store raw IP addresses in that database.
              The hosting provider may process IP addresses in ordinary
              infrastructure and security logs under its own retention
              practices.
            </p>
          </section>

          <section>
            <h2>Why the information is used</h2>
            <p>
              Information is processed to prevent duplicate voting, restore a
              device&apos;s saved choices, calculate campaign totals, operate
              and secure the service, diagnose failures, and respond to privacy
              requests. It is not used to make decisions about eligibility,
              employment, credit, insurance, healthcare, or other significant
              matters.
            </p>
          </section>

          <section>
            <h2>Retention</h2>
            <p>
              Voting records, pseudonymous identifiers, browser metadata, and
              device details are automatically deleted after{' '}
              <strong>{days} days</strong>. The browser identifier remains on
              your device until you clear this site&apos;s local storage.
              Aggregated statistics may change when expired records are removed.
            </p>
          </section>

          <section>
            <h2>Who receives information</h2>
            <p>
              Information may be accessed by the site operator and authorised
              technical administrators. It is processed by Hostinger and the
              configured MySQL hosting service to provide hosting, database,
              backup, security, and diagnostic services. Information is not
              sold. It may be disclosed when required by applicable law or to
              investigate abuse or security incidents.
            </p>
          </section>

          <section>
            <h2>Security</h2>
            <p>
              The service uses a server-side secret to create keyed HMAC
              identifiers, limits stored device fields and their length,
              separates the HMAC secret from the database, applies automatic
              deletion, and restricts database access through deployment
              credentials. Internet transmission and hosting still carry risk,
              so no system can guarantee absolute security.
            </p>
          </section>

          <section>
            <h2>Your choices and deletion requests</h2>
            <p>
              You may view results without casting a vote. You can clear the
              browser identifier through your browser&apos;s site-data controls.
              To request access to or deletion of voting data, contact{' '}
              {contactEmail ? (
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              ) : (
                'the site operator'
              )}{' '}
              and include the approximate voting date, campaign, and features
              selected. The operator may request reasonable verification before
              acting and will respond according to applicable law. Records also
              expire automatically after {days} days.
            </p>
          </section>

          <section>
            <h2>Independent comparison notice</h2>
            <p>
              Pickwise is an independent community preference poll and is not
              affiliated with, sponsored by, or endorsed by adidas, Nike,
              Hyundai, or Honda. Results reflect user votes, not objective
              product testing. All trademarks belong to their respective owners.
            </p>
          </section>

          <section>
            <h2>Changes to this policy</h2>
            <p>
              This policy may be updated when the service, providers, retention
              settings, or legal requirements change. The revised date will be
              shown at the top of this page.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}

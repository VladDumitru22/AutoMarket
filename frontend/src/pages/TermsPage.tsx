import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/25 flex-shrink-0">
          <FileText size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Terms and Conditions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Last updated: May 2025 · AutoMarket SRL</p>
        </div>
      </div>

      <div className="space-y-4">

        <Section title="1. About AutoMarket">
          <p>
            AutoMarket is an online marketplace platform operated by <strong className="text-slate-800 dark:text-slate-200">AutoMarket SRL</strong>, a company registered
            in Romania, that facilitates the buying and selling of motor vehicles between private individuals and dealers.
            AutoMarket acts solely as an intermediary and is not a party to any transaction between buyers and sellers.
          </p>
          <p>
            These Terms and Conditions ("Terms") govern your access to and use of the AutoMarket platform, including
            the website, mobile applications, and any related services (collectively, the "Platform"). By registering
            an account or using the Platform, you agree to be bound by these Terms.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <ul>
            <li>You must be at least 18 years of age to use the Platform.</li>
            <li>You must have the legal capacity to enter into binding contracts under Romanian law.</li>
            <li>You may not create more than one account per person or entity.</li>
            <li>Accounts created with false or misleading information may be suspended without notice.</li>
          </ul>
        </Section>

        <Section title="3. Listing Rules">
          <p>By posting a listing on AutoMarket, you confirm and warrant that:</p>
          <ul>
            <li>You are the legal owner of the vehicle or are duly authorised to sell it.</li>
            <li>All information provided (price, mileage, year of manufacture, technical specifications) is accurate and complete.</li>
            <li>The vehicle is not subject to any undisclosed legal encumbrances, outstanding financing, or court orders.</li>
            <li>Photographs accurately represent the actual condition of the vehicle at the time of listing.</li>
            <li>The asking price is expressed in Euro (€) and is the true price you are willing to accept.</li>
          </ul>
          <p>
            AutoMarket reserves the right to remove any listing that violates these rules or applicable Romanian law,
            including but not limited to Law no. 363/2007 on unfair commercial practices.
          </p>
        </Section>

        <Section title="4. Offers and Transactions">
          <p>
            Placing an offer through the Platform constitutes a binding offer to purchase the vehicle at the stated price,
            subject to the seller's acceptance. Neither the Platform nor any automated notification constitutes acceptance
            of an offer on behalf of the seller.
          </p>
          <p>
            AutoMarket does not process payments, hold funds in escrow, or guarantee the completion of any transaction.
            Buyers and sellers are solely responsible for conducting appropriate due diligence (e.g. vehicle history checks,
            ITP inspection validity, RAR documentation) before concluding a sale.
          </p>
          <p>
            The transfer of legal ownership of a motor vehicle in Romania must comply with the procedures established
            by Ordinance no. 195/2002 on road traffic and the applicable DRPCIV regulations.
          </p>
        </Section>

        <Section title="5. User Conduct">
          <p>You agree not to:</p>
          <ul>
            <li>Post false, misleading, or fraudulent listings or messages.</li>
            <li>Harass, threaten, or abuse other users.</li>
            <li>Use the Platform for any unlawful purpose, including money laundering or fraud.</li>
            <li>Circumvent, disable, or interfere with security features of the Platform.</li>
            <li>Collect user data without consent.</li>
            <li>Post listings for vehicles that are stolen, written off, or whose identity has been altered.</li>
          </ul>
          <p>
            Violations may result in the immediate suspension of your account and, where required by law, may be
            reported to the competent Romanian authorities (ANPC, DIICOT, or the Police).
          </p>
        </Section>

        <Section title="6. Intellectual Property">
          <p>
            All content on the Platform that is not user-generated (including but not limited to the AutoMarket logo,
            interface design, software, and text) is the exclusive property of AutoMarket SRL and is protected under
            Romanian Law no. 8/1996 on copyright and related rights.
          </p>
          <p>
            By uploading photographs or other content, you grant AutoMarket a non-exclusive, royalty-free, worldwide
            licence to display that content on the Platform for the duration of your listing.
          </p>
        </Section>

        <Section title="7. Privacy and Data Protection">
          <p>
            AutoMarket processes personal data in accordance with Regulation (EU) 2016/679 (GDPR) and Law no. 190/2018
            on measures to implement the GDPR in Romania.
          </p>
          <p>The personal data we collect includes:</p>
          <ul>
            <li><strong className="text-slate-800 dark:text-slate-200">Account data</strong>: name, email address.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Usage data</strong>: listings posted, messages sent, offers placed.</li>
          </ul>
          <p>Your data is used to:</p>
          <ul>
            <li>Provide and improve the Platform's services.</li>
            <li>Facilitate communication between buyers and sellers.</li>
            <li>Comply with legal obligations.</li>
          </ul>
          <p>
            You have the right to access, rectify, erase, restrict processing of, and port your personal data at any time
            by contacting us at <strong className="text-slate-800 dark:text-slate-200">privacy@automarket.ro</strong>. You also have the right to lodge a complaint with
            the <strong className="text-slate-800 dark:text-slate-200">Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)</strong>{' '}
            at <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 hover:underline transition-colors">www.dataprotection.ro</a>.
          </p>
          <p>
            We do not sell your personal data to third parties. Data may be shared with Cloudinary (image hosting) and
            Microsoft Azure (database infrastructure) solely for service delivery purposes, under GDPR-compliant data
            processing agreements.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            To the maximum extent permitted by Romanian law, AutoMarket SRL shall not be liable for:
          </p>
          <ul>
            <li>The accuracy, completeness, or legality of any listing posted by users.</li>
            <li>Any loss arising from transactions conducted through or facilitated by the Platform.</li>
            <li>Interruptions or errors in Platform availability.</li>
            <li>Any indirect, incidental, or consequential damages.</li>
          </ul>
          <p>
            AutoMarket's liability is excluded to the extent permitted by Law no. 365/2002 on e-commerce and other
            applicable Romanian and EU legislation.
          </p>
        </Section>

        <Section title="9. Dispute Resolution and Governing Law">
          <p>
            These Terms are governed by and construed in accordance with Romanian law. Any dispute arising from or in
            connection with these Terms shall first be subject to good-faith negotiation between the parties.
          </p>
          <p>
            Unresolved disputes may be submitted to the <strong className="text-slate-800 dark:text-slate-200">Autoritatea Națională pentru Protecția Consumatorilor (ANPC)</strong>{' '}
            or to the competent Romanian courts. Consumers may also use the EU Online Dispute Resolution platform at{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 hover:underline transition-colors">
              ec.europa.eu/consumers/odr
            </a>.
          </p>
        </Section>

        <Section title="10. Amendments">
          <p>
            AutoMarket reserves the right to modify these Terms at any time. Users will be notified of material changes
            via email or a prominent notice on the Platform. Continued use of the Platform after notification constitutes
            acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>For any questions regarding these Terms, please contact us:</p>
          <ul>
            <li><strong className="text-slate-800 dark:text-slate-200">Email:</strong> legal@automarket.ro</li>
            <li>
              <strong className="text-slate-800 dark:text-slate-200">Consumer complaints (ANPC):</strong>{' '}
              <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 hover:underline transition-colors">anpc.ro</a>
            </li>
          </ul>
        </Section>

      </div>

      <div className="mt-10 pt-6 border-t border-slate-200 dark:border-white/[0.06] text-center">
        <Link to="/" className="text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 hover:underline transition-colors">
          ← Back to listings
        </Link>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20 p-6">
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
        {title}
      </h2>
      <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  )
}

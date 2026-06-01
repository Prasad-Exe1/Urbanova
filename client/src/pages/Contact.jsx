import { Mail, MapPin, Phone } from 'lucide-react';

function Contact() {
  return (
    <main className="max-w-max-width mx-auto px-margin py-xl pb-24">
      <div className="text-center mb-xl">
        <p className="font-label-sm text-primary uppercase tracking-widest mb-md">Contact</p>
        <h1 className="font-display-xl text-display-xl text-on-background mb-sm m-0">Get in touch</h1>
        <p className="font-body-lg text-on-surface-variant max-w-xl mx-auto m-0">
          Questions about listings, partnerships, or the Hyderabad catalogue — we&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter max-w-4xl mx-auto">
        <div className="glass-panel rounded-stitch border border-outline-variant/35 p-lg flex flex-col items-center text-center gap-sm shadow-stitch-sm">
          <span className="material-symbols-outlined text-primary text-[28px]">mail</span>
          <p className="font-label-sm text-on-surface-variant m-0 uppercase tracking-wide">Email</p>
          <a href="mailto:support@urbanova.com" className="font-body-md text-on-background hover:text-primary transition-colors">
            support@urbanova.com
          </a>
        </div>
        <div className="glass-panel rounded-stitch border border-outline-variant/35 p-lg flex flex-col items-center text-center gap-sm shadow-stitch-sm">
          <Phone size={26} className="text-primary" />
          <p className="font-label-sm text-on-surface-variant m-0 uppercase tracking-wide">Phone</p>
          <a href="tel:+914012345678" className="font-body-md text-on-background hover:text-primary transition-colors">
            +91 40 1234 5678
          </a>
        </div>
        <div className="glass-panel rounded-stitch border border-outline-variant/35 p-lg flex flex-col items-center text-center gap-sm shadow-stitch-sm">
          <MapPin size={26} className="text-primary" />
          <p className="font-label-sm text-on-surface-variant m-0 uppercase tracking-wide">Office</p>
          <p className="font-body-md text-on-background m-0 leading-snug">
            Financial District,
            <br />
            Gachibowli, Hyderabad
          </p>
        </div>
      </div>
    </main>
  );
}

export default Contact;

interface FAQ {
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  {
    q: 'Τι είναι το τεκμήριο διαβίωσης;',
    a: 'Το τεκμήριο (Art.31) είναι ένα ελάχιστο εκτιμώμενο εισόδημα που υπολογίζεται βάσει τρόπου ζωής (κατοικία, αυτοκίνητα, κλπ.). Αν υπερβαίνει το δηλωθέν εισόδημα, η διαφορά προστίθεται στη φορολογητέα βάση.',
  },
  {
    q: 'Πότε εφαρμόζεται ο Art.28A;',
    a: 'Ο Art.28A καθορίζει ελάχιστο φορολογητέο εισόδημα για ελεύθερους επαγγελματίες. Υπολογίζεται βάσει α+β+γ φόρμουλας (μισθολόγιο, κύκλος εργασιών, KAD μέσος όρος). Εξαιρούνται αγρότες, νεοεισερχόμενοι (3 έτη), κλπ.',
  },
  {
    q: 'Τι είναι η έκπτωση Art.16;',
    a: 'Μείωση φόρου για χαμηλά εισοδήματα. Πλήρης μείωση έως €10.000 εισόδημα, μερική phaseout έως ~€20.000. Το ποσό εξαρτάται από εξαρτώμενα τέκνα.',
  },
  {
    q: 'Ποιο είναι το όριο ηλεκτρονικών πληρωμών;',
    a: 'Το 25% του πραγματικού εισοδήματος πρέπει να δαπανηθεί ηλεκτρονικά (κάρτες, e-banking). Αν δεν φτάσετε το όριο, επιβάλλεται πρόσθετος φόρος 20% επί της διαφοράς.',
  },
  {
    q: 'Πότε είναι υποχρεωτική η κοινή δήλωση;',
    a: 'Από το N.5162/2024 (ΦΕΚ 2024), η κοινή δήλωση συζύγων είναι υποχρεωτική για φορολογικό έτος 2024+.',
  },
];

export function QuestionTab() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Συχνές Ερωτήσεις</p>
      {FAQS.map((faq) => (
        <details key={faq.q} className="group rounded-lg border border-gray-200">
          <summary className="flex cursor-pointer items-center justify-between p-3 text-sm font-medium text-gray-800 list-none">
            {faq.q}
            <span className="ml-2 text-gray-400 group-open:rotate-180 transition-transform">▾</span>
          </summary>
          <p className="px-3 pb-3 text-xs text-gray-600 leading-relaxed">{faq.a}</p>
        </details>
      ))}
    </div>
  );
}

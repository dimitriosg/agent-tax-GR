import { useSettlement } from '../../hooks/use-settlement';

interface SavingsTip {
  title: string;
  description: string;
  estimatedSaving: number;
  condition: boolean;
}

export function SavingsTab() {
  const { result } = useSettlement();

  if (!result) {
    return (
      <div className="p-4 text-sm text-gray-400 text-center py-10">
        Συμπληρώστε τα εισοδήματά σας για εκτίμηση εξοικονόμησης.
      </div>
    );
  }

  const tips: SavingsTip[] = [
    {
      title: 'Αύξηση ηλεκτρονικών πληρωμών',
      description:
        'Αν φτάσετε το 25% του εισοδήματός σας σε ηλεκτρονικές συναλλαγές, αποφεύγετε το πρόσθετο τέλος.',
      estimatedSaving: result.electronicPaymentSurcharge,
      condition: result.electronicPaymentSurcharge > 0,
    },
    {
      title: 'Έκπτωση Art.16 βελτιστοποίηση',
      description: 'Η μείωση φόρου Art.16 εφαρμόζεται αυτόματα στο φορολογητέο εισόδημα.',
      estimatedSaving: result.art16Reduction,
      condition: result.art16Reduction > 0,
    },
    {
      title: 'Τεκμήρια — υπέρβαση',
      description:
        'Τεκμαρτό εισόδημα ακινήτων/αυτοκινήτων υπερβαίνει το δηλωθέν. Εξετάστε αιτιολόγηση.',
      estimatedSaving: result.tekmiriaExcess,
      condition: result.tekmiriaExcess > 0,
    },
  ].filter((t) => t.condition);

  if (tips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-gray-400">
        <span className="text-3xl">★</span>
        <p className="text-sm">Δεν εντοπίστηκαν εύκολες εξοικονομήσεις.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {tips.map((tip, i) => (
        <div key={i} className="rounded-lg bg-green-50 border border-green-200 p-3 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-green-800">{tip.title}</p>
            <span className="text-xs font-bold text-green-700 tabular-nums">
              {tip.estimatedSaving.toLocaleString('el-GR')} €
            </span>
          </div>
          <p className="text-xs text-green-700">{tip.description}</p>
        </div>
      ))}
    </div>
  );
}

import { useDeclarationStore } from '../store/declaration-store';
import { WorkProfileScreen } from './onboarding/work-profile';
import { IncomeInputScreen } from './onboarding/income-input';
import { FamilyAssetsScreen } from './onboarding/family-assets';
import { DashboardLayout } from './dashboard/dashboard-layout';

export function SidebarShell() {
  const step = useDeclarationStore((s) => s.onboarding.step);

  return (
    <div className="w-[380px] min-h-screen bg-white flex flex-col font-sans antialiased">
      {step === 'work-profile' && <WorkProfileScreen />}
      {step === 'income-input' && <IncomeInputScreen />}
      {step === 'family-assets' && <FamilyAssetsScreen />}
      {step === 'done' && <DashboardLayout />}
    </div>
  );
}

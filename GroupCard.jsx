import { PayoutConfiguration } from "@/components/Admin/GroupsTab/PayoutConfiguration";

export function PayoutSection({
  payoutMode,
  payoutRules,
  maxParticipants,
  onPayoutChange,
  onValidationChange,
}) {
  return (
    <div className="bg-white dark:bg-[#262626] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-6">
      <h2 className="text-xl font-bold text-black dark:text-white font-sora mb-4">
        Payout Structure
      </h2>

      <PayoutConfiguration
        payoutMode={payoutMode}
        payoutRules={payoutRules}
        maxParticipants={maxParticipants}
        onPayoutChange={onPayoutChange}
        onValidationChange={onValidationChange}
      />
    </div>
  );
}

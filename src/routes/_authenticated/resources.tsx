import { createFileRoute } from '@tanstack/react-router';
import { TopBar } from '@/components/app/TopBar';

export const Route = createFileRoute('/_authenticated/resources')({
  component: Resources,
});

function Resources() {
  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]">
      <TopBar title="My Resources" subtitle="View saved files and notes." back="/home" />
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <div className="grid h-16 w-16 place-items-center mx-auto rounded-2xl bg-[#6366f1]/10 text-[#6366f1] mb-4">
            <span className="text-2xl font-bold">📚</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Resources Hub</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-[250px] mx-auto">
            All your uploaded PDFs, Notes, and Shared resources in one place.
          </p>
        </div>
      </div>
    </div>
  );
}

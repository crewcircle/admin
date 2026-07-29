export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg px-4 py-3 mb-4">
      <p className="text-sm text-[#ef4444]">
        <span className="font-medium">Error:</span> {message}
      </p>
    </div>
  );
}

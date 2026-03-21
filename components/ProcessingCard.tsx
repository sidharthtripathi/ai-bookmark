export function ProcessingCard({ bookmark }: { bookmark?: any }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-20 h-20 bg-gray-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
          <div className="flex gap-1 mt-1">
            <div className="h-5 bg-gray-200 rounded w-12" />
            <div className="h-5 bg-gray-200 rounded w-16" />
          </div>
        </div>
      </div>
      {bookmark?.status === 'processing' && (
        <p className="text-xs text-gray-400 mt-2">Processing with AI...</p>
      )}
    </div>
  );
}

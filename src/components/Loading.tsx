export const Loading = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-black">
      <div className="flex items-center gap-3 text-white/80">
        <div className="h-4 w-4 animate-spin rounded-full border border-white/30 border-t-white" />
        <span className="text-sm tracking-wide">Loading articles</span>
      </div>
    </div>
  );
};

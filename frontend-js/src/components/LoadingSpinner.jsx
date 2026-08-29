export default function LoadingSpinner({ fullPage = false }) {
  return (
    <div className={fullPage ? 'min-h-screen flex items-center justify-center' : 'flex justify-center py-12'}>
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent" />
    </div>
  );
}

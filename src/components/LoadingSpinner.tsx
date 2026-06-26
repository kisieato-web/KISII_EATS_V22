export default function LoadingSpinner({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="border-4 border-orange-100 border-t-primary-500 rounded-full animate-spin"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

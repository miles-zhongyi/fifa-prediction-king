type ErrorAlertProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <div
      className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
      role="alert"
    >
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 font-medium underline underline-offset-2 hover:text-red-200"
        >
          Try again
        </button>
      )}
    </div>
  );
}

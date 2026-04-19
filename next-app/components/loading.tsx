export function Loading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div
          className="mb-3 mx-auto h-8 w-8 animate-spin rounded-full border-2"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }}
        />
        <p className="text-sm" style={{ color: "var(--muted)" }}>{message}</p>
      </div>
    </div>
  );
}

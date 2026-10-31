/** The Harbor mark, verbatim from SPEC Appendix A. Rendered at 30, 32 and 56. */
export function Logo({ size = 32, title }: { size?: number; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ flexShrink: 0, display: 'block' }}
    >
      <rect width="64" height="64" rx="18" fill="#2F5BD3" />
      <path
        d="M20 10h24a7 7 0 0 1 7 7v9a7 7 0 0 1-7 7H35l-3 5-3-5H20a7 7 0 0 1-7-7v-9a7 7 0 0 1 7-7z"
        fill="#FFFFFF"
      />
      <circle cx="25.5" cy="21.5" r="2.4" fill="#2F5BD3" />
      <circle cx="32" cy="21.5" r="2.4" fill="#2F5BD3" />
      <circle cx="38.5" cy="21.5" r="2.4" fill="#2F5BD3" />
      <path d="M32 37v17" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
      <path
        d="M15 42c0 8 7.5 13 17 13s17-5 17-13"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M15 42l-4 3.5M15 42l5 3M49 42l4 3.5M49 42l-5 3"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

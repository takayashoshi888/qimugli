const AVATAR_PALETTES: Array<[string, string]> = [
  ['#2563eb', '#60a5fa'],
  ['#7c3aed', '#c084fc'],
  ['#059669', '#34d399'],
  ['#ea580c', '#fb923c'],
  ['#e11d48', '#fb7185'],
  ['#0891b2', '#22d3ee'],
];

const escapeXml = (value: string) => value.replace(/[<>&"']/g, (char) => ({
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '"': '&quot;',
  "'": '&#39;'
}[char] || char));

const hashString = (value: string): number => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

const getInitials = (name?: string): string => {
  const normalized = (name || '用户').trim();

  if (!normalized) {
    return '用户';
  }

  const parts = normalized.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return normalized.slice(0, 2).toUpperCase();
  }

  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
};

export const generateAvatarUrl = (seed: string, name?: string): string => {
  const normalizedSeed = seed || name || 'qimugli-user';
  const hash = hashString(normalizedSeed);
  const [primaryColor, secondaryColor] = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
  const initials = escapeXml(getInitials(name));
  const accentOffset = 12 + (hash % 20);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="${initials}">
      <defs>
        <linearGradient id="avatar-gradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${primaryColor}" />
          <stop offset="100%" stop-color="${secondaryColor}" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="28" fill="url(#avatar-gradient)" />
      <circle cx="95" cy="25" r="${accentOffset}" fill="rgba(255,255,255,0.18)" />
      <circle cx="25" cy="100" r="${Math.max(18, accentOffset - 6)}" fill="rgba(255,255,255,0.12)" />
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="34" font-family="Arial, 'Microsoft YaHei', sans-serif" font-weight="700" letter-spacing="1">
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const resolveAvatar = (avatar: string | null | undefined, seed: string, name?: string): string => {
  const normalizedAvatar = typeof avatar === 'string' ? avatar.trim() : '';
  return normalizedAvatar || generateAvatarUrl(seed, name);
};

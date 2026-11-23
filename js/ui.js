const paths = {
  grid: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/>',
  ticket:
    '<path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4z"/><path d="M15 7v2m0 3v2m0 3v0"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.7 8a2.5 2.5 0 1 1 3 3.7c-.7.4-.7 1.1-.7 2.3m0 3h0"/>',
  settings:
    '<circle cx="12" cy="12" r="3.5"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
  search: '<circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M10 20h4"/><circle cx="19" cy="3" r="2" fill="currentColor" stroke="none"/>',
  location:
    '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0z"/><circle cx="12" cy="10" r="2.5"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  filter: '<path d="M3 6h18M6 12h12M9 18h6"/>',
  users:
    '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 5a5 5 0 0 1 3 5"/>',
  shield:
    '<path d="M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7z"/><path d="m8 12 3 3 5-6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  logout: '<path d="M9 4H3v16h6m5-12 4 4-4 4m-7-4h14"/>',
};
const figmaAssets = {
  grid: ["12b0c.svg", 20],
  ticket: ["bbef8.svg", 20],
  heart: ["31764.svg", 20],
  calendar: ["52c20.svg", 20],
  help: ["ae7b9.svg", 20],
  settings: ["98517.svg", 20],
  search: ["db137.svg", 20],
  bell: ["16298.svg", 20],
  plus: ["8f002.svg", 20],
  location: ["c5990.svg", 15],
  "calendar-small": ["8cd04.svg", 15],
  "filter-small": ["96e02.svg", 15],
  "heart-sage": ["c7049.svg", 15],
  "heart-peach": ["f4b2d.svg", 15],
  "heart-blue": ["e8c20.svg", 15],
  "calendar-active": ["ba683.svg", 20],
};
export const icon = (name) => {
  const asset = figmaAssets[name];
  return asset
    ? `<img class="icon figma-icon" src="assets/figma/${asset[0]}" alt="" width="${asset[1]}" height="${asset[1]}" aria-hidden="true">`
    : `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.grid}</svg>`;
};
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

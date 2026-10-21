import { SPORTS, type Sport } from "./types";

export const sportColor = (s: Sport) => `var(--${SPORTS[s].group})`;

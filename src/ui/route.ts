/**
 * Puts the chosen preset in the URL without a navigation, so the address bar can be copied
 * as a link to exactly this view (replaceState does not fire hashchange, so nothing remounts).
 */
export function rememberPreset(mode: "gate" | "anneal", id: string): void {
  history.replaceState(null, "", `#${mode}/${id}`);
}

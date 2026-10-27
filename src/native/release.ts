// The release users and operators install, and where help lives. One place to change for the next release.
export const SOURCE = 'https://github.com/neuroshard-ai/neuroshard';
export const RELEASE = 'pilot-2';
export const DOCS = `${SOURCE}/blob/${RELEASE}/docs`;
// The installer is fetched from the release tag, not from main, so what runs is exactly the reviewed release.
export const INSTALLER = `https://raw.githubusercontent.com/neuroshard-ai/neuroshard/${RELEASE}/scripts/join.sh`;
export const INSTALLER_SHA256 = 'adf7b983d2c6b21ddfb2d9ed39d2234d0c3e5103e59777e508907d7d81bbd37c';
export const join = (role: string) => `curl -LsSf ${INSTALLER} | bash -s -- ${role}${role === 'check' ? '' : ` --branch ${RELEASE}`}`;
export const CHAT = '~/.venvs/neuroshard/bin/neuroshard assistant chat';
export const EMAIL = 'info@neuroshard.com';
// Community chat (Discord). Must be a never-expiring invite; empty hides it.
export const COMMUNITY_URL = 'https://discord.gg/zJ85Ffhkqa';

/** A GitHub issue from the project's "Joining didn't work" form, with what we know already filled in. */
export function helpIssue(command = '', what = '') {
  const params = new URLSearchParams({ template: 'join_problem.yml', title: 'Join problem: ', command, log: what });
  return `${SOURCE}/issues/new?${params}`;
}

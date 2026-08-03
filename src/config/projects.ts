/**
 * The projects that live on this site.
 *
 * The chrome is shared across all of them, so the parts of it that differ per
 * project are stated here rather than hard-coded into the header and the
 * footer. A page says which project it is; the chrome resolves its own links.
 *
 * `maas` is the default because neutree.ai's own pages are the MaaS platform's.
 * When Neutree becomes the org-level description and the products sit parallel
 * under it, that default is the one thing that has to change.
 */

export interface Project {
  /** the name the footer signs the site with */
  name: string
  /** the short form the header shows beside the company mark, if it has one */
  short?: string
  /** what the footer says this project is */
  tagline: string
  /** where "Docs" goes; a project without a docs site simply has no Docs link */
  docs?: string
  /** the repository "GitHub" and "Issues" belong to */
  repo: string
}

export const PROJECTS = {
  maas: {
    name: 'Neutree',
    tagline: 'Enterprise-grade Private Model-as-a-Service Platform',
    docs: 'https://docs.neutree.ai',
    repo: 'https://github.com/neutree-ai/neutree',
  },
  nap: {
    name: 'Neutree Agent Platform',
    short: 'NAP',
    tagline:
      'The open-source agent platform to build, distribute, and optimize AI agents, on infrastructure you own.',
    docs: 'https://nap.neutree.ai/docs/',
    repo: 'https://github.com/neutree-ai/agent-platform',
  },
  'openapi-to-skills': {
    name: 'openapi-to-skills',
    tagline:
      'Convert OpenAPI specs into focused, executable skill units for AI agents.',
    repo: 'https://github.com/neutree-ai/openapi-to-skills',
  },
} satisfies Record<string, Project>

/** every project shares the org's discussion board */
export const ORG_DISCUSSIONS = 'https://github.com/orgs/neutree-ai/discussions'

export type ProjectKey = keyof typeof PROJECTS

export function resolveProject(key: ProjectKey = 'maas'): Project {
  return PROJECTS[key]
}

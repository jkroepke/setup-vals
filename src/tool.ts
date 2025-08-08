import { clean } from 'semver'
import { extractTar } from '@actions/tool-cache'

export const toolName = 'vals'
export const githubRepository = 'helmfile/vals'

// renovate: github=helmfile/vals
export const defaultVersion = 'v0.42.0'

export function binaryName(version: string, os: string, arch: string): string {
  version = clean(version) || version

  return `${toolName}_${version}_${os}_${arch}.tar.gz`
}

export async function extractBinary(
  path: string,
  version: string,
  os: string,
  _arch: string
): Promise<string> {
  const extractedFolder = await extractTar(path)

  return `${extractedFolder}/${toolName}${os === 'windows' ? '.exe' : ''}`
}

export function getVersionArguments(): string[] {
  return ['version']
}

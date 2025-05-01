// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as core from '@actions/core'
import { HttpClient } from '@actions/http-client'
import {
  binaryName,
  githubRepository,
  toolName,
  defaultVersion,
  extractBinary
} from './tool.js'
import * as toolCache from '@actions/tool-cache'
import * as util from 'util'
import fs from 'fs'

/**
 * Get the executable extension based on the OS.
 *
 * @returns The executable extension for the current OS.
 */
function getExecutableExtension(): string {
  return getRunnerOS() === 'windows' ? '.exe' : ''
}

/**
 * Get the architecture of the runner.
 *
 * @returns The architecture of the runner.
 */
function getRunnerArch(): string {
  const runnerArch = process.env['RUNNER_ARCH']! as string
  if (runnerArch.startsWith('X')) {
    return 'amd64'
  }

  return runnerArch
}

/**
 * Get the OS of the runner.
 *
 * @returns The OS of the runner.
 */
function getRunnerOS(): string {
  const runnerOs = process.env['RUNNER_OS']! as string
  if (runnerOs.startsWith('Win')) {
    return 'windows'
  } else if (runnerOs.startsWith('Linux')) {
    return 'linux'
  } else if (runnerOs.startsWith('macOS')) {
    return 'darwin'
  }

  throw new Error(
    `Unsupported OS found. OS: ${runnerOs} Arch: ${getRunnerArch()}`
  )
}

/**
 * Get the latest version of the tool from GitHub releases.
 *
 * @param githubRepo The GitHub repository in the format 'owner/repo'.
 * @param toolName The name of the tool.
 * @param stableVersion The stable version to fall back to if the latest version cannot be retrieved.
 * @returns The latest version of the tool.
 */
async function latestVersion(
  githubRepo: string,
  toolName: string,
  stableVersion: string
): Promise<string> {
  try {
    const httpClient = new HttpClient()
    const res = await httpClient.getJson<{ tag_name: string }>(
      `https://github.com/${githubRepo}/releases/latest`
    )

    if (res.statusCode !== 200 || !res.result || !res.result.tag_name) {
      core.warning(
        `Cannot get the latest ${toolName} info from https://github.com/${githubRepo}/releases/latest. Invalid response: ${JSON.stringify(res)}. Using default version ${stableVersion}.`
      )

      return stableVersion
    }

    return res.result.tag_name.trim()
  } catch (e) {
    core.warning(
      `Cannot get the latest ${toolName} info from https://github.com/${githubRepo}/releases/latest. Error ${e}. Using default version ${stableVersion}.`
    )
  }

  return stableVersion
}

/**
 * Download the tool from GitHub releases.
 *
 * @param version The version of the tool to download.
 * @returns The path to the downloaded tool.
 */
async function download(version: string): Promise<string> {
  if (!version) {
    version = await latestVersion(githubRepository, toolName, defaultVersion)
  }

  const runnerOs = getRunnerOS()
  const runnerArch = getRunnerArch()
  const binaryFileName = toolName + getExecutableExtension()
  const url = util.format(
    'https://github.com/%s/releases/download/%s/%s',
    githubRepository,
    version,
    binaryName(version, runnerOs, runnerArch)
  )

  let cachedToolPath = toolCache.find(toolName, version)
  if (!cachedToolPath) {
    let downloadPath
    try {
      downloadPath = await toolCache.downloadTool(url)
    } catch (exception) {
      throw new Error(
        util.format(
          'Failed to download %s from location %s. Error: %s',
          toolName,
          url,
          exception
        )
      )
    }

    const extractedPath = await extractBinary(
      downloadPath,
      version,
      runnerOs,
      runnerArch
    )

    await fs.promises.chmod(extractedPath, 0o777)
    await toolCache.cacheFile(extractedPath, binaryFileName, toolName, version)

    cachedToolPath = toolCache.find(toolName, version)
    if (!cachedToolPath) {
      throw new Error(
        util.format(
          '%s executable not found in path %s',
          binaryFileName,
          cachedToolPath
        )
      )
    }
  }

  return cachedToolPath
}

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    let version = core.getInput('version', { required: true })
    if (version.toLocaleLowerCase() === 'latest') {
      version = await latestVersion(githubRepository, toolName, defaultVersion)
    } else if (!version.toLocaleLowerCase().startsWith('v')) {
      version = 'v' + version
    }

    const cachedPath = await download(version)

    core.addPath(cachedPath)
    core.info(
      `${toolName} version: '${version}' has been cached at ${cachedPath}`
    )
    core.setOutput('path', cachedPath)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

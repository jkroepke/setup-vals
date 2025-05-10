/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */

import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'

import { toolName, defaultVersion } from '../src/tool.js'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

describe('main.ts', () => {
  const OLD_ENV = process.env

  beforeEach(async () => {
    // Set the action's inputs as return values from core.getInput().
    core.getInput.mockImplementation(() => defaultVersion.replaceAll('v', ''))
    process.env = { ...OLD_ENV } // Make a copy

    switch (os.type()) {
      case 'Linux':
        process.env.RUNNER_OS = 'Linux'
        break
      case 'Darwin':
        process.env.RUNNER_OS = 'macOS'
        break
      case 'Windows_NT':
        process.env.RUNNER_OS = 'Windows'
        break
      default:
        throw new Error(`Unsupported OS: ${os.type()}`)
    }

    process.env.RUNNER_ARCH = 'X86_64'

    process.env.RUNNER_TEMP = await fs.mkdtemp(
      path.join(os.tmpdir(), `${toolName}-runner-temp-`)
    )

    process.env.RUNNER_TOOL_CACHE = await fs.mkdtemp(
      path.join(os.tmpdir(), `${toolName}-tool-cache-`)
    )
  })

  afterEach(async () => {
    if (process.env.RUNNER_TOOL_CACHE) {
      await fs.rm(process.env.RUNNER_TOOL_CACHE, {
        recursive: true,
        force: true
      })
    }

    if (process.env.RUNNER_TEMP) {
      await fs.rm(process.env.RUNNER_TEMP, {
        recursive: true,
        force: true
      })
    }

    jest.resetAllMocks()
    process.env = OLD_ENV // Restore old environment
  })

  it('Run main', async () => {
    await run()

    // Verify that no errors were thrown.
    expect(core.setFailed).not.toHaveBeenCalled()

    // Verify the time output was set.
    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      'path',
      expect.stringMatching(
        new RegExp(`${toolName}[/\\\\]${defaultVersion.replaceAll('v', '')}`)
      )
    )
  })
})

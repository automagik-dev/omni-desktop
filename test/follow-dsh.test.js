import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { pinRuntime } from '../scripts/follow-dsh.mjs'

const runtime = { name: 'omni-desktop-runtime', private: true, dependencies: { '@deepseek-ai/dsh': '0.2.1-rc.2', pnpm: '10.34.6' } }

test('the runtime moves to the dsh the carried Omni tests on, and keeps the rest', () => {
  const next = pinRuntime(runtime, '0.2.1-rc.3')
  assert.equal(next.dependencies['@deepseek-ai/dsh'], '0.2.1-rc.3')
  assert.equal(next.dependencies.pnpm, '10.34.6')
  assert.equal(next.name, 'omni-desktop-runtime')
  assert.equal(runtime.dependencies['@deepseek-ai/dsh'], '0.2.1-rc.2', 'the input is not mutated')
})

test('a runtime already on that dsh is left alone', () => {
  assert.equal(pinRuntime(runtime, '0.2.1-rc.2'), null)
})

test('anything but an exact version is refused', () => {
  for (const bad of ['', undefined, 'latest', '^0.2.1', '0.2.1-rc.3; rm -rf /', '>=0.2.1']) {
    assert.throws(() => pinRuntime(runtime, bad), /not a dsh version/)
  }
})

// The repository's last release is the Automagik desktop app itself (bridge.yml): it builds
// automagik-dev/automagik at a release tag, a build that follows that repository's releases.
test('the bridge builds an Automagik release tag that follows automagik-dev/automagik', () => {
  const text = readFileSync(new URL('../.github/workflows/bridge.yml', import.meta.url), 'utf8')
  assert.equal(text.match(/repository: automagik-dev\/automagik/g)?.length, 2)
  assert.match(text, /\^v3\\\.\[0-9\]\{6\}\\\.\[0-9\]\+\$/)
  assert.match(text, /repos\/automagik-dev\/automagik\/releases" apps\/desktop\/src\/update\.js/)
  assert.match(text, /MAC_CSC_LINK: \$\{\{ secrets\.MAC_CSC_LINK \}\}/)
})

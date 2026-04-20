import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Centralized model ID. Override via ANTHROPIC_MODEL env var on Vercel if
// your account needs a different one (e.g. claude-sonnet-4-5,
// claude-3-5-sonnet-latest). Default is a broadly-available recent Sonnet.
export const CLAUDE_MODEL =
  process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5'

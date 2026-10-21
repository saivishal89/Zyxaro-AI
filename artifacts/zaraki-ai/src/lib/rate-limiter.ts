/**
 * Rate Limiter and Form Validation Utilities for Zaraki AI
 */

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

class SlidingWindowRateLimiter {
  private timestamps: number[] = []
  private maxRequests: number
  private windowMs: number

  constructor(config: RateLimitConfig) {
    this.maxRequests = config.maxRequests
    this.windowMs = config.windowMs
  }

  public check(): { allowed: boolean; retryAfterMs: number; remaining: number } {
    const now = Date.now()
    const windowStart = now - this.windowMs

    // Evict timestamps outside the window
    this.timestamps = this.timestamps.filter((t) => t > windowStart)

    if (this.timestamps.length < this.maxRequests) {
      this.timestamps.push(now)
      return {
        allowed: true,
        retryAfterMs: 0,
        remaining: this.maxRequests - this.timestamps.length,
      }
    }

    const oldest = this.timestamps[0]
    const retryAfterMs = Math.max(0, oldest + this.windowMs - now)

    return {
      allowed: false,
      retryAfterMs,
      remaining: 0,
    }
  }

  public reset(): void {
    this.timestamps = []
  }
}

// 30 messages per 60 seconds
export const chatRateLimiter = new SlidingWindowRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000,
})

// 5 auth attempts per 60 seconds
export const authRateLimiter = new SlidingWindowRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000,
})

/**
 * Form Validation Utilities
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email is required' }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Please enter a valid email address' }
  }
  return { valid: true }
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' }
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' }
  }
  return { valid: true }
}

export function validateApiKey(provider: string, key: string): { valid: boolean; error?: string } {
  if (!key || !key.trim()) {
    return { valid: false, error: `${provider} API key is required` }
  }
  const trimmed = key.trim()
  if (provider.toLowerCase() === 'openai' && !trimmed.startsWith('sk-')) {
    return { valid: false, error: 'OpenAI API key usually starts with "sk-"' }
  }
  if (provider.toLowerCase() === 'anthropic' && !trimmed.startsWith('sk-ant-')) {
    return { valid: false, error: 'Anthropic API key usually starts with "sk-ant-"' }
  }
  if (trimmed.length < 15) {
    return { valid: false, error: 'API key appears too short' }
  }
  return { valid: true }
}

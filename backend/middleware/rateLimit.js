import rateLimit, {ipKeyGenerator} from 'express-rate-limit'


// Global API limiter for general rate limiting 
export const apiLimiter = rateLimit({
    // 15 minute
    windowMs: 15 * 60 * 1000, 
    // max 200 requests per 10 minutes 
    max: 200,
    keyGenerator: ipKeyGenerator, 
    message: { error: "Too many requests, try again later."}
})


// Sign up rate limiter to prevent spam account creation 
export const registerLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 2,
    keyGenerator: ipKeyGenerator, 
    message: {
        success: false,
        message: "Too many signup attempts. Please try again later."
    }
})

// Login rate limiter to prevent brute force 
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    // only 3 login attempt per minute allowed 
    max: 3,
    keyGenerator: ipKeyGenerator, 
    message: {
        success: false,
        message: "Too many login attempts. Please try again in 1 minute."
    }
})  

// Refresh token rate limiter to minimize abuse 
export const refreshLimiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 15,
    keyGenerator: ipKeyGenerator, 
    message: {
        success: false,
        message: "Too many refresh requests. Please slow down."
    }
})
import rateLimit from 'express-rate-limit'


// Global API limiter
export const apiLimiter = rateLimit({
    // 10 minute
    windowMs:10 * 60 * 1000, 
    // max 10 requests per minute 
    max: 10,
    message: { error: "Too many requests, try again later."}
})


// Sign up rate limiter to prevent spam account creation 
export const registerLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 2,
    message: {
        success: false,
        message: "Too many signup attempts. Please wait."
    }
})

// Login rate limiter to prevent brute force 
export const loginLimiter = rateLimit({
    windowMs: 60 * 1000, 
    // only 3 login attempt per minute allowed 
    max: 3,
    message: {
        success: false,
        message: "Too many login attempts. Please try again in 1 minute."
    }
})  

// Refresh token rate limiter 
export const refreshLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: {
        success: false,
        message: "Too many refresh requests. Please slow down."
    }
})
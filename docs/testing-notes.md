# Testing Notes - Chris Daniels
Test: DB connected and route returns data
Command: GET <BASE>/api/users
Observed: 200 OK, JSON list of 5 seeded users
Risk: n/a
Fix: n/a

Test: Password exposure in API response
Command: GET <BASE>/api/users
Observed: Each user object includes plaintext "password" (from seed and DB)
Risk: High (sensitive data in responses)
Fix: Select explicit columns (userid, name, created_at), never return password fields

Test: Create user works
Command: POST <BASE>/api/users {"name":"alice","password":"Password123!"}
Observed: 201 Created; (note if response includes pwd)
Risk: High if pwd is visible
Fix: Sanitize response, hash password on insert/update

Test: IDOR potential - get USER by ID
Command: GET <BASE>/api/users/1 (no auth)
Observed: 200 returns user 1 without ownership check
Risk: High (IDOR)
Fix: ensureAuthenticated + ensureOwnerOr

## Summary
Basic functionality verified using curl. Routes respond successfully, confirming backend–DB connectivity.  
Several high-risk findings identified:
- Passwords returned in plaintext  
- No authorization checks on `/api/users/:id`  
- Lack of input validation on POST requests  

## Things to do next
- Add **bcrypt** password hashing in `userController.js`  
- Implement authentication middleware for sensitive routes  
- Continue testing for SQLi, XSS, and CSRF vulnerabilities  

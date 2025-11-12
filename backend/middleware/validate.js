import { ZodError } from "zod";
import { sendResponse } from "./responseUtils.js";

export const validate = (schemas) => {
    
    return (req, res, next) => {
        try {
            for (const [key, schema] of Object.entries(schemas)) {
                if (!schema) continue;

                // Parse and validate the input 
                const result = schema.parse(req[key]);
                req[key] = result;
        }

      next();
    } catch (error) {
        if (error instanceof ZodError) {
            console.log("Zod validation errors:", error.issues);
            return sendResponse(res, 400, "Invalid input data", error.issues);
        }

        console.error("Unexpected validation error:", error);
        return sendResponse(res, 500, "Server error");
    }
  };
};

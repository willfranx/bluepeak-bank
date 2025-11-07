import { ZodError } from "zod";

export const validate = (schemas) => {
    return (req, res, next) => {
        try {
            for (const [key, schema] of Object.entries(schemas)) {
                if (!schema) continue;
                const result = schema.parse(req[key]);
                req[key] = result;
            }

            next();

        } catch (error) {
            
            if (error instanceof ZodError) {
                console.log("Zod validation errors:", error.issues);
                return res.status(400).json({
                    success: false,
                    error: "Invalid input data",
                    details: error.issues
                });
            }

            console.error("Validation Error:", error);
            return res.status(500).json({
                success: false,
                error: "Server Error"
            });
        }
    }
}

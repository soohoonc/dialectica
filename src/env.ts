import { z } from "zod";

const envSchema = {
  server: z.object({
    // DATABASE_URL is optional since we use markdown files via the graph engine
    DATABASE_URL: z.string().url().optional(),
    NODE_ENV: z.enum(["development", "test", "production"])
      .default("development"),
  }),
  client: z.object({
    // Add your NEXT_PUBLIC_ env vars here
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  }),
};

const merged = envSchema.server.merge(envSchema.client);
// type EnvSchema = z.infer<typeof merged>;

const formatErrors = (errors: z.ZodError) => {
  const { fieldErrors } = errors.flatten();
  const errorMessage = Object.entries(fieldErrors)
    .map(([field, errors]) =>
      `${field}: ${errors?.join(", ")}`)
    .join("\n");
  return errorMessage;
};

const processEnvValues = {
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
} as const;

if (!process.env.SKIP_ENV_VALIDATION) {
  console.log("🔍 Validating environment variables");
  try {
    merged.parse(processEnvValues);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `❌ Invalid environment variables:\n${formatErrors(error)}\n` +
        `💡 Tip: Check your .env file`
      );
    }
  }
}

export const env = {
  ...processEnvValues,
  isProduction: processEnvValues.NODE_ENV === "production",
  isDevelopment: processEnvValues.NODE_ENV === "development",
  isTest: processEnvValues.NODE_ENV === "test",
} as const;
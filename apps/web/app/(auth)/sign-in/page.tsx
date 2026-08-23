"use client";

import { GalleryVerticalEnd, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import DashboardImage from "@/public/dashboard-illustration.png";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Signin() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            FinanceOS
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-muted">
        <div className="relative w-full h-full hidden lg:block">
          <Image
            src={DashboardImage}
            alt=""
            className="absolute inset-0 h-full w-full object-contain dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </div>
    </div>
  );
}

function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
  const googleSignIn = async () => {
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.origin,
    });

    if (error) {
      toast.error(error.statusText);
    }
  };
  const loginSchema = z.object({
    email: z.email("Invalid email"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(8, "Password is too long"),
  });
  type FieldErrorMessage = Array<{ message?: string } | undefined>;
  type LoginSchemaInput = z.input<typeof loginSchema>;
  type LoginFormErrors = Partial<
    Record<keyof LoginSchemaInput, FieldErrorMessage>
  >;
  type LoginFormState = {
    values: LoginSchemaInput;
    errors?: LoginFormErrors;
  };

  const initialState: LoginFormState = {
    values: {
      email: "",
      password: "",
    },
  };

  const toFieldErrors = (
    errors?: Partial<Record<keyof LoginSchemaInput, string[]>>,
  ): LoginFormErrors => {
    return {
      email: errors?.email?.map((message) => ({ message })),
      password: errors?.password?.map((message) => ({ message })),
    };
  };

  const formSubmit = async (
    _previousState: LoginFormState,
    formData: FormData,
  ): Promise<LoginFormState> => {
    const values: LoginSchemaInput = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };
    const result = loginSchema.safeParse(values);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    if (!result.success) {
      const zodError = result.error.flatten().fieldErrors;
      return {
        values,
        errors: toFieldErrors(zodError),
      };
    }

    return { values };
  };

  const [state, formAction, isPending] = useActionState(
    formSubmit,
    initialState,
  );

  return (
    <FieldGroup>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold">Sign in to your account</h1>
        <p className="text-sm text-balance text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>
      <Field>
        <Button variant="outline" type="button" onClick={googleSignIn}>
          <svg
            width="800px"
            height="800px"
            viewBox="-3 0 262 262"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid"
          >
            <path
              d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
              fill="#4285F4"
            />
            <path
              d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
              fill="#34A853"
            />
            <path
              d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
              fill="#FBBC05"
            />
            <path
              d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
              fill="#EB4335"
            />
          </svg>
          Login with Google
        </Button>
      </Field>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div aria-hidden="true" className="h-px flex-1 bg-border" />
        <span className="shrink-0">Or continue with</span>
        <div aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      <form
        {...props}
        action={formAction}
        className={cn("flex flex-col gap-6", className)}
      >
        <FieldGroup>
          <Field data-invalid={!!state?.errors?.email?.length}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              placeholder="m@example.com"
              aria-invalid={!!state.errors?.email}
              defaultValue={state.values.email}
              required
            />
            <FieldError errors={state.errors?.email} />
          </Field>
          <Field data-invalid={!!state?.errors?.password?.length}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordField
              name="password"
              id="password"
              placeholder="password"
              aria-invalid={!!state?.errors?.password?.length}
              defaultValue={state.values.password}
              required
            />
            <FieldError errors={state?.errors?.password} />
          </Field>
          <Field>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin size-3" />}
              Sign in
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </FieldGroup>
  );
}

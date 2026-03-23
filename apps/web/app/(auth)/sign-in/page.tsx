"use client";

import Link from "next/link";
import { GalleryVerticalEnd, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { cn } from "@financeos/ui/lib/utils";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@financeos/ui/components/ui/field";
import { Input } from "@financeos/ui/components/ui/input";
import { Button } from "@financeos/ui";
import z from "zod";
import { PasswordField } from "@financeos/ui/components/PassowrdField";
import DashboardImage from "@/public/dashboard-illustration.png";
import Image from "next/image";

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
    <form
      {...props}
      action={formAction}
      className={cn("flex flex-col gap-6", className)}
    >
      <FieldGroup>
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-bold">Sign in to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        </div>
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
  );
}

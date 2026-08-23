"use client"

import { EyeIcon, EyeOffIcon } from "lucide-react"
import { useState } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

type PasswordFieldProps = Omit<React.ComponentProps<"input">, "type">

export function PasswordField(props: PasswordFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  return (
    <InputGroup>
      <InputGroupInput
        type={isPasswordVisible ? "text" : "password"}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          aria-pressed={isPasswordVisible}
          onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
        >
          {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

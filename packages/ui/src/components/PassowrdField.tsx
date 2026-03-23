import { useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { EyeClosedIcon, EyeIcon } from "lucide-react";

export function PasswordField(props: React.ComponentProps<"input">) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <InputGroup>
      <InputGroupInput id="inline-end-input" type="password" {...props} />
      <InputGroupAddon
        align="inline-end"
        className="cursor-pointer"
        onClick={() => setShowPassword((pre) => !pre)}
      >
        {showPassword ? (
          <EyeClosedIcon className="size-4" />
        ) : (
          <EyeIcon className="size-4" />
        )}
      </InputGroupAddon>
    </InputGroup>
  );
}

import { CSSProperties, ReactNode } from "react";

export interface ButtonProps {
  size?: "s" | "m" | "l" | "content";
  mode?:
    | "primary"
    | "secondary"
    | "secondary_with_accent_text"
    | "transparent"
    | "transparent_with_accent_text";
  before?: ReactNode;
  stretched?: boolean;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  hasHover?: boolean;
  color?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

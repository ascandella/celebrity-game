import React, { FunctionComponent } from "react";
import styled from "styled-components";
import PinkGradient from "./styles";

interface FormClassAttrs {
  className?: string;
}

export const FormLabel = styled.label.attrs<FormClassAttrs>({
  className: "block text-gray-700 font-bold mb-2",
})``;

export const FormInput = styled.input.attrs<FormClassAttrs>({
  className:
    "bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-sm py-2 px-4 block w-full appearance-none leading-normal9",
})``;

export const ShortFormInput = styled.input.attrs<FormClassAttrs>({
  className:
    "bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-sm py-2 px-4 appearance-none leading-normal9",
})``;

type FormErrorProps = {
  error: string;
};

export const FormError: FunctionComponent<FormErrorProps> = ({
  error,
}: FormErrorProps) => {
  if (!error) {
    return null;
  }
  return (
    <div className="flex justify-center mb-4">
      <div
        className="bg-red-100 border border-red-400 text-red-700 p-2 relative"
        role="alert"
      >
        <span className="block sm:inline">{error}</span>
      </div>
    </div>
  );
};

type SubmitButtonProps = {
  submitting: boolean;
  value: string;
};

interface StyledButtonProps {
  className?: string;
}

const StyledButton = styled.input.attrs<StyledButtonProps>({
  className:
    "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 cursor-pointer focus:outline-none focus:shadow-outline",
})``;

export const SubmitButton: FunctionComponent<SubmitButtonProps> = ({
  submitting,
  value,
}: SubmitButtonProps) => (
  <StyledButton
    type="submit"
    style={{ background: PinkGradient }}
    value={value}
    disabled={submitting}
    className={submitting ? "opacity-50 " : ""}
  />
);

type FormWrapperProps = {
  children: React.ReactNode;
};

export const FormWrapper: FunctionComponent<FormWrapperProps> = ({
  children,
}: FormWrapperProps) => (
  <div className="flex justify-center">
    <div className="w-full max-w-md">{children}</div>
  </div>
);

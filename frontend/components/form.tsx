import React, { FunctionComponent } from "react";
import styled from "styled-components";

export const FormLabel = styled.label.attrs({
  className: "block text-gray-700 font-bold mb-2",
})``;

export const FormInput = styled.input.attrs({
  className:
    "bg-white focus:outline-none focus:shadow-outline border border-gray-300 rounded-lg py-2 px-4 block w-full appearance-none leading-normal9",
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
        className="bg-red-100 border border-red-400 text-red-700 p-2 rounded relative"
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

const StyledButton = styled.input.attrs({
  className:
    "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 cursor-pointer rounded focus:outline-none focus:shadow-outline",
})``;

export const SubmitButton: FunctionComponent<SubmitButtonProps> = ({
  submitting,
  value,
}: SubmitButtonProps) => (
  <StyledButton
    type="submit"
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

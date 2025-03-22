import { FINANCIAL_QUESTIONS } from "@/components/FinancialInformation";
import React, { createContext, useContext, useState, ReactNode } from "react";

type FormData = {
  aadhaar_number: string;
  address: string;
  date_of_birth: string;
  full_name: string;
  gender: string;
  pan_number: string;
  answers: string[];
};

const initialFormData: FormData = {
  aadhaar_number: "",
  address: "",
  date_of_birth: "",
  full_name: "",
  gender: "",
  pan_number: "",
  answers: Array(FINANCIAL_QUESTIONS.length).fill(""),
};

type FormContextType = {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  resetForm: () => void;
  updateAnswer: (index: number, value: string) => void;
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prevData) => ({ ...prevData, ...data }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const updateAnswer = (index: number, value: string) => {
    const newAnswers = [...formData.answers];
    newAnswers[index] = value;
    setFormData((prev) => ({ ...prev, answers: newAnswers }));
  };

  return (
    <FormContext.Provider
      value={{ formData, updateFormData, resetForm, updateAnswer }}
    >
      {children}
    </FormContext.Provider>
  );
};

export const useOurFormContext = () => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
};

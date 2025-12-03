import React from 'react';
import { Form, Input } from 'antd';

interface EmailPhoneInputProps {
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
  className?: string;
}

export const EmailPhoneInput: React.FC<EmailPhoneInputProps> = ({
  name,
  label,
  placeholder,
  required = false,
  className = 'ccd-input'
}) => {
  return (
    <Form.Item
      name={name}
      label={label}
      rules={[
        {
          validator: (_, value) => {
            if (!value || !value.trim()) {
              if (required) {
                return Promise.reject(new Error(`Please input your ${label.toLowerCase()}!`));
              }
              return Promise.resolve();
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const phoneRegex = /^\+?[1-9]\d{1,14}$/;
            
            if (emailRegex.test(value.trim()) || phoneRegex.test(value.trim())) {
              return Promise.resolve();
            }
            
            return Promise.reject(
              new Error('Please enter a valid email address or phone number')
            );
          },
        },
      ]}
    >
      <Input
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
    </Form.Item>
  );
};

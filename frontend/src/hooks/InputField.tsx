import React, { useState } from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function InputField({ label, error, type, ...rest }: Props) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType  = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <div className="input-wrap">
        <input
          {...rest}
          type={inputType}
          className={`field-input ${error ? 'input-error' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            className="toggle-pw"
            onClick={() => setShow(!show)}
            tabIndex={-1}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? '🙈' : '👁️'}
          </button>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
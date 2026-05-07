import { useId, useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  name,
  autoComplete,
}) {
  const generatedId = useId();
  const inputId = name || generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-group">
      {label && <label htmlFor={inputId}>{label}</label>}
      <div className="password-field">
        <input
          id={inputId}
          name={name}
          required={required}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {visible ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </div>
  );
}

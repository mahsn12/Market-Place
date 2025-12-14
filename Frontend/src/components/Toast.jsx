import React, { useEffect } from "react";
import "../Style/Toast.css";

const Toast = ({ message, type, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "!";
      case "info":
        return "ℹ";
      default:
        return null;
    }
  };

  return (
    <div className={`ios-toast ios-toast-${type}`}>
      <div className="ios-toast-icon">{getIcon()}</div>
      <span className="ios-toast-message">{message}</span>
    </div>
  );
};

export default Toast;

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore, useUIStore } from './store';

// Hook for API calls with error handling and notifications
export const useApi = (apiFunction, showNotification = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showNotification: notify } = useUIStore();

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunction(...args);
        setData(result.data);
        return result.data;
      } catch (err) {
        const errorMessage = err.response?.data?.detail || err.message || 'Có lỗi xảy ra';
        setError(errorMessage);
        if (showNotification) {
          notify(errorMessage, 'error');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, showNotification, notify]
  );

  return { data, loading, error, execute, setData, setError };
};

// Hook for paginated data fetching
export const usePaginatedApi = (apiFunction) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { showNotification } = useUIStore();

  const fetchData = useCallback(
    async (pageNum = 1, params = {}) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFunction({ ...params, page: pageNum });
        setData(response.results || response);
        setTotalPages(Math.ceil((response.count || 0) / 20));
        setTotalCount(response.count || 0);
        setPage(pageNum);
      } catch (err) {
        const errorMessage = err.response?.data?.detail || err.message;
        setError(errorMessage);
        showNotification(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, showNotification]
  );

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    totalCount,
    fetchData,
    setPage,
  };
};

// Hook for form handling
export const useForm = (initialValues, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (err) {
        if (err.response?.data) {
          setErrors(err.response.data);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit]
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setValues,
  };
};

// Hook for authentication
export const useAuth = () => {
  const { user, token, login, logout, register } = useAuthStore();
  const isAuthenticated = !!token && !!user;

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    register,
  };
};

// Hook for local storage
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

// Hook for geolocation
export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = useCallback(() => {
    setLoading(true);
    if (!navigator.geolocation) {
      setError('Geolocation không được hỗ trợ');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError(null);
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );
  }, []);

  return { location, error, loading, getLocation };
};

// Hook for debounced search
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Hook for previous value
export const usePrevious = (value) => {
  const [previous, setPrevious] = useState();

  useEffect(() => {
    setPrevious(value);
  }, [value]);

  return previous;
};

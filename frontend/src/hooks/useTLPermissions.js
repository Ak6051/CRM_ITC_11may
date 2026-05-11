import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

/**
 * Hook to fetch TL permissions.
 * blocked = items checked by admin (hidden/disabled for TL)
 * canDo(key) returns true if the action is NOT blocked
 */
const useTLPermissions = () => {
  const [blocked, setBlocked] = useState(null); // null = loading

  useEffect(() => {
    const role = sessionStorage.getItem('role');
    if (role !== 'teamleader') {
      setBlocked([]); // non-TL users have no restrictions
      return;
    }
    const fetch = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/tl/my-permissions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBlocked(res.data.permissions || []);
      } catch {
        setBlocked([]);
      }
    };
    fetch();
  }, []);

  // Returns true if action is allowed (not blocked)
  const canDo = (key) => {
    if (blocked === null) return false; // still loading — hide to be safe
    return !blocked.includes(key);
  };

  return { canDo, loading: blocked === null };
};

export default useTLPermissions;

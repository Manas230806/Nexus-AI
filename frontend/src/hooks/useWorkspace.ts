'use client';

import { useEffect, useState } from 'react';
import api from '../lib/api';

export const useWorkspace = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const [groupRes, projectRes] = await Promise.all([api.get('/workspace/groups'), api.get('/workspace/projects')]);
        setGroups(groupRes.data?.groups || []);
        setProjects(projectRes.data?.projects || []);
      } catch (error) {
        console.error('Failed to fetch workspace data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, []);

  return { groups, projects, loading };
};

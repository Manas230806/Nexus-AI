'use client';

import { useEffect, useState } from 'react';
import api from '../lib/api';

export const useWorkspace = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspace = async () => {
      const [groupRes, projectRes] = await Promise.all([api.get('/workspace/groups'), api.get('/workspace/projects')]);
      setGroups(groupRes.data.groups || []);
      setProjects(projectRes.data.projects || []);
      setLoading(false);
    };

    fetchWorkspace();
  }, []);

  return { groups, projects, loading };
};

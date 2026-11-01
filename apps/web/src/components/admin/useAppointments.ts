'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, Appt, Staff } from './api';

export function useAppointments(admin: boolean) {
  const [appts, setAppts] = useState<Appt[] | null>(null); const [team, setTeam] = useState<Staff[]>([]); const [err, setErr] = useState('');
  const load = useCallback(async () => {
    try { setAppts(await api('/api/v1/appointments')); if (admin) setTeam((await api('/api/v1/staff') as Staff[]).filter(s => s.role === 'employee' && s.active)); }
    catch (e) { setErr((e as Error).message); }
  }, [admin]);
  useEffect(() => { load(); }, [load]);
  const patch = async (id: string, b: object) => { try { setErr(''); await api(`/api/v1/appointments/${id}`, 'PATCH', b); await load(); } catch (e) { setErr((e as Error).message); } };
  return { appts, team, err, patch };
}

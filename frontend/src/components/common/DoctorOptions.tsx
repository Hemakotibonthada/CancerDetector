import React, { useEffect, useState } from 'react';
import { MenuItem } from '@mui/material';
import { hospitalsAPI } from '../../services/api';

export function useDoctorOptions() {
  const [doctors, setDoctors] = useState<{ id: string; name: string; specialization?: string }[]>([]);
  useEffect(() => {
    hospitalsAPI.listDoctors()
      .then((res) => setDoctors(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDoctors([]));
  }, []);
  return doctors;
}

const DoctorOptions: React.FC = () => {
  const doctors = useDoctorOptions();
  if (!doctors.length) return <MenuItem value="" disabled>No doctors recorded</MenuItem>;
  return (
    <>
      {doctors.map((doctor) => (
        <MenuItem key={doctor.id} value={doctor.id}>
          {doctor.name}{doctor.specialization ? ` — ${doctor.specialization}` : ''}
        </MenuItem>
      ))}
    </>
  );
};

export default DoctorOptions;

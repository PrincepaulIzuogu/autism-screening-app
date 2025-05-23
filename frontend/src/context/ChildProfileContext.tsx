import React, { createContext, useState } from 'react';

type ProfileContextType = {
  ageGroup: string;
  setAgeGroup: (value: string) => void;
  gender: string;
  setGender: (value: string) => void;
};

export const ChildProfileContext = createContext<ProfileContextType>({
  ageGroup: '',
  setAgeGroup: () => {},
  gender: '',
  setGender: () => {},
});

export const ChildProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [ageGroup, setAgeGroup] = useState('');
  const [gender, setGender] = useState('');

  return (
    <ChildProfileContext.Provider value={{ ageGroup, setAgeGroup, gender, setGender }}>
      {children}
    </ChildProfileContext.Provider>
  );
};

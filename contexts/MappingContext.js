import React, { createContext, useContext, useState } from 'react';

const MappingContext = createContext();

export const MappingProvider = ({ children }) => {
  const [step1Data, setStep1Data] = useState({});
  const [step2Data, setStep2Data] = useState({});
 // const [step3Data, setStep3Data] = useState({});

  return (
    <MappingContext.Provider value={{ step1Data, setStep1Data, step2Data, setStep2Data}}>
      {children}
    </MappingContext.Provider>
  );
};

export const useMappingContext = () => useContext(MappingContext);

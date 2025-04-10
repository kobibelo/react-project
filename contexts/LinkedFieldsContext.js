import React, { createContext, useContext, useState } from 'react';

// יצירת הקונטקסט
const LinkedFieldsContext = createContext();

// קריאייטור מותאם אישית עבור הקונטקסט
export const LinkedFieldsProvider = ({ children }) => {
  const [linkedFields, setLinkedFields] = useState(new Set());

  // פונקציה להוספת קישור
  const addLinkedField = (field) => {
    setLinkedFields((prev) => new Set(prev).add(field));
  };

  // פונקציה להסרת קישור
  const removeLinkedField = (field) => {
    setLinkedFields((prev) => {
      const newSet = new Set(prev);
      newSet.delete(field);
      return newSet;
    });
  };

  // פונקציה חדשה לאיפוס כל השדות המקושרים
  const resetLinkedFields = () => {
    setLinkedFields(new Set());
  };

  return (
    <LinkedFieldsContext.Provider value={{ 
      linkedFields, 
      addLinkedField, 
      removeLinkedField, 
      resetLinkedFields  // הוספת הפונקציה החדשה לערך המסופק
    }}>
      {children}
    </LinkedFieldsContext.Provider>
  );
};

// הוק מותאם אישית לשימוש בקונטקסט
export const useLinkedFields = () => {
  return useContext(LinkedFieldsContext);
};
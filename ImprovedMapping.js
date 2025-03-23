// ImprovedMapping.js - Enhanced mapping component with all new features
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  Stepper, 
  Step, 
  StepLabel, 
  Alert, 
  IconButton,
  Tooltip,
  Snackbar, 
  Fab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import StorageIcon from '@mui/icons-material/Storage';
import CodeIcon from '@mui/icons-material/Code';
import TableViewIcon from '@mui/icons-material/TableView';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import axios from 'axios';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import custom components
import { RenderImportForm, RenderExportForm } from './components/renderForms';
import { LinkedFieldsProvider, useLinkedFields } from './contexts/LinkedFieldsContext';
import DatabaseSelector from './components/DatabaseSelector';
import MultiSelectFieldList from './components/MultiSelectFieldList';
import EnhancedDropTargetArea from './components/EnhancedDropTargetArea';
import SqlQueryDialog from './components/SqlQueryDialog';

axios.defaults.headers.post['Content-Type'] = 'application/json';

function ImprovedMapping() {
  // קבל את ID מהפרמטרים בURL
  const { id } = useParams();
  // Step management
  const [step, setStep] = useState(1);
  
  // Basic mapping info
  const [mappingName, setMappingName] = useState('');
  const [mappingInfo, setMappingInfo] = useState('');
  
  // Import (source) server configuration
  const [importServerType, setImportServerType] = useState('mssql');
  const [importConnectionType, setImportConnectionType] = useState('localhost');
  const [importServerName, setImportServerName] = useState('');
  const [importDatabaseName, setImportDatabaseName] = useState('');
  
  // Export (destination) server configuration
  const [exportServerType, setExportServerType] = useState('mysql');
  const [exportConnectionType, setExportConnectionType] = useState('localhost');
  const [exportServerName, setExportServerName] = useState('');
  const [exportDatabaseName, setExportDatabaseName] = useState('');
  const [exportUserName, setExportUserName] = useState('root');
  const [exportPassword, setExportPassword] = useState('1234');
  
  // Table and fields data
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [fields, setFields] = useState([]);
  
  // Field mappings state
  const [fieldMappings, setFieldMappings] = useState({});
  const [droppedFields, setDroppedFields] = useState(new Set());
  const [queryFields, setQueryFields] = useState([]);
  const [queryData, setQueryData] = useState(null);
  const [queryName, setQueryName] = useState('');
  const [fieldSources, setFieldSources] = useState({});
  const [renamedFields, setRenamedFields] = useState({});
  
  // UI state
  const [testMessage, setTestMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [isLoading, setIsLoading] = useState(false);
  const [sqlQueryDialogOpen, setSqlQueryDialogOpen] = useState(false);
  const [newTableDialogOpen, setNewTableDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [saveTableDialogOpen, setSaveTableDialogOpen] = useState(false);
  const [saveTableName, setSaveTableName] = useState('');
  
  // State for cancel confirmation dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  // Context for linked fields
  const { linkedFields, addLinkedField, removeLinkedField, resetLinkedFields } = useLinkedFields();
  
  // Router navigation
  const navigate = useNavigate();

  useEffect(() => {
    resetAllMappingData();
  }, []);

  useEffect(() => {
    if (id) {
      // אם יש ID, טען את המיפוי הקיים
      loadExistingMapping(id);
    }
  }, [id]); // תלוי בשינויים ב-ID


  // הוסף ליד ה-useEffect הקיימים

// טען טבלאות כאשר שם השרת וה-database נטענים
useEffect(() => {
  if (importServerName && importDatabaseName) {
    loadTables();
  }
}, [importServerName, importDatabaseName]);

// טען שדות כאשר הטבלה נבחרת
useEffect(() => {
  if (importServerName && importDatabaseName && selectedTable) {
    fetchTableFields(importServerName, importDatabaseName, selectedTable);
  }
}, [selectedTable, importServerName, importDatabaseName]);
  
// פונקציה לטעינת מיפוי קיים
const loadExistingMapping = async (mappingId) => {
  setIsLoading(true);
  try {
    const response = await axios.get(`http://localhost:3001/mapping/${mappingId}`);
    
    if (response.data.success) {
      const mappingData = response.data.mapping;
      console.log('Loaded mapping data:', mappingData); // הוסף לוג
      
      // עדכון כל השדות
      setMappingName(mappingData.mapping_name || '');
      setMappingInfo(mappingData.mapping_info || '');
      setImportServerName(mappingData.import_server || '');
      setImportDatabaseName(mappingData.import_database || '');
      
      setExportServerName(mappingData.export_server || '');
      setExportDatabaseName(mappingData.export_database || '');
      setExportUserName(mappingData.export_username || 'root');
      setExportPassword(mappingData.export_password || '1234');
      
      // שינוי חשוב: שימוש ב-source_table במקום selected_table
      setSelectedTable(mappingData.source_table || '');
      
      // טען את רשימת השדות באמצעות קריאה לשרת - שינוי ל-source_table
      if (mappingData.import_server && mappingData.import_database && mappingData.source_table) {
        try {
          await fetchTableFields(
            mappingData.import_server, 
            mappingData.import_database, 
            mappingData.source_table
          );
        } catch (fieldError) {
          console.error('Error fetching table fields:', fieldError);
        }
      }
      
      // טען מיפוי שדות
      if (mappingData.field_mappings) {
        let parsedMappings;
        try {
          // נסה לפרסר אם זה מגיע כמחרוזת JSON
          parsedMappings = typeof mappingData.field_mappings === 'string' 
            ? JSON.parse(mappingData.field_mappings) 
            : mappingData.field_mappings;
            
          console.log('Parsed field mappings:', parsedMappings); // הוסף לוג
          
          console.log('Setting fieldMappings in loadExistingMapping:', parsedMappings);
          setFieldMappings(parsedMappings);
          console.log('Current fieldMappings after setting:', fieldMappings);
          
          // הגדר את מקור השדות
          const sourceInfo = {
            databaseName: mappingData.import_database,
            tableName: mappingData.source_table
          };
          
          // עדכן גם את הסט של השדות הממופים
          const fieldSet = new Set(Object.keys(parsedMappings));
          setDroppedFields(fieldSet);
          
          // הוסף לרשימת השדות המקושרים ועדכן את המקור של כל שדה
          fieldSet.forEach(field => {
            addLinkedField(field);
            
            // הוסף מידע על המקור של השדה
            setFieldSources(prev => ({
              ...prev,
              [field]: sourceInfo
            }));
          });
        } catch (err) {
          console.error('Error parsing field mappings:', err);
        }
      }
      
      showSnackbar('Mapping loaded successfully for editing', 'success');
    } else {
      showSnackbar('Failed to load mapping data', 'error');
    }
  } catch (error) {
    console.error('Error loading mapping:', error);
    showSnackbar('Error loading mapping data', 'error');
  } finally {
    setIsLoading(false);
  }
};

// פונקציה לטעינת רשימת טבלאות
const loadTables = async () => {
  if (!importServerName || !importDatabaseName) return;
  
  setIsLoading(true);
  try {
    const response = await axios.post('http://localhost:3001/get-tables', {
      serverName: importServerName,
      databaseName: importDatabaseName
    });
    
    if (response.data.success) {
      const loadedTables = response.data.tables;
      
      // בדוק אם הטבלה הנבחרת הנוכחית לא קיימת ברשימה
      if (selectedTable && !loadedTables.includes(selectedTable)) {
        // אם כן, הוסף אותה לרשימה
        loadedTables.push(selectedTable);
        console.log(`Added missing table '${selectedTable}' to list of tables`);
      }
      
      setTables(loadedTables);
      console.log('Tables loaded:', loadedTables);
    }
  } catch (error) {
    console.error('Error loading tables:', error);
  } finally {
    setIsLoading(false);
  }
};

// פונקציה לטעינת שדות של טבלה
const fetchTableFields = async (server, database, table) => {
  console.log('Fetching fields for:', { server, database, table });
  setIsLoading(true);
  try {
    const response = await axios.post('http://localhost:3001/get-fields', {
      serverName: server,
      databaseName: database,
      tableName: table
    });
    
    if (response.data.success) {
      console.log('Fields loaded:', response.data.fields);
      setFields(response.data.fields);
    } else {
      console.error('Server returned error for fields:', response.data);
    }
  } catch (error) {
    console.error('Error fetching table fields:', error);
  } finally {
    setIsLoading(false);
  }
};

  // Function to reset all mapping data
  const resetAllMappingData = () => {
    // Reset mapped fields state
    setFieldMappings({});
    setDroppedFields(new Set());
    
    // Reset linked fields list (important - this shows green and checkmarks)
    resetLinkedFields();
    
    // Reset other data
    setQueryFields([]);
    setQueryData(null);
    setQueryName('');
    setFieldSources({});
    setRenamedFields({});
  };

  // Handle field linking
  const handleLinkField = (field) => {
    addLinkedField(field);
  };

  // Handle field unlinking
  const handleUnlinkField = (field) => {
    removeLinkedField(field);
  };

  // Handle field rename
  const handleRenameField = (originalName, newName) => {
    if (newName === null || originalName === newName) {
      // Remove the change if the name is identical or null
      setRenamedFields(prev => {
        const newRenamed = { ...prev };
        delete newRenamed[originalName];
        return newRenamed;
      });
    } else {
      // Update the list of renamed fields
      setRenamedFields(prev => ({
        ...prev,
        [originalName]: newName
      }));
    }
    
    console.log(`Field ${originalName} renamed to ${newName || 'original name'}`);
  };

  // Navigate to next step
  const handleNextClick = async () => {
    if (step === 1 && (!mappingName || !mappingInfo)) {
      showSnackbar('Please enter a mapping name and info.', 'error');
      return;
    }
  
    if (step === 2) {
      setIsLoading(true);
      try {
        const response = await axios.post('http://localhost:3001/save-mapping-steps', {
          mappingName,
          mappingInfo,
          importServerType,
          importConnectionType,
          importServerName,
          importDatabaseName,
          importUserName: 'your_import_username',
          importPassword: 'your_import_password',
          exportServerType,
          exportConnectionType,
          exportServerName,
          exportDatabaseName,
          exportUserName,
          exportPassword,
          newTableName: `new_${selectedTable}`,
          fieldMappings,
        });
  
        if (!response.data.success) {
          showSnackbar('Failed to save mapping steps.', 'error');
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error saving mapping steps:', error);
        showSnackbar('Error saving mapping steps.', 'error');
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }
  
    showSnackbar('Proceeding to next step', 'success');
    setStep(step + 1);
  };

  // Navigate to previous step
  const handleBackClick = () => {
    setStep(step - 1);
  };

  // Function to handle cancel button click
  const handleCancelClick = () => {
    // Open confirmation dialog
    setCancelDialogOpen(true);
  };

  // Function to handle cancel confirmation
  const handleConfirmCancel = () => {
    setCancelDialogOpen(false);
    
    // Navigate back to mapping list page
    navigate('/mapping/list');
  };

  // Function to close cancel dialog
  const handleCancelDialogClose = () => {
    setCancelDialogOpen(false);
  };

  // Auto-fill import server details
  const handleFillClick = () => {
    setMappingName('MAP1');
    setMappingInfo('MAP1 Info');
    setImportServerName('DESKTOP-2P1P17M');
    setImportDatabaseName('CTMdataNew');
    showSnackbar('Import server details filled', 'info');
  };

  // Auto-fill MySQL details
  const handleMySQLFillClick = () => {
    setExportServerName('localhost');
    setExportDatabaseName('data_mapping_db');
    setExportUserName('root');
    setExportPassword('1234');
    showSnackbar('MySQL details filled', 'info');
  };

  // Test MSSQL connection
  const handleMSSQLTestClick = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/validate/server', {
        serverName: importServerName,
        databaseName: importDatabaseName,
      });

      showSnackbar(
        response.data.success ? 'MSSQL Server connection successful.' : 'The server was not found.', 
        response.data.success ? 'success' : 'error'
      );
    } catch (error) {
      console.error('MSSQL Test connection error:', error);
      showSnackbar('Error connecting to MSSQL server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Test MySQL connection
  const handleMySQLTestClick = async () => {
    if (!exportServerName || !exportDatabaseName || !exportUserName || !exportPassword) {
      showSnackbar('Please fill in all the MySQL connection fields.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/validate/mysql', {
        host: exportServerName.trim(),
        user: exportUserName.trim(),
        password: exportPassword.trim(),
        database: exportDatabaseName.trim(),
      });

      showSnackbar(
        response.data.success ? 'MySQL Server connection successful.' : 'The server was not found.', 
        response.data.success ? 'success' : 'error'
      );
    } catch (error) {
      console.error('MySQL Test connection error:', error);
      showSnackbar('Error connecting to MySQL server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Get tables from database
  const handleGetTables = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/get-tables', {
        serverName: importServerName,
        databaseName: importDatabaseName,
      });

      if (response.data.success) {
        setTables(response.data.tables);
        showSnackbar('Tables loaded successfully.', 'success');
      } else {
        showSnackbar('Failed to load tables.', 'error');
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      showSnackbar('Error loading tables.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle database selection
  const handleDatabaseChange = (database) => {
    setImportDatabaseName(database);
    setSelectedTable('');
    setFields([]);
  };

  // Handle table selection and load fields
  const handleTableSelection = (event) => {
    const table = event.target.value;
    setSelectedTable(table);

    resetAllMappingData();
    
    if (!importServerName || !importDatabaseName || !table) return;
    
    setIsLoading(true);
    axios.post('http://localhost:3001/get-fields', {
      serverName: importServerName,
      databaseName: importDatabaseName,
      tableName: table,
    })
    .then(response => {
      if (response.data.success) {
        setFields(response.data.fields);
        showSnackbar('Fields loaded successfully.', 'success');
      } else {
        showSnackbar('Failed to load fields.', 'error');
      }
    })
    .catch(error => {
      console.error('Error loading fields:', error);
      showSnackbar('Error loading fields.', 'error');
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  // Handle fields being loaded from database selector
  const handleFieldsLoaded = (loadedFields) => {
    setFields(loadedFields);
    resetAllMappingData();
    showSnackbar('Fields loaded successfully.', 'success');
  };

  // Handle field drop for mapping
  const handleFieldDrop = (field, sourceInfo) => {
    console.log('Fields received in handleFieldDrop:', field);
    
    // Check if we received an array of fields
    if (Array.isArray(field)) {
      // Multiple fields were passed
      console.log('Processing multiple fields:', field);
      
      field.forEach(f => {
        // Check if the field already exists
        if (droppedFields.has(f)) {
          console.log('Field already in dropped fields, skipping:', f);
          return;
        }
        
        console.log('Adding field to dropped fields:', f);
        
        setDroppedFields((prev) => {
          const newSet = new Set(prev);
          newSet.add(f);
          return newSet;
        });
        
        setFieldMappings(prev => ({
          ...prev,
          [f]: null
        }));
        
        // If we added a fieldSources state, update it too
        if (sourceInfo) {
          setFieldSources(prev => ({
            ...prev,
            [f]: sourceInfo
          }));
        }
      });
    } else {
      // Single field was passed - check if it already exists
      if (droppedFields.has(field)) {
        console.log('Field already in dropped fields, skipping:', field);
        return;
      }
      
      console.log('Adding single field to dropped fields:', field);
      
      setDroppedFields((prev) => {
        const newSet = new Set(prev);
        newSet.add(field);
        return newSet;
      });
      
      setFieldMappings(prev => ({
        ...prev,
        [field]: null
      }));
      
      // If we added a fieldSources state, update it too
      if (sourceInfo) {
        setFieldSources(prev => ({
          ...prev,
          [field]: sourceInfo
        }));
      }
    }
  };

  // Handle fields from SQL query
  const handleQueryFieldsAvailable = (fields, data, name) => {
    setQueryFields(fields);
    setQueryData(data);
    setQueryName(name);
    
    // Add fields to available fields list
    const fieldNames = fields.map(f => f.name);
    setFields(prev => [...prev, ...fieldNames]);
    
    showSnackbar(`Query "${name}" created with ${fields.length} fields`, 'success');
  };

  // Create table in destination database
  const handleCreateTableClick = () => {
    setNewTableName(`new_${selectedTable}`);
    setNewTableDialogOpen(true);
  };

  // Submit new table creation
  const handleCreateTableSubmit = async () => {
    if (!newTableName) {
      showSnackbar('Please enter a table name.', 'error');
      return;
    }
    
    setNewTableDialogOpen(false);
    setIsLoading(true);
    
    try {
      if (!selectedTable) {
        showSnackbar('Please select a table first.', 'error');
        setIsLoading(false);
        return;
      }

      const transformedMappings = {};
      for (const [key, value] of Object.entries(fieldMappings)) {
        transformedMappings[value || key] = key;
      }

      const requestDataForData = {
        serverName: importServerName,
        databaseName: importDatabaseName,
        tableName: selectedTable,
        mappedFields: Object.keys(fieldMappings),
      };

      const responseData = await axios.post('http://localhost:3001/get-table-data', requestDataForData);

      if (!responseData.data.success) {
        showSnackbar('Failed to retrieve data from the original table.', 'error');
        setIsLoading(false);
        return;
      }

      const data = responseData.data.data;

      const requestDataForCreation = {
        serverName: exportServerName,
        databaseName: exportDatabaseName,
        tableName: newTableName,
        mappedFields: transformedMappings,
        tableData: data,
      };

      const responseCreation = await axios.post('http://localhost:3001/create-table-with-data', requestDataForCreation);

      if (responseCreation.data.success) {
        showSnackbar('Table and data created successfully in MySQL.', 'success');
      } else {
        showSnackbar('Failed to create table and insert data in MySQL.', 'error');
      }
    } catch (error) {
      console.error('Error creating table and inserting data in MySQL:', error);
      showSnackbar('Error creating table and inserting data in MySQL.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Save mapping configuration
  const handleSaveClick = () => {
    // Open dialog to request new table name
    setSaveTableName(`new_${selectedTable || 'data'}`);
    setSaveTableDialogOpen(true);
  };

  // Save mapping and create table
  const handleSaveTableAndMapping = async () => {
    if (!saveTableName) {
      showSnackbar('Please enter a table name.', 'error');
      return;
    }
  
    setSaveTableDialogOpen(false);
    setIsLoading(true);
  
    try {
      // קבלת נתונים משדות הטופס 
      // כולל שדות ממופים ושדות שהשם שלהם שונה
      const fieldMappingsData = {};
      Object.keys(fieldMappings).forEach(field => {
        fieldMappingsData[field] = fieldMappings[field];
      });
      
      // יצירת מבנה מיפוי שדות משופר
      const enhancedFieldMappings = {
        source: {
          database: importDatabaseName,
          table: selectedTable,
          fields: fields.map(field => ({ 
            name: field,
            table: selectedTable,
            database: importDatabaseName
          }))
        },
        target: {
          database: exportDatabaseName,
          table: saveTableName,
          fields: Object.keys(fieldMappings).map(field => ({
            name: renamedFields[field] || field,
            original: field
          }))
        },
        mappings: {}
      };
      
      // הוספת מיפויי השדות במבנה החדש
      Object.keys(fieldMappings).forEach(field => {
        enhancedFieldMappings.mappings[field] = {
          targetField: fieldMappings[field] || field,
          mappedName: renamedFields[field] || field,
          sourceTable: selectedTable,
          targetTable: saveTableName
        };
      });
      
      // שמירת המיפוי במבנה החדש
      const requestDataForMapping = {
        mappingName,
        mappingInfo,
        importServerType,
        importConnectionType,
        importServerName,
        importDatabaseName,
        exportServerType,
        exportConnectionType,
        exportServerName,
        exportDatabaseName,
        exportUserName,
        exportPassword,
        fieldMappings: enhancedFieldMappings, // מבנה משופר
        renamedFields,
        selectedTable,
        targetTable: saveTableName,
      };
  
      let responseSaveMapping;
  
      // בדיקה אם מדובר בעדכון או ביצירה חדשה
      if (id) {
        // עדכון מיפוי קיים
        responseSaveMapping = await axios.put(`http://localhost:3001/mapping/update/${id}`, requestDataForMapping);
      } else {
        // יצירת מיפוי חדש
        responseSaveMapping = await axios.post('http://localhost:3001/save-mapping', requestDataForMapping);
      }
      
      if (responseSaveMapping.data.success) {
        showSnackbar(id ? 'Mapping updated successfully.' : 'Mapping saved successfully.', 'success');
        // ניווט לדף הרשימה אחרי השהייה קצרה
        setTimeout(() => {
          navigate('/mapping/list');
        }, 1500);
      } else {
        showSnackbar(id ? 'Failed to update mapping.' : 'Failed to save mapping.', 'error');
      }
    } catch (error) {
      console.error('Error during save operation:', error);
      showSnackbar(`Error: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // View data from source table with support for renamed fields
  const handleViewDataClick = async () => {
    setIsLoading(true);
    try {
      if (!selectedTable) {
        showSnackbar('Please select a table first.', 'error');
        setIsLoading(false);
        return;
      }

      // Request to get data - use original names for the request
      const requestData = {
        serverName: importServerName,
        databaseName: importDatabaseName,
        tableName: selectedTable,
        mappedFields: Object.keys(fieldMappings),
      };

      const response = await axios.post('http://localhost:3001/get-table-data', requestData);

      if (response.data.success) {
        const data = response.data.data;
        if (data.length === 0) {
          showSnackbar('No data available in the selected table.', 'error');
          setIsLoading(false);
          return;
        }

        // Create HTML table for data display
        let tableHeaders = '';
        let tableRows = '';
        
        const originalHeaders = Object.keys(data[0]);
        
        // Create table headers - use new names for display
        originalHeaders.forEach(header => {
          // Check if there's a custom name for this field
          const displayHeader = renamedFields[header] || header;
          tableHeaders += `<th style="padding: 10px; border: 1px solid #ddd;">${displayHeader}</th>`;
        });
        
        // Create table rows
        data.slice(0, 50).forEach(row => {
          let tableRow = '<tr>';
          originalHeaders.forEach(header => {
            tableRow += `<td style="padding: 10px; border: 1px solid #ddd;">${row[header] !== null ? row[header] : 'NULL'}</td>`;
          });
          tableRow += '</tr>';
          tableRows += tableRow;
        });
        
        // Create full HTML with customized field names
        const fullHTML = `
        <html>
          <head>
            <title>Data Preview - ${selectedTable}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #2196F3; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #2196F3; color: white; text-align: left; }
              tr:nth-child(even) { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>Data Preview - ${selectedTable}</h1>
            <p>Showing ${Math.min(data.length, 50)} of ${data.length} records</p>
            <table>
              <thead>
                <tr>${tableHeaders}</tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </body>
        </html>
        `;

        const newWindow = window.open('', '_blank', 'width=800,height=600');
        if (newWindow) {
          newWindow.document.open();
          newWindow.document.write(fullHTML);
          newWindow.document.close();
        } else {
          showSnackbar('Failed to open new window. Please check your popup blocker settings.', 'error');
        }
      } else {
        showSnackbar('Failed to load table data.', 'error');
      }
    } catch (error) {
      console.error('Error loading table data:', error);
      showSnackbar(`Error loading table data: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Show snackbar message
  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Open SQL Query Dialog
  const handleOpenQueryDialog = () => {
    setSqlQueryDialogOpen(true);
  };

  // Close SQL Query Dialog
  const handleCloseQueryDialog = () => {
    setSqlQueryDialogOpen(false);
  };

  // Cancel confirmation dialog
  const cancelConfirmationDialog = (
    <Dialog
      open={cancelDialogOpen}
      onClose={handleCancelDialogClose}
      aria-labelledby="cancel-dialog-title"
      aria-describedby="cancel-dialog-description"
    >
      <DialogTitle id="cancel-dialog-title">
        Cancel Mapping Process
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="cancel-dialog-description">
          Are you sure you want to cancel the mapping creation process? All entered data will be lost.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancelDialogClose} color="primary">
          Continue Editing
        </Button>
        <Button onClick={handleConfirmCancel} color="error" autoFocus>
          Cancel Mapping
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <Container maxWidth="lg">
        {/* Stepper indicating current progress */}
        <Stepper activeStep={step - 1} sx={{ marginY: 4 }}>
          <Step>
            <StepLabel>Source Configuration</StepLabel>
          </Step>
          <Step>
            <StepLabel>Destination Configuration</StepLabel>
          </Step>
          <Step>
            <StepLabel>Field Mapping</StepLabel>
          </Step>
        </Stepper>

        {/* Step 1: Source Configuration */}
        {step === 1 && (
          <>
            <RenderImportForm
              mappingName={mappingName}
              setMappingName={setMappingName}
              mappingInfo={mappingInfo}
              setMappingInfo={setMappingInfo}
              importServerType={importServerType}
              setImportServerType={setImportServerType}
              importConnectionType={importConnectionType}
              setImportConnectionType={setImportConnectionType}
              importServerName={importServerName}
              setImportServerName={setImportServerName}
              importDatabaseName={importDatabaseName}
              setImportDatabaseName={setImportDatabaseName}
              handleFillClick={handleFillClick}
              handleMSSQLTestClick={handleMSSQLTestClick}
              handleNextClick={handleNextClick}
              testMessage={testMessage}
              isLoading={isLoading}
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="outlined" 
                color="error" 
                onClick={handleCancelClick}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleNextClick} 
                disabled={!mappingName || !mappingInfo}
              >
                Next Step
              </Button>
            </Box>
          </>
        )}

        {/* Step 2: Destination Configuration */}
        {step === 2 && (
          <>
            <RenderExportForm
              exportServerType={exportServerType}
              setExportServerType={setExportServerType}
              exportConnectionType={exportConnectionType}
              setExportConnectionType={setExportConnectionType}
              exportServerName={exportServerName}
              setExportServerName={setExportServerName}
              exportUserName={exportUserName}
              setExportUserName={setExportUserName}
              exportPassword={exportPassword}
              setExportPassword={setExportPassword}
              exportDatabaseName={exportDatabaseName}
              setExportDatabaseName={setExportDatabaseName}
              handleMySQLFillClick={handleMySQLFillClick}
              handleMySQLTestClick={handleMySQLTestClick}
              handleBackClick={handleBackClick}
              handleNextClick={handleNextClick}
              handleGetTables={handleGetTables}
              testMessage={testMessage}
              isLoading={isLoading}
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="outlined" 
                color="error" 
                onClick={handleCancelClick}
              >
                Cancel
              </Button>
              <Box>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={handleBackClick} 
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleNextClick}
                >
                  Next Step
                </Button>
              </Box>
            </Box>
          </>
        )}

        {/* Step 3: Field Mapping */}
        {step === 3 && (
          <Box>
            {/* Database and Table Selection */}
            <DatabaseSelector
              importServerName={importServerName}
              importDatabaseName={importDatabaseName}
              selectedTable={selectedTable}
              onDatabaseChange={handleDatabaseChange}
              onTableChange={handleTableSelection}
              onFieldsLoaded={handleFieldsLoaded}
            />
            
            {/* SQL Query Button */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<CodeIcon />}
                onClick={handleOpenQueryDialog}
                disabled={!importDatabaseName}
              >
                Create SQL Query
              </Button>
            </Box>
            
            {/* Field Mapping Area */}
            <Grid container spacing={3}>
              {/* Left Column - Available Fields */}
              <Grid item xs={12} md={6}>
                <MultiSelectFieldList
                  fields={fields}
                  databaseName={importDatabaseName}
                  tableName={selectedTable}
                  linkedFields={linkedFields}
                  onFieldsDropped={handleFieldDrop}
                />
              </Grid>
              
              {/* Right Column - Mapping Target */}
              <Grid item xs={12} md={6}>
                <EnhancedDropTargetArea
                  fieldMappings={fieldMappings}
                  setFieldMappings={setFieldMappings}
                  onFieldDrop={handleFieldDrop}
                  onRenameField={handleRenameField}
                />
              </Grid>
            </Grid>
            
            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleCancelClick}
              >
                Cancel
              </Button>
              
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBackClick}
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleCreateTableClick}
                  sx={{ mx: 1 }}
                  disabled={!selectedTable || Object.keys(fieldMappings).length === 0}
                >
                  Create Table
                </Button>
                
                <Button
                  variant="contained"
                  color="info"
                  onClick={handleViewDataClick}
                  sx={{ mx: 1 }}
                  disabled={!selectedTable || Object.keys(fieldMappings).length === 0}
                >
                  View Data
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<SaveIcon />}
                  onClick={handleSaveClick}
                  disabled={Object.keys(fieldMappings).length === 0}
                >
                  Save Mapping
                </Button>
              </Box>
            </Box>
          </Box>
        )}
        
        {/* SQL Query Dialog */}
        <SqlQueryDialog
          open={sqlQueryDialogOpen}
          onClose={handleCloseQueryDialog}
          serverName={importServerName}
          databaseName={importDatabaseName}
          onQueryFieldsAvailable={handleQueryFieldsAvailable}
        />
        
        {/* New Table Dialog */}
        <Dialog open={newTableDialogOpen} onClose={() => setNewTableDialogOpen(false)}>
          <DialogTitle>Create New Table</DialogTitle>
          <DialogContent>
            <DialogContentText>
Enter a name for the new table to be created in the destination database.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Table Name"
              fullWidth
              variant="outlined"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewTableDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateTableSubmit} 
              variant="contained" 
              color="primary"
              disabled={!newTableName}
            >
              Create Table
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Save Table Dialog */}
        <Dialog open={saveTableDialogOpen} onClose={() => setSaveTableDialogOpen(false)}>
          <DialogTitle>Save Mapping and Create Table</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Enter a name for the new table to be created in the MySQL database.
              This table will contain the mapped data with the renamed fields.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Table Name"
              fullWidth
              variant="outlined"
              value={saveTableName}
              onChange={(e) => setSaveTableName(e.target.value)}
              helperText="The table will be created with the structure shown in View Data"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveTableDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveTableAndMapping} 
              variant="contained" 
              color="primary"
              disabled={!saveTableName}
            >
              Save and Create Table
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Cancel Confirmation Dialog */}
        {cancelConfirmationDialog}
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={5000}
          onClose={handleSnackbarClose}
          message={snackbarMessage}
          severity={snackbarSeverity}
        />
      </Container>
    </DndProvider>
  );
}

export default ImprovedMapping;
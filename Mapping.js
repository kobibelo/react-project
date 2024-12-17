import React, { useState } from 'react';
import { Container, Button } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import RenderTableSelection from './components/renderTableSelection';
import { RenderImportForm, RenderExportForm } from './components/renderForms';
import { LinkedFieldsProvider, useLinkedFields } from './contexts/LinkedFieldsContext';

axios.defaults.headers.post['Content-Type'] = 'application/json';

function Mapping() {
  const [step, setStep] = useState(1);
  const [mappingName, setMappingName] = useState('');
  const [mappingInfo, setMappingInfo] = useState('');
  const [importServerType, setImportServerType] = useState('mssql');
  const [importConnectionType, setImportConnectionType] = useState('localhost');
  const [importServerName, setImportServerName] = useState('');
  const [importDatabaseName, setImportDatabaseName] = useState('');
  const [exportServerType, setExportServerType] = useState('mysql');
  const [exportConnectionType, setExportConnectionType] = useState('localhost');
  const [exportServerName, setExportServerName] = useState('');
  const [exportDatabaseName, setExportDatabaseName] = useState('');
  const [exportUserName, setExportUserName] = useState('root');
  const [exportPassword, setExportPassword] = useState('1234');
  const [testMessage, setTestMessage] = useState('');
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [fields, setFields] = useState([]);
  const [fieldMappings, setFieldMappings] = useState({});
  const [droppedFields, setDroppedFields] = useState(new Set());
  const { linkedFields, addLinkedField, removeLinkedField } = useLinkedFields();

  const navigate = useNavigate();

  const handleLinkField = (field) => {
    addLinkedField(field);
  };

  const handleUnlinkField = (field) => {
    removeLinkedField(field);
  };

  const handleNextClick = () => {
    if (step === 1 && !mappingName && !mappingInfo) {
      setTestMessage('Please enter a mapping name and info.');
      return;
    }
    setTestMessage('');
    setStep(step + 1);
  };

  const handleBackClick = () => {
    setTestMessage('');
    setStep(step - 1);
  };

  const handleFillClick = () => {
    setMappingName('MAP1');
    setMappingInfo('MAP1 Info');
    setImportServerName('DESKTOP-2P1P17M');
    setImportDatabaseName('CTMdataNew');
  };

  const handleMySQLFillClick = () => {
    setExportServerName('localhost');
    setExportDatabaseName('data_mapping_db');
    setExportUserName('root');
    setExportPassword('1234');
  };

  const handleMSSQLTestClick = async () => {
    try {
      const response = await axios.post('http://localhost:3001/validate/server', {
        serverName: importServerName,
        databaseName: importDatabaseName,
      });

      setTestMessage(response.data.success ? 'MSSQL Server connection successful.' : 'The server was not found.');
    } catch (error) {
      console.error('MSSQL Test connection error:', error);
      setTestMessage('Error connecting to MSSQL server.');
    }
  };

  const handleMySQLTestClick = async () => {
    try {
      if (!exportServerName || !exportDatabaseName || !exportUserName || !exportPassword) {
        setTestMessage('Please fill in all the MySQL connection fields.');
        return;
      }

      const response = await axios.post('http://localhost:3001/validate/mysql', {
        host: exportServerName.trim(),
        user: exportUserName.trim(),
        password: exportPassword.trim(),
        database: exportDatabaseName.trim(),
      });

      setTestMessage(response.data.success ? 'MySQL Server connection successful.' : 'The server was not found.');
    } catch (error) {
      console.error('MySQL Test connection error:', error);
      setTestMessage('Error connecting to MySQL server.');
    }
  };

  const handleGetTables = async () => {
    try {
      const response = await axios.post('http://localhost:3001/get-tables', {
        serverName: importServerName,
        databaseName: importDatabaseName,
      });

      if (response.data.success) {
        setTables(response.data.tables);
        setTestMessage('Tables loaded successfully.');
      } else {
        setTestMessage('Failed to load tables.');
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      setTestMessage('Error loading tables.');
    }
  };

  const handleTableSelection = async (event) => {
    const selectedTable = event.target.value;
    setSelectedTable(selectedTable);

    try {
      const response = await axios.post('http://localhost:3001/get-fields', {
        serverName: importServerName,
        databaseName: importDatabaseName,
        tableName: selectedTable,
      });

      if (response.data.success) {
        setFields(response.data.fields);
        setTestMessage('Fields loaded successfully.');
      } else {
        setTestMessage('Failed to load fields.');
      }
    } catch (error) {
      console.error('Error loading fields:', error);
      setTestMessage('Error loading fields.');
    }
  };

  const handleFieldDrop = (field) => {
    setDroppedFields((prevDroppedFields) => new Set(prevDroppedFields).add(field));
  };

  const handleCreateTableClick = async () => {
    try {
      if (!selectedTable) {
        setTestMessage('Please select a table first.');
        return;
      }

      const transformedMappings = {};
      for (const [key, value] of Object.entries(fieldMappings)) {
        transformedMappings[value] = key;
      }

      const requestDataForData = {
        serverName: importServerName,
        databaseName: importDatabaseName,
        tableName: selectedTable,
        mappedFields: transformedMappings,
      };

      const responseData = await axios.post('http://localhost:3001/get-table-data', requestDataForData);

      if (!responseData.data.success) {
        setTestMessage('Failed to retrieve data from the original table.');
        return;
      }

      const data = responseData.data.data;

      const requestDataForCreation = {
        serverName: exportServerName,
        databaseName: exportDatabaseName,
        tableName: `new_${selectedTable}`,
        mappedFields: transformedMappings,
        tableData: data,
      };

      const responseCreation = await axios.post('http://localhost:3001/create-table-with-data', requestDataForCreation);

      if (responseCreation.data.success) {
        setTestMessage('Table and data created successfully in MySQL.');
      } else {
        setTestMessage('Failed to create table and insert data in MySQL.');
      }
    } catch (error) {
      console.error('Error creating table and inserting data in MySQL:', error);
      setTestMessage('Error creating table and inserting data in MySQL.');
    }
  };

  const handleSaveClick = async () => {
    try {
      const requestData = {
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
        fieldMappings,
        selectedTable,
      };

      const response = await axios.post('http://localhost:3001/save-mapping', requestData);

      if (response.data.success) {
        setTestMessage('Mapping saved successfully.');
        navigate('/mapping/list');
        window.location.reload();
      } else {
        setTestMessage('Failed to save mapping.');
      }
    } catch (error) {
      console.error('Error saving mapping:', error);
      setTestMessage('Error saving mapping.');
    }
  };

  const handleViewDataClick = async () => {
    try {
      if (!selectedTable) {
        setTestMessage('Please select a table first.');
        return;
      }

      const transformedMappings = {};
      for (const [key, value] of Object.entries(fieldMappings)) {
        transformedMappings[value] = key;
      }

      const requestData = {
        serverName: importServerName,
        databaseName: importDatabaseName,
        tableName: selectedTable,
        mappedFields: transformedMappings,
      };

      const response = await axios.post('http://localhost:3001/get-table-data', requestData);

      if (response.data.success) {
        const data = response.data.data;
        if (data.length === 0) {
          setTestMessage('No data available in the selected table.');
          return;
        }

        const fullHTML = `...`; // כל הפונקציה להציג את הנתונים, השארנו מקוצר

        const newWindow = window.open('', '_blank', 'width=800,height=600');
        if (newWindow) {
          newWindow.document.open();
          newWindow.document.write(fullHTML);
          newWindow.document.close();
        } else {
          setTestMessage('Failed to open new window. Please check your popup blocker settings.');
        }
      } else {
        setTestMessage('Failed to load table data.');
      }
    } catch (error) {
      console.error('Error loading table data:', error);
      setTestMessage(`Error loading table data: ${error.message}`);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Container maxWidth="md">
        {step === 1 && (
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
          />
        )}

        {step === 2 && (
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
          />
        )}

        {step === 3 && (
          <>
            <RenderTableSelection
              mssqlServerName={importServerName}
              selectedTable={selectedTable}
              handleTableSelection={handleTableSelection}
              tables={tables}
              fields={fields}
              droppedFields={droppedFields}
              fieldMappings={fieldMappings}
              setFieldMappings={setFieldMappings}
              handleFieldDrop={handleFieldDrop}
              linkedFields={linkedFields}
              addLinkedField={addLinkedField}      // שימוש בפונקציות מהקונטקסט לניהול הקישורים
              removeLinkedField={removeLinkedField}
            />
            <Button variant="contained" color="primary" onClick={handleBackClick} style={{ marginTop: '20px', marginRight: '10px' }}>
              Back
            </Button>
            <Button variant="contained" color="primary" onClick={handleCreateTableClick} style={{ marginTop: '20px', marginRight: '10px' }}>
              Create Table
            </Button>
            <Button variant="contained" color="primary" onClick={handleSaveClick} style={{ marginTop: '20px', marginRight: '10px' }}>
              Save Mapping
            </Button>

          </>
        )}
      </Container>
    </DndProvider>
  );
}

export default Mapping;

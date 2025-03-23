// components/DatabaseSelector.js
import React, { useState, useEffect } from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid, 
  Typography, 
  Paper,
  Box,
  Button,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import StorageIcon from '@mui/icons-material/Storage';
import TableViewIcon from '@mui/icons-material/TableView';

const DatabaseSelector = ({ 
  importServerName, 
  importDatabaseName,
  selectedTable,
  onDatabaseChange,
  onTableChange,
  onFieldsLoaded
}) => {
  const [databases, setDatabases] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available databases when server name changes
  useEffect(() => {
    if (!importServerName) return;
    
    const fetchDatabases = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.post('http://localhost:3001/get-databases', {
          serverName: importServerName
        });
        
        if (response.data.success) {
          setDatabases(response.data.databases);
        } else {
          setError('Failed to load databases');
        }
      } catch (error) {
        console.error('Error fetching databases:', error);
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDatabases();
  }, [importServerName]);

  // Fetch tables when database changes
  useEffect(() => {
    if (!importServerName || !importDatabaseName) return;
    
    const fetchTables = async () => {
      setLoading(true);
      setError(null);
      
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
        } else {
          setError('Failed to load tables');
        }
      } catch (error) {
        console.error('Error fetching tables:', error);
        setError('Error fetching tables');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTables();
  }, [importServerName, importDatabaseName, selectedTable]);

  // הוספת פונקציה להוספת הטבלה הנבחרת לרשימה אם היא חסרה
  useEffect(() => {
    // אם יש טבלה נבחרת אבל היא לא נמצאת ברשימת הטבלאות, הוסף אותה
    if (selectedTable && tables.length > 0 && !tables.includes(selectedTable)) {
      console.log(`Adding missing selected table '${selectedTable}' to tables list`);
      setTables(prevTables => [...prevTables, selectedTable]);
    }
  }, [selectedTable, tables]);

  // Handle database selection
  const handleDatabaseChange = (event) => {
    const database = event.target.value;
    onDatabaseChange(database);
  };

  // Handle table selection and fetch fields
  const handleTableChange = async (event) => {
    console.log('handleTableChange event:', event);
    
    // וודא שיש אירוע וערך - תמיכה גם באירוע ישיר וגם בערך מחרוזת
    let table;
    
    if (typeof event === 'string') {
      table = event;
    } else if (event && event.target) {
      table = event.target.value;
    } else {
      console.error('Invalid event received in handleTableChange');
      return;
    }
    
    // העבר את הטבלה לפונקציית onTableChange - בפורמט מותאם
    if (onTableChange) {
      // אם יש event רגיל, העבר אותו. אחרת, צור אירוע מלאכותי
      if (typeof event === 'string') {
        const syntheticEvent = { target: { value: event } };
        onTableChange(syntheticEvent);
      } else {
        onTableChange(event);
      }
    }
    
    if (!importServerName || !importDatabaseName || !table) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:3001/get-fields', {
        serverName: importServerName,
        databaseName: importDatabaseName,
        tableName: table
      });
      
      if (response.data.success) {
        console.log('Fields loaded for table', table, ':', response.data.fields);
        onFieldsLoaded(response.data.fields);
      } else {
        setError('Failed to load fields');
      }
    } catch (error) {
      console.error('Error loading fields:', error);
      setError('Error loading fields');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Select Data Source
      </Typography>
      
      {error && (
        <Box sx={{ mb: 2, color: 'error.main', p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
          {error}
        </Box>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="database-select-label">
              <StorageIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
              Database
            </InputLabel>
            <Select
              labelId="database-select-label"
              value={databases.includes(importDatabaseName) ? importDatabaseName : ''}
              onChange={handleDatabaseChange}
              label="Database"
              disabled={loading || databases.length === 0}
            >
              {databases.map((db) => (
                <MenuItem key={db} value={db}>{db}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="table-select-label">
              <TableViewIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
              Table
            </InputLabel>
            <Select
              labelId="table-select-label"
              value={tables.includes(selectedTable) ? selectedTable : ''}
              onChange={handleTableChange}
              label="Table"
              disabled={loading || tables.length === 0 || !importDatabaseName}
            >
              {tables.map((table) => (
                <MenuItem key={table} value={table}>{table}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </Paper>
  );
};

export default DatabaseSelector;
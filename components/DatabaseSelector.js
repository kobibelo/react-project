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
          setTables(response.data.tables);
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
  }, [importServerName, importDatabaseName]);

  // Handle database selection
  const handleDatabaseChange = (event) => {
    const database = event.target.value;
    onDatabaseChange(database);
  };

// Handle table selection and fetch fields
const handleTableChange = async (event) => {
  console.log('handleTableChange event:', event);
  
  // וודא שיש אירוע ושהוא מכיל target.value
  if (!event || !event.target) {
    console.error('Invalid event received in handleTableChange');
    return;
  }

  // קבל את הערך מהאירוע
  const table = event.target.value;
  
  // העבר את האירוע המקורי לפונקציית onTableChange
  onTableChange(event);
  
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
              value={selectedTable || ''}
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
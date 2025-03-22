// components/SqlQueryDialog.js
import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  TextField,
  Box,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Tabs,
  Tab,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Divider,
  Alert,
  Tooltip,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CodeIcon from '@mui/icons-material/Code';
import TableViewIcon from '@mui/icons-material/TableView';
import SaveIcon from '@mui/icons-material/Save';
import axios from 'axios';

// Simple text editor component for SQL
const SqlEditor = ({ value, onChange }) => {
  return (
    <TextField
      multiline
      fullWidth
      variant="outlined"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      minRows={8}
      maxRows={12}
      sx={{
        fontFamily: 'monospace',
        '& .MuiInputBase-root': {
          fontFamily: 'monospace',
          fontSize: '14px',
        }
      }}
      placeholder="SELECT * FROM your_table WHERE condition"
    />
  );
};

// SQL Query Dialog Component
const SqlQueryDialog = ({ 
  open, 
  onClose, 
  serverName,
  databaseName,
  onQueryFieldsAvailable
}) => {
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryName, setQueryName] = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Reset when dialog is opened
  useEffect(() => {
    if (open) {
      setSqlQuery('');
      setQueryName('');
      setTabIndex(0);
      setQueryResult(null);
      setError(null);
    }
  }, [open]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };
  
  // Execute the SQL query
  const handleExecuteQuery = async () => {
    if (!sqlQuery.trim()) {
      setError('Please enter a SQL query');
      return;
    }
    
    setIsExecuting(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:3001/execute-query', {
        query: sqlQuery,
        serverName,
        databaseName
      });
      
      if (response.data.success) {
        setQueryResult(response.data.result);
        
        // Switch to results tab
        setTabIndex(1);
      } else {
        setError(response.data.message || 'Failed to execute query');
      }
    } catch (err) {
      console.error('Error executing query:', err);
      setError(err.response?.data?.error || err.message || 'Error executing query');
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Use query fields for mapping
  const handleUseQuery = () => {
    if (!queryResult || !queryResult.headers) {
      setError('No query results available');
      return;
    }
    
    // Extract field information
    const fields = queryResult.headers.map(header => ({
      name: header.name,
      source: {
        databaseName: header.source || databaseName,
        tableName: queryName || 'Custom Query',
        isQuery: true
      }
    }));
    
    // Pass fields to parent component
    onQueryFieldsAvailable(fields, queryResult.data, queryName || 'Query');
    
    // Close dialog
    onClose();
  };
  
  // Get appropriate default query name
  useEffect(() => {
    if (open && databaseName) {
      setQueryName(`Query_${databaseName}_${new Date().getTime().toString().slice(-6)}`);
    }
  }, [open, databaseName]);
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ 
        sx: { 
          borderRadius: 2,
          overflow: 'hidden',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column'
        } 
      }}
    >
      {/* Dialog Header */}
      <AppBar position="static" color="primary" sx={{ px: 2 }}>
        <Toolbar variant="dense">
          <Typography variant="h6">Create SQL Query</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton 
            color="inherit" 
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Query Name Input */}
      <Box sx={{ px: 3, pt: 2 }}>
        <TextField
          label="Query Name"
          value={queryName}
          onChange={(e) => setQueryName(e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          required
          helperText="Give your query a unique name"
        />
      </Box>
      
      {/* Server and Database Info */}
      <Box sx={{ px: 3, py: 2, display: 'flex', gap: 1 }}>
        <Chip 
          label={`Server: ${serverName}`} 
          size="small" 
          color="primary" 
          variant="outlined" 
        />
        <Chip 
          label={`Database: ${databaseName}`} 
          size="small" 
          color="secondary" 
          variant="outlined" 
        />
      </Box>
      
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mx: 3, mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Tabs for Query and Results */}
      <Box sx={{ px: 3 }}>
        <Tabs 
          value={tabIndex} 
          onChange={handleTabChange}
          aria-label="query-tabs"
        >
          <Tab 
            icon={<CodeIcon />} 
            label="Query" 
            id="query-tab"
            aria-controls="query-panel"
          />
          <Tab 
            icon={<TableViewIcon />} 
            label="Results" 
            id="results-tab"
            aria-controls="results-panel"
            disabled={!queryResult}
          />
        </Tabs>
      </Box>
      
      <Divider />
      
      {/* Tab Content */}
      <DialogContent sx={{ px: 3, py: 2, flexGrow: 1, overflow: 'auto' }}>
        {/* Query Editor Panel */}
        <Box
          role="tabpanel"
          hidden={tabIndex !== 0}
          id="query-panel"
          aria-labelledby="query-tab"
          sx={{ height: '100%' }}
        >
          {tabIndex === 0 && (
            <SqlEditor 
              value={sqlQuery} 
              onChange={setSqlQuery} 
            />
          )}
        </Box>
        
        {/* Results Panel */}
        <Box
          role="tabpanel"
          hidden={tabIndex !== 1}
          id="results-panel"
          aria-labelledby="results-tab"
          sx={{ height: '100%' }}
        >
          {tabIndex === 1 && queryResult && (
            <Paper variant="outlined" sx={{ height: '100%', overflow: 'auto' }}>
              <TableContainer>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {queryResult.headers.map((header, index) => (
                        <TableCell key={index} sx={{ fontWeight: 'bold' }}>
                          {header.name}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {queryResult.data.slice(0, 100).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {queryResult.headers.map((header, cellIndex) => (
                          <TableCell key={cellIndex}>
                            {row[header.name] !== null ? String(row[header.name]) : 'NULL'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {queryResult.data.length > 100 && (
                <Box sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Showing first 100 of {queryResult.data.length} rows
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </Box>
      </DialogContent>
      
      {/* Dialog Actions */}
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        
        {tabIndex === 0 ? (
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={handleExecuteQuery}
            disabled={isExecuting || !sqlQuery.trim()}
          >
            {isExecuting ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Executing...
              </>
            ) : (
              'Execute Query'
            )}
          </Button>
        ) : (
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleUseQuery}
            disabled={!queryResult}
          >
            Use Query Result
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SqlQueryDialog;
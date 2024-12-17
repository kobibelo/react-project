import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MenuItem, FormControl, Select, InputLabel, Table, TableBody, TableCell, TableRow, TableHead, Typography, Paper, Box, FormGroup, FormControlLabel, Checkbox, IconButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

function ShowTables() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [showColumnOptions, setShowColumnOptions] = useState(false);
  const [activeRules, setActiveRules] = useState([]);
  const [rules, setRules] = useState([]); // New state to store rules with names

  useEffect(() => {
    axios.get('http://localhost:3001/get-mapping-tables')
      .then(response => {
        setTables(response.data.tables);
      })
      .catch(error => {
        console.error('Error fetching table list:', error);
      });
  }, []);

  useEffect(() => {
    if (selectedTable) {
      axios.post('http://localhost:3001/fetch-table-data', { tableName: selectedTable })
        .then(response => {
          setTableData(response.data.tableData);
          setColumns(Object.keys(response.data.tableData[0] || {}));
          setSelectedColumns(Object.keys(response.data.tableData[0] || {}));
        })
        .catch(error => {
          console.error('Error fetching table data:', error);
        });
    }
  }, [selectedTable]);

  useEffect(() => {
    if (selectedTable) {
      axios.get(`http://localhost:3001/rulesactive/${selectedTable}`)
        .then(response => {
          if (response.data.success) {
            setActiveRules(response.data.records);
            setRules(response.data.rules); // Store full rules array with rule_name
          } else {
            console.log('Failed to fetch active rules for the table.');
          }
        })
        .catch(error => {
          console.error('Error fetching active rules:', error);
        });
    }
  }, [selectedTable]);

  const handleColumnChange = (column) => {
    setSelectedColumns((prevSelected) => {
      if (prevSelected.includes(column)) {
        return prevSelected.filter((col) => col !== column);
      } else {
        return [...prevSelected, column];
      }
    });
  };

  const moveColumnUp = (index) => {
    if (index === 0) return;
    const updatedColumns = [...selectedColumns];
    [updatedColumns[index - 1], updatedColumns[index]] = [updatedColumns[index], updatedColumns[index - 1]];
    setSelectedColumns(updatedColumns);
  };

  const moveColumnDown = (index) => {
    if (index === selectedColumns.length - 1) return;
    const updatedColumns = [...selectedColumns];
    [updatedColumns[index + 1], updatedColumns[index]] = [updatedColumns[index], updatedColumns[index + 1]];
    setSelectedColumns(updatedColumns);
  };

  const toggleColumnOptions = () => {
    setShowColumnOptions((prev) => !prev);
  };

// Function to get rule ID and name for a row if it matches any active rule
const getRuleNameForRow = (row) => {
  const matchingRule = activeRules.find(rule =>
    rule.records && rule.records.some(record => record.id === row.id)
  );
  if (matchingRule) {
    const fullRule = rules.find(rule => rule.id === matchingRule.ruleId); // Match by ruleId in full rules array
    return fullRule ? ` (Rule ID: ${fullRule.id}, Rule Name: ${fullRule.rule_name})` : '';
  }
  return '';
};

  const isHighlightedRow = (row) => {
    return activeRules.some(activeRule =>
      activeRule.records && activeRule.records.some(record => record.id === row.id)
    );
  };

  return (
    <Box sx={{ margin: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
      <Typography variant="h4" gutterBottom>Show Tables</Typography>

      <FormControl sx={{ marginBottom: '20px', minWidth: '200px' }} fullWidth>
        <InputLabel id="table-select-label">Select Table</InputLabel>
        <Select
          labelId="table-select-label"
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
        >
          {tables.map((table) => (
            <MenuItem key={table} value={table}>
              {table}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '20px' }}>
        <Typography variant="h6" sx={{ marginRight: '10px' }}>Manage Columns</Typography>
        <IconButton onClick={toggleColumnOptions}>
          <SettingsIcon />
        </IconButton>
      </Box>

      {showColumnOptions && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
          {columns.length > 0 && (
            <FormGroup row>
              {columns.map((column) => (
                <FormControlLabel
                  key={column}
                  control={<Checkbox checked={selectedColumns.includes(column)} onChange={() => handleColumnChange(column)} />}
                  label={column}
                />
              ))}
            </FormGroup>
          )}

          <Box>
            <Typography variant="h6" gutterBottom>Reorder Columns</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  {selectedColumns.map((column, index) => (
                    <TableCell key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {column}
                      <div>
                        <IconButton size="small" onClick={() => moveColumnUp(index)}><ArrowUpwardIcon /></IconButton>
                        <IconButton size="small" onClick={() => moveColumnDown(index)}><ArrowDownwardIcon /></IconButton>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
            </Table>
          </Box>
        </Box>
      )}

      {selectedTable && (
        <Paper elevation={3} sx={{ marginTop: '20px' }}>
          <Typography variant="h6" gutterBottom>Table Data: {selectedTable}</Typography>
          <Table>
            <TableHead>
              <TableRow>
                {selectedColumns.map((column, index) => (
                  <TableCell key={index} sx={{ backgroundColor: '#1976d2', color: '#fff' }}>{column}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  style={{ backgroundColor: isHighlightedRow(row) ? '#e0f7fa' : 'inherit' }}
                >
                  {selectedColumns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {column === 'id' 
                        ? `${row[column]}${getRuleNameForRow(row)}` 
                        : row[column]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}

export default ShowTables;

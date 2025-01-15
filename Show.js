import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Typography,
  Paper,
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  IconButton,
} from '@mui/material';
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
  const [rules, setRules] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3001/get-mapping-tables')
      .then((response) => setTables(response.data.tables))
      .catch((error) => console.error('Error fetching table list:', error));
  }, []);

  useEffect(() => {
    if (selectedTable) {
      axios
        .post('http://localhost:3001/fetch-table-data', { tableName: selectedTable })
        .then((response) => {
          setTableData(response.data.tableData);
          setColumns(Object.keys(response.data.tableData[0] || {}));
          setSelectedColumns(Object.keys(response.data.tableData[0] || {}));
        })
        .catch((error) => console.error('Error fetching table data:', error));
    }
  }, [selectedTable]);

  useEffect(() => {
    if (selectedTable) {
      axios
        .get(`http://localhost:3001/rulesactive/${selectedTable}`)
        .then((response) => {
          if (response.data.success) {
            setActiveRules(response.data.records);
            setRules(response.data.rules);
          }
        })
        .catch((error) => console.error('Error fetching active rules:', error));
    }
  }, [selectedTable]);

  const handleColumnChange = (column) => {
    setSelectedColumns((prevSelected) =>
      prevSelected.includes(column)
        ? prevSelected.filter((col) => col !== column)
        : [...prevSelected, column]
    );
  };

  const getRuleMatchesForRow = (row) => {
    const matchingRules = activeRules
      .filter((rule) =>
        rule.records.some((record) =>
          Object.keys(record).every((key) => record[key] === row[key])
        )
      )
      .map((rule) => rule.ruleId);
    return matchingRules;
  };

  return (
    <Box sx={{ margin: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px' }}>
      <Typography variant="h4" gutterBottom>
        Show Tables
      </Typography>

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

      {selectedTable && (
        <Paper elevation={3} sx={{ marginTop: '20px', padding: '20px' }}>
          <Typography variant="h6" gutterBottom>
            Table Data: {selectedTable}
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                {selectedColumns.map((column, index) => (
                  <TableCell key={index} sx={{ backgroundColor: '#1976d2', color: '#fff' }}>
                    {column}
                  </TableCell>
                ))}
                <TableCell sx={{ backgroundColor: '#1976d2', color: '#fff' }}>Matched Rules</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.map((row, rowIndex) => {
                const ruleMatches = getRuleMatchesForRow(row);
                const isRowHighlighted = ruleMatches.length > 0;

                return (
                  <TableRow
                    key={rowIndex}
                    style={{ backgroundColor: isRowHighlighted ? '#e0f7fa' : 'inherit' }}
                  >
                    {selectedColumns.map((column, colIndex) => (
                      <TableCell key={colIndex}>{row[column]}</TableCell>
                    ))}
                    <TableCell>
                      {ruleMatches.length > 0 ? ruleMatches.join(', ') : 'No Matches'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}

export default ShowTables;

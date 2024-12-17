import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, Grid, TextField, MenuItem, Button, Box, IconButton, Typography } from '@mui/material'; // ייבוא Typography
import { Add, Remove } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

function AddRule() {
  const navigate = useNavigate();  // יצירת הפונקציה navigate
  const { ruleId } = useParams();
  const isEditMode = !!ruleId; // מצב עריכה במידה וקיים ruleId
  const [tables, setTables] = useState([]);  
  const [selectedTable, setSelectedTable] = useState('');  
  const [ruleName, setRuleName] = useState('');
  const [ruleInfo, setRuleInfo] = useState('');
  const [conditions, setConditions] = useState([{ field: '', comparison: 'equal', value: '' }]);
  const [columns, setColumns] = useState([]);  
  const [andOr, setAndOr] = useState('AND');  
  const [matchingRecords, setMatchingRecords] = useState(null);  
  const [totalRecords, setTotalRecords] = useState(null);  
  const [queryDate, setQueryDate] = useState(null);  

  useEffect(() => {
    if (isEditMode) {
      axios.get(`http://localhost:3001/rules/${ruleId}`)
        .then(response => {
          const rule = response.data.rule;
          setRuleName(rule.rule_name);
          setRuleInfo(rule.rule_info);
          setSelectedTable(rule.selected_table);
          setConditions(Array.isArray(rule.conditions) ? rule.conditions : JSON.parse(rule.conditions || '[]'));
          setAndOr(rule.andOr);
        })
        .catch(error => {
          console.error('Error fetching rule:', error);
        });
    }
  }, [isEditMode, ruleId]);
  
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
          setColumns(Object.keys(response.data.tableData[0]));  
        })
        .catch(error => {
          console.error('Error fetching table data:', error);
        });
    }
  }, [selectedTable]);

  const addCondition = () => {
    setConditions([...conditions, { field: '', comparison: 'equal', value: '' }]);
  };

  const removeCondition = (index) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
  };

  const handleConditionChange = (index, field, value) => {
    const newConditions = [...conditions];
    newConditions[index][field] = value;
    setConditions(newConditions);
  };

  const handleSave = async () => {
    const ruleData = {
      ruleName,
      ruleInfo,
      selectedTable,
      conditions: JSON.stringify(conditions),
      andOr,
      matchingRecords: matchingRecords || 0, // וודא שיש ערך מספרי
      totalRecords: totalRecords || 0,       // וודא שיש ערך מספרי
    };
  
    try {
      if (isEditMode) {
        await axios.put(`http://localhost:3001/rules/update/${ruleId}`, ruleData);
        console.log('Rule updated successfully');
      } else {
        await axios.post('http://localhost:3001/rules/add', ruleData);
        console.log('Rule saved successfully');
      }
      navigate('/rules/list');
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };
  
  const queryDB = async () => {
    const queryData = {
        selectedTable,
        conditions,
        andOr,
    };

    try {
        const response = await fetch('http://localhost:3001/query-db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(queryData),
        });

        if (!response.ok) {
            console.error('Failed to query the database.');
            return;
        }

        const result = await response.json();
        console.log('Received result:', result);

        if (!result.records || result.records.length === 0) {
            console.log('No records found');
            return;
        }

        setMatchingRecords(result.matchingRecords);
        setTotalRecords(result.totalRecords);
        setQueryDate(result.queryDate);

        const newWindow = window.open('', '', 'width=800,height=600');
        newWindow.document.write(`
            <html>
            <head>
              <title>Query Results</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
                p { font-size: 14px; color: #555; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                .result-info { margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <h1>Query Results</h1>
              <div class="result-info">
                <p><strong>Rule Name:</strong> ${ruleName}</p>
                <p><strong>Rule Info:</strong> ${ruleInfo}</p>
                <p><strong>Records matching the query:</strong> ${result.matchingRecords} / ${result.totalRecords}</p>
                <p><strong>Query executed at:</strong> ${result.queryDate}</p>
                <p><strong>Query Conditions:</strong></p>
                <ul>
                  ${conditions.map(cond => `<li>${cond.field} ${cond.comparison} '${cond.value}'</li>`).join('')}
                </ul>
              </div>
              <table>
                <tr>
        `);

        Object.keys(result.records[0]).forEach(key => {
            newWindow.document.write(`<th>${key}</th>`);
        });
        newWindow.document.write('</tr>');

        result.records.forEach(row => {
            newWindow.document.write('<tr>');
            Object.values(row).forEach(value => {
                newWindow.document.write(`<td>${value}</td>`);
            });
            newWindow.document.write('</tr>');
        });

        newWindow.document.write('</table></body></html>');

    } catch (error) {
        console.error('Error querying the database:', error.message, error.stack);
    }
  };

  return (
    <Box sx={{ margin: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
      <h1>{isEditMode ? 'Update Rule' : 'Add new Rule'}</h1>

      <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
        <Grid item xs={6}>
          <TextField
            label="Rule Name"
            fullWidth
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Rule Info"
            fullWidth
            value={ruleInfo}
            onChange={(e) => setRuleInfo(e.target.value)}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
        <Grid item xs={12}>
          <TextField
            label="Select Table"
            select
            fullWidth
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
          >
            {tables.map((table) => (
              <MenuItem key={table} value={table}>
                {table}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {Array.isArray(conditions) && conditions.map((condition, index) => (
        <React.Fragment key={index}>
          <Card sx={{ marginBottom: '20px' }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={3}>
                  <TextField
                    label="Field"
                    select
                    fullWidth
                    value={condition.field}
                    onChange={(e) => handleConditionChange(index, 'field', e.target.value)}
                  >
                    {columns.map((column) => (
                      <MenuItem key={column} value={column}>
                        {column}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={3}>
                  <TextField
                    label="Comparison"
                    select
                    fullWidth
                    value={condition.comparison}
                    onChange={(e) => handleConditionChange(index, 'comparison', e.target.value)}
                  >
                    <MenuItem value="equal">equal</MenuItem>
                    <MenuItem value="not_equal">not equal</MenuItem>
                    <MenuItem value="is_contain">is contain</MenuItem>
                    <MenuItem value="not_contain">not contain</MenuItem>
                    <MenuItem value="is_lower">is lower</MenuItem>
                    <MenuItem value="is_higher">is higher</MenuItem>
                    <MenuItem value="is_duplicate">is duplicate</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={3}>
                  <TextField
                    label="Value"
                    fullWidth
                    value={condition.value}
                    onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                  />
                </Grid>

                <Grid item xs={1}>
                  <IconButton color="primary" onClick={addCondition}>
                    <Add />
                  </IconButton>
                </Grid>

                <Grid item xs={1}>
                  <IconButton color="secondary" onClick={() => removeCondition(index)}>
                    <Remove />
                  </IconButton>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {index < conditions.length - 1 && (
            <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="and/or"
                  fullWidth
                  value={andOr}
                  onChange={(e) => setAndOr(e.target.value)}
                >
                  <MenuItem value="AND">AND</MenuItem>
                  <MenuItem value="OR">OR</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          )}
        </React.Fragment>
      ))}

      <Grid container spacing={2}>
        <Grid item>
          <Button variant="contained" color="primary" onClick={queryDB}>
            Query DB
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="primary" onClick={handleSave}>
            {isEditMode ? 'Update' : 'Save'}
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="error" onClick={() => navigate('/rules/list')}>
            Cancel
          </Button>
        </Grid>
      </Grid>

      {matchingRecords !== null && totalRecords !== null && queryDate && (
        <Box sx={{ marginTop: '20px', padding: '10px', backgroundColor: '#e0f7fa', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
          <Typography variant="body1">
            <strong>Records matching the query:</strong> {matchingRecords} / {totalRecords}
          </Typography>
          <Typography variant="body1">
            <strong>Query executed at:</strong> {queryDate}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default AddRule;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, Grid, TextField, MenuItem, Button, Box, IconButton, Typography } from '@mui/material'; // ייבוא Typography
import { Add, Remove } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

let queryWindowRef = null;

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
  const [queryExecuted, setQueryExecuted] = useState(false);


  useEffect(() => {
    if (isEditMode) {
        axios.get(`http://localhost:3001/rules/${ruleId}`)
            .then(response => {
                const rule = response.data.rule;
                setRuleName(rule.rule_name);
                setRuleInfo(rule.rule_info);
                setSelectedTable(rule.selected_table);

                let parsedConditions;
                try {
                    parsedConditions = typeof rule.conditions === 'string' 
                        ? JSON.parse(rule.conditions) 
                        : rule.conditions;
                } catch (error) {
                    console.error('❌ Failed to parse conditions:', error);
                    parsedConditions = [];
                }

                setConditions(parsedConditions.map((cond, index, arr) => ({
                    ...cond,
                    connector: index < arr.length - 1 ? (cond.connector === "OR" ? "OR" : "AND") : null
                })));
            })
            .catch(error => {
                console.error('❌ Error fetching rule:', error);
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
    setConditions([...conditions, { field: '', comparison: 'equal', value: '', connector: 'AND' }]);
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
    console.log("🔹 Running handleSave...");

    if (!queryExecuted || matchingRecords === 0 || totalRecords === 0) {
        console.log("🔹 Running queryDB before saving rule...");
        await queryDB();
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const updatedConditions = conditions.map((condition, index) => ({
        ...condition,
        connector: index < conditions.length - 1 ? (condition.connector === "OR" ? "OR" : "AND") : null
    }));

    const ruleData = {
        ruleName,
        ruleInfo,
        selectedTable,
        conditions: updatedConditions,
        matchingRecords: matchingRecords || 0,
        totalRecords: totalRecords || 0,
    };

    console.log("📤 Sending update request:", JSON.stringify(ruleData, null, 2));

    try {
        if (isEditMode) {
            console.log("🔹 Sending update request to:", `http://localhost:3001/rules/update/${ruleId}`);
            await axios.put(`http://localhost:3001/rules/update/${ruleId}`, ruleData);
            console.log('✅ Rule updated successfully');
            navigate('/rules/list');
        } else {
            console.log("🔹 Sending add request to:", "http://localhost:3001/rules/add");
            await axios.post('http://localhost:3001/rules/add', ruleData);
            console.log('✅ Rule saved successfully');
            navigate('/rules/list');
        }
        setQueryExecuted(false);
    } catch (error) {
        console.error('❌ Error saving rule:', error);
    }
};


const queryDB = async () => {
  if (!selectedTable) {
      console.warn("⚠️ No table selected for query.");
      return;
  }

  const queryData = {
      selectedTable,
      conditions: conditions.map((condition, index) => ({
          ...condition,
          connector: index < conditions.length - 1 ? condition.connector : null,
      })),
      andOr,
      ruleId: ruleId || null, // הוספת ruleId כדי שיתעדכן בבסיס הנתונים
  };

  console.log("🔹 Query Data Sent to Server:", JSON.stringify(queryData, null, 2));

  try {
      // 🔹 בדיקת מספר הרשומות שכל תנאי מחזיר בנפרד
      const conditionResults = await Promise.all(
          queryData.conditions.map(async (condition) => {
              try {
                  const response = await axios.post('http://localhost:3001/query-condition', {
                      table: queryData.selectedTable,
                      condition
                  });

                  return response.data.count || 0;
              } catch (error) {
                  console.error('❌ Error fetching condition count:', error);
                  return 0;
              }
          })
      );

      // 🔹 ביצוע השאילתה הראשית
      const response = await fetch('http://localhost:3001/query-db', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(queryData),
      });

      if (!response.ok) {
          console.error('❌ Failed to query the database.');
          return;
      }

      const result = await response.json();
      console.log('✅ Received result:', result);

      // 🔹 עדכון המשתנים המקומיים
      setMatchingRecords(result.matchingRecords);
      setTotalRecords(result.totalRecords);

      // ✅ הצגת נתונים עם סדר נכון ומספר הרשומות לכל תנאי
      showQueryResults(result, queryData, conditionResults);

  } catch (error) {
      console.error('❌ Error querying the database:', error.message, error.stack);
  }
};


const showQueryResults = (result, queryData, conditionResults) => {
  const newWindow = window.open('', '', 'width=800,height=600');

  newWindow.document.write(`
      <html>
      <head>
          <title>Query Results</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 20px; padding: 20px; }
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
              <p><strong>Records matching the query:</strong> ${result.matchingRecords} / ${result.totalRecords}</p>
              <p><strong>Query executed at:</strong> ${result.queryDate}</p>
              <p><strong>Table Name:</strong> ${queryData.selectedTable}</p>
              <p><strong>Conditions:</strong></p>
              <ul>
                  ${queryData.conditions.map((cond, index) => 
                      `<li><strong>${cond.field}</strong> ${cond.comparison} '${cond.value}' 
                      ${index < queryData.conditions.length - 1 ? `<strong>${cond.connector}</strong>` : ''} 
                      - <span style="color:${conditionResults[index] > 0 ? 'green' : 'red'}">
                      ${conditionResults[index]} results</span></li>`
                  ).join('')}
              </ul>
          </div>
          <table>
              <tr>
  `);

  if (result.records.length > 0) {
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
  } else {
      newWindow.document.write('<p>No records found.</p></body></html>');
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

    {/* הצגת הבחירה של AND/OR בין התנאים */}
    {index < conditions.length - 1 && (
      <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
        <Grid item xs={12}>
          <TextField
            select
            label="AND/OR"
            fullWidth
            value={condition.connector || 'AND'}  // שימוש במפתח 'connector' מכל תנאי
            onChange={(e) => handleConditionChange(index, 'connector', e.target.value)} // עדכון ה-connector של התנאי המתאים
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

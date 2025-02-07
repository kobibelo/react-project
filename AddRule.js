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

  useEffect(() => {
    console.log("✅ andOr state updated:", andOr);
  }, [andOr]);
  
 
  const addCondition = () => {
    setConditions([...conditions, { field: '', comparison: 'equal', value: '', connector: 'AND' }]);
};



  const removeCondition = (index) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
  };

  const handleConditionChange = (index, field, value) => {
    const newConditions = [...conditions];

    // עדכון הערך של השדה המבוקש
    newConditions[index] = {
        ...newConditions[index],
        [field]: value,
    };

    // הבטחת שמירה על ה-connector כמו שהוא הוזן
    if (field === 'connector' && index < conditions.length - 1) {
        newConditions[index].connector = value;
    }

    setConditions(newConditions);
};

const checkDuplicatesQuery = `
SELECT NameFile1, NameFile2, COUNT(*) as count
FROM FileTransfer
GROUP BY NameFile1, NameFile2
HAVING COUNT(*) > 1;

SELECT NameFile1, NameFile2
FROM FileTransfer
WHERE LOWER(NameFile1) LIKE '%aaa%';
`;


const queryDuplicateRecords = async () => {
  if (!selectedTable || !conditions) return;

  const duplicateConditions = conditions.filter(cond => cond.comparison === 'is_duplicate');
  const otherConditions = conditions.filter(cond => cond.comparison !== 'is_duplicate');
  const selectedFields = duplicateConditions[0].field.map(f => `\`${f}\``);

  const duplicateQuery = `
    EXISTS (
      SELECT 1 
      FROM \`${selectedTable}\` dup
      WHERE ${selectedFields.map(field => `dup.${field} = ft.${field}`).join(' AND ')}
      GROUP BY ${selectedFields.join(', ')}
      HAVING COUNT(*) > 1
    )`;

  const otherConditionsQuery = otherConditions.map(cond => {
    const field = `LOWER(ft.\`${cond.field}\`)`;
    const value = cond.value.toLowerCase();
      
    switch (cond.comparison) {
      case 'is_contain': return `${field} LIKE '%${value}%'`;
      case 'not_contain': return `${field} NOT LIKE '%${value}%'`;
      case 'is_higher': return `CAST(${field} AS DECIMAL) > ${value}`;
      case 'is_lower': return `CAST(${field} AS DECIMAL) < ${value}`;
      case 'equal': return `${field} = '${value}'`;
      case 'not_equal': return `${field} != '${value}'`;
      default: return null;
    }
  }).filter(Boolean);

  let query = `
    SELECT DISTINCT ft.*
    FROM \`${selectedTable}\` ft
    WHERE `;

  if (conditions.some(c => c.connector === 'OR')) {
    query += `(${duplicateQuery}) OR (${otherConditionsQuery.join(' OR ')})`;
  } else {
    query += `${duplicateQuery} AND (${otherConditionsQuery.join(' AND ')})`;
  }

  query += ` ORDER BY ft.ID`;
  console.log('Final query:', query);

  try {
    const response = await fetch('http://localhost:3001/query-duplicates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName: selectedTable, query, debug: true })
    });

    if (!response.ok) throw new Error('Query failed');

    const result = await response.json();
    console.log('Raw query results:', result);

    if (result.success) {
      setMatchingRecords(result.records.length);
      setTotalRecords(result.totalRecords);
      showQueryResults(result, { 
        selectedTable, 
        selectedFields,
        conditions,
        totalRecords: result.totalRecords  // העברת totalRecords לפונקציית התצוגה
      });
    }
  } catch (error) {
    console.error('Query error:', error);
  }
};

const handleSave = async () => {
  console.log("🔹 Running handleSave...");

  if (!queryExecuted || matchingRecords === 0 || totalRecords === 0) {
      console.log("🔹 Running queryDB before saving rule...");
      await queryDB();
      await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 🔹 נשמור את ה-`connector` בדיוק כמו שהמשתמש הגדיר
  const updatedConditions = conditions.map((condition, index) => ({
      ...condition,
      connector: index < conditions.length - 1 ? condition.connector : null
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
    console.warn("No table selected.");
    return;
  }
  
  const hasDuplicateCheck = conditions.some(cond => cond.comparison === 'is_duplicate');
  if (hasDuplicateCheck) {
    await queryDuplicateRecords();
    return;
  }

  // המשך לשאילתה הרגילה במידה ואין IS DUPLICATE
  const queryData = {
    selectedTable,
    conditions: conditions.map((condition, index) => ({
      ...condition,
      connector: index < conditions.length - 1 ? condition.connector : null,
    })),
    ruleId: ruleId || null,
  };

  try {
    const response = await fetch('http://localhost:3001/query-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryData),
    });

    if (!response.ok) {
      console.error('❌ Failed to query the database.');
      return;
    }

    const result = await response.json();
    console.log('✅ Received result:', result);
    setMatchingRecords(result.matchingRecords);
    setTotalRecords(result.totalRecords);
    showQueryResults(result, queryData);
  } catch (error) {
    console.error('❌ Error querying the database:', error);
  }
};

const showQueryResults = async (result, queryData) => {
  if (!result?.records) return;

  const calculateConditionMatches = async (condition) => {
      if (condition.comparison === 'is_duplicate') {
          try {
              const duplicateQuery = `
                  SELECT * FROM ${queryData.selectedTable} 
                  WHERE EXISTS (
                      SELECT 1 FROM ${queryData.selectedTable} dup
                      WHERE ${condition.field.map(f => `dup.\`${f}\` = ${queryData.selectedTable}.\`${f}\``).join(' AND ')}
                      GROUP BY ${condition.field.map(f => `\`${f}\``).join(', ')}
                      HAVING COUNT(*) > 1
                  )`;
              
              const response = await fetch('http://localhost:3001/query-duplicates', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tableName: queryData.selectedTable, query: duplicateQuery })
              });
              const data = await response.json();
              return data.records.length;
          } catch (error) {
              console.error('Error calculating duplicates:', error);
              return 0;
          }
      }

      // חישוב תנאים רגילים
      return result.records.filter(record => {
          const fieldValue = String(record[condition.field] || '').toLowerCase();
          const condValue = String(condition.value).toLowerCase();
          
          switch (condition.comparison) {
              case 'is_contain': return fieldValue.includes(condValue);
              case 'not_contain': return !fieldValue.includes(condValue);
              case 'equal': return fieldValue === condValue;
              case 'not_equal': return fieldValue !== condValue;
              case 'is_higher': return Number(fieldValue) > Number(condValue);
              case 'is_lower': return Number(fieldValue) < Number(condValue);
              default: return false;
          }
      }).length;
  };

  // חישוב מספרי הרשומות לכל התנאים
  const conditionCounts = await Promise.all(
      queryData.conditions.map(async (cond) => ({
          condition: cond,
          count: await calculateConditionMatches(cond)
      }))
  );

  // יצירת החלון
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
              .conditions-box { background-color: #eef; padding: 10px; border-radius: 8px; margin-bottom: 10px; }
              .condition-item { font-size: 14px; margin: 5px 0; }
              .matching-count { color: #2196F3; margin-left: 10px; }
          </style>
      </head>
      <body>
          <h1>Query Results</h1>
          <div class="result-info">
              <p><strong>Records matching the query:</strong> ${result.records.length} / ${queryData.totalRecords}</p>
              <p><strong>Query executed at:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Table Name:</strong> ${queryData.selectedTable}</p>
          </div>

          <div class="conditions-box">
              <h3>Applied Conditions:</h3>
              ${conditionCounts.map((item, index) => `
                  <p class="condition-item">
                      ${index + 1}. <strong>${Array.isArray(item.condition.field) ? item.condition.field.join(',') : item.condition.field}</strong> 
                      ${item.condition.comparison} 
                      ${item.condition.comparison === 'is_duplicate' ? '(Duplicate Check)' : `'${item.condition.value}'`}
                      <span class="matching-count">(${item.count} records)</span>
                  </p>
                  ${item.condition.connector && index < conditionCounts.length - 1 
                      ? `<p style="font-weight: bold; color: blue;"> ${item.condition.connector} </p>`
                      : ''}`
              ).join('')}
          </div>

          ${result.records.length > 0 
              ? `<table>
                  <tr>${Object.keys(result.records[0]).map(key => `<th>${key}</th>`).join('')}</tr>
                  ${result.records.map(row => `
                      <tr>${Object.values(row).map(value => `<td>${value}</td>`).join('')}</tr>
                  `).join('')}
                 </table>`
              : '<p>No records found.</p>'
          }
      </body>
      </html>
  `);
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
    SelectProps={{
      multiple: condition.comparison === 'is_duplicate', // ריבוי בחירות רק אם זה 'IS DUPLICATE'
    }}
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

          {condition.comparison !== 'is_duplicate' && (
  <Grid item xs={3}>
    <TextField
      label="Value"
      fullWidth
      value={condition.value}
      onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
    />
  </Grid>
)}


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
        value={condition.connector || 'AND'} // שימוש בערך של התנאי
        onChange={(e) => handleConditionChange(index, 'connector', e.target.value)} // עדכון מדויק
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

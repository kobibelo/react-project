import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Tooltip, CardContent, Grid, TextField, MenuItem, Button, Box, IconButton, Typography } from '@mui/material'; // ייבוא Typography
import { Add, Remove } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import ComparisonSelect from './components/ComparisonSelect';
import RuleDescription from './components/RuleDescription';
import { showQueryResults, getFileNameAndExt, calculateSameNameDiffExtMatches } from './fileUtils';

function AddRule() {
  const navigate = useNavigate();  // יצירת הפונקציה navigate
  const { ruleId } = useParams();
  const isEditMode = !!ruleId; // מצב עריכה במידה וקיים ruleId
  const [tables, setTables] = useState([]);  
  const [selectedTable, setSelectedTable] = useState('');  
  const [ruleName, setRuleName] = useState('');
  const [ruleInfo, setRuleInfo] = useState('');
  const [conditions, setConditions] = useState([{ 
    field: '', 
    comparison: 'equal', 
    value: '',
    connector: null
  }]);
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
    setConditions([...conditions, { 
      field: '', 
      comparison: 'equal', 
      value: '',
      connector: 'AND' 
    }]);
  };



  const removeCondition = (index) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
  };

  const handleConditionChange = (index, field, value) => {
    const newConditions = [...conditions];

    if (field === 'comparison') {
        // אם משנים את סוג ההשוואה
        const isMultipleSelect = value === 'is_duplicate' || 
                                value === 'count_occurrence' ||
                                value === 'same_name_diff_ext';
        
        newConditions[index] = {
            ...newConditions[index],
            comparison: value,
            field: isMultipleSelect ? [] : '',  // איפוס השדה בהתאם לסוג
            value: ''
        };
    } else if (field === 'field') {
        // כשמשנים את השדה
        const isMultipleSelect = newConditions[index].comparison === 'is_duplicate' || 
                                newConditions[index].comparison === 'count_occurrence' ||
                                newConditions[index].comparison === 'same_name_diff_ext';

        newConditions[index] = {
            ...newConditions[index],
            field: isMultipleSelect ? value : (Array.isArray(value) ? value[0] : value)
        };
    } else {
        newConditions[index] = {
            ...newConditions[index],
            [field]: value
        };
    }

    // שמירה על ה-connector
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
  const hasSameNameDiffExt = conditions.some(cond => cond.comparison === 'same_name_diff_ext');

  const queryData = {
    selectedTable,
    conditions
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

return (
  <Box sx={{ margin: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
    <h1>{isEditMode ? 'Update Rule' : 'Add new Rule'}</h1>

    <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
      <Grid item xs={6}>
        <Tooltip title="Enter a descriptive name for this rule">
          <TextField
            label="Rule Name"
            fullWidth
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder="Example: Check for duplicate files"
          />
        </Tooltip>
      </Grid>

      <Grid item xs={6}>
        <Tooltip title="Add additional information to help understand the rule's purpose">
          <TextField
            label="Rule Info"
            fullWidth
            value={ruleInfo}
            onChange={(e) => setRuleInfo(e.target.value)}
            placeholder="Example: Finds duplicate files across different directories"
          />
        </Tooltip>
      </Grid>
    </Grid>

    <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
      <Grid item xs={12}>
        <Tooltip title="Select the table to apply this rule to">
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
        </Tooltip>
      </Grid>
    </Grid>

        {/* הוספת RuleDescription כאן - מיד אחרי בחירת הטבלה */}
        {conditions.length > 0 && (
      <RuleDescription conditions={conditions} />
    )}

    {Array.isArray(conditions) && conditions.map((condition, index) => (
      <React.Fragment key={index}>
        <Card sx={{ marginBottom: '20px' }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={3}>
                <Tooltip title="Select the field(s) to check in this condition">
                  <TextField
                    label="Field"
                    select
                    fullWidth
                    SelectProps={{
                      multiple: condition.comparison === 'is_duplicate' || 
                              condition.comparison === 'count_occurrence' ||
                              condition.comparison === 'same_name_diff_ext'
                    }}
                    value={
                      condition.comparison === 'is_duplicate' || 
                      condition.comparison === 'count_occurrence' ||
                      condition.comparison === 'same_name_diff_ext'
                        ? (Array.isArray(condition.field) ? condition.field : [])
                        : condition.field
                    }
                    onChange={(e) => handleConditionChange(index, 'field', e.target.value)}
                  >
                    {columns.map((column) => (
                      <MenuItem key={column} value={column}>
                        {column}
                      </MenuItem>
                    ))}
                  </TextField>
                </Tooltip>
              </Grid>

              <Grid item xs={3}>
                <ComparisonSelect
                  value={condition.comparison}
                  onChange={(e) => handleConditionChange(index, 'comparison', e.target.value)}
                />
              </Grid>

              {condition.comparison !== 'is_duplicate' && condition.comparison !== 'count_occurrence' && (
                <Grid item xs={3}>
                  <Tooltip title="Enter the value to compare against">
                    <TextField
                      label="Value"
                      fullWidth
                      value={condition.value}
                      onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                    />
                  </Tooltip>
                </Grid>
              )}

              <Grid item xs={1}>
                <Tooltip title="Add new condition">
                  <IconButton color="primary" onClick={addCondition}>
                    <Add />
                  </IconButton>
                </Tooltip>
              </Grid>

              <Grid item xs={1}>
                <Tooltip title="Remove this condition">
                  <IconButton color="secondary" onClick={() => removeCondition(index)}>
                    <Remove />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {index < conditions.length - 1 && (
          <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
            <Grid item xs={12}>
              <Tooltip title="Choose AND to require all conditions to be met, or OR if any condition being met is sufficient">
                <TextField
                  select
                  label="AND/OR"
                  fullWidth
                  value={condition.connector || 'AND'}
                  onChange={(e) => handleConditionChange(index, 'connector', e.target.value)}
                >
                  <MenuItem value="AND">AND (all conditions must be met)</MenuItem>
                  <MenuItem value="OR">OR (any condition can be met)</MenuItem>
                </TextField>
              </Tooltip>
            </Grid>
          </Grid>
        )}
      </React.Fragment>
    ))}


    <Grid container spacing={2}>
      <Grid item>
        <Tooltip title="Execute the query to see matching records">
          <Button variant="contained" color="primary" onClick={queryDB}>
            Query DB
          </Button>
        </Tooltip>
      </Grid>
      <Grid item>
        <Tooltip title={isEditMode ? "Save changes to the rule" : "Save the new rule"}>
          <Button variant="contained" color="primary" onClick={handleSave}>
            {isEditMode ? 'Update' : 'Save'}
          </Button>
        </Tooltip>
      </Grid>
      <Grid item>
        <Tooltip title="Cancel and return to rules list">
          <Button variant="contained" color="error" onClick={() => navigate('/rules/list')}>
            Cancel
          </Button>
        </Tooltip>
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

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Tooltip, CardContent, Grid, TextField, MenuItem, Button,
   Box, IconButton, Typography,  ListItemText  } from '@mui/material'; 
import Checkbox from '@mui/material/Checkbox';
import { Add, Remove } from '@mui/icons-material'; 
import { useParams, useNavigate } from 'react-router-dom';
import ComparisonSelect from './components/ComparisonSelect';
import RuleDescription from './components/RuleDescription';
import ConditionRow from './ConditionRow';
// ייבוא הקומפוננטה החדשה
import RuleForm from './components/RuleForm';
import { showQueryResults, getFileNameAndExt, calculateSameNameDiffExtMatches } from './fileUtils';

function AddRule() {
  const navigate = useNavigate();
  const { ruleId } = useParams();
  const isEditMode = !!ruleId;
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
  const [relatedTables, setRelatedTables] = useState([]);
  const [relatedFields, setRelatedFields] = useState([]);

  // טעינת נתוני חוק קיים במצב עריכה
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
  

  // טעינת טבלאות קשורות
  useEffect(() => {
    axios.get('http://localhost:3001/get-mapping-tables')
      .then(response => {
        setRelatedTables(response.data.tables);
      })
      .catch(error => {
        console.error('Error fetching tables:', error);
      });
  }, []);

  // טעינת שדות של טבלה קשורה כשהיא נבחרת
  useEffect(() => {
    if (conditions.some(c => c.comparison === 'related_count' && c.relatedTable)) {
      const relatedTable = conditions.find(c => c.comparison === 'related_count').relatedTable;
      
      axios.post('http://localhost:3001/fetch-table-data', { tableName: relatedTable })
        .then(response => {
          setRelatedFields(Object.keys(response.data.tableData[0]));
        })
        .catch(error => {
          console.error('Error fetching related table fields:', error);
        });
    }
  }, [conditions]);
 
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

    if (field === 'field') {
        const isMultipleSelect = ['is_duplicate', 'count_occurrence', 'same_name_diff_ext', 'same_ext_diff_names', 'fields_equal'].includes(newConditions[index].comparison);
        
        newConditions[index] = {
            ...newConditions[index],
            field: isMultipleSelect ? value : (Array.isArray(value) ? value[0] : value)
        };
    } else if (field === 'comparison') {
        const isMultipleSelect = ['is_duplicate', 'count_occurrence', 'same_name_diff_ext', 'same_ext_diff_names', 'fields_equal'].includes(value);
        
        if (value === 'related_count') {
          const previousConditionField = index > 0 
              ? (Array.isArray(conditions[index-1].field) 
                  ? conditions[index-1].field[0] 
                  : conditions[index-1].field)
              : '';
      
          newConditions[index] = {
              ...newConditions[index],
              comparison: value,
              field: previousConditionField,
              relatedTable: '',
              relatedField: '',
              selectedRelatedColumns: [],
              value: '1'
          };
      } else {
            newConditions[index] = {
                ...newConditions[index],
                comparison: value,
                field: isMultipleSelect ? 
                    (Array.isArray(newConditions[index].field) ? newConditions[index].field : []) : 
                    (Array.isArray(newConditions[index].field) ? newConditions[index].field[0] : newConditions[index].field)
            };
        }
    } else if (field === 'relatedTable') {
        newConditions[index].relatedTable = value;
        newConditions[index].relatedField = '';
        
        if (value) {
            axios.post('http://localhost:3001/fetch-table-data', { tableName: value })
              .then(response => {
                  setRelatedFields(Object.keys(response.data.tableData[0]));
              })
              .catch(error => {
                  console.error('Error fetching related table fields:', error);
              });
        }
    } else if (field === 'relatedField') {
        newConditions[index].relatedField = Array.isArray(value) ? value : [value];
    } else {
        newConditions[index] = {
            ...newConditions[index],
            [field]: value
        };
    }

    if (field === 'connector' && index < conditions.length - 1) {
        newConditions[index].connector = value;
    }

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

    console.log("📤 Sending request:", JSON.stringify(ruleData, null, 2));

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
      setQueryDate(new Date().toLocaleString());
      showQueryResults(result, queryData);
    } catch (error) {
      console.error('❌ Error querying the database:', error);
    }
  };

  return (
    <Box sx={{ margin: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
      <h1>{isEditMode ? 'Update Rule' : 'Add new Rule'}</h1>

      {/* שימוש בקומפוננטה החדשה במקום הקוד הקודם */}
      <RuleForm
        ruleName={ruleName}
        setRuleName={setRuleName}
        ruleInfo={ruleInfo}
        setRuleInfo={setRuleInfo}
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
        tables={tables}
      />

      {/* שאר הקוד נשאר זהה */}
      {conditions.length > 0 && (
        <RuleDescription conditions={conditions} />
      )}

      {Array.isArray(conditions) && conditions.map((condition, index) => (
        <React.Fragment key={index}>
          <Card sx={{ marginBottom: '20px' }}>
            <CardContent>
            <ConditionRow
              key={index}
              condition={condition}
              index={index}
              onConditionChange={handleConditionChange}
              onAddCondition={addCondition}
              onRemoveCondition={removeCondition}
              columns={columns}
              relatedTables={relatedTables}
              relatedFields={relatedFields}
            />
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
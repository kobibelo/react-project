import React, { useEffect, useState } from 'react';
import { Grid, TextField, MenuItem, IconButton, Tooltip, InputAdornment, FormControl, InputLabel, Select, Checkbox, ListItemText } from '@mui/material';
import { Add, Remove, FilterList } from '@mui/icons-material';
import ComparisonSelect from './components/ComparisonSelect';

const ConditionRow = ({ 
  condition, 
  index, 
  onConditionChange, 
  onAddCondition, 
  onRemoveCondition, 
  columns, 
  relatedTables, 
  relatedFields 
}) => {
  // Define which comparison types require multiple field selection
  const isMultipleFieldSelection = (comparison) => 
    ['is_duplicate', 'count_occurrence', 'same_name_diff_ext', 'same_ext_diff_names', 'fields_equal'].includes(comparison);

  // Track the current comparison type
  const [currentComparison, setCurrentComparison] = useState(condition.comparison || 'equal');
  
  // Update local state when external condition changes
  useEffect(() => {
    setCurrentComparison(condition.comparison || 'equal');
  }, [condition.comparison]);

  // Handle change in comparison type
  const handleComparisonChange = (e) => {
    const newComparison = e.target.value;
    setCurrentComparison(newComparison);
    
    // Update parent component through callback
    onConditionChange(index, 'comparison', newComparison);
  };

  const renderFieldSelection = () => {
    // Skip for special conditions that have their own field handling
    if (currentComparison === 'related_count' || currentComparison === 'execution_count') {
      return null;
    }
    
    // Conditions that ALWAYS support multiple field selection
    const alwaysMultipleFieldComparisons = [
      'is_duplicate', 
      'count_occurrence', 
      'same_name_diff_ext', 
      'same_ext_diff_names', 
      'fields_equal'
    ];
  
    // Determine if multiple selection is allowed
    const isMultipleAllowed = alwaysMultipleFieldComparisons.includes(currentComparison);
    
    // Ensure field is an array
    const fieldArray = Array.isArray(condition.field) ? condition.field : 
                      (condition.field ? [condition.field] : []);
                      
    return (
      <Grid item xs={3}>
        <FormControl fullWidth>
          <InputLabel>Select Field(s)</InputLabel>
          <Select
            multiple={isMultipleAllowed}
            value={fieldArray}
            onChange={(e) => {
              // For single selection comparisons, take first value
              const value = isMultipleAllowed 
                ? e.target.value 
                : (Array.isArray(e.target.value) ? e.target.value[0] : e.target.value);
              
              onConditionChange(index, 'field', value);
            }}
            renderValue={(selected) => 
              Array.isArray(selected) ? selected.join(', ') : selected
            }
            label="Select Field(s)"
          >
            {columns.map((column) => (
              <MenuItem key={column} value={column}>
                {isMultipleAllowed && (
                  <Checkbox checked={fieldArray.indexOf(column) > -1} />
                )}
                <ListItemText primary={column} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    );
  };

  return (
    <Grid container spacing={2} alignItems="center">
      {/* Comparison type selector - always visible */}
      <Grid item xs={3}>
        <ComparisonSelect
          value={condition.comparison || 'equal'}
          onChange={handleComparisonChange}
        />
      </Grid>

      {/* Field selection - depends on comparison type */}
      {renderFieldSelection()}

      {/* Custom UI for related_count comparison */}
      {currentComparison === 'related_count' && (
        <>
          <Grid item xs={3}>
            <Tooltip title="Select the field to link with related table">
              <TextField
                label="Main Field"
                select
                fullWidth
                value={condition.field || ''}
                onChange={(e) => onConditionChange(index, 'field', e.target.value)}
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
            <Tooltip title="Select the related table">
              <TextField
                label="Related Table"
                select
                fullWidth
                value={condition.relatedTable || ''}
                onChange={(e) => onConditionChange(index, 'relatedTable', e.target.value)}
              >
                {relatedTables.map((table) => (
                  <MenuItem key={table} value={table}>
                    {table}
                  </MenuItem>
                ))}
              </TextField>
            </Tooltip>
          </Grid>

          <Grid item xs={3}>
            <Tooltip title="Select the field(s) in the related table to match">
              <TextField
                label="Related Field"
                select
                fullWidth
                SelectProps={{
                  multiple: true
                }}
                value={Array.isArray(condition.relatedField) ? condition.relatedField : []}
                onChange={(e) => onConditionChange(index, 'relatedField', e.target.value)}
                disabled={!condition.relatedTable}
              >
                {relatedFields.map((field) => (
                  <MenuItem key={field} value={field}>
                    {field}
                  </MenuItem>
                ))}
              </TextField>
            </Tooltip>
          </Grid>
          
          {/* Filter Condition field */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Tooltip title="Enter SQL condition to filter history records (e.g. LastOutput = 'SUCCESS')">
              <TextField
                label="Filter Condition"
                fullWidth
                value={condition.filterCondition || ''}
                onChange={(e) => onConditionChange(index, 'filterCondition', e.target.value)}
                placeholder="Example: LastOutput = 'SUCCESS' or ProcessTime < 60"
                helperText="Additional SQL filter for history records (applied with AND)"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterList color="primary" fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Tooltip>
          </Grid>
        </>
      )}

      {/* Custom UI for execution_count comparison */}
      {currentComparison === 'execution_count' && (
        <>
          <Grid item xs={3}>
            <Tooltip title="Select the linking field in the main table">
              <TextField
                label="Main Table Field"
                select
                fullWidth
                value={condition.field || ''}
                onChange={(e) => onConditionChange(index, 'field', e.target.value)}
              >
                {columns.map((column) => (
                  <MenuItem key={column} value={column}>
                    {column}
                  </MenuItem>
                ))}
              </TextField>
            </Tooltip>
          </Grid>
          
          <Grid item xs={2}>
            <Tooltip title="Select the related history table">
              <TextField
                label="History Table"
                select
                fullWidth
                value={condition.relatedTable || ''}
                onChange={(e) => onConditionChange(index, 'relatedTable', e.target.value)}
              >
                {relatedTables.map((table) => (
                  <MenuItem key={table} value={table}>
                    {table}
                  </MenuItem>
                ))}
              </TextField>
            </Tooltip>
          </Grid>
          
          <Grid item xs={2}>
            <Tooltip title="Select the linking field in the history table">
              <TextField
                label="History Table Field"
                select
                fullWidth
                value={condition.relatedField || ''}
                onChange={(e) => onConditionChange(index, 'relatedField', e.target.value)}
                disabled={!condition.relatedTable}
              >
                {relatedFields.map((field) => (
                  <MenuItem key={field} value={field}>
                    {field}
                  </MenuItem>
                ))}
              </TextField>
            </Tooltip>
          </Grid>
          
          <Grid item xs={2}>
            <Tooltip title="Enter the maximum number of executions (includes processes that never ran)">
              <TextField
                label="Maximum Executions"
                type="number"
                fullWidth
                value={condition.value || '10'}
                onChange={(e) => onConditionChange(index, 'value', e.target.value)}
                placeholder="10"
                helperText="Enter 0 to show only processes that never ran"
              />
            </Tooltip>
          </Grid>
          
          {/* Optional additional filter condition */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Tooltip title="Enter additional SQL filter condition (e.g., LastOutput = 'SUCCESS')">
              <TextField
                label="Additional Filter Condition"
                fullWidth
                value={condition.filterCondition || ''}
                onChange={(e) => onConditionChange(index, 'filterCondition', e.target.value)}
                placeholder="Example: LastOutput = 'SUCCESS' or ProcessTime < 60"
                helperText="Additional SQL condition to filter history records (applied with AND)"
              />
            </Tooltip>
          </Grid>
        </>
      )}

      {/* Value field for conditions that require a comparison value */}
      {!isMultipleFieldSelection(currentComparison) && 
       currentComparison !== 'related_count' && 
       currentComparison !== 'execution_count' && (
        <Grid item xs={3}>
          <Tooltip title="Enter the value to compare against">
            <TextField
              label="Value"
              fullWidth
              value={condition.value || ''}
              onChange={(e) => onConditionChange(index, 'value', e.target.value)}
            />
          </Tooltip>
        </Grid>
      )}

      {/* Add/Remove buttons */}
      <Grid item xs={1}>
        <Tooltip title="Add new condition">
          <IconButton color="primary" onClick={onAddCondition}>
            <Add />
          </IconButton>
        </Tooltip>
      </Grid>

      <Grid item xs={1}>
        <Tooltip title="Remove this condition">
          <IconButton color="secondary" onClick={() => onRemoveCondition(index)}>
            <Remove />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  );
};

export default ConditionRow;
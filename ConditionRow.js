import React from 'react';
import { Grid, TextField, MenuItem, IconButton, Tooltip, InputAdornment } from '@mui/material';
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
  // פונקציה לבדיקה אם נדרשה בחירת שדות מרובים
  const isMultipleFieldSelection = (comparison) => 
    ['is_duplicate', 'count_occurrence', 'same_name_diff_ext', 'same_ext_diff_names', 'fields_equal'].includes(comparison);

  return (
    <Grid container spacing={2} alignItems="center">
      {/* תנאי הצגת שדה ראשי */}
      {!(
        ['related_count', 'execution_count', 'is_duplicate', 'count_occurrence'].includes(condition.comparison)
      ) && (
        <Grid item xs={3}>
          <Tooltip title="Select the field(s) to check in this condition">
            <TextField
              label="Field"
              select
              fullWidth
              SelectProps={{
                multiple: isMultipleFieldSelection(condition.comparison)
              }}
              value={
                isMultipleFieldSelection(condition.comparison)
                  ? (Array.isArray(condition.field) ? condition.field : [])
                  : condition.field
              }
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
      )}

      <Grid item xs={3}>
        <ComparisonSelect
          value={condition.comparison}
          onChange={(e) => onConditionChange(index, 'comparison', e.target.value)}
        />
      </Grid>

      {condition.comparison === 'related_count' && (
        <>
          <Grid item xs={6}>
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

          <Grid item xs={6}>
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

      {condition.comparison === 'execution_count' && (
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
          
          <Grid item xs={3}>
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
          
          <Grid item xs={3}>
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
          
          <Grid item xs={3}>
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

      {(
        condition.comparison !== 'is_duplicate' && 
        condition.comparison !== 'count_occurrence' && 
        condition.comparison !== 'execution_count'
      ) && (
        <Grid item xs={3}>
          <Tooltip title="Enter the value to compare against">
            <TextField
              label="Value"
              fullWidth
              value={condition.value}
              onChange={(e) => onConditionChange(index, 'value', e.target.value)}
            />
          </Tooltip>
        </Grid>
      )}

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
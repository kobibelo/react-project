import React from 'react';
import { Grid, TextField, MenuItem, IconButton, Tooltip } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import ComparisonSelect from './components/ComparisonSelect';

const ConditionRow = ({ condition, index, onConditionChange, onAddCondition, onRemoveCondition, columns, relatedTables, relatedFields }) => {
  return (
    <Grid container spacing={2} alignItems="center">
      {condition.comparison !== 'related_count' && (
        <Grid item xs={3}>
          <Tooltip title="Select the field(s) to check in this condition">
            <TextField
              label="Field"
              select
              fullWidth
              SelectProps={{
                multiple: ['is_duplicate', 'count_occurrence', 'same_name_diff_ext', 'same_ext_diff_names', 'fields_equal'].includes(condition.comparison)
              }}
              value={
                ['is_duplicate', 'count_occurrence', 'same_name_diff_ext', 'same_ext_diff_names', 'fields_equal'].includes(condition.comparison)
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
        </>
      )}

      {condition.comparison !== 'is_duplicate' && condition.comparison !== 'count_occurrence' && (
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
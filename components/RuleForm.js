import React from 'react';
import { Grid, TextField, MenuItem, Tooltip } from '@mui/material';

function RuleForm({ 
  ruleName, 
  setRuleName, 
  ruleInfo, 
  setRuleInfo, 
  selectedTable, 
  setSelectedTable, 
  tables 
}) {
  return (
    <>
      <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
        <Grid item xs={12}>
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

        <Grid item xs={12}>
          <Tooltip title="Add additional information to help understand the rule's purpose">
            <TextField
              label="Rule Info"
              fullWidth
              multiline
              rows={3}
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
    </>
  );
}

export default RuleForm;
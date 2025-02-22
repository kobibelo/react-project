import React from 'react';
import { TextField, MenuItem, Tooltip, IconButton, Box } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const ComparisonSelect = ({ value, onChange }) => {
  const comparisonOptions = [
    {
      value: 'equal',
      label: 'equals',
      description: 'Finds exact matches for the entered value'
    },
    {
      value: 'not_equal',
      label: 'not equals',
      description: 'Finds values that are different from the entered value'
    },
    {
      value: 'is_contain',
      label: 'contains',
      description: 'Finds values containing the entered text'
    },
    {
      value: 'not_contain',
      label: 'not contains',
      description: 'Finds values that do not contain the entered text'
    },
    {
      value: 'is_lower',
      label: 'is lower than',
      description: 'Finds values lower than the entered value'
    },
    {
      value: 'is_higher',
      label: 'is higher than',
      description: 'Finds values higher than the entered value'
    },
    {
      value: 'is_duplicate',
      label: 'has duplicates',
      description: 'Finds records that have duplicates in the selected fields. Multiple fields can be selected'
    },
    {
      value: 'same_name_diff_ext',
      label: 'same name, different extension',
      description: 'Finds files with the same name but different extensions (e.g., file.doc and file.pdf). Suitable for fields containing file names'
    },
    {
      value: 'count_occurrence',
      label: 'count occurrences',
      description: 'Counts how many times a value appears in the selected field'
    }
  ];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <TextField
        select
        fullWidth
        value={value}
        onChange={onChange}
        label="Comparison"
        SelectProps={{
          MenuProps: {
            PaperProps: {
              style: {
                width: '300px'
              }
            }
          }
        }}
      >
        {comparisonOptions.map((option) => (
          <MenuItem 
            key={option.value} 
            value={option.value}
            style={{ paddingRight: '8px' }} // מרווח קטן יותר בצד ימין
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              width: '100%',
              position: 'relative',
              gap: '8px' // מרווח בין הטקסט לאייקון
            }}>
              <span style={{ 
                fontSize: '15px',
                fontWeight: '500',
                flexGrow: 1
              }}>
                {option.label}
              </span>
              <Tooltip 
                title={
                  <div style={{ 
                    fontSize: '14px', 
                    padding: '8px',
                    lineHeight: '1.4'
                  }}>
                    {option.description}
                  </div>
                } 
                placement="left"
                arrow
              >
                <IconButton 
                  size="small" 
                  style={{ 
                    color: '#666',
                    padding: '4px'
                  }}
                >
                  <HelpOutlineIcon 
                    style={{ 
                      fontSize: '20px'
                    }} 
                  />
                </IconButton>
              </Tooltip>
            </Box>
          </MenuItem>
        ))}
      </TextField>
    </div>
  );
};

export default ComparisonSelect;
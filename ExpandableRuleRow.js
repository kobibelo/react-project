import React, { useState } from 'react';
import { 
  TableRow,
  TableCell,
  IconButton,
  Collapse,
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { DynamicFeedRounded, TuneRounded, DeleteSweepRounded } from '@mui/icons-material';

// Function to get color based on risk level
const getRiskColor = (risk) => {
  switch (risk) {
    case 'Critical': return '#d32f2f';
    case 'High': return '#f44336';
    case 'Medium': return '#ff9800';
    case 'Low': return '#4caf50';
    default: return '#757575';
  }
};

// Function to get friendly name for comparison type
const getComparisonName = (comparisonType) => {
  switch (comparisonType) {
    case 'is_duplicate': return 'Duplicates';
    case 'same_name_diff_ext': return 'Same name, diff ext';
    case 'same_ext_diff_names': return 'Same ext, diff names';
    case 'is_contain': return 'Contains';
    case 'not_contain': return 'Not contains';
    case 'equal': return 'Equals';
    case 'not_equal': return 'Not equals';
    case 'is_higher': return 'Greater than';
    case 'is_lower': return 'Less than';
    case 'fields_equal': return 'Fields equality';
    case 'count_occurrence': return 'Count occurrences';
    case 'related_count': return 'Related records';
    default: return comparisonType;
  }
};

// Function to get color for comparison type
const getComparisonColor = (comparisonType) => {
  switch (comparisonType) {
    case 'is_duplicate': return '#e3f2fd';
    case 'same_name_diff_ext': return '#f3e5f5';
    case 'same_ext_diff_names': return '#f3e5f5';
    case 'is_contain': return '#e8f5e9';
    case 'not_contain': return '#ffebee';
    case 'equal': return '#e8f5e9';
    case 'not_equal': return '#ffebee';
    case 'is_higher': return '#fff8e1';
    case 'is_lower': return '#fff8e1';
    case 'fields_equal': return '#e0f7fa';
    case 'count_occurrence': return '#e8eaf6';
    case 'related_count': return '#fce4ec';
    default: return '#f5f5f5';
  }
};

const ExpandableRuleRow = ({ rule, visibleColumns, onToggleStatus, onDelete, onEdit, onShowResults }) => {
  const [open, setOpen] = useState(false);
  
  // Convert conditions string to JSON if needed
  const getConditions = () => {
    try {
      return typeof rule.conditions === 'string' 
        ? JSON.parse(rule.conditions) 
        : rule.conditions || [];
    } catch (error) {
      console.error('Error parsing conditions:', error);
      return [];
    }
  };
  
  const conditions = getConditions();
  
  // Create a human-readable description of the rule
  const getRuleDescription = () => {
    if (conditions.length === 0) return "No conditions defined for this rule";
    
    let description = `Checking `;
    
    // Map condition types to categories
    const comparisonTypes = {};
    conditions.forEach(condition => {
      const type = condition.comparison;
      if (!comparisonTypes[type]) comparisonTypes[type] = [];
      comparisonTypes[type].push(condition);
    });
    
    // Build description based on condition types
    const descParts = [];
    
    if (comparisonTypes['is_duplicate']) {
      descParts.push(`duplicates in fields ${comparisonTypes['is_duplicate'].map(c => 
        Array.isArray(c.field) ? c.field.join(', ') : c.field).join(', ')}`);
    }
    
    if (comparisonTypes['same_name_diff_ext']) {
      descParts.push(`files with same name but different extensions`);
    }
    
    if (comparisonTypes['is_contain'] || comparisonTypes['not_contain']) {
      const containFields = [...(comparisonTypes['is_contain'] || []), ...(comparisonTypes['not_contain'] || [])];
      descParts.push(`value containment in fields ${containFields.map(c => c.field).join(', ')}`);
    }
    
    if (comparisonTypes['equal'] || comparisonTypes['not_equal']) {
      const equalFields = [...(comparisonTypes['equal'] || []), ...(comparisonTypes['not_equal'] || [])];
      descParts.push(`equality in fields ${equalFields.map(c => c.field).join(', ')}`);
    }
    
    if (comparisonTypes['is_higher'] || comparisonTypes['is_lower']) {
      const compareFields = [...(comparisonTypes['is_higher'] || []), ...(comparisonTypes['is_lower'] || [])];
      descParts.push(`numeric comparison in fields ${compareFields.map(c => c.field).join(', ')}`);
    }
    
    if (comparisonTypes['count_occurrence']) {
      descParts.push(`occurrence counting`);
    }
    
    if (comparisonTypes['related_count']) {
      descParts.push(`related record relationships`);
    }
    
    return description + descParts.join(', ') + ` in table ${rule.selected_table}`;
  };

  return (
    <>
      <TableRow 
        sx={{ 
          '& > *': { borderBottom: 'unset' },
          backgroundColor: rule.status === 0 ? 'rgba(244, 67, 54, 0.04)' : 'inherit',
          opacity: rule.status === 0 ? 0.9 : 1,
          '&:hover': {
            backgroundColor: '#f5f5f5'
          }
        }}
      >
        {/* Expand button */}
        <TableCell style={{ width: '40px', padding: '0 8px' }}>
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
            sx={{ 
              backgroundColor: open ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
              transition: 'all 0.2s'
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        
        {/* Regular columns */}
        {visibleColumns.status && (
          <TableCell>
            {rule.status === 1 ? (
              <CheckCircleIcon style={{ color: 'green' }} />
            ) : (
              <CancelIcon style={{ color: 'red' }} />
            )}
          </TableCell>
        )}
        
        {visibleColumns.id && (
          <TableCell>{rule.id}</TableCell>
        )}
        
        {visibleColumns.ruleName && (
          <TableCell>{rule.rule_name}</TableCell>
        )}
        
        {visibleColumns.ruleInfo && (
          <TableCell>
            <Typography 
              variant="body2" 
              sx={{ 
                maxHeight: '70px',
                overflow: 'auto',
                padding: '5px',
                backgroundColor: '#fafafa',
                borderRadius: '4px',
                border: '1px solid #f0f0f0'
              }}
            >
              {rule.rule_info}
            </Typography>
          </TableCell>
        )}
        
        {visibleColumns.comparison && (
          <TableCell>
            {conditions.slice(0, 2).map((condition, index) => (
              <Chip
                key={index}
                label={getComparisonName(condition.comparison)}
                size="small"
                sx={{
                  backgroundColor: getComparisonColor(condition.comparison),
                  margin: '2px',
                  fontSize: '0.8rem'
                }}
              />
            ))}
            {conditions.length > 2 && (
              <Chip
                label={`+${conditions.length - 2} more`}
                size="small"
                sx={{ margin: '2px', backgroundColor: '#f5f5f5' }}
              />
            )}
          </TableCell>
        )}
        
        {visibleColumns.sourceTable && (
          <TableCell>{rule.selected_table}</TableCell>
        )}
        
        {visibleColumns.matchTotal && (
          <TableCell>
            <Box sx={{ 
              backgroundColor: '#e8f4fd', 
              padding: '6px 10px', 
              borderRadius: '4px',
              display: 'inline-block'
            }}>
              <Typography variant="body2" fontWeight="bold">
                {rule.matching_records !== null ? rule.matching_records : 'N/A'} / {rule.total_records !== null ? rule.total_records : 'N/A'}
              </Typography>
            </Box>
          </TableCell>
        )}
        
        {visibleColumns.impactPercentage && (
          <TableCell>
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8f8f8',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #e0e0e0',
              minWidth: '70px'
            }}>
              <Typography 
                variant="body2"
                style={{ 
                  fontWeight: 'bold',
                  color: parseFloat(rule.impact_percentage || '0') >= 30 ? '#d32f2f' : 
                        parseFloat(rule.impact_percentage || '0') >= 15 ? '#ff9800' : '#4caf50'
                }}
              >
                {rule.impact_percentage || 'N/A'}
              </Typography>
            </Box>
          </TableCell>
        )}
        
        {visibleColumns.riskLevel && (
          <TableCell>
            <Chip
              label={rule.business_risk || 'N/A'}
              size="small"
              sx={{
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: getRiskColor(rule.business_risk)
              }}
            />
          </TableCell>
        )}
        
        {visibleColumns.lastUpdate && (
          <TableCell>
            <Typography 
              variant="body2"
              sx={{
                backgroundColor: '#f0f0f0',
                padding: '5px 8px',
                borderRadius: '4px',
                fontSize: '0.85rem'
              }}
            >
              {new Date(rule.last_update).toLocaleString()}
            </Typography>
          </TableCell>
        )}
        
        {visibleColumns.actions && (
          <TableCell>
            <IconButton 
              color="primary" 
              onClick={() => onShowResults(rule)}
              sx={{
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                margin: '0 4px'
              }}
            >
              <DynamicFeedRounded style={{ color: '#1976d2', fontSize: '20px' }} />
            </IconButton>
            <IconButton 
              color="primary" 
              onClick={() => onEdit(rule.id)}
              sx={{
                backgroundColor: 'rgba(76, 175, 80, 0.08)',
                margin: '0 4px'
              }}
            >
              <TuneRounded style={{ color: '#4caf50', fontSize: '20px' }} />
            </IconButton>
            <IconButton 
              color="error" 
              onClick={() => onDelete(rule.id)}
              sx={{
                backgroundColor: 'rgba(244, 67, 54, 0.08)',
                margin: '0 4px'
              }}
            >
              <DeleteSweepRounded style={{ color: '#f44336', fontSize: '20px' }} />
            </IconButton>
          </TableCell>
        )}
      </TableRow>
      
      {/* Expanded details row */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Paper 
              sx={{ 
                margin: 2,
                padding: 3,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: 2
              }}
              elevation={0}
            >
              <Grid container spacing={3}>
                {/* General rule information */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom component="div" sx={{ display: 'flex', alignItems: 'center', color: '#1976d2' }}>
                      <InfoOutlinedIcon sx={{ mr: 1 }} />
                      Rule Details
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Rule Name:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {rule.rule_name}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Rule Description:
                      </Typography>
                      <Typography variant="body1">
                        {rule.rule_info}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Simple Description:
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        backgroundColor: '#fffde7', 
                        p: 1, 
                        borderRadius: 1,
                        border: '1px solid #fff9c4'
                      }}>
                        {getRuleDescription()}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mr: 1 }}>
                        Status:
                      </Typography>
                      <Chip
                        icon={rule.status === 1 ? <CheckCircleIcon /> : <CancelIcon />}
                        label={rule.status === 1 ? 'Active' : 'Inactive'}
                        color={rule.status === 1 ? 'success' : 'error'}
                        variant="outlined"
                        size="small"
                        onClick={() => onToggleStatus(rule)}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Risk Level:
                      </Typography>
                      <Chip
                        label={rule.business_risk || 'N/A'}
                        sx={{
                          fontWeight: 'bold',
                          color: 'white',
                          backgroundColor: getRiskColor(rule.business_risk)
                        }}
                      />
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Last Update:
                      </Typography>
                      <Typography variant="body2">
                        {new Date(rule.last_update).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                {/* Table data and conditions */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom component="div" sx={{ display: 'flex', alignItems: 'center', color: '#1976d2' }}>
                      <TableChartOutlinedIcon sx={{ mr: 1 }} />
                      Table Data and Results
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mr: 1 }}>
                        Source Table:
                      </Typography>
                      <Chip
                        label={rule.selected_table}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Matching / Total:
                      </Typography>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#e8f5e9',
                        p: 1,
                        borderRadius: 1,
                        border: '1px solid #c8e6c9'
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32', mr: 1 }}>
                          {rule.matching_records}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1b5e20' }}>
                          out of {rule.total_records} records 
                          ({parseFloat(rule.impact_percentage || '0').toFixed(1)}%)
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="h6" gutterBottom component="div" sx={{ display: 'flex', alignItems: 'center', color: '#1976d2' }}>
                      <CompareArrowsIcon sx={{ mr: 1 }} />
                      Rule Conditions
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ maxHeight: '200px', overflowY: 'auto', p: 1 }}>
                      {conditions.length > 0 ? (
                        conditions.map((condition, index) => (
                          <Paper 
                            key={index} 
                            sx={{ 
                              p: 1, 
                              mb: 1, 
                              backgroundColor: getComparisonColor(condition.comparison),
                              border: '1px solid #e0e0e0'
                            }}
                            elevation={0}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                Condition {index + 1}: {getComparisonName(condition.comparison)}
                              </Typography>
                              {index < conditions.length - 1 && condition.connector && (
                                <Chip
                                  label={condition.connector.toUpperCase()}
                                  size="small"
                                  color={condition.connector === 'and' ? 'primary' : 'secondary'}
                                  sx={{ height: '20px', fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                            
                            <Divider sx={{ my: 0.5 }} />
                            
                            <Grid container spacing={1}>
                              {/* Field */}
                              <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">
                                  Field:
                                </Typography>
                                <Typography variant="body2">
                                  {Array.isArray(condition.field) 
                                    ? condition.field.join(', ') 
                                    : condition.field || 'N/A'}
                                </Typography>
                              </Grid>
                              
                              {/* Value */}
                              {condition.value !== undefined && (
                                <Grid item xs={8}>
                                  <Typography variant="caption" color="text.secondary">
                                    Value:
                                  </Typography>
                                  <Typography variant="body2" 
                                    sx={{ 
                                      wordBreak: 'break-word', 
                                      backgroundColor: '#fff',
                                      p: 0.5,
                                      borderRadius: 0.5,
                                      border: '1px solid #eee'
                                    }}
                                  >
                                    {condition.value}
                                  </Typography>
                                </Grid>
                              )}
                              
                              {/* Related table if applicable */}
                              {condition.relatedTable && (
                                <Grid item xs={12}>
                                  <Typography variant="caption" color="text.secondary">
                                    Related Table:
                                  </Typography>
                                  <Typography variant="body2">
                                    {condition.relatedTable}
                                  </Typography>
                                </Grid>
                              )}
                              
                              {/* Filter condition if applicable */}
                              {condition.filterCondition && (
                                <Grid item xs={12}>
                                  <Typography variant="caption" color="text.secondary">
                                    Filter:
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    backgroundColor: '#fff3cd',
                                    color: '#856404',
                                    p: 0.5,
                                    borderRadius: 0.5,
                                    fontSize: '0.8rem',
                                    fontStyle: 'italic'
                                  }}>
                                    {condition.filterCondition}
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Paper>
                        ))
                      ) : (
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                          No conditions defined for this rule
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
              
              {/* Action buttons in expanded view */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <IconButton 
                  color="primary" 
                  onClick={() => onShowResults(rule)}
                  sx={{ mr: 1 }}
                >
                  <AssessmentIcon />
                </IconButton>
                <IconButton 
                  color="primary" 
                  onClick={() => onEdit(rule.id)}
                  sx={{ mr: 1 }}
                >
                  <TuneRounded />
                </IconButton>
                <IconButton 
                  color="error" 
                  onClick={() => onDelete(rule.id)}
                >
                  <DeleteSweepRounded />
                </IconButton>
              </Box>
            </Paper>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default ExpandableRuleRow;
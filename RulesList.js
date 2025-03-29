import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
    Tooltip, Button, Container, Table, TableHead, TableBody, TableRow, TableCell, 
    Typography, IconButton, Chip, Box, FormControl, InputLabel, Select, MenuItem, 
    OutlinedInput, Checkbox, ListItemText, FormGroup, FormControlLabel,
    ToggleButtonGroup, ToggleButton, Collapse, Paper, Grid, Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FilterListIcon from '@mui/icons-material/FilterList';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
    DynamicFeedRounded,  // Icon for displaying query results
    TuneRounded,         // Icon for editing
    DeleteSweepRounded,  // Icon for deletion
    SaveAltRounded,      // Icon for saving preferences
    VisibilityOffOutlined, // Icon for inactive rules
    VisibilityOutlined,   // Icon for active rules
    Info,                 // Icon for info
    TableChart,           // Icon for table
    CompareArrows         // Icon for conditions
} from '@mui/icons-material';


const StyledTableCell = styled(TableCell)({
    padding: '10px',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    height: '80px',
    verticalAlign: 'middle',
});

// Special cell for Rule Info that's wider
const InfoTableCell = styled(TableCell)({
    padding: '10px',
    textAlign: 'left',
    width: '30%',
    height: '80px',
    verticalAlign: 'middle',
    '& p': {
        maxHeight: '80px',
        overflow: 'auto'
    }
});

const CompactTableCell = styled(TableCell)({
    padding: '10px',
    textAlign: 'left',
    maxWidth: '150px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    height: '80px',
    verticalAlign: 'middle',
});

// Basic sortable header cell
const SortableHeadCell = styled(TableCell)(({ sortDirection }) => ({
    backgroundColor: '#1976d2',
    color: 'white',
    fontWeight: 'bold',
    padding: '10px',
    height: '55px',
    cursor: 'pointer',
    userSelect: 'none',
    position: 'relative',
    '&:hover': {
        backgroundColor: '#1565c0',
    },
    '&::after': {
        content: sortDirection === 'ascending' ? '"▲"' : 
                 sortDirection === 'descending' ? '"▼"' : '""',
        position: 'absolute',
        right: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '12px'
    }
}));

// Special header cell for Rule Info
const InfoTableHeadCell = styled(SortableHeadCell)({
    width: '30%',
});

// Compact header cell
const CompactTableHeadCell = styled(SortableHeadCell)({
    maxWidth: '150px',
});

const StyledButton = styled(Button)(({ theme }) => ({
    margin: '0 5px',
    color: 'white',
}));

const InactiveButton = styled(StyledButton)({
    backgroundColor: '#f44336',
});

const ActionsContainer = styled('div')({
    display: 'flex',
    justifyContent: 'center',
});

// Column selector modal
const ColumnSelectorModal = styled(Box)(({ theme }) => ({
    position: 'absolute',
    right: 0,
    top: '100%',
    width: '280px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    padding: '20px',
    zIndex: 1000,
    marginTop: '10px',
    textAlign: 'left',
    border: '1px solid #e0e0e0'
}));

// Function to choose color for risk level
const getRiskColor = (risk) => {
    switch (risk) {
        case 'Critical': return '#d32f2f';
        case 'High': return '#f44336';
        case 'Medium': return '#ff9800';
        case 'Low': return '#4caf50';
        default: return '#757575';
    }
};

// Function to choose color for impact percentage
const getImpactColor = (percentage) => {
    const percent = parseFloat(percentage);
    if (percent >= 50) return '#d32f2f';
    if (percent >= 30) return '#ff9800';
    if (percent >= 15) return '#2196f3';
    return '#4caf50';
};

// Function to get friendly name for condition
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

// Function to choose color for condition
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

// Local Storage keys
const COLUMNS_STORAGE_KEY = 'rulesListVisibleColumns';
const SORT_STORAGE_KEY = 'rulesListSortPreferences';
const FILTER_STORAGE_KEY = 'rulesListFilterPreferences';

// Expandable Rule Row component
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
                    <CompactTableCell>
                        <Tooltip title={rule.status === 1 ? 'Active' : 'Inactive'}>
                            <IconButton onClick={() => onToggleStatus(rule)} size="small">
                                {rule.status === 1 ? (
                                    <CheckCircleIcon style={{ color: 'green', fontSize: '24px' }} />
                                ) : (
                                    <CancelIcon style={{ color: 'red', fontSize: '24px' }} />
                                )}
                            </IconButton>
                        </Tooltip>
                    </CompactTableCell>
                )}
                
                {visibleColumns.id && (
                    <CompactTableCell>
                        <Typography variant="body1" fontWeight="medium">
                            {rule.id}
                        </Typography>
                    </CompactTableCell>
                )}
                
                {visibleColumns.ruleName && (
                    <CompactTableCell>
                        <Typography variant="body1" fontWeight="medium">
                            {rule.rule_name}
                        </Typography>
                    </CompactTableCell>
                )}
                
                {visibleColumns.ruleInfo && (
                    <InfoTableCell>
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
                    </InfoTableCell>
                )}
                
                {visibleColumns.comparison && (
                    <CompactTableCell sx={{ overflow: 'visible' }}>
                        {conditions.slice(0, 2).map((condition, index) => (
                            <Chip
                                key={index}
                                label={getComparisonName(condition.comparison)}
                                size="small"
                                sx={{
                                    backgroundColor: getComparisonColor(condition.comparison),
                                    margin: '2px',
                                    fontSize: '0.8rem',
                                    height: '24px',
                                    mb: 0.5
                                }}
                            />
                        ))}
                        {conditions.length > 2 && (
                            <Chip
                                label={`+${conditions.length - 2} more`}
                                size="small"
                                sx={{ 
                                    backgroundColor: '#eeeeee',
                                    fontSize: '0.8rem',
                                    height: '24px',
                                    mb: 0.5,
                                    fontStyle: 'italic'
                                }}
                            />
                        )}
                    </CompactTableCell>
                )}
                
                {visibleColumns.sourceTable && (
                    <CompactTableCell>
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: 0.7,
                            backgroundColor: '#f5f5f5',
                            padding: '6px',
                            borderRadius: '6px',
                            maxHeight: '70px',
                            overflow: 'auto'
                        }}>
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    fontWeight: 'bold', 
                                    color: '#1976d2',
                                    fontSize: '0.85rem'
                                }}
                            >
                                {rule.selected_table || rule.sourceTable || 'N/A'}
                            </Typography>
                        </Box>
                    </CompactTableCell>
                )}
                
                {visibleColumns.matchTotal && (
                    <CompactTableCell>
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
                    </CompactTableCell>
                )}
                
                {visibleColumns.impactPercentage && (
                    <CompactTableCell>
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
                                    color: getImpactColor(rule.impact_percentage || rule.optimizationData?.quantitativeImpact?.impactPercentage || 0)
                                }}
                            >
                                {rule.impact_percentage || 
                                (rule.optimizationData?.quantitativeImpact?.impactPercentage 
                                    ? `${rule.optimizationData.quantitativeImpact.impactPercentage}%` 
                                    : 'N/A')}
                            </Typography>
                        </Box>
                    </CompactTableCell>
                )}
                
                {visibleColumns.riskLevel && (
                    <CompactTableCell>
                        <Chip
                            label={rule.business_risk || rule.optimizationData?.businessRisk || 'N/A'}
                            size="small"
                            sx={{
                                fontWeight: 'bold',
                                color: 'white',
                                backgroundColor: getRiskColor(rule.business_risk || rule.optimizationData?.businessRisk || 'N/A'),
                                padding: '2px',
                                height: '28px'
                            }}
                        />
                    </CompactTableCell>
                )}
                
                {visibleColumns.lastUpdate && (
                    <CompactTableCell>
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
                    </CompactTableCell>
                )}
                
                {visibleColumns.actions && (
                    <CompactTableCell>
                        <ActionsContainer>
                            <Tooltip title="Display Query Results">
                                <IconButton 
                                    color="primary" 
                                    onClick={() => onShowResults(rule)}
                                    sx={{
                                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                        margin: '0 4px'
                                    }}
                                >
                                    <DynamicFeedRounded style={{ color: '#1976d2', fontSize: '22px' }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Rule">
                                <IconButton 
                                    color="primary" 
                                    onClick={() => onEdit(rule.id)}
                                    sx={{
                                        backgroundColor: 'rgba(76, 175, 80, 0.08)',
                                        margin: '0 4px'
                                    }}
                                >
                                    <TuneRounded style={{ color: '#4caf50', fontSize: '22px' }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Rule">
                                <IconButton 
                                    color="error" 
                                    onClick={() => onDelete(rule.id)}
                                    sx={{
                                        backgroundColor: 'rgba(244, 67, 54, 0.08)',
                                        margin: '0 4px'
                                    }}
                                >
                                    <DeleteSweepRounded style={{ color: '#f44336', fontSize: '22px' }} />
                                </IconButton>
                            </Tooltip>
                        </ActionsContainer>
                    </CompactTableCell>
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
                                            <Info sx={{ mr: 1 }} />
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
                                            <TableChart sx={{ mr: 1 }} />
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
                                            <CompareArrows sx={{ mr: 1 }} />
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
                        </Paper>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

function RulesList() {
    // טעינת בחירת העמודות מה-LocalStorage או בחירה ברירת מחדל
    const getSavedColumns = () => {
        const savedColumns = localStorage.getItem(COLUMNS_STORAGE_KEY);
        if (savedColumns) {
            try {
                return JSON.parse(savedColumns);
            } catch (e) {
                console.error('Error parsing saved columns from localStorage:', e);
            }
        }
        // בחירת עמודות ברירת מחדל אם אין שמורות
        return {
            status: true,
            id: true,
            ruleName: true,
            ruleInfo: true,
            comparison: true,
            sourceTable: true,
            matchTotal: true,
            impactPercentage: true,
            riskLevel: true,
            lastUpdate: true,
            actions: true
        };
    };

    const [rules, setRules] = useState([]);
    const [allRules, setAllRules] = useState([]); // מאגר כל החוקים לפני פילטור
    const [visibleColumns, setVisibleColumns] = useState(getSavedColumns);
    const [columnSelectorOpen, setColumnSelectorOpen] = useState(false);
    const [selectedAll, setSelectedAll] = useState(false);
    
    // מצב פילטר סטטוס להצגת חוקים פעילים/לא פעילים
    const [statusFilter, setStatusFilter] = useState(() => {
        const savedFilter = localStorage.getItem(FILTER_STORAGE_KEY);
        if (savedFilter) {
            try {
                return JSON.parse(savedFilter);
            } catch (e) {
                console.error('Error parsing saved filter preferences:', e);
            }
        }
        return 'all'; // default: 'all', 'active', 'inactive'
    });
    
    // State for sorting
    const [sortConfig, setSortConfig] = useState(() => {
        // טעינת העדפות מיון מהלוקל סטורג'
        const savedSort = localStorage.getItem(SORT_STORAGE_KEY);
        if (savedSort) {
            try {
                return JSON.parse(savedSort);
            } catch (e) {
                console.error('Error parsing saved sort preferences:', e);
            }
        }
        return { key: 'id', direction: 'ascending' };
    });
    
    const navigate = useNavigate(); 
    
    // רשימת כל העמודות האפשריות עם מידע על מפתח המיון
    const allColumns = [
        { id: 'status', label: 'Status', sortKey: 'status' },
        { id: 'id', label: 'ID', sortKey: 'id' },
        { id: 'ruleName', label: 'Rule Name', sortKey: 'rule_name' },
        { id: 'ruleInfo', label: 'Rule Info', sortKey: 'rule_info' },
        { id: 'comparison', label: 'Comparison', sortKey: null }, // לא ניתן למיון
        { id: 'sourceTable', label: 'Source Table', sortKey: 'selected_table' },
        { id: 'matchTotal', label: 'Match/Total', sortKey: 'matching_records' },
        { id: 'impactPercentage', label: 'Impact %', sortKey: 'impact_percentage' },
        { id: 'riskLevel', label: 'Risk Level', sortKey: 'business_risk' },
        { id: 'lastUpdate', label: 'Last Update', sortKey: 'last_update' },
        { id: 'actions', label: 'Actions', sortKey: null } // לא ניתן למיון
    ];

    // בדיקה האם כל העמודות נבחרו
    useEffect(() => {
        const allSelected = allColumns.every(col => visibleColumns[col.id]);
        setSelectedAll(allSelected);
    }, [visibleColumns]);

    // טעינת כל החוקים עם פרמטר סטטוס
    useEffect(() => {
        // כעת נשלח פרמטר includeInactive=true כדי לקבל את כל החוקים
        axios.get('http://localhost:3001/rules/list', {
            params: {
                includeInactive: true
            }
        })
        .then(response => {
            console.log("📥 Received all rules list:", response.data.rules);
            setAllRules(response.data.rules);
        })
        .catch(error => {
            console.error('❌ Error fetching rules list:', error);
        });
    }, []);

    // פילטור החוקים לפי הסטטוס הנבחר
    useEffect(() => {
        if (allRules.length === 0) return;
        
        let filteredRules = [...allRules];
        
        // פילטור לפי סטטוס
        if (statusFilter === 'active') {
            filteredRules = filteredRules.filter(rule => rule.status === 1);
        } else if (statusFilter === 'inactive') {
            filteredRules = filteredRules.filter(rule => rule.status === 0);
        }
        
        setRules(filteredRules);
    }, [allRules, statusFilter]);
    
    // טיפול בשינוי הפילטר
    const handleFilterChange = (event, newFilter) => {
        if (newFilter !== null) {
            setStatusFilter(newFilter);
            localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(newFilter));
        }
    };
    
    // מיון הנתונים לפי ההגדרות הנוכחיות
    const sortedRules = React.useMemo(() => {
        let sortableRules = [...rules];
        if (sortConfig.key !== null) {
            sortableRules.sort((a, b) => {
                // מטפל במקרים מיוחדים
                if (sortConfig.key === 'matching_records') {
                    const valA = a[sortConfig.key] !== undefined && a[sortConfig.key] !== null ? a[sortConfig.key] : -1;
                    const valB = b[sortConfig.key] !== undefined && b[sortConfig.key] !== null ? b[sortConfig.key] : -1;
                    return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
                }
                
                if (sortConfig.key === 'impact_percentage') {
                    const valA = parseFloat(a[sortConfig.key] || "0");
                    const valB = parseFloat(b[sortConfig.key] || "0");
                    return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
                }
                
                if (sortConfig.key === 'last_update') {
                    return sortConfig.direction === 'ascending' 
                        ? new Date(a[sortConfig.key]) - new Date(b[sortConfig.key])
                        : new Date(b[sortConfig.key]) - new Date(a[sortConfig.key]);
                }
                
                // מיון רגיל למחרוזות ומספרים
                const valA = a[sortConfig.key] !== undefined ? a[sortConfig.key] : '';
                const valB = b[sortConfig.key] !== undefined ? b[sortConfig.key] : '';
                
                if (typeof valA === 'string' && typeof valB === 'string') {
                    return sortConfig.direction === 'ascending'
                        ? valA.localeCompare(valB)
                        : valB.localeCompare(valA);
                }
                
                return sortConfig.direction === 'ascending'
                    ? (valA > valB ? 1 : -1)
                    : (valB > valA ? 1 : -1);
            });
        }
        return sortableRules;
    }, [rules, sortConfig]);
    
    // פונקציה לבקשת מיון
    const requestSort = (key) => {
        // אם אין אפשרות מיון לעמודה זו
        if (!key) return;
        
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        
        const newSortConfig = { key, direction };
        setSortConfig(newSortConfig);
        
        // שמירת העדפות המיון בלוקל סטורג'
        localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(newSortConfig));
    };
    
    // פונקציה להחזרת כיוון המיון הנוכחי לעמודה מסוימת
    const getSortDirection = (columnKey) => {
        if (!columnKey || sortConfig.key !== columnKey) {
            return null;
        }
        return sortConfig.direction;
    };

    const calculateConditionMatches = (result, conditions) => {
        return conditions.map((condition) => {
            if (condition.comparison === 'is_duplicate') {
                // Special handling for duplicate check with multiple fields
                const duplicateFields = Array.isArray(condition.field) 
                    ? condition.field 
                    : [condition.field];
                
                // Count duplicate records
                const duplicateRecords = result.records.filter(record => {
                    const duplicateCheck = duplicateFields.map(field => record[field]);
                    const duplicateCount = result.records.filter(r => 
                        duplicateFields.every(field => r[field] === record[field])
                    ).length;
                    return duplicateCount > 1;
                });
    
                return { 
                    condition, 
                    count: duplicateRecords.length 
                };
            }
    
            // Regular condition matching (unchanged)
            return {
                condition,
                count: result.records.filter(record => {
                    const fieldValue = String(record[condition.field] || '').toLowerCase();
                    const condValue = String(condition.value).toLowerCase();
                    
                    switch (condition.comparison) {
                        case 'is_contain': return fieldValue.includes(condValue);
                        case 'not_contain': return !fieldValue.includes(condValue);
                        case 'equal': return fieldValue === condValue;
                        case 'not_equal': return fieldValue !== condValue;
                        case 'is_lower': return Number(fieldValue) < Number(condValue);
                        case 'is_higher': return Number(fieldValue) > Number(condValue);
                        default: return false;
                    }
                }).length
            };
        });
    };

    const handleDeleteClick = async (ruleId) => {
        try {
            const response = await axios.delete(`http://localhost:3001/rules/delete/${ruleId}`);
            if (response.data.success) {
                // עדכון שני המאגרים
                setAllRules(prevRules => prevRules.filter(rule => rule.id !== ruleId));
                setRules(prevRules => prevRules.filter(rule => rule.id !== ruleId));
                console.log('Rule deleted successfully.');
            } else {
                console.log('Failed to delete rule.');
            }
        } catch (error) {
            console.error('Error deleting rule:', error);
        }
    };

    const toggleStatus = async (rule) => {
        const newStatus = rule.status === 1 ? 0 : 1;

        try {
            const response = await axios.put(`http://localhost:3001/rules/status/${rule.id}`, { newStatus });
            if (response.data.success) {
                // עדכון ישיר ב-allRules
                setAllRules((prevRules) =>
                    prevRules.map((r) =>
                        r.id === rule.id ? { ...r, status: newStatus } : r
                    )
                );
                
                // עדכון ה-rules הנוכחיים בהתאם לפילטר
                if (statusFilter === 'all' || 
                    (statusFilter === 'active' && newStatus === 1) || 
                    (statusFilter === 'inactive' && newStatus === 0)) {
                    setRules((prevRules) =>
                        prevRules.map((r) =>
                            r.id === rule.id ? { ...r, status: newStatus } : r
                        )
                    );
                } else {
                    // הסרת החוק מהרשימה המוצגת אם הוא לא מתאים לפילטר הנוכחי
                    setRules((prevRules) =>
                        prevRules.filter((r) => r.id !== rule.id)
                    );
                }
                
                console.log('Rule status updated successfully.');
            } else {
                console.log('Failed to update rule status.');
            }
        } catch (error) {
            console.error('Error updating rule status:', error);
        }
    };

    const showQueryResults = (result, queryData, rule) => {
        if (!result?.records) return;

        // לחשב את התאמות התנאים
        const conditionMatches = calculateConditionMatches(result, queryData.conditions);

        const newWindow = window.open('', '', 'width=900,height=700');
        newWindow.document.write(`
            <html>
            <head>
                <title>Query Results</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; padding: 20px; }
                    h1 { color: #333; }
                    p { font-size: 14px; color: #555; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
                    th { background-color: #f2f2f2; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    tr:hover { background-color: #f0f0f0; }
                    .result-info { margin-bottom: 20px; }
                    .conditions-box { background-color: #eef; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
                    .condition-item { font-size: 14px; margin: 8px 0; }
                    .matching-count { color: #2196F3; margin-left: 10px; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>Query Results</h1>
                <div class="result-info">
                    <p><strong>Rule Name:</strong> ${rule.rule_name}</p>
                    <p><strong>Rule Info:</strong> ${rule.rule_info}</p>
                    <p><strong>Records matching the query:</strong> ${result.records.length} / ${queryData.totalRecords}</p>
                    <p><strong>Query executed at:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Table Name:</strong> ${queryData.selectedTable}</p>
                </div>

                <div class="conditions-box">
                    <h3>Applied Conditions:</h3>
                    ${conditionMatches.map((item, index) => `
                        <p class="condition-item">
                            ${index + 1}. <strong>${Array.isArray(item.condition.field) ? item.condition.field.join(',') : item.condition.field}</strong> 
                            ${item.condition.comparison} 
                            ${item.condition.comparison === 'is_duplicate' ? '(Duplicate Check)' : `'${item.condition.value}'`}
                            <span class="matching-count">(${item.count} records)</span>
                        </p>
                        ${item.condition.connector && index < conditionMatches.length - 1 
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

    const handleFetchRuleDetails = async (rule) => {
        // המר תנאים לפני השליחה
        const conditions = typeof rule.conditions === "string" 
            ? JSON.parse(rule.conditions) 
            : rule.conditions;

        const queryData = {
            selectedTable: rule.selected_table,
            conditions: conditions.map((condition, index) => ({
                ...condition,
                connector: index < conditions.length - 1 ? condition.connector : null,
            })),
            ruleId: rule.id,
            totalRecords: rule.total_records || 0
        };

        console.log('🔍 Query data:', JSON.stringify(queryData, null, 2));

        try {
            const response = await fetch('http://localhost:3001/query-db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(queryData),
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Full error response:', errorText);
                return;
            }

            const result = await response.json();
            showQueryResults(result, queryData, rule);
        } catch (error) {
            console.error('❌ Loading error:', error);
        }
    };
    
    // טיפול בשינוי הגדרות העמודות הנראות
    const handleColumnChange = (event) => {
        const { name, checked } = event.target;
        setVisibleColumns(prev => ({
            ...prev,
            [name]: checked
        }));
    };
    
    // פתיחה וסגירה של בוחר העמודות
    const toggleColumnSelector = () => {
        setColumnSelectorOpen(!columnSelectorOpen);
    };

    // שמירת בחירת העמודות ב-LocalStorage
    const saveColumnPreferences = () => {
        localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(visibleColumns));
        setColumnSelectorOpen(false);
        // הודעת אישור
        alert('Column preferences saved successfully!');
    };

    // בחירת כל העמודות או ביטול בחירה של כולן
    const toggleSelectAll = () => {
        const newValue = !selectedAll;
        setSelectedAll(newValue);
        
        // עדכון מצב כל העמודות
        const updatedColumns = {};
        allColumns.forEach(col => {
            updatedColumns[col.id] = newValue;
        });
        
        setVisibleColumns(updatedColumns);
    };

    return (
        <Container sx={{ marginTop: '40px', textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h4" color="primary">
                        Rules List
                    </Typography>
                    
                    {sortConfig.key && (
                        <Chip
                            label={`Sorted by: ${allColumns.find(col => col.sortKey === sortConfig.key)?.label || sortConfig.key} (${sortConfig.direction})`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            onDelete={() => {
                                setSortConfig({ key: null, direction: 'ascending' });
                                localStorage.removeItem(SORT_STORAGE_KEY);
                            }}
                            sx={{ ml: 2, fontSize: '0.7rem' }}
                        />
                    )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* פילטר סטטוס */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>Status:</Typography>
                        <ToggleButtonGroup
                            value={statusFilter}
                            exclusive
                            onChange={handleFilterChange}
                            size="small"
                            aria-label="rule status filter"
                        >
                            <ToggleButton value="all" aria-label="all rules">
                                <Tooltip title="All Rules">
                                    <FilterListIcon fontSize="small" />
                                </Tooltip>
                            </ToggleButton>
                            <ToggleButton value="active" aria-label="active rules">
                                <Tooltip title="Active Rules">
                                    <VisibilityOutlined fontSize="small" />
                                </Tooltip>
                            </ToggleButton>
                            <ToggleButton value="inactive" aria-label="inactive rules">
                                <Tooltip title="Inactive Rules">
                                    <VisibilityOffOutlined fontSize="small" />
                                </Tooltip>
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                    
                    {/* בוחר עמודות */}
                    <Box sx={{ position: 'relative' }}>
                        <Tooltip title="Select visible columns">
                            <IconButton 
                                onClick={toggleColumnSelector}
                                color="primary"
                                sx={{ 
                                    border: '1px solid #e0e0e0', 
                                    borderRadius: '4px',
                                    padding: '8px'
                                }}
                            >
                                <ViewColumnIcon />
                            </IconButton>
                        </Tooltip>
                        
                        {columnSelectorOpen && (
                            <ColumnSelectorModal>
                                <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                                    Select columns to display
                                </Typography>
                                
                                {/* בחירת כל העמודות */}
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={selectedAll}
                                            onChange={toggleSelectAll}
                                            color="primary"
                                        />
                                    }
                                    label={<Typography variant="body2" fontWeight="bold">Select All</Typography>}
                                />
                                
                                <Box sx={{ maxHeight: '300px', overflow: 'auto', mt: 1 }}>
                                    <FormGroup>
                                        {allColumns.map((column) => (
                                            <FormControlLabel
                                                key={column.id}
                                                control={
                                                    <Checkbox
                                                        name={column.id}
                                                        checked={visibleColumns[column.id]}
                                                        onChange={handleColumnChange}
                                                        size="small"
                                                    />
                                                }
                                                label={
                                                    <Typography variant="body2">
                                                        {column.label}
                                                    </Typography>
                                                }
                                            />
                                        ))}
                                    </FormGroup>
                                </Box>
                                
                                {/* כפתור שמירה */}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<SaveAltRounded />}
                                        onClick={saveColumnPreferences}
                                        size="small"
                                    >
                                        Save Preferences
                                    </Button>
                                </Box>
                            </ColumnSelectorModal>
                        )}
                    </Box>
                </Box>
            </Box>
            
            {/* תצוגת סטטיסטיקה על החוקים המוצגים */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, mt: 1 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Chip
                        icon={<FilterListIcon fontSize="small" />}
                        label={`Displaying: ${sortedRules.length} rules`}
                        variant="outlined"
                        size="small"
                    />
                    
                    <Chip
                        icon={<VisibilityOutlined fontSize="small" />}
                        label={`Active: ${sortedRules.filter(r => r.status === 1).length}`}
                        color="success"
                        variant="outlined"
                        size="small"
                    />
                    
                    <Chip
                        icon={<VisibilityOffOutlined fontSize="small" />}
                        label={`Inactive: ${sortedRules.filter(r => r.status === 0).length}`}
                        color="error"
                        variant="outlined"
                        size="small"
                    />
                </Box>
            </Box>
            
            <Table sx={{ 
                minWidth: 650, 
                marginTop: '20px', 
                borderCollapse: 'collapse',
                tableLayout: 'fixed'
            }} aria-label="rules table">
                <TableHead>
                    <TableRow>
                        {/* Expand column */}
                        <TableCell style={{ width: '40px', padding: '0 8px', backgroundColor: '#1976d2', color: 'white' }}>
                        </TableCell>
                        
                        {visibleColumns.status && (
                            <CompactTableHeadCell 
                                width="60px" 
                                onClick={() => requestSort('status')}
                                sortDirection={getSortDirection('status')}
                            >
                                Status
                            </CompactTableHeadCell>
                        )}
                        {visibleColumns.id && (
                            <CompactTableHeadCell 
                                width="50px"
                                onClick={() => requestSort('id')}
                                sortDirection={getSortDirection('id')}
                            >
                                ID
                            </CompactTableHeadCell>
                        )}
                        {visibleColumns.ruleName && (
                            <CompactTableHeadCell 
                                width="150px"
                                onClick={() => requestSort('rule_name')}
                                sortDirection={getSortDirection('rule_name')}
                            >
                                Rule Name
                            </CompactTableHeadCell>
                        )}
                        {visibleColumns.ruleInfo && (
                            <InfoTableHeadCell
                                onClick={() => requestSort('rule_info')}
                                sortDirection={getSortDirection('rule_info')}
                            >
                                Rule Info
                            </InfoTableHeadCell>
                        )}
                        {visibleColumns.comparison && (
                            <CompactTableHeadCell width="150px">
                                Comparison
                            </CompactTableHeadCell>
                        )}
                        {visibleColumns.sourceTable && (
                            <CompactTableHeadCell 
                                width="150px"
                                onClick={() => requestSort('selected_table')}
                                sortDirection={getSortDirection('selected_table')}
                            >
                                Source Table
                            </CompactTableHeadCell>
                        )}
                        {visibleColumns.matchTotal && (
                            <CompactTableHeadCell 
                                width="120px"
                                onClick={() => requestSort('matching_records')}
                                sortDirection={getSortDirection('matching_records')}
                            >
                                Match/Total
                            </CompactTableHeadCell>
                        )}
                        {visibleColumns.impactPercentage && (
                            <CompactTableHeadCell 
                                width="120px"
                                onClick={() => requestSort('impact_percentage')}
                                sortDirection={getSortDirection('impact_percentage')}
                            >
                                Impact %
                            </CompactTableHeadCell>
                        )}
                        {visibleColumns.riskLevel && (
                            <CompactTableHeadCell 
                                width="120px"
                                onClick={() => requestSort('business_risk')}
                                sortDirection={getSortDirection('business_risk')}
                            >
                                Risk Level
                            </CompactTableHeadCell>
                        )}
                        {visibleColumns.lastUpdate && (
                            <CompactTableHeadCell 
                                width="150px"
                                onClick={() => requestSort('last_update')}
                                sortDirection={getSortDirection('last_update')}
                            >
                                Last Update
                            </CompactTableHeadCell>
                        )}
                        {visibleColumns.actions && (
                            <CompactTableHeadCell width="130px">
                                Actions
                            </CompactTableHeadCell>
                        )}
                    </TableRow>
                </TableHead>

                <TableBody>
                    {sortedRules.map(rule => (
                        <ExpandableRuleRow 
                            key={rule.id}
                            rule={rule}
                            visibleColumns={visibleColumns}
                            onToggleStatus={toggleStatus}
                            onDelete={handleDeleteClick}
                            onEdit={(id) => navigate(`/rules/update/${id}`)}
                            onShowResults={handleFetchRuleDetails}
                        />
                    ))}
                </TableBody>
            </Table>

            {/* הודעה כאשר אין חוקים להצגה */}
            {sortedRules.length === 0 && (
                <Box sx={{ 
                    marginTop: 4, 
                    padding: 3, 
                    textAlign: 'center', 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: 2 
                }}>
                    <Typography variant="h6" color="text.secondary">
                        No rules found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {statusFilter !== 'all' ? 
                            `No ${statusFilter} rules found. Try changing the filter.` : 
                            'Try creating new rules or check your connection'}
                    </Typography>
                </Box>
            )}
        </Container>
    );
}

export default RulesList;
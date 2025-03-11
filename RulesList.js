import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Tooltip, Button, Container, Table, TableHead, TableBody, TableRow, TableCell, Typography, IconButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
    DynamicFeedRounded,  // Icon for displaying query results
    TuneRounded,         // Icon for editing
    DeleteSweepRounded   // Icon for deletion
} from '@mui/icons-material';


const StyledTableCell = styled(TableCell)({
    padding: '16px',
    textAlign: 'left',
});

const StyledTableHeadCell = styled(TableCell)({
    backgroundColor: '#1976d2',
    color: 'white',
    fontWeight: 'bold',
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

function RulesList() {
    const [rules, setRules] = useState([]);
    const navigate = useNavigate(); 

    useEffect(() => {
        axios.get('http://localhost:3001/rules/list')
            .then(response => {
                console.log("📥 Received rules list:", response.data.rules);
                setRules(response.data.rules);
            })
            .catch(error => {
                console.error('❌ Error fetching rules list:', error);
            });
    }, []);

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
                setRules((prevRules) =>
                    prevRules.map((r) =>
                        r.id === rule.id ? { ...r, status: newStatus } : r
                    )
                );
                console.log('Rule status updated successfully.');
            } else {
                console.log('Failed to update rule status.');
            }
        } catch (error) {
            console.error('Error updating rule status:', error);
        }
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
    
        // הדפס את פרטי השאילתה לבדיקה
        console.log('🔍 נתוני שאילתה:', JSON.stringify(queryData, null, 2));
    
        try {
            const response = await fetch('http://localhost:3001/query-db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(queryData),
            });
    
            // הדפס את סטטוס התגובה
            console.log('סטטוס תגובה:', response.status);
    
            if (!response.ok) {
                // קבל את טקסט השגיאה המלאה
                const errorText = await response.text();
                console.error('❌ תגובת שגיאה מלאה:', errorText);
                return;
            }
    
            const result = await response.json();
            showQueryResults(result, queryData, rule);
        } catch (error) {
            // טיפול בשגיאות טעינה
            console.error('❌ שגיאת טעינה:', error);
        }
    };

    const showQueryResults = (result, queryData, rule) => {
        if (!result?.records) return;

        const conditionCounts = calculateConditionMatches(result, queryData.conditions);

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
                    <p><strong>Rule Name:</strong> ${rule.rule_name}</p>
                    <p><strong>Rule Info:</strong> ${rule.rule_info}</p>
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
        <Container sx={{ marginTop: '40px', textAlign: 'center' }}>
            <Typography variant="h4" color="primary" gutterBottom>
                Rules List
            </Typography>
            <Table sx={{ minWidth: 650, marginTop: '20px', borderCollapse: 'collapse' }} aria-label="rules table">
                <TableHead>
                    <TableRow>
                        <StyledTableHeadCell>Status</StyledTableHeadCell>
                        <StyledTableHeadCell>ID</StyledTableHeadCell>
                        <StyledTableHeadCell>Rule Name</StyledTableHeadCell>
                        <StyledTableHeadCell>Rule Info</StyledTableHeadCell>
                        <StyledTableHeadCell>Match/Total</StyledTableHeadCell>
                        <StyledTableHeadCell>Last Update</StyledTableHeadCell>
                        <StyledTableHeadCell>Actions</StyledTableHeadCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {rules.map(rule => (
                        <TableRow key={rule.id}>
                            <StyledTableCell>
                                <Tooltip title={rule.status === 1 ? 'Active' : 'Inactive'}>
                                    <IconButton onClick={() => toggleStatus(rule)}>
                                        {rule.status === 1 ? (
                                            <CheckCircleIcon style={{ color: 'green', fontSize: '24px' }} />
                                        ) : (
                                            <CancelIcon style={{ color: 'red', fontSize: '24px' }} />
                                        )}
                                    </IconButton>
                                </Tooltip>
                            </StyledTableCell>
                            <StyledTableCell>{rule.id}</StyledTableCell>
                            <StyledTableCell>{rule.rule_name}</StyledTableCell>
                            <StyledTableCell>{rule.rule_info}</StyledTableCell>
                            <StyledTableCell>{rule.matching_records !== null ? rule.matching_records : 'N/A'} / {rule.total_records !== null ? rule.total_records : 'N/A'}</StyledTableCell>
                            <StyledTableCell>{new Date(rule.last_update).toLocaleString()}</StyledTableCell>
                            <StyledTableCell>
                            <ActionsContainer>
                                <Tooltip title="Display Query Results">
                                    <IconButton 
                                        color="primary" 
                                        onClick={() => handleFetchRuleDetails(rule)}
                                    >
                                        <DynamicFeedRounded style={{ color: '#1976d2' }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit Rule">
                                    <IconButton 
                                        color="primary" 
                                        onClick={() => navigate(`/rules/update/${rule.id}`)}
                                    >
                                        <TuneRounded style={{ color: '#4caf50' }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Rule">
                                    <IconButton 
                                        color="error" 
                                        onClick={() => handleDeleteClick(rule.id)}
                                    >
                                        <DeleteSweepRounded style={{ color: '#f44336' }} />
                                    </IconButton>
                                </Tooltip>
                            </ActionsContainer>
                        </StyledTableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Container>
    );
}

export default RulesList;
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Tooltip, Button, Container, Table, TableHead, TableBody, TableRow, TableCell, Typography, IconButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const StyledTableCell = styled(TableCell)({
    padding: '16px',
    textAlign: 'center',
});

const StyledTableHeadCell = styled(StyledTableCell)({
    backgroundColor: '#1976d2',
    color: 'white',
    fontWeight: 'bold',
});

const StyledButton = styled(Button)(({ theme }) => ({
    margin: '0 5px',
    color: 'white',
}));

const ActiveButton = styled(StyledButton)({
    backgroundColor: '#4caf50',
});

const InactiveButton = styled(StyledButton)({
    backgroundColor: '#f44336',
});

const ActionsContainer = styled('div')({
    display: 'flex',
    justifyContent: 'center',
});

function RulesList() {
    const [rules, setRules] = useState([]);
    const [editRule, setEditRule] = useState(null);
    const [queryResult, setQueryResult] = useState(null);
    const [isQueryDialogOpen, setIsQueryDialogOpen] = useState(false);
    const navigate = useNavigate(); 

    useEffect(() => {
        axios.get('http://localhost:3001/rules/list')
            .then(response => {
                setRules(response.data.rules);
            })
            .catch(error => {
                console.error('Error fetching rules:', error);
            });
    }, []);

    const handleEditClick = (rule) => {
        setEditRule(rule);
    };

    const handleUpdateRule = async () => {
        try {
            const { id, rule_name, rule_info } = editRule;
            const response = await axios.put(`http://localhost:3001/rules/update/${id}`, {
                ruleName: rule_name,
                ruleInfo: rule_info,
            });

            if (response.data.success) {
                setRules((prevRules) => prevRules.map(r => (r.id === id ? editRule : r)));
                setEditRule(null);
                console.log('Rule updated successfully.');
            } else {
                console.log('Failed to update rule.');
            }
        } catch (error) {
            console.error('Error updating rule:', error);
        }
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

    const handleFetchRuleDetails = async (ruleId) => {
        try {
            const response = await axios.post(`http://localhost:3001/query-rule/${ruleId}`);
            if (response.data.success) {
                displayQueryResultInNewWindow({
                    ruleName: response.data.rule.rule_name,
                    ruleInfo: response.data.rule.rule_info,
                    matchingRecords: response.data.rule.matching_records,
                    totalRecords: response.data.rule.total_records,
                    queryDate: new Date(response.data.rule.query_date).toLocaleString(),
                    conditions: response.data.rule.conditions,
                    records: response.data.rule.records || [],
                });
            } else {
                console.log('Failed to fetch rule details.');
            }
        } catch (error) {
            console.error('Error fetching rule details:', error);
        }
    };
    
    const displayQueryResultInNewWindow = (queryResult) => {
        if (!Array.isArray(queryResult.conditions)) {
            console.error("Conditions is not an array:", queryResult.conditions);
            return;
        }
    
        const newWindow = window.open('', '', 'width=800,height=600');
        newWindow.document.write(`
            <html>
            <head>
              <title>Query Results</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
                p { font-size: 14px; color: #555; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
              </style>
            </head>
            <body>
              <h1>Query Results</h1>
              <p><strong>Rule Name:</strong> ${queryResult.ruleName}</p>
              <p><strong>Rule Info:</strong> ${queryResult.ruleInfo}</p>
              <p><strong>Records matching the query:</strong> ${queryResult.matchingRecords} / ${queryResult.totalRecords}</p>
              <p><strong>Query executed at:</strong> ${queryResult.queryDate}</p>
              <p><strong>Query Conditions:</strong></p>
              <ul>
                ${queryResult.conditions.map(cond => `<li>${cond.field} ${cond.comparison} '${cond.value}'</li>`).join('')}
              </ul>
              <table>
                <tr>
                  ${Object.keys(queryResult.records[0] || {}).map(col => `<th>${col}</th>`).join('')}
                </tr>
                ${queryResult.records.map(row => `
                  <tr>
                    ${Object.values(row).map(val => `<td>${val}</td>`).join('')}
                  </tr>
                `).join('')}
              </table>
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
                                <Tooltip title={rule.status === 1 ? 'ACTIVE' : 'INACTIVE'}>
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
                                    <Button variant="contained" onClick={() => handleFetchRuleDetails(rule.id)}>Query DB</Button>
                                    <Button variant="contained" color="primary" onClick={() => navigate(`/rules/update/${rule.id}`)}>Edit</Button>
                                    <InactiveButton variant="contained" onClick={() => handleDeleteClick(rule.id)}>Delete</InactiveButton>
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

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Tooltip, Button, Container, Table, TableHead, TableBody, TableRow, TableCell, Typography, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { styled } from '@mui/material/styles';

// סגנונות מותאמים אישית
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

function StatusIcon({ status }) {
    return (
        <Tooltip title={status === 1 ? 'ACTIVE' : 'INACTIVE'}>
            {status === 1 ? (
                <CheckCircleIcon style={{ color: 'green', fontSize: '24px' }} />
            ) : (
                <CancelIcon style={{ color: 'red', fontSize: '24px' }} />
            )}
        </Tooltip>
    );
}

function MappingList() {
    const [mappings, setMappings] = useState([]);
    const [editMapping, setEditMapping] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:3001/mapping/list')
        .then(response => {
            setMappings(response.data.mappings);
        })
        .catch(error => {
            console.error('Error fetching mappings:', error);
        });
    }, []);

    const handleDeleteClick = async (mappingId) => {
        try {
            console.log(`Attempting to delete mapping with ID: ${mappingId}`);
            const response = await axios.delete(`http://localhost:3001/delete-mapping/${mappingId}`);
            if (response.data.success) {
                setMappings((prevMappings) => prevMappings.filter(mapping => mapping.id !== mappingId));
                console.log('Mapping deleted successfully.');
            } else {
                console.log('Failed to delete mapping.');
            }
        } catch (error) {
            console.error('Error deleting mapping:', error);
        }
    };

    const handleEditClick = (mapping) => {
        setEditMapping(mapping);
    };

    const handleUpdateMapping = async () => {
        try {
            const { id, mapping_name, import_server, export_server, field_mappings } = editMapping;
            const response = await axios.put(`http://localhost:3001/mapping/update-fields/${id}`, {
                mappingName: mapping_name,
                importServer: import_server,
                exportServer: export_server,
                fieldMappings: field_mappings,
            });

            if (response.data.success) {
                setMappings((prevMappings) => prevMappings.map(m => (m.id === id ? editMapping : m)));
                setEditMapping(null);
                console.log('Mapping updated successfully.');
            } else {
                console.log('Failed to update mapping.');
            }
        } catch (error) {
            console.error('Error updating mapping:', error);
        }
    };

    const handleStatusToggle = async (id, currentStatus) => {
        try {
          const newStatus = currentStatus === 1 ? 0 : 1;
          await axios.put(`http://localhost:3001/mapping/update-status/${id}`, {
            status: newStatus,
          });
      
          // עדכון מצב הטבלה באופן מקומי
          setMappings((prevMappings) =>
            prevMappings.map((mapping) =>
              mapping.id === id ? { ...mapping, status: newStatus } : mapping
            )
          );
      
        //   alert('Status updated successfully.');
        } catch (error) {
          console.error('Error updating status:', error);
          alert('Failed to update status.');
        }
      };
      
      

    return (
        <Container sx={{ marginTop: '40px', textAlign: 'center' }}>
            <Typography variant="h4" color="primary" gutterBottom>
                Mapping List
            </Typography>
            <Table sx={{ minWidth: 650, marginTop: '20px', borderCollapse: 'collapse' }} aria-label="mapping table">
            <TableHead>
                <TableRow>
                    <StyledTableHeadCell>Status</StyledTableHeadCell>
                    <StyledTableHeadCell>ID</StyledTableHeadCell>
                    <StyledTableHeadCell>Source Server</StyledTableHeadCell>
                    <StyledTableHeadCell>New Table Name</StyledTableHeadCell>
                    <StyledTableHeadCell>Last Update</StyledTableHeadCell>
                    <StyledTableHeadCell>Actions</StyledTableHeadCell>
                </TableRow>
            </TableHead>

            <TableBody>
                {mappings.map(mapping => (
                    <TableRow key={mapping.id}>
                        <StyledTableCell>
                            <Button onClick={() => handleStatusToggle(mapping.id, mapping.status)}>
                                <StatusIcon status={mapping.status} />
                            </Button>
                        </StyledTableCell>
                        <StyledTableCell>{mapping.id}</StyledTableCell>
                        <StyledTableCell>{mapping.import_server}</StyledTableCell>
                        <StyledTableCell>{mapping.new_table_name}</StyledTableCell>
                        <StyledTableCell>{new Date(mapping.last_update).toLocaleString()}</StyledTableCell>
                        <StyledTableCell>
                            <ActionsContainer>
                                <ActiveButton variant="contained">Import</ActiveButton>
                                <ActiveButton variant="contained">Export</ActiveButton>
                                <ActiveButton variant="contained" onClick={() => handleEditClick(mapping)}>Edit</ActiveButton>
                                <InactiveButton variant="contained" onClick={() => handleDeleteClick(mapping.id)}>Delete</InactiveButton>
                            </ActionsContainer>
                        </StyledTableCell>
                    </TableRow>
                ))}
            </TableBody>

            </Table>

            {/* Edit Mapping Dialog */}
            {editMapping && (
                <Dialog open={true} onClose={() => setEditMapping(null)}>
                    <DialogTitle>Edit Mapping</DialogTitle>
                    <DialogContent>
                        <TextField
                            label="Mapping Name"
                            value={editMapping.mapping_name}
                            onChange={(e) => setEditMapping({ ...editMapping, mapping_name: e.target.value })}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Import Server"
                            value={editMapping.import_server}
                            onChange={(e) => setEditMapping({ ...editMapping, import_server: e.target.value })}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Export Server"
                            value={editMapping.export_server}
                            onChange={(e) => setEditMapping({ ...editMapping, export_server: e.target.value })}
                            fullWidth
                            margin="normal"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditMapping(null)}>Cancel</Button>
                        <Button onClick={handleUpdateMapping} color="primary">Update</Button>
                    </DialogActions>
                </Dialog>
            )}
        </Container>
    );
}

export default MappingList;

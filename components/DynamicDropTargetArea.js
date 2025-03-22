// DynamicDropTargetArea.js
import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  List, 
  IconButton, 
  Box,
  Divider,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDrop } from 'react-dnd';
import { useLinkedFields } from '../contexts/LinkedFieldsContext';

/**
 * A dynamic drop target area that allows users to drop fields directly
 * without pre-defining categories or right-side fields.
 */
const DynamicDropTargetArea = ({ fieldMappings, setFieldMappings, onFieldDrop }) => {
  const [mappedFields, setMappedFields] = useState([]);
  const { linkedFields, addLinkedField, removeLinkedField } = useLinkedFields();

  // Main drop target for the mapping area
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'FIELD',
    drop: (item) => {
      handleFieldDrop(item.field);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // Handle field being dropped into the area
  const handleFieldDrop = (field) => {
    // Check if field already exists in mapping to prevent duplicates
    if (!mappedFields.includes(field)) {
      setMappedFields(prevFields => [...prevFields, field]);
      
      // Add to linked fields in context
      addLinkedField(field);
      
      // Update field mappings object
      setFieldMappings(prevMappings => ({
        ...prevMappings,
        [field]: null
      }));
      
      // Call external handler if provided
      if (onFieldDrop) {
        onFieldDrop(field);
      }
    }
  };

  // Remove a field from mapping
  const handleRemoveField = (field) => {
    setMappedFields(prevFields => prevFields.filter(f => f !== field));
    removeLinkedField(field);
    
    // Remove from field mappings object
    setFieldMappings(prevMappings => {
      const newMappings = { ...prevMappings };
      delete newMappings[field];
      return newMappings;
    });
  };

  // Update mapping when a source field is dropped onto a target field
  const handleFieldMapping = (targetField, sourceField) => {
    setFieldMappings(prevMappings => ({
      ...prevMappings,
      [targetField]: sourceField
    }));
  };

  return (
    <Paper 
      ref={drop}
      elevation={3}
      sx={{
        padding: 3,
        minHeight: 400,
        backgroundColor: isOver ? '#e3f2fd' : '#f5f5f5',
        borderRadius: 2,
        transition: 'background-color 0.3s',
        border: isOver ? '2px dashed #2196f3' : '2px dashed #ccc',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Dynamic Mapping Fields
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Drag fields here to add them to mapping. You can drag fields from the field list on the left.
      </Typography>
      
      {mappedFields.length === 0 && (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: 150,
            border: '1px dashed #aaa',
            borderRadius: 1,
            marginY: 2,
            backgroundColor: 'rgba(0,0,0,0.04)'
          }}
        >
          <Typography variant="body1" color="textSecondary">
            Drag fields here...
          </Typography>
        </Box>
      )}
      
      <List>
        {mappedFields.map((field, index) => {
          // Create a drop target for each field
          const FieldDropTarget = () => {
            const [{ isFieldOver }, fieldDrop] = useDrop(() => ({
              accept: 'FIELD',
              drop: (item) => {
                handleFieldMapping(field, item.field);
              },
              collect: (monitor) => ({
                isFieldOver: monitor.isOver(),
              }),
            }));

            return (
              <ListItem
                ref={fieldDrop}
                key={index}
                sx={{
                  backgroundColor: isFieldOver ? '#e0e0e0' : '#fff3cd',
                  borderRadius: 1,
                  marginY: 1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: isFieldOver ? '1px dashed #2196f3' : '1px solid #fff3cd',
                }}
              >
                <ListItemText
                  primary={field}
                  secondary={fieldMappings[field] ? `← ${fieldMappings[field]}` : 'Not mapped yet'}
                  sx={{ color: '#856404' }}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Remove field">
                    <IconButton edge="end" onClick={() => handleRemoveField(field)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            );
          };

          return <FieldDropTarget key={index} />;
        })}
      </List>
    </Paper>
  );
};

export default DynamicDropTargetArea;
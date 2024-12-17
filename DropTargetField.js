// DropTargetField.js
import React from 'react';
import { ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useDrop } from 'react-dnd';
import { LinkedFieldsProvider, useLinkedFields } from './contexts/LinkedFieldsContext';


const DropTargetField = ({ field, mappedField, onDrop }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'FIELD',
    drop: (item) => {
      onDrop(field, item.field);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <ListItem
      ref={drop}
      style={{
        backgroundColor: isOver ? '#e0e0e0' : '#fff3cd',
        borderRadius: '5px',
        margin: '2px 0',
      }}
    >
      <ListItemText
        primary={`- ${field} ${mappedField ? `← ${mappedField}` : ''}`}
        style={{ color: '#856404' }}
      />
      <IconButton edge="end" disabled>
        <EditIcon />
      </IconButton>
      <IconButton edge="end" disabled>
        <DeleteIcon />
      </IconButton>
    </ListItem>
  );
};

export default DropTargetField;

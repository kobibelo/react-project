import React from 'react';
import { useDrag } from 'react-dnd';
import { Paper, Typography } from '@mui/material';

const DraggableField = ({ field }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'FIELD',
    item: { field },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <Paper
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        padding: '10px',
        margin: '5px 0',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Typography>{field}</Typography>
    </Paper>
  );
};

export default DraggableField;

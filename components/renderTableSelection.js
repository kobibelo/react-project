import React from 'react';
import { Typography } from '@mui/material';
import DatabaseTreeView from './DatabaseTreeView';
/* import RightSide from '../RightSide'; */

const RenderTableSelection = ({
  fieldMappings,
  setFieldMappings,
  handleFieldDrop,
  droppedFields,
  selectedTable,
  handleTableSelection, // הוספת handleTableSelection כפרופס
  mssqlServerName
}) => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <div style={{ flex: 1, marginRight: '20px' }}>
      <Typography
        variant="h4"
        style={{ marginTop: '20px', marginBottom: '20px', textAlign: 'left', fontWeight: 'bold', fontSize: '2rem', color: '#1976d2' }}
      >
        Select Table
      </Typography>
      <DatabaseTreeView
        mssqlServerName={mssqlServerName}
        linkedFields={droppedFields}
        selectedTable={selectedTable}
        handleTableSelection={handleTableSelection} // העברת handleTableSelection כפרופס
      />
    </div>
    {/*     <div style={{ flex: 1, marginLeft: '20px' }}>
      <RightSide
        fieldMappings={fieldMappings}
        setFieldMappings={setFieldMappings}
        onFieldDrop={handleFieldDrop}
      />
    </div> */}
  </div>
);

export default RenderTableSelection;

// src/components/renderForms.js

import React from 'react';
import { Typography, Button, FormControl, InputLabel, Select, MenuItem, RadioGroup, FormControlLabel, Radio, TextField, Grid } from '@mui/material';

// פונקציה שמייצרת את הטופס לייבוא - בלי כפתור Next
export const RenderImportForm = ({
  mappingName,
  setMappingName,
  mappingInfo,
  setMappingInfo,
  importServerType,
  setImportServerType,
  importConnectionType,
  setImportConnectionType,
  importServerName,
  setImportServerName,
  importDatabaseName,
  setImportDatabaseName,
  handleFillClick,
  handleMSSQLTestClick,
  testMessage,
  isLoading
}) => (
  <>
    <Typography
      variant="h4"
      style={{
        marginTop: '20px',
        marginBottom: '20px',
        textAlign: 'left',
        fontWeight: 'bold',
        fontSize: '2rem',
        color: '#1976d2',
      }}
    >
      Import Database
    </Typography>
    <Grid container spacing={2} style={{ marginBottom: '20px' }}>
      <Grid item xs={4}>
        <TextField
          label="Mapping Name"
          variant="outlined"
          value={mappingName}
          onChange={(e) => setMappingName(e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={8}>
        <TextField
          label="Mapping Info"
          variant="outlined"
          value={mappingInfo}
          onChange={(e) => setMappingInfo(e.target.value)}
          fullWidth
        />
      </Grid>
    </Grid>
    <Button
      variant="contained"
      color="primary"
      onClick={handleFillClick}
      style={{ marginBottom: '20px' }}
    >
      Fill
    </Button>
    <FormControl variant="outlined" fullWidth style={{ marginBottom: '20px' }}>
      <InputLabel>Server Type</InputLabel>
      <Select
        value={importServerType}
        onChange={(e) => setImportServerType(e.target.value)}
        label="Server Type"
      >
        <MenuItem value="mssql">MSSQL</MenuItem>
        <MenuItem value="oracle" disabled>
          Oracle
        </MenuItem>
        <MenuItem value="postgresql" disabled>
          PostgreSQL
        </MenuItem>
      </Select>
    </FormControl>
    <FormControl component="fieldset" style={{ marginBottom: '20px' }}>
      <Typography variant="h6">Connection Type</Typography>
      <RadioGroup
        row
        value={importConnectionType}
        onChange={(e) => setImportConnectionType(e.target.value)}
      >
        <FormControlLabel value="localhost" control={<Radio />} label="Localhost" />
        <FormControlLabel value="live-server" control={<Radio />} label="Live Server" />
      </RadioGroup>
    </FormControl>
    <TextField
      label="Server"
      variant="outlined"
      fullWidth
      value={importServerName}
      onChange={(e) => setImportServerName(e.target.value)}
      style={{ marginBottom: '20px' }}
    />
    <TextField
      label="Database"
      variant="outlined"
      fullWidth
      value={importDatabaseName}
      onChange={(e) => setImportDatabaseName(e.target.value)}
      style={{ marginBottom: '20px' }}
    />
    <Button
      variant="contained"
      color="primary"
      onClick={handleMSSQLTestClick}
      style={{ marginRight: '10px' }}
      disabled={isLoading}
    >
      Test MSSQL Connection
    </Button>
    {testMessage && (
      <Typography style={{ color: 'green', marginTop: '20px' }}>
        {testMessage}
      </Typography>
    )}
  </>
);

// פונקציה שמייצרת את הטופס לייצוא - בלי כפתורי ניווט
export const RenderExportForm = ({
  exportServerType,
  setExportServerType,
  exportConnectionType,
  setExportConnectionType,
  exportServerName,
  setExportServerName,
  exportUserName,
  setExportUserName,
  exportPassword,
  setExportPassword,
  exportDatabaseName,
  setExportDatabaseName,
  handleMySQLFillClick,
  handleMySQLTestClick,
  handleGetTables,
  testMessage,
  isLoading
}) => (
  <>
    <Typography
      variant="h4"
      style={{
        marginTop: '20px',
        marginBottom: '20px',
        textAlign: 'left',
        fontWeight: 'bold',
        fontSize: '2rem',
        color: '#1976d2',
      }}
    >
      Export Database
    </Typography>
    <FormControl variant="outlined" fullWidth style={{ marginBottom: '20px' }}>
      <InputLabel>Server Type</InputLabel>
      <Select
        value={exportServerType}
        onChange={(e) => setExportServerType(e.target.value)}
        label="Server Type"
      >
        <MenuItem value="mysql">MySQL</MenuItem>
        <MenuItem value="mongodb" disabled>
          MongoDB
        </MenuItem>
      </Select>
    </FormControl>
    <Button
      variant="contained"
      color="primary"
      onClick={handleMySQLFillClick}
      style={{ marginBottom: '20px' }}
    >
      Fill
    </Button><br></br>
    <FormControl component="fieldset" style={{ marginBottom: '20px' }}>
      <Typography variant="h6">Connection Type</Typography>
      <RadioGroup
        row
        value={exportConnectionType}
        onChange={(e) => setExportConnectionType(e.target.value)}
      >
        <FormControlLabel value="localhost" control={<Radio />} label="Localhost" />
        <FormControlLabel value="live-server" control={<Radio />} label="Live Server" />
      </RadioGroup>
    </FormControl>
    <TextField
      label="Server"
      variant="outlined"
      fullWidth
      value={exportServerName}
      onChange={(e) => setExportServerName(e.target.value)}
      style={{ marginBottom: '20px' }}
    />
    <TextField
      label="User"
      variant="outlined"
      fullWidth
      value={exportUserName}
      onChange={(e) => setExportUserName(e.target.value)}
      style={{ marginBottom: '20px' }}
    />
    <TextField
      label="Password"
      variant="outlined"
      fullWidth
      value={exportPassword}
      onChange={(e) => setExportPassword(e.target.value)}
      type="password"
      style={{ marginBottom: '20px' }}
    />
    <TextField
      label="Database"
      variant="outlined"
      fullWidth
      value={exportDatabaseName}
      onChange={(e) => setExportDatabaseName(e.target.value)}
      style={{ marginBottom: '20px' }}
    />
    <Button
      variant="contained"
      color="primary"
      onClick={handleMySQLTestClick}
      style={{ marginRight: '10px' }}
      disabled={isLoading}
    >
      Test MySQL Connection
    </Button>
    {testMessage && (
      <Typography style={{ color: 'green', marginTop: '20px' }}>
        {testMessage}
      </Typography>
    )}
  </>
);
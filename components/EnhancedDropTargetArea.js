// components/EnhancedDropTargetArea.js
import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Box,
  Divider,
  Chip,
  IconButton, 
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Menu,
  MenuItem,
  ListItemSecondaryAction
} from '@mui/material';
import { useDrop } from 'react-dnd';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DoneIcon from '@mui/icons-material/Done';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useLinkedFields } from '../contexts/LinkedFieldsContext';

// Component for a single mapped field
const MappedField = ({ 
  field, 
  source,
  mappedName,
  onDelete, 
  onRename,
  onDrop,
  isLinked
}) => {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newName, setNewName] = useState(mappedName || field);
  const [menuAnchor, setMenuAnchor] = useState(null);
  
  // Setup drop target for each field
  const [{ isFieldOver }, fieldDrop] = useDrop(() => ({
    accept: 'FIELD',
    drop: (item) => onDrop(field, item.field),
    collect: (monitor) => ({
      isFieldOver: monitor.isOver(),
    }),
  }));

  // Handle menu opening
  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  // Handle menu closing
  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Handle field rename
  const handleRename = () => {
    handleMenuClose();
    setIsRenameOpen(true);
  };

  // Submit rename
  const handleRenameSubmit = () => {
    onRename(field, newName);
    setIsRenameOpen(false);
  };

  // Cancel rename
  const handleRenameCancel = () => {
    setNewName(mappedName || field);
    setIsRenameOpen(false);
  };

  // Handle field delete
  const handleDelete = () => {
    handleMenuClose();
    onDelete(field);
  };

  // Check if field has been renamed
  const isRenamed = mappedName && mappedName !== field;

  return (
    <>
      <ListItem
        ref={fieldDrop}
        sx={{
          backgroundColor: isFieldOver ? 'rgba(25, 118, 210, 0.08)' : '#fff3cd',
          borderRadius: 1,
          mb: 1,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: isFieldOver ? '1px dashed #2196f3' : '1px solid #fff3cd',
          transition: 'all 0.2s',
        }}
      >
        <DragIndicatorIcon sx={{ mr: 1, color: 'text.secondary' }} />
        
        <ListItemText
          primary={
            <Typography component="span" variant="body1" sx={{ fontWeight: isRenamed ? 'bold' : 'normal' }}>
              <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                {mappedName || field}
                
                {isRenamed && (
                  <Tooltip title="This field has been renamed">
                    <Chip 
                      component="span"
                      size="small" 
                      label="Renamed" 
                      sx={{ ml: 1, bgcolor: '#ff9800', color: 'white' }} 
                    />
                  </Tooltip>
                )}
              </Box>
            </Typography>
          }
          secondary={
            <Typography component="span" variant="body2">
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
                {source && source.databaseName && (
                  <Chip 
                    component="span"
                    size="small" 
                    label={source.databaseName}
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem', 
                      mr: 0.5, 
                      mb: 0.5,
                      bgcolor: 'info.light',
                      color: 'info.contrastText'
                    }} 
                  />
                )}
                
                {source && source.tableName && (
                  <Chip 
                    component="span"
                    size="small" 
                    label={source.tableName}
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem', 
                      mr: 0.5,
                      mb: 0.5,
                      bgcolor: 'success.light',
                      color: 'success.contrastText'
                    }} 
                  />
                )}
                
                <Chip 
                  component="span"
                  size="small" 
                  label={field}
                  sx={{ 
                    height: 20, 
                    fontSize: '0.7rem', 
                    mb: 0.5,
                    bgcolor: '#f8f9fa',
                    color: 'text.secondary',
                    border: '1px solid',
                    borderColor: 'divider'
                  }} 
                />
              </Box>
            </Typography>
          }
        />
        
        <ListItemSecondaryAction>
          {isLinked && (
            <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 2 }} />
          )}
          <IconButton 
            edge="end" 
            size="small" 
            onClick={handleMenuOpen}
            aria-label="field options"
          >
            <MoreVertIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
      
      {/* Field options menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleRename}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Rename
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Remove
        </MenuItem>
      </Menu>
      
      {/* Rename dialog */}
      <Dialog open={isRenameOpen} onClose={handleRenameCancel}>
        <DialogTitle>Rename Field</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Original field name: <strong>{field}</strong>
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="New field name"
              fullWidth
              variant="outlined"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRenameCancel}>Cancel</Button>
          <Button 
            onClick={handleRenameSubmit} 
            color="primary" 
            variant="contained"
            disabled={!newName.trim()}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Main enhanced drop target area component
const EnhancedDropTargetArea = ({ 
  fieldMappings, 
  setFieldMappings,
  onFieldDrop,
  onRenameField
}) => {
  const [mappedFields, setMappedFields] = useState([]);
  const [fieldSources, setFieldSources] = useState({});
  const [renamedFields, setRenamedFields] = useState({});
  
  const { linkedFields, addLinkedField, removeLinkedField } = useLinkedFields();

  // Setup the main drop zone
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'FIELD',
    drop: (item) => {
      console.log('Item dropped:', item);
      
      // בדיקה אם קיבלנו מערך של שדות (multiple fields)
      if (item.multiple === true && Array.isArray(item.field)) {
        console.log('Processing multiple fields:', item.field);
        
        // עבור על כל השדות ברשימה, אך דלג על שדות שכבר קיימים
        item.field.forEach(fieldName => {
          // בדיקה אם השדה כבר קיים
          if (!mappedFields.includes(fieldName)) {
            console.log('Adding field from multiple selection:', fieldName);
            handleFieldDrop(fieldName, item.source);
          } else {
            console.log('Field already exists, skipping:', fieldName);
          }
        });
      } else {
        // שדה בודד - בדוק אם כבר קיים
        const singleField = Array.isArray(item.field) ? item.field[0] : item.field;
        
        if (!mappedFields.includes(singleField)) {
          console.log('Adding single field:', singleField);
          handleFieldDrop(singleField, item.source);
        } else {
          console.log('Field already exists, skipping:', singleField);
        }
      }
      
      // החזרת אובייקט ריק
      return {};
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // Update the mapped fields list when fieldMappings changes
  useEffect(() => {
    // שינוי חשוב: לשמור רק את המפתחות הייחודיים (למנוע כפילויות)
    setMappedFields(Array.from(new Set(Object.keys(fieldMappings))));
  }, [fieldMappings]);

  // Handle a field being dropped on the main area
  const handleFieldDrop = (field, source) => {
    // בדיקה נוספת שהשדה לא כבר קיים
    if (mappedFields.includes(field)) {
      console.log('Field already mapped, ignoring:', field);
      return;
    }
    
    console.log('Adding field to mapped fields with source:', source);
    
    // הוספה לשדות הממופים
    setMappedFields(prev => {
      // בדיקה נוספת שהשדה לא קיים כבר, ואם קיים - ללא שינוי
      if (prev.includes(field)) {
        return prev;
      }
      return [...prev, field];
    });
    
    // הוספת מידע המקור אם קיים
    if (source) {
      setFieldSources(prev => ({
        ...prev,
        [field]: source
      }));
    }
    
    // הוספה לשדות המקושרים בקונטקסט
    addLinkedField(field);
    
    // עדכון מיפוי השדות, רק אם השדה לא קיים כבר
    setFieldMappings(prev => {
      // אם השדה כבר קיים, החזר את המצב הקודם ללא שינוי
      if (field in prev) {
        return prev;
      }
      return {
        ...prev,
        [field]: null
      };
    });
    
    // קריאה למטפל החיצוני אם קיים
    if (onFieldDrop) {
      onFieldDrop(field, source);
    }
  };

  // Handle field being mapped to another field
  const handleFieldMapping = (targetField, sourceField) => {
    setFieldMappings(prev => ({
      ...prev,
      [targetField]: sourceField
    }));
  };

  // Handle field removal
  const handleRemoveField = (field) => {
    // Remove from mapped fields
    setMappedFields(prev => prev.filter(f => f !== field));
    
    // Remove from linked fields in context
    removeLinkedField(field);
    
    // Remove from field mappings
    setFieldMappings(prev => {
      const newMappings = { ...prev };
      delete newMappings[field];
      return newMappings;
    });
    
    // Remove from sources
    setFieldSources(prev => {
      const newSources = { ...prev };
      delete newSources[field];
      return newSources;
    });
    
    // Remove from renamed fields
    setRenamedFields(prev => {
      const newRenamed = { ...prev };
      delete newRenamed[field];
      return newRenamed;
    });
  };

  // Handle field renaming
  const handleRenameField = (field, newName) => {
    if (field === newName) {
      // If name hasn't changed, remove from renamed fields
      setRenamedFields(prev => {
        const newRenamed = { ...prev };
        delete newRenamed[field];
        return newRenamed;
      });
      
      // Notify parent if onRenameField exists
      if (onRenameField) {
        onRenameField(field, null);
      }
    } else {
      // Update renamed fields
      setRenamedFields(prev => ({
        ...prev,
        [field]: newName
      }));
      
      // Notify parent if onRenameField exists
      if (onRenameField) {
        onRenameField(field, newName);
      }
    }
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
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        Dynamic Mapping Fields
        <Tooltip title="Drag fields here from the left panel">
          <InfoOutlinedIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
        </Tooltip>
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      {mappedFields.length > 0 ? (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <List>
            {mappedFields.map((field, index) => (
              <MappedField
                key={`${field}-${index}`}
                field={field}
                source={fieldSources[field]}
                mappedName={renamedFields[field]}
                isLinked={linkedFields.has(field)}
                onDelete={handleRemoveField}
                onRename={handleRenameField}
                onDrop={handleFieldMapping}
              />
            ))}
          </List>
        </Box>
      ) : (
        <Box 
          sx={{ 
            flexGrow: 1,
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            border: '1px dashed #aaa',
            borderRadius: 1,
            p: 3
          }}
        >
          <Typography variant="body1" color="text.secondary" align="center">
            Drag fields here to add them to mapping
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} align="center">
            You can select multiple fields with Shift+Click or Ctrl+Click
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default EnhancedDropTargetArea;
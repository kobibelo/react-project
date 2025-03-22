// components/MultiSelectFieldList.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Button
} from '@mui/material';
import { useDrag } from 'react-dnd';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InputBase from '@mui/material/InputBase';

// Component for a single draggable field with multi-select support
const SelectableField = ({ 
  field, 
  databaseName, 
  tableName, 
  isSelected, 
  isLinked,
  onClick, 
  onDrag,
  selectedFields
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'FIELD',
    item: () => {
      // בדיקה אם השדה הוא חלק מהשדות הנבחרים
      if (isSelected && selectedFields.length > 1) {
        console.log('Dragging multiple fields:', selectedFields);
        // שינוי: להעביר את כל השדות הנבחרים כמערך
        onDrag(selectedFields);
        return { 
          field: selectedFields, 
          source: { databaseName, tableName },
          multiple: true // סימון שזו גרירה של מספר שדות
        };
      } else {
        console.log('Dragging single field:', field);
        onDrag(field);
        return { 
          field, 
          source: { databaseName, tableName },
          multiple: false
        };
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <ListItem
      ref={drag}
      sx={{
        cursor: 'pointer',
        backgroundColor: isSelected 
          ? 'rgba(25, 118, 210, 0.12)' 
          : isLinked 
            ? 'rgba(76, 175, 80, 0.08)'
            : 'transparent',
        borderRadius: 1,
        mb: 0.5,
        border: '1px solid',
        borderColor: isSelected 
          ? 'primary.main' 
          : isLinked 
            ? 'success.light'
            : 'transparent',
        '&:hover': {
          backgroundColor: isSelected 
            ? 'rgba(25, 118, 210, 0.18)' 
            : 'rgba(0, 0, 0, 0.04)',
        },
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
      }}
      onClick={onClick}
    >
      <DragIndicatorIcon sx={{ mr: 1, color: 'text.secondary' }} />
      
      <ListItemText 
        primary={field} 
        secondary={
          <Typography component="span" variant="body2">
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
              <Chip 
                size="small" 
                label={databaseName}
                sx={{ 
                  height: 20, 
                  fontSize: '0.7rem', 
                  mr: 0.5, 
                  bgcolor: 'info.light',
                  color: 'info.contrastText', 
                }} 
              />
              <Chip 
                size="small" 
                label={tableName}
                sx={{ 
                  height: 20, 
                  fontSize: '0.7rem', 
                  bgcolor: 'success.light',
                  color: 'success.contrastText', 
                }} 
              />
            </Box>
          </Typography>
        }
      />
      
      {isLinked && (
        <CheckCircleIcon color="success" fontSize="small" sx={{ ml: 1 }} />
      )}
    </ListItem>
  );
};

// Main component for multi-selectable field list
const MultiSelectFieldList = ({ 
  fields, 
  databaseName,
  tableName,
  linkedFields,
  onFieldsDropped
}) => {
  const [selectedFields, setSelectedFields] = useState([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const listRef = useRef(null);

  // Filter fields based on search term
  const filteredFields = fields.filter(field => 
    field.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Clear selection when fields change
  useEffect(() => {
    setSelectedFields([]);
    setLastSelectedIndex(-1);
  }, [fields, databaseName, tableName]);

  // Handle field click with Shift and Ctrl modifiers
  const handleFieldClick = (field, index, event) => {
    // Prevent default browser selection behavior
    event.preventDefault();
    
    if (event.shiftKey && lastSelectedIndex !== -1) {
      // Shift+Click: Select range
      const start = Math.min(index, lastSelectedIndex);
      const end = Math.max(index, lastSelectedIndex);
      
      const fieldsInRange = filteredFields.slice(start, end + 1);
      
      // Add all fields in range to selection if not already there
      setSelectedFields(prev => {
        const newSelection = [...prev];
        fieldsInRange.forEach(f => {
          if (!newSelection.includes(f)) {
            newSelection.push(f);
          }
        });
        return newSelection;
      });
      
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl+Click: Toggle selection
      setSelectedFields(prev => {
        if (prev.includes(field)) {
          return prev.filter(f => f !== field);
        } else {
          return [...prev, field];
        }
      });
      
    } else {
      // Normal click: Select only this field
      setSelectedFields([field]);
    }
    
    setLastSelectedIndex(index);
  };

  // Handle field drag (single field or multiple fields)
  const handleFieldDrag = (field) => {
    // אם field הוא מערך, אז זו גרירה של מספר שדות
    if (Array.isArray(field)) {
      console.log('Dragging multiple fields:', field);
      
      onFieldsDropped(field, {
        field: field,
        source: { databaseName, tableName },
        multiple: true
      });
    } else {
      // אם השדה הנגרר הוא חלק מהשדות הנבחרים, שלח את כל השדות הנבחרים
      if (selectedFields.includes(field) && selectedFields.length > 1) {
        console.log('Dragging selected fields because field is included:', selectedFields);
        
        onFieldsDropped(selectedFields, {
          field: selectedFields,
          source: { databaseName, tableName },
          multiple: true
        });
      } else {
        // אחרת, שלח רק את השדה הנוכחי
        console.log('Dragging single field:', field);
        
        onFieldsDropped([field], {
          field,
          source: { databaseName, tableName },
          multiple: false
        });
      }
    }
  };

  return (
    <Paper 
      ref={listRef}
      sx={{ 
        p: 2, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Typography variant="h6" gutterBottom>
        Table Fields
      </Typography>
      
      {/* Search box */}
      <Paper 
        elevation={0}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2, 
          p: 0.5, 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1
        }}
      >
        <IconButton sx={{ p: 1 }} aria-label="search">
          <SearchIcon />
        </IconButton>
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search fields..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <IconButton 
            size="small" 
            onClick={() => setSearchTerm('')}
            aria-label="clear search"
          >
            <FilterListIcon />
          </IconButton>
        )}
      </Paper>
      
      {/* Selected count indicator (without send button) */}
      {selectedFields.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Chip 
            label={`${selectedFields.length} field${selectedFields.length > 1 ? 's' : ''} selected`}
            color="primary"
            size="small"
          />
        </Box>
      )}
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Fields list */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {filteredFields.length > 0 ? (
          <List>
            {filteredFields.map((field, index) => (
              <SelectableField
                key={field}
                field={field}
                databaseName={databaseName}
                tableName={tableName}
                isSelected={selectedFields.includes(field)}
                isLinked={linkedFields.has(field)}
                onClick={(e) => handleFieldClick(field, index, e)}
                onDrag={handleFieldDrag}
                selectedFields={selectedFields}
              />
            ))}
          </List>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {fields.length === 0 
                ? "Select a table to see available fields" 
                : "No fields match your search"}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default MultiSelectFieldList;
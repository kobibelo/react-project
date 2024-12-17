import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AddTaskIcon from '@mui/icons-material/AddTask';
import UploadIcon from '@mui/icons-material/Upload';
import CheckIcon from '@mui/icons-material/Check';
import { useDrop } from 'react-dnd';
import DropTargetField from './DropTargetField';

const RightSide = ({ fieldMappings, setFieldMappings, onFieldDrop }) => {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [fieldValue, setFieldValue] = useState('');
  const [editFieldIndex, setEditFieldIndex] = useState(-1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [linkedFields, setLinkedFields] = useState(new Set()); // אוסף של שדות שנקשרו

  const handleAddCategory = () => {
    if (categoryName.trim()) {
      setCategories([...categories, { name: categoryName, fields: [] }]);
      setCategoryName('');
    }
  };

  const handleAddField = () => {
    if (fieldValue.trim() && selectedCategory) {
      const updatedCategories = categories.map(category => {
        if (category.name === selectedCategory) {
          return { ...category, fields: [...category.fields, fieldValue] };
        }
        return category;
      });
      setCategories(updatedCategories);
      setFieldValue('');
    }
  };

  const handleEditField = (categoryName, index) => {
    setFieldValue(categories.find(cat => cat.name === categoryName).fields[index]);
    setEditFieldIndex(index);
    setSelectedCategory(categoryName);
  };

  const handleUpdateField = () => {
    if (fieldValue.trim() && selectedCategory) {
      const updatedCategories = categories.map(category => {
        if (category.name === selectedCategory) {
          const updatedFields = category.fields.map((field, index) => {
            return index === editFieldIndex ? fieldValue : field;
          });
          return { ...category, fields: updatedFields };
        }
        return category;
      });
      setCategories(updatedCategories);

      // Update mapping
      setFieldMappings(prevMappings => {
        const newMappings = { ...prevMappings };
        const oldFieldName = categories.find(cat => cat.name === selectedCategory).fields[editFieldIndex];
        if (newMappings[oldFieldName]) {
          newMappings[fieldValue] = newMappings[oldFieldName];
          delete newMappings[oldFieldName];
        }
        return newMappings;
      });

      setFieldValue('');
      setEditFieldIndex(-1);
      setSelectedCategory('');
    }
  };

  const handleDeleteField = (categoryName, index) => {
    const fieldName = categories.find(cat => cat.name === categoryName).fields[index];
    // Remove mapping
    setFieldMappings(prevMappings => {
      const newMappings = { ...prevMappings };
      delete newMappings[fieldName];
      return newMappings;
    });

    const updatedCategories = categories.map(category => {
      if (category.name === categoryName) {
        const updatedFields = category.fields.filter((_, i) => i !== index);
        return { ...category, fields: updatedFields };
      }
      return category;
    });
    setCategories(updatedCategories);
  };

  const handleDeleteCategory = (index) => {
    const categoryName = categories[index].name;
    const categoryFields = categories[index].fields;

    // Remove mappings
    setFieldMappings(prevMappings => {
      const newMappings = { ...prevMappings };
      categoryFields.forEach(field => {
        delete newMappings[field];
      });
      return newMappings;
    });

    const updatedCategories = categories.filter((_, i) => i !== index);
    setCategories(updatedCategories);
  };

  const handleUploadFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        try {
          if (file.type === 'application/json') {
            const jsonContent = JSON.parse(text);
            jsonContent.forEach(cat => {
              const existingCategory = categories.find(c => c.name === cat.name);
              if (existingCategory) {
                existingCategory.fields.push(...cat.fields);
                setCategories([...categories]);
              } else {
                setCategories(prevCategories => [...prevCategories, cat]);
              }
            });
          } else if (file.type === 'text/csv') {
            const rows = text.split('\n').map(line => line.trim()).filter(Boolean);
            rows.forEach(row => {
              const [catName, field] = row.split(',');
              const existingCategory = categories.find(c => c.name === catName.trim());
              if (existingCategory) {
                existingCategory.fields.push(field.trim());
                setCategories([...categories]);
              } else {
                setCategories(prevCategories => [...prevCategories, { name: catName.trim(), fields: [field.trim()] }]);
              }
            });
          }
        } catch (error) {
          console.error('Error parsing file:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFieldMapping = (rightField, leftField) => {
    setFieldMappings(prevMappings => {
      const newMappings = { ...prevMappings };
      newMappings[rightField] = leftField;

      // הוספת השדה שנקשר ל־linkedFields
      setLinkedFields(prevLinkedFields => new Set(prevLinkedFields).add(leftField));
      return newMappings;
    });
    onFieldDrop(leftField);
  };

  const handleRemoveLink = (field) => {
    setLinkedFields((prevLinkedFields) => {
      const updatedLinkedFields = new Set(prevLinkedFields);
      updatedLinkedFields.delete(field);
      return updatedLinkedFields;
    });

    setFieldMappings((prevMappings) => {
      const updatedMappings = { ...prevMappings };
      delete updatedMappings[field];
      return updatedMappings;
    });
  };

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'FIELD',
    drop: (item) => {
      handleAddField(item.field);
      onFieldDrop(item.field);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <Grid container spacing={2} style={{ padding: '20px' }}>
      <Grid item xs={12}>
        <Paper ref={drop} style={{ padding: '20px', border: '2px dashed #ccc', background: isOver ? '#e0e0e0' : 'white' }}>
          <Typography variant="h6">Custom Fields and Categories</Typography>
          <Grid container spacing={2} style={{ marginBottom: '20px' }}>
            <Grid item xs={4}>
              <TextField
                label="Cat Name"
                variant="outlined"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                style={{ width: '100%', height: '40px' }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Field Name"
                variant="outlined"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                style={{ width: '100%', height: '40px' }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                select
                label="Select Cat"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ width: '100%', height: '40px' }}
                SelectProps={{
                  native: true,
                }}
                InputLabelProps={{ shrink: true }}
              >
                <option value=""> </option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Grid container spacing={2} style={{ marginBottom: '10px' }}>
            <Grid item>
              <IconButton onClick={handleAddCategory} style={{ marginRight: '10px' }} title="Add Category">
                <AddCircleOutlineIcon />
              </IconButton>
            </Grid>
            <Grid item>
              <IconButton onClick={editFieldIndex >= 0 ? handleUpdateField : handleAddField} title={editFieldIndex >= 0 ? 'Update Field' : 'Add Field'}>
                <AddTaskIcon />
              </IconButton>
            </Grid>
            <Grid item>
              <input accept=".csv,.json" id="upload-file" type="file" style={{ display: 'none' }} onChange={handleUploadFile} />
              <label htmlFor="upload-file">
                <IconButton component="span" title="UPLOAD CATEGORIES AND FIELDS">
                  <UploadIcon />
                </IconButton>
              </label>
              {uploadedFileName && (
                <Typography variant="body2" style={{ marginLeft: '10px' }}>
                  {`Uploaded: ${uploadedFileName}`}
                </Typography>
              )}
            </Grid>
          </Grid>
          <List
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
              border: '1px solid #ccc',
              padding: '10px',
              borderRadius: '5px',
            }}
          >
            {categories.map((category, catIndex) => (
              <div key={catIndex}>
                <ListItem style={{ backgroundColor: '#d1e7dd', borderRadius: '5px', margin: '5px 0' }}>
                  <ListItemText primary={category.name} style={{ fontWeight: 'bold', color: '#0f5132' }} />
                  <IconButton edge="end" onClick={() => handleDeleteCategory(catIndex)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
                {category.fields.map((field, index) => (
                  <DropTargetField
                    key={index}
                    field={field}
                    mappedField={fieldMappings[field]}
                    onDrop={handleFieldMapping}
                    onClick={() => linkedFields.has(field) && handleRemoveLink(field)}
                    icon={<CheckIcon fontSize="small" style={{ color: 'red', cursor: 'pointer' }} />}
                  />
                ))}
              </div>
            ))}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default RightSide;

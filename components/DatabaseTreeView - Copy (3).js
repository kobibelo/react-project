import React, { useState, useEffect } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const ExampleField = ({ field, onDrop, onUnlink }) => {
  const [{ isOver }, drop] = useDrop({
    accept: "FIELD",
    drop: (item) => onDrop(item, field),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      style={{
        padding: "15px",
        margin: "15px",
        border: "2px dashed #007bff",
        borderRadius: "12px",
        backgroundColor: isOver ? "#e0f7fa" : "#ffffff",
        position: "relative",
        boxShadow: "0 6px 10px rgba(0, 0, 0, 0.15)",
        transition: "background-color 0.3s ease",
      }}
    >
      <strong style={{ fontSize: "1.1em", color: "#007bff" }}>
        {field.name}
      </strong>
      {field.linkedFields && field.linkedFields.length > 0 && (
        <ul style={{ marginTop: "10px", paddingLeft: "20px", color: "#555" }}>
          {field.linkedFields.map((linkedField, index) => (
            <li key={index}>
              {`${linkedField.dbName} / ${linkedField.tableName} / ${linkedField.name}`}
            </li>
          ))}
        </ul>
      )}
      {field.linkedFields && field.linkedFields.length > 0 && (
        <button
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: "#d32f2f",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "6px 12px",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
          onClick={() => onUnlink(field.id)}
        >
          Unlink All
        </button>
      )}
    </div>
  );
};

const DraggableField = ({ field }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "FIELD",
    item: {
      id: field.id,
      dbName: field.dbName || "Unknown Database",
      tableName: field.tableName || "Unknown Table",
      name: field.name,
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        padding: "12px",
        margin: "10px",
        border: field.linked ? "2px solid #1e88e5" : "1px solid #ccc",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
        cursor: "move",
        boxShadow: "0 3px 6px rgba(0, 0, 0, 0.1)",
        transition: "box-shadow 0.3s ease",
      }}
    >
      {field.name}
    </div>
  );
};


const ThirdStep = ({ mssqlServerName }) => {
  const [exampleFields, setExampleFields] = useState([
    { id: uuidv4(), name: 'Example Field 1', linkedFields: [] },
    { id: uuidv4(), name: 'Example Field 2', linkedFields: [] },
    { id: uuidv4(), name: 'Example Field 3', linkedFields: [] },
  ]);
  const [tree, setTree] = useState([]);
  const [query, setQuery] = useState('');
  const [savedQueries, setSavedQueries] = useState([]);
  const [queryResult, setQueryResult] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0); // Reset file input after each upload
  const [fieldNameMapping, setFieldNameMapping] = useState({});

  
  const handleViewDataClick = async () => {
    if (!exampleFields || exampleFields.length === 0) {
      alert('No fields available for mapping.');
      return;
    }
  
    // חישוב המיפוי
    const mappedFields = computeMappedFields();
    
    try {
      // שליפת כל הנתונים
      const originalData = await fetchAllTablesData();
  
      // טבלת מיפוי: שמות מקור (כולל בסיס נתונים, טבלה ושדה) ושמות חדשים
      const mappingTableHTML = `
        <h2 style="text-align:center;">Mapping Table</h2>
        <table border="1" style="width:100%; text-align:left; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f4f4f4;">
              <th style="padding: 10px;">Original Field</th>
              <th style="padding: 10px;">New Field</th>
            </tr>
          </thead>
          <tbody>
            ${Object.keys(mappedFields)
              .map(
                (originalField) => `
                <tr>
                  <td style="padding: 10px;">
                    ${mappedFields[originalField].dbName} /
                    ${mappedFields[originalField].tableName} /
                    ${originalField}
                  </td>
                  <td style="padding: 10px;">${mappedFields[originalField].newName}</td>
                </tr>
              `
              )
              .join('')}
          </tbody>
        </table>
      `;
  
      // טבלת נתונים: שדות חדשים והנתונים מהמקור
      const dataTableHTML = `
      <h2 style="text-align:center;">Mapped Data</h2>
      <table border="1" style="width:100%; text-align:left; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f4f4f4;">
            ${Object.values(mappedFields)
              .map((field) => `<th style="padding: 10px;">${field.newName}</th>`)
              .join('')}
          </tr>
        </thead>
        <tbody>
          ${originalData
            .map(
              (row) => `
              <tr>
                ${Object.keys(mappedFields)
                  .map((originalField) => `<td style="padding: 10px;">${row[mappedFields[originalField].newName] || 'N/A'}</td>`)
                  .join('')}
              </tr>
            `
            )
            .join('')}
        </tbody>
      </table>
    `;
    
  
      // יצירת חלון חדש עם הטבלאות
      const newWindow = window.open('', '_blank', 'width=1200,height=800');
      if (newWindow) {
        newWindow.document.open();
        newWindow.document.write(`
          <html>
            <head>
              <title>Mapped Data</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
                }
                th, td {
                  border: 1px solid #ddd;
                  padding: 10px;
                }
                th {
                  background-color: #007bff;
                  color: white;
                }
              </style>
            </head>
            <body>
              ${mappingTableHTML}
              <hr />
              ${dataTableHTML}
            </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        alert('Unable to open a new window. Please check your browser settings.');
      }
    } catch (error) {
      console.error('Error fetching data:', error.message);
      alert('An error occurred while fetching data.');
    }
  };
         
  // פונקציה לטעינת שדות מתוך קובץ טקסט
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target.result;
      const lines = fileContent.split('\n').filter((line) => line.trim() !== '');
      const newFields = lines.map((line) => ({
        id: uuidv4(),
        name: line.trim(),
        linkedFields: [],
      }));
      setExampleFields(newFields);
    };
    reader.readAsText(file);

    // Reset file input for next upload
    setFileInputKey((prevKey) => prevKey + 1);
  };

  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const response = await axios.post('http://localhost:3001/get-databases', {
          serverName: mssqlServerName,
        });
        const databases = response.data.databases;
        const updatedTree = databases.map((dbName) => ({
          id: uuidv4(),
          name: dbName,
          children: [],
          loaded: false,
          type: 'Database',
        }));
        setTree(updatedTree);
      } catch (error) {
        console.error('Error fetching databases:', error);
      }
    };

    fetchDatabases();
  }, []);

/*   useEffect(() => {
    const fetchFieldNameMapping = async () => {
      try {
        const response = await axios.post('http://localhost:3001/get-field-mapping');
        if (response.data.success) {
          setFieldNameMapping(response.data.mapping);
        } else {
          console.error('Failed to fetch field mapping:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching field mapping:', error);
      }
    };
  
    fetchFieldNameMapping();
  }, []); */
  
const parseQuery = (query) => {
  const fieldRegex = /\[([^\]]+)\]\.\[([^\]]+)\](?:\s+AS\s+([^\s,]+))?/g;
  const tableRegex = /FROM\s+\[([^\]]+)\]\.\[([^\]]+)\]\.\[([^\]]+)\]/g;
  const joinRegex = /JOIN\s+\[([^\]]+)\]\.\[([^\]]+)\]\.\[([^\]]+)\]/g;

  const fields = [];
  let match;

  // Extract fields with alias
  while ((match = fieldRegex.exec(query)) !== null) {
    if (match[3]) { // Check if alias exists
      fields.push({
        tableName: match[1],
        alias: match[3],
      });
    }
  }

  const tables = [];
  
  // Extract tables from FROM clause
  while ((match = tableRegex.exec(query)) !== null) {
    tables.push({
      databaseName: match[1],
      schemaName: match[2],
      tableName: match[3],
    });
  }

  // Extract tables from JOIN clauses
  while ((match = joinRegex.exec(query)) !== null) {
    tables.push({
      databaseName: match[1],
      schemaName: match[2],
      tableName: match[3],
    });
  }

  console.log("Tables found:", tables);
  console.log("Fields found (new aliases only):", fields);

  return { tables, fields };
};

const updateTreeFromQuery = (query) => {
  const { tables, fields } = parseQuery(query);

  if (!tables || tables.length === 0) {
    console.warn("No tables found in query.");
    return;
  }

  setTree((prevTree) => {
    const newTree = [...prevTree];

    // יצירת Node עבור QUERY אם לא קיים
    let queryNode = newTree.find((node) => node.name === "QUERY");
    if (!queryNode) {
      queryNode = {
        id: uuidv4(),
        name: "QUERY",
        children: [],
        loaded: true,
        type: "QUERY",
      };
      newTree.push(queryNode);
    }

    // הוספת בסיס נתונים, טבלאות ושדות ל-QUERY Node
    tables.forEach((table) => {
      const dbNode = {
        id: uuidv4(),
        name: table.databaseName,
        children: [],
        loaded: true,
        type: "Database",
      };

      let existingDbNode = queryNode.children.find(
        (child) => child.name === table.databaseName
      );

      if (!existingDbNode) {
        queryNode.children.push(dbNode);
        existingDbNode = dbNode;
      }

      // הוספת הטבלה
      const tableNode = {
        id: uuidv4(),
        name: table.tableName,
        children: [],
        loaded: true,
        type: "Table",
      };

      let existingTableNode = existingDbNode.children.find(
        (child) => child.name === table.tableName
      );

      if (!existingTableNode) {
        existingDbNode.children.push(tableNode);
        existingTableNode = tableNode;
      }

      // הוספת השדות לטבלה
      fields
        .filter((field) => field.tableName === table.tableName)
        .forEach((field) => {
          if (
            !existingTableNode.children.find((child) => child.name === field.alias || field.fieldName)
          ) {
            existingTableNode.children.push({
              id: uuidv4(),
              name: field.alias || field.fieldName,
              type: "Field",
              dbName: table.databaseName,
              tableName: table.tableName,
              loaded: true,
            });
          }
        });
    });

    return newTree;
  });
};

 
  const handleLoadTables = async (dbId, dbName) => {
    try {
      const tablesResponse = await axios.post('http://localhost:3001/get-tables', {
        serverName: mssqlServerName,
        databaseName: dbName,
      });
      const tables = tablesResponse.data.tables;
      const updatedTree = tree.map((db) =>
        db.id === dbId
          ? {
            ...db,
            children: tables.map((tableName) => ({
              id: uuidv4(),
              name: tableName,
              children: [],
              loaded: false,
              type: 'Table',
            })),
            loaded: true,
          }
          : db
      );
      setTree(updatedTree);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const handleLoadFields = async (dbId, tableId, dbName, tableName) => {
    try {
      const fieldsResponse = await axios.post('http://localhost:3001/get-fields', {
        serverName: mssqlServerName,
        databaseName: dbName,
        tableName,
      });
      const fields = fieldsResponse.data.fields;
      const updatedTree = tree.map((db) =>
        db.id === dbId
          ? {
            ...db,
            children: db.children.map((table) =>
              table.id === tableId
                ? {
                  ...table,
                  children: fields.map((fieldName) => ({
                    id: uuidv4(),
                    name: fieldName,
                    dbName,
                    tableName,
                    linked: false,
                    type: 'Field',
                  })),
                  loaded: true,
                }
                : table
            ),
          }
          : db
      );
      setTree(updatedTree);
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };

  const handleDrop = (draggedField, targetField) => {
    // בדיקת פרטים לשדה שנגרר
    if (!draggedField.dbName || !draggedField.tableName || !draggedField.name) {
      console.error("Dragged field is missing required information:", draggedField);
      return;
    }
  
    // עדכון הרשימה בצד הימני
    setExampleFields((prevFields) =>
      prevFields.map((field) =>
        field.id === targetField.id
          ? {
              ...field,
              linkedFields: [
                ...(field.linkedFields || []),
                {
                  id: draggedField.id,
                  dbName: draggedField.dbName || "Unknown Database",
                  tableName: draggedField.tableName || "Unknown Table",
                  name: draggedField.name,
                },
              ],
            }
          : field
      )
    );
  
    // עדכון הרשימה בצד השמאלי
    setTree((prevTree) =>
      prevTree.map((node) => {
        if (node.type === "Database" || node.type === "QUERY") {
          return {
            ...node,
            children: node.children.map((childNode) => {
              if (childNode.type === "Table" || childNode.type === "QUERY") {
                return {
                  ...childNode,
                  children: childNode.children.map((fieldNode) => {
                    if (fieldNode.id === draggedField.id) {
                      return { ...fieldNode, linked: true };
                    }
                    return fieldNode;
                  }),
                };
              }
              return childNode;
            }),
          };
        }
        return node;
      })
    );
  };
  
  
  
  
  // פונקציה לעדכון QUERY Node
  const updateQueryNode = (queryNode, draggedField) => {
    return {
      ...queryNode,
      children: queryNode.children.map((dbNode) => ({
        ...dbNode,
        children: dbNode.children.map((tableNode) => ({
          ...tableNode,
          children: tableNode.children.map((field) => {
            if (field.id === draggedField.id) {
              return { ...field, linked: true };
            }
            return field;
          }),
        })),
      })),
    };
  };

  const handleUnlink = (fieldId) => {
    // שליפת השדות שצריך לנתק מתוך צד ימין
    const fieldsToUnlink = exampleFields.find((field) => field.id === fieldId)?.linkedFields || [];
  
    // הסרת השדות מצד ימין
    setExampleFields((prevFields) =>
      prevFields.map((field) =>
        field.id === fieldId ? { ...field, linkedFields: [] } : field
      )
    );
  
    // הסרת החיווי מצד שמאל
    setTree((prevTree) =>
      prevTree.map((node) => {
        if (node.type === "Database" || node.name === "QUERY") {
          return {
            ...node,
            children: node.children.map((childNode) => {
              if (childNode.type === "Table" || childNode.name === "QUERY") {
                return {
                  ...childNode,
                  children: childNode.children.map((fieldNode) => {
                    if (fieldsToUnlink.some((linkedField) => linkedField.id === fieldNode.id)) {
                      return { ...fieldNode, linked: false };
                    }
                    return fieldNode;
                  }),
                };
              }
              return childNode;
            }),
          };
        }
        return node;
      })
    );
  };
  
  
  // פונקציה לעדכון QUERY Node להסרת החיווי
  const updateQueryUnlink = (queryNode, fieldsToUnlink) => {
    return {
      ...queryNode,
      children: queryNode.children.map((dbNode) => ({
        ...dbNode,
        children: dbNode.children.map((tableNode) => ({
          ...tableNode,
          children: tableNode.children.map((field) => {
            if (fieldsToUnlink.some((linkedField) => linkedField.id === field.id)) {
              return { ...field, linked: false }; // הסרת חיווי
            }
            return field;
          }),
        })),
      })),
    };
  };
  
  const handleToggleNode = (node, parent) => {
    const nodeId = node.id;
    // nodeId, dbId, dbName, tableId, tableName
    if (expandedNodes.includes(nodeId)) {
      setExpandedNodes((prev) => prev.filter((id) => id !== nodeId));
    } else {
      setExpandedNodes((prev) => [...prev, nodeId]);

      if (!node.type) {
        return
      }

      if (node.type === 'Database') {
        const dbId = node.id;
        const dbName = node.name;

        // Load tables if it wasn't loaded
        if (!node.loaded) {
          handleLoadTables(dbId, dbName);
        }
      } else if (node.type === 'Table' && parent?.type === 'Database') {
        const tableId = node.id;
        const tableName = node.name;
        const dbId = parent.id;
        const dbName = parent.name;

        if (!node.loaded) {
          handleLoadFields(dbId, tableId, dbName, tableName);
        }
      }
    }
  };

  const handleQueryExecution = async () => {
    if (!query) {
      console.error("No query provided.");
      return;
    }
  
    try {
      const response = await axios.post("http://localhost:3001/execute-query", { query });
  
      if (response.data.success) {
        console.log("Query Result with Source:", response.data.result);
  
        setQueryResult(response.data.result);
  
        updateTreeFromQuery(query);
      } else {
        console.error("Query execution failed:", response.data.message);
      }
    } catch (error) {
      console.error("Error executing query:", error.message);
    }
  }; 
  
  const handleSaveQuery = () => {
    if (query.trim() !== '') {
      setSavedQueries([...savedQueries, query]);
      setQuery(''); // Reset query field after saving
    }
  };

  const handleLoadQuery = (selectedQuery) => {
    setQuery(selectedQuery);
  };

  const renderTree = (node, parent = null, depth = 0) => {
    if (node.type === 'Field') {
      const field = node;
  
      return (
        <div
          key={field.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            color: field.linked ? '#1e88e5' : '#000',
            paddingLeft: `${depth * 10}px`,
          }}
        >
          <DraggableField field={field} />
        </div>
      );
    }
  
    const headingTag = depth === 0 ? 'h4' : 'h5';
  
    return (
      <div key={node.id} style={{ marginLeft: `${depth * 20}px` }}>
        {React.createElement(
          headingTag,
          {
            style: {
              color: depth === 0 ? '#333' : '#666',
              cursor: 'pointer',
              fontWeight: depth === 0 ? '600' : '500',
            },
            onClick: () => handleToggleNode(node, parent),
          },
          <>
            {expandedNodes.includes(node.id) ? '▼' : '▶'} {node.name}
          </>
        )}
        {expandedNodes.includes(node.id) &&
          node.children.map((child) => renderTree(child, node, depth + 1))}
      </div>
    );
  };
  
  

  const computeMappedFields = () => {
    return exampleFields.reduce((acc, field) => {
      field.linkedFields.forEach((linkedField) => {
        acc[linkedField.name] = {
          newName: field.name,
          tableName: linkedField.tableName,
          dbName: linkedField.dbName,
        };
      });
      return acc;
    }, {});
  };
  
  const fetchAllTablesData = async () => {
    const mappedFields = computeMappedFields();
    console.log('Mapped Fields:', mappedFields);
  
    if (!Object.keys(mappedFields).length) {
      alert('No fields mapped for fetching data.');
      return [];
    }
  
    const tables = [...new Set(Object.values(mappedFields).map((field) => `${field.dbName}.${field.tableName}`))];
  
    try {
      const data = await Promise.all(
        tables.map(async (table) => {
          const [dbName, tableName] = table.split('.');
          const relevantFields = Object.keys(mappedFields).filter(
            (key) => mappedFields[key].tableName === tableName && mappedFields[key].dbName === dbName
          );
          console.log('Relevant Fields:', relevantFields);
  
          const response = await axios.post('http://localhost:3001/get-table-data', {
            serverName: mssqlServerName,
            databaseName: dbName,
            tableName,
            mappedFields: relevantFields,
          });
  
          if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch table data.');
          }
  
          const fields = response.data.data;
          console.log('Server Response Fields:', fields);
  
          return fields.map((row) => {
            const mappedRow = {};
            relevantFields.forEach((field) => {
              const matchingField = field; // תואם לשם השדה המקורי
              if (row.hasOwnProperty(matchingField)) {
                mappedRow[mappedFields[field].newName] = row[matchingField];
              } else {
                console.warn(`No match found for field: ${field}`);
                mappedRow[mappedFields[field].newName] = 'N/A';
              }
            });
            return mappedRow;
          });
        })
      );
  
      return data.flat();
    } catch (error) {
      console.error('Error fetching table data:', error.message);
      return [];
    }
  };

  
  return (
<DndProvider backend={HTML5Backend}>
  <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', backgroundColor: '#f4f6f8' }}>
    <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#ffffff', borderRight: '1px solid #ddd' }}>
      {/* תצוגת העץ של מסדי הנתונים */}
      <h3 style={{ color: '#007bff', marginBottom: '20px' }}>Database TreeView</h3>
      <div>{tree.map((db) => renderTree(db))}</div>
    </div>
    <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f7f9fc' }}>
      <h3 style={{ color: '#007bff', marginBottom: '20px' }}>Example Fields</h3>

      {/* אייקון לטעינת קובץ */}
      <div style={{ marginBottom: '20px' }}>
        <input
          key={fileInputKey}
          type="file"
          accept=".txt"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'background-color 0.3s ease',
          }}
        >
          Upload Fields from File
        </label>
      </div>

      {/* תצוגת השדות */}
      {exampleFields.map((field) => (
        <ExampleField key={field.id} field={field} onDrop={handleDrop} onUnlink={handleUnlink} />
      ))}

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter your complex query here..."
        style={{
          width: '100%',
          height: '120px',
          marginTop: '20px',
          padding: '15px',
          borderRadius: '12px',
          border: '1px solid #ddd',
          fontSize: '1em',
          backgroundColor: '#ffffff',
        }}
      />
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button
          onClick={handleQueryExecution}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
            fontWeight: '600',
          }}
        >
          Execute Query
        </button>
        <button
          onClick={handleSaveQuery}
          style={{
            padding: '12px 24px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
            fontWeight: '600',
          }}
        >
          Save Query
        </button>
             {/* כפתור VIEW DATA */}
      <button
        onClick={handleViewDataClick}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '20px',
        }}
      >
        VIEW DATA
      </button>

      </div>
      {queryResult && (
  <div>
    <h4>Query Result:</h4>
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          {queryResult.headers.map((header, index) => (
            <th key={index} style={{ border: '1px solid #ddd', padding: '8px' }}>
              {header.name}
              <div style={{ fontSize: '0.8em', color: '#888' }}>
                {header.source || 'Unknown Source'}
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {queryResult.data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {queryResult.headers.map((header, colIndex) => (
              <td key={colIndex} style={{ border: '1px solid #ddd', padding: '8px' }}>
                {row[header.name]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
      <select
        onChange={(e) => handleLoadQuery(e.target.value)}
        style={{
          marginTop: '20px',
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          fontSize: '1em',
        }}
      >
        <option value="">Select a saved query</option>
        {savedQueries.map((savedQuery, index) => (
          <option key={index} value={savedQuery}>
            {savedQuery}
          </option>
        ))}
      </select>
    </div>
  </div>
</DndProvider>
);
};

export default ThirdStep;

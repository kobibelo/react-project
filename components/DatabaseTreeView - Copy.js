import React, { useState, useEffect } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const ExampleField = ({ field, onDrop, onUnlink }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'FIELD',
    drop: (item) => onDrop(item, field),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      style={{
        padding: '15px',
        margin: '15px',
        border: '2px dashed #007bff',
        borderRadius: '12px',
        backgroundColor: isOver ? '#e0f7fa' : '#ffffff',
        position: 'relative',
        boxShadow: '0 6px 10px rgba(0, 0, 0, 0.15)',
        transition: 'background-color 0.3s ease',
      }}
    >
      <strong style={{ fontSize: '1.1em', color: '#007bff' }}>{field.name}</strong>
      {field.linkedFields && field.linkedFields.length > 0 && (
        <ul style={{ marginTop: '10px', paddingLeft: '20px', color: '#555' }}>
          {field.linkedFields.map((linkedField, index) => (
            <li key={index}>{`${linkedField.dbName} / ${linkedField.tableName} / ${linkedField.name}`}</li>
          ))}
        </ul>
      )}
      {field.linkedFields && field.linkedFields.length > 0 && (
        <button
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: '#d32f2f',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 12px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
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
    type: 'FIELD',
    item: field,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        padding: '12px',
        margin: '10px',
        border: field.linked ? '2px solid #1e88e5' : '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        cursor: 'move',
        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)',
        transition: 'box-shadow 0.3s ease',
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

  const updateTreeWithQueryResult = (queryResult) => {
    setTree((prevTree) => {
      // מציאת או יצירת צומת QUERY
      let queryNode = prevTree.find((node) => node.name === "QUERY");
      if (!queryNode) {
        queryNode = {
          id: uuidv4(),
          name: "QUERY",
          children: [],
          loaded: true,
        };
        prevTree = [...prevTree, queryNode];
      }

      // מציאת או הוספת בסיס הנתונים
      const databaseName = queryResult.currentDatabase || "Unknown Database";
      let databaseNode = queryNode.children.find((node) => node.name === databaseName);
      if (!databaseNode) {
        databaseNode = {
          id: uuidv4(),
          name: databaseName,
          children: [],
          loaded: true,
          type: 'Database',
        };
        queryNode.children.push(databaseNode);
      }

      // מעבר על headers להוספת טבלאות ושדות
      queryResult.headers.forEach((header) => {
        // פיצול המידע של השדה למרכיביו
        const sourceParts = header.source.split(".");
        if (sourceParts.length < 3) {
          console.warn("Invalid source format:", header.source);
          return;
        }
      
        const databaseName = queryResult.currentDatabase || "Unknown Database"; // בדיקת שם בסיס הנתונים
        const tableName = sourceParts[2].replace(/[\[\]]/g, ""); // ניקוי סוגריים מרובעים משם הטבלה
        const fieldName = header.name; // שם השדה
      
        // בדיקה אם המידע המלא קיים
        if (!databaseName || !tableName || !fieldName) {
          console.error("Missing information for header:", header);
          return;
        }
      
        // מציאת או יצירת טבלה בעץ
        let tableNode = databaseNode.children.find((node) => node.name === tableName);
        if (!tableNode) {
          tableNode = {
            id: uuidv4(),
            name: tableName,
            children: [],
            loaded: true,
            type: 'Table',
          };
          databaseNode.children.push(tableNode);
        }
      
        // הוספת שדה לטבלה אם אינו קיים
        const fieldExists = tableNode.children.some((node) => node.name === fieldName);
        if (!fieldExists) {
          tableNode.children.push({
            id: uuidv4(),
            name: fieldName,
            dbName: databaseName, // הוספת שם בסיס הנתונים
            tableName: tableName, // הוספת שם הטבלה
            type: 'Field',
          });
        }
      });
      

      console.log("Updated tree:", JSON.stringify(prevTree, null, 2));
      return [...prevTree];
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
              linkedFields: [...(field.linkedFields || []), draggedField],
            }
          : field
      )
    );
  
    // עדכון הרשימה בצד השמאלי
    setTree((prevTree) =>
      prevTree.map((db) => ({
        ...db,
        children: db.children.map((table) => ({
          ...table,
          children: table.children.map((field) => {
            // עדכון חיווי עבור שדות מתוך בסיסי הנתונים
            if (field.id === draggedField.id) {
              return { ...field, linked: true };
            }
  
            return field;
          }),
        })),
      }))
    );
  
    // חיווי עבור QUERY
    setTree((prevTree) => {
      return prevTree.map((node) => {
        if (node.name === "QUERY") {
          return updateQueryNode(node, draggedField);
        }
        return node;
      });
    });
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
  
    // הסרת החיווי מצד שמאל עבור השדות מבסיסי הנתונים
    setTree((prevTree) =>
      prevTree.map((db) => ({
        ...db,
        children: db.children.map((table) => ({
          ...table,
          children: table.children.map((field) =>
            fieldsToUnlink.some((linkedField) => linkedField.id === field.id)
              ? { ...field, linked: false }
              : field
          ),
        })),
      }))
    );
  
    // הסרת החיווי מצד שמאל עבור שדות מתוך QUERY
    setTree((prevTree) =>
      prevTree.map((node) => {
        if (node.name === "QUERY") {
          return updateQueryUnlink(node, fieldsToUnlink);
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
      console.log('No query provided.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/execute-query', { query });

      if (response.data.success) {
        console.log('Query Result with Source:', response.data.result);
        setQueryResult(response.data.result); // שמירה של תוצאת ה-Query

        // עדכון העץ עם תוצאות ה-Query
        updateTreeWithQueryResult(response.data.result);
      } else {
        console.error('Query execution failed:', response.data.message);
      }
    } catch (error) {
      console.error('Error executing query:', error);
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

      // Render only the DraggableField for leaf nodes
      return (
        <div key={field.id} style={{ display: 'flex', alignItems: 'center', color: field.linked ? '#1e88e5' : '#000' }}>
          <DraggableField field={field} />
        </div>
      );
    }

    // Determine heading level based on depth
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
          {exampleFields.map((field) => (
            <ExampleField key={field.id} field={field} onDrop={handleDrop} onUnlink={handleUnlink} />
          ))}
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your complex query here..."
            style={{ width: '100%', height: '120px', marginTop: '20px', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1em', backgroundColor: '#ffffff' }}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={handleQueryExecution} style={{ padding: '12px 24px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.3s ease', fontWeight: '600' }}>
              Execute Query
            </button>
            <button onClick={handleSaveQuery} style={{ padding: '12px 24px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.3s ease', fontWeight: '600' }}>
              Save Query
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
            style={{ marginTop: '20px', width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1em' }}
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

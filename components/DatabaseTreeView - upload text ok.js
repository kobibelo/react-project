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

const ThirdStep = () => {
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
          serverName: 'DESKTOP-2P1P17M',
        });
        const databases = response.data.databases;
        const updatedTree = databases.map((dbName) => ({
          id: uuidv4(),
          name: dbName,
          children: [],
          loaded: false,
        }));
        setTree(updatedTree);
      } catch (error) {
        console.error('Error fetching databases:', error);
      }
    };

    fetchDatabases();
  }, []);

  const updateTreeWithQueryResult = (queryResult) => {
    const updatedTree = [...tree]; // עותק של העץ הקיים
    const currentDatabase = queryResult.currentDatabase;

    // חיפוש או הוספת בסיס הנתונים לעץ
    let databaseNode = updatedTree.find((db) => db.name === currentDatabase);
    if (!databaseNode) {
        databaseNode = {
            id: uuidv4(),
            name: currentDatabase,
            children: [],
            loaded: true,
        };
        updatedTree.push(databaseNode);
    }

    // חיפוש או הוספת טבלאות ושדות לעץ
    queryResult.headers.forEach((header) => {
        const [database, schema, table] = header.source.split('.');
        const fieldName = header.name;

        // חיפוש הטבלה
        let tableNode = databaseNode.children.find((tbl) => tbl.name === table);
        if (!tableNode) {
            tableNode = {
                id: uuidv4(),
                name: table,
                children: [],
                loaded: true,
            };
            databaseNode.children.push(tableNode);
        }

        // הוספת השדה
        const fieldNode = {
            id: uuidv4(),
            name: fieldName,
            children: [],
        };
        tableNode.children.push(fieldNode);
    });

    setTree(updatedTree); // עדכון ה-State של העץ
};

  const handleLoadTables = async (dbId, dbName) => {
    try {
      const tablesResponse = await axios.post('http://localhost:3001/get-tables', {
        serverName: 'DESKTOP-2P1P17M',
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
        serverName: 'DESKTOP-2P1P17M',
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
    setTree((prevTree) =>
      prevTree.map((db) => ({
        ...db,
        children: db.children.map((table) => ({
          ...table,
          children: table.children.map((field) =>
            field.id === draggedField.id ? { ...field, linked: true } : field
          ),
        })),
      }))
    );
  };

  const handleUnlink = (fieldId) => {
    const fieldsToUnlink = exampleFields.find((field) => field.id === fieldId)?.linkedFields || [];
    setExampleFields((prevFields) =>
      prevFields.map((field) =>
        field.id === fieldId ? { ...field, linkedFields: [] } : field
      )
    );
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
  };

  const handleToggleNode = (nodeId, dbId, dbName, tableId, tableName) => {
    if (expandedNodes.includes(nodeId)) {
      setExpandedNodes((prev) => prev.filter((id) => id !== nodeId));
    } else {
      setExpandedNodes((prev) => [...prev, nodeId]);

      if (dbId && !tree.find((db) => db.id === dbId)?.loaded) {
        handleLoadTables(dbId, dbName);
      } else if (tableId && !tree.find((db) => db.id === dbId)?.children.find((table) => table.id === tableId)?.loaded) {
        handleLoadFields(dbId, tableId, dbName, tableName);
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
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const fields = text
        .split('\n') // פיצול לפי שורות
        .map((line) => line.trim())
        .filter((line) => line) // סינון שורות ריקות
        .map((name) => ({
          id: uuidv4(),
          name,
          linkedFields: [],
        }));
      setExampleFields(fields);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', backgroundColor: '#f4f6f8' }}>
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#ffffff', borderRight: '1px solid #ddd' }}>
          {/* תצוגת העץ של מסדי הנתונים */}
          <h3 style={{ color: '#007bff', marginBottom: '20px' }}>Database TreeView</h3>
          {tree.map((db) => (
            <div key={db.id}>
              <h4
                style={{ color: '#333', cursor: 'pointer', fontWeight: '600' }}
                onClick={() => handleToggleNode(db.id, db.id, db.name)}
              >
                {expandedNodes.includes(db.id) ? '▼' : '▶'} {db.name}
              </h4>
              {expandedNodes.includes(db.id) &&
                db.children.map((table) => (
                  <div key={table.id} style={{ marginLeft: '20px' }}>
                    <h5
                      style={{ color: '#666', cursor: 'pointer', fontWeight: '500' }}
                      onClick={() => handleToggleNode(table.id, db.id, db.name, table.id, table.name)}
                    >
                      {expandedNodes.includes(table.id) ? '▼' : '▶'} {table.name}
                    </h5>
                    {expandedNodes.includes(table.id) &&
                      table.children.map((field) => (
                        <div key={field.id} style={{ display: 'flex', alignItems: 'center', color: field.linked ? '#1e88e5' : '#000' }}>
                          <DraggableField field={field} />
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f7f9fc' }}>
          <h3 style={{ color: '#007bff', marginBottom: '20px' }}>Example Fields</h3>
          <input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            style={{ marginBottom: '20px', padding: '10px', fontSize: '1em', borderRadius: '8px', border: '1px solid #ddd' }}
          />
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

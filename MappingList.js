import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { 
  Tooltip, 
  Button, 
  Container, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  Typography, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText,
  DialogTitle,
  Box,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Checkbox,
  FormControl,
  FormGroup,
  FormControlLabel,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  Paper,
  Tab,
  Tabs
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FilterListIcon from '@mui/icons-material/FilterList';
import SaveAltRounded from '@mui/icons-material/SaveAltRounded';
import {
  EditRounded, // Icon for editing
  DeleteSweepRounded, // Icon for deletion
  DynamicFeedRounded, // Icon for viewing
  TuneRounded, // Alternative icon for editing
  VisibilityOutlined, // Icon for active
  VisibilityOffOutlined // Icon for inactive
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

// סגנונות מותאמים אישית
const StyledTableCell = styled(TableCell)({
    padding: '16px',
    textAlign: 'center',
});

// תא עבור אינדיקטור בחירה
const SelectionIndicatorCell = styled(TableCell)({
    width: '20px',
    padding: '0 12px',
    borderRight: '1px solid #e0e0e0',
});

// אינדיקטור הבחירה - הנקודה עצמה
const SelectionIndicator = styled('div')({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#1976d2',
});

// עמודת כותרת בסיסית עם אפשרות מיון
const SortableHeadCell = styled(TableCell)(({ sortDirection }) => ({
    backgroundColor: '#1976d2',
    color: 'white',
    fontWeight: 'bold',
    padding: '10px 16px',
    height: '55px',
    cursor: 'pointer',
    userSelect: 'none',
    position: 'relative',
    textAlign: 'center',
    '&:hover': {
        backgroundColor: '#1565c0',
    },
    '&::after': {
        content: sortDirection === 'asc' ? '"▲"' : 
                 sortDirection === 'desc' ? '"▼"' : '""',
        position: 'absolute',
        right: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '12px'
    }
}));

// עמודת כותרת צרה
const CompactHeadCell = styled(SortableHeadCell)({
    width: '50px',
});

const ActionsContainer = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
});

// סגנון אייקון כפתור
const ActionIconButton = styled(IconButton)(({ bgcolor }) => ({
    backgroundColor: `rgba(${bgcolor}, 0.08)`,
    margin: '0 4px',
    '&:hover': {
      backgroundColor: `rgba(${bgcolor}, 0.12)`,
    }
}));

// מודל לבחירת עמודות
const ColumnSelectorModal = styled(Box)(({ theme }) => ({
    position: 'absolute',
    right: 0,
    top: '100%',
    width: '280px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    padding: '20px',
    zIndex: 1000,
    marginTop: '10px',
    textAlign: 'left',
    border: '1px solid #e0e0e0'
}));

function StatusIcon({ status }) {
    return (
        <Tooltip title={status === 1 ? 'ACTIVE' : 'INACTIVE'}>
            {status === 1 ? (
                <VisibilityOutlined style={{ color: 'green', fontSize: '22px' }} />
            ) : (
                <VisibilityOffOutlined style={{ color: 'red', fontSize: '22px' }} />
            )}
        </Tooltip>
    );
}

// Local Storage keys
const COLUMNS_STORAGE_KEY = 'mappingListVisibleColumns';
const SORT_STORAGE_KEY = 'mappingListSortPreferences';
const FILTER_STORAGE_KEY = 'mappingListFilterPreferences';


function MappingList() {

    const getSavedColumns = () => {
        const savedColumns = localStorage.getItem(COLUMNS_STORAGE_KEY);
        if (savedColumns) {
            try {
                return JSON.parse(savedColumns);
            } catch (e) {
                console.error('Error parsing saved columns from localStorage:', e);
            }
        }
        
        // רק העמודות שקיימות בנתונים
        return {
            status: true,
            id: true,
            mappingName: true,
            sourceServer: true,
            exportServer: true,
            newTableName: true,
            lastUpdate: true,
            actions: true
        };
    };


    //  פונקציה לאיפוס הגדרות העמודות
    const resetColumnPreferences = () => {
        localStorage.removeItem(COLUMNS_STORAGE_KEY);
        const defaultColumns = getSavedColumns();
        setVisibleColumns(defaultColumns);
        localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(defaultColumns));
        showSnackbar('Column preferences have been reset to defaults', 'success');
    };


    const [allMappings, setAllMappings] = useState([]); // מאגר כל המיפויים לפני פילטור
    const [mappings, setMappings] = useState([]);
    const [selectedMappings, setSelectedMappings] = useState([]);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [importedData, setImportedData] = useState(null);
    const [visibleColumns, setVisibleColumns] = useState(getSavedColumns);
    const [columnSelectorOpen, setColumnSelectorOpen] = useState(false);
    const [selectedAll, setSelectedAll] = useState(false);
    const [fieldMappingDialogOpen, setFieldMappingDialogOpen] = useState(false);
    const [selectedFieldMappings, setSelectedFieldMappings] = useState(null);
    const [selectedMappingName, setSelectedMappingName] = useState('');
    const [mappingDetailsDialogOpen, setMappingDetailsDialogOpen] = useState(false);
    const [selectedMappingDetails, setSelectedMappingDetails] = useState(null);
    const [mappingTableData, setMappingTableData] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    // פונקציה לפתיחת דיאלוג הפרטים
    const handleViewDetailsClick = async (mappingId, event) => {
        if (event) {
            event.stopPropagation(); // מניעת בחירת השורה
        }
        
        try {
            setIsLoading(true);
            
            // 1. נשיג את המידע המלא של המיפוי
            const response = await axios.get(`http://localhost:3001/mapping/get/${mappingId}`);
            
            if (response.data.success && response.data.mapping) {
                console.log('API Response Data:', response.data.mapping);
                console.log('Source Table Value:', response.data.mapping.source_table);
                const fullMapping = response.data.mapping;
                
                // 2. פענוח שדה מיפויי השדות
                let fieldMappings;
                try {
                    fieldMappings = typeof fullMapping.field_mappings === 'string' 
                        ? JSON.parse(fullMapping.field_mappings) 
                        : fullMapping.field_mappings;
                    
                    // הוספת טיפול מיוחד במקרה שהמבנה אינו מתאים למצופה
                    if (fieldMappings && typeof fieldMappings === 'object') {
                        // אם יש את המבנה החדש עם source, target, mappings
                        if (fieldMappings.source && fieldMappings.target && fieldMappings.mappings) {
                            // זה כבר המבנה הנכון, לא צריך לעשות דבר
                        } 
                        // אם זה המבנה הישן שהוא אובייקט פשוט של שדה-מקור => שדה-יעד
                        else {
                            // המרה למבנה החדש
                            const enhancedFieldMappings = {
                                source: {
                                    database: fullMapping.import_database,
                                    table: fullMapping.source_table,
                                    fields: []
                                },
                                target: {
                                    database: fullMapping.export_database,
                                    table: fullMapping.new_table_name,
                                    fields: []
                                },
                                mappings: {}
                            };
                            
                            // המרת המיפויים למבנה החדש
                            for (const [sourceField, targetInfo] of Object.entries(fieldMappings)) {
                                // אם targetInfo הוא אובייקט, יש לנו כבר מידע מפורט
                                if (typeof targetInfo === 'object') {
                                    enhancedFieldMappings.mappings[sourceField] = targetInfo;
                                } 
                                // אחרת זה פשוט שם השדה או מחרוזת
                                else {
                                    enhancedFieldMappings.mappings[sourceField] = {
                                        newName: targetInfo || sourceField,
                                        tableName: fullMapping.source_table,
                                        dbName: fullMapping.import_database
                                    };
                                }
                                
                                // הוספת השדה לרשימת שדות המקור
                                enhancedFieldMappings.source.fields.push({
                                    name: sourceField,
                                    tableName: fullMapping.source_table,
                                    dbName: fullMapping.import_database
                                });
                                
                                // הוספת השדה לרשימת שדות היעד
                                enhancedFieldMappings.target.fields.push({
                                    name: typeof targetInfo === 'object' ? targetInfo.newName : (targetInfo || sourceField),
                                    tableName: fullMapping.new_table_name,
                                    dbName: fullMapping.export_database
                                });
                            }
                            
                            fieldMappings = enhancedFieldMappings;
                        }
                    }
                } catch (e) {
                    console.error('Error parsing field mappings', e);
                    fieldMappings = {};
                }
                
                // 3. שמירת המידע במצב
                setSelectedMappingDetails({
                    ...fullMapping,
                    fieldMappings
                });
                
                // 4. ניסיון לקבל נתוני טבלה מהשרת (עד 100 שורות) - נשתמש בטבלת היעד
                try {
                    // בדיקה אם יש מספיק מידע לשאילתה של טבלת היעד
                    if (fullMapping.export_server && fullMapping.new_table_name) {
                        console.log(`Fetching destination table data: ${fullMapping.export_server}/${fullMapping.export_database || 'data_mapping_db'}/${fullMapping.new_table_name}`);
                        
                        const tableDataResponse = await axios.get('http://localhost:3001/get-table-data', {
                            params: {
                                server: fullMapping.export_server,             // שרת היעד
                                database: fullMapping.export_database || 'data_mapping_db', // מסד נתונים יעד
                                table: fullMapping.new_table_name,             // טבלת היעד
                                limit: 100                                     // הגבלה ל-100 שורות
                            }
                        });
                        
                        if (tableDataResponse.data.success) {
                            setMappingTableData(tableDataResponse.data.data || []);
                        } else {
                            console.error('Failed to fetch destination table data:', tableDataResponse.data.message);
                            setMappingTableData([]);
                        }
                    } else {
                        console.warn(`Missing destination info: Server=${fullMapping.export_server}, Table=${fullMapping.new_table_name}`);
                        setMappingTableData([]);
                    }
                } catch (error) {
                    console.error('Error fetching destination table data:', error);
                    setMappingTableData([]);
                }
                
                // 5. פתיחת הדיאלוג
                setMappingDetailsDialogOpen(true);
            } else {
                showSnackbar('Failed to fetch mapping details', 'error');
            }
        } catch (error) {
            console.error('Error fetching mapping details:', error);
            showSnackbar('Error loading mapping details', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // פונקציה לסגירת הדיאלוג
    const handleCloseMappingDetailsDialog = () => {
        setMappingDetailsDialogOpen(false);
        setSelectedMappingDetails(null);
        setMappingTableData(null);
    };
    // מצב פילטר סטטוס להצגת מיפויים פעילים/לא פעילים
    const [statusFilter, setStatusFilter] = useState(() => {
        const savedFilter = localStorage.getItem(FILTER_STORAGE_KEY);
        if (savedFilter) {
            try {
                return JSON.parse(savedFilter);
            } catch (e) {
                console.error('Error parsing saved filter preferences:', e);
            }
        }
        return 'all'; // default: 'all', 'active', 'inactive'
    });
    
    // State for sorting
    const [sortConfig, setSortConfig] = useState(() => {
        // טעינת העדפות מיון מהלוקל סטורג'
        const savedSort = localStorage.getItem(SORT_STORAGE_KEY);
        if (savedSort) {
            try {
                return JSON.parse(savedSort);
            } catch (e) {
                console.error('Error parsing saved sort preferences:', e);
            }
        }
        return { key: 'id', direction: 'ascending' };
    });
    
    const navigate = useNavigate();
    
// עדכון רשימת העמודות להתאמה לנתונים האמיתיים
const allColumns = [
    { id: 'status', label: 'Status', sortKey: 'status' },
    { id: 'id', label: 'ID', sortKey: 'id' },
    { id: 'mappingName', label: 'Mapping Name', sortKey: 'mapping_name' },
    
    // שדות מקור
    { id: 'sourceServer', label: 'Source Server', sortKey: 'import_server' },
    
    // שדות יעד
    { id: 'exportServer', label: 'Destination Server', sortKey: 'export_server' },
    { id: 'newTableName', label: 'New Table Name', sortKey: 'new_table_name' },
    
    // מידע נוסף
    { id: 'lastUpdate', label: 'Last Update', sortKey: 'last_update' },
    
    { id: 'actions', label: 'Actions', sortKey: null }
];


    // פונקציה לטיפול בפתיחת דיאלוג מיפויי השדות
    const handleFieldMappingsClick = async (mappingId, mappingName, event) => {
        if (event) {
            event.stopPropagation(); // מניעת בחירת השורה
        }
        
        try {
            setIsLoading(true);
            // נשיג את המידע המלא של המיפוי
            const response = await axios.get(`http://localhost:3001/mapping/get/${mappingId}`);
            
            if (response.data.success && response.data.mapping) {
                const fullMapping = response.data.mapping;
                let fieldMappings;
                
                // פענוח שדה מיפויי השדות
                try {
                    fieldMappings = typeof fullMapping.field_mappings === 'string' 
                        ? JSON.parse(fullMapping.field_mappings) 
                        : fullMapping.field_mappings;
                } catch (e) {
                    console.error('Error parsing field mappings', e);
                    fieldMappings = fullMapping.field_mappings || {};
                }
                
                setSelectedFieldMappings(fieldMappings);
                setSelectedMappingName(mappingName || `Mapping ${mappingId}`);
                setFieldMappingDialogOpen(true);
            } else {
                showSnackbar('Failed to fetch field mappings', 'error');
            }
        } catch (error) {
            console.error('Error fetching field mappings:', error);
            showSnackbar('Error loading field mappings', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // פונקציה לסגירת דיאלוג מיפויי השדות
    const handleCloseFieldMappingsDialog = () => {
        setFieldMappingDialogOpen(false);
        setSelectedFieldMappings(null);
    };

    // בדיקה האם כל העמודות נבחרו
    useEffect(() => {
        const allSelected = allColumns.every(col => visibleColumns[col.id]);
        setSelectedAll(allSelected);
    }, [visibleColumns]);

    useEffect(() => {
        loadMappings();
    }, []);

 // הוספת קוד לבדיקת מבנה הנתונים ב-loadMappings
const loadMappings = () => {
    setIsLoading(true);
    axios.get('http://localhost:3001/mapping/list', {
        params: {
            includeInactive: true
        }
    })
    .then(response => {
        const mappingsData = response.data.mappings || [];
        
        // בדיקת מבנה הנתונים שמתקבלים מהשרת
        console.log('Full API response:', response.data);
        
        if (mappingsData.length > 0) {
            const firstMapping = mappingsData[0];
            console.log('First mapping keys:', Object.keys(firstMapping));
            
            // בדיקה האם צריך לעדכן את שמות השדות בנתונים
            // ייתכן שהשרת מחזיר שמות שדות שונים ממה שאנחנו מחפשים
            const processedMappings = mappingsData.map(mapping => {
                // בדיקה למקרה שהשדות הנחוצים אינם קיימים בתשובת השרת
                // ייתכן שצריך להתאים את שמות השדות
                
                // מיפוי ישיר של שדות שונים (במידה ויש שמות שדות אחרים)
                return {
                    ...mapping,
                    // במידה ויש שמות שדות שונים בתשובת השרת, נמפה אותם כאן
                    // לדוגמה: אם השדה נקרא import_db במקום import_database
                    import_database: mapping.import_database || mapping.import_db || mapping.source_database || ''
                };
            });
            
            console.log('Processed first mapping:', processedMappings[0]);
            setAllMappings(processedMappings);
        } else {
            setAllMappings([]);
        }
        setIsLoading(false);
    })
    .catch(error => {
        console.error('Error fetching mappings:', error);
        showSnackbar('Error fetching mappings list', 'error');
        setIsLoading(false);
        setAllMappings([]);
    });
};
    
    // פילטור המיפויים לפי הסטטוס הנבחר
    useEffect(() => {
        if (allMappings.length === 0) {
            setMappings([]);
            return;
        }
        
        let filteredMappings = [...allMappings];
        
        // פילטור לפי סטטוס
        if (statusFilter === 'active') {
            filteredMappings = filteredMappings.filter(mapping => mapping.status === 1);
        } else if (statusFilter === 'inactive') {
            filteredMappings = filteredMappings.filter(mapping => mapping.status === 0);
        }
        
        setMappings(filteredMappings);
    }, [allMappings, statusFilter]);
    
    // טיפול בשינוי הפילטר
    const handleFilterChange = (event, newFilter) => {
        if (newFilter !== null) {
            setStatusFilter(newFilter);
            localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(newFilter));
        }
    };
    
    // מיון הנתונים לפי ההגדרות הנוכחיות
    const sortedMappings = useMemo(() => {
        let sortableMappings = [...mappings];
        if (sortConfig.key !== null) {
            sortableMappings.sort((a, b) => {
                // מטפל במקרים מיוחדים
                if (sortConfig.key === 'last_update') {
                    return sortConfig.direction === 'ascending' 
                        ? new Date(a[sortConfig.key]) - new Date(b[sortConfig.key])
                        : new Date(b[sortConfig.key]) - new Date(a[sortConfig.key]);
                }
                
                // מיון רגיל למחרוזות ומספרים
                const valA = a[sortConfig.key] !== undefined ? a[sortConfig.key] : '';
                const valB = b[sortConfig.key] !== undefined ? b[sortConfig.key] : '';
                
                if (typeof valA === 'string' && typeof valB === 'string') {
                    return sortConfig.direction === 'ascending'
                        ? valA.localeCompare(valB)
                        : valB.localeCompare(valA);
                }
                
                return sortConfig.direction === 'ascending'
                    ? (valA > valB ? 1 : -1)
                    : (valB > valA ? 1 : -1);
            });
        }
        return sortableMappings;
    }, [mappings, sortConfig]);
    
    // פונקציה לבקשת מיון
    const requestSort = (key) => {
        // אם אין אפשרות מיון לעמודה זו
        if (!key) return;
        
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        
        const newSortConfig = { key, direction };
        setSortConfig(newSortConfig);
        
        // שמירת העדפות המיון בלוקל סטורג'
        localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(newSortConfig));
    };
    
            // פונקציה להחזרת כיוון המיון הנוכחי לעמודה מסוימת
        const getSortDirection = (columnKey) => {
            if (!columnKey || sortConfig.key !== columnKey) {
                return false;
            }
            // המרה מהערכים שלנו לערכים התקניים של MUI
            return sortConfig.direction === 'ascending' ? 'asc' : 'desc';
        };

    const handleRowClick = (mappingId) => {
        setSelectedMappings(prev => {
            // אם לוחצים על Ctrl (או Command במק), נשמרות הבחירות הקודמות
            if (window.event && (window.event.ctrlKey || window.event.metaKey)) {
                // אם כבר נבחר, מסיר אותו
                if (prev.includes(mappingId)) {
                    return prev.filter(id => id !== mappingId);
                } 
                // אחרת, מוסיף אותו
                else {
                    return [...prev, mappingId];
                }
            } 
            // אם לוחצים על Shift, בוחרים טווח
            else if (window.event && window.event.shiftKey && prev.length > 0) {
                const lastSelected = prev[prev.length - 1];
                const allIds = mappings.map(mapping => mapping.id);
                const startIdx = allIds.indexOf(lastSelected);
                const endIdx = allIds.indexOf(mappingId);
                
                // מאתרים את הטווח (גם אם הוא הפוך)
                const start = Math.min(startIdx, endIdx);
                const end = Math.max(startIdx, endIdx);
                
                // יוצרים מערך של כל הזיהויים בטווח
                const rangeIds = allIds.slice(start, end + 1);
                
                // מחזירים את כל הזיהויים שכבר נבחרו וגם את הטווח החדש
                return [...new Set([...prev, ...rangeIds])];
            } 
            // אם לוחצים ללא מקשים מיוחדים, רק הפריט הנוכחי נבחר
            else {
                return [mappingId];
            }
        });
    };

    const handleDeleteClick = async (mappingId, event) => {
        if (event) {
            event.stopPropagation(); // מניעת בחירת השורה
        }
        
        try {
            console.log(`Attempting to delete mapping with ID: ${mappingId}`);
            const response = await axios.delete(`http://localhost:3001/delete-mapping/${mappingId}`);
            if (response.data.success) {
                // עדכון שני מאגרי הנתונים
                setAllMappings(prev => prev.filter(mapping => mapping.id !== mappingId));
                setMappings(prev => prev.filter(mapping => mapping.id !== mappingId));
                
                // הסרת המיפוי מהרשימה הנבחרת
                setSelectedMappings(prev => prev.filter(id => id !== mappingId));
                
                showSnackbar('Mapping deleted successfully', 'success');
            } else {
                showSnackbar('Failed to delete mapping', 'error');
            }
        } catch (error) {
            console.error('Error deleting mapping:', error);
            showSnackbar('Error deleting mapping', 'error');
        }
    };

    const handleEditClick = (mapping, event) => {
        if (event) {
            event.stopPropagation(); // מניעת בחירת השורה
        }
        navigate(`/mapping/edit/${mapping.id}`);
    };

    const handleStatusToggle = async (id, currentStatus, event) => {
        if (event) {
            event.stopPropagation(); // מניעת בחירת השורה
        }
        
        try {
            const newStatus = currentStatus === 1 ? 0 : 1;
            await axios.put(`http://localhost:3001/mapping/update-status/${id}`, {
                status: newStatus,
            });
        
            // עדכון מצב הטבלה במאגר הכללי
            setAllMappings(prevMappings =>
                prevMappings.map(mapping =>
                    mapping.id === id ? { ...mapping, status: newStatus } : mapping
                )
            );
            
            // עדכון המיפויים המוצגים בהתאם לפילטר הנוכחי
            if (statusFilter === 'all' || 
                (statusFilter === 'active' && newStatus === 1) || 
                (statusFilter === 'inactive' && newStatus === 0)) {
                setMappings(prevMappings =>
                    prevMappings.map(mapping =>
                        mapping.id === id ? { ...mapping, status: newStatus } : mapping
                    )
                );
            } else {
                // הסרת המיפוי מהרשימה המוצגת אם לא מתאים לפילטר
                setMappings(prevMappings =>
                    prevMappings.filter(mapping => mapping.id !== id)
                );
            }
        
            showSnackbar(`Status updated successfully`, 'success');
        } catch (error) {
            console.error('Error updating status:', error);
            showSnackbar('Failed to update status', 'error');
        }
    };

    // בחירת כל המיפויים
    const handleSelectAll = () => {
        if (selectedMappings.length === sortedMappings.length) {
            setSelectedMappings([]);
        } else {
            const allIds = sortedMappings.map(mapping => mapping.id);
            setSelectedMappings(allIds);
        }
    };

    // ניקוי בחירה
    const handleClearSelection = () => {
        setSelectedMappings([]);
    };
    
    // טיפול בשינוי הגדרות העמודות הנראות
    const handleColumnChange = (event) => {
        const { name, checked } = event.target;
        setVisibleColumns(prev => ({
            ...prev,
            [name]: checked
        }));
    };
    
    // פתיחה וסגירה של בוחר העמודות
    const toggleColumnSelector = () => {
        setColumnSelectorOpen(!columnSelectorOpen);
    };

    // שמירת בחירת העמודות ב-LocalStorage
    const saveColumnPreferences = () => {
        localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(visibleColumns));
        setColumnSelectorOpen(false);
        showSnackbar('Column preferences saved successfully!', 'success');
    };

    // בחירת כל העמודות או ביטול בחירה של כולן
    const toggleSelectAll = () => {
        const newValue = !selectedAll;
        setSelectedAll(newValue);
        
        // עדכון מצב כל העמודות
        const updatedColumns = {};
        allColumns.forEach(col => {
            updatedColumns[col.id] = newValue;
        });
        
        setVisibleColumns(updatedColumns);
    };

    // פתיחת דיאלוג ייבוא
    const handleImportDialogOpen = () => {
        // יצירת אלמנט input מסוג file
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        
        // טיפול באירוע בחירת קובץ
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedMappings = JSON.parse(e.target.result);
                        // פתיחת דיאלוג אישור ייבוא
                        setImportedData(importedMappings);
                        setIsImportDialogOpen(true);
                    } catch (error) {
                        console.error('Error parsing imported file:', error);
                        showSnackbar('Failed to parse import file. Please check the file format.', 'error');
                    }
                };
                reader.readAsText(file);
            }
        });
        
        // הפעלת בחירת הקובץ
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    };

    // פתיחת דיאלוג ייצוא
    const handleExportDialogOpen = () => {
        if (selectedMappings.length === 0) {
            showSnackbar('Please select at least one mapping to export', 'warning');
            return;
        }
        setIsExportDialogOpen(true);
    };

    // ייבוא מקובץ
    const handleImportSelected = async () => {
        if (!importedData || importedData.length === 0) {
            showSnackbar('No data to import', 'error');
            return;
        }
        
        setIsLoading(true);
        let successCount = 0;
        let errorCount = 0;
        
        // עיבוד כל מיפוי מהקובץ
        for (const mapping of importedData) {
            try {
                // הסרת שדות מזהים כדי ליצור רשומה חדשה
                const newMapping = { ...mapping };
                delete newMapping.id; // הסרת ID כדי ליצור רשומה חדשה
                
                // שינוי שם המיפוי כדי לציין שזה ייבוא
                if (newMapping.mapping_name) {
                    newMapping.mapping_name = `${newMapping.mapping_name} (Imported ${new Date().toLocaleDateString()})`;
                }
                
                // אם field_mappings הוא אובייקט, ממירים ל-JSON string
                if (typeof newMapping.field_mappings === 'object') {
                    newMapping.field_mappings = JSON.stringify(newMapping.field_mappings);
                }
                
                // שליחת בקשה ליצירת מיפוי חדש
                const response = await axios.post('http://localhost:3001/save-mapping', newMapping);
                
                if (response.data.success) {
                    successCount++;
                } else {
                    errorCount++;
                    console.error('Error importing mapping:', response.data.message);
                }
            } catch (error) {
                errorCount++;
                console.error('Error during mapping import:', error);
            }
        }
        
        setIsLoading(false);
        setIsImportDialogOpen(false);
        
        // הצגת הודעת סיכום
        if (successCount > 0) {
            showSnackbar(`Successfully imported ${successCount} mapping(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`, 'success');
            // רענון רשימת המיפויים
            loadMappings();
        } else {
            showSnackbar(`Failed to import mappings: ${errorCount} error(s)`, 'error');
        }
    };

    // ייצוא המיפויים הנבחרים
    const handleExportSelected = async () => {
        try {
            setIsLoading(true);
            const selectedMappingObjects = [];
            
            // נשיג את כל המידע המלא עבור כל מיפוי נבחר מהשרת
            for (const mappingId of selectedMappings) {
                try {
                    console.log(`Fetching complete data for mapping ID: ${mappingId}`);
                    // נשיג את המידע המלא עבור כל מיפוי
                    const response = await axios.get(`http://localhost:3001/mapping/get/${mappingId}`);
                    
                    if (response.data.success && response.data.mapping) {
                        const fullMapping = response.data.mapping;
                        console.log(`Successfully retrieved mapping: ${fullMapping.mapping_name}`);
                        
                        // פענוח שדות JSON אם הם מגיעים כמחרוזות
                        let fieldMappings;
                        try {
                            fieldMappings = typeof fullMapping.field_mappings === 'string' 
                                ? JSON.parse(fullMapping.field_mappings) 
                                : fullMapping.field_mappings;
                        } catch (e) {
                            console.error('Error parsing field mappings', e);
                            fieldMappings = fullMapping.field_mappings || {};
                        }
                        
                        // עיבוד וניקוי אובייקט המיפוי
                        const processedMapping = {
                            // פרטי מיפוי כלליים
                            id: fullMapping.id,
                            mapping_name: fullMapping.mapping_name,
                            mapping_info: fullMapping.mapping_info,
                            mapping_number: fullMapping.mapping_number,
                            
                            // שלב 1: הגדרות מקור
                            import_server_type: fullMapping.import_server_type,
                            import_connection_type: fullMapping.import_connection_type,
                            import_server: fullMapping.import_server,
                            import_database: fullMapping.import_database,
                            source_table: fullMapping.source_table,
                            
                            // שלב 2: הגדרות יעד
                            export_server_type: fullMapping.export_server_type,
                            export_connection_type: fullMapping.export_connection_type,
                            export_server: fullMapping.export_server,
                            export_database: fullMapping.export_database,
                            new_table_name: fullMapping.new_table_name,
                            destination_table: fullMapping.destination_table,
                            
                            // שלב 3: מיפוי שדות
                            field_mappings: fieldMappings,
                            
                            // מידע נוסף
                            status: fullMapping.status,
                            last_update: fullMapping.last_update,
                            json_file_path: fullMapping.json_file_path
                        };
                        
                        selectedMappingObjects.push(processedMapping);
                    } else {
                        console.error(`Failed to fetch mapping with ID ${mappingId}:`, response.data.message);
                        showSnackbar(`Failed to fetch mapping with ID ${mappingId}`, 'warning');
                    }
                } catch (error) {
                    console.error(`Error fetching complete data for mapping ID ${mappingId}:`, error);
                    showSnackbar(`Error fetching complete data for mapping ID ${mappingId}`, 'error');
                }
            }
            
            if (selectedMappingObjects.length === 0) {
                showSnackbar('No valid mappings found to export', 'error');
                setIsLoading(false);
                setIsExportDialogOpen(false);
                return;
            }
            
            // המרה ל-JSON והורדה
            const jsonStr = JSON.stringify(selectedMappingObjects, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `mappings_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            showSnackbar(`Successfully exported ${selectedMappingObjects.length} mappings`, 'success');
        } catch (error) {
            console.error('Error exporting mappings:', error);
            showSnackbar('Error exporting mappings', 'error');
        } finally {
            setIsLoading(false);
            setIsExportDialogOpen(false);
        }
    };

    // הצגת הודעות למשתמש
    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    // סגירת הודעה
    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Container sx={{ marginTop: '40px', textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h4" color="primary">
                        Mapping List
                    </Typography>
                    
                    {sortConfig.key && (
                        <Chip
                            label={`Sorted by: ${allColumns.find(col => col.sortKey === sortConfig.key)?.label || sortConfig.key} (${sortConfig.direction})`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            onDelete={() => {
                                setSortConfig({ key: null, direction: 'ascending' });
                                localStorage.removeItem(SORT_STORAGE_KEY);
                            }}
                            sx={{ ml: 2, fontSize: '0.7rem' }}
                        />
                    )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* פילטר סטטוס */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>Status:</Typography>
                        <ToggleButtonGroup
                            value={statusFilter}
                            exclusive
                            onChange={handleFilterChange}
                            size="small"
                            aria-label="mapping status filter"
                        >
                            <ToggleButton value="all" aria-label="all mappings">
                                <Tooltip title="All Mappings">
                                    <FilterListIcon fontSize="small" />
                                </Tooltip>
                            </ToggleButton>
                            <ToggleButton value="active" aria-label="active mappings">
                                <Tooltip title="Active Mappings">
                                    <VisibilityOutlined fontSize="small" />
                                </Tooltip>
                            </ToggleButton>
                            <ToggleButton value="inactive" aria-label="inactive mappings">
                                <Tooltip title="Inactive Mappings">
                                    <VisibilityOffOutlined fontSize="small" />
                                </Tooltip>
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                    
                    {/* בוחר עמודות */}
                    <Box sx={{ position: 'relative' }}>
                        <Tooltip title="Select visible columns">
                            <IconButton 
                                onClick={toggleColumnSelector}
                                color="primary"
                                sx={{ 
                                    border: '1px solid #e0e0e0', 
                                    borderRadius: '4px',
                                    padding: '8px'
                                }}
                            >
                                <ViewColumnIcon />
                            </IconButton>
                        </Tooltip>
                        
                        {columnSelectorOpen && (
                            <ColumnSelectorModal>
                                <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                                    Select columns to display
                                </Typography>
                                
                                {/* בחירת כל העמודות */}
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={selectedAll}
                                            onChange={toggleSelectAll}
                                            color="primary"
                                        />
                                    }
                                    label={<Typography variant="body2" fontWeight="bold">Select All</Typography>}
                                />
                                
                                <Box sx={{ maxHeight: '300px', overflow: 'auto', mt: 1 }}>
                                    <FormGroup>
                                        {allColumns.map((column) => (
                                            <FormControlLabel
                                                key={column.id}
                                                control={
                                                    <Checkbox
                                                        name={column.id}
                                                        checked={visibleColumns[column.id]}
                                                        onChange={handleColumnChange}
                                                        size="small"
                                                    />
                                                }
                                                label={
                                                    <Typography variant="body2">
                                                        {column.label}
                                                    </Typography>
                                                }
                                            />
                                        ))}
                                    </FormGroup>
                                </Box>
                                
                                {/* כפתור שמירה */}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<SaveAltRounded />}
                                        onClick={saveColumnPreferences}
                                        size="small"
                                    >
                                        Save Preferences
                                    </Button>
                                </Box>
                            </ColumnSelectorModal>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* תצוגת סטטיסטיקה על המיפויים המוצגים */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, mt: 1 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Chip
                        icon={<FilterListIcon fontSize="small" />}
                        label={`Displaying: ${sortedMappings.length} mappings`}
                        variant="outlined"
                        size="small"
                    />
                    
                    <Chip
                        icon={<VisibilityOutlined fontSize="small" />}
                        label={`Active: ${sortedMappings.filter(m => m.status === 1).length}`}
                        color="success"
                        variant="outlined"
                        size="small"
                    />
                    
                    <Chip
                        icon={<VisibilityOffOutlined fontSize="small" />}
                        label={`Inactive: ${sortedMappings.filter(m => m.status === 0).length}`}
                        color="error"
                        variant="outlined"
                        size="small"
                    />
                </Box>
                
                <Box>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/mapping/add')}
                        sx={{ mr: 1 }}
                    >
                        Add New Mapping
                    </Button>
                    <Button
                        variant="contained"
                        color="info"
                        startIcon={<UploadFileIcon />}
                        onClick={handleImportDialogOpen}
                        sx={{ mr: 1 }}
                    >
                        Import
                    </Button>
                    <Button
                        variant="contained"
                        color="warning"
                        startIcon={<FileDownloadIcon />}
                        onClick={handleExportDialogOpen}
                        disabled={selectedMappings.length === 0}
                    >
                        Export
                    </Button>
                </Box>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Button
                    size="small"
                    variant="outlined"
                    onClick={handleSelectAll}
                    disabled={sortedMappings.length === 0}
                >
                    Select All
                </Button>
                <Button
                    size="small"
                    variant="outlined"
                    onClick={handleClearSelection}
                    disabled={selectedMappings.length === 0}
                >
                    Clear Selection
                </Button>
            </Box>

            {/* טיפ עזרה למשתמש */}
            <Box sx={{ mb: 2, px: 2, py: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.contrastText">
                    <strong>Tip:</strong> Click on a row to select it. Use Ctrl+Click to select multiple rows, or Shift+Click to select a range.
                    {selectedMappings.length > 0 && (
                        <Box component="span" sx={{ ml: 1 }}>
                            {selectedMappings.length} mapping{selectedMappings.length !== 1 ? 's' : ''} selected.
                        </Box>
                    )}
                </Typography>
            </Box>
            <Table sx={{ 
                minWidth: 650, 
                marginTop: '20px', 
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                '& .MuiTableRow-root:hover': {
                    backgroundColor: '#f5f5f5'
                }
            }} aria-label="mapping table">
                <TableHead>
                    <TableRow>
                        {/* עמודה ריקה עבור אינדיקטור הבחירה */}
                        <CompactHeadCell sx={{ width: '20px', padding: '0 12px' }}></CompactHeadCell>
                        
                        {visibleColumns.status && (
                            <CompactHeadCell 
                                width="60px" 
                                onClick={() => requestSort('status')}
                                sortDirection={getSortDirection('status')}
                            >
                                Status
                            </CompactHeadCell>
                        )}
                        
                        {visibleColumns.id && (
                            <CompactHeadCell 
                                width="50px"
                                onClick={() => requestSort('id')}
                                sortDirection={getSortDirection('id')}
                            >
                                ID
                            </CompactHeadCell>
                        )}

                        {visibleColumns.mappingName && (
                            <SortableHeadCell 
                                onClick={() => requestSort('mapping_name')}
                                sortDirection={getSortDirection('mapping_name')}
                            >
                                Mapping Name
                            </SortableHeadCell>
                        )}
                        
                        {visibleColumns.sourceServer && (
                            <SortableHeadCell 
                                onClick={() => requestSort('import_server')}
                                sortDirection={getSortDirection('import_server')}
                            >
                                Source Server
                            </SortableHeadCell>
                        )}

                        {visibleColumns.exportServer && (
                            <SortableHeadCell 
                                onClick={() => requestSort('export_server')}
                                sortDirection={getSortDirection('export_server')}
                            >
                                Destination Server
                            </SortableHeadCell>
                        )}
                        
                        {visibleColumns.newTableName && (
                            <SortableHeadCell 
                                onClick={() => requestSort('new_table_name')}
                                sortDirection={getSortDirection('new_table_name')}
                            >
                                New Table Name
                            </SortableHeadCell>
                        )}
                        
                        {visibleColumns.lastUpdate && (
                            <SortableHeadCell 
                                onClick={() => requestSort('last_update')}
                                sortDirection={getSortDirection('last_update')}
                            >
                                Last Update
                            </SortableHeadCell>
                        )}
                        
                        {visibleColumns.actions && (
                            <SortableHeadCell>
                                Actions
                            </SortableHeadCell>
                        )}
                    </TableRow>
                </TableHead>
                <TableBody>
    {sortedMappings.map(mapping => (
        <TableRow 
            key={mapping.id}
            onClick={() => handleRowClick(mapping.id)}
            hover
            sx={{ 
                cursor: 'pointer',
                backgroundColor: selectedMappings.includes(mapping.id) ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                '&:hover': {
                    backgroundColor: selectedMappings.includes(mapping.id) ? 'rgba(25, 118, 210, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                }
            }}
        >
            {/* נוסף תא עם אינדיקטור בחירה (נקודה) */}
            <SelectionIndicatorCell>
                {selectedMappings.includes(mapping.id) && <SelectionIndicator />}
            </SelectionIndicatorCell>
            
            {visibleColumns.status && (
                <StyledTableCell onClick={(e) => e.stopPropagation()}>
                    <IconButton 
                        onClick={(e) => handleStatusToggle(mapping.id, mapping.status, e)}
                        size="small"
                    >
                        <StatusIcon status={mapping.status} />
                    </IconButton>
                </StyledTableCell>
            )}
            
            {visibleColumns.id && (
                <StyledTableCell>{mapping.id}</StyledTableCell>
            )}

            {visibleColumns.mappingName && (
                <StyledTableCell>{mapping.mapping_name}</StyledTableCell>
            )}
            
            {visibleColumns.sourceServer && (
                <StyledTableCell>{mapping.import_server}</StyledTableCell>
            )}

            {visibleColumns.exportServer && (
                <StyledTableCell>{mapping.export_server}</StyledTableCell>
            )}
            
            {visibleColumns.newTableName && (
                <StyledTableCell>{mapping.new_table_name}</StyledTableCell>
            )}
            
            {visibleColumns.lastUpdate && (
                <StyledTableCell>{new Date(mapping.last_update).toLocaleString()}</StyledTableCell>
            )}
            
            {visibleColumns.actions && (
    <StyledTableCell onClick={(e) => e.stopPropagation()}>
        <ActionsContainer>
            <Tooltip title="View Mapping Details">
                <ActionIconButton 
                    onClick={(e) => handleViewDetailsClick(mapping.id, e)}
                    bgcolor="25, 118, 210" // כחול
                    size="small"
                >
                    <DynamicFeedRounded style={{ color: '#1976d2', fontSize: '22px' }} />
                </ActionIconButton>
            </Tooltip>
            
            <Tooltip title="Edit Mapping">
                <ActionIconButton 
                    onClick={(e) => handleEditClick(mapping, e)}
                    bgcolor="76, 175, 80" // ירוק
                    size="small"
                >
                    <TuneRounded style={{ color: '#4caf50', fontSize: '22px' }} />
                </ActionIconButton>
            </Tooltip>
            
            <Tooltip title="Delete Mapping">
                <ActionIconButton 
                    onClick={(e) => handleDeleteClick(mapping.id, e)}
                    bgcolor="244, 67, 54" // אדום
                    size="small"
                >
                    <DeleteSweepRounded style={{ color: '#f44336', fontSize: '22px' }} />
                </ActionIconButton>
            </Tooltip>
        </ActionsContainer>
    </StyledTableCell>
            )}
        </TableRow>
    ))}
                </TableBody>
            </Table>

            {/* הודעה כאשר אין מיפויים להצגה */}
            {sortedMappings.length === 0 && !isLoading && (
                <Box sx={{ 
                    marginTop: 4, 
                    padding: 3, 
                    textAlign: 'center', 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: 2 
                }}>
                    <Typography variant="h6" color="text.secondary">
                        No mappings found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {statusFilter !== 'all' ? 
                            `No ${statusFilter} mappings found. Try changing the filter.` : 
                            'Click "Add New Mapping" to create your first mapping'}
                    </Typography>
                </Box>
            )}

            {/* Import Dialog */}
            <Dialog 
                open={isImportDialogOpen} 
                onClose={() => setIsImportDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Import Mappings from File</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        The file contains {importedData?.length || 0} mapping configuration(s). 
                        These will be imported as new mappings in your system.
                    </DialogContentText>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Mappings to Import:
                        </Typography>
                        <List>
                            {importedData?.map((mapping, index) => (
                                <ListItem key={index}>
                                    <ListItemText
                                        primary={mapping.mapping_name || `Mapping ${index + 1}`}
                                        secondary={`From: ${mapping.import_server || ''}/${mapping.source_table || ''} To: ${mapping.new_table_name || ''}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsImportDialogOpen(false)} disabled={isLoading}>Cancel</Button>
                    <Button 
                        onClick={handleImportSelected}
                        variant="contained" 
                        color="primary"
                        disabled={isLoading}
                    >
                        {isLoading ? <CircularProgress size={24} /> : 'Import as New Mappings'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Export Dialog */}
            <Dialog 
                open={isExportDialogOpen} 
                onClose={() => setIsExportDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Export Mappings</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Export the selected mapping configurations to a JSON file.
                    </DialogContentText>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Selected Mappings:
                        </Typography>
                        <List>
                            {sortedMappings
                                .filter(mapping => selectedMappings.includes(mapping.id))
                                .map(mapping => (
                                    <ListItem key={mapping.id}>
                                        <ListItemText
                                            primary={`${mapping.mapping_name || 'Mapping ' + mapping.id}`}
                                            secondary={`${mapping.import_server}/${mapping.import_database}/${mapping.source_table}`}
                                        />
                                    </ListItem>
                                ))
                            }
                        </List>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsExportDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleExportSelected}
                        variant="contained" 
                        color="primary"
                    >
                        Export to JSON
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Field Mappings Dialog */}
            <Dialog
                open={fieldMappingDialogOpen}
                onClose={handleCloseFieldMappingsDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Field Mappings: {selectedMappingName}
                </DialogTitle>
                <DialogContent>
                    {selectedFieldMappings ? (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Source Field</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Target Field</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Data Type</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Transformation</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Array.isArray(selectedFieldMappings) ? (
                                    selectedFieldMappings.map((mapping, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{mapping.sourceField || mapping.source_field || '-'}</TableCell>
                                            <TableCell>{mapping.targetField || mapping.target_field || '-'}</TableCell>
                                            <TableCell>{mapping.dataType || mapping.data_type || '-'}</TableCell>
                                            <TableCell>{mapping.transformation || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    // אם מיפוי השדות אינו מערך, מציגים כטקסט JSON
                                    <TableRow>
                                        <TableCell colSpan={4}>
                                            <Box 
                                                component="pre" 
                                                sx={{ 
                                                    whiteSpace: 'pre-wrap', 
                                                    overflow: 'auto',
                                                    maxHeight: '400px',
                                                    padding: '8px',
                                                    backgroundColor: '#f5f5f5',
                                                    borderRadius: '4px'
                                                }}
                                            >
                                                {JSON.stringify(selectedFieldMappings, null, 2)}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    ) : (
                        <Typography>No field mappings available.</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseFieldMappingsDialog}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Mapping Details Dialog */}
<Dialog
    open={mappingDetailsDialogOpen}
    onClose={handleCloseMappingDetailsDialog}
    maxWidth="lg"
    fullWidth
    aria-labelledby="mapping-details-dialog-title"
>
    <DialogTitle id="mapping-details-dialog-title">
        Mapping Details: {selectedMappingDetails?.mapping_name || ''}
        <IconButton
            aria-label="close"
            onClick={handleCloseMappingDetailsDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
        >
            <CancelIcon />
        </IconButton>
    </DialogTitle>
        <DialogContent dividers>
            {selectedMappingDetails ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* כרטיסיות לניווט בין חלקי המיפוי */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={(e, newTab) => setActiveTab(newTab)} aria-label="mapping details tabs">
                            <Tab label="General Info" id="tab-0" />
                            <Tab label="Source & Destination" id="tab-1" />
                            <Tab label="Field Mappings" id="tab-2" />
                            <Tab label="Preview Data" id="tab-3" />
                        </Tabs>
                    </Box>
                    
                    {/* תוכן כרטיסיה 1 - מידע כללי */}
                    <Box hidden={activeTab !== 0} sx={{ pt: 2 }}>
                        <Table size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell component="th" sx={{ fontWeight: 'bold', width: '30%' }}>ID</TableCell>
                                    <TableCell>{selectedMappingDetails.id}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell component="th" sx={{ fontWeight: 'bold' }}>Mapping Name</TableCell>
                                    <TableCell>{selectedMappingDetails.mapping_name}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell component="th" sx={{ fontWeight: 'bold' }}>Mapping Info</TableCell>
                                    <TableCell>{selectedMappingDetails.mapping_info}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell component="th" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                    <TableCell>
                                        <Chip 
                                            icon={selectedMappingDetails.status === 1 ? <VisibilityOutlined /> : <VisibilityOffOutlined />}
                                            label={selectedMappingDetails.status === 1 ? 'Active' : 'Inactive'}
                                            color={selectedMappingDetails.status === 1 ? 'success' : 'error'}
                                            variant="outlined"
                                            size="small"
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell component="th" sx={{ fontWeight: 'bold' }}>Last Update</TableCell>
                                    <TableCell>{new Date(selectedMappingDetails.last_update).toLocaleString()}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Box>
                    
                    {/* תוכן כרטיסיה 2 - מקור ויעד */}
                    <Box hidden={activeTab !== 1} sx={{ pt: 2 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={6}>
                                <Paper sx={{ p: 2, height: '100%' }}>
                                    <Typography variant="h6" color="primary" gutterBottom>Source</Typography>
                                    <Table size="small">
                                        <TableBody>
                                            <TableRow>
                                                <TableCell component="th" sx={{ fontWeight: 'bold', width: '40%' }}>Server Type</TableCell>
                                                <TableCell>{selectedMappingDetails.import_server_type}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell component="th" sx={{ fontWeight: 'bold' }}>Connection Type</TableCell>
                                                <TableCell>{selectedMappingDetails.import_connection_type}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell component="th" sx={{ fontWeight: 'bold' }}>Server</TableCell>
                                                <TableCell>{selectedMappingDetails.import_server}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell component="th" sx={{ fontWeight: 'bold' }}>Database</TableCell>
                                                <TableCell>{selectedMappingDetails.import_database}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell component="th" sx={{ fontWeight: 'bold' }}>Table</TableCell>
                                                <TableCell>{selectedMappingDetails.source_table || selectedMappingDetails.new_table_name || "FileTransfer"}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </Paper>
                            </Grid>
                            <Grid item xs={6}>
                                <Paper sx={{ p: 2, height: '100%' }}>
                                    <Typography variant="h6" color="primary" gutterBottom>Destination</Typography>
                                    <Table size="small">
                                        <TableBody>
                                            <TableRow>
                                                <TableCell component="th" sx={{ fontWeight: 'bold', width: '40%' }}>Server Type</TableCell>
                                                <TableCell>{selectedMappingDetails.export_server_type}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell component="th" sx={{ fontWeight: 'bold' }}>Connection Type</TableCell>
                                                <TableCell>{selectedMappingDetails.export_connection_type}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell component="th" sx={{ fontWeight: 'bold' }}>Server</TableCell>
                                                <TableCell>{selectedMappingDetails.export_server}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell component="th" sx={{ fontWeight: 'bold' }}>Database</TableCell>
                                                <TableCell>{selectedMappingDetails.export_database}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell component="th" sx={{ fontWeight: 'bold' }}>New Table Name</TableCell>
                                                <TableCell>{selectedMappingDetails.new_table_name}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                    
                    {/* תוכן כרטיסיה 3 - מיפויי שדות */}

                    <Box hidden={activeTab !== 2} sx={{ pt: 2 }}>
    {selectedMappingDetails?.fieldMappings && Object.keys(selectedMappingDetails.fieldMappings).length > 0 ? (
        <Table size="small">
            <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Source Field</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Target Field</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Source Table</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Source Database</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {/* בדיקה אם יש מבנה עם mappings */}
                {selectedMappingDetails.fieldMappings.mappings ? (
                    /* אם כן, השתמש במבנה החדש */
                    Object.entries(selectedMappingDetails.fieldMappings.mappings).map(([sourceField, mapping]) => (
                        <TableRow key={sourceField}>
                            <TableCell>{sourceField}</TableCell>
                            <TableCell>{mapping.newName ? String(mapping.newName) : sourceField}</TableCell>
                            <TableCell>
                                {selectedMappingDetails.source_table || 
                                selectedMappingDetails.new_table_name || 
                                "FileTransfer"}
                            </TableCell>
                            <TableCell>{mapping.dbName ? String(mapping.dbName) : (selectedMappingDetails.import_database || 'N/A')}</TableCell>
                        </TableRow>
                    ))
                ) : (
                    /* אחרת, השתמש במבנה הישן */
                    Object.entries(selectedMappingDetails.fieldMappings).map(([sourceField, mapping]) => (
                        <TableRow key={sourceField}>
                            <TableCell>{sourceField}</TableCell>
                            <TableCell>
                                {typeof mapping === 'object' 
                                    ? (mapping.newName ? String(mapping.newName) : sourceField) 
                                    : (mapping ? String(mapping) : sourceField)}
                            </TableCell>
                            <TableCell>
                                {selectedMappingDetails.source_table || 
                                selectedMappingDetails.new_table_name || 
                                "FileTransfer"}
                            </TableCell>
                            <TableCell>{selectedMappingDetails.import_database || 'N/A'}</TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    ) : (
        <Typography variant="body1" color="text.secondary">
            No field mappings defined for this mapping.
        </Typography>
    )}
                    </Box>
                    
                    {/* תוכן כרטיסיה 4 - תצוגה מקדימה של הנתונים */}
                    <Box hidden={activeTab !== 3} sx={{ pt: 2 }}>
    {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
        </Box>
    ) : mappingTableData && mappingTableData.length > 0 ? (
        <Box sx={{ overflowX: 'auto' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Preview Data from {selectedMappingDetails.new_table_name} (Destination Table)
            </Typography>
            
            <Table size="small" sx={{ border: '1px solid #e0e0e0' }}>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        {Object.keys(mappingTableData[0]).map((column, index) => (
                            <TableCell key={index} sx={{ fontWeight: 'bold' }}>
                                {column}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {mappingTableData.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                            {Object.values(row).map((value, cellIndex) => (
                                <TableCell key={cellIndex}>
                                    {value !== null ? String(value) : 'NULL'}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', p: 3 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
                No data available for preview.
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Destination: {selectedMappingDetails.export_server}/{selectedMappingDetails.export_database}/{selectedMappingDetails.new_table_name}
            </Typography>
        </Box>
    )}
        </Box>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseMappingDetailsDialog}>Close</Button>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => {
                        handleCloseMappingDetailsDialog();
                        navigate(`/mapping/edit/${selectedMappingDetails?.id}`);
                    }}
                >
                    Edit Mapping
                </Button>
            </DialogActions>
        </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default MappingList;
import React, { useState, useMemo } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Collapse, 
  IconButton, 
  TextField,
  InputAdornment,
  Tooltip,
  Chip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

// פונקציה לעיבוד טקסט ומציאת והדגשת תנאי פילטר
const formatRuleDescription = (text) => {
  if (!text) return null;
  
  // בדיקה אם יש ביטוי "with filter:" בטקסט
  const filterIndex = text.indexOf(' with filter: ');
  if (filterIndex === -1) return text;

  // פיצול הטקסט לחלק לפני ואחרי הפילטר
  const beforeFilter = text.substring(0, filterIndex);
  const afterFilter = text.substring(filterIndex + ' with filter: '.length);

  return (
    <>
      {beforeFilter} with filter: <span style={{
        fontWeight: 'bold',
        color: '#d32f2f',
        backgroundColor: '#ffebee',
        padding: '2px 6px',
        borderRadius: '4px'
      }}>WITH FILTER CONDITION: {afterFilter}</span>
    </>
  );
};

const RuleDescription = ({ conditions = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false); // ברירת מחדל - מכווץ
  const [searchTerm, setSearchTerm] = useState('');

  // פונקציה להחזרת תיאור מפורט של החוק
  const getRuleDetailedDescription = (conditions) => {
    if (conditions.length === 0) return null;

    const descriptions = conditions.map(condition => {
      switch (condition.comparison) {
        case 'is_duplicate':
          return `Find duplicate entries in: ${Array.isArray(condition.field) ? condition.field.join(', ') : condition.field}`;
        case 'same_name_diff_ext':
          return `Identify files with same name but different extensions in: ${Array.isArray(condition.field) ? condition.field.join(', ') : condition.field}`;
        case 'is_contain':
          return `Find records where ${condition.field} contains "${condition.value}"`;
        case 'not_contain':
          return `Exclude records where ${condition.field} contains "${condition.value}"`;
        case 'equal':
          return `Find records where ${condition.field} exactly equals "${condition.value}"`;
        case 'not_equal':
          return `Exclude records where ${condition.field} equals "${condition.value}"`;
        case 'is_higher':
          return `Find records where ${condition.field} is greater than ${condition.value}`;
        case 'is_lower':
          return `Find records where ${condition.field} is less than ${condition.value}`;
        case 'count_occurrence':
          return `Count repeated entries in: ${Array.isArray(condition.field) ? condition.field.join(', ') : condition.field}`;
          case 'execution_count':
            return `Show processes executed at most ${condition.value || '10'} times${
                condition.relatedTable ? ` in table ${condition.relatedTable}` : ''
            }${
                condition.filterCondition ? ` with additional condition: ${condition.filterCondition}` : ''
            }`;
        case 'fields_equal':
            if (Array.isArray(condition.field) && condition.field.length >= 2) {
              const fieldPairs = [];
              for (let i = 0; i < condition.field.length - 1; i += 2) {
                if (i + 1 < condition.field.length) {
                  fieldPairs.push(`${condition.field[i]} = ${condition.field[i+1]}`);
                }
              }
              return `Compare fields within each record: ${fieldPairs.join(' AND ')}`;
            }
            return 'Compare equality between fields';
            case 'related_count':
              let relatedText = `Count records where ${condition.field} has at least ${condition.value || '1'} related records in ${condition.relatedTable}.${
                  Array.isArray(condition.relatedField) ? condition.relatedField.join(',') : condition.relatedField
              }`;
              
              // Add filter condition - שינוי כאן להדגשת תנאי הפילטר
              if (condition.filterCondition && condition.filterCondition.trim() !== '') {
                  relatedText += ` with filter: ${condition.filterCondition}`;
              }
              return relatedText;
          default:
          return 'Custom condition';
      }
    });

    // חיבור התיאורים עם מחבר AND/OR
    return descriptions.map((desc, index) => 
      index < descriptions.length - 1 
        ? `${desc} ${conditions[index].connector || 'AND'} ` 
        : desc
    ).join('');
  };

  // תיאור מפורט של החוק הנוכחי
  const ruleDetailedDescription = getRuleDetailedDescription(conditions);

  // הגדרת תיאורים כלליים למצב של אין תנאים
  const defaultConditions = [
    {
      title: 'Duplicate Detection',
      description: 'Find and highlight duplicate entries across selected fields',
      example: 'Identifies repeated values in specific columns',
      searchKeywords: ['duplicate', 'repeated', 'identical']
    },
    {
      title: 'Text Filtering',
      description: 'Search or exclude specific text within fields',
      example: 'Find or remove records containing certain words or patterns',
      searchKeywords: ['contains', 'excludes', 'text search']
    },
    {
      title: 'Numerical Comparisons',
      description: 'Compare field values using greater than, less than, or equal to',
      example: 'Select records based on numeric thresholds',
      searchKeywords: ['greater', 'less', 'threshold', 'numeric']
    }
  ];

  const getConditionDescription = (condition) => {
    // עבור תנאים ספציפיים
    switch (condition.comparison) {
      case 'is_duplicate':
        return {
          title: 'Duplicate Detection',
          description: `Check for duplicate entries across: ${Array.isArray(condition.field) ? condition.field.join(', ') : condition.field}`,
          example: 'Identifies records with matching values in specified field(s)',
          searchKeywords: ['duplicate', 'identical', 'matching', 'repeated']
        };
      case 'same_name_diff_ext':
        return {
          title: 'Same Name, Different Extension',
          description: `Find files with identical names but different extensions in: ${Array.isArray(condition.field) ? condition.field.join(', ') : condition.field}`,
          example: 'Detects variations like "document.doc" and "document.pdf"',
          searchKeywords: ['same name', 'extension', 'file variations']
        };
      case 'same_ext_diff_names':
        return {
            title: 'Same Extension, Different Names',
            description: `Find files with ${condition.field} having the same extension but different base names`,
            example: 'Detects variations like "report1.pdf" and "summary2.pdf"',
            searchKeywords: ['same extension', 'different names', 'file variations']
        };
      case 'fields_equal':
          return {
              title: 'Fields Equality Check',
              description: `Compare values between fields: ${
                  Array.isArray(condition.field) && condition.field.length >= 2 ? 
                  condition.field.map((f, i) => (i % 2 === 0 && i < condition.field.length - 1) ? 
                      `${f} = ${condition.field[i+1]}` : '').filter(Boolean).join(' AND ') : 
                  condition.field
              }`,
              example: 'Checks if specified field pairs have the same values within each record',
              searchKeywords: ['fields equal', 'same value', 'compare fields']
          };
      case 'is_contain':
        return {
          title: 'Contains Text',
          description: `Check if ${condition.field} includes "${condition.value}"`,
          example: `Finds records where ${condition.field} contains specific text`,
          searchKeywords: ['contains', 'includes', 'text search']
        };
      case 'not_contain':
        return {
          title: 'Excludes Text',
          description: `Ensure ${condition.field} does not include "${condition.value}"`,
          example: `Filters out records containing specified text`,
          searchKeywords: ['excludes', 'remove', 'filter out']
        };
      case 'equal':
        return {
          title: 'Exact Match',
          description: `${condition.field} must exactly equal "${condition.value}"`,
          example: 'Selects records with precise, case-sensitive matching',
          searchKeywords: ['exact', 'match', 'equal', 'precise']
        };
      case 'not_equal':
        return {
          title: 'Not Equal',
          description: `${condition.field} must not be "${condition.value}"`,
          example: 'Excludes records with specific exact value',
          searchKeywords: ['different', 'exclude', 'not match']
        };
      case 'is_higher':
        return {
          title: 'Greater Than',
          description: `${condition.field} must be larger than ${condition.value}`,
          example: 'Filters records exceeding a specific numeric threshold',
          searchKeywords: ['greater', 'above', 'larger', 'threshold']
        };
      case 'is_lower':
        return {
          title: 'Less Than',
          description: `${condition.field} must be smaller than ${condition.value}`,
          example: 'Selects records below a specific numeric threshold',
          searchKeywords: ['less', 'smaller', 'below', 'threshold']
        };
      case 'count_occurrence':
        return {
          title: 'Count Occurrences',
          description: `Count repetitions of values in ${Array.isArray(condition.field) ? condition.field.join(', ') : condition.field}`,
          example: 'Identifies fields with multiple matching entries',
          searchKeywords: ['count', 'repeat', 'frequency']
        };
        case 'related_count':
          // שינוי כאן - הוספת שדה filterDisplay
          const hasFilter = condition.filterCondition && condition.filterCondition.trim() !== '';
          const baseDescription = `Count records in table "${condition.relatedTable}" where field "${
              Array.isArray(condition.relatedField) ? condition.relatedField.join(',') : condition.relatedField
          }" matches this record's "${condition.field}" field`;
          
          return {
              title: 'Related Records Counter',
              description: baseDescription,
              filterDisplay: hasFilter ? condition.filterCondition : null,
              example: `Find records with at least ${condition.value || '1'} related entries`,
              searchKeywords: ['count', 'related', 'foreign key', 'join', 'filter']
          };
      default:
        return {
          title: 'Custom Condition',
          description: `Unique condition on field: "${condition.field}"`,
          example: 'Advanced filtering method',
          searchKeywords: ['custom', 'unique', 'advanced']
        };
    }
  };

  // יצירת תקציר של כל התנאים
  const getConditionsSummary = () => {
    if (conditions.length === 0) return "No conditions defined yet";
    
    // חישוב סוגי תנאים ייחודיים
    const conditionTypes = conditions.reduce((acc, condition) => {
      const type = condition.comparison;
      if (!acc[type]) acc[type] = 0;
      acc[type]++;
      return acc;
    }, {});

    return Object.entries(conditionTypes).map(([type, count]) => {
      let typeName = '';
      switch (type) {
        case 'is_duplicate': typeName = 'Duplicates'; break;
        case 'same_name_diff_ext': typeName = 'Same name, diff ext'; break;
        case 'same_ext_diff_names': typeName = 'Same ext, diff names'; break;
        case 'is_contain': typeName = 'Contains'; break;
        case 'not_contain': typeName = 'Not contains'; break;
        case 'equal': typeName = 'Equals'; break;
        case 'not_equal': typeName = 'Not equals'; break;
        case 'is_higher': typeName = 'Greater than'; break;
        case 'is_lower': typeName = 'Less than'; break;
        case 'fields_equal': typeName = 'Fields equality'; break;
        case 'count_occurrence': typeName = 'Count occurrences'; break;
        case 'related_count': typeName = 'Related records'; break;
        default: typeName = type; break;
      }
      return { type: typeName, count };
    });
  };

  // מסנן את התנאים על פי מונחי החיפוש
  const filteredConditions = useMemo(() => {
    // אם אין תנאים, השתמש בתנאים כלליים
    const conditionsToFilter = conditions.length > 0 ? conditions : defaultConditions;

    if (!searchTerm) return conditionsToFilter;

    const normalizedSearch = searchTerm.toLowerCase().trim();

    return conditionsToFilter.filter(condition => {
      const description = conditions.length > 0 
        ? getConditionDescription(condition) 
        : condition;
      
      // חיפוש גמיש
      const matchesTitle = description.title.toLowerCase().includes(normalizedSearch);
      const matchesDescription = description.description.toLowerCase().includes(normalizedSearch);
      const matchesExample = description.example.toLowerCase().includes(normalizedSearch);
      const matchesKeywords = description.searchKeywords.some(keyword => 
        keyword.toLowerCase().includes(normalizedSearch)
      );

      return matchesTitle || matchesDescription || matchesExample || matchesKeywords;
    });
  }, [conditions, searchTerm]);

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // יצירת תקציר בצורת chips
  const conditionsSummary = getConditionsSummary();

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        mt: 2, 
        mb: 3, 
        p: 2, 
        backgroundColor: '#fafafa',
        borderRadius: 1
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: isExpanded ? 2 : 0,
        pb: isExpanded ? 1 : 0,
        borderBottom: isExpanded ? '1px solid #e0e0e0' : 'none'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <InfoIcon sx={{ mr: 1, color: '#1976d2' }} />
          <Typography variant="h6" sx={{ color: '#1976d2', flexGrow: 1 }}>
            Rule Summary
          </Typography>
          
          {/* שדה חיפוש מוצג רק כאשר תוכן מורחב */}
          {isExpanded && (
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search conditions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
                ml: 2, 
                flexGrow: 1,
                '& .MuiOutlinedInput-root': { 
                  height: '40px',
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <Tooltip title="Clear search">
                      <IconButton 
                        size="small" 
                        edge="end" 
                        onClick={handleClearSearch}
                      >
                        <ClearIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
          )}
        </Box>
        
        <Tooltip title={isExpanded ? "Collapse details" : "Expand details"}>
          <IconButton onClick={() => setIsExpanded(!isExpanded)} size="small">
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* תצוגת תקציר במצב מכווץ */}
      {!isExpanded && (
        <Box sx={{ mt: 1 }}>
          {ruleDetailedDescription && (
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#1976d2', 
                fontStyle: 'italic',
                mb: 1,
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {ruleDetailedDescription}
            </Typography>
          )}
          
          {/* התקציר בצורת chips */}
          <Box sx={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1
          }}>
            {conditionsSummary.map((condition, idx) => (
              <Chip
                key={idx}
                label={`${condition.type}: ${condition.count}`}
                size="small"
                sx={{
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  fontWeight: 500
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {isExpanded && ruleDetailedDescription && (
        <Box sx={{ 
          backgroundColor: '#e6f2ff', 
          p: 2, 
          borderRadius: 1,
          mb: 2
        }}>
          <Typography variant="body2" sx={{ color: '#1976d2' }}>
            {formatRuleDescription(ruleDetailedDescription)}
          </Typography>
        </Box>
      )}

      <Collapse in={isExpanded}>
        {filteredConditions.length > 0 ? (
          filteredConditions.map((condition, index) => {
            const description = conditions.length > 0 
              ? getConditionDescription(condition) 
              : condition;
            
            return (
              <React.Fragment key={index}>
                <Box sx={{ ml: 1, mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: '#2c3e50', fontWeight: 500 }}>
                    {description.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', ml: 2 }}>
                    <ArrowRightIcon sx={{ color: '#1976d2', fontSize: 20, mt: 0.5 }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: '#34495e' }}>
                        {description.description}
                      </Typography>
                      
                      {/* הצגת תנאי הפילטר בצורה מודגשת אם קיים */}
                      {description.filterDisplay && (
                        <Box
                          component="div"
                          sx={{
                            mt: 0.5,
                            mb: 0.5,
                            fontWeight: 'bold',
                            color: '#d32f2f',
                            backgroundColor: '#ffebee',
                            p: '2px 6px',
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}
                        >
                          WITH FILTER CONDITION: {description.filterDisplay}
                        </Box>
                      )}
                      
                      {description.example && (
                        <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                          {description.example}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>

                {index < filteredConditions.length - 1 && conditions.length > 0 && (
                  <Box sx={{ 
                    my: 1, 
                    py: 0.5, 
                    px: 2, 
                    bgcolor: condition.connector === 'AND' ? '#e8f5e9' : '#fbe9e7',
                    borderRadius: 1,
                    width: 'fit-content',
                    mx: 'auto'
                  }}>
                    <Typography sx={{ 
                      fontWeight: 'bold',
                      color: condition.connector === 'AND' ? '#2e7d32' : '#d84315',
                      fontSize: '0.875rem'
                    }}>
                      {condition.connector || 'AND'}
                    </Typography>
                  </Box>
                )}
              </React.Fragment>
            );
          })
        ) : (
          <Typography 
            variant="body2" 
            color="textSecondary" 
            sx={{ 
              textAlign: 'center', 
              p: 2,
              fontStyle: 'italic'
            }}
          >
            No conditions match your search
          </Typography>
        )}
      </Collapse>
    </Paper>
  );
};

export default RuleDescription;
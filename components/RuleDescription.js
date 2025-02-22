import React, { useState, useMemo } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Collapse, 
  IconButton, 
  TextField,
  InputAdornment,
  Tooltip
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

const RuleDescription = ({ conditions = [] }) => {
  const [isExpanded, setIsExpanded] = useState(true);
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
      default:
        return {
          title: 'Custom Condition',
          description: `Unique condition on field: "${condition.field}"`,
          example: 'Advanced filtering method',
          searchKeywords: ['custom', 'unique', 'advanced']
        };
    }
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
        mb: 2,
        pb: 1,
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <InfoIcon sx={{ mr: 1, color: '#1976d2' }} />
          <Typography variant="h6" sx={{ color: '#1976d2', flexGrow: 1 }}>
            Rule Summary
          </Typography>
          
          {/* שדה חיפוש משופר */}
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
        </Box>
        
        <Tooltip title={isExpanded ? "Collapse details" : "Expand details"}>
          <IconButton onClick={() => setIsExpanded(!isExpanded)} size="small">
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {ruleDetailedDescription && (
        <Box sx={{ 
          backgroundColor: '#e6f2ff', 
          p: 2, 
          borderRadius: 1,
          mb: 2
        }}>
          <Typography variant="body2" sx={{ color: '#1976d2' }}>
            {ruleDetailedDescription}
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
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                    <ArrowRightIcon sx={{ color: '#1976d2', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: '#34495e' }}>
                      {description.description}
                    </Typography>
                  </Box>
                  {description.example && (
                    <Typography variant="caption" sx={{ ml: 4, color: '#666', display: 'block' }}>
                      {description.example}
                    </Typography>
                  )}
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
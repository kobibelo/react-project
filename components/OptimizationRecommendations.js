// components/OptimizationRecommendations.js - עדכון סגנון
import React, { useState } from 'react';
import { Box, Typography, Divider, Grid, Collapse, IconButton, Tooltip, Chip, Paper } from '@mui/material';
import { TrendingUp, ExpandLess, ExpandMore, Warning, CheckCircle, Error, Info } from '@mui/icons-material';

// Optimization recommendations component with collapsible functionality and summary
function OptimizationRecommendations({ optimizationData }) {
  const [isExpanded, setIsExpanded] = useState(false); // ברירת מחדל - מכווץ

  if (!optimizationData) return null;

  // קביעת אייקון לרמת הסיכון
  const getRiskIcon = (risk) => {
    switch (risk) {
      case 'Critical': return <Error fontSize="small" sx={{ color: '#d32f2f' }} />;
      case 'High': return <Warning fontSize="small" sx={{ color: '#f44336' }} />;
      case 'Medium': return <Info fontSize="small" sx={{ color: '#ff9800' }} />;
      case 'Low': return <CheckCircle fontSize="small" sx={{ color: '#4caf50' }} />;
      default: return <Info fontSize="small" sx={{ color: '#757575' }} />;
    }
  };

  // קביעת צבע לרמת האימפקט
  const getImpactColor = (percentage) => {
    const percent = parseFloat(percentage);
    if (percent >= 50) return '#d32f2f';
    if (percent >= 30) return '#ff9800';
    if (percent >= 15) return '#2196f3';
    return '#4caf50';
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        mt: 2, 
        mb: 3, 
        p: 2, 
        backgroundColor: '#fafafa',
        borderRadius: 1, 
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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TrendingUp sx={{ color: '#1976d2', mr: 1 }} />
          <Typography variant="h6" sx={{ color: '#1976d2' }}>
            RULE OPTIMIZATION
          </Typography>
        </Box>
        
        <Tooltip title={isExpanded ? "Collapse details" : "Expand details"}>
          <IconButton onClick={() => setIsExpanded(!isExpanded)} size="small">
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* תקציר שמוצג כאשר הרכיב מכווץ */}
      {!isExpanded && (
        <Box sx={{ 
          mt: 1, 
          display: 'flex', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Chip
            icon={getRiskIcon(optimizationData.businessRisk)}
            label={`Risk: ${optimizationData.businessRisk}`}
            size="small"
            sx={{
              fontWeight: 'bold',
              backgroundColor: optimizationData.businessRisk === 'Critical' ? '#ffebee' :
                               optimizationData.businessRisk === 'High' ? '#fff3e0' :
                               optimizationData.businessRisk === 'Medium' ? '#e3f2fd' : '#e8f5e9'
            }}
          />
          
          <Chip
            icon={<TrendingUp fontSize="small" />}
            label={`Impact: ${optimizationData.quantitativeImpact.impactPercentage}%`}
            size="small"
            sx={{
              fontWeight: 'bold',
              color: getImpactColor(optimizationData.quantitativeImpact.impactPercentage),
              backgroundColor: '#f5f5f5'
            }}
          />
          
          <Typography variant="body2" sx={{ 
            color: '#1976d2', 
            fontStyle: 'italic',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {optimizationData.recommendations[0]}
            {optimizationData.recommendations.length > 1 && '...'}
          </Typography>
        </Box>
      )}
      
      <Collapse in={isExpanded}>
        {/* כשהקומפוננטה מורחבת, תוכן דומה למה שהיה קודם אבל עם סגנון עקבי יותר */}
        {isExpanded && (
          <Box sx={{ 
            backgroundColor: '#e6f2ff', 
            p: 2, 
            borderRadius: 1,
            mb: 2
          }}>
            <Typography variant="body2" sx={{ color: '#1976d2' }}>
              Optimization analysis for this rule based on {optimizationData.quantitativeImpact.matchingRecords} matching records out of {optimizationData.quantitativeImpact.totalRecords} total ({optimizationData.quantitativeImpact.impactPercentage}% impact).
            </Typography>
          </Box>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                Quantitative Impact
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography>Matching Records:</Typography>
                <Typography fontWeight="bold">
                  {optimizationData.quantitativeImpact.matchingRecords} / {optimizationData.quantitativeImpact.totalRecords}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography>Impact Percentage:</Typography>
                <Typography 
                  fontWeight="bold"
                  color={getImpactColor(optimizationData.quantitativeImpact.impactPercentage)}
                >
                  {optimizationData.quantitativeImpact.impactPercentage}%
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Risk Assessment
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography>Business Risk Level:</Typography>
                <Typography 
                  fontWeight="bold"
                  color={
                    optimizationData.businessRisk === 'Critical' ? 'error.main' :
                    optimizationData.businessRisk === 'High' ? 'warning.main' :
                    optimizationData.businessRisk === 'Medium' ? 'info.main' :
                    'success.main'
                  }
                >
                  {optimizationData.businessRisk}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Optimization Recommendations
            </Typography>
            
            <Box component="ul" sx={{ pl: 2, mt: 1 }}>
              {optimizationData.recommendations.map((recommendation, index) => (
                <Box component="li" key={index} sx={{ mb: 1 }}>
                  <Typography>{recommendation}</Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
}

export default OptimizationRecommendations;
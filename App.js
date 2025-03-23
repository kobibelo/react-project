import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Menu, MenuItem } from '@mui/material';
import MappingList from './MappingList';
import Mapping from './ImprovedMapping';
import Setting from './Setting';
import Show from './Show';
import AddRule from './AddRule';
import RulesList from './RulesList';
import { LinkedFieldsProvider, useLinkedFields } from './contexts/LinkedFieldsContext';



function App() {
  return (
    <LinkedFieldsProvider>
      <Router>
        <AppBar position="static" style={{ backgroundColor: '#3f51b5' }}>
          <Toolbar style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Navigation />
            <Typography
              variant="h4"
              component="div"
              style={{
                fontWeight: 'bold',
                letterSpacing: '2px',
                color: '#ffffff',
              }}
            >
              GENERIC MONITOR
            </Typography>
          </Toolbar>
        </AppBar>

        <Routes>
          <Route path="/mapping/list" element={<MappingList />} />
          <Route path="/mapping/add" element={<Mapping />} />
          {/* הוספת ניתוב חדש לעריכת מיפוי */}
          <Route path="/mapping/edit/:id" element={<Mapping />} />

          <Route path="/preview/setting" element={<Setting />} />
          <Route path="/preview/show" element={<Show />} />
          <Route path="/preview" element={<PreviewMenu />} />

          <Route path="/rules/add" element={<AddRule />} />
          <Route path="/rules/list" element={<RulesList />} />
          <Route path="/rules/update/:ruleId" element={<AddRule />} />

          <Route path="/users" element={<div>Users Page</div>} />
          <Route path="/about" element={<div>About Page</div>} />
        </Routes>
      </Router>
    </LinkedFieldsProvider>
  );
}

function Navigation() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [rulesAnchorEl, setRulesAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleRulesMenuClick = (event) => {
    setRulesAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setRulesAnchorEl(null);
  };

  return (
    <div>
      <Button color="inherit" onClick={handleMenuClick}>
        Mapping
      </Button>
      <Button color="inherit" onClick={handleRulesMenuClick}>
        Rules
      </Button>
      <Button color="inherit" component={Link} to="/preview">
        Preview
      </Button>
      <Button color="inherit" component={Link} to="/users">
        Users
      </Button>
      <Button color="inherit" component={Link} to="/about">
        About
      </Button>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose} component={Link} to="/mapping/add">
          Add New Mapping
        </MenuItem>
        <MenuItem onClick={handleMenuClose} component={Link} to="/mapping/list">
          Mapping List
        </MenuItem>
      </Menu>

      <Menu anchorEl={rulesAnchorEl} open={Boolean(rulesAnchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose} component={Link} to="/rules/add">
          Add Rule
        </MenuItem>
        <MenuItem onClick={handleMenuClose} component={Link} to="/rules/list">
          Rules List
        </MenuItem>
      </Menu>
    </div>
  );
}

function PreviewMenu() {
  return (
    <div>
      <h2>Preview</h2>
      <Button color="primary" component={Link} to="/preview/setting">
        Setting
      </Button>
      <Button color="primary" component={Link} to="/preview/show">
        Show
      </Button>
    </div>
  );
}

export default App;
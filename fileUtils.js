// fileUtils.js

/* eslint-disable no-undef */

export const getFileNameAndExt = (filename) => {
    if (!filename || typeof filename !== 'string') {
        console.log('Invalid filename:', filename);
        return [null, null];
    }
    
    filename = filename.trim();
    const lastDotIndex = filename.lastIndexOf('.');
    
    if (lastDotIndex === -1) {
        console.log('No extension found in:', filename);
        return [filename.toLowerCase(), ''];
    }
    
    const name = filename.substring(0, lastDotIndex).toLowerCase();
    const ext = filename.substring(lastDotIndex + 1).toLowerCase();
    
    return [name, ext];
};

function getBaseFileName(fileName) {
    if (!fileName) return '';
    return fileName.split('.')[0].toLowerCase();
}

function getFileExtension(fileName) {
    if (!fileName) return '';
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

const findDuplicates = (records, fields) => {
    const keyMap = new Map();
    const duplicates = new Set();

    records.forEach((record, index) => {
        // יצירת מפתח מהשדות שנבחרו
        const key = fields.map(field => record[field]).join('|');
        
        if (keyMap.has(key)) {
            duplicates.add(index);
            duplicates.add(keyMap.get(key));
        } else {
            keyMap.set(key, index);
        }
    });

    return duplicates.size;
};

export const calculateConditionMatches = async (condition, records) => {
    console.log('\nCalculating matches for condition:', condition);

    if (condition.comparison === 'same_name_diff_ext') {
        const fields = Array.isArray(condition.field) ? condition.field : [condition.field];
        const matchingRecords = new Set();
        
        records.forEach((record, index) => {
            fields.forEach(field => {
                const baseName = getBaseFileName(record[field]);
                
                records.forEach((otherRecord, otherIndex) => {
                    if (index !== otherIndex) {
                        fields.forEach(otherField => {
                            const otherBaseName = getBaseFileName(otherRecord[otherField]);
                            if (baseName && otherBaseName && baseName === otherBaseName) {
                                const ext = getFileExtension(record[field]);
                                const otherExt = getFileExtension(otherRecord[otherField]);
                                
                                if (ext && otherExt && ext !== otherExt) {
                                    matchingRecords.add(index);
                                    matchingRecords.add(otherIndex);
                                }
                            }
                        });
                    }
                });
            });
        });
        
        console.log(`Found ${matchingRecords.size} records with same name but different extensions`);
        return matchingRecords.size;
    }

    if (condition.comparison === 'same_ext_diff_names') {
        const fields = Array.isArray(condition.field) ? condition.field : [condition.field];
        
        const extensionGroups = {};
        
        records.forEach((record) => {
            fields.forEach(field => {
                const fileName = record[field];
                const [name, ext] = getFileNameAndExt(fileName);
    
                if (!extensionGroups[ext]) {
                    extensionGroups[ext] = new Set();
                }
                extensionGroups[ext].add(name);
            });
        });
    
        const differentNameGroups = Object.entries(extensionGroups)
            .filter(([_, names]) => names.size > 1);
    
        return differentNameGroups.reduce((sum, [_, names]) => sum + names.size, 0);
    }

    if (condition.comparison === 'cross_fields_match') {
        const fields = Array.isArray(condition.field) ? condition.field : [condition.field];
        
        if (fields.length < 2) {
            return 0; // לפחות שני שדות נדרשים
        }
    
        const matchingRecords = new Set();
    
        records.forEach((record, index) => {
            // בדיקת זהות בין כל הצירופים של השדות
            for (let i = 0; i < fields.length; i++) {
                for (let j = i + 1; j < fields.length; j++) {
                    if (record[fields[i]] === record[fields[j]]) {
                        matchingRecords.add(index);
                    }
                }
            }
        });
    
        return matchingRecords.size;
    }  

    if (condition.comparison === 'is_duplicate') {
        const fields = Array.isArray(condition.field) ? condition.field : [condition.field];
        const keyMap = new Map();
        const duplicates = new Set();

        records.forEach((record, index) => {
            const key = fields.map(field => record[field]).join('|');
            
            if (keyMap.has(key)) {
                duplicates.add(index);
                duplicates.add(keyMap.get(key));
            } else {
                keyMap.set(key, index);
            }
        });

        console.log(`Found ${duplicates.size} records with duplicates`);
        return duplicates.size;
    }
    if (condition.comparison === 'fields_equal') {
        const fields = Array.isArray(condition.field) ? condition.field : [];
        
        if (fields.length < 2) {
            return 0;
        }
        
        let matchCount = 0;
        
        records.forEach(record => {
            let isMatch = true;
            
            for (let i = 0; i < fields.length - 1; i += 2) {
                if (i + 1 < fields.length) {
                    if (record[fields[i]] !== record[fields[i+1]]) {
                        isMatch = false;
                        break;
                    }
                }
            }
            
            if (isMatch) {
                matchCount++;
            }
        });
        
        return matchCount;
    }

    if (condition.comparison === 'related_count') {
        // החזר את סך כל רשומות ההיסטוריה במקום רק את מספר הרשומות
        return records.reduce((sum, record) => sum + (parseInt(record.historyCount) || 0), 0);
    }
    // חישוב תנאים רגילים
    return records.filter(record => {
        const fieldValue = String(record[condition.field] || '').toLowerCase();
        const condValue = String(condition.value || '').toLowerCase();
        
        let matches = false;
        switch (condition.comparison) {
            case 'is_contain': matches = fieldValue.includes(condValue); break;
            case 'not_contain': matches = !fieldValue.includes(condValue); break;
            case 'equal': matches = fieldValue === condValue; break;
            case 'not_equal': matches = fieldValue !== condValue; break;
            case 'is_higher': matches = Number(fieldValue) > Number(condValue); break;
            case 'is_lower': matches = Number(fieldValue) < Number(condValue); break;
        }
        return matches;
    }).length;
};

export const calculateSameExtDifferentNames = (records, fields) => {
    const extensionGroups = {};

    records.forEach((record) => {
        fields.forEach((field) => {
            const fileName = record[field];
            const [name, ext] = getFileNameAndExt(fileName);

            if (!extensionGroups[ext]) {
                extensionGroups[ext] = new Set();
            }
            extensionGroups[ext].add(name);
        });
    });

    const differentNameResults = Object.entries(extensionGroups)
        .filter(([_, names]) => names.size > 1)
        .map(([ext, names]) => ({
            extension: ext,
            nameCount: names.size,
            names: Array.from(names)
        }));

    return differentNameResults.length;
};

export const showQueryResults = async (result, queryData) => {
    if (!result) {
        console.error('Result object is undefined');
        return;
    }
    if (!result.records) {
        console.error('No records provided');
        return;
    }

    // בדיקה אם יש תכונת related_count בלפחות רשומה אחת
    const hasRelatedCounts = result.records.some(record => 'related_count' in record);

    // פתיחת חלון חדש להצגת התוצאות - חשוב לפתוח את החלון לפני שמשתמשים בו
    const newWindow = window.open('', '', 'width=1000,height=800');

    // חישוב קבוצות עבור כל התנאים
    const conditionGroupSummaries = await Promise.all(
        queryData.conditions.map(async (condition) => {

            // תנאי כפילויות
            if (condition.comparison === 'is_duplicate') {
                const fields = Array.isArray(condition.field) ? condition.field : [condition.field];
                const groups = {};
                
                result.records.forEach(record => {
                    const key = fields.map(field => record[field]).join('|');
                    
                    if (!groups[key]) {
                        groups[key] = {
                            fields: fields.map(field => ({
                                name: field,
                                value: record[field]
                            })),
                            records: []
                        };
                    }
                    groups[key].records.push(record);
                });

                return {
                    type: 'duplicate',
                    comparison: condition.comparison,
                    groups: Object.values(groups)
                        .filter(group => group.records.length > 1)
                        .map(group => ({
                            fields: group.fields,
                            count: group.records.length
                        }))
                };
            }

            // תנאי Same Extension, Different Names - חדש
            if (condition.comparison === 'same_ext_diff_names') {
                const extensionGroups = {};
                
                result.records.forEach((record) => {
                    const fileName = record[condition.field];
                    const [name, ext] = getFileNameAndExt(fileName);

                    if (!extensionGroups[ext]) {
                        extensionGroups[ext] = new Set();
                    }
                    extensionGroups[ext].add(name);
                });

                return {
                    type: 'sameExtDiffNames',
                    comparison: condition.comparison,
                    groups: Object.entries(extensionGroups)
                        .filter(([_, names]) => names.size > 1)
                        .map(([ext, names]) => ({
                            extension: ext,
                            names: Array.from(names),
                            count: names.size
                        }))
                };
            }

            if (condition.comparison === 'related_count') {
                // בדיקה אם יש קבוצות מוכנות מהשרת
                if (result.relatedGroups && Array.isArray(result.relatedGroups) && result.relatedGroups.length > 0) {
                    // השתמש בקבוצות המוכנות מהשרת
                    return {
                        type: 'related_count',
                        comparison: condition.comparison,
                        groups: result.relatedGroups.map(group => ({
                            name: group.name || 0,  // מספר הרשומות המקושרות
                            count: group.count || 0  // מספר הרשומות בקבוצה
                        }))
                    };
                }
                            
                // אם אין קבוצות מוכנות, נחשב אותן כאן
                const relatedTable = condition.relatedTable;
                const selectedColumns = condition.selectedRelatedColumns || [];
                const localField = Array.isArray(condition.field) ? condition.field[0] : condition.field;
                const foreignField = condition.relatedField;
            
                const groups = {};
                
                result.records.forEach(record => {
                    const historyCount = record.historyCount || 0;
                    const key = `${historyCount} related records`;
                    
                    if (!groups[key]) {
                        groups[key] = {
                            count: historyCount,
                            records: []
                        };
                    }
                    groups[key].records.push(record);
                });
            
                return {
                    type: 'related_count',
                    comparison: condition.comparison,
                    groups: Object.values(groups)
                        .map(group => ({
                            name: group.count,
                            count: group.records.length
                        }))
                };
            }

            // תנאים אחרים
            const groupedCondition = result.records.reduce((acc, record) => {
                const fieldValue = String(record[condition.field] || '').toLowerCase();
                const condValue = String(condition.value || '').toLowerCase();
                
                let matches = false;
                switch (condition.comparison) {
                    case 'is_contain': matches = fieldValue.includes(condValue); break;
                    case 'not_contain': matches = !fieldValue.includes(condValue); break;
                    case 'equal': matches = fieldValue === condValue; break;
                    case 'not_equal': matches = fieldValue !== condValue; break;
                    case 'is_higher': matches = Number(fieldValue) > Number(condValue); break;
                    case 'is_lower': matches = Number(fieldValue) < Number(condValue); break;
                }
                
                if (matches) {
                    if (!acc[fieldValue]) {
                        acc[fieldValue] = [];
                    }
                    acc[fieldValue].push(record);
                }
                
                return acc;
            }, {});

            return {
                type: 'generic',
                comparison: condition.comparison,
                groups: Object.entries(groupedCondition)
                    .filter(([_, records]) => records.length > 0)
                    .map(([key, records]) => ({
                        name: key,
                        count: records.length
                    }))
            };
        })
    );

    const conditionCounts = await Promise.all(
        queryData.conditions.map(async (cond) => {
            const count = await calculateConditionMatches(cond, result.records);
            return { condition: cond, count };
        })
    );

    // כתיבת ה-HTML לחלון החדש
    newWindow.document.write(`
        <html>
        <head>
            <title>Query Results</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    padding: 20px; 
                    background-color: #f5f5f5;
                }
                h1 { 
                    color: #2196F3; 
                    border-bottom: 2px solid #2196F3;
                    padding-bottom: 10px;
                }
                .result-info { 
                    background-color: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .conditions-box { 
                    background-color: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .condition-item { 
                    background-color: #f8f9fa;
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 4px;
                    border-left: 4px solid #2196F3;
                }
                .matching-count { 
                    display: inline-block;
                    background-color: #2196F3;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    margin-left: 10px;
                }
                .connector { 
                    text-align: center;
                    font-weight: bold;
                    color: #666;
                    margin: 10px 0;
                }
                .collapsible {
                    cursor: pointer;
                    background-color: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 5px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .collapsible:hover {
                    background-color: #f0f0f0;
                }
                .collapse-content {
                    display: none;
                    background-color: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .arrow {
                    display: inline-block;
                    transition: transform 0.3s;
                }
                .arrow.rotated {
                    transform: rotate(180deg);
                }
                .file-group {
                    background-color: #f8f9fa;
                    padding: 10px;
                    margin: 5px 0;
                    border-radius: 4px;
                }
                table { 
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    background-color: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                th, td { 
                    padding: 12px;
                    text-align: left;
                    border: 1px solid #ddd;
                }
                th { 
                    background-color: #2196F3;
                    color: white;
                }
                tr:nth-child(even) { 
                    background-color: #f8f9fa;
                }
                .highlight-count {
                    background-color: #e3f2fd;
                    font-weight: bold;
                    color: #0d47a1;
                }
                .summary-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }
                .summary-stats > div {
                    background-color: #e3f2fd;
                    padding: 10px;
                    border-radius: 8px;
                    text-align: center;
                }
                .count-groups {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 10px;
                    margin-top: 15px;
                }
                .count-group {
                    background-color: #f5f5f5;
                    padding: 8px;
                    border-radius: 4px;
                    text-align: center;
                }
            </style>
            <script>
                function toggleCollapse(elementId) {
                    const content = document.getElementById(elementId);
                    const arrow = document.getElementById(elementId + '-arrow');
                    const currentDisplay = window.getComputedStyle(content).display;
                    
                    if (currentDisplay === 'none') {
                        content.style.display = 'block';
                        arrow.classList.add('rotated');
                    } else {
                        content.style.display = 'none';
                        arrow.classList.remove('rotated');
                    }
                }
            </script>
        </head>
        <body>
            <h1>Query Results</h1>
            <div class="result-info">
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="border: 1px solid #e0e0e0; padding: 10px; border-radius: 8px;">
                        <h3 style="margin-top: 0; color: #1976d2; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px;">Main Query</h3>
                        <p><strong>Records matching the query:</strong> ${result.records.length} / ${result.totalRecords || 'N/A'}</p>
                        <p><strong>Table Name:</strong> ${queryData.selectedTable}</p>
                    </div>
                    
                    ${result.relatedTable ? `
                    <div style="border: 1px solid #e0e0e0; padding: 10px; border-radius: 8px;">
                        <h3 style="margin-top: 0; color: #1976d2; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px;">Related Records</h3>
                        <p><strong>Records matching the query:</strong> ${result.totalHistoryRecords || 0} / ${result.totalRelatedRecords || 'N/A'}</p>
                        <p><strong>Table Name:</strong> ${result.relatedTable}</p>
                    </div>
                    ` : ''}
                </div>
                <p><strong>Query executed at:</strong> ${new Date().toLocaleString()}</p>
            </div>

            ${conditionGroupSummaries.map((summary, index) => 
                summary.groups && summary.groups.length > 0 ? `
                    <div class="collapsible" onclick="toggleCollapse('summary-section-${index}')">
                        <h3 style="margin: 0;">
                            ${summary.type === 'duplicate' ? 
                                `Duplicate Groups (${summary.groups.length} groups found)` :
                             summary.type === 'sameName' ? 
                                `Files with Same Name but Different Extensions (${summary.groups.length} groups found)` :
                             summary.type === 'sameExtDiffNames' ?
                                `Files with Same Extension but Different Names (${summary.groups.length} groups found)` :
                             summary.type === 'related_count' ?
                                `Related Records Groups (${summary.groups.length} groups found)` :
                                `Condition Groups (${summary.groups.length} groups found)`}
                        </h3>
                        <span id="summary-section-${index}-arrow" class="arrow">▼</span>
                    </div>
                    <div id="summary-section-${index}" class="collapse-content">
                        ${summary.type === 'duplicate' ? 
                            summary.groups.map(group => `
                                <div class="file-group">
                                    ${group.fields.map(field => `
                                        <strong>${field.name}:</strong> ${field.value}<br>
                                    `).join('')}
                                    <strong>Number of Records:</strong> ${group.count}
                                </div>
                            `).join('') :
                         summary.type === 'sameName' ?
                            summary.groups.map(group => `
                                <div class="file-group">
                                    <strong>Base Name:</strong> ${group.name}
                                    <br>
                                    <strong>Extensions:</strong> ${group.extensions.join(', ')}
                                </div>
                            `).join('') :
                         summary.type === 'sameExtDiffNames' ?
                            summary.groups.map(group => `
                                <div class="file-group">
                                    <strong>Extension:</strong> ${group.extension}
                                    <br>
                                    <strong>Names:</strong> ${group.names.join(', ')}
                                    <br>
                                    <strong>Count:</strong> ${group.count}
                                </div>
                            `).join('') :
                         summary.type === 'related_count' ?
                            summary.groups.map(group => `
                                <div class="file-group">
                                    <strong>Related Records Count:</strong> ${group.name}
                                    <br>
                                    <strong>Number of Records:</strong> ${group.count}
                                </div>
                            `).join('') :
                            summary.groups.map(group => `
                                <div class="file-group">
                                    <strong>Group:</strong> ${group.name}
                                    <br>
                                    <strong>Number of Records:</strong> ${group.count}
                                </div>
                            `).join('')}
                    </div>
                ` : ''
            ).join('')}

            <div class="conditions-box">
                <h3>Applied Conditions:</h3>
                ${conditionCounts.map((item, index) => `
                    <div class="condition-item">
                        ${index + 1}. <strong>${Array.isArray(item.condition.field) ? item.condition.field.join(',') : item.condition.field}</strong> 
                        ${item.condition.comparison} 
                        ${item.condition.comparison === 'same_name_diff_ext' ? '(Same name, different extension)' : 
                          item.condition.comparison === 'is_duplicate' ? '(Duplicate Check)' : 
                          item.condition.comparison === 'same_ext_diff_names' ? '(Same extension, different names)' :
                          item.condition.comparison === 'fields_equal' ? 
                                    (Array.isArray(item.condition.field) && item.condition.field.length >= 2 ? 
                                        '(' + Array.from({ length: Math.floor(item.condition.field.length / 2) }, (_, i) => 
                                            `${item.condition.field[i*2]} = ${item.condition.field[i*2+1]}`
                                        ).join(' AND ') + ')' : 
                                    '') :
                          item.condition.comparison === 'related_count' ?
                                    `(Count related records from ${item.condition.relatedTable}.${item.condition.relatedField}, min: ${item.condition.value || '1'})` :
                                `'${item.condition.value}'`}
                                <span class="matching-count">${item.count} records</span>
                            </div>
                            ${item.condition.connector && index < conditionCounts.length - 1 
                                ? `<div class="connector">${item.condition.connector}</div>`
                                : ''}`
                        ).join('')}
            </div>

            ${result.records.length > 0 ? `
                <table>
                    <tr>
                        ${Object.keys(result.records[0])
                            .map(key => `<th>${key}</th>`)
                            .join('')}
                    </tr>
                    ${result.records.map(row => `
                        <tr>
                            ${Object.entries(row).map(([key, value]) => 
                                key === 'related_count' ? 
                                    `<td class="${parseInt(value) > 0 ? 'highlight-count' : ''}">${value}</td>` :
                                    `<td>${value}</td>`
                            ).join('')}
                        </tr>
                    `).join('')}
                </table>
            ` : '<p>No records found.</p>'}

            ${hasRelatedCounts && result.relatedTable ? `
                <div class="collapsible" onclick="toggleCollapse('related-counts-summary')">
                    <h3 style="margin: 0;">Related Records Summary</h3>
                    <span id="related-counts-summary-arrow" class="arrow">▼</span>
                </div>
                <div id="related-counts-summary" class="collapse-content">
                    <p>Showing counts from table <strong>${result.relatedTable}</strong> where field <strong>${result.relatedField}</strong> matches <strong>${result.localField}</strong> in the main table.</p>
                    
                    <div class="summary-stats">
                        <div>
                            <strong>Total Records:</strong> ${result.records.length}
                        </div>
                        <div>
                            <strong>Records with Related Entries:</strong> ${result.records.filter(r => parseInt(r.related_count) > 0).length}
                        </div>
                        <div>
                            <strong>Total Related Records:</strong> ${result.records.reduce((sum, r) => sum + parseInt(r.related_count || 0), 0)}
                        </div>
                        <div>
                            <strong>Average per Record:</strong> ${(result.records.reduce((sum, r) => sum + parseInt(r.related_count || 0), 0) / result.records.length).toFixed(2)}
                        </div>
                    </div>
                    
                    <h4>Records by Count:</h4>
                    <div class="count-groups">
                        ${Object.entries(result.records.reduce((groups, record) => {
                            const count = parseInt(record.related_count || 0);
                            if (!groups[count]) groups[count] = 0;
                            groups[count]++;
                            return groups;
                        }, {})).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([count, number]) => `
                            <div class="count-group">
                                <strong>${count} related records:</strong> ${number} main records
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </body>
        </html>
    `);

    newWindow.onload = function() {
        const summaryContents = newWindow.document.querySelectorAll('.collapse-content');
        summaryContents.forEach(content => {
            content.style.display = 'none';
        });
    };
};
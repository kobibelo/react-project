// fileUtils.js

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

export const showQueryResults = async (result, queryData) => {
    if (!result?.records) {
        console.error('No records provided');
        return;
    }

    // חישוב קבוצות עבור כל התנאים
    const conditionGroupSummaries = await Promise.all(
        queryData.conditions.map(async (condition) => {
            // תנאי שם קבצים זהה עם סיומות שונות
            if (condition.comparison === 'same_name_diff_ext') {
                const fileGroups = {};
                result.records.forEach(record => {
                    const [name1, ext1] = getFileNameAndExt(record.NameFile1 || '');
                    const [name2, ext2] = getFileNameAndExt(record.NameFile2 || '');
                    
                    if (name1 === name2 && ext1 !== ext2) {
                        if (!fileGroups[name1]) {
                            fileGroups[name1] = new Set();
                        }
                        fileGroups[name1].add(ext1);
                        fileGroups[name1].add(ext2);
                    }
                });

                return {
                    type: 'sameName',
                    comparison: condition.comparison,
                    groups: Object.entries(fileGroups)
                        .filter(([_, extensions]) => extensions.size > 1)
                        .map(([name, extensions]) => ({
                            name,
                            extensions: Array.from(extensions)
                        }))
                };
            }

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

    const newWindow = window.open('', '', 'width=1000,height=800');
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
                <p><strong>Records matching the query:</strong> ${result.records.length} / ${result.totalRecords || 'N/A'}</p>
                <p><strong>Query executed at:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Table Name:</strong> ${queryData.selectedTable}</p>
            </div>

            ${conditionGroupSummaries.map((summary, index) => 
                summary.groups.length > 0 ? `
                    <div class="collapsible" onclick="toggleCollapse('summary-section-${index}')">
                        <h3 style="margin: 0;">
                            ${summary.type === 'duplicate' ? 
                                `Duplicate Groups (${summary.groups.length} groups found)` :
                             summary.type === 'sameName' ? 
                                `Files with Same Name but Different Extensions (${summary.groups.length} groups found)` :
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
                          `'${item.condition.value}'`}
                        <span class="matching-count">${item.count} records</span>
                    </div>
                    ${item.condition.connector && index < conditionCounts.length - 1 
                        ? `<div class="connector">${item.condition.connector}</div>`
                        : ''}`
                ).join('')}
            </div>

            ${result.records.length > 0 
                ? `<table>
                    <tr>${Object.keys(result.records[0]).map(key => `<th>${key}</th>`).join('')}</tr>
                    ${result.records.map(row => `
                        <tr>${Object.values(row).map(value => `<td>${value}</td>`).join('')}</tr>
                    `).join('')}
                  </table>`
                : '<p>No records found.</p>'
            }
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
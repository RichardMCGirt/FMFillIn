document.addEventListener('DOMContentLoaded', function () {
    const airtableApiKey = 'patTGK9HVgF4n1zqK.cbc0a103ecf709818f4cd9a37e18ff5f68c7c17f893085497663b12f2c600054';
    const airtableBaseId = 'appeNSp44fJ8QYeY5';
    const airtableTableName = 'tblRp5bukUiw9tX9j';

    const loadingLogo = document.querySelector('.loading-logo');
    const loadingContainer = document.getElementById('loading-container');
    const mainContent = document.getElementById('main-content');

    async function fetchData(offset = null) {
        let url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}?filterByFormula=Status='Pending'`;
        if (offset) {
            url += `&offset=${offset}`;
        }

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${airtableApiKey}`
            }
        });

        if (!response.ok) {
            console.error('Error fetching data from Airtable:', response.statusText);
            return { records: [] };
        }

        const data = await response.json();
        return data;
    }

    async function displayData(records) {
        const tbody = document.getElementById('airtable-data').querySelector('tbody');
        tbody.innerHTML = ''; // Clear existing data

        records.forEach(record => {
            const fields = record.fields;
            const jobName = fields['Job Name'] || 'N/A';
            const customer = fields['Customer'] || 'N/A';
            const fieldManager = fields['FeildManager'] || 'N/A';
            const materialsNeeded = fields['Materials Needed'] || 'N/A';
            const status = fields['Status'] || 'N/A';
            const branch = fields['VanirOffice'] || 'N/A';

            const tr = document.createElement('tr');

            const fieldsToDisplay = [
                { field: 'VanirOffice', value: branch },
                { field: 'Customer', value: customer },
                { field: 'Job Name', value: jobName },
                { field: 'FieldManager', value: fieldManager },
                { field: 'Status', value: status },
                { field: 'Materials Needed', value: materialsNeeded, editable: true },
            ];

            fieldsToDisplay.forEach(({ field, value, editable = false }) => {
                const td = document.createElement('td');
                td.setAttribute('data-id', record.id);
                td.setAttribute('data-field', field);
                td.textContent = value;

                if (editable) {
                    td.setAttribute('contenteditable', 'true');
                    td.addEventListener('input', () => {
                        td.classList.add('edited');
                    });
                }

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });
    }

    async function fetchAllData() {
        if (loadingContainer && mainContent) {
            loadingContainer.style.display = 'flex';
            mainContent.style.display = 'none';
        } else {
            console.error('Loading container or main content is missing in the DOM.');
            return;
        }

        // Show the greyscale logo for 1 second
        setTimeout(() => {
            // Transition to full color over 2 seconds
            loadingLogo.classList.add('full-color');
        }, 1000); // Delay before transitioning to full color

        // After the transition completes, wait 1 second in full color before displaying the content
        setTimeout(async () => {
            let allRecords = [];
            let offset = null;

            do {
                const data = await fetchData(offset);
                allRecords = allRecords.concat(data.records);
                offset = data.offset;
            } while (offset);

            // Sort records alphabetically by Branch
            allRecords.sort((a, b) => {
                const branchA = (a.fields['VanirOffice'] || '').toLowerCase();
                const branchB = (b.fields['VanirOffice'] || '').toLowerCase();
                if (branchA < branchB) return -1;
                if (branchA > branchB) return 1;
                return 0;
            });

            await displayData(allRecords);

            if (loadingContainer && mainContent) {
                loadingContainer.style.display = 'none';
                mainContent.style.display = 'block';
            }
        }, 1500); // 1 second in full color after the transition (2 seconds for transition + 1 second delay)
    }

    async function updateRecord(id, fields) {
        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${id}`;
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${airtableApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields })
        });

        if (!response.ok) {
            console.error('Error updating data in Airtable:', response.statusText);
        }

        return response.json();
    }

    function showToast(message) {
        const toast = document.getElementById("toast");
        toast.innerHTML = message;
        toast.style.visibility = "visible";
        toast.style.opacity = "1"; // Fade in
    
        setTimeout(() => {
            toast.style.opacity = "0"; // Fade out
            setTimeout(() => {
                toast.style.visibility = "hidden";
            }, 500); // Ensure it's hidden after fading out
        }, 3000); // Hide after 3 seconds
    }
    
    document.getElementById('submit-button').addEventListener('click', async () => {
        if (loadingContainer && mainContent) {
            loadingContainer.style.display = 'block';
            mainContent.style.display = 'none';
        }
    
        const tbody = document.getElementById('airtable-data').querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        for (const row of rows) {
            const materialsNeededCell = row.querySelector('[contenteditable="true"]');
            if (materialsNeededCell.classList.contains('edited')) {
                const recordId = materialsNeededCell.dataset.id;
                const newValue = materialsNeededCell.textContent;
                await updateRecord(recordId, { 'Materials Needed': newValue });
                materialsNeededCell.classList.remove('edited');
            }
        }
    
        if (loadingContainer && mainContent) {
            loadingContainer.style.display = 'none';
            mainContent.style.display = 'block';
        }
    
        // Show toast notification
        showToast('Changes submitted successfully!');
    });
    
    

    document.getElementById('search-input').addEventListener('input', function () {
        const searchValue = this.value.toLowerCase();
        const rows = document.querySelectorAll('#airtable-data tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            let match = false;
            cells.forEach(cell => {
                if (cell.textContent.toLowerCase().includes(searchValue)) {
                    match = true;
                }
            });
            row.style.display = match ? '' : 'none';
        });
    });

    fetchAllData();
});

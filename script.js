document.addEventListener('DOMContentLoaded', function () {
    const airtableApiKey = 'patTGK9HVgF4n1zqK.cbc0a103ecf709818f4cd9a37e18ff5f68c7c17f893085497663b12f2c600054';
    const airtableBaseId = 'appeNSp44fJ8QYeY5';
    const airtableTableName = 'tblRp5bukUiw9tX9j';

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

    function displayData(records) {
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
            tr.innerHTML = `
             <td data-id="${record.id}" data-field="VanirOffice">${branch}</td>
                             <td data-id="${record.id}" data-field="Customer">${customer}</td>

                <td data-id="${record.id}" data-field="Job Name">${jobName}</td>
                <td data-id="${record.id}" data-field="FieldManager">${fieldManager}</td>
                <td data-id="${record.id}" data-field="Status">${status}</td>
                                <td contenteditable="true" data-id="${record.id}" data-field="Materials Needed">${materialsNeeded}</td>

               
            `;

            tbody.appendChild(tr);
        });

        // Add event listeners to editable cells
        const editableCells = tbody.querySelectorAll('td[contenteditable="true"]');
        editableCells.forEach(cell => {
            cell.addEventListener('input', () => {
                cell.classList.add('edited');
            });
        });
    }

    async function fetchAllData() {
        document.getElementById('loading-indicator').style.display = 'block';
        document.getElementById('airtable-data').style.display = 'none';
        document.getElementById('submit-button').style.display = 'none';
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

        displayData(allRecords);
        document.getElementById('loading-indicator').style.display = 'none';
        document.getElementById('airtable-data').style.display = 'table';
        document.getElementById('submit-button').style.display = 'block';
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

    document.getElementById('submit-button').addEventListener('click', async () => {
        const confirmSubmit = confirm('Are you sure you want to submit the changes?');
        if (!confirmSubmit) {
            return;
        }

        document.getElementById('loading-indicator').style.display = 'block';
        document.getElementById('airtable-data').style.display = 'none';
        document.getElementById('submit-button').style.display = 'none';

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

        document.getElementById('loading-indicator').style.display = 'none';
        document.getElementById('airtable-data').style.display = 'table';
        document.getElementById('submit-button').style.display = 'block';

        alert('Changes submitted successfully!');
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

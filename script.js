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
            const fieldManager = fields['Field Manager'] || 'N/A';
            const materialsNeeded = fields['Materials Needed'] || 'N/A';
            const status = fields['Status'] || 'N/A';
            const branch = fields['Branch'] || 'N/A';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-id="${record.id}" data-field="Branch">${branch}</td>
                <td data-id="${record.id}" data-field="Customer">${customer}</td>
                <td data-id="${record.id}" data-field="Job Name">${jobName}</td>
                <td data-id="${record.id}" data-field="Field Manager">${fieldManager}</td>
                <td data-id="${record.id}" data-field="Status">${status}</td>
                <td class="materials-needed-column" contenteditable="true" data-id="${record.id}" data-field="Materials Needed">${materialsNeeded}</td>
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
        const loadingLogo = document.querySelector('.loading-logo');
        const mainContent = document.getElementById('main-content');
        document.getElementById('loading-container').style.display = 'flex';
        mainContent.style.display = 'none';

        // Transition to full color after 0.5 seconds
        setTimeout(() => {
            loadingLogo.classList.add('full-color');
        }, 50);

        let allRecords = [];
        let offset = null;
        let totalRecords = 0;
        let loadedRecords = 0;

        do {
            const data = await fetchData(offset);
            allRecords = allRecords.concat(data.records);
            offset = data.offset;

            loadedRecords += data.records.length;
            totalRecords = Math.max(totalRecords, loadedRecords + (offset ? 1 : 0));

        } while (offset);

        displayData(allRecords);

        // Hide the loading container and show the main content
        document.getElementById('loading-container').style.display = 'none';
        mainContent.style.display = 'block';
    }

    fetchAllData();
});
/**
 * Navigation function - switch between pages
 */
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageName).classList.add('active');
    
    // Add active class to nav link
    document.getElementById('nav-' + pageName).classList.add('active');
}

/**
 * Create HTML table from data object
 */
function createTable(dataObj) {
    if (Object.keys(dataObj).length === 0)
        return "<p>Không có dữ liệu</p>";

    let html = "<div class='table-wrapper'><table>";
    html += "<tr><th>Bộ số</th><th>Số lần</th></tr>";

    for (const key in dataObj) {
        html += `<tr><td>${key}</td><td>${dataObj[key]}</td></tr>`;
    }

    html += "</table></div>";
    return html;
}

/**
 * Create frequency table sorted by frequency (descending)
 */
function createFrequencyTable(frequencyObj) {
    if (Object.keys(frequencyObj).length === 0)
        return "<p>Không có dữ liệu</p>";

    let html = "<div class='table-wrapper'><table>";
    html += "<tr><th>Số</th><th>Tần suất</th></tr>";

    // Sort by frequency (descending) then by number (ascending)
    Object.entries(frequencyObj)
        .sort((a, b) => b[1] - a[1] || parseInt(a[0]) - parseInt(b[0]))
        .forEach(([num, freq]) => {
            html += `<tr><td>${num}</td><td>${freq}</td></tr>`;
        });

    html += "</table></div>";
    return html;
}

// Initialize when page loads
window.onload = function() {
    // Load Lotto data
    fetch("lotto.txt")
        .then(response => response.text())
        .then(text => processData(text))
        .catch(err => alert("Không đọc được file Lotto! Hãy chạy bằng http server."));
    
    // Load Mega 6/45 data
    fetch("power645.jsonl")
        .then(response => response.text())
        .then(text => processMegaData(text))
        .catch(err => console.log("Không đọc được file Mega 6/45!"));
};

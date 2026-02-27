// Lotto 6/36 Data
let fullSetCount = {};
let tripleCount = {};
let numberFrequency = {};
let drawHistory = [];

/**
 * Process lotto data from file
 */
function processData(text) {
    const lines = text.trim().split("\n");

    lines.forEach(line => {
        const parts = line.trim().split(" ");
        if (parts.length < 3) return;

        const date = parts[0];
        const drawId = parts[1];
        const numbersPart = parts[2];
        const mainPart = numbersPart.split("|")[0];
        const special = numbersPart.split("|")[1] || "";

        // Extract numbers
        let numbers = [];
        for (let i = 0; i < mainPart.length; i += 2) {
            numbers.push(mainPart.substr(i, 2));
        }
        numbers.sort();

        drawHistory.push({ date, drawId, numbers, special: special });

        // Count full sets
        const fullKey = numbers.join("-");
        fullSetCount[fullKey] = (fullSetCount[fullKey] || 0) + 1;

        // Count individual numbers
        numbers.forEach(num => {
            numberFrequency[num] = (numberFrequency[num] || 0) + 1;
        });

        // Count triples
        for (let i = 0; i < numbers.length; i++) {
            for (let j = i + 1; j < numbers.length; j++) {
                for (let k = j + 1; k < numbers.length; k++) {
                    const triple = [numbers[i], numbers[j], numbers[k]].join("-");
                    tripleCount[triple] = (tripleCount[triple] || 0) + 1;
                }
            }
        }
    });

    displayResults();
}

/**
 * Display analysis results on lotto page
 */
function displayResults() {
    let html = "";

    // Random special numbers section
    html += "<div class='random-numbers-container' id='randomSection'>";
    html += "<h3 style='color: #667eea;'>🎲 Số đặc biệt</h3>";
    html += createRandomNumbersDisplay();
    html += "</div>";

    // Refresh button
    html += "<div style='text-align:center; margin-top:10px;'>" +
            "<button onclick=\"refreshRandomSuggest()\">🔄 Làm mới số</button>" +
            "</div>";

    // Suggested numbers section
    html += "<h2 class='result-heading'>💡 Bộ số chưa từng xuất hiện</h2>";
    html += "<div id='suggestSection'>" + createSuggestTable() + "</div>";

    // Recent results
    const recentDates = getUniqueDates(drawHistory).slice(0, 5);
    html += "<h2 class='result-heading'>📅 Kết quả 5 ngày gần nhất</h2>";
    html += createRecentTable(recentDates);

    // Full sets
    const filteredFull = Object.fromEntries(
        Object.entries(fullSetCount)
            .filter(([k, v]) => v > 1)
            .sort((a, b) => b[1] - a[1])
    );
    html += "<h2 class='result-heading'>Bộ 5 số xuất hiện > 1 lần</h2>";
    html += createTable(filteredFull);

    // Triples
    const filteredTriple = Object.fromEntries(
        Object.entries(tripleCount)
            .filter(([k, v]) => v > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50)
    );
    html += "<h2 class='result-heading'>Top bộ 3 xuất hiện > 1 lần</h2>";
    html += createTable(filteredTriple);

    // Frequency
    html += "<h2 class='result-heading'>Tần suất từng số</h2>";
    html += createTable(
        Object.fromEntries(
            Object.entries(numberFrequency)
                .sort((a, b) => b[1] - a[1])
        )
    );

    document.getElementById("result").innerHTML = html;
}

/**
 * Get unique dates from draw history
 */
function getUniqueDates(history) {
    const dateMap = new Map();
    history.forEach(draw => {
        if (!dateMap.has(draw.date)) {
            dateMap.set(draw.date, []);
        }
        dateMap.get(draw.date).push(draw);
    });
    return Array.from(dateMap.keys());
}

/**
 * Create recent results table
 */
function createRecentTable(dates) {
    let html = "<div class='table-wrapper'><table>";
    html += "<tr><th>Ngày</th><th>Kỳ</th><th>Bộ số</th></tr>";

    dates.forEach(date => {
        const drawsForDate = drawHistory.filter(d => d.date === date);
        drawsForDate.forEach(draw => {
            html += `<tr>
                <td>${draw.date}</td>
                <td>${draw.drawId}</td>
                <td>${draw.numbers.join(" ")} | ${draw.special || "-"}</td>
            </tr>`;
        });
    });

    html += "</table></div>";
    return html;
}

/**
 * Generate random sets that haven't appeared
 */
function generateRandomSets() {
    const existingSets = new Set(Object.keys(fullSetCount));
    const suggestedSets = [];
    
    while (suggestedSets.length < 10) {
        const numbers = [];
        
        // Generate 5 random numbers from 1-35
        while (numbers.length < 5) {
            const num = Math.floor(Math.random() * 35) + 1;
            const numStr = String(num).padStart(2, '0');
            if (!numbers.includes(numStr)) {
                numbers.push(numStr);
            }
        }
        
        numbers.sort();
        const setKey = numbers.join("-");
        
        // Only add if this set has never appeared before
        if (!existingSets.has(setKey)) {
            suggestedSets.push(setKey);
        }
    }
    
    return suggestedSets;
}

/**
 * Generate 3 random special numbers
 */
function generateRandomNumbers() {
    const randomNumbers = [];
    while (randomNumbers.length < 3) {
        const num = Math.floor(Math.random() * 12) + 1;
        if (!randomNumbers.includes(num)) {
            randomNumbers.push(num);
        }
    }
    return randomNumbers;
}

/**
 * Create display for random numbers
 */
function createRandomNumbersDisplay() {
    const numbers = generateRandomNumbers();
    let html = "<div class='random-numbers-display'>";
    
    numbers.forEach(num => {
        html += `<div class='random-number-box'>${String(num).padStart(2, '0')}</div>`;
    });
    
    html += "</div>";
    return html;
}

/**
 * Refresh random suggestions
 */
function refreshRandomSuggest() {
    const randomSection = document.getElementById('randomSection');
    if (randomSection) {
        randomSection.innerHTML = "<h3 style='color: #667eea;'>🎲 Số đặc biệt</h3>" + 
                                   createRandomNumbersDisplay();
    }
    
    const suggestSection = document.getElementById('suggestSection');
    if (suggestSection) {
        suggestSection.innerHTML = createSuggestTable();
    }
}

/**
 * Create suggestion table
 */
function createSuggestTable() {
    const suggestedSets = generateRandomSets();
    
    let html = "<div class='table-wrapper'><table>";
    html += "<tr><th>STT</th><th>Bộ số gợi ý</th></tr>";

    suggestedSets.forEach((set, index) => {
        html += `<tr>
            <td>${index + 1}</td>
            <td>${set}</td>
        </tr>`;
    });

    html += "</table></div>";
    return html;
}

/**
 * Check if a set has appeared in history
 */
function checkSet() {
    const input = document.getElementById("checkInput").value.trim();
    if (!input) return;

    let numbers = input.split(/\s+/);

    if (numbers.length < 3 || numbers.length > 5) {
        showResult("⚠️ Nhập từ 3 đến 5 số!", false);
        return;
    }

    numbers = numbers.map(n => n.padStart(2, '0')).sort();

    let matchedDraws = [];

    drawHistory.forEach(draw => {
        const containsAll = numbers.every(num =>
            draw.numbers.includes(num)
        );
        if (containsAll) matchedDraws.push(draw);
    });

    if (matchedDraws.length > 0) {
        let html = `
        ✅ Tổ hợp <strong>${numbers.join("-")}</strong> xuất hiện 
        <strong>${matchedDraws.length}</strong> kỳ
        <br><br>
        <div class="table-wrapper">
        <table>
        <tr>
            <th>Ngày</th>
            <th>Kỳ</th>
            <th>Bộ số</th>
        </tr>`;

        matchedDraws.forEach(draw => {
            html += `
            <tr>
                <td>${draw.date}</td>
                <td>${draw.drawId}</td>
                <td>${draw.numbers.join(" ")}</td>
            </tr>`;
        });

        html += "</table></div>";
        showResult(html, true);
    } else {
        showResult(
            `❌ Tổ hợp ${numbers.join("-")} chưa từng xuất hiện`,
            false
        );
    }
}

/**
 * Display result with styling
 */
function showResult(content, success) {
    const box = document.getElementById("checkResult");
    box.style.display = "block";
    box.innerHTML = content;

    if (success) {
        box.style.borderLeft = "6px solid #28a745";
    } else {
        box.style.borderLeft = "6px solid #dc3545";
    }
}
